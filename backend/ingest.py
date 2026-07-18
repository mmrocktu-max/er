import os
from pathlib import Path
import pandas as pd
from dotenv import load_dotenv
from langchain_community.vectorstores import FAISS
from langchain_google_genai import GoogleGenerativeAIEmbeddings
from langchain_core.documents import Document
from paths import FAISS_INDEX_DIR, ensure_data_directories

# Load environment variables (e.g., GEMINI_API_KEY)
load_dotenv(Path(__file__).resolve().parent / ".env")

def load_supplier_data(file_path: str | Path) -> pd.DataFrame:
    """Load the supplier table, ignoring presentation/summary sheets."""
    with pd.ExcelFile(file_path) as workbook:
        preferred = ["Raw_Data", "Supplier_Data", "Suppliers"]
        candidates = [sheet for sheet in preferred if sheet in workbook.sheet_names] + \
                     [sheet for sheet in workbook.sheet_names if sheet not in preferred]

        best_frame: pd.DataFrame | None = None
        for sheet in candidates:
            frame = pd.read_excel(workbook, sheet_name=sheet)
            columns = {str(column).strip().lower() for column in frame.columns}
            if "supplier_id" in columns or "supplier_name" in columns:
                return frame.dropna(how="all")
            if best_frame is None or len(frame.columns) > len(best_frame.columns):
                best_frame = frame

        if best_frame is None:
            raise ValueError("The workbook does not contain a readable sheet.")
        return best_frame.dropna(how="all")


def ingest_excel(file_path: str | Path, index_name: str | Path = FAISS_INDEX_DIR):
    print(f"Loading data from {file_path}...")
    try:
        df = load_supplier_data(file_path)
    except Exception as e:
        print(f"Error reading excel file: {e}")
        return

    documents = []
    for _, row in df.iterrows():
        # Convert row to a string representation for embedding
        content_parts = []
        metadata = {}
        for col_name, value in row.items():
            content_parts.append(f"{col_name}: {value}")
            metadata[col_name] = value
        
        page_content = "\n".join(content_parts)
        
        # We can also store the original row dict in metadata
        doc = Document(page_content=page_content, metadata=metadata)
        documents.append(doc)
    
    print(f"Created {len(documents)} documents. Generating embeddings...")
    
    # Initialize Google Embeddings
    embeddings = GoogleGenerativeAIEmbeddings(model="models/embedding-001")

    # Create FAISS vector store
    vector_store = FAISS.from_documents(documents, embeddings)
    
    # Save the index locally
    ensure_data_directories()
    vector_store.save_local(str(index_name))
    print(f"Successfully created and saved FAISS index to '{index_name}' directory.")

if __name__ == "__main__":
    if not os.getenv("GEMINI_API_KEY"):
        print("WARNING: GEMINI_API_KEY not found in environment variables. Embedding generation might fail.")
    ingest_excel("supplier_data.xlsx")
