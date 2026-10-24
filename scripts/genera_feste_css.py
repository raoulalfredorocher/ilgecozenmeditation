#!/usr/bin/env python3
"""Genera lo stile "tutta l'app a tema" delle feste e lo scrive in styles/zen.css tra i segnaposto.

I disegni sono SVG fatti a mano, trasformati in data URI (niente file esterni, niente licenze).
Uso: python3 scripts/genera_feste_css.py   (dalla radice del repo)
"""
import pathlib
import re
import urllib.parse

ROOT = pathlib.Path(__file__).resolve().parent.parent
ZEN = ROOT / 'styles' / 'zen.css'
START, END = '/* >>> feste: tutta l\'app a tema (generato da scripts/genera_feste_css.py) */', '/* <<< feste */'


def uri(body, w=64, h=64, extra=''):
    svg = f"<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 {w} {h}' width='{w}' height='{h}' {extra}>{body}</svg>"
    svg = ' '.join(svg.split()).replace('%23', '#')
    return 'url("data:image/svg+xml,' + urllib.parse.quote(svg, safe=" =:/'.,-()") + '")'


# ─── Personaggi delle schede (64 × 64) ──────────────────────────────────────

NATALE = [
    # renna
    "<path d='M20 14 l-4 -9 M20 14 l-9 -4 M17 8 l-6 1 M44 14 l4 -9 M44 14 l9 -4 M47 8 l6 1' stroke='%235C3A24' stroke-width='3' stroke-linecap='round' fill='none'/>"
    "<ellipse cx='16' cy='26' rx='7' ry='4' fill='%238B5A3C' transform='rotate(-30 16 26)'/><ellipse cx='48' cy='26' rx='7' ry='4' fill='%238B5A3C' transform='rotate(30 48 26)'/>"
    "<path d='M18 26 Q18 14 32 14 Q46 14 46 26 L42 50 Q32 60 22 50Z' fill='%23A06A48'/><ellipse cx='32' cy='48' rx='10' ry='8' fill='%23D9B38C'/>"
    "<circle cx='25' cy='30' r='3' fill='%231C140E'/><circle cx='39' cy='30' r='3' fill='%231C140E'/><circle cx='26' cy='29' r='1' fill='%23fff'/><circle cx='40' cy='29' r='1' fill='%23fff'/>"
    "<circle cx='32' cy='44' r='5.5' fill='%23E8443A'/><circle cx='30' cy='42' r='1.6' fill='%23fff' opacity='.7'/>",
    # elfo
    "<path d='M16 26 Q30 -4 52 8 Q44 10 46 26Z' fill='%232E8B57'/><circle cx='53' cy='8' r='4' fill='%23F2C14E'/>"
    "<path d='M12 30 L6 22 L16 28Z M52 30 L58 22 L48 28Z' fill='%23F5C9A8'/>"
    "<circle cx='32' cy='34' r='15' fill='%23F5C9A8'/><rect x='14' y='22' width='36' height='7' rx='3.5' fill='%23D64545'/>"
    "<circle cx='26' cy='33' r='2' fill='%231C140E'/><circle cx='38' cy='33' r='2' fill='%231C140E'/><circle cx='22' cy='39' r='3' fill='%23F08A8A' opacity='.6'/><circle cx='42' cy='39' r='3' fill='%23F08A8A' opacity='.6'/>"
    "<path d='M26 40 Q32 46 38 40' stroke='%238B3A3A' stroke-width='2' fill='none' stroke-linecap='round'/>"
    "<path d='M18 50 L24 56 L28 50 L32 57 L36 50 L40 56 L46 50 Z' fill='%23D64545'/><path d='M20 48 H44 L46 50 H18Z' fill='%232E8B57'/>",
    # pupazzo di neve
    "<circle cx='32' cy='46' r='14' fill='%23FFFFFF' stroke='%23C7D9E6' stroke-width='1.5'/><circle cx='32' cy='24' r='10' fill='%23FFFFFF' stroke='%23C7D9E6' stroke-width='1.5'/>"
    "<rect x='22' y='12' width='20' height='3' rx='1' fill='%231C2430'/><rect x='25' y='1' width='14' height='12' rx='1' fill='%231C2430'/><rect x='25' y='9' width='14' height='2.5' fill='%23D64545'/>"
    "<circle cx='28' cy='22' r='1.6' fill='%231C2430'/><circle cx='36' cy='22' r='1.6' fill='%231C2430'/><path d='M32 25 l9 2 -9 1.6Z' fill='%23E08A3C'/>"
    "<path d='M21 33 Q32 38 43 33 L43 37 Q32 41 21 37Z' fill='%23D64545'/><path d='M38 36 l3 10 4 -1 -3 -9Z' fill='%23D64545'/>"
    "<circle cx='32' cy='43' r='1.6' fill='%231C2430'/><circle cx='32' cy='50' r='1.6' fill='%231C2430'/>",
    # omino di pan di zenzero
    "<path d='M32 6 a9 9 0 0 1 9 9 a9 9 0 0 1 -3 7 h10 a5 5 0 0 1 0 10 h-8 l6 18 a5 5 0 0 1 -9 4 l-5 -10 l-5 10 a5 5 0 0 1 -9 -4 l6 -18 h-8 a5 5 0 0 1 0 -10 h10 a9 9 0 0 1 -3 -7 a9 9 0 0 1 9 -9Z' fill='%23B8743A'/>"
    "<circle cx='29' cy='14' r='1.6' fill='%23fff'/><circle cx='35' cy='14' r='1.6' fill='%23fff'/><path d='M28 18 Q32 21 36 18' stroke='%23fff' stroke-width='1.4' fill='none' stroke-linecap='round'/>"
    "<path d='M17 25 l2 2 2 -2 M43 25 l2 2 2 -2 M22 50 l2 2 2 -2 M38 50 l2 2 2 -2' stroke='%23fff' stroke-width='1.4' fill='none' stroke-linecap='round'/>"
    "<circle cx='32' cy='30' r='2' fill='%23D64545'/><circle cx='32' cy='37' r='2' fill='%232E8B57'/>",
    # pacco regalo
    "<rect x='10' y='26' width='44' height='30' rx='3' fill='%23D64545'/><rect x='7' y='19' width='50' height='10' rx='3' fill='%23E05252'/>"
    "<rect x='29' y='19' width='6' height='37' fill='%23F2C14E'/>"
    "<path d='M32 19 Q18 4 16 12 Q16 18 32 19 Q46 4 48 12 Q48 18 32 19Z' fill='%23F2C14E'/><circle cx='32' cy='19' r='3' fill='%23E3B341'/>",
    # calza con bastoncino
    "<path d='M38 4 Q46 4 46 10 L46 30' stroke='%23fff' stroke-width='5' fill='none' stroke-linecap='round'/><path d='M38 4 Q46 4 46 10 L46 30' stroke='%23D64545' stroke-width='5' stroke-dasharray='3 4' fill='none'/>"
    "<path d='M20 16 H44 V40 Q44 44 40 46 L24 56 Q14 60 11 52 Q9 46 16 42 L20 40Z' fill='%23D64545'/>"
    "<rect x='17' y='10' width='30' height='10' rx='4' fill='%23FFFFFF'/><path d='M22 34 l4 4 M30 30 l4 4 M26 44 l4 4' stroke='%23fff' stroke-width='2' stroke-linecap='round'/>",
    # ghirlanda
    "<circle cx='32' cy='30' r='19' fill='none' stroke='%231F6E4A' stroke-width='10'/>"
    "<g fill='%232E8B57'><ellipse cx='32' cy='11' rx='6' ry='3'/><ellipse cx='48' cy='20' rx='6' ry='3' transform='rotate(60 48 20)'/><ellipse cx='50' cy='38' rx='6' ry='3' transform='rotate(-60 50 38)'/><ellipse cx='14' cy='38' rx='6' ry='3' transform='rotate(60 14 38)'/><ellipse cx='16' cy='20' rx='6' ry='3' transform='rotate(-60 16 20)'/></g>"
    "<g fill='%23D64545'><circle cx='40' cy='13' r='2.4'/><circle cx='51' cy='29' r='2.4'/><circle cx='13' cy='29' r='2.4'/><circle cx='24' cy='13' r='2.4'/><circle cx='44' cy='45' r='2.4'/></g>"
    "<path d='M32 48 L22 60 L26 50 Z M32 48 L42 60 L38 50Z' fill='%23C0392B'/><path d='M32 48 Q20 40 20 50 Q24 54 32 48 Q44 40 44 50 Q40 54 32 48Z' fill='%23D64545'/><circle cx='32' cy='48' r='3' fill='%23B83232'/>",
    # campana con agrifoglio
    "<path d='M32 10 Q18 10 18 30 Q18 42 10 48 H54 Q46 42 46 30 Q46 10 32 10Z' fill='%23E3B341'/><path d='M22 30 Q22 18 30 15' stroke='%23F7E2A6' stroke-width='3' fill='none' stroke-linecap='round'/>"
    "<rect x='9' y='46' width='46' height='5' rx='2.5' fill='%23C9952A'/><circle cx='32' cy='55' r='5' fill='%23C9952A'/>"
    "<path d='M32 10 Q22 2 18 8 Q26 8 32 10Z M32 10 Q42 2 46 8 Q38 8 32 10Z' fill='%232E8B57'/><circle cx='29' cy='8' r='2.4' fill='%23D64545'/><circle cx='35' cy='8' r='2.4' fill='%23D64545'/>",
]

