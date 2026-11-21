"""
Web Search & URL Scraper for AMU Student Services
Fetches live information from amu.ac.in and amucoe.ac.in,
or extracts clean text from provided web links.
"""
import urllib.request
import urllib.parse
import re
from bs4 import BeautifulSoup


def scrape_url_text(url: str, max_chars: int = 15000) -> dict:
    """
    Fetches and extracts clean main text content from a given web URL.
    """
    try:
        req = urllib.request.Request(
            url,
            headers={
                "User-Agent": (
                    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
                    "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
                )
            },
        )
        with urllib.request.urlopen(req, timeout=10) as resp:
            content_type = resp.headers.get("Content-Type", "").lower()
            raw_data = resp.read()

            if "application/pdf" in content_type or url.lower().endswith(".pdf"):
                from knowledge_base import extract_text_from_pdf
                text = extract_text_from_pdf(raw_data)
                title = url.split("/")[-1]
            else:
                html = raw_data.decode("utf-8", errors="ignore")
                soup = BeautifulSoup(html, "html.parser")
                # Remove scripts, styles, navigations
                for tag in soup(["script", "style", "nav", "footer", "header", "aside"]):
                    tag.decompose()
                title = soup.title.string.strip() if soup.title and soup.title.string else url
                text = "\n".join([p.get_text(strip=True) for p in soup.find_all(["p", "h1", "h2", "h3", "li", "td"]) if p.get_text(strip=True)])

            clean_text = re.sub(r'\s+', ' ', text).strip()
            return {
                "success": True,
                "title": title,
                "url": url,
                "text": clean_text[:max_chars],
            }
    except Exception as e:
        return {"success": False, "error": str(e), "title": url, "text": ""}


def search_amu_web(query: str, max_results: int = 4) -> list[dict]:
    """
    Searches the web for AMU notices, syllabi, circulars matching the query.
    Uses DuckDuckGo HTML endpoint with AMU domain filtering.
    """
    try:
        search_query = f"site:amu.ac.in OR site:amucoe.ac.in {query}"
        url = "https://html.duckduckgo.com/html/?q=" + urllib.parse.quote(search_query)
        req = urllib.request.Request(
            url,
            headers={
                "User-Agent": (
                    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
                    "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
                )
            },
        )
        with urllib.request.urlopen(req, timeout=7) as resp:
            soup = BeautifulSoup(resp.read(), "html.parser")
            results = []
            for r in soup.select(".result")[:max_results]:
                title_elem = r.select_one(".result__title a")
                snippet_elem = r.select_one(".result__snippet")
                url_elem = r.select_one(".result__url")
                if title_elem and snippet_elem:
                    title = title_elem.get_text(strip=True)
                    snippet = snippet_elem.get_text(strip=True)
                    link = title_elem.get("href", "")
                    if "duckduckgo.com/l/?uddg=" in link:
                        link = urllib.parse.unquote(link.split("uddg=")[1].split("&")[0])
                    results.append({
                        "source": f"AMU Web: {title[:40]}",
                        "source_url": link or "https://www.amu.ac.in",
                        "text": snippet,
                        "chunk_id": f"WEB_{len(results)+1}",
                        "programme": "ALL",
                    })
            return results
    except Exception:
        # Graceful fallback if network is restricted or offline
        return []
