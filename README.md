# 🎓 UniWise AI — Agentic RAG Pipeline for Student Services

> **MCA Mini Project | CAMS-3P01 | Session 2025-26**  
> **Student:** Afroz Alam (Faculty No: 25CAMSA170 | Enrollment No: GR3328)  
> **Faculty:** Dr. Faisal Anwar · Dr. Faraz Masood · Prof. Aasim Zafar · Mr. Saad Shamim · Mr. Kausar Ali · Mr. Mohd Adnan  
> **Department of Computer Science, Aligarh Muslim University**

---

## 🚀 Quick Start (3 Commands)

### Prerequisites
- Python 3.10+ 
- Node.js 18+
- pnpm or npm

### Step 1 — Backend

```bash
cd backend
pip install -r requirements.txt
python main.py
```
Backend runs at **http://localhost:8000**

### Step 2 — Frontend (new terminal)

```bash
cd frontend
npm install
npm run dev
```
Frontend runs at **http://localhost:3000**

### Step 3 — Open Browser

Navigate to **http://localhost:3000** and log in with any demo account:

| Name | Faculty No | Password |
|------|-----------|----------|
| Afroz Alam | 25CAMSA170 | password123 |
| Sara Khan | 25CAMSA171 | password123 |
| Rajan Verma | 25CAMSA172 | password123 |

---

## 🔑 Optional: Gemini API Key (for richer answers)

Create `backend/.env`:
```
GEMINI_API_KEY=your_key_here
```

Get a free key at [aistudio.google.com](https://aistudio.google.com).  
**Without the key, the system works perfectly using rule-based RAG fallback.**

---

## 🏗️ Architecture

```
┌───────────────────────────────────────────────┐
│          TIER 1 — FRONTEND                    │
│    Next.js 14 + Tailwind CSS (Port 3000)      │
│    Chat UI · Profile Sidebar · Citations      │
└──────────────────────┬────────────────────────┘
                       │ HTTP REST API
┌──────────────────────▼────────────────────────┐
│          TIER 2 — BACKEND (Port 8000)         │
│    FastAPI (Python)                           │
│    ├── Intent Classifier                      │
│    ├── Hybrid RAG (BM25 + cosine vectors)     │
│    ├── Deterministic Tools                    │
│    │   ├── check_eligibility()                │
│    │   ├── get_recommended_courses()          │
│    │   ├── get_attendance_status()            │
│    │   └── raise_ticket()                     │
│    └── Gemini LLM Agent (optional)            │
└──────────────────────┬────────────────────────┘
                       │
┌──────────────────────▼────────────────────────┐
│          TIER 3 — DATA LAYER                  │
│    knowledge_base.py — 11 AMU document chunks │
│    mock_erp.py — 3 student profiles, courses  │
│    tools.py — in-memory ticket store          │
└───────────────────────────────────────────────┘
```

---

## ✨ Key Features

| Feature | Description |
|---------|-------------|
| **Hybrid RAG** | BM25 keyword + cosine vector retrieval — no hallucinations |
| **Agentic Router** | Classifies query intent, routes to right tool/document |
| **Deterministic Tools** | Exact credit cap, eligibility, and attendance math |
| **Citation System** | Every answer cites the source university document |
| **Ticket Escalation** | Auto-raises support ticket when confidence is low |
| **Mock ERP Layer** | Mirrors AMU ERP schema; real API swap-in ready |
| **Gemini Integration** | Optional LLM for richer natural language answers |

---

## 📁 File Structure

```
uniwise/
├── backend/
│   ├── main.py           ← FastAPI entry point, all routes
│   ├── agent.py          ← Agentic router, Gemini integration
│   ├── rag.py            ← BM25 + vector hybrid retrieval engine
│   ├── tools.py          ← Deterministic Python tools
│   ├── mock_erp.py       ← Mock student profiles & course catalog
│   ├── knowledge_base.py ← 11 AMU-style document chunks
│   ├── models.py         ← Pydantic request/response schemas
│   └── requirements.txt
├── frontend/
│   ├── pages/
│   │   ├── index.js      ← Login page
│   │   └── chat.js       ← Main chat interface
│   ├── components/
│   │   ├── MessageBubble.js   ← Chat message with citations
│   │   ├── ProfileSidebar.js  ← Student profile panel
│   │   └── CitationBadge.js   ← Inline citation badges
│   ├── styles/globals.css
│   ├── package.json
│   ├── tailwind.config.js
│   └── next.config.js
└── README.md
```

---

## 🌐 API Reference

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/` | GET | Health check |
| `/auth/login` | POST | Login with faculty_no + password |
| `/auth/logout` | POST | Invalidate session |
| `/chat` | POST | Main RAG chat endpoint |
| `/student/{id}` | GET | Get student profile |
| `/tickets` | GET | List support tickets |
| `/knowledge-base` | GET | List all document chunks |

---

## 🎯 Presentation Talking Points

1. **Why Agentic RAG?** — Pure vector search hallucinates on math. Our agent uses deterministic Python tools for exact credit/attendance calculations.
2. **Hybrid Search** — BM25 handles exact keyword matches ("attendance 75%"); vector search handles paraphrased queries ("can I sit for exams?")
3. **No hallucination** — Every answer is sourced; confidence scoring triggers ticket escalation automatically
4. **ERP Integration** — Mock layer mirrors real AMU schema; OAuth swap-in planned for production integration with erp.amucoe.ac.in
5. **Production ready** — FastAPI async backend can handle concurrent LLM calls; Next.js SSR for fast page loads

---

## 🔮 Future Roadmap (Post-Presentation)

- [ ] Real AMU ERP OAuth integration
- [ ] PDF ingestion pipeline with OCR
- [ ] MongoDB Atlas Vector Search (replace in-memory)
- [ ] LangGraph multi-agent orchestration
- [ ] Admin panel for knowledge base management
- [ ] WhatsApp/Telegram bot integration

---

*Built with ❤️ for AMU students*
