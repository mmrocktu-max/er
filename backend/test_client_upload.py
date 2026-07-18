import os
import traceback
from fastapi.testclient import TestClient
from main import app
import jwt
from dotenv import load_dotenv

load_dotenv()
secret = os.getenv("JWT_SECRET")

client = TestClient(app)

token = jwt.encode({"sub": "test@test.com", "name": "Test User"}, secret, algorithm="HS256")

try:
    with open("supplier_data.xlsx", "rb") as f:
        response = client.post(
            "/upload-excel",
            files={"file": ("supplier_data.xlsx", f, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")},
            headers={"Authorization": f"Bearer {token}"}
        )
    print("STATUS:", response.status_code)
    print("RESPONSE:", response.text)
except Exception as e:
    print("EXCEPTION OCCURRED")
    traceback.print_exc()
