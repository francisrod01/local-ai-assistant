from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter()

# --- request models -------------------------------------------------------

class ChromaInsertRequest(BaseModel):
    num_vectors: int


class ChromaQueryRequest(BaseModel):
    latency: float  # seconds

# --- endpoints ------------------------------------------------------------

@router.post("/chroma/insert")
def chroma_insert(request: ChromaInsertRequest):
    """Dummy handler that records vector insertions and fakes index size."""
    try:
        from metrics import observe_chromadb_insertion, set_chromadb_index_size
        # record the number of vectors
        observe_chromadb_insertion(request.num_vectors)
        # for illustration, pretend each vector takes ~1KB
        set_chromadb_index_size(request.num_vectors * 1024)
    except ImportError:
        pass
    return {"status": "recorded", "vectors": request.num_vectors}


@router.post("/chroma/query")
def chroma_query(request: ChromaQueryRequest):
    """Dummy handler that records query latency."""
    try:
        from metrics import observe_chromadb_query
        observe_chromadb_query(request.latency)
    except ImportError:
        pass
    return {"status": "recorded", "latency": request.latency}
