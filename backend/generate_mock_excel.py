import pandas as pd

def generate_mock_data():
    data = [
        {
            "Supplier ID": "SUP-01",
            "Item Name": "SKU-99 Widget",
            "Category": "Hardware",
            "Unit Price (₹)": 24.00,
            "Lead Time (Days)": 3,
            "Reliability Score": 0.95,
            "Notes": "Preferred supplier for SKU-99. Consistently meets 3-day lead time."
        },
        {
            "Supplier ID": "SUP-02",
            "Item Name": "SKU-99 Widget",
            "Category": "Hardware",
            "Unit Price (₹)": 22.50,
            "Lead Time (Days)": 7,
            "Reliability Score": 0.80,
            "Notes": "Cheaper alternative for SKU-99, but lead times can vary up to 10 days."
        },
        {
            "Supplier ID": "SUP-03",
            "Item Name": "Office Chairs",
            "Category": "Furniture",
            "Unit Price (₹)": 150.00,
            "Lead Time (Days)": 14,
            "Reliability Score": 0.88,
            "Notes": "Standard supplier for office seating. Good quality."
        },
        {
            "Supplier ID": "SUP-04",
            "Item Name": "Laptops",
            "Category": "Electronics",
            "Unit Price (₹)": 1200.00,
            "Lead Time (Days)": 5,
            "Reliability Score": 0.99,
            "Notes": "Enterprise electronics partner. Very reliable."
        }
    ]

    df = pd.DataFrame(data)
    df.to_excel("supplier_data.xlsx", index=False)
    print("Mock Excel file 'supplier_data.xlsx' generated successfully.")

if __name__ == "__main__":
    generate_mock_data()
