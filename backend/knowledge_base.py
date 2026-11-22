"""
Knowledge Base — AMU Academic Documents & Dynamic Document Ingestion
Supports:
1. Seed AMU circulars (Exam rules, Credit scheme, Fee, Scholarships)
2. Uploading PDFs and text documents dynamically
3. URL ingestion & web notice scraping
4. Persistent storage of uploaded chunks in knowledge_base_custom.json
"""
import os
import json
import uuid
import datetime
import io
import re

DATA_FILE = os.path.join(os.path.dirname(__file__), "knowledge_base_custom.json")

SEED_CHUNKS = [
    # --- Student Profile & Academic Identity Info ---
    {
        "chunk_id": "PROFILE_INFO_001",
        "source": "AMU Student Lifecycle Portal Guide",
        "source_url": "https://erp.amucoe.ac.in/student/dashboard",
        "programme": "ALL",
        "effective_date": "2025-01-01",
        "text": (
            "The AMU Student Lifecycle Portal provides profile details, course registration, "
            "attendance tracking, and examination result records. Students can check their enrolled "
            "programme, semester, faculty number, enrollment number, completed credits, and current CGPA."
        ),
    },
    # --- Exam Rules ---
    {
        "chunk_id": "EXAM_RULES_001",
        "source": "FYUP Exam Rules 2025",
        "source_url": "https://erp.amucoe.ac.in/circular/exam-rules-2025.pdf",
        "programme": "ALL",
        "effective_date": "2025-01-01",
        "text": (
            "A student must secure a minimum of 75% attendance in each course to be "
            "eligible to appear in the End-Semester Examination. Students with attendance "
            "between 65% and 74% may apply for a medical condonation with supporting documents. "
            "Students with attendance below 65% are debarred from appearing in the examination."
        ),
    },
    {
        "chunk_id": "EXAM_RULES_002",
        "source": "FYUP Exam Rules 2025",
        "source_url": "https://erp.amucoe.ac.in/circular/exam-rules-2025.pdf",
        "programme": "ALL",
        "effective_date": "2025-01-01",
        "text": (
            "Re-admission fee for detained students is Rs. 5,000 per semester. The student "
            "must clear all backlogs within four semesters of their occurrence. Failing to do so "
            "results in disqualification from the programme. A student may carry a maximum of "
            "4 backlog papers at any given time."
        ),
    },
    # --- Credit Rules ---
    {
        "chunk_id": "CREDIT_RULES_001",
        "source": "MCA Credit Scheme 2025",
        "source_url": "https://erp.amucoe.ac.in/circular/mca-credit-scheme-2025.pdf",
        "programme": "MCA",
        "effective_date": "2025-07-01",
        "text": (
            "MCA students can register for a maximum of 24 credits per semester if their CGPA "
            "is 7.0 or above and they have zero backlogs. Students with backlogs or CGPA below "
            "7.0 are limited to 20 credits per semester. Each student must register for all "
            "compulsory Core courses before selecting Electives."
        ),
    },
    {
        "chunk_id": "CREDIT_RULES_002",
        "source": "MCA Credit Scheme 2025",
        "source_url": "https://erp.amucoe.ac.in/circular/mca-credit-scheme-2025.pdf",
        "programme": "MCA",
        "effective_date": "2025-07-01",
        "text": (
            "MCA Semester 3 compulsory Core courses: MCA301 (Advanced Database Systems, 4 cr), "
            "MCA302 (Design and Analysis of Algorithms, 4 cr), MCA303 (Software Engineering, 4 cr), "
            "MCA304 (Computer Networks, 4 cr). Students must select at least one Elective (3 cr) "
            "and may choose one VAC (2 cr). Lab courses MCA305L and MCA306L are mandatory (2 cr each)."
        ),
    },
    # --- Fee Structure ---
    {
        "chunk_id": "FEE_001",
        "source": "AMU Fee Structure 2025-26",
        "source_url": "https://erp.amucoe.ac.in/circular/fee-structure-2025.pdf",
        "programme": "MCA",
        "effective_date": "2025-07-01",
        "text": (
            "Annual tuition fee for MCA programme: Rs. 42,000 per year. Hostel accommodation "
            "fee: Rs. 15,000 per semester. Examination fee: Rs. 1,500 per semester. "
            "Scholarship holders may apply for tuition fee waiver through the scholarship cell "
            "before the last date of fee submission."
        ),
    },
    {
        "chunk_id": "FEE_002",
        "source": "AMU Fee Structure 2025-26",
        "source_url": "https://erp.amucoe.ac.in/circular/fee-structure-2025.pdf",
        "programme": "ALL",
        "effective_date": "2025-07-01",
        "text": (
            "Late fee fine: Rs. 50 per day after due date, maximum Rs. 500. Fee can be paid "
            "online via the ERP portal or through demand draft in favour of Finance Officer, AMU. "
            "No cash payments are accepted at the department counter."
        ),
    },
    # --- Scholarship ---
    {
        "chunk_id": "SCHOLAR_001",
        "source": "AMU Scholarship Circular 2025",
        "source_url": "https://erp.amucoe.ac.in/circular/scholarship-2025.pdf",
        "programme": "ALL",
        "effective_date": "2025-04-01",
        "text": (
            "Merit scholarship is awarded to students who secure CGPA >= 8.5 in the previous "
            "semester with zero backlogs. The scholarship amount is Rs. 2,000 per month. "
            "Students must apply through the ERP portal within 30 days of result declaration. "
            "Documents required: mark sheets, bonafide certificate, bank account details."
        ),
    },
    # --- Registration Process ---
    {
        "chunk_id": "REG_001",
        "source": "Course Registration Guidelines 2025",
        "source_url": "https://erp.amucoe.ac.in/circular/registration-2025.pdf",
        "programme": "ALL",
        "effective_date": "2025-07-01",
        "text": (
            "Course registration for Semester 3 opens on 1st August 2025 and closes on "
            "15th August 2025. Students must log in to the ERP portal and complete registration "
            "before the deadline. Late registration is allowed until 25th August with a penalty "
            "of Rs. 500. Add/drop of elective courses is permitted only during the first two weeks."
        ),
    },
    # --- Backlog Policy ---
    {
        "chunk_id": "BACKLOG_001",
        "source": "Back Paper Exam Circular 2025",
        "source_url": "https://erp.amucoe.ac.in/circular/backlog-exam-2025.pdf",
        "programme": "ALL",
        "effective_date": "2025-10-01",
        "text": (
            "Back paper examinations are held at the end of every semester for students with "
            "outstanding backlogs. Students must register for back paper exams separately on "
            "the ERP portal. The registration window is open for 10 days after the main result "
            "is declared. Back paper exam fee is Rs. 300 per paper."
        ),
    },
    # --- Grievance ---
    {
        "chunk_id": "GRIEV_001",
        "source": "Student Grievance Policy 2025",
        "source_url": "https://erp.amucoe.ac.in/circular/grievance-policy-2025.pdf",
        "programme": "ALL",
        "effective_date": "2025-01-01",
        "text": (
            "Students can submit grievances related to examinations, results, attendance, "
            "fee, or any academic matter through the UniWise support ticket system or by "
            "visiting the department office. Online grievances are acknowledged within 24 hours "
            "and resolved within 7 working days. Escalate unresolved issues to the HOD."
        ),
    },
    # --- Certificates ---
    {
        "chunk_id": "CERT_001",
        "source": "Certificate Issuance Rules 2025",
        "source_url": "https://erp.amucoe.ac.in/circular/certificate-rules-2025.pdf",
        "programme": "ALL",
        "effective_date": "2025-01-01",
        "text": (
            "Bonafide certificates are issued within 3 working days of application via ERP portal. "
            "Migration certificates require completion of all semester dues and clearance from "
            "library and hostel. Provisional degree certificates are issued 30 days after the "
            "final exam result declaration. Original degree certificates take 3–6 months."
        ),
    },
]


