import pandas as pd
from ingest import ingest_excel
import sys

file_path = r"d:\TAKEOVER\Supplier_Inventory_RAG_Dataset.xlsx"

try:
    df = pd.read_excel(file_path)
    print(f"Read {len(df)} rows from excel.")
    ingest_excel(file_path)
    print("Ingestion completed.")
except Exception as e:
    print(f"Error: {e}")
    sys.exit(1)
