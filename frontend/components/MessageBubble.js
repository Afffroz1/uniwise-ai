// components/MessageBubble.js
import ReactMarkdown from 'react-markdown';

const INTENT_CONFIG = {
  GENERAL_RULE: { label: 'University Rule', color: 'bg-emerald-50 text-emerald-800 border-emerald-200' },
  COURSE_REGISTRATION: { label: 'Course Advisory', color: 'bg-teal-50 text-teal-800 border-teal-200' },
  ATTENDANCE: { label: 'Attendance Rule', color: 'bg-slate-100 text-slate-800 border-slate-300' },
  FEE: { label: 'Fee Regulation', color: 'bg-amber-50 text-amber-800 border-amber-200' },
  STUDENT_PROFILE: { label: 'Student Record', color: 'bg-emerald-50 text-emerald-800 border-emerald-200' },
  ESCALATION: { label: 'Support Ticket', color: 'bg-rose-50 text-rose-800 border-rose-200' },
};

export default function MessageBubble({ message }) {
  const isUser = message.role === 'user';

  if (isUser) {
    return (
      <div className="flex justify-end message-enter">
        <div className="max-w-[75%] bg-amu-primary text-white rounded-2xl rounded-tr-sm px-4 py-3 shadow-sm text-sm">
          <p className="leading-relaxed whitespace-pre-wrap">{message.content}</p>
          <span className="block text-[11px] text-white/60 mt-1 text-right">{message.time}</span>
        </div>
      </div>
    );
  }

  // Assistant message
  const meta = message.metadata;
  const intentInfo = meta?.intent ? INTENT_CONFIG[meta.intent] || { label: 'Academic Advisory', color: 'bg-gray-100 text-gray-700 border-gray-200' } : null;

  return (
    <div className="flex justify-start message-enter">
      <div className="max-w-[85%] space-y-1.5">
        
        {/* Header tag */}
        <div className="flex items-center gap-2 px-1">
          <span className="text-xs font-semibold text-amu-primary tracking-wide">UniWise AI</span>
          {intentInfo && (
            <span className={`text-[10px] font-medium px-2 py-0.5 rounded border ${intentInfo.color}`}>
              {intentInfo.label}
            </span>
          )}
          {meta?.confidence && (
            <span className="text-[11px] text-gray-400">
              {Math.round(meta.confidence * 100)}% verified
            </span>
          )}
        </div>

        {/* Bubble */}
        <div className="bg-white rounded-2xl rounded-tl-sm px-5 py-4 shadow-sm border border-amu-border/70 text-gray-800">
          <div className="prose prose-sm max-w-none text-gray-800 prose-headings:text-amu-primary prose-headings:font-semibold prose-strong:text-gray-900 prose-strong:font-semibold leading-relaxed">
            <ReactMarkdown>{message.content}</ReactMarkdown>
          </div>

          {/* Citations section (clean & minimal) */}
          {meta?.citations && meta.citations.length > 0 && (
            <div className="mt-4 pt-3 border-t border-gray-100 space-y-1.5">
              <p className="text-[11px] font-semibold text-gray-400 tracking-wider uppercase">Sources & References</p>
              <div className="space-y-1">
                {meta.citations.map((c, i) => (
                  <div key={i} className="flex gap-2 text-xs text-gray-600 bg-amu-light/60 border border-amu-border/50 rounded-lg p-2">
                    <span className="font-mono text-amu-primary font-bold shrink-0">[{i + 1}]</span>
                    <div className="min-w-0">
                      <p className="font-semibold text-gray-900 truncate">{c.source}</p>
                      {c.text && <p className="text-gray-500 text-[11px] mt-0.5 line-clamp-2">{c.text}</p>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Ticket notification */}
          {meta?.ticket_raised && meta?.ticket_id && (
            <div className="mt-3 bg-amber-50 border border-amber-200 text-amber-900 rounded-lg p-3 text-xs">
              <p className="font-semibold">Support Ticket Created: {meta.ticket_id}</p>
              <p className="text-amber-800 text-[11px] mt-0.5">
                Your inquiry has been escalated to the department cell. Expected response within 7 working days.
              </p>
            </div>
          )}
        </div>

        <span className="block text-[11px] text-gray-400 px-1">{message.time}</span>
      </div>
    </div>
  );
}
