import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Image from 'next/image';
import {
  Home,
  MessageSquare,
  User,
  FileText,
  Shield,
  LogOut,
  ChevronRight,
  ArrowRight,
  Send,
  Upload,
  Key,
  Globe,
  SlidersHorizontal,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

import MessageBubble from '../components/MessageBubble';
import DocumentUploadModal from '../components/DocumentUploadModal';
import SettingsModal from '../components/SettingsModal';

const API = process.env.NEXT_PUBLIC_API_URL || '';

function getTime() {
  return new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
}

const RECENT_AMU_UPDATES = [
  { title: 'List of Eligible / Not Eligible Candidates for PDCC', date: 'Apr 12, 2025' },
  { title: 'Admit Cards for PDCC, 2026-27', date: 'Apr 10, 2025' },
  { title: 'Registration cum Examination Form for Class (X & XII), 2026-27', date: 'Apr 08, 2025' },
  { title: 'Notice for Re-Evaluation (UG/PG/Ph.D)', date: 'Apr 05, 2025' },
  { title: 'Notice regarding Admission to B.B.A. course (at AMU Centre), 2026-27', date: 'Mar 28, 2025' },
];

export default function AppPortal() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('home'); // 'home' | 'chat' | 'profile' | 'documents' | 'admin'
  const [student, setStudent] = useState(null);
  const [sessionId, setSessionId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [homeInput, setHomeInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [enableWebSearch, setEnableWebSearch] = useState(false);
  const [aiStatus, setAiStatus] = useState({ configured: false });

  // Admin Modals
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [settingsModalOpen, setSettingsModalOpen] = useState(false);

  // Document list
  const [docList, setDocList] = useState([]);

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
    const parsed = JSON.parse(stu);
    setStudent(parsed);

    fetchAiStatus();
    fetchDocuments();

    // Default greeting message
    setMessages([{
      id: 1,
      role: 'assistant',
      content: `Hello ${parsed.name}. I am **UniWise AI**, the academic assistant for Aligarh Muslim University.\n\nI can assist you with:\n- Course registration advising and credit limits\n- Attendance criteria and examination condonation rules\n- Fee schedules, merit scholarships, and deadlines\n- Ingested curriculum documents and lab manuals\n\nPlease enter your inquiry below.`,
      time: getTime(),
      metadata: { citations: [] }
    }]);
  }, []);

  useEffect(() => {
    if (activeTab === 'chat') {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, activeTab]);

  async function fetchAiStatus() {
    try {
      const res = await fetch(`${API}/settings/api-key`);
      const data = await res.json();
      setAiStatus(data);
    } catch (e) {
      console.error(e);
    }
  }

  async function fetchDocuments() {
    try {
      const res = await fetch(`${API}/documents`);
      const data = await res.json();
      setDocList(data.documents || []);
    } catch (e) {
      console.error(e);
    }
  }

  async function sendMessage(queryToSend) {
    const text = queryToSend || input;
    if (!text.trim() || loading) return;

    // Switch to chat tab if not on it
    if (activeTab !== 'chat') {
      setActiveTab('chat');
    }

    setInput('');
    setHomeInput('');
    setLoading(true);

    const userMsg = {
      id: Date.now(),
      role: 'user',
      content: text,
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
          query: text,
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
        content: 'Could not connect to the backend server. Please verify the API service is active.',
        time: getTime(),
        metadata: { citations: [] },
      }));
    } finally {
      setLoading(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }

  function handleLogout() {
    sessionStorage.clear();
    router.push('/');
  }

  return (
    <>
      <Head>
        <title>UNIWISE — AMU Student Services</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <div className="flex h-screen bg-[#f7faf8] overflow-hidden">
        
        {/* ================= LEFT SIDEBAR (Matching Image 3) ================= */}
        <aside className="w-64 bg-amu-sidebar text-white flex flex-col justify-between select-none shrink-0 z-20">
          <div>
            {/* AMU Crest & University Header */}
            <div className="p-6 pb-4 flex flex-col items-center text-center border-b border-white/10">
              <div className="w-16 h-16 relative mb-2">
                <Image
                  src="/amu-logo.png"
                  alt="AMU Logo"
                  width={64}
                  height={64}
                  className="object-contain drop-shadow"
                  priority
                />
              </div>
              <h2 className="text-[11px] font-semibold tracking-[0.2em] uppercase text-white/90">
                Aligarh Muslim
              </h2>
              <h2 className="text-[11px] font-semibold tracking-[0.2em] uppercase text-white/90">
                University
              </h2>
            </div>

            {/* Navigation Menu */}
            <nav className="p-3 space-y-1 mt-2">
              <SidebarItem
                icon={<Home className="w-4 h-4" />}
                label="Home"
                active={activeTab === 'home'}
                onClick={() => setActiveTab('home')}
              />
              <SidebarItem
                icon={<MessageSquare className="w-4 h-4" />}
                label="Chat"
                active={activeTab === 'chat'}
                onClick={() => setActiveTab('chat')}
              />
              <SidebarItem
                icon={<User className="w-4 h-4" />}
                label="My Profile"
                active={activeTab === 'profile'}
                onClick={() => setActiveTab('profile')}
              />
              <SidebarItem
                icon={<FileText className="w-4 h-4" />}
                label="Documents"
                active={activeTab === 'documents'}
                onClick={() => { setActiveTab('documents'); fetchDocuments(); }}
              />

              {/* Admin Panel (Admin Only) */}
              {isAdmin && (
                <SidebarItem
                  icon={<Shield className="w-4 h-4 text-emerald-400" />}
                  label="Admin Panel"
                  active={activeTab === 'admin'}
                  onClick={() => setActiveTab('admin')}
                  badge="Admin"
                />
              )}
            </nav>
          </div>

          {/* Logout at bottom */}
          <div className="p-4 border-t border-white/10 bg-amu-darker/40">
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-3 py-2 text-xs text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition"
            >
              <LogOut className="w-4 h-4" />
              <span>Logout</span>
            </button>
          </div>
        </aside>

        {/* ================= MAIN CONTENT AREA ================= */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          
          {/* Top Banner Bar */}
          <header className="bg-white border-b border-amu-border/70 px-8 py-3.5 flex items-center justify-between shrink-0">
            <div>
              <h1 className="text-xl font-bold tracking-tight text-amu-primary font-serif-amu">
                UNIWISE
              </h1>
              <p className="text-[11px] text-gray-500">Your AI Assistant for AMU Student Services</p>
            </div>

            <div className="flex items-center gap-4 text-xs text-gray-600">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                <span>{isAdmin ? 'System Administrator' : `Welcome, ${student?.name || 'Student'}`}</span>
              </div>
            </div>
          </header>

          {/* View Container */}
          <main className="flex-1 overflow-y-auto">

            {/* TAB 1: HOME (Dashboard matching Image 3) */}
            {activeTab === 'home' && (
              <div className="p-8 max-w-7xl mx-auto space-y-6">
                
                {/* Hero Card with AMU Silhouette */}
                <div className="bg-gradient-to-r from-[#e5efe8] via-[#e2eee6] to-[#d6e7dc] rounded-2xl p-8 border border-amu-border/60 shadow-sm relative overflow-hidden">
                  <div className="max-w-2xl relative z-10 space-y-4">
                    <h2 className="text-3xl font-bold text-gray-900 tracking-tight">
                      Hello, {student?.name ? student.name.split(' ')[0] : 'Student'}!
                    </h2>
                    <p className="text-sm text-gray-600">
                      Ask anything about university rules, courses, or policies.
                    </p>

                    {/* Quick Input Bar inside Hero Card */}
                    <div className="relative max-w-xl">
                      <input
                        type="text"
                        value={homeInput}
                        onChange={e => setHomeInput(e.target.value)}
                        onKeyDown={e => {
                          if (e.key === 'Enter' && homeInput.trim()) {
                            sendMessage(homeInput);
                          }
                        }}
                        placeholder="Type your question..."
                        className="w-full bg-white border border-amu-border rounded-full py-3.5 pl-6 pr-14 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-amu-primary shadow-sm"
                      />
                      <button
                        onClick={() => homeInput.trim() && sendMessage(homeInput)}
                        className="absolute right-2 top-2 w-9 h-9 rounded-full bg-amu-sidebar hover:bg-amu-primary text-white flex items-center justify-center transition shadow-sm"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Grid: 3 Action Cards (Left) + Recent Updates (Right) */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  
                  {/* Left Column (2 Cols wide on large screen): 3 Action Cards */}
                  <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-3 gap-4">
                    <ActionCard
                      title="University Rules"
                      description="Get answers about academic rules and notices."
                      onClick={() => sendMessage('What are the official attendance and examination rules?')}
                    />
                    <ActionCard
                      title="Course Planning"
                      description="Plan your course selection with ease."
                      onClick={() => sendMessage('Which subjects should I register for this semester?')}
                    />
                    <ActionCard
                      title="Credit Calculator"
                      description="Check your credits and eligibility."
                      onClick={() => sendMessage('Check my credit eligibility and completed credits.')}
                    />
                  </div>

                  {/* Right Column: Recent Updates matching Image 2 */}
                  <div className="bg-white rounded-2xl p-6 border border-amu-border/70 shadow-sm flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-4">
                        <h3 className="font-bold text-sm text-gray-900">Recent Updates</h3>
                        <a
                          href="https://amucoe.ac.in"
                          target="_blank"
                          rel="noreferrer"
                          className="text-xs text-amu-primary hover:underline font-medium flex items-center gap-1"
                        >
                          View All <ArrowRight className="w-3 h-3" />
                        </a>
                      </div>

                      <div className="space-y-3.5">
                        {RECENT_AMU_UPDATES.map((item, idx) => (
                          <div key={idx} className="group cursor-pointer">
                            <p className="text-xs font-medium text-gray-800 group-hover:text-amu-primary transition leading-snug">
                              • {item.title}
                            </p>
                            <span className="text-[10px] text-gray-400 block mt-0.5 ml-2.5">
                              {item.date}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="pt-4 mt-4 border-t border-gray-100 flex justify-end">
                      <a
                        href="https://amucoe.ac.in"
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs bg-amu-maroon hover:bg-red-900 text-white font-medium px-4 py-1.5 rounded-full transition"
                      >
                        View more...
                      </a>
                    </div>
                  </div>
                </div>

                {/* Footer matching Image 3 */}
                <div className="pt-6 border-t border-amu-border/60 flex items-center justify-between text-[11px] text-gray-400">
                  <span>Knowledge · Guidance · Empowerment</span>
                  <span>Aligarh Muslim University, Aligarh</span>
                </div>
              </div>
            )}

            {/* TAB 2: CHAT */}
            {activeTab === 'chat' && (
              <div className="flex flex-col h-full bg-[#f9fbf9]">
                
                {/* Messages stream */}
                <div className="flex-1 overflow-y-auto p-6 space-y-4 max-w-4xl mx-auto w-full">
                  {messages.map(msg => {
                    if (msg.role === 'typing') return <TypingIndicator key={msg.id} />;
                    return <MessageBubble key={msg.id} message={msg} />;
                  })}
                  <div ref={messagesEndRef} />
                </div>

                {/* Chat Input Bar */}
                <div className="bg-white border-t border-amu-border/70 p-4 shrink-0">
                  <div className="max-w-4xl mx-auto space-y-2">
                    
                    {/* Minimal Toggle for Live Search */}
                    <div className="flex items-center justify-between text-xs text-gray-500 px-1">
                      <label className="inline-flex items-center gap-2 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={enableWebSearch}
                          onChange={e => setEnableWebSearch(e.target.checked)}
                          className="rounded text-amu-primary focus:ring-amu-primary w-3.5 h-3.5"
                        />
                        <span className="text-[11px]">Include live official web circulars from amu.ac.in</span>
                      </label>
                      <span className="text-[11px] text-gray-400">Press Enter to send</span>
                    </div>

                    {/* Input box */}
                    <div className="flex gap-2 items-center bg-[#f7faf8] border border-amu-border/80 rounded-xl px-3 py-1.5 focus-within:border-amu-primary focus-within:bg-white transition">
                      <input
                        ref={inputRef}
                        type="text"
                        value={input}
                        onChange={e => setInput(e.target.value)}
                        onKeyDown={e => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            sendMessage();
                          }
                        }}
                        placeholder="Ask about courses, exams, attendance, credit rules, or documents..."
                        disabled={loading}
                        className="flex-1 bg-transparent border-none text-sm text-gray-800 placeholder-gray-400 focus:outline-none px-2 py-1.5"
                      />
                      <button
                        onClick={() => sendMessage()}
                        disabled={loading || !input.trim()}
                        className="w-8 h-8 rounded-lg bg-amu-primary hover:bg-amu-dark text-white flex items-center justify-center transition disabled:opacity-40 shrink-0"
                      >
                        <Send className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 3: MY PROFILE */}
            {activeTab === 'profile' && (
              <div className="p-8 max-w-3xl mx-auto space-y-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 font-serif-amu">Student Lifecycle Record</h2>
                  <p className="text-xs text-gray-500">Official student verification data from AMU ERP portal.</p>
                </div>

                <div className="bg-white rounded-2xl p-6 border border-amu-border/70 shadow-sm space-y-4">
                  <div className="flex items-center gap-4 pb-4 border-b border-gray-100">
                    <div className="w-14 h-14 rounded-full bg-amu-light text-amu-primary flex items-center justify-center font-bold text-xl">
                      {student?.name?.charAt(0) || 'S'}
                    </div>
                    <div>
                      <h3 className="font-bold text-base text-gray-900">{student?.name}</h3>
                      <p className="text-xs text-gray-500">{student?.department} · {student?.programme}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-xs">
                    <ProfileField label="Faculty Number" value={student?.faculty_no} />
                    <ProfileField label="Enrollment Number" value={student?.enrollment_no} />
                    <ProfileField label="Current Semester" value={`Semester ${student?.current_semester}`} />
                    <ProfileField label="Completed Credits" value={`${student?.completed_credits} credits`} />
                    <ProfileField label="Active Backlogs" value={student?.backlogs} highlight={student?.backlogs > 0} />
                    <ProfileField label="Cumulative CGPA" value={student?.cgpa} />
                    <ProfileField label="Email" value={student?.email || 'N/A'} />
                    <ProfileField label="Account Role" value={student?.role || 'Student'} />
                  </div>
                </div>
              </div>
            )}

            {/* TAB 4: DOCUMENTS */}
            {activeTab === 'documents' && (
              <div className="p-8 max-w-4xl mx-auto space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 font-serif-amu">Academic Documents & Circulars</h2>
                    <p className="text-xs text-gray-500">All university ordinances, syllabi, and lab manuals indexed in RAG.</p>
                  </div>
                  {isAdmin && (
                    <button
                      onClick={() => setUploadModalOpen(true)}
                      className="text-xs bg-amu-primary hover:bg-amu-dark text-white font-medium px-4 py-2 rounded-lg transition flex items-center gap-2"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span>Upload Document</span>
                    </button>
                  )}
                </div>

                <div className="space-y-3">
                  {docList.map((doc, idx) => (
                    <div key={idx} className="bg-white p-4 rounded-xl border border-amu-border/70 flex items-center justify-between">
                      <div>
                        <h4 className="text-sm font-semibold text-gray-900">{doc.source}</h4>
                        <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{doc.preview}</p>
                        <span className="inline-block text-[10px] text-gray-400 mt-2">
                          Chunks: {doc.chunks_count} · Programme: {doc.programme}
                        </span>
                      </div>
                      <button
                        onClick={() => sendMessage(`Summarize the contents of document ${doc.source}`)}
                        className="text-xs text-amu-primary hover:underline font-medium shrink-0 ml-4"
                      >
                        Ask Questions →
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB 5: ADMIN PANEL (ADMIN ONLY) */}
            {activeTab === 'admin' && isAdmin && (
              <div className="p-8 max-w-3xl mx-auto space-y-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 font-serif-amu">System Administrator Console</h2>
                  <p className="text-xs text-gray-500">Manage RAG vector chunks, documents, and Gemini AI configuration.</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div
                    onClick={() => setUploadModalOpen(true)}
                    className="bg-white p-6 rounded-2xl border border-amu-border/70 hover:border-amu-primary transition cursor-pointer space-y-2"
                  >
                    <Upload className="w-6 h-6 text-amu-primary" />
                    <h3 className="font-semibold text-sm text-gray-900">Document Ingestion</h3>
                    <p className="text-xs text-gray-500">Upload PDF lab manuals, circulars, or web links to chunk into vector store.</p>
                  </div>

                  <div
                    onClick={() => setSettingsModalOpen(true)}
                    className="bg-white p-6 rounded-2xl border border-amu-border/70 hover:border-amu-primary transition cursor-pointer space-y-2"
                  >
                    <Key className="w-6 h-6 text-amu-primary" />
                    <h3 className="font-semibold text-sm text-gray-900">Gemini AI Settings</h3>
                    <p className="text-xs text-gray-500">Configure or verify the Gemini LLM API credentials.</p>
                  </div>
                </div>
              </div>
            )}

          </main>
        </div>
      </div>

      {/* Admin Modals */}
      {isAdmin && (
        <>
          <DocumentUploadModal
            isOpen={uploadModalOpen}
            onClose={() => setUploadModalOpen(false)}
            onDocumentAdded={() => {
              fetchDocuments();
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

function SidebarItem({ icon, label, active, onClick, badge }) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-medium transition ${
        active
          ? 'bg-amu-sidebarActive text-white font-semibold'
          : 'text-white/75 hover:text-white hover:bg-white/5'
      }`}
    >
      <div className="flex items-center gap-3">
        {icon}
        <span>{label}</span>
      </div>
      {badge && (
        <span className="text-[9px] bg-emerald-500/20 text-emerald-300 font-semibold px-1.5 py-0.5 rounded border border-emerald-500/30">
          {badge}
        </span>
      )}
    </button>
  );
}

function ActionCard({ title, description, onClick }) {
  return (
    <div
      onClick={onClick}
      className="bg-white rounded-2xl p-5 border border-amu-border/70 hover:border-amu-primary transition cursor-pointer shadow-sm flex flex-col justify-between group"
    >
      <div className="space-y-1.5">
        <h3 className="font-bold text-sm text-gray-900 group-hover:text-amu-primary transition">
          {title}
        </h3>
        <p className="text-xs text-gray-500 leading-relaxed">
          {description}
        </p>
      </div>
      <div className="pt-4 flex justify-end">
        <span className="w-7 h-7 rounded-full bg-amu-light text-amu-primary group-hover:bg-amu-primary group-hover:text-white flex items-center justify-center transition">
          <ArrowRight className="w-3.5 h-3.5" />
        </span>
      </div>
    </div>
  );
}

function ProfileField({ label, value, highlight }) {
  return (
    <div className="p-3 bg-gray-50 rounded-lg border border-gray-100">
      <span className="text-[11px] text-gray-400 block">{label}</span>
      <span className={`font-semibold mt-0.5 block ${highlight ? 'text-amber-600' : 'text-gray-800'}`}>
        {value || '—'}
      </span>
    </div>
  );
}

function TypingIndicator() {
  return (
    <div className="flex justify-start message-enter">
      <div className="bg-white rounded-2xl rounded-tl-sm px-4 py-2.5 shadow-sm border border-amu-border/70 flex items-center gap-1.5">
        <span className="text-xs text-amu-primary font-medium mr-1">Searching documents</span>
        <div className="w-1.5 h-1.5 bg-amu-primary rounded-full typing-dot" />
        <div className="w-1.5 h-1.5 bg-amu-primary rounded-full typing-dot" />
        <div className="w-1.5 h-1.5 bg-amu-primary rounded-full typing-dot" />
      </div>
    </div>
  );
}
