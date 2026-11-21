import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import MessageBubble from '../components/MessageBubble';
import ProfileSidebar from '../components/ProfileSidebar';
import DocumentUploadModal from '../components/DocumentUploadModal';
import SettingsModal from '../components/SettingsModal';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

const STUDENT_SUGGESTED_QUESTIONS = [
  'What is my enrollment number?',
  'Which subjects should I register for this semester?',
  'What is the minimum attendance required to sit for exams?',
  'Am I eligible for the merit scholarship this semester?',
  'What is the fee structure for MCA students?',
  'How do I apply for a bonafide certificate?',
];

const ADMIN_SUGGESTED_QUESTIONS = [
  'What course code and topics are covered in the mca 3rd semester lab manual?',
  'Summarize the FYUP attendance and backlog rules',
  'What are the mandatory core courses for MCA Semester 3?',
  'What is the annual tuition fee for MCA?',
];

function getTime() {
  return new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
}

export default function Chat() {
  const router = useRouter();
  const [student, setStudent] = useState(null);
  const [sessionId, setSessionId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [enableWebSearch, setEnableWebSearch] = useState(false);
  const [aiStatus, setAiStatus] = useState({ configured: false });

  // Modals (admin only)
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [settingsModalOpen, setSettingsModalOpen] = useState(false);

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const isAdmin = student?.role === 'admin';

  useEffect(() => {
    const sid = sessionStorage.getItem('session_id');
    const stu = sessionStorage.getItem('student');
    if (!sid || !stu) {
      router.push('/');
      return;
    }
    setSessionId(sid);
    const parsedStu = JSON.parse(stu);
    setStudent(parsedStu);

    fetchAiStatus();

    // Welcome message personalized by role
    if (parsedStu.role === 'admin') {
      setMessages([{
        id: 1,
        role: 'assistant',
        content: `Hello **${parsedStu.name}**! 🛡️\n\nWelcome to the **UniWise AI Admin Console**.\n\nAs an Administrator, you have access to:\n- 📂 **Knowledge Base Management:** Upload PDF circulars, syllabi, or lab manuals and re-index vector chunks.\n- ⚙️ **AI Engine Settings:** Configure and verify the Gemini API Key.\n- 🔍 **RAG Inspection:** Test academic queries against the indexed university database.\n\nUse the buttons above or in the sidebar to manage documents.`,
        time: getTime(),
        metadata: { citations: [], ticket_raised: false },
      }]);
    } else {
      setMessages([{
        id: 1,
        role: 'assistant',
        content: `Hello **${parsedStu.name}**! 👋 Welcome to **UniWise AI**, your Agentic RAG Assistant for **AMU Student Services**.\n\nI am connected to your **Student Lifecycle Portal** profile:\n- 🎓 **Enrolled:** ${parsedStu.programme} · Semester ${parsedStu.current_semester}\n- 🆔 **Faculty No:** \`${parsedStu.faculty_no}\` | **Enrollment:** \`${parsedStu.enrollment_no}\`\n- ⭐ **CGPA:** ${parsedStu.cgpa} (${parsedStu.cgpa >= 8.5 ? '🏆 Merit Scholarship Eligible' : 'Good Standing'})\n\n**How I can help you today:**\n- 📚 **Course Advising & Registration** (Deterministic credit caps & elective choices)\n- 📊 **Attendance Calculations & Debarred Rules**\n- 💳 **Tuition & Hostel Fees, Scholarships**\n- 📋 **University Ordinances, Lab Manuals & Circulars**\n\nAsk me anything below!`,
        time: getTime(),
        metadata: { citations: [], ticket_raised: false },
      }]);
    }
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function fetchAiStatus() {
    try {
      const res = await fetch(`${API}/settings/api-key`);
      const data = await res.json();
      setAiStatus(data);
    } catch (e) {
      console.error(e);
    }
  }

  async function sendMessage(query = input) {
    const textToSend = typeof query === 'string' ? query : input;
    if (!textToSend.trim() || loading) return;
    setInput('');
    setLoading(true);

    const userMsg = {
      id: Date.now(),
      role: 'user',
      content: textToSend,
      time: getTime(),
    };
    setMessages(prev => [...prev, userMsg]);

    const typingId = Date.now() + 1;
    setMessages(prev => [...prev, { id: typingId, role: 'typing', content: '', time: '' }]);

    try {
      const res = await fetch(`${API}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          student_id: student?.student_id,
          query: textToSend,
          session_id: sessionId,
          enable_web_search: enableWebSearch,
        }),
      });

      const data = await res.json();

      setMessages(prev => prev.filter(m => m.id !== typingId).concat({
        id: Date.now() + 2,
        role: 'assistant',
        content: data.answer,
        time: getTime(),
        metadata: {
          citations: data.citations || [],
          intent: data.intent,
          ticket_raised: data.ticket_raised,
          ticket_id: data.ticket_id,
          confidence: data.confidence,
        },
      }));
    } catch (err) {
      setMessages(prev => prev.filter(m => m.id !== typingId).concat({
        id: Date.now() + 2,
        role: 'assistant',
        content: '⚠️ Could not connect to backend server. Please verify backend is running on `http://localhost:8000`.',
        time: getTime(),
        metadata: { citations: [] },
      }));
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  }

  function handleLogout() {
    sessionStorage.clear();
    router.push('/');
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  const suggestedQuestions = isAdmin ? ADMIN_SUGGESTED_QUESTIONS : STUDENT_SUGGESTED_QUESTIONS;

  return (
    <>
      <Head>
        <title>{isAdmin ? 'UniWise AI — Admin Console' : 'UniWise AI — AMU Student Services'}</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <div className="flex h-screen bg-gray-50 overflow-hidden">

        {/* Sidebar */}
        {sidebarOpen && (
          <ProfileSidebar
            student={student}
            onLogout={handleLogout}
            onSelectPrompt={p => sendMessage(p)}
            onOpenUpload={() => setUploadModalOpen(true)}
            onOpenSettings={() => setSettingsModalOpen(true)}
          />
        )}

        {/* Main chat area */}
        <div className="flex flex-col flex-1 min-w-0">

          {/* Top navbar */}
          <header className="bg-white border-b border-gray-200 px-4 py-2.5 flex items-center justify-between shadow-sm z-10">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setSidebarOpen(o => !o)}
                className="p-1.5 hover:bg-gray-100 rounded-lg transition text-gray-600"
                title="Toggle sidebar"
              >
                ☰
              </button>
              <div className="flex items-center gap-2">
                <span className="text-xl">🎓</span>
                <div>
                  <h1 className="font-bold text-amu-green text-sm flex items-center gap-2">
                    UniWise AI
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${isAdmin ? 'bg-indigo-100 text-indigo-800 border border-indigo-300' : 'bg-amu-light text-amu-dark border border-amu-green/20'}`}>
                      {isAdmin ? 'Admin Console' : 'AMU ERP Student Services'}
                    </span>
                  </h1>
                  <p className="text-[11px] text-gray-400">Agentic RAG Pipeline for Student Services</p>
                </div>
              </div>
            </div>

            {/* Quick action bar */}
            <div className="flex items-center gap-2">
              {/* ADMIN ONLY BUTTONS */}
              {isAdmin && (
                <>
                  <button
                    onClick={() => setUploadModalOpen(true)}
                    className="text-xs bg-amu-light hover:bg-amu-green text-amu-dark hover:text-white font-semibold px-3 py-1.5 rounded-lg border border-amu-green/30 transition flex items-center gap-1.5 shadow-sm"
                    title="Upload PDF or AMU Circular into RAG"
                  >
                    <span>📂</span>
                    <span>Upload Document</span>
                  </button>

                  <button
                    onClick={() => setSettingsModalOpen(true)}
                    className={`text-xs font-semibold px-3 py-1.5 rounded-lg border transition flex items-center gap-1.5 shadow-sm ${aiStatus.configured ? 'bg-green-50 text-green-700 border-green-300' : 'bg-amber-50 text-amber-700 border-amber-300'}`}
                    title="Configure Gemini LLM Key"
                  >
                    <span>{aiStatus.configured ? '⚡' : '⚙️'}</span>
                    <span>{aiStatus.configured ? 'Gemini AI' : 'Set API Key'}</span>
                  </button>
                </>
              )}

              <div className="flex items-center gap-1.5 pl-2 border-l border-gray-200">
                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                <span className="text-[11px] text-gray-500 font-medium">{isAdmin ? 'Admin Connected' : 'ERP Connected'}</span>
              </div>
            </div>
          </header>

          {/* Messages stream */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map(msg => {
              if (msg.role === 'typing') return <TypingIndicator key={msg.id} />;
              return <MessageBubble key={msg.id} message={msg} />;
            })}
            <div ref={messagesEndRef} />
          </div>

          {/* Suggested questions (shown when only welcome message) */}
          {messages.length <= 1 && (
            <div className="px-4 pb-2">
              <p className="text-xs text-gray-500 mb-2 font-medium">💡 Quick questions to test:</p>
              <div className="flex flex-wrap gap-2">
                {suggestedQuestions.map((q, i) => (
                  <button
                    key={i}
                    onClick={() => sendMessage(q)}
                    className="text-xs bg-white text-gray-700 border border-gray-200 hover:border-amu-green hover:bg-amu-light px-3 py-1.5 rounded-full transition shadow-sm"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Input area */}
          <div className="bg-white border-t border-gray-200 px-4 py-3">
            <div className="max-w-4xl mx-auto space-y-2">
              
              {/* Live Web Search Option */}
              <div className="flex items-center justify-between text-xs text-gray-500 px-1">
                <label className="inline-flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={enableWebSearch}
                    onChange={e => setEnableWebSearch(e.target.checked)}
                    className="rounded text-amu-green focus:ring-amu-green"
                  />
                  <span>🌐 Live AMU Web Search (search official notices on amu.ac.in)</span>
                </label>
                
                {/* Admin Only shortcut link */}
                {isAdmin && (
                  <button
                    onClick={() => setUploadModalOpen(true)}
                    className="text-amu-green hover:underline font-medium"
                  >
                    + Add PDF document to RAG
                  </button>
                )}
              </div>

              {/* Chat Text Input */}
              <div className="flex gap-2 items-end">
                <div className="flex-1 relative">
                  <textarea
                    ref={inputRef}
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={isAdmin ? "Ask any administrative query or test uploaded document retrieval..." : "Ask about your course, semester, attendance, credit limits, or exam rules..."}
                    rows={1}
                    disabled={loading}
                    className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amu-green resize-none disabled:opacity-60 transition"
                    style={{ minHeight: '44px', maxHeight: '120px' }}
                  />
                </div>
                <button
                  onClick={() => sendMessage()}
                  disabled={loading || !input.trim()}
                  className="bg-amu-green hover:bg-amu-dark text-white rounded-xl px-5 py-2.5 font-medium text-sm disabled:opacity-50 transition flex items-center gap-1.5 shrink-0 shadow-sm"
                >
                  {loading ? (
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                    </svg>
                  ) : (
                    <span>↑ Send</span>
                  )}
                </button>
              </div>

              <p className="text-[11px] text-gray-400 text-center">
                Press Enter to send · Shift+Enter for new line · Deterministic credit & attendance math · Hybrid RAG citations
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Admin Modals */}
      {isAdmin && (
        <>
          <DocumentUploadModal
            isOpen={uploadModalOpen}
            onClose={() => setUploadModalOpen(false)}
            onDocumentAdded={() => {
              setMessages(prev => [...prev, {
                id: Date.now(),
                role: 'assistant',
                content: '✅ **New document indexed into RAG!** The vector store and BM25 indices have been refreshed.',
                time: getTime(),
                metadata: { citations: [] }
              }]);
            }}
          />

          <SettingsModal
            isOpen={settingsModalOpen}
            onClose={() => setSettingsModalOpen(false)}
            onApiKeyUpdated={() => {
              fetchAiStatus();
            }}
          />
        </>
      )}
    </>
  );
}

function TypingIndicator() {
  return (
    <div className="flex justify-start message-enter">
      <div className="bg-white rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm border border-gray-100 flex items-center gap-1.5">
        <span className="text-xs text-amu-green font-semibold mr-1">UniWise AI is thinking</span>
        {[0, 1, 2].map(i => (
          <div key={i} className="w-1.5 h-1.5 bg-amu-green rounded-full typing-dot" />
        ))}
      </div>
    </div>
  );
}
