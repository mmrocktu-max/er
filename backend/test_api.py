import requests
import json
import time

API_URL = "http://127.0.0.1:8000"

print("\n==================================================")
print("      TEST 1: AUTO-APPROVE (PO under ₹500)      ")
print("==================================================")
payload_1 = {
    "item_name": "SKU-99 Widget",
    "current_stock": 2,
    "stock_threshold": 10,
    "demand_level": "High",
    "thread_id": "test_api_thread_1"
}

response = requests.post(f"{API_URL}/erp/run", json=payload_1)
print(f"Status Code: {response.status_code}")
print(json.dumps(response.json(), indent=2))


print("\n==================================================")
print("   TEST 2: HUMAN-IN-THE-LOOP (PO over ₹500)     ")
print("==================================================")
payload_2 = {
    "item_name": "Laptops",
    "current_stock": 1,
    "stock_threshold": 5,
    "demand_level": "Low",
    "thread_id": "test_api_thread_2"
}

response_2 = requests.post(f"{API_URL}/erp/run", json=payload_2)
res_data_2 = response_2.json()
print(f"Status Code: {response_2.status_code}")
print(json.dumps(res_data_2, indent=2))

if res_data_2.get("status") == "paused":
    print("\n>>> System paused successfully. Manager reviewing PO...")
    time.sleep(2)
    print(">>> Manager clicks APPROVE on dashboard.")
    
    approve_payload = {
        "thread_id": "test_api_thread_2",
        "approved": True
    }
    
    response_3 = requests.post(f"{API_URL}/erp/approve", json=approve_payload)
    print(f"\nStatus Code: {response_3.status_code}")
    print(json.dumps(response_3.json(), indent=2))