def _load_custom_chunks() -> list[dict]:
    if _MEMORY_CHUNKS:
        return list(_MEMORY_CHUNKS)
    for path in (_TMP_FILE, DATA_FILE):
        if os.path.exists(path):
            try:
                with open(path, "r", encoding="utf-8") as f:
                    return json.load(f)
            except Exception:
                continue
    return []


_TMP_FILE = os.path.join("/tmp", "knowledge_base_custom.json")
_MEMORY_CHUNKS: list[dict] = []   # last-resort store when no filesystem is writable


def _save_custom_chunks(chunks: list[dict]):
    """Persist uploaded chunks. On read-only hosts (e.g. Vercel) fall back to /tmp, then memory.
    Note: /tmp and memory are temporary on serverless - uploads may disappear on cold start."""
    global _MEMORY_CHUNKS
    _MEMORY_CHUNKS = list(chunks)
    for path in (DATA_FILE, _TMP_FILE):
        try:
            with open(path, "w", encoding="utf-8") as f:
                json.dump(chunks, f, indent=2, ensure_ascii=False)
            return
        except OSError:
            continue


def get_all_chunks() -> list[dict]:
    return SEED_CHUNKS + _load_custom_chunks()


def chunk_text(text: str, chunk_size: int = 160, overlap: int = 30) -> list[str]:
    """Split text into overlapping word chunks."""
    words = text.split()
    if not words:
        return []
    chunks = []
    i = 0
    while i < len(words):
        chunk = " ".join(words[i : i + chunk_size])
        if chunk.strip():
            chunks.append(chunk.strip())
        i += chunk_size - overlap
    return chunks


