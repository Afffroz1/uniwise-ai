"""
UniWise AI — FastAPI Backend
Run: python main.py or uvicorn backend.main:app
"""
import os
import sys
from pathlib import Path

# Ensure backend directory is in sys.path regardless of execution directory (repo root or backend/)
BACKEND_DIR = Path(__file__).resolve().parent
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

import uuid
from typing import Optional
from dotenv import load_dotenv

load_dotenv()

from fastapi import FastAPI, HTTPException, UploadFile, File, Form
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware

from models import (
    ChatRequest,
    ChatResponse,
    LoginRequest,
    AddUrlRequest,
    AddTextDocumentRequest,
    ApiKeyRequest,
)
from agent import process_query, get_gemini_api_key
from mock_erp import authenticate, get_student
from tools import TICKETS
from knowledge_base import (
    list_documents,
    add_document,
    extract_text_from_pdf,
    delete_document,
    get_all_chunks,
)
from rag import reindex
from web_search import scrape_url_text, search_amu_web

app = FastAPI(
    title="UniWise AI API",
    description="Agentic RAG Pipeline for Student Services — AMU",
    version="1.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

SESSIONS: dict[str, str] = {}


@app.get("/api/status")
def api_status():
    return {
        "message": "UniWise AI is running",
        "version": "1.1.0",
        "gemini_active": bool(get_gemini_api_key()),
    }


@app.get("/health")
def health():
    return {"status": "ok"}


@app.post("/auth/login")
def login(req: LoginRequest):
    student = authenticate(req.faculty_no, req.password)
    if not student:
        raise HTTPException(status_code=401, detail="Invalid faculty number or password")

    session_id = str(uuid.uuid4())
    SESSIONS[session_id] = student["student_id"]

    return {
        "session_id": session_id,
        "student": {
            "student_id": student["student_id"],
            "name": student["name"],
            "faculty_no": student["faculty_no"],
            "enrollment_no": student["enrollment_no"],
            "programme": student["programme"],
            "current_semester": student["current_semester"],
            "completed_credits": student["completed_credits"],
            "backlogs": student["backlogs"],
            "cgpa": student["cgpa"],
            "department": student["department"],
            "email": student.get("email", ""),
            "role": student.get("role", "student"),
        },
    }


@app.post("/auth/logout")
def logout(session_id: str):
    SESSIONS.pop(session_id, None)
    return {"message": "Logged out successfully"}


@app.post("/chat", response_model=ChatResponse)
async def chat(req: ChatRequest):
    student_id = req.student_id
    if req.session_id and req.session_id in SESSIONS:
        student_id = SESSIONS[req.session_id]

    student = get_student(student_id)
    if not student:
        raise HTTPException(status_code=404, detail="Student session not found. Please log in.")

    result = await process_query(
        student_id=student_id,
        query=req.query,
        enable_web_search=bool(req.enable_web_search),
    )
    return ChatResponse(**result)


@app.get("/student/{student_id}")
def get_student_profile(student_id: str):
    student = get_student(student_id)
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    s = dict(student)
    s.pop("password", None)
    return s


@app.get("/tickets")
def list_tickets():
    return list(TICKETS.values())


# ---- Document Ingestion & RAG Knowledge Base Management ----

@app.get("/documents")
def get_all_documents():
    return {"documents": list_documents(), "total_chunks": len(get_all_chunks())}


@app.post("/documents/upload-pdf")
async def upload_pdf(
    file: UploadFile = File(...),
    programme: str = Form("ALL"),
    source_title: Optional[str] = Form(None),
):
    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are supported.")

    file_bytes = await file.read()
    if not file_bytes:
        raise HTTPException(status_code=400, detail="Uploaded file is empty.")

    try:
        extracted_text = extract_text_from_pdf(file_bytes)
        title = source_title.strip() if source_title and source_title.strip() else file.filename
        chunk_count = add_document(
            source_name=title,
            text=extracted_text,
            programme=programme,
            source_url=f"Uploaded PDF: {file.filename}",
        )
        reindex()
        return {
            "success": True,
            "document": title,
            "chunks_created": chunk_count,
            "message": f"Successfully ingested {file.filename} into RAG knowledge base.",
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/documents/add-text")
def add_text_doc(req: AddTextDocumentRequest):
    if not req.title.strip() or not req.text.strip():
        raise HTTPException(status_code=400, detail="Title and text are required.")

    chunk_count = add_document(
        source_name=req.title.strip(),
        text=req.text.strip(),
        programme=req.programme or "ALL",
        source_url=req.source_url or "Manual Input",
    )
    reindex()
    return {
        "success": True,
        "document": req.title,
        "chunks_created": chunk_count,
        "message": f"Document '{req.title}' ingested into RAG pipeline.",
    }


@app.post("/documents/add-url")
def add_url_doc(req: AddUrlRequest):
    if not req.url.startswith("http"):
        raise HTTPException(status_code=400, detail="Valid http/https URL required.")

    res = scrape_url_text(req.url)
    if not res["success"] or not res["text"]:
        raise HTTPException(status_code=400, detail=res.get("error", "Could not extract text from URL."))

    chunk_count = add_document(
        source_name=res["title"],
        text=res["text"],
        programme=req.programme or "ALL",
        source_url=req.url,
    )
    reindex()
    return {
        "success": True,
        "title": res["title"],
        "url": req.url,
        "chunks_created": chunk_count,
        "message": f"Successfully scraped and indexed {res['title']}.",
    }


@app.delete("/documents/{source_name}")
def delete_doc(source_name: str):
    ok = delete_document(source_name)
    if ok:
        reindex()
        return {"success": True, "message": f"Deleted document '{source_name}'."}
    raise HTTPException(status_code=404, detail="Document not found or cannot delete seed documents.")


# ---- Web Search Endpoint ----

@app.get("/search/amu")
def web_search_amu(query: str):
    if not query.strip():
        return {"results": []}
    results = search_amu_web(query.strip())
    return {"query": query, "results": results}


# ---- API Key Settings Management ----

@app.get("/settings/api-key")
def get_api_key_status():
    key = get_gemini_api_key()
    if key:
        masked = key[:4] + "..." + key[-4:] if len(key) > 8 else "***"
        return {"configured": True, "masked": masked}
    return {"configured": False, "masked": ""}


@app.post("/settings/api-key")
def set_api_key(req: ApiKeyRequest):
    k = req.api_key.strip()
    os.environ["GEMINI_API_KEY"] = k
    # Persist in .env
    env_path = os.path.join(os.path.dirname(__file__), ".env")
    try:
        with open(env_path, "w", encoding="utf-8") as f:
            f.write(f"GEMINI_API_KEY={k}\n")
    except Exception:
        pass
    return {"success": True, "configured": bool(k), "message": "Gemini API Key updated successfully."}


# ---- Static Files & Frontend Serving (Single unified app) ----
frontend_out = os.path.join(os.path.dirname(os.path.dirname(__file__)), "frontend", "out")

if os.path.exists(frontend_out):
    next_static = os.path.join(frontend_out, "_next")
    if os.path.exists(next_static):
        app.mount("/_next", StaticFiles(directory=next_static), name="next_static")

    @app.get("/amu-logo.png")
    def serve_logo():
        logo_path = os.path.join(frontend_out, "amu-logo.png")
        if os.path.isfile(logo_path):
            return FileResponse(logo_path)
        raise HTTPException(status_code=404, detail="Logo not found")

    @app.get("/chat")
    def serve_chat_page():
        return FileResponse(os.path.join(frontend_out, "chat.html"))

    @app.get("/")
    def serve_index_page():
        return FileResponse(os.path.join(frontend_out, "index.html"))

    @app.get("/{full_path:path}")
    def serve_static_or_fallback(full_path: str):
        # Don't intercept API paths
        api_prefixes = ("auth/", "chat", "documents", "settings/", "student/", "tickets", "search/", "api/", "health")
        if full_path.startswith(api_prefixes):
            raise HTTPException(status_code=404, detail="Not Found")
        target_file = os.path.join(frontend_out, full_path)
        if os.path.isfile(target_file):
            return FileResponse(target_file)
        if os.path.isfile(target_file + ".html"):
            return FileResponse(target_file + ".html")
        return FileResponse(os.path.join(frontend_out, "index.html"))
else:
    @app.get("/")
    def serve_fallback_info():
        return {"message": "UniWise AI Backend Running. Frontend build not detected in frontend/out.", "version": "1.1.0"}


if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=False)
