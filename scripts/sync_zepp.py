#!/usr/bin/env python3
"""
sync_zepp.py — porta in Il Geco Zen i dati dell'Amazfit, leggendoli da Zepp.

Gira da solo ogni 6 ore con GitHub Actions (.github/workflows/sync-zepp.yml), gratis.
  • allenamenti (pesi, tapis roulant, cyclette…) con kcal e battiti → users/{uid}/allenamenti_registro
    (si agganciano alla sessione fatta nell'app alla stessa ora; altrimenti diventano sessioni "Dall'orologio")
  • dati del giorno (passi, battiti, sonno, ossigeno, respirazione) → users/{uid}/direction/salute_giorni
Legge Zepp con la libreria open source zepp-mcp (API non ufficiale di Zepp: può cambiare senza preavviso).

SICUREZZA — il servizio NON ha una chiave di amministratore. Accede a Firebase con un utente dedicato
(zepp-sync@…) che le regole di Firestore (firestore.rules) limitano a: leggere/aggiornare il registro degli
allenamenti (solo i campi dell'orologio, niente cancellazioni) e scrivere salute_giorni. Non può leggere né
toccare nient'altro (diario, ricette, contatti, finanze…), nemmeno se i secret venissero rubati.

Secret di GitHub: ZEPP_EMAIL, ZEPP_PASSWORD, ZEPP_SYNC_PASSWORD (password dell'utente dedicato), FIREBASE_UID.
Il repository è pubblico: qui si stampano SOLO conteggi, mai dati di salute né credenziali.
"""
import base64
import json
import os
import re
import sys
import urllib.error
import urllib.parse
import urllib.request
from datetime import date, datetime, timedelta, timezone
from zoneinfo import ZoneInfo

from zepp_mcp import client as api, decode, workouts

TZ = ZoneInfo("Europe/Rome")
DAYS_BACK = int(os.environ.get("ZEPP_DAYS_BACK", "10"))


def log(msg):
    print(msg, flush=True)


# ─── Firestore via REST, con l'utente dedicato (nessuna chiave di amministratore) ──────────
PROJECT = os.environ.get("FIREBASE_PROJECT", "ilgecozen-b2df7")
SYNC_EMAIL = os.environ.get("ZEPP_SYNC_EMAIL", "zepp-sync@ilgecozen-b2df7.firebaseapp.com")
DOCS = f"https://firestore.googleapis.com/v1/projects/{PROJECT}/databases/(default)/documents"


def http(method, url, body=None, token=None):
    req = urllib.request.Request(url, method=method, data=None if body is None else json.dumps(body).encode(),
                                 headers={"Content-Type": "application/json", **({"Authorization": f"Bearer {token}"} if token else {})})
    try:
        with urllib.request.urlopen(req, timeout=30) as r:
            return json.loads(r.read() or b"null")
    except urllib.error.HTTPError as e:
        raise RuntimeError(f"HTTP {e.code} su {method} {urllib.parse.urlsplit(url).path[-60:]}") from None


def enc(v):
    if v is None: return {"nullValue": None}
    if isinstance(v, bool): return {"booleanValue": v}
    if isinstance(v, int): return {"integerValue": str(v)}
    if isinstance(v, float): return {"doubleValue": v}
    if isinstance(v, str): return {"stringValue": v}
    if isinstance(v, list): return {"arrayValue": {"values": [enc(x) for x in v]}}
    if isinstance(v, dict): return {"mapValue": {"fields": {k: enc(x) for k, x in v.items()}}}
    raise TypeError(type(v))


def dec(v):
    k = next(iter(v))
    x = v[k]
    if k == "nullValue": return None
    if k == "integerValue": return int(x)
    if k == "doubleValue": return float(x)
    if k == "arrayValue": return [dec(i) for i in x.get("values", [])]
    if k == "mapValue": return {a: dec(b) for a, b in x.get("fields", {}).items()}
    return x