def extract_text_from_pdf(file_bytes: bytes) -> str:
    """Extract text from PDF using pypdf."""
    try:
        from pypdf import PdfReader
        reader = PdfReader(io.BytesIO(file_bytes))
        extracted = []
        for i, page in enumerate(reader.pages):
            txt = page.extract_text()
            if txt:
                extracted.append(f"--- Page {i+1} ---\n" + txt)
        return "\n\n".join(extracted)
    except Exception as e:
        raise ValueError(f"Failed to parse PDF: {e}")


def add_document(source_name: str, text: str, programme: str = "ALL", source_url: str = "") -> int:
    """
    Chunks document text and appends to persistent custom store.
    Returns number of chunks created.
    """
    chunks_text = chunk_text(text)
    if not chunks_text:
        return 0

    custom = _load_custom_chunks()
    # Remove existing chunks with same source name if any
    custom = [c for c in custom if c.get("source") != source_name]

    created_chunks = []
    today = datetime.date.today().isoformat()
    for idx, c_text in enumerate(chunks_text):
        cid = f"CUSTOM_{uuid.uuid4().hex[:6].upper()}_{idx+1}"
        created_chunks.append({
            "chunk_id": cid,
            "source": source_name,
            "source_url": source_url or f"Uploaded Document: {source_name}",
            "programme": programme,
            "effective_date": today,
            "text": c_text,
        })

    custom.extend(created_chunks)
    _save_custom_chunks(custom)
    return len(created_chunks)


def list_documents() -> list[dict]:
    """Returns a summary of all available documents in the knowledge base."""
    all_chunks = get_all_chunks()
    docs = {}
    for c in all_chunks:
        s = c["source"]
        if s not in docs:
            docs[s] = {
                "source": s,
                "source_url": c.get("source_url", ""),
                "programme": c.get("programme", "ALL"),
                "effective_date": c.get("effective_date", ""),
                "chunks_count": 0,
                "is_custom": not s.startswith("FYUP") and not s.startswith("MCA") and not s.startswith("AMU") and not s.startswith("Course") and not s.startswith("Back") and not s.startswith("Student") and not s.startswith("Certificate"),
                "preview": c["text"][:140] + "...",
            }
        docs[s]["chunks_count"] += 1
    return list(docs.values())


def delete_document(source_name: str) -> bool:
    """Deletes a custom document by source name."""
    custom = _load_custom_chunks()
    orig_len = len(custom)
    custom = [c for c in custom if c.get("source") != source_name]
    if len(custom) != orig_len:
        _save_custom_chunks(custom)
        return True
    return False