HALLOWEEN = [
    # cappello da strega
    "<path d='M32 4 Q38 10 40 20 L46 44 H18 L26 18 Q28 8 32 4Z' fill='%233A2550'/><path d='M32 4 Q42 4 48 12 Q40 10 36 12Z' fill='%233A2550'/>"
    "<ellipse cx='32' cy='46' rx='28' ry='7' fill='%232A1B3D'/><path d='M20 38 H44 L45 43 H19Z' fill='%23FF8A2A'/><rect x='28' y='37' width='8' height='7' rx='1' fill='%23F2C14E'/><rect x='30.5' y='39' width='3' height='3' fill='%23FF8A2A'/>",
    # calderone
    "<ellipse cx='32' cy='26' rx='22' ry='5' fill='%2373D13A'/><circle cx='24' cy='20' r='4' fill='%2373D13A'/><circle cx='36' cy='16' r='3' fill='%2373D13A'/><circle cx='42' cy='9' r='2' fill='%2373D13A' opacity='.7'/>"
    "<path d='M10 26 Q8 54 32 56 Q56 54 54 26Z' fill='%231A1424'/><ellipse cx='32' cy='26' rx='24' ry='4' fill='none' stroke='%232A2238' stroke-width='3'/>"
    "<path d='M16 56 l-3 5 M48 56 l3 5' stroke='%231A1424' stroke-width='4' stroke-linecap='round'/><path d='M18 34 Q20 46 28 50' stroke='%23413656' stroke-width='2' fill='none'/>",
    # gatto nero
    "<path d='M20 58 Q14 40 22 30 L18 12 L28 22 Q32 21 36 22 L46 12 L42 30 Q50 40 44 58Z' fill='%23140E1C'/>"
    "<path d='M44 54 Q58 54 56 40 Q55 34 50 36' stroke='%23140E1C' stroke-width='4' fill='none' stroke-linecap='round'/>"
    "<ellipse cx='27' cy='32' rx='3' ry='4' fill='%23F2E35A'/><ellipse cx='37' cy='32' rx='3' ry='4' fill='%23F2E35A'/><rect x='26.3' y='29' width='1.4' height='6' rx='.7' fill='%23140E1C'/><rect x='36.3' y='29' width='1.4' height='6' rx='.7' fill='%23140E1C'/>"
    "<path d='M30 38 l2 2 2 -2Z' fill='%23F08AA0'/>",
    # ragno
    "<path d='M32 0 V22' stroke='%23B8A9C9' stroke-width='1'/>"
    "<path d='M24 30 l-12 -8 -4 4 M24 34 l-14 0 -4 6 M25 38 l-12 8 -2 6 M27 40 l-8 12 M40 30 l12 -8 4 4 M40 34 l14 0 4 6 M39 38 l12 8 2 6 M37 40 l8 12' stroke='%23140E1C' stroke-width='2.4' fill='none' stroke-linecap='round' stroke-linejoin='round'/>"
    "<circle cx='32' cy='26' r='6' fill='%23140E1C'/><ellipse cx='32' cy='38' rx='10' ry='11' fill='%23140E1C'/>"
    "<circle cx='29.5' cy='25' r='1.6' fill='%23FF6A3D'/><circle cx='34.5' cy='25' r='1.6' fill='%23FF6A3D'/><path d='M28 36 L32 40 L36 36 L32 46Z' fill='%23C83E35'/>",
    # teschio
    "<path d='M14 30 Q14 8 32 8 Q50 8 50 30 Q50 38 44 42 V50 H20 V42 Q14 38 14 30Z' fill='%23F4F0FA'/>"
    "<ellipse cx='24' cy='30' rx='6' ry='7' fill='%23241B31'/><ellipse cx='40' cy='30' rx='6' ry='7' fill='%23241B31'/><path d='M29 40 L32 35 L35 40Z' fill='%23241B31'/>"
    "<path d='M24 46 V51 M29 46 V52 M35 46 V52 M40 46 V51' stroke='%23241B31' stroke-width='2'/>",
    # caramella
    "<path d='M14 32 L2 22 L4 32 L2 42Z M50 32 L62 22 L60 32 L62 42Z' fill='%23B98CF0'/>"
    "<circle cx='32' cy='32' r='18' fill='%23FF8A2A'/><path d='M18 22 Q32 32 18 44 M28 14 Q42 32 28 50 M40 15 Q52 32 42 49' stroke='%23FFFFFF' stroke-width='3' fill='none' opacity='.8'/>",
    # mummia
    "<rect x='14' y='8' width='36' height='52' rx='16' fill='%23EDE3CF'/>"
    "<path d='M14 18 L50 22 M14 26 L50 23 M14 38 L50 42 M14 46 L50 44 M16 54 L48 52 M18 14 L46 12' stroke='%23C9B896' stroke-width='2'/>"
    "<rect x='14' y='28' width='36' height='9' fill='%23241B31'/><circle cx='24' cy='32.5' r='3.4' fill='%23FFFFFF'/><circle cx='40' cy='32.5' r='3.4' fill='%23FFFFFF'/><circle cx='25' cy='33' r='1.6' fill='%23241B31'/><circle cx='39' cy='33' r='1.6' fill='%23241B31'/>"
    "<path d='M46 50 Q54 56 52 62' stroke='%23EDE3CF' stroke-width='3' fill='none' stroke-linecap='round'/>",
    # fantasma
    "<path d='M12 30 C12 6 52 6 52 30 V56 l-7 -5 -6.5 5 -6.5 -5 -6.5 5 -6.5 -5 -7 5Z' fill='%23F4F0FA'/>"
    "<ellipse cx='24' cy='28' rx='4' ry='5.5' fill='%23241B31'/><ellipse cx='40' cy='28' rx='4' ry='5.5' fill='%23241B31'/><ellipse cx='32' cy='41' rx='4.5' ry='5' fill='%23241B31'/>"
    "<circle cx='19' cy='36' r='3' fill='%23F4B6C2' opacity='.5'/><circle cx='45' cy='36' r='3' fill='%23F4B6C2' opacity='.5'/>",
]

