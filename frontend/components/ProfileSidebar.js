// components/ProfileSidebar.js
export default function ProfileSidebar({ student, onLogout, onSelectPrompt, onOpenUpload, onOpenSettings }) {
  if (!student) return null;

  const isAdmin = student.role === 'admin';
  const cgpaColor = student.cgpa >= 8.5 ? 'text-green-600' :
                    student.cgpa >= 7.0 ? 'text-blue-600' : 'text-orange-600';

  return (
    <div className="bg-white border-r border-gray-200 w-72 flex flex-col h-full shadow-sm">
      {/* Header */}
      <div className={`p-4 text-white ${isAdmin ? 'bg-indigo-900' : 'bg-amu-green'}`}>
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-full bg-white/20 flex items-center justify-center text-xl font-bold shadow-inner">
            {isAdmin ? '🛡️' : student.name.charAt(0)}
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-sm truncate">{student.name}</p>
            <p className="text-xs text-white/80">
              {isAdmin ? 'System Administrator' : `${student.programme} · Sem ${student.current_semester}`}
            </p>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="p-4 space-y-3 flex-1 overflow-y-auto">
        {isAdmin ? (
          // ================= ADMIN CONSOLE VIEW =================
          <>
            <div className="flex justify-between items-center">
              <h3 className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Admin Controls</h3>
              <span className="text-[10px] bg-indigo-50 text-indigo-700 font-bold px-2 py-0.5 rounded-full border border-indigo-200">
                Admin Mode
              </span>
            </div>

            <div className="space-y-2">
              <button
                onClick={onOpenUpload}
                className="w-full text-left text-xs bg-amu-light text-amu-dark hover:bg-amu-green hover:text-white font-semibold px-3 py-2.5 rounded-xl transition flex items-center gap-2 border border-amu-green/20 shadow-sm"
              >
                <span className="text-base">📂</span>
                <div>
                  <p className="font-semibold">Manage Knowledge Base</p>
                  <p className="text-[10px] opacity-80 font-normal">Upload PDFs & circulars</p>
                </div>
              </button>

              <button
                onClick={onOpenSettings}
                className="w-full text-left text-xs bg-gray-50 text-gray-700 hover:bg-gray-100 font-semibold px-3 py-2.5 rounded-xl transition flex items-center gap-2 border border-gray-200 shadow-sm"
              >
                <span className="text-base">⚙️</span>
                <div>
                  <p className="font-semibold">Gemini AI Settings</p>
                  <p className="text-[10px] text-gray-500 font-normal">Update API credentials</p>
                </div>
              </button>
            </div>

            <div className="bg-gray-50 rounded-xl p-3 space-y-2 border border-gray-100 text-xs text-gray-600">
              <p className="font-semibold text-gray-700">Administrator Privileges:</p>
              <ul className="list-disc list-inside space-y-1 text-[11px] text-gray-500">
                <li>PDF Chunking & Ingestion</li>
                <li>Live AMU Web Notice Scraping</li>
                <li>RAG Vector Re-indexing</li>
                <li>LLM Model & Key Configuration</li>
              </ul>
            </div>

            {/* Admin Prompts */}
            <div className="pt-2 border-t border-gray-100">
              <h3 className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2">Admin Prompts</h3>
              <div className="space-y-1">
                {ADMIN_PROMPTS.map((p, i) => (
                  <button
                    key={i}
                    onClick={() => onSelectPrompt && onSelectPrompt(p)}
                    className="w-full text-left text-xs text-gray-600 hover:text-indigo-700 hover:bg-indigo-50 px-2.5 py-1.5 rounded-lg transition line-clamp-1"
                  >
                    🔍 {p}
                  </button>
                ))}
              </div>
            </div>
          </>
        ) : (
          // ================= REGULAR STUDENT VIEW =================
          <>
            <div className="flex justify-between items-center">
              <h3 className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Student Profile</h3>
              <span className="text-[10px] bg-green-50 text-green-700 font-semibold px-2 py-0.5 rounded-full border border-green-200">
                ERP Verified
              </span>
            </div>

            <div className="bg-gray-50 rounded-xl p-3 space-y-2 border border-gray-100">
              <InfoRow label="Faculty No." value={student.faculty_no} />
              <InfoRow label="Enrollment No." value={student.enrollment_no} />
              <InfoRow label="Department" value={student.department} />
              <InfoRow label="Semester" value={`Semester ${student.current_semester}`} />
              <InfoRow label="Completed Credits" value={`${student.completed_credits} cr`} />
              <InfoRow
                label="Active Backlogs"
                value={student.backlogs}
                className={student.backlogs > 0 ? 'text-orange-600 font-bold' : 'text-green-600 font-bold'}
              />
              <InfoRow
                label="CGPA"
                value={student.cgpa}
                className={cgpaColor + ' font-bold'}
              />
            </div>

            {/* Status Badge */}
            <div>
              {student.cgpa >= 8.5 && student.backlogs === 0 && (
                <div className="bg-green-50 border border-green-200 text-green-700 text-xs px-2.5 py-1.5 rounded-lg font-medium flex items-center gap-1.5">
                  <span>🏆</span>
                  <span>Merit Scholarship Eligible</span>
                </div>
              )}
              {student.backlogs > 0 && (
                <div className="bg-orange-50 border border-orange-200 text-orange-700 text-xs px-2.5 py-1.5 rounded-lg font-medium flex items-center gap-1.5">
                  <span>⚠️</span>
                  <span>Has Active Backlogs</span>
                </div>
              )}
            </div>

            {/* Quick prompts */}
            <div className="pt-3 border-t border-gray-100">
              <h3 className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2">Student Services</h3>
              <div className="space-y-1">
                {STUDENT_PROMPTS.map((p, i) => (
                  <button
                    key={i}
                    onClick={() => onSelectPrompt && onSelectPrompt(p)}
                    className="w-full text-left text-xs text-gray-600 hover:text-amu-green hover:bg-amu-light px-2.5 py-1.5 rounded-lg transition line-clamp-1"
                  >
                    💡 {p}
                  </button>
                ))}
              </div>
            </div>
          </>
        )}
      </div>

      {/* Logout */}
      <div className="p-3 border-t border-gray-200 bg-gray-50">
        <button
          onClick={onLogout}
          className="w-full text-xs text-red-500 hover:text-red-700 hover:bg-red-50 py-2 rounded-lg transition font-medium"
        >
          Sign Out of {isAdmin ? 'Admin Console' : 'ERP'}
        </button>
      </div>
    </div>
  );
}

function InfoRow({ label, value, className = 'text-gray-700' }) {
  return (
    <div className="flex justify-between items-center text-xs">
      <span className="text-gray-500">{label}</span>
      <span className={`font-medium ${className}`}>{value}</span>
    </div>
  );
}

const STUDENT_PROMPTS = [
  'What is my enrollment number?',
  'Which subjects should I register for this semester?',
  'What is the minimum attendance required for exams?',
  'Am I eligible for the merit scholarship?',
  'What is the fee structure for MCA students?',
  'How do I apply for a bonafide certificate?',
];

const ADMIN_PROMPTS = [
  'What course code and topics are covered in the mca 3rd semester lab manual?',
  'How many documents are currently indexed in the knowledge base?',
  'Summarize the FYUP exam regulations',
  'What are the eligibility criteria for the merit scholarship?',
];
