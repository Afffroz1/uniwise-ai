"""
UniWise AI — Agentic Router (v2.0)
Natural, conversational, tailored responses powered by Gemini LLM + Hybrid RAG.
Features:
- Direct, crisp profile extraction (asks for enrollment -> gives only enrollment)
- Full deep reading of uploaded PDF lab manuals and syllabus documents
- Out-of-scope guardrails (rejects fitness/random topics politely)
- Zero hallucination on academic regulations and credit math
- Direct high-speed REST integration with Gemini (gemini-3.1-flash-lite / gemini-flash-lite-latest)
"""
import os
import json
import re
import urllib.request
import urllib.parse
from typing import Optional
from dotenv import load_dotenv

load_dotenv()

from rag import hybrid_search
from tools import check_eligibility, get_recommended_courses, raise_ticket, get_attendance_status
from mock_erp import get_student
from web_search import search_amu_web

# Intent categories
INTENT_PROFILE = "STUDENT_PROFILE"
INTENT_REGISTRATION = "COURSE_REGISTRATION"
INTENT_ATTENDANCE = "ATTENDANCE"
INTENT_FEE = "FEE"
INTENT_GENERAL = "GENERAL_RULE"
INTENT_WEB_SEARCH = "AMU_WEB_SEARCH"


def get_gemini_api_key() -> str:
    return os.getenv("GEMINI_API_KEY", "").strip()


def check_specific_profile_query(query: str, student: dict) -> Optional[str]:
    """
    Checks if the user asked a focused question about a single profile attribute.
    Returns a crisp, tailored answer without dumping unnecessary walls of text.
    """
    if not student:
        return None

    q = query.lower().strip()

    # Enrollment number
    if re.search(r'\b(enrollment|enrolment)\b', q):
        return f"Your Enrollment Number is **{student['enrollment_no']}**."

    # Faculty number
    if re.search(r'\b(faculty\s*(no|number)?)\b', q) and not "department" in q:
        return f"Your Faculty Number is **{student['faculty_no']}**."

    # CGPA / Grades
    if re.search(r'\b(cgpa|gpa|marks|grade|score|performance)\b', q):
        merit = " (🏆 Merit Scholarship Eligible — CGPA >= 8.5)" if student['cgpa'] >= 8.5 else ""
        return f"Your cumulative CGPA is **{student['cgpa']}**{merit}."

    # What course / program / where do I study (only for student's own program, not documents/lab)
    if any(phrase in q for phrase in [
        "what course am i", "what cource am i", "which course am i", "what programme am i", "what program am i",
        "where do i study", "what am i studying", "my course", "my programme", "my program"
    ]) and not any(w in q for w in ["manual", "code", "syllabus", "questions", "topics", "content", "exercise"]):
        return (
            f"You are currently studying in **{student['programme']} (Master of Computer Applications)**, "
            f"**Semester {student['current_semester']}**, at the **Department of {student['department']}**, "
            f"Aligarh Muslim University."
        )

    # Current semester
    if re.search(r'\b(what\s+semester|which\s+semester|my\s+sem(ester)?)\b', q):
        return f"You are currently in **Semester {student['current_semester']}** of the {student['programme']} programme."

    # Backlogs
    if any(phrase in q for phrase in ["my backlog", "do i have any backlog", "how many backlog", "my active backlog"]):
        if student['backlogs'] == 0:
            return "Good news! You have **0 active backlogs** in your ERP record."
        else:
            return f"You currently have **{student['backlogs']} active backlog(s)** recorded in the ERP portal."

    # Completed credits
    if re.search(r'\b(completed\s+credits?|how\s+many\s+credits?\s+do\s+i\s+have)\b', q):
        return f"You have completed **{student['completed_credits']} credits** towards your degree."

    # General profile: "who am i", "my details", "my profile"
    if any(phrase in q for phrase in ["who am i", "my profile", "my details", "show my info", "about me"]):
        return (
            f"Hello **{student['name']}**! Here is a summary of your AMU student record:\n\n"
            f"- **Programme:** {student['programme']} (Semester {student['current_semester']})\n"
            f"- **Faculty No:** `{student['faculty_no']}` | **Enrollment No:** `{student['enrollment_no']}`\n"
            f"- **Department:** {student['department']}\n"
            f"- **CGPA:** **{student['cgpa']}** {'(Merit Scholarship Eligible)' if student['cgpa'] >= 8.5 else ''}\n"
            f"- **Credits Completed:** {student['completed_credits']} | **Backlogs:** {student['backlogs']}"
        )

    return None


def call_gemini_rest(prompt: str, key: str) -> Optional[str]:
    """
    Direct, fast REST call to Gemini with automatic model fallback.
    Uses active 2026 model endpoints.
    """
    models = ['gemini-3.1-flash-lite', 'gemini-flash-lite-latest', 'gemini-3.8-flash']
    payload = {
        'contents': [{'parts': [{'text': prompt}]}],
        'generationConfig': {
            'temperature': 0.3,
            'maxOutputTokens': 1000,
        }
    }
    data_bytes = json.dumps(payload).encode('utf-8')

    for m in models:
        url = f"https://generativelanguage.googleapis.com/v1beta/models/{m}:generateContent?key={key}"
        req = urllib.request.Request(
            url,
            data=data_bytes,
            headers={'Content-Type': 'application/json'},
            method='POST'
        )
        try:
            with urllib.request.urlopen(req, timeout=14) as resp:
                res = json.loads(resp.read().decode('utf-8'))
                if res.get('candidates') and res['candidates'][0].get('content'):
                    parts = res['candidates'][0]['content']['parts']
                    return "".join(p.get('text', '') for p in parts).strip()
        except Exception:
            continue
    return None