PASQUA = [
    # pulcino nel guscio
    "<circle cx='32' cy='26' r='16' fill='%23FFD94D'/><path d='M26 8 q2 -6 6 -2 q2 -5 5 1' stroke='%23F2B92B' stroke-width='2' fill='none'/>"
    "<circle cx='26' cy='24' r='2.2' fill='%233A2F4F'/><circle cx='38' cy='24' r='2.2' fill='%233A2F4F'/><path d='M29 29 L35 29 L32 34Z' fill='%23F28C2B'/>"
    "<circle cx='21' cy='30' r='3' fill='%23F4A3B5' opacity='.6'/><circle cx='43' cy='30' r='3' fill='%23F4A3B5' opacity='.6'/>"
    "<path d='M10 36 L18 42 L24 34 L32 42 L40 34 L46 42 L54 36 Q56 60 32 60 Q8 60 10 36Z' fill='%23FFFFFF' stroke='%23E5DCEF' stroke-width='1.5'/>",
    # coniglio
    "<ellipse cx='22' cy='18' rx='6' ry='16' fill='%23F4F1F6'/><ellipse cx='22' cy='18' rx='2.6' ry='11' fill='%23F4B6C2'/>"
    "<ellipse cx='42' cy='18' rx='6' ry='16' fill='%23F4F1F6'/><ellipse cx='42' cy='18' rx='2.6' ry='11' fill='%23F4B6C2'/>"
    "<circle cx='32' cy='42' r='18' fill='%23F4F1F6' stroke='%23E5DCEF' stroke-width='1.5'/>"
    "<circle cx='25' cy='39' r='2.2' fill='%233A2F4F'/><circle cx='39' cy='39' r='2.2' fill='%233A2F4F'/><ellipse cx='32' cy='45' rx='3' ry='2.2' fill='%23F08AA0'/>"
    "<path d='M32 47 V50 M32 50 Q28 53 26 50 M32 50 Q36 53 38 50' stroke='%233A2F4F' stroke-width='1.4' fill='none' stroke-linecap='round'/><circle cx='22' cy='47' r='3.4' fill='%23F8C9D3' opacity='.7'/><circle cx='42' cy='47' r='3.4' fill='%23F8C9D3' opacity='.7'/>",
    # uovo decorato
    "<path d='M32 4 C46 4 52 28 52 38 C52 52 43 60 32 60 C21 60 12 52 12 38 C12 28 18 4 32 4Z' fill='%23B8A3E8'/>"
    "<path d='M13 30 Q22 24 32 30 T51 30' stroke='%23FFFFFF' stroke-width='4' fill='none'/><path d='M12 42 L18 36 L24 42 L30 36 L36 42 L42 36 L48 42 L52 38' stroke='%23F8E58C' stroke-width='3.4' fill='none'/>"
    "<circle cx='24' cy='18' r='2.4' fill='%23F4A3B5'/><circle cx='34' cy='14' r='2.4' fill='%239EDBC0'/><circle cx='40' cy='22' r='2.4' fill='%23F4A3B5'/><circle cx='26' cy='52' r='2.4' fill='%239EDBC0'/><circle cx='38' cy='52' r='2.4' fill='%23F4A3B5'/>",
    # tulipano
    "<path d='M32 60 V30' stroke='%235FAE6E' stroke-width='3'/><path d='M32 48 Q16 44 16 28 Q28 34 32 44Z' fill='%237CC48A'/><path d='M32 52 Q48 48 50 34 Q36 38 32 48Z' fill='%237CC48A'/>"
    "<path d='M20 8 L26 18 L32 6 L38 18 L44 8 Q48 30 32 32 Q16 30 20 8Z' fill='%23F4A3B5'/><path d='M32 6 L38 18 L44 8 Q46 26 34 31Z' fill='%23E88AA0'/>",
    # carota
    "<path d='M30 16 Q26 4 18 6 Q24 10 28 18 M34 16 Q36 2 44 4 Q38 10 36 18 M32 16 V4' stroke='%235FAE6E' stroke-width='3.4' fill='none' stroke-linecap='round'/>"
    "<path d='M20 20 Q32 12 44 20 L34 60 Q32 62 30 60Z' fill='%23F28C2B'/><path d='M24 28 h6 M34 36 h6 M26 44 h5 M32 52 h3' stroke='%23D9741A' stroke-width='2' stroke-linecap='round'/>",
    # farfalla
    "<path d='M32 30 Q18 6 8 14 Q4 28 30 34Z' fill='%23F4A3B5'/><path d='M32 30 Q46 6 56 14 Q60 28 34 34Z' fill='%23F4A3B5'/>"
    "<path d='M30 36 Q12 38 14 52 Q24 56 31 40Z' fill='%23B8A3E8'/><path d='M34 36 Q52 38 50 52 Q40 56 33 40Z' fill='%23B8A3E8'/>"
    "<circle cx='18' cy='20' r='3' fill='%23FFFFFF' opacity='.7'/><circle cx='46' cy='20' r='3' fill='%23FFFFFF' opacity='.7'/>"
    "<rect x='30.5' y='24' width='3' height='26' rx='1.5' fill='%233A2F4F'/><path d='M31 25 Q26 16 24 14 M33 25 Q38 16 40 14' stroke='%233A2F4F' stroke-width='1.4' fill='none'/>",
]