def sign_in():
    """Accede come utente dedicato. La chiave web di Firebase è pubblica (la serve il sito stesso)."""
    cfg = http("GET", f"https://{PROJECT}.firebaseapp.com/__/firebase/init.json")
    r = http("POST", f"https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key={cfg['apiKey']}",
             {"email": SYNC_EMAIL, "password": os.environ["ZEPP_SYNC_PASSWORD"], "returnSecureToken": True})
    return r["idToken"]


def patch(token, path, fields, mask):
    q = "&".join("updateMask.fieldPaths=" + urllib.parse.quote(m, safe="") for m in mask)
    return http("PATCH", f"{DOCS}/{path}?{q}", {"fields": {k: enc(v) for k, v in fields.items()}}, token)


def sport_label(raw):
    t = str(raw or "").strip()
    l = t.lower()
    if re.search(r"strength|forza|pesi|weight|gym", l): return "Pesi"
    if re.search(r"indoor cycl|cyclette|stationary|spinning|exercise bike", l): return "Cyclette"
    if re.search(r"cycl|bike|cicl", l): return "Bici"
    if re.search(r"treadmill|tapis|indoor run|running|corsa|^run", l): return "Tapis roulant / corsa"
    if re.search(r"walk|camm", l): return "Camminata"
    if re.search(r"hiit|interval", l): return "HIIT"
    if re.search(r"ellip", l): return "Ellittica"
    if re.search(r"row|vogat", l): return "Vogatore"
    if re.search(r"yoga|stretch|flex", l): return "Stretching / yoga"
    return t.replace("_", " ").title() or "Allenamento"


def to_dt(s):
    if not s:
        return None
    try:
        d = datetime.fromisoformat(str(s).replace("Z", "+00:00"))
    except ValueError:
        return None
    return d if d.tzinfo else d.replace(tzinfo=TZ)


def num(v):
    try:
        return float(v)
    except (TypeError, ValueError):
        return 0.0


def parse_respiro(items):
    """RespiratoryRate/real_data: un elemento per giorno, 1440 byte (uno al minuto, 0 = nessuna misura) in base64."""
    out = {}
    for it in items:
        try:
            raw = base64.b64decode((it.get("value") or {}).get("measurements") or "")
            vals = [b for b in raw if 5 <= b <= 60]
            if vals:
                out[datetime.fromtimestamp(it["timestamp"] / 1000, timezone.utc).date().isoformat()] = round(sum(vals) / len(vals), 1)
        except Exception:  # noqa: BLE001
            continue
    return out


def parse_spo2(items):
    """blood_oxygen/click: misure di ossigeno nel sangue (campo extra.spo2); media per giorno nel fuso della misura."""
    acc = {}
    for it in items:
        try:
            ex = json.loads(it.get("extra") or "{}")
            v = num(ex.get("spo2"))
            if not 50 <= v <= 100:
                continue
            tz = ZoneInfo(it.get("timezone") or "Europe/Rome")
            d = datetime.fromtimestamp(it["timestamp"] / 1000, tz).date().isoformat()
            acc.setdefault(d, []).append(v)
        except Exception:  # noqa: BLE001
            continue
    return {d: round(sum(v) / len(v), 1) for d, v in acc.items()}


def parse_stress(items):
    """all_day_stress: un elemento per giorno con stress medio/min/max (0-100); il giorno si ricava dall'orario dei campioni."""
    out = {}
    for it in items:
        try:
            pts = json.loads(it.get("data") or "[]")
            t = pts[0]["time"] if pts else 0
            if not t or t < 1e11:
                t = it["timestamp"]
            d = datetime.fromtimestamp(t / 1000, TZ).date().isoformat()
            avg, mx = int(num(it.get("avgStress"))), int(num(it.get("maxStress")))
            if avg > 0:
                out[d] = {"stressMedio": avg, "stressMax": mx}
        except Exception:  # noqa: BLE001
            continue
    return out


