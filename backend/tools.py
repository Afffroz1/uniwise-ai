"""
Deterministic Agent Tools
These tools are called by the Gemini LLM Agent to perform exact calculations.
No hallucination possible — all logic is pure Python math.
"""
import uuid
import datetime
from mock_erp import get_student, get_courses


# ---- In-memory ticket store ----
TICKETS: dict[str, dict] = {}


def check_eligibility(student_id: str) -> dict:
    """
    Tool: check_eligibility
    Returns whether student can register for courses, credit cap, and ineligible reasons.
    """
    student = get_student(student_id)
    if not student:
        return {"eligible": False, "reason": "Student not found in ERP", "max_credits": 0}

    reasons = []
    max_credits = student["max_credits_per_sem"]

    if student["backlogs"] > 4:
        reasons.append(f"Student has {student['backlogs']} backlogs (max allowed: 4). "
                       "Must clear backlogs before registration.")
        return {"eligible": False, "reason": "; ".join(reasons), "max_credits": 0}

    if student["cgpa"] < 7.0 or student["backlogs"] > 0:
        max_credits = 20
        if student["backlogs"] > 0:
            reasons.append(f"Has {student['backlogs']} active backlog(s). Credit cap reduced to 20.")
        if student["cgpa"] < 7.0:
            reasons.append(f"CGPA {student['cgpa']} is below 7.0. Credit cap reduced to 20.")

    return {
        "eligible": True,
        "max_credits": max_credits,
        "current_semester": student["current_semester"],
        "completed_credits": student["completed_credits"],
        "backlogs": student["backlogs"],
        "cgpa": student["cgpa"],
        "reasons": reasons,
    }


def get_recommended_courses(student_id: str) -> dict:
    """
    Tool: get_recommended_courses
    Fetches course catalog for student's programme/semester and calculates credit allocation.
    """
    student = get_student(student_id)
    if not student:
        return {"error": "Student not found"}

    eligibility = check_eligibility(student_id)
    max_credits = eligibility.get("max_credits", 20)

    programme = student["programme"]
    semester = student["current_semester"]
    courses = get_courses(programme, semester)

    if not courses:
        return {"error": f"No courses found for {programme} Semester {semester}"}

    # Always include mandatory courses
    mandatory = courses.get("core", []) + courses.get("lab", [])
    mandatory_credits = sum(c["credits"] for c in mandatory)

    remaining = max_credits - mandatory_credits
    available_electives = courses.get("elective", [])
    available_vac = courses.get("vac", [])

    # Greedily pick electives within remaining credits
    recommended_electives = []
    for e in available_electives:
        if remaining >= e["credits"]:
            recommended_electives.append(e)
            remaining -= e["credits"]
            if len(recommended_electives) >= 2:
                break

    recommended_vac = []
    if remaining >= 2 and available_vac:
        recommended_vac.append(available_vac[0])
        remaining -= available_vac[0]["credits"]

    total_credits = mandatory_credits + sum(c["credits"] for c in recommended_electives + recommended_vac)

    return {
        "programme": programme,
        "semester": semester,
        "max_credits": max_credits,
        "total_registered_credits": total_credits,
        "mandatory_courses": mandatory,
        "recommended_electives": recommended_electives,
        "recommended_vac": recommended_vac,
        "remaining_slot": remaining,
        "other_electives": [e for e in available_electives if e not in recommended_electives],
    }


def raise_ticket(student_id: str, query: str, context: str, department: str = "Academic Cell") -> dict:
    """
    Tool: raise_ticket
    Creates a support escalation ticket when the agent cannot answer confidently.
    """
    ticket_id = f"TKT-{datetime.datetime.now().strftime('%Y%m%d')}-{uuid.uuid4().hex[:6].upper()}"
    student = get_student(student_id)

    ticket = {
        "ticket_id": ticket_id,
        "student_id": student_id,
        "student_name": student["name"] if student else "Unknown",
        "faculty_no": student["faculty_no"] if student else "Unknown",
        "query": query,
        "context_summary": context[:300],
        "assigned_to": department,
        "status": "OPEN",
        "created_at": datetime.datetime.now().isoformat(),
        "expected_resolution": "Within 7 working days",
        "message": (
            f"Your query has been escalated to the {department}. "
            f"Ticket ID: {ticket_id}. You will receive a response within 7 working days. "
            "You may also visit the department office during working hours."
        ),
    }
    TICKETS[ticket_id] = ticket
    return ticket


def get_attendance_status(student_id: str, attendance_pct: float) -> dict:
    """
    Tool: get_attendance_status
    Deterministic attendance eligibility calculator.
    """
    student = get_student(student_id)
    min_pct = student["min_attendance_pct"] if student else 75

    if attendance_pct >= min_pct:
        status = "ELIGIBLE"
        message = f"Attendance {attendance_pct}% meets the {min_pct}% requirement. You are eligible to appear in exams."
    elif attendance_pct >= 65:
        status = "CONDONATION_ELIGIBLE"
        message = (
            f"Attendance {attendance_pct}% is below {min_pct}% but above 65%. "
            "You may apply for medical condonation with supporting documents."
        )
    else:
        status = "DEBARRED"
        message = (
            f"Attendance {attendance_pct}% is below 65%. You are debarred from the End-Semester Examination. "
            "Contact your department immediately."
        )
    return {"status": status, "message": message, "min_required": min_pct, "current": attendance_pct}