CAPODANNO = [
    # orologio a mezzanotte
    "<circle cx='32' cy='34' r='24' fill='%23F2D78F'/><circle cx='32' cy='34' r='19' fill='%230B1022'/>"
    "<path d='M32 34 V18 M32 34 L35 22' stroke='%23F2D78F' stroke-width='3' stroke-linecap='round'/><circle cx='32' cy='34' r='2.6' fill='%23F2D78F'/>"
    "<path d='M32 17 v3 M49 34 h-3 M32 51 v-3 M15 34 h3' stroke='%23D9DEEA' stroke-width='2' stroke-linecap='round'/>"
    "<path d='M14 10 l6 6 M50 10 l-6 6' stroke='%23F2D78F' stroke-width='4' stroke-linecap='round'/>",
    # bottiglia che stappa
    "<path d='M26 60 V30 Q26 24 29 20 V12 H35 V20 Q38 24 38 30 V60Z' fill='%231F4A3A'/><rect x='26' y='36' width='12' height='12' fill='%23F2D78F'/><rect x='29' y='10' width='6' height='6' fill='%23E9C46A'/>"
    "<path d='M32 8 Q26 2 20 6 M32 8 Q38 0 46 4 M32 8 Q34 2 32 -2' stroke='%23F2D78F' stroke-width='2' fill='none' stroke-linecap='round'/>"
    "<circle cx='18' cy='12' r='2' fill='%23F2B5D4'/><circle cx='48' cy='10' r='2' fill='%238FD6EA'/><circle cx='42' cy='18' r='1.4' fill='%23F2D78F'/>",
    # cappellino da festa
    "<path d='M32 4 L50 54 H14Z' fill='%23F2B5D4'/><path d='M32 4 L36 15 L22 26 L20 32 L40 21 L43 30 L17 42 L16 48 L46 36 L49 46 L14 54' fill='none' stroke='%23E9C46A' stroke-width='3'/>"
    "<circle cx='32' cy='5' r='5' fill='%23E9C46A'/><path d='M12 54 Q32 62 52 54' stroke='%238FD6EA' stroke-width='4' fill='none' stroke-linecap='round'/>",
    # stella cometa
    "<path d='M38 8 l5 11 12 1 -9 8 3 12 -11 -6 -11 6 3 -12 -9 -8 12 -1Z' fill='%23F2D78F'/>"
    "<path d='M28 34 L8 54 M24 30 L10 40 M32 38 L22 56' stroke='%23F2D78F' stroke-width='2.4' stroke-linecap='round' opacity='.7'/><circle cx='12' cy='24' r='1.6' fill='%23D9DEEA'/><circle cx='54' cy='50' r='1.6' fill='%23D9DEEA'/>",
    # palloncino
    "<path d='M32 46 Q30 54 34 60' stroke='%23D9DEEA' stroke-width='1.4' fill='none'/>"
    "<path d='M32 4 C46 4 52 16 50 26 C48 38 38 46 32 46 C26 46 16 38 14 26 C12 16 18 4 32 4Z' fill='%23E9C46A'/><path d='M29 46 L35 46 L32 50Z' fill='%23C9A13B'/>"
    "<ellipse cx='24' cy='16' rx='4' ry='6' fill='%23FFF6D8' opacity='.6' transform='rotate(-20 24 16)'/>",
    # razzo
    "<path d='M32 4 Q42 12 42 30 V44 H22 V30 Q22 12 32 4Z' fill='%23D9DEEA'/><circle cx='32' cy='24' r='5' fill='%238FD6EA' stroke='%23F2D78F' stroke-width='2'/>"
    "<path d='M22 34 L14 46 H22Z M42 34 L50 46 H42Z' fill='%23F2B5D4'/><path d='M26 44 Q32 62 38 44Z' fill='%23E9C46A'/><path d='M29 44 Q32 54 35 44Z' fill='%23FF8A2A'/>",
]

