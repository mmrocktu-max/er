from pathlib import Path


BACKEND_DIR = Path(__file__).resolve().parent
DATA_DIR = BACKEND_DIR / "data"
UPLOAD_DIR = DATA_DIR / "uploads"
FAISS_INDEX_DIR = DATA_DIR / "faiss_index"


def ensure_data_directories() -> None:
    UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
    FAISS_INDEX_DIR.mkdir(parents=True, exist_ok=True)
