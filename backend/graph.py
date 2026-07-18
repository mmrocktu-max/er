import os
import json
from typing import TypedDict, Optional
from langgraph.graph import StateGraph, END
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_openai import ChatOpenAI
from langchain_anthropic import ChatAnthropic
from langchain_google_genai import GoogleGenerativeAIEmbeddings
from langchain_community.vectorstores import FAISS
from paths import FAISS_INDEX_DIR

def get_llm(provider: Optional[str], model_name: Optional[str], custom_key: Optional[str] = None):
    provider = (provider or "gemini").lower().strip()
    model = (model_name or "gemini-3.5-flash").split(" ")[0].strip()
    
    if provider == "openai":
        api_key = custom_key or os.getenv("OPENAI_API_KEY")
        if not api_key:
            raise ValueError("OpenAI API Key is required but not provided. Set it in Settings.")
        return ChatOpenAI(model=model, temperature=0, openai_api_key=api_key)
        
    elif provider == "anthropic":
        if "sonnet" in model.lower() or "claude-3.5-sonnet" in model.lower():
            model = "claude-3-5-sonnet-20241022"
        elif "opus" in model.lower():
            model = "claude-3-opus-20240229"
        elif "haiku" in model.lower():
            model = "claude-3-5-haiku-20241022"
        else:
            model = "claude-3-5-sonnet-20241022"
            
        api_key = custom_key or os.getenv("ANTHROPIC_API_KEY")
        if not api_key:
            raise ValueError("Anthropic API Key is required but not provided. Set it in Settings.")
        return ChatAnthropic(model=model, temperature=0, anthropic_api_key=api_key)
        
    else: # Default/gemini
        api_key = custom_key or os.getenv("GEMINI_API_KEY")
        if not api_key:
            raise ValueError("Gemini API Key is required but not provided. Set it in Settings.")
        return ChatGoogleGenerativeAI(model=model, temperature=0, google_api_key=api_key)

# Ensure environment variables are loaded
from dotenv import load_dotenv
from pathlib import Path
load_dotenv(Path(__file__).resolve().parent / ".env")

# State Definition
class ERPState(TypedDict):
    item_name: str
    current_stock: int
    stock_threshold: int
    demand_level: str  # "High", "Normal", "Low"
    draft_po: Optional[dict]
    po_approved: bool
    recommended_price: float
    ledger_balance: float
    messages: list  # For tracking execution logs/steps
    api_provider: Optional[str]
    model_name: Optional[str]
    custom_api_key: Optional[str]

# Node 1: Procurement
def procurement_node(state: ERPState):
    messages = state.get("messages", [])
    
    if state["current_stock"] >= state["stock_threshold"]:
        messages.append("Stock levels are sufficient. No PO needed.")
        return {"draft_po": None, "po_approved": True, "messages": messages}
    
    messages.append(f"Low stock detected for {state['item_name']}. Triggering Procurement.")
    
    # Initialize RAG
    index_name = FAISS_INDEX_DIR
    if not os.path.exists(index_name):
        messages.append("FAISS index not found. Cannot select supplier.")
        return {"draft_po": None, "po_approved": False, "messages": messages}

    embeddings = GoogleGenerativeAIEmbeddings(model="models/embedding-001")
    vector_store = FAISS.load_local(str(index_name), embeddings, allow_dangerous_deserialization=True)
    retriever = vector_store.as_retriever(search_kwargs={"k": 2})
    
    # Retrieve docs
    docs = retriever.invoke(state['item_name'])
    context = "\n".join([str(doc.metadata) for doc in docs])
    
    llm = get_llm(state.get("api_provider"), state.get("model_name"), state.get("custom_api_key"))
    
    qty_needed = state["stock_threshold"] - state["current_stock"] + 10 # Buffer
    
    prompt = f"""
    You are a Procurement Agent. We need to restock {qty_needed} units of {state['item_name']}.
    Based on the following supplier data context, pick the best supplier (prioritizing high reliability score, then low lead time, then low price).
    
    Context:
    {context}
    
    Respond STRICTLY in JSON format with no markdown wrappers or extra text. Your response must be a single JSON object with these exact keys:
    - "supplier_id": The ID of the chosen supplier.
    - "unit_price": The price per unit from this supplier (float).
    - "quantity": {qty_needed}
    - "total_cost": quantity * unit_price (float).
    - "reasoning": A brief explanation of why you chose this supplier.
    """
    
    response = llm.invoke(prompt)
    content = response.content
    if isinstance(content, list):
        content = content[0].get("text", "") if isinstance(content[0], dict) else str(content[0])
    elif not isinstance(content, str):
        content = str(content)
    content = content.strip()
    if content.startswith("```json"):
        content = content[7:-3]
    elif content.startswith("```"):
        content = content[3:-3]
    draft_po = json.loads(content)
    # Keep a stable display contract for clients while preserving the
    # supplier_id/reasoning fields used by the agent and audit log.
    draft_po.setdefault("supplier_name", draft_po.get("supplier_id", "Unknown supplier"))
    draft_po.setdefault("item_name", state["item_name"])
    draft_po.setdefault("justification", draft_po.get("reasoning", ""))
    messages.append(f"Drafted PO for ₹{draft_po['total_cost']} from {draft_po['supplier_id']}")
        
    return {"draft_po": draft_po, "messages": messages}