def main():
    for k in ("ZEPP_EMAIL", "ZEPP_PASSWORD", "ZEPP_SYNC_PASSWORD", "FIREBASE_UID"):
        if not os.environ.get(k):
            log(f"Sincronizzazione non ancora configurata (manca {k}): niente da fare.")
            return 0
    uid = os.environ["FIREBASE_UID"]
    token = sign_in()

    zc = api.from_env()
    start, end = api.default_range(DAYS_BACK)
    log(f"Periodo {start} → {end}")

    # ── dati dei giorni ────────────────────────────────────────────────
    days = {}
    out = api.band_data(zc, start, end)
    if out.status == "ok":
        righe = out.data.get("data") or []
        log(f"Righe giornaliere ricevute: {len(righe)}")
        for row in righe:
            if not isinstance(row, dict):
                continue
            s = decode.summarise_day(row)
            d = s.get("date")
            if not d:
                continue
            o = {}
            if s.get("steps"): o["passi"] = int(s["steps"])
            if s.get("calories_kcal"): o["kcalGiorno"] = int(s["calories_kcal"])
            hr = [v for v in decode.decode_hr_minutes(row.get("data_hr") or "") if v]
            if hr:
                o["bpmMedio"] = round(sum(hr) / len(hr))
                o["bpmMin"] = min(hr)
                o["bpmMax"] = max(hr)
            sl = s.get("sleep") or {}
            if sl.get("resting_heart_rate_bpm"): o["bpmRiposo"] = int(sl["resting_heart_rate_bpm"])
            if sl.get("total_asleep_minutes"): o["sonnoMin"] = int(sl["total_asleep_minutes"])
            if sl.get("sleep_score"): o["sonnoPunteggio"] = int(sl["sleep_score"])
            if o:
                days[str(d)] = o
    else:
        log(f"Dati giornalieri: {out.status}")
    log(f"Giorni letti: {len(days)}")

    # ── ossigeno e respirazione ────────────────────────────────────────
    try:
        t0 = int(datetime.fromisoformat(start).replace(tzinfo=timezone.utc).timestamp() * 1000)
        t1 = int(datetime.fromisoformat(end).replace(tzinfo=timezone.utc).timestamp() * 1000) + 86400000
        r = zc.get("/v2/users/me/events", {"from": t0, "to": t1, "eventType": "RespiratoryRate", "subType": "real_data", "limit": 30})
        resp = parse_respiro((r.data or {}).get("items") or []) if r.status == "ok" else {}
        r = zc.get(f"/users/{zc.credential().user_id}/events", {"from": t0, "to": t1, "eventType": "blood_oxygen", "subType": "click", "limit": 100, "reverse": "false"})
        spo2 = parse_spo2((r.data or {}).get("items") or []) if r.status == "ok" else {}
        for d, v in resp.items():
            days.setdefault(d, {})["respiro"] = v
        for d, v in spo2.items():
            days.setdefault(d, {})["spo2"] = v
        log(f"Respirazione: {len(resp)} giorni · ossigeno: {len(spo2)} giorni")
        r = zc.get(f"/users/{zc.credential().user_id}/events", {"from": t0, "to": t1, "eventType": "all_day_stress", "limit": 50})
        stress = parse_stress((r.data or {}).get("items") or []) if r.status == "ok" else {}
        for d, o in stress.items():
            days.setdefault(d, {}).update(o)
        log(f"Stress: {len(stress)} giorni")
    except Exception as e:  # noqa: BLE001 - dati extra: non devono fermare il resto
        log(f"ossigeno/respirazione non disponibili ({type(e).__name__})")

    for d, o in days.items():
        # solo i campi di quel giorno (gli altri giorni e i campi non toccati restano com'erano)
        patch(token, f"users/{uid}/direction/salute_giorni", {"days": {d: o}}, [f"days.`{d}`.{k}" for k in o])

    # ── allenamenti ────────────────────────────────────────────────────
    out = api.workout_history(zc, start, end)
    if out.status != "ok":
        log(f"Allenamenti: {out.status}")
        return 0
    tutti = [workouts.normalise(r) for r in api.parse_rows(out.data)]
    # Zepp può restituire anche allenamenti fuori dal periodo chiesto: si tengono solo quelli recenti
    items = [w for w in tutti if str(w.get("start_local") or "")[:10] >= start]
    log(f"Allenamenti restituiti da Zepp: {len(tutti)} (nel periodo: {len(items)})")
    q = {"structuredQuery": {"from": [{"collectionId": "allenamenti_registro"}], "where": {"fieldFilter": {
        "field": {"fieldPath": "data"}, "op": "GREATER_THAN_OR_EQUAL", "value": {"stringValue": start}}}}}
    existing = [{"id": r["document"]["name"].rsplit("/", 1)[1], **{k: dec(v) for k, v in r["document"].get("fields", {}).items()}}
                for r in http("POST", f"{DOCS}/users/{uid}:runQuery", q, token) if "document" in r]
    seen = {e.get("hk") for e in existing if e.get("hk")}
    agganciati = nuovi = doppi = 0
    for w in items:
        a, b = to_dt(w.get("start_local")), to_dt(w.get("end_local"))
        if not a:
            continue
        b = b or (a + timedelta(seconds=int(w.get("elapsed_seconds") or 0)))
        hk = f"zepp:{w.get('track_id')}"
        s = w.get("summary") or {}
        fields = {
            "kcal": int(num(s.get("calorie"))) or None,
            "bpmMedio": int(num(s.get("avg_heart_rate"))) or None,
            "bpmMax": int(num(s.get("max_heart_rate"))) or None,
            "orologio": sport_label(w.get("sport")),
            "hk": hk,
        }
        if hk in seen:
            doppi += 1
            continue
        seen.add(hk)
        ini, fine = int(a.timestamp() * 1000), int(b.timestamp() * 1000)
        data = a.astimezone(TZ).date().isoformat()
        match = next((e for e in existing if e.get("data") == data and not e.get("hk") and e.get("ini") and e.get("fine")
                      and e["ini"] != e["fine"] and e["ini"] - 40 * 60000 <= fine and e["fine"] + 40 * 60000 >= ini), None)
        if match is None:
            # l'unica sessione coi pesi del giorno, senza dati dell'orologio, registrata a mano (orario non affidabile)
            same = [e for e in existing if e.get("data") == data and not e.get("hk")]
            if len(same) == 1 and fields["orologio"] == "Pesi":
                match = same[0]
        if match:
            patch(token, f"users/{uid}/allenamenti_registro/{match['id']}", fields, list(fields))
            match.update(fields)
            agganciati += 1
        else:
            doc = {
                "v": 2, "data": data, "allenamentoId": "", "allenamentoNome": fields["orologio"], "schedaNome": "Dall’orologio",
                "durata": max(1, round((fine - ini) / 60000)), "ini": ini, "fine": fine, "rw": 0, "st": 0, "acqua": 0, "es": [],
                "createdAt": int(datetime.now(timezone.utc).timestamp() * 1000), **fields,
            }
            r = http("POST", f"{DOCS}/users/{uid}/allenamenti_registro", {"fields": {k: enc(v) for k, v in doc.items()}}, token)
            existing.append({"id": r["name"].rsplit("/", 1)[1], **doc})
            nuovi += 1
    # VO2 max: stima dell'orologio, presente nel riepilogo degli allenamenti che la misurano (-1 = non misurata)
    vo2 = {}
    for w in sorted(items, key=lambda x: str(x.get("start_local"))):
        v = num((w.get("summary") or {}).get("VO2_max"))
        a = to_dt(w.get("start_local"))
        if a and v > 0:
            vo2[a.astimezone(TZ).date().isoformat()] = int(round(v))
    for d, v in vo2.items():
        patch(token, f"users/{uid}/direction/salute_giorni", {"days": {d: {"vo2max": v}}}, [f"days.`{d}`.vo2max"])
    log(f"VO2 max: {len(vo2)} giorni")
    log(f"Allenamenti: {len(items)} letti, {agganciati} agganciati, {nuovi} nuovi, {doppi} già presenti")
    return 0


if __name__ == "__main__":
    sys.exit(main())