RINGRAZIAMENTO = [
    # zucca
    "<path d='M32 14 q2 -8 8 -9' stroke='%235C7A2E' stroke-width='4' fill='none' stroke-linecap='round'/><path d='M40 8 q8 0 8 6 q-6 0 -8 -6Z' fill='%237CA04A'/>"
    "<ellipse cx='20' cy='36' rx='14' ry='20' fill='%23D9620F'/><ellipse cx='44' cy='36' rx='14' ry='20' fill='%23D9620F'/><ellipse cx='32' cy='36' rx='14' ry='22' fill='%23F28C2B'/>"
    "<path d='M26 18 Q22 36 26 56 M38 18 Q42 36 38 56' stroke='%23D9741A' stroke-width='2' fill='none'/>",
    # ghianda
    "<path d='M16 26 Q32 10 48 26 Q32 32 16 26Z' fill='%237A4B2A'/><path d='M32 16 V8' stroke='%235C3A24' stroke-width='3' stroke-linecap='round'/>"
    "<path d='M20 28 L24 24 M28 28 L32 24 M36 28 L40 24' stroke='%235E3820' stroke-width='1.6'/>"
    "<path d='M19 28 H45 Q46 50 32 58 Q18 50 19 28Z' fill='%23C9925A'/><ellipse cx='26' cy='38' rx='2.4' ry='6' fill='%23E0B07A' opacity='.7'/>",
    # fetta di torta
    "<path d='M8 44 L56 30 V50 L8 58Z' fill='%23E3B341'/><path d='M8 44 L56 30 L56 36 L8 50Z' fill='%23D9741A'/>"
    "<path d='M8 44 Q20 34 30 38 Q42 28 56 30 L8 44Z' fill='%23E8C07A'/><path d='M8 40 Q14 36 18 40 Q22 36 26 40 Q30 34 34 38 Q38 32 42 36 Q48 30 56 30' stroke='%23C98A3A' stroke-width='3' fill='none' stroke-linecap='round'/>"
    "<ellipse cx='40' cy='26' rx='8' ry='4' fill='%23FFFFFF'/>",
    # pannocchia
    "<path d='M32 6 Q44 8 44 30 Q44 50 32 56 Q20 50 20 30 Q20 8 32 6Z' fill='%23F2C14E'/>"
    "<path d='M25 16 H39 M23 24 H41 M22 32 H42 M23 40 H41 M26 48 H38 M28 10 V50 M32 7 V55 M36 10 V50' stroke='%23D9A22A' stroke-width='1.4'/>"
    "<path d='M32 60 Q14 50 14 26 Q22 40 30 46Z M32 60 Q50 50 50 26 Q42 40 34 46Z' fill='%239CBF5A'/>",
    # foglia d'acero
    "<path d='M32 4 L36 16 L44 12 L42 24 L54 22 L48 32 L56 36 L44 40 L46 48 L34 44 L33 60 H31 L30 44 L18 48 L20 40 L8 36 L16 32 L10 22 L22 24 L20 12 L28 16Z' fill='%23C83E35'/>"
    "<path d='M32 44 V20 M32 34 L22 28 M32 34 L42 28' stroke='%23992E28' stroke-width='1.4' fill='none'/>",
    # mela
    "<path d='M32 18 Q30 8 34 4' stroke='%235C3A24' stroke-width='3' fill='none' stroke-linecap='round'/><path d='M34 12 Q44 4 50 10 Q42 16 34 12Z' fill='%237CA04A'/>"
    "<path d='M32 20 Q20 12 12 24 Q6 40 16 52 Q24 62 32 56 Q40 62 48 52 Q58 40 52 24 Q44 12 32 20Z' fill='%23C83E35'/>"
    "<ellipse cx='22' cy='30' rx='4' ry='7' fill='%23FFFFFF' opacity='.3' transform='rotate(20 22 30)'/>",
]

# ─── Decori ripetuti ────────────────────────────────────────────────────────

def snow_cap(w=200, h=16, shade='%23DCE6EE'):
    """Neve accumulata sul bordo alto (si stira in larghezza)."""
    return uri(f"<path d='M0 0 H{w} V6 Q{w-8} 14 {w-18} 9 Q{w-30} 15 {w-44} 8 Q{w-60} 16 {w-76} 9 Q{w-92} 13 {w-104} 7 Q{w-118} 15 {w-134} 9 Q{w-148} 14 {w-160} 8 Q{w-176} 16 {w-188} 9 Q{w-196} 12 0 7Z' fill='{shade}'/>"
               f"<path d='M0 0 H{w} V4 Q{w-8} 12 {w-18} 7 Q{w-30} 13 {w-44} 6 Q{w-60} 14 {w-76} 7 Q{w-92} 11 {w-104} 5 Q{w-118} 13 {w-134} 7 Q{w-148} 12 {w-160} 6 Q{w-176} 14 {w-188} 7 Q{w-196} 10 0 5Z' fill='%23FFFFFF'/>",
               w, h, "preserveAspectRatio='none'")


