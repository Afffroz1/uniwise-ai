import { useState, useEffect } from 'react';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export default function SettingsModal({ isOpen, onClose, onApiKeyUpdated }) {
  const [apiKey, setApiKey] = useState('');
  const [currentStatus, setCurrentStatus] = useState({ configured: false, masked: '' });
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState({ text: '', error: false });

  useEffect(() => {
    if (isOpen) {
      checkKeyStatus();
    }
  }, [isOpen]);

  async function checkKeyStatus() {
    try {
      const res = await fetch(`${API}/settings/api-key`);
      const data = await res.json();
      setCurrentStatus(data);
    } catch (e) {
      console.error(e);
    }
  }

  async function handleSaveKey(e) {
    e.preventDefault();
    setLoading(true);
    setMsg({ text: '', error: false });

    try {
      const res = await fetch(`${API}/settings/api-key`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ api_key: apiKey.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Failed');
      setMsg({ text: '✅ ' + data.message, error: false });
      setApiKey('');
      checkKeyStatus();
      if (onApiKeyUpdated) onApiKeyUpdated();
    } catch (err) {
      setMsg({ text: '❌ ' + err.message, error: true });
    } finally {
      setLoading(false);
    }
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col">
        
        {/* Header */}
        <div className="bg-amu-dark text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl">⚙️</span>
            <div>
              <h2 className="font-bold text-base">UniWise AI Settings</h2>
              <p className="text-xs text-white/80">Configure LLM Engine & API Credentials</p>
            </div>
          </div>
          <button onClick={onClose} className="text-white/80 hover:text-white text-2xl font-bold">
            &times;
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          
          {/* Current Status Box */}
          <div className={`p-3 rounded-xl border flex items-center gap-3 ${currentStatus.configured ? 'bg-green-50 border-green-200' : 'bg-amber-50 border-amber-200'}`}>
            <span className="text-2xl">{currentStatus.configured ? '🟢' : '🟡'}</span>
            <div>
              <p className="text-xs font-semibold text-gray-800">
                {currentStatus.configured ? 'Gemini LLM Active' : 'Local Synthesizer Mode'}
              </p>
              <p className="text-[11px] text-gray-500">
                {currentStatus.configured
                  ? `Key: ${currentStatus.masked} (Deep reasoning & tool calling)`
                  : 'Add a free Gemini API key to activate natural conversation.'}
              </p>
            </div>
          </div>

          {msg.text && (
            <div className={`p-2.5 rounded-lg text-xs font-medium ${msg.error ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>
              {msg.text}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSaveKey} className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Gemini API Key
              </label>
              <input
                type="password"
                value={apiKey}
                onChange={e => setApiKey(e.target.value)}
                placeholder="AIzaSy..."
                className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-amu-green"
              />
              <p className="text-[11px] text-gray-400 mt-1">
                Get a free key instantly at{' '}
                <a
                  href="https://aistudio.google.com/app/apikey"
                  target="_blank"
                  rel="noreferrer"
                  className="text-amu-green underline font-medium"
                >
                  aistudio.google.com
                </a>
              </p>
            </div>

            <button
              type="submit"
              disabled={loading || !apiKey.trim()}
              className="w-full bg-amu-green hover:bg-amu-dark text-white text-xs font-semibold py-2.5 rounded-lg transition disabled:opacity-50"
            >
              {loading ? 'Saving...' : 'Save & Activate Key'}
            </button>
          </form>

          {/* Architecture note */}
          <div className="pt-3 border-t border-gray-100 text-[11px] text-gray-400 space-y-1">
            <p><b>Pipeline:</b> Hybrid BM25 + Vector RAG with deterministic Python tools.</p>
            <p><b>Model:</b> Gemini 1.5 Flash (default agent router).</p>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-6 py-3 border-t border-gray-200 flex justify-end">
          <button
            onClick={onClose}
            className="text-xs font-semibold text-gray-600 hover:text-gray-800 px-4 py-1.5"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
