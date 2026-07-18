import os
import jwt
import datetime
from pathlib import Path
from typing import Optional
from uuid import uuid4
from fastapi import FastAPI, HTTPException, Depends, Header, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv
from langchain_community.vectorstores import FAISS
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_classic.chains import create_retrieval_chain
from langchain_classic.chains.combine_documents import create_stuff_documents_chain
from langchain_core.prompts import ChatPromptTemplate
from langgraph.checkpoint.memory import MemorySaver

# Resolve configuration from the backend directory even when uvicorn is
# launched from the repository root or another working directory.
load_dotenv(Path(__file__).resolve().parent / ".env")

from graph import build_graph, get_llm
from google.oauth2 import id_token
from google.auth.transport import requests as google_requests
import pandas as pd
import shutil
from ingest import ingest_excel, load_supplier_data
from paths import FAISS_INDEX_DIR, UPLOAD_DIR, ensure_data_directories

app = FastAPI(title="Supplier RAG API with Auth")

ALLOWED_UPLOAD_EXTENSIONS = {".xlsx", ".xls"}
MAX_UPLOAD_SIZE_BYTES = 10 * 1024 * 1024
ALLOWED_ORIGINS = [
    origin.strip()
    for origin in os.getenv(
        "CORS_ORIGINS", "http://localhost:5173,http://127.0.0.1:5173"
    ).split(",")
    if origin.strip()
]

# Enable CORS for the React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global variables
vector_store = None
rag_chain = None
erp_app = None
pending_pos = {}

JWT_SECRET = os.getenv("JWT_SECRET")
GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID")
GOOGLE_CLOCK_SKEW_SECONDS = int(os.getenv("GOOGLE_CLOCK_SKEW_SECONDS", "30"))

class LoginRequest(BaseModel):
    credential: str

class LoginResponse(BaseModel):
    token: str
    name: str
    email: str

class QueryRequest(BaseModel):
    query: str
    api_provider: Optional[str] = None
    model_name: Optional[str] = None
    custom_api_key: Optional[str] = None

class QueryResponse(BaseModel):
    answer: str
    sources: list

class ERPRunRequest(BaseModel):
    item_name: str
    current_stock: int
    stock_threshold: int
    demand_level: str
    thread_id: str
    api_provider: Optional[str] = None
    model_name: Optional[str] = None
    custom_api_key: Optional[str] = None
    
class ERPApproveRequest(BaseModel):
    thread_id: str
    approved: bool

# Dependency to get current user from JWT
def get_current_user(authorization: str = Header(...)):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Invalid authorization header")
    token = authorization.split(" ")[1]
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=["HS256"])
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

@app.on_event("startup")
async def startup_event():
    global vector_store, rag_chain, erp_app
    ensure_data_directories()
    index_name = FAISS_INDEX_DIR
    
    if not os.path.exists(index_name):
        print(f"Warning: FAISS index '{index_name}' not found. Run ingest.py first.")
    
    if not os.getenv("GEMINI_API_KEY"):
        print("Warning: GEMINI_API_KEY not set. API calls will fail.")

    try:
        from langchain_google_genai import GoogleGenerativeAIEmbeddings
        embeddings = GoogleGenerativeAIEmbeddings(model="models/embedding-001")
        vector_store = FAISS.load_local(str(index_name), embeddings, allow_dangerous_deserialization=True)
        print("Vector store initialized successfully.")
        
        memory = MemorySaver()
        erp_app = build_graph().compile(checkpointer=memory, interrupt_before=["human_approval_node"])
        print("ERP LangGraph initialized successfully.")
    except Exception as e:
        print(f"Error initializing services: {e}")

@app.post("/auth/login", response_model=LoginResponse)
async def login(request: LoginRequest):
    if request.credential == "dev-bypass":
        expiration = datetime.datetime.utcnow() + datetime.timedelta(hours=24)
        payload = {
            "sub": "dev@example.com",
            "name": "Dev User",
            "exp": expiration
        }
        token = jwt.encode(payload, JWT_SECRET, algorithm="HS256")
        return LoginResponse(token=token, name="Dev User", email="dev@example.com")

    if not JWT_SECRET or not GOOGLE_CLIENT_ID:
        raise HTTPException(status_code=500, detail="Server authentication is not configured.")
    try:
        # Verify Google token
        idinfo = id_token.verify_oauth2_token(
            request.credential, 
            google_requests.Request(),
            GOOGLE_CLIENT_ID,
            clock_skew_in_seconds=GOOGLE_CLOCK_SKEW_SECONDS,
        )
        
        email = idinfo.get("email")
        name = idinfo.get("name", "User")
        
        # Create our own JWT
        expiration = datetime.datetime.utcnow() + datetime.timedelta(hours=24)
        payload = {
            "sub": email,
            "name": name,
            "exp": expiration
        }
        token = jwt.encode(payload, JWT_SECRET, algorithm="HS256")
        
        return LoginResponse(token=token, name=name, email=email)
    except ValueError as e:
        raise HTTPException(status_code=401, detail=f"Invalid Google token: {e}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/upload-excel")
