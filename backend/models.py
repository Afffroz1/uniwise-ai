from pydantic import BaseModel
from typing import Optional, List


class ChatRequest(BaseModel):
    student_id: str
    query: str
    session_id: Optional[str] = None
    enable_web_search: Optional[bool] = False


class Citation(BaseModel):
    source: str
    text: str
    chunk_id: str


class ChatResponse(BaseModel):
    answer: str
    citations: List[Citation]
    intent: str
    ticket_raised: bool
    ticket_id: Optional[str] = None
    confidence: float


class LoginRequest(BaseModel):
    faculty_no: str
    password: str


class StudentProfile(BaseModel):
    student_id: str
    name: str
    faculty_no: str
    enrollment_no: str
    programme: str
    current_semester: int
    completed_credits: int
    backlogs: int
    cgpa: float
    department: str


class AddUrlRequest(BaseModel):
    url: str
    programme: Optional[str] = "ALL"


class AddTextDocumentRequest(BaseModel):
    title: str
    text: str
    programme: Optional[str] = "ALL"
    source_url: Optional[str] = ""


class ApiKeyRequest(BaseModel):
    api_key: str
