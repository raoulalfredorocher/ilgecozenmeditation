"""Audiolibri degli appunti: un MP3 per pagina, per ogni libro in scripts/audiolibri.json
(modulo dei capitoli → cartella degli MP3, es. audio/appunti/ per lo zen).

Prende i testi parlati da scripts/testi_appunti.mjs e li fa leggere a una voce neurale
italiana gratuita (edge-tts, nessuna chiave). Rigenera solo le pagine il cui testo o la
cui voce sono cambiati: l'impronta di ciascuna sta in <cartella>/indice.json, insieme
alla durata in secondi che l'app mostra prima di scaricare l'audio.

Gira nel workflow "Audiolibro appunti" (.github/workflows/audio-appunti.yml).
Uso a mano: pip install edge-tts && python scripts/audio_appunti.py
"""
import asyncio
import hashlib
import json
import os
import subprocess
import sys

import edge_tts

VOCE = 'it-IT-IsabellaNeural'
VELOCITA = '-8%'           # un po' più lenta del normale: ritmo da lettura calma
KBPS = 48                  # edge-tts produce MP3 mono a 48 kbit/s
RADICE = os.path.join(os.path.dirname(__file__), '..')


def impronta(testo):
    return hashlib.sha1(f'{VOCE}|{VELOCITA}|{testo}'.encode()).hexdigest()[:12]


async def genera(pagina, dest):
    for tentativo in range(4):
        try:
            await edge_tts.Communicate(pagina['testo'], VOCE, rate=VELOCITA).save(dest)
            if os.path.getsize(dest) > 1000:
                return
        except Exception as e:  # rete o servizio: si riprova
            print(f'  {pagina["id"]}: tentativo {tentativo + 1} non riuscito ({type(e).__name__})')
        await asyncio.sleep(5 * (tentativo + 1))
    raise SystemExit(f'{pagina["id"]}: audio non generato')


async def libro(modulo, cartella):
    if not os.path.exists(os.path.join(RADICE, modulo)):
        print(f'{modulo}: non c\'è ancora, salto')
        return
    pagine = json.loads(subprocess.check_output(['node', 'scripts/testi_appunti.mjs', modulo], cwd=RADICE))
    cartella = os.path.join(RADICE, cartella)
    indice = os.path.join(cartella, 'indice.json')
    os.makedirs(cartella, exist_ok=True)
    try:
        with open(indice) as f:
            vecchio = json.load(f).get('pagine', {})
    except FileNotFoundError:
        vecchio = {}

    nuovo, fatte = {}, 0
    for p in pagine:
        h, dest = impronta(p['testo']), os.path.join(cartella, f'{p["id"]}.mp3')
        if vecchio.get(p['id'], {}).get('h') != h or not os.path.exists(dest):
            await genera(p, dest)
            fatte += 1
        nuovo[p['id']] = {'h': h, 's': round(os.path.getsize(dest) * 8 / (KBPS * 1000))}

    # via le pagine che non esistono più
    for nome in os.listdir(cartella):
        if nome.endswith('.mp3') and nome[:-4] not in nuovo:
            os.remove(os.path.join(cartella, nome))

    with open(indice, 'w') as f:
        json.dump({'voce': VOCE, 'pagine': nuovo}, f, ensure_ascii=False, indent=1)
    minuti = sum(v['s'] for v in nuovo.values()) // 60
    print(f'{modulo}: {len(nuovo)} pagine, {fatte} rigenerate, {minuti} minuti di audio')


async def main():
    with open(os.path.join(RADICE, 'scripts', 'audiolibri.json')) as f:
        for l in json.load(f):
            await libro(l['modulo'], l['cartella'])


if __name__ == '__main__':
    sys.exit(asyncio.run(main()))