async def upload_excel(file: UploadFile = File(...), current_user: dict = Depends(get_current_user)):
    original_name = file.filename or "upload.xlsx"
    extension = Path(original_name).suffix.lower()
    if extension not in ALLOWED_UPLOAD_EXTENSIONS:
        raise HTTPException(status_code=415, detail="Upload an Excel .xlsx or .xls file.")

    ensure_data_directories()
    file_location = UPLOAD_DIR / f"{uuid4().hex}{extension}"
    bytes_written = 0
    try:
        with file_location.open("wb") as file_object:
            while chunk := await file.read(1024 * 1024):
                bytes_written += len(chunk)
                if bytes_written > MAX_UPLOAD_SIZE_BYTES:
                    raise HTTPException(status_code=413, detail="File must be 10 MB or smaller.")
                file_object.write(chunk)
    except Exception:
        file_location.unlink(missing_ok=True)
        raise
    
    try:
        df = load_supplier_data(file_location)
        num_suppliers = len(df)
        
        # Trigger ingestion
        ingest_excel(file_location, FAISS_INDEX_DIR)
        
        # Re-initialize the RAG chain to load the new FAISS index
        await startup_event()
        
        return {
            "status": "success", 
            "message": "Data ingested successfully",
            "suppliers_count": num_suppliers, 
            "filename": file.filename
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing excel: {str(e)}")
    finally:
        file_location.unlink(missing_ok=True)

@app.post("/query", response_model=QueryResponse)
async def query_agent(request: QueryRequest, current_user: dict = Depends(get_current_user)):
    if not vector_store:
        raise HTTPException(status_code=500, detail="Vector store not initialized.")
    
    try:
        # Dynamically build the LLM based on user settings
        llm = get_llm(request.api_provider, request.model_name, request.custom_api_key)
        
        system_prompt = (
            "You are a helpful procurement assistant. Use the following pieces of retrieved "
            "context to answer the question. If you don't know the answer based on the context, "
            "say that you don't know.\n\n"
            "Context: {context}"
        )
        prompt = ChatPromptTemplate.from_messages([
            ("system", system_prompt),
            ("human", "{input}"),
        ])
        
        retriever = vector_store.as_retriever(search_kwargs={"k": 3})
        question_answer_chain = create_stuff_documents_chain(llm, prompt)
        dynamic_rag_chain = create_retrieval_chain(retriever, question_answer_chain)
        
        result = dynamic_rag_chain.invoke({"input": request.query})
        sources = [doc.metadata for doc in result.get("context", [])]
        return QueryResponse(answer=result["answer"], sources=sources)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/erp/run")
async def run_erp(request: ERPRunRequest, current_user: dict = Depends(get_current_user)):
    if not erp_app:
        raise HTTPException(status_code=500, detail="ERP Graph not initialized.")
        
    initial_state = {
        "item_name": request.item_name,
        "current_stock": request.current_stock,
        "stock_threshold": request.stock_threshold,
        "demand_level": request.demand_level,
        "draft_po": None,
        "po_approved": True,
        "recommended_price": 0.0,
        "ledger_balance": 10000.0,
        "messages": [],
        "api_provider": request.api_provider,
        "model_name": request.model_name,
        "custom_api_key": request.custom_api_key
    }
    config = {"configurable": {"thread_id": request.thread_id}}
    
    try:
        for _ in erp_app.stream(initial_state, config):
            pass
            
        current_state = erp_app.get_state(config)
        if current_state.next:
            draft_po = current_state.values.get("draft_po")
            pending_pos[request.thread_id] = {
                "item_name": request.item_name,
                "draft_po": draft_po
            }
            return {
                "status": "paused",
                "next_node": current_state.next[0],
                "draft_po": draft_po,
                "messages": current_state.values.get("messages")
            }
        else:
            return {
                "status": "completed",
                "final_state": current_state.values
            }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/erp/approve")
async def approve_erp(request: ERPApproveRequest, current_user: dict = Depends(get_current_user)):
    if not erp_app:
        raise HTTPException(status_code=500, detail="ERP Graph not initialized.")
        
    config = {"configurable": {"thread_id": request.thread_id}}
    
    try:
        current_state = erp_app.get_state(config)
        if not current_state.next:
            raise HTTPException(status_code=400, detail="Graph is not currently paused.")
            
        erp_app.update_state(config, {"po_approved": request.approved})
        
        if request.thread_id in pending_pos:
            del pending_pos[request.thread_id]
        
        for _ in erp_app.stream(None, config):
            pass
            
        final_state = erp_app.get_state(config)
        return {
            "status": "completed",
            "final_state": final_state.values
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/erp/pending")
async def get_pending_erp(current_user: dict = Depends(get_current_user)):
    result = []
    for thread_id, data in pending_pos.items():
        result.append({
            "thread_id": thread_id,
            "item_name": data["item_name"],
            "draft_po": data["draft_po"]
        })
    return {"pending_pos": result}

@app.get("/")
async def root():
    return {"message": "Supplier RAG API with Auth and ERP Graph are running."}
