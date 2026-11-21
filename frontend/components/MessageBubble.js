// components/MessageBubble.js
import ReactMarkdown from 'react-markdown';

const INTENT_LABELS = {
  GENERAL_RULE: { label: 'General Rule', color: 'bg-blue-100 text-blue-700', icon: '📋' },
  COURSE_REGISTRATION: { label: 'Course Registration', color: 'bg-purple-100 text-purple-700', icon: '📚' },
  ATTENDANCE: { label: 'Attendance', color: 'bg-yellow-100 text-yellow-700', icon: '📊' },
  FEE: { label: 'Fee Query', color: 'bg-orange-100 text-orange-700', icon: '💳' },
  ESCALATION: { label: 'Escalated', color: 'bg-red-100 text-red-700', icon: '🎫' },
};

export default function MessageBubble({ message }) {
  const isUser = message.role === 'user';

  if (isUser) {
    return (
      <div className="flex justify-end message-enter">
        <div className="max-w-[75%] bg-amu-green text-white rounded-2xl rounded-tr-sm px-4 py-3 shadow-sm">
          <p className="text-sm">{message.content}</p>
          <p className="text-xs text-white/60 mt-1 text-right">{message.time}</p>
        </div>
      </div>
    );
  }

  // Assistant message
  const meta = message.metadata;
  const intentInfo = meta?.intent ? INTENT_LABELS[meta.intent] : null;

  return (
    <div className="flex justify-start message-enter">
      <div className="max-w-[85%] space-y-2">
        {/* Bot avatar + header */}
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-amu-green rounded-full flex items-center justify-center text-white text-xs font-bold shadow">
            U
          </div>
          <span className="text-xs font-semibold text-amu-green">UniWise AI</span>
          {intentInfo && (
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${intentInfo.color}`}>
              {intentInfo.icon} {intentInfo.label}
            </span>
          )}
          {meta?.confidence && (
            <span className="text-xs text-gray-400">
              {Math.round(meta.confidence * 100)}% confidence
            </span>
          )}
        </div>

        {/* Message body */}
        <div className="bg-white rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm border border-gray-100">
          <div className="prose prose-sm max-w-none text-gray-800 prose-headings:text-amu-green prose-strong:text-gray-900">
            <ReactMarkdown>{message.content}</ReactMarkdown>
          </div>

          {/* Citations */}
          {meta?.citations && meta.citations.length > 0 && (
            <div className="mt-3 pt-3 border-t border-gray-100">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">📄 Sources</p>
              <div className="space-y-1">
                {meta.citations.map((c, i) => (
                  <div key={c.chunk_id} className="flex gap-2 text-xs text-gray-600 bg-amu-light rounded px-2 py-1.5">
                    <span className="font-bold text-amu-green shrink-0">[{i + 1}]</span>
                    <div>
                      <span className="font-semibold">{c.source}</span>
                      <span className="text-gray-500"> — {c.text}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Ticket raised badge */}
          {meta?.ticket_raised && meta?.ticket_id && (
            <div className="mt-3 bg-orange-50 border border-orange-200 rounded-lg px-3 py-2">
              <p className="text-xs font-semibold text-orange-700">🎫 Support Ticket Raised</p>
              <p className="text-xs text-orange-600 font-mono mt-0.5">{meta.ticket_id}</p>
              <p className="text-xs text-orange-500 mt-0.5">Expected resolution: within 7 working days</p>
            </div>
          )}
        </div>

        <p className="text-xs text-gray-400 ml-9">{message.time}</p>
      </div>
    </div>
  );
}
