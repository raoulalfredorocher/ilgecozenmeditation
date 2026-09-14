import feedparser
import httpx
from bs4 import BeautifulSoup
from ibm_watsonx_orchestrate.agent_builder.tools import tool


GAZZETTA_RSS_URL = "https://www.gazzetta.it/rss/home.xml"


def _fetch_article_text(url: str, max_chars: int = 1500) -> str:
    """Scarica il testo principale di un articolo dalla sua URL."""
    try:
        resp = httpx.get(url, timeout=10, follow_redirects=True, headers={
            "User-Agent": "Mozilla/5.0 (compatible; WxO-bot/1.0)"
        })
        resp.raise_for_status()
        soup = BeautifulSoup(resp.text, "html.parser")
        # Rimuove script, style e navigazione
        for tag in soup(["script", "style", "nav", "header", "footer", "aside"]):
            tag.decompose()
        # Prova a trovare il corpo dell'articolo
        body = soup.find("article") or soup.find("div", {"class": lambda c: c and "article" in c.lower()})
        text = (body or soup).get_text(separator=" ", strip=True)
        return text[:max_chars]
    except Exception as exc:
        return f"(Impossibile recuperare il testo: {exc})"


@tool
def get_gazzetta_news_summary() -> str:
    """
    Legge i primi 5 articoli dal feed RSS della Gazzetta dello Sport (gazzetta.it)
    e restituisce titolo, link e un estratto del contenuto per ciascuno,
    pronto per essere riassunto dall'agente.

    Returns:
        Una stringa contenente i dati dei 5 articoli più recenti.
    """
    feed = feedparser.parse(GAZZETTA_RSS_URL)

    if not feed.entries:
        return "Nessun articolo trovato nel feed RSS della Gazzetta.it."

    articles = feed.entries[:5]
    output_parts: list[str] = []

    for i, entry in enumerate(articles, start=1):
        title = entry.get("title", "Titolo non disponibile")
        link = entry.get("link", "")
        summary_rss = entry.get("summary", "")

        # Usa il riassunto RSS se presente, altrimenti scarica la pagina
        if summary_rss:
            content_snippet = BeautifulSoup(summary_rss, "html.parser").get_text(strip=True)[:800]
        else:
            content_snippet = _fetch_article_text(link, max_chars=800)

        output_parts.append(
            f"### Articolo {i}\n"
            f"**Titolo:** {title}\n"
            f"**URL:** {link}\n"
            f"**Estratto:** {content_snippet}\n"
        )

    return "\n---\n".join(output_parts)