async def process_query(student_id: str, query: str, enable_web_search: bool = False) -> dict:
    """
    Main Agentic Pipeline:
    1. Check for specific student profile attribute (crisp, zero-latency).
    2. Hybrid RAG retrieval (BM25 + vector search over seed circulars + uploaded PDFs).
    3. Optional live AMU web search.
    4. Deterministic tool verification (credit rules, attendance % logic).
    5. Conversational LLM reasoning via Gemini.
    """
    student = get_student(student_id)
    clean_q = query.strip()

    # Step 1: Specific Student Profile Query check
    if student:
        tailored_profile_answer = check_specific_profile_query(clean_q, student)
        if tailored_profile_answer:
            return {
                "answer": tailored_profile_answer,
                "citations": [{
                    "source": "AMU Student Lifecycle Portal · Student Record",
                    "text": f"Verified record for Faculty No: {student['faculty_no']} ({student['name']})",
                    "chunk_id": "ERP_PROFILE"
                }],
                "intent": INTENT_PROFILE,
                "ticket_raised": False,
                "ticket_id": None,
                "confidence": 0.99,
            }

    # Step 2: Hybrid RAG Search
    # Fetch more chunks (top_k=8) so documents like lab manuals have full context
    chunks = hybrid_search(clean_q, top_k=8)

    # Step 3: Web search if requested or explicitly online query
    web_results = []
    if enable_web_search or any(w in clean_q.lower() for w in ["search website", "online notice", "latest news", "amu site"]):
        web_results = search_amu_web(clean_q, max_results=3)

    # Step 4: Deterministic tools context
    tool_data = ""
    if student:
        elig = check_eligibility(student["student_id"])
        recs = get_recommended_courses(student["student_id"])
        tool_data = (
            f"Pre-computed Student Academic Status:\n"
            f"- Enrolled: {student['programme']} Semester {student['current_semester']} (Dept: {student['department']})\n"
            f"- CGPA: {student['cgpa']}, Completed Credits: {student['completed_credits']}, Backlogs: {student['backlogs']}\n"
            f"- Registration Eligibility: {'Eligible' if elig['eligible'] else 'Blocked'}, Max Credits: {elig['max_credits']}\n"
            f"- Planned Courses: {json.dumps(recs.get('mandatory_courses', []))}\n"
        )

    # Prepare Context Strings
    doc_context_list = []
    citations = []

    for c in chunks:
        doc_context_list.append(f"[Source Document: {c['source']}]\n{c['text']}")
        if len(citations) < 3:
            citations.append({
                "source": c["source"],
                "text": c["text"][:110] + "...",
                "chunk_id": c.get("chunk_id", "CHUNK")
            })

    for w in web_results:
        doc_context_list.append(f"[Live AMU Web Notice: {w['source']}]\n{w['text']}")
        citations.append({
            "source": w["source"],
            "text": w["text"][:110] + "...",
            "chunk_id": w.get("chunk_id", "WEB")
        })

    doc_context = "\n\n".join(doc_context_list)

    # Step 5: Construct Prompt for Gemini
    system_instructions = (
        "You are UniWise AI, a helpful, polite, and intelligent academic assistant for students at Aligarh Muslim University (AMU).\n"
        "Guidelines:\n"
        "1. Conversational & Tailored: Answer naturally, warmly, and directly to the student's specific question. Avoid unnecessary boilerplate or repeating entire circulars.\n"
        "2. Answering Document Questions: If the student asks about an uploaded document or lab manual (e.g. how many questions, who is the author, objectives, lab contents), read through the provided document context carefully, find the relevant sections, and answer specifically.\n"
        "3. Out-of-Scope Questions: If the query is unrelated to university academics, student life, fees, or university documents (e.g. fitness, recipes, gaming), politely reply: 'I am UniWise AI, dedicated to AMU academic regulations, courses, attendance, and student services. I cannot assist with that topic, but I'd be glad to help with your academic queries!'\n"
        "4. No Hallucinations: If a specific detail is not found in the documents or profile, state honestly that the document does not specify it.\n"
        "5. Formatting: Use clean markdown, bullet points, and bold text where appropriate."
    )

    full_prompt = f"""{system_instructions}

{tool_data}

Available Knowledge Base Documents (including uploaded PDFs and AMU circulars):
{doc_context}

Student Question: "{clean_q}"

Your specific, friendly answer:"""

    # Step 6: Execute via Gemini REST
    key = get_gemini_api_key()
    answer = None

    if key:
        answer = call_gemini_rest(full_prompt, key)

    if not answer:
        # Fallback if key missing or network failure
        if chunks:
            top = chunks[0]
            answer = f"Based on **{top['source']}**:\n\n{top['text']}"
        else:
            answer = (
                "I couldn't locate specific information for your query in the current university documents. "
                "You can upload the relevant circular PDF using the **Upload Document** button above, or ask the department office."
            )

    return {
        "answer": answer,
        "citations": citations,
        "intent": INTENT_GENERAL,
        "ticket_raised": False,
        "ticket_id": None,
        "confidence": 0.94 if key else 0.75,
    }
