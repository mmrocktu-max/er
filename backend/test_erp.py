import sys
from langgraph.checkpoint.memory import MemorySaver
from graph import build_graph

def main():
    graph_builder = build_graph()
    memory = MemorySaver()
    
    # Compile graph with interruption before the human_approval_node
    app = graph_builder.compile(checkpointer=memory, interrupt_before=["human_approval_node"])
    
    print("\n==================================================")
    print("      TEST 1: AUTO-APPROVE (PO under ₹500)      ")
    print("==================================================")
    # Scenario 1: Will buy SKU-99 Widget (Hardware) - Approx ₹24 * 10 = ₹240
    initial_state_1 = {
        "item_name": "SKU-99 Widget",
        "current_stock": 2,
        "stock_threshold": 10,
        "demand_level": "High",
        "draft_po": None,
        "po_approved": True,
        "recommended_price": 0.0,
        "ledger_balance": 10000.0,
        "messages": []
    }
    
    config_1 = {"configurable": {"thread_id": "auto_approve_test"}}
    
    for event in app.stream(initial_state_1, config_1):
        for key, value in event.items():
            print(f"[{key.upper()}]")
            if "messages" in value and value["messages"]:
                print(f"  > {value['messages'][-1]}")

    final_state_1 = app.get_state(config_1).values
    print(f"\n[FINAL STATE 1]")
    print(f"  Ledger Balance: ₹{final_state_1.get('ledger_balance', 0):.2f}")
    print(f"  Recommended Price: ₹{final_state_1.get('recommended_price', 0):.2f}")


    print("\n==================================================")
    print("   TEST 2: HUMAN-IN-THE-LOOP (PO over ₹500)     ")
    print("==================================================")
    # Scenario 2: Will buy Laptops (Electronics) - Approx ₹1200 * 5 = ₹6000
    initial_state_2 = {
        "item_name": "Laptops",
        "current_stock": 1,
        "stock_threshold": 5,
        "demand_level": "Low",
        "draft_po": None,
        "po_approved": True,
        "recommended_price": 0.0,
        "ledger_balance": 10000.0,
        "messages": []
    }
    
    config_2 = {"configurable": {"thread_id": "hitl_test"}}
    
    for event in app.stream(initial_state_2, config_2):
        for key, value in event.items():
            print(f"[{key.upper()}]")
            if "messages" in value and value["messages"]:
                print(f"  > {value['messages'][-1]}")
                
    # Check if we are paused
    current_state = app.get_state(config_2)
    if current_state.next:
        print(f"\n[SYSTEM PAUSED] Graph execution halted.")
        print(f"  Next node to run: {current_state.next}")
        
        draft = current_state.values.get('draft_po')
        print(f"\n--- MANAGER DASHBOARD ---")
        print(f"PENDING PURCHASE ORDER:")
        print(f"  Supplier: {draft.get('supplier_id')}")
        print(f"  Quantity: {draft.get('quantity')}")
        print(f"  Unit Price: ₹{draft.get('unit_price')}")
        print(f"  Total Cost: ₹{draft.get('total_cost')}")
        print(f"  Reasoning: {draft.get('reasoning')}")
        print(f"-------------------------\n")
        
        # We simulate the manager approving it by updating the state
        print(">> Manager hits [APPROVE]")
        app.update_state(config_2, {"po_approved": True})
        
        print(">> Resuming execution...")
        for event in app.stream(None, config_2):
            for key, value in event.items():
                print(f"[{key.upper()}]")
                if "messages" in value and value["messages"]:
                    print(f"  > {value['messages'][-1]}")
                    
    final_state_2 = app.get_state(config_2).values
    print(f"\n[FINAL STATE 2]")
    print(f"  Ledger Balance: ₹{final_state_2.get('ledger_balance', 0):.2f}")
    print(f"  Recommended Price: ₹{final_state_2.get('recommended_price', 0):.2f}")


if __name__ == "__main__":
    main()