# Edge: Approval Check
def route_approval(state: ERPState):
    if state.get("draft_po") is None:
        return "pricing_node"
    
    # The user defined threshold is ₹500
    if state["draft_po"]["total_cost"] > 500:
        return "human_approval_node"
    else:
        return "pricing_node"

# Node 2: Human Approval (Stub for interruption)
def human_approval_node(state: ERPState):
    # This node executes when the graph is resumed
    messages = state.get("messages", [])
    if state.get("po_approved"):
        messages.append("Human Manager APPROVED the PO.")
    else:
        messages.append("Human Manager REJECTED the PO.")
    return {"messages": messages}

# Node 3: Pricing
def pricing_node(state: ERPState):
    messages = state.get("messages", [])
    
    if not state.get("po_approved", True):
        messages.append("PO was rejected. Pricing adjustment skipped.")
        return {"messages": messages}
    
    llm = get_llm(state.get("api_provider"), state.get("model_name"), state.get("custom_api_key"))
    
    base_price = 0
    if state.get("draft_po"):
        base_price = state["draft_po"].get("unit_price", 0) * 1.5 # 50% markup
    else:
        base_price = 50.0 
    
    prompt = f"""
    You are a Pricing Agent. 
    The base recommended price for {state['item_name']} is ₹{base_price:.2f}.
    The current live demand is: {state['demand_level']}.
    
    If demand is High, increase price by 15%.
    If demand is Low, decrease price by 10%.
    If Normal, keep it the same.
    
    Respond strictly with the final float value representing the new price, nothing else.
    """
    
    response = llm.invoke(prompt)
    content = response.content
    if isinstance(content, list):
        content = content[0].get("text", "") if isinstance(content[0], dict) else str(content[0])
    elif not isinstance(content, str):
        content = str(content)
    new_price = float(content.strip())
    messages.append(f"Adjusted price to ₹{new_price:.2f} based on {state['demand_level']} demand.")
        
    return {"recommended_price": new_price, "messages": messages}

# Node 4: Finance
def finance_node(state: ERPState):
    messages = state.get("messages", [])
    ledger = state["ledger_balance"]
    
    if state.get("po_approved", True) and state.get("draft_po"):
        cost = state["draft_po"]["total_cost"]
        ledger -= cost
        messages.append(f"Finance: Deducted ₹{cost:.2f} for PO. New Balance: ₹{ledger:.2f}")
    else:
        messages.append("Finance: No expenses deducted.")
        
    return {"ledger_balance": ledger, "messages": messages}

def build_graph():
    builder = StateGraph(ERPState)
    
    builder.add_node("procurement_node", procurement_node)
    builder.add_node("human_approval_node", human_approval_node)
    builder.add_node("pricing_node", pricing_node)
    builder.add_node("finance_node", finance_node)
    
    builder.set_entry_point("procurement_node")
    
    # Conditional edge from procurement
    builder.add_conditional_edges("procurement_node", route_approval, {
        "human_approval_node": "human_approval_node",
        "pricing_node": "pricing_node"
    })
    
    # Edges from human approval
    builder.add_edge("human_approval_node", "pricing_node")
    
    # Normal flow
    builder.add_edge("pricing_node", "finance_node")
    builder.add_edge("finance_node", END)
    
    return builder
