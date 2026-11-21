"""
Mock ERP Data Layer
Simulates AMU Student Lifecycle Portal database.
Role-Based Access Control:
- 'student': Regular student querying courses, attendance, records
- 'admin': Department Administrator managing knowledge base, PDFs, and AI API keys
"""

USERS = {
    "STU001": {
        "student_id": "STU001",
        "name": "Afroz Alam",
        "faculty_no": "25CAMSA170",
        "enrollment_no": "GR3328",
        "password": "password123",
        "programme": "MCA",
        "current_semester": 3,
        "completed_credits": 72,
        "backlogs": 0,
        "cgpa": 8.7,
        "department": "Computer Science",
        "email": "afroz@amu.ac.in",
        "phone": "9876543210",
        "max_credits_per_sem": 24,
        "min_attendance_pct": 75,
        "role": "student",
    },
    "STU002": {
        "student_id": "STU002",
        "name": "Sara Khan",
        "faculty_no": "25CAMSA171",
        "enrollment_no": "GR3329",
        "password": "password123",
        "programme": "MCA",
        "current_semester": 3,
        "completed_credits": 60,
        "backlogs": 2,
        "cgpa": 6.4,
        "department": "Computer Science",
        "email": "sara@amu.ac.in",
        "phone": "9876543211",
        "max_credits_per_sem": 20,
        "min_attendance_pct": 75,
        "role": "student",
    },
    "STU003": {
        "student_id": "STU003",
        "name": "Rajan Verma",
        "faculty_no": "25CAMSA172",
        "enrollment_no": "GR3330",
        "password": "password123",
        "programme": "FYUP",
        "current_semester": 5,
        "completed_credits": 110,
        "backlogs": 1,
        "cgpa": 7.1,
        "department": "Computer Science",
        "email": "rajan@amu.ac.in",
        "phone": "9876543212",
        "max_credits_per_sem": 22,
        "min_attendance_pct": 75,
        "role": "student",
    },
    "ADMIN001": {
        "student_id": "ADMIN001",
        "name": "Department Administrator",
        "faculty_no": "admin",
        "enrollment_no": "AMU-ADMIN-01",
        "password": "admin123",
        "programme": "Department of Computer Science",
        "current_semester": 0,
        "completed_credits": 0,
        "backlogs": 0,
        "cgpa": 10.0,
        "department": "Computer Science",
        "email": "admin.cs@amu.ac.in",
        "phone": "9876543200",
        "max_credits_per_sem": 0,
        "min_attendance_pct": 0,
        "role": "admin",
    },
}

# Faculty no → user_id index (case-insensitive)
FACULTY_INDEX = {v["faculty_no"].lower(): k for k, v in USERS.items()}
FACULTY_INDEX["admin01"] = "ADMIN001"

COURSE_CATALOG = {
    "MCA": {
        "semester_3": {
            "core": [
                {"course_code": "MCA301", "course_title": "Advanced Database Systems", "credits": 4, "type": "Core"},
                {"course_code": "MCA302", "course_title": "Design and Analysis of Algorithms", "credits": 4, "type": "Core"},
                {"course_code": "MCA303", "course_title": "Software Engineering", "credits": 4, "type": "Core"},
                {"course_code": "MCA304", "course_title": "Computer Networks", "credits": 4, "type": "Core"},
            ],
            "elective": [
                {"course_code": "MCA3E01", "course_title": "Machine Learning", "credits": 3, "type": "Elective"},
                {"course_code": "MCA3E02", "course_title": "Cloud Computing", "credits": 3, "type": "Elective"},
                {"course_code": "MCA3E03", "course_title": "Cyber Security", "credits": 3, "type": "Elective"},
                {"course_code": "MCA3E04", "course_title": "Blockchain Technology", "credits": 3, "type": "Elective"},
            ],
            "vac": [
                {"course_code": "MCA3V01", "course_title": "Open Source Technologies", "credits": 2, "type": "VAC"},
                {"course_code": "MCA3V02", "course_title": "Technical Communication", "credits": 2, "type": "VAC"},
            ],
            "lab": [
                {"course_code": "MCA305L", "course_title": "Advanced Database Lab", "credits": 2, "type": "Lab"},
                {"course_code": "MCA306L", "course_title": "Mini Project", "credits": 2, "type": "Lab"},
            ],
        }
    },
    "FYUP": {
        "semester_5": {
            "core": [
                {"course_code": "FYUP501", "course_title": "Operating Systems", "credits": 4, "type": "Core"},
                {"course_code": "FYUP502", "course_title": "Theory of Computation", "credits": 4, "type": "Core"},
                {"course_code": "FYUP503", "course_title": "Computer Architecture", "credits": 4, "type": "Core"},
            ],
            "elective": [
                {"course_code": "FYUP5E01", "course_title": "Artificial Intelligence", "credits": 3, "type": "Elective"},
                {"course_code": "FYUP5E02", "course_title": "Data Science", "credits": 3, "type": "Elective"},
            ],
            "vac": [
                {"course_code": "FYUP5V01", "course_title": "Ethics in Computing", "credits": 2, "type": "VAC"},
            ],
            "lab": [
                {"course_code": "FYUP504L", "course_title": "OS Lab", "credits": 2, "type": "Lab"},
            ],
        }
    }
}


def get_student(student_id: str) -> dict | None:
    return USERS.get(student_id)


def get_student_by_faculty_no(faculty_no: str) -> dict | None:
    sid = FACULTY_INDEX.get(faculty_no.lower().strip())
    return USERS.get(sid) if sid else None


def get_courses(programme: str, semester: int) -> dict:
    sem_key = f"semester_{semester}"
    prog = COURSE_CATALOG.get(programme, {})
    return prog.get(sem_key, {})


def authenticate(faculty_no: str, password: str) -> dict | None:
    user = get_student_by_faculty_no(faculty_no)
    if user and user.get("password") == password:
        return user
    return None
