import os
from pathlib import Path

import requests
import jwt
from dotenv import load_dotenv

load_dotenv()
secret = os.getenv("JWT_SECRET")
if not secret:
    raise RuntimeError("JWT_SECRET must be set in .env before running this helper.")

token = jwt.encode({"sub": "test@test.com", "name": "Test User"}, secret, algorithm="HS256")

with (Path(__file__).resolve().parent / "supplier_data.xlsx").open("rb") as f:
    files = {"file": f}
    headers = {"Authorization": f"Bearer {token}"}
    resp = requests.post("http://localhost:8000/upload-excel", files=files, headers=headers)
    print(resp.status_code)
    print(resp.text)
