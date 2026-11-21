"""
Hybrid RAG Engine — BM25 + Vector Search
Dynamically re-indexes whenever documents are added or updated.
"""
import re
import math
from knowledge_base import get_all_chunks

def tokenize(text: str) -> list[str]:
    return re.findall(r'\b\w+\b', text.lower())

class BM25:
    def __init__(self, corpus: list[list[str]], k1=1.5, b=0.75):
        self.k1 = k1
        self.b = b
        self.corpus = corpus
        self.N = len(corpus)
        self.avgdl = sum(len(d) for d in corpus) / max(self.N, 1)
        self.df = {}
        self.idf = {}
        self._build_df()
        self._build_idf()

    def _build_df(self):
        for doc in self.corpus:
            seen = set()
            for term in doc:
                if term not in seen:
                    self.df[term] = self.df.get(term, 0) + 1
                    seen.add(term)

    def _build_idf(self):
        for term, df in self.df.items():
            self.idf[term] = math.log((self.N - df + 0.5) / (df + 0.5) + 1)

    def score(self, query_terms: list[str], doc_idx: int) -> float:
        if doc_idx >= len(self.corpus):
            return 0.0
        doc = self.corpus[doc_idx]
        dl = len(doc)
        tf_map: dict[str, int] = {}
        for t in doc:
            tf_map[t] = tf_map.get(t, 0) + 1
        score = 0.0
        for term in query_terms:
            if term not in self.idf:
                continue
            tf = tf_map.get(term, 0)
            numerator = tf * (self.k1 + 1)
            denominator = tf + self.k1 * (1 - self.b + self.b * dl / max(self.avgdl, 0.001))
            score += self.idf[term] * numerator / denominator
        return score

    def get_scores(self, query_terms: list[str]) -> list[float]:
        return [self.score(query_terms, i) for i in range(self.N)]


_chunks = []
_corpus = []
_bm25 = None
_vocab = {}
_doc_vecs = None
_vector_available = False


def _build_vocab(corpus: list[list[str]]) -> dict[str, int]:
    vocab: dict[str, int] = {}
    for doc in corpus:
        for term in doc:
            if term not in vocab:
                vocab[term] = len(vocab)
    return vocab


def _vectorize(doc: list[str], vocab: dict[str, int]):
    import numpy as np
    vec = np.zeros(len(vocab), dtype=np.float32)
    for t in doc:
        if t in vocab:
            vec[vocab[t]] += 1.0
    norm = np.linalg.norm(vec)
    return vec / norm if norm > 0 else vec


def reindex():
    global _chunks, _corpus, _bm25, _vocab, _doc_vecs, _vector_available
    _chunks = get_all_chunks()
    _texts = [c["text"] for c in _chunks]
    _corpus = [tokenize(t) for t in _texts]
    _bm25 = BM25(_corpus)

    try:
        import numpy as np
        _vocab = _build_vocab(_corpus)
        if _vocab and len(_corpus) > 0:
            _doc_vecs = np.array([_vectorize(d, _vocab) for d in _corpus])
            _vector_available = True
        else:
            _vector_available = False
    except Exception:
        _vector_available = False


# Initialize index once
reindex()


def hybrid_search(query: str, top_k: int = 4, programme_filter: str = None) -> list[dict]:
    """
    Hybrid BM25 + cosine-vector retrieval over all current documents.
    """
    if not _chunks:
        reindex()
    if not _chunks:
        return []

    query_terms = tokenize(query)
    bm25_scores = _bm25.get_scores(query_terms) if _bm25 else [0.0] * len(_chunks)

    if _vector_available and _doc_vecs is not None and len(_vocab) > 0:
        import numpy as np
        q_vec = _vectorize(query_terms, _vocab)
        cosine_scores = _doc_vecs @ q_vec
        bm25_max = max(bm25_scores) if max(bm25_scores) > 0 else 1.0
        combined = [
            (0.5 * (bm25_scores[i] / bm25_max) + 0.5 * float(cosine_scores[i]), i)
            for i in range(len(_chunks))
        ]
    else:
        bm25_max = max(bm25_scores) if max(bm25_scores) > 0 else 1.0
        combined = [(bm25_scores[i] / bm25_max, i) for i in range(len(_chunks))]

    q_lower = query.lower()
    combined_boosted = []
    for score, idx in combined:
        chunk = _chunks[idx]
        src_lower = chunk.get("source", "").lower()
        boost = 0.0
        for token in tokenize(src_lower):
            if len(token) > 2 and token in q_lower:
                boost += 0.35
        combined_boosted.append((score + boost, idx))

    combined_boosted.sort(key=lambda x: x[0], reverse=True)

    results = []
    for score, idx in combined_boosted:
        if idx >= len(_chunks):
            continue
        chunk = dict(_chunks[idx])
        chunk["score"] = round(float(score), 4)
        if programme_filter and chunk.get("programme") not in ("ALL", programme_filter, None):
            continue
        results.append(chunk)
        if len(results) >= top_k:
            break

    return results