def drips(c):
    """Melma che cola dal bordo basso (si ripete in orizzontale)."""
    return uri(f"<path d='M0 0 H40 V2 Q36 2 35 6 Q34 10 32 6 Q30 2 26 3 Q22 4 21 9 Q20 14 18 9 Q16 3 10 3 Q6 3 5 5 Q4 8 2 4 Q1 2 0 2Z' fill='{c}'/>", 40, 14)


def web(c):
    """Ragnatela nell'angolo in alto a destra."""
    return uri(f"<g fill='none' stroke='{c}' stroke-width='1'><path d='M60 0 L8 0 M60 0 L14 26 M60 0 L34 46 M60 0 L60 52'/>"
               f"<path d='M48 0 Q50 6 50 6 Q54 8 60 10'/><path d='M34 0 Q38 10 40 12 Q46 20 48 22 Q54 22 60 24'/><path d='M20 0 Q26 14 28 18 Q34 28 38 32 Q48 36 60 38'/></g>", 60, 52)


def holly():
    return uri("<path d='M30 10 Q22 2 14 6 Q16 8 14 12 Q18 12 18 16 Q22 12 30 10Z' fill='%232E8B57'/><path d='M30 10 Q38 2 46 6 Q44 8 46 12 Q42 12 42 16 Q38 12 30 10Z' fill='%231F6E4A'/>"
               "<circle cx='27' cy='12' r='3' fill='%23D64545'/><circle cx='33' cy='12' r='3' fill='%23D64545'/><circle cx='30' cy='8' r='3' fill='%23E05252'/>", 60, 22)


def pattern(glyphs, size=120):
    return uri(glyphs, size, size)


FLAKE = lambda x, y, s, c: f"<g transform='translate({x} {y}) scale({s})' stroke='{c}' stroke-width='1.4' stroke-linecap='round' fill='none'><path d='M0 -7 V7 M-6 -3.5 L6 3.5 M-6 3.5 L6 -3.5 M-2 -6 L0 -4 L2 -6 M-2 6 L0 4 L2 6'/></g>"
STAR = lambda x, y, s, c: f"<path transform='translate({x} {y}) scale({s})' fill='{c}' d='M0 -5 L1.2 -1.6 L4.8 -1.5 L1.9 .7 L2.9 4.1 L0 2.1 L-2.9 4.1 L-1.9 .7 L-4.8 -1.5 L-1.2 -1.6Z'/>"
LEAF = lambda x, y, r, c: f"<path transform='translate({x} {y}) rotate({r})' fill='{c}' d='M0 -7 C5 -4 5 4 0 7 C-5 4 -5 -4 0 -7Z'/>"
EGG = lambda x, y, r, c: f"<path transform='translate({x} {y}) rotate({r})' fill='{c}' d='M0 -7 C5 -7 6 2 6 3 C6 6 3.4 8 0 8 C-3.4 8 -6 6 -6 3 C-6 2 -5 -7 0 -7Z'/>"
BAT = lambda x, y, s, c: f"<path transform='translate({x} {y}) scale({s})' fill='{c}' d='M0 0 C-3 -5 -8 -5 -13 -2 C-10 0 -10 3 -12 5 C-8 3 -5 3 -3 5 C-2 3 -1 2 0 3 C1 2 2 3 3 5 C5 3 8 3 12 5 C10 3 10 0 13 -2 C8 -5 3 -5 0 0Z'/>"

# ─── Le feste ───────────────────────────────────────────────────────────────

