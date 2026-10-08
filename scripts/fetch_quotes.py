#!/usr/bin/env python3
"""
fetch_quotes.py — scarica i prezzi veri di azioni ed ETF (Yahoo Finance, dati pubblici) e scrive data/mercati.json.

Gira da solo con GitHub Actions (.github/workflows/mercati.yml) e prima di ogni pubblicazione del sito.
Il browser non può chiamare Yahoo direttamente (CORS), per questo lo fa il server di GitHub.
Nel file ci sono solo prezzi pubblici di borsa: nessun dato personale. I titoli sono quelli elencati in TICKERS.
Se un titolo non risponde, resta il valore di prima (con la sua data): mai numeri inventati.
"""
import json
import os
import sys
import urllib.request
from datetime import datetime, timezone

TICKERS = ['IBM', 'MSFT', 'AAPL', 'GOOGL', 'IUIT.L', 'ISPY.L', 'HWWD.L', 'CSPX.L', 'VWRL.L', 'CXSE', 'AGED.L', 'VAPX.L']
OUT = os.path.join(os.path.dirname(__file__), '..', 'data', 'mercati.json')
UA = 'Mozilla/5.0 (compatible; GecoZen/1.0)'


def fetch(ticker):
    url = f'https://query1.finance.yahoo.com/v8/finance/chart/{ticker}?interval=1d&range=1y&includePrePost=false'
    req = urllib.request.Request(url, headers={'User-Agent': UA})
    with urllib.request.urlopen(req, timeout=25) as r:
        res = json.loads(r.read())['chart']['result'][0]
    meta = res['meta']
    ts = res.get('timestamp') or []
    closes = (res['indicators']['quote'][0].get('close') or [])
    pts = [(t, c) for t, c in zip(ts, closes) if c is not None]
    if len(pts) < 2:
        raise ValueError('pochi dati')
    cur = meta.get('currency') or 'USD'
    k = 0.01 if cur == 'GBp' else 1          # Londra quota spesso in pence
    cur = 'GBP' if cur == 'GBp' else cur
    price = (meta.get('regularMarketPrice') or pts[-1][1]) * k
    series = [c * k for _, c in pts]
    last_t = pts[-1][0]

    def pct(back):                              # variazione % rispetto a `back` chiusure fa
        if len(series) <= back:
            return None
        ref = series[-1 - back]
        return round((price - ref) / ref * 100, 2) if ref else None

    # chiusura precedente: se l'ultimo punto è la seduta di oggi, è il penultimo; altrimenti è l'ultimo
    day_of = lambda t: datetime.fromtimestamp(t, timezone.utc).date()
    rt = meta.get('regularMarketTime') or last_t
    prev = series[-2] if day_of(last_t) == day_of(rt) else series[-1]
    year_start = next((c * k for t, c in pts if datetime.fromtimestamp(t, timezone.utc).year == datetime.now(timezone.utc).year), None)
    return {
        'name': meta.get('longName') or meta.get('shortName') or ticker,
        'price': round(price, 4), 'currency': cur,
        'day': round((price - prev) / prev * 100, 2) if prev else None,
        'w1': pct(5), 'm1': pct(21), 'm3': pct(63), 'y1': pct(len(series) - 1) if len(series) > 200 else None,
        'ytd': round((price - year_start) / year_start * 100, 2) if year_start else None,
        'hi52': round(max(series), 4), 'lo52': round(min(series), 4),
        'spark': [round(v, 4) for v in series[-60:]],
        'asof': datetime.fromtimestamp(meta.get('regularMarketTime') or last_t, timezone.utc).isoformat(timespec='minutes'),
        'state': meta.get('marketState') or '',
    }


def main():
    try:
        with open(OUT, encoding='utf-8') as f:
            data = json.load(f)
    except (OSError, ValueError):
        data = {'quotes': {}}
    ok = 0
    for t in TICKERS:
        try:
            data['quotes'][t] = fetch(t)
            ok += 1
        except Exception as e:                  # il titolo resta com'era
            print(f'{t}: non aggiornato ({type(e).__name__})', file=sys.stderr)
    data['updated'] = datetime.now(timezone.utc).isoformat(timespec='minutes')
    os.makedirs(os.path.dirname(OUT), exist_ok=True)
    with open(OUT, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, separators=(',', ':'))
    print(f'{ok}/{len(TICKERS)} titoli aggiornati')
    if ok == 0:
        sys.exit(1)


if __name__ == '__main__':
    main()