FESTE = {
    'natale': dict(
        chars=NATALE, t=['#D64545', '#1F6E4A', '#C9952A', '#B83232', '#2E8B57', '#D64545', '#1F6E4A', '#C9952A'],
        tn=['#C0392B', '#1F6E4A', '#C9952A', '#2E8B57'],
        head='linear-gradient(180deg, #C0392B, #A93226)', head_text='#FFFFFF', head_muted='rgba(255,255,255,.75)',
        bar='linear-gradient(180deg, #1F6E4A, #17583A)', bar_text='#FFFFFF', bar_muted='rgba(255,255,255,.7)',
        btn='linear-gradient(180deg, #E05252, #B83232)', btn_text='#FFFFFF',
        btn_layer=f"{snow_cap()} top / 100% 6px no-repeat",
        card_layer=f"{snow_cap()} top / 100% 12px no-repeat, {holly()} top 4px right 8px / 60px 22px no-repeat",
        hc_layer=f"{snow_cap()} top / 100% 12px no-repeat",
        card_border='#E6C9C0',
        meter='repeating-linear-gradient(-45deg, #D64545 0 6px, #FFFFFF 6px 12px)',
        bg=pattern(FLAKE(20, 24, 1, '%239DBBD0') + FLAKE(80, 60, .8, '%239DBBD0') + FLAKE(44, 98, 1.1, '%23C7D9E6') + "<circle cx='100' cy='18' r='1.6' fill='%23C7D9E6'/><circle cx='10' cy='70' r='1.4' fill='%23C7D9E6'/>"),
        bg_opacity=.55,
    ),
    'halloween': dict(
        chars=HALLOWEEN, t=['#FF8A2A', '#B98CF0', '#73D13A', '#FF8A2A', '#B98CF0', '#F2617A', '#E8DDF5', '#B98CF0'],
        tn=['#FF8A2A', '#B98CF0', '#73D13A', '#F2617A'],
        head='linear-gradient(180deg, #2C1A40, #1D1229)', head_text='#FFE7CC', head_muted='rgba(255,231,204,.7)',
        bar='linear-gradient(180deg, #1D1229, #120A1A)', bar_text='#FF8A2A', bar_muted='rgba(255,231,204,.6)',
        btn='linear-gradient(180deg, #FF9A3D, #E8701A)', btn_text='#1A0F05',
        btn_layer=f"{drips('%233A2550')} bottom left / 30px 7px repeat-x",
        card_layer=f"{web('rgba(232,221,245,.28)')} top right / 60px 52px no-repeat",
        card_border='#4A3560',
        meter='repeating-linear-gradient(-45deg, #FF8A2A 0 6px, #2A1B3D 6px 12px)',
        bg=pattern(BAT(30, 30, .9, '%23B98CF0') + BAT(90, 80, .7, '%23FF8A2A') + "<circle cx='96' cy='22' r='1.2' fill='%23E8DDF5'/><circle cx='20' cy='96' r='1.2' fill='%23E8DDF5'/>"),
        bg_opacity=.18,
    ),
    'pasqua': dict(
        chars=PASQUA, t=['#F4A3B5', '#7A58BE', '#5FAE6E', '#E0B53A', '#8FD6B8', '#B8A3E8'],
        tn=['#7A58BE', '#E88AA0', '#5FAE6E', '#E0B53A'],
        head='linear-gradient(180deg, #A48BDB, #8B6CC9)', head_text='#FFFFFF', head_muted='rgba(255,255,255,.75)',
        bar='linear-gradient(180deg, #B6E8D2, #9EDBC0)', bar_text='#3A2F4F', bar_muted='rgba(58,47,79,.6)',
        btn='radial-gradient(circle at 25% 30%, rgba(255,255,255,.35) 0 2.5px, transparent 3px) 0 0 / 14px 14px, linear-gradient(180deg, #9A7AD6, #7A58BE)', btn_text='#FFFFFF',
        btn_layer=None,
        card_layer=f"{uri(EGG(46, 14, 18, '%23F4B6C2') + EGG(56, 20, -14, '%239EDBC0'), 64, 32)} top right / 64px 32px no-repeat",
        card_border='#E5D3EE',
        meter='repeating-linear-gradient(-45deg, #F4A3B5 0 6px, #9EDBC0 6px 12px)',
        bg=pattern(EGG(24, 24, -15, '%23F4B6C2') + EGG(88, 70, 12, '%239EDBC0') + EGG(40, 100, 0, '%23B8A3E8') + "<circle cx='100' cy='20' r='2' fill='%23F8E58C'/>"),
        bg_opacity=.4,
    ),
    'capodanno': dict(
        chars=CAPODANNO, t=['#E9C46A', '#F2B5D4', '#8FD6EA', '#E9C46A', '#D9DEEA', '#F2B5D4'],
        tn=['#E9C46A', '#F2B5D4', '#8FD6EA', '#D9DEEA'],
        head='linear-gradient(180deg, #141C3A, #0B1022)', head_text='#F2D78F', head_muted='rgba(242,215,143,.7)',
        bar='linear-gradient(180deg, #0B1022, #070B17)', bar_text='#F2D78F', bar_muted='rgba(217,222,234,.6)',
        btn='linear-gradient(180deg, #F7E2A6, #E0B550 55%, #C9A13B)', btn_text='#0B1022',
        btn_layer=None,
        card_layer=f"{uri(STAR(50, 10, 1, '%23E9C46A') + STAR(58, 22, .6, '%23D9DEEA') + '<rect x=\'40\' y=\'18\' width=\'3\' height=\'6\' rx=\'1\' fill=\'%23F2B5D4\' transform=\'rotate(30 41 21)\'/>', 64, 32)} top right / 64px 32px no-repeat",
        card_border='rgba(233,196,106,.45)',
        meter='linear-gradient(90deg, #C9A13B, #F7E2A6, #E0B550)',
        bg=pattern(STAR(20, 20, .8, '%23E9C46A') + STAR(90, 64, .6, '%23D9DEEA') + "<circle cx='50' cy='100' r='1.4' fill='%23F2B5D4'/><circle cx='104' cy='18' r='1.2' fill='%238FD6EA'/><circle cx='12' cy='76' r='1.2' fill='%23D9DEEA'/>"),
        bg_opacity=.35,
    ),
    'ringraziamento': dict(
        chars=RINGRAZIAMENTO, t=['#B4541E', '#C9A23A', '#5F8A2F', '#E08A3C', '#7A4B2A', '#C83E35'],
        tn=['#B4541E', '#C9A23A', '#5F8A2F', '#C83E35'],
        head='linear-gradient(180deg, #B4541E, #943F12)', head_text='#FFFFFF', head_muted='rgba(255,255,255,.75)',
        bar='linear-gradient(180deg, #7A4B2A, #5E3820)', bar_text='#F2C14E', bar_muted='rgba(255,255,255,.65)',
        btn='linear-gradient(180deg, #E08A3C, #B4541E)', btn_text='#FFFFFF',
        btn_layer=None,
        card_layer=f"{uri(LEAF(50, 12, 30, '%23E08A3C') + LEAF(58, 22, -20, '%23B4541E'), 64, 32)} top right / 64px 32px no-repeat",
        card_border='#E8CBA6',
        meter='repeating-linear-gradient(-45deg, #E08A3C 0 6px, #B4541E 6px 12px)',
        bg=pattern(LEAF(24, 24, 30, '%23E08A3C') + LEAF(90, 70, -40, '%23B4541E') + LEAF(44, 100, 70, '%23C9A23A')),
        bg_opacity=.3,
    ),
}


# Schede delle pagine decorate a fondo: (selettore, posizione e misura del personaggio, nasconde il numero d'ordine?)
CHAR_CARDS = [
    ('.tpl', 'right 8px bottom 8px / 30px 30px', None),                                         # Spiritualità
    ('#tab-schede .list-row.al-row, #tab-avvia .list-row[data-sc]', 'right 14px center / 44px 44px', '::after'),  # Allenamento
    ('.dt-meal', 'right 12px bottom 10px / 34px 34px', None),                                      # Alimentazione
]
# Riquadri grandi delle pagine principali: neve/ragnatela/… come le schede comuni
DECO_CARDS = ['.wk', '.dt-day', '.cm-card', '.dur-card', '.dt-day.wn']
# Pulsanti propri delle pagine
PAGE_BTNS = ['.dt-reg', '.page-tabs > button[aria-selected="true"]', '.page-tabs > .active']


def css():
    out = [START, '/* Barre, pulsanti, schede e sfondo prendono i colori e i personaggi della festa. */']
    for k, f in FESTE.items():
        R = f':root[data-festa="{k}"]'
        btn_bg = (f"{f['btn_layer']}, " if f['btn_layer'] else '') + f['btn']
        card_layer = f['card_layer']
        hc_layer = f.get('hc_layer', card_layer)
        n = len(f['chars'])
        tn = f['tn']
        out += [
            f'/* ── {k} ── */',
            # Colori delle schede delle pagine (--tn1…4 usati da Alimentazione, Allenamento, Spiritualità, Passioni…)
            f':root[data-theme][data-festa="{k}"] {{ --tn1: {tn[0]}; --tn2: {tn[1]}; --tn3: {tn[2]}; --tn4: {tn[3]}; }}',
            # Sfondo con motivo leggero
            f'{R} body.zen {{ isolation: isolate; }}',
            f'{R} body.zen::before {{ content: ""; position: fixed; inset: 0; z-index: -1; pointer-events: none; background: {f["bg"]} 0 0 / 120px 120px repeat; opacity: {f["bg_opacity"]}; }}',
            # Barra in alto e in basso a colori pieni: i token si ridefiniscono solo lì dentro
            f'{R} .zen-header {{ background: {f["head"]}; --text: {f["head_text"]}; --muted: {f["head_muted"]}; color: {f["head_text"]}; -webkit-backdrop-filter: none; backdrop-filter: none; box-shadow: 0 2px 10px rgba(0,0,0,.18); }}',
            f'{R} .zen-tabbar {{ background: {f["bar"]}; --text: {f["bar_text"]}; --muted: {f["bar_muted"]}; border-top-color: transparent; -webkit-backdrop-filter: none; backdrop-filter: none; }}',
            # Pulsanti principali
            f'{R} .btn.accent, {R} .btn.primary, {R} .segmented > button[aria-pressed="true"], {R} .segmented > button.active, {R} .chip.active, {R} .chip[aria-pressed="true"], '
            + ', '.join(f'{R} {b}' for b in PAGE_BTNS) + f' {{ background: {btn_bg}; color: {f["btn_text"]}; border-color: transparent; }}',
            f'{R} .btn:not(.accent):not(.primary):not(.ghost) {{ border-color: {f["card_border"]}; }}',
            f'{R} .de-addfood {{ border-color: var(--primary); color: var(--primary); background: color-mix(in srgb, var(--primary) 10%, var(--card)); }}',
            # Schede, liste e riquadri
            f'{R} .card:not(.flat), {R} .list, {R} .tile {{ background: {card_layer}, var(--card); border-color: {f["card_border"]}; }}',
            ', '.join(f'{R} {c}' for c in DECO_CARDS) + f' {{ background: {card_layer}, linear-gradient(135deg, color-mix(in srgb, var(--tn1) 12%, var(--card)), var(--card) 70%); border-color: {f["card_border"]}; }}',
            f'{R} .meter-fill {{ background: {f["meter"]}; }}',
            f'{R} .zen-eyebrow {{ color: var(--primary); }}',
            f'{R} .cm-tiles > div {{ background: color-mix(in srgb, var(--primary) 12%, var(--surface)); }}',
            f'{R} .cm-day.today {{ box-shadow: inset 0 0 0 2px var(--primary); background: color-mix(in srgb, var(--primary) 14%, transparent); }}',
        ]
        # Schede delle sezioni: colore della festa e un personaggio diverso per scheda
        for i, (char, t) in enumerate(zip(f['chars'], f['t'])):
            nth = f':nth-child({n}n+{i + 1})'
            out.append(f'{R} .hc{nth} {{ --t: {t}; }}')
            sels = ['.hc'] + [x.strip() for sel, _, _ in CHAR_CARDS for x in sel.split(',')]
            out.append(', '.join(f'{R} {x}{nth}' for x in sels) + f' {{ --festa-char: {uri(char)}; }}')
        out.append(f'{R} .hc:not(.soon) {{ background: {hc_layer}, var(--festa-char) right 12px bottom 10px / 46px 46px no-repeat, linear-gradient(120deg, color-mix(in srgb, var(--t) 22%, var(--card)), var(--card) 72%); border-color: {f["card_border"]}; }}')
        out.append(f'{R} .hc.w:not(.soon) {{ background: {hc_layer}, var(--festa-char) right 18px center / 56px 56px no-repeat, linear-gradient(120deg, color-mix(in srgb, var(--t) 22%, var(--card)), var(--card) 72%); }}')
        for sel, pos, hide in CHAR_CARDS:
            sels = [x.strip() for x in sel.split(',')]
            deco = '' if sel.startswith('.cm-tiles') else f'{hc_layer}, '
            out.append(', '.join(f'{R} {x}' for x in sels) + f' {{ background: {deco}var(--festa-char) {pos} no-repeat, linear-gradient(120deg, color-mix(in srgb, var(--t, var(--tn1)) 16%, var(--card)), var(--card) 75%); border-color: {f["card_border"]}; }}')
            if hide:
                out.append(', '.join(f'{R} {x}{hide}' for x in sels) + ' { content: none; }')
    out += [
        ':root[data-festa] .hc-num { display: none; }',
        ':root[data-festa] .hc.w .hc-title, :root[data-festa] .hc.w .hc-meta { padding-right: 64px; }',
        ':root[data-festa] .hc.t .hc-ic { margin-right: 52px; }',
        ':root[data-festa] #tab-schede .list-row.al-row, :root[data-festa] #tab-avvia .list-row[data-sc] { padding-right: 68px; }',
        ':root[data-festa] .zen-header-title img { filter: drop-shadow(0 1px 2px rgba(0,0,0,.25)); }',
        END,
    ]
    return '\n'.join(out)


def main():
    text = ZEN.read_text()
    block = css()
    if START in text:
        text = re.sub(re.escape(START) + r'.*?' + re.escape(END), lambda m: block, text, flags=re.S)
    else:
        text = text.rstrip('\n') + '\n\n' + block + '\n'
    ZEN.write_text(text)
    print(f'feste: {len(block)} caratteri scritti in {ZEN.relative_to(ROOT)}')


if __name__ == '__main__':
    main()
