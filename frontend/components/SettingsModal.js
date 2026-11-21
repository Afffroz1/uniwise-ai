import { useState, useEffect } from 'react';
import { X, Key, CheckCircle, AlertCircle } from 'lucide-react';

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
      setMsg({ text: data.message, error: false });
      setApiKey('');
      checkKeyStatus();
      if (onApiKeyUpdated) onApiKeyUpdated();
    } catch (err) {
      setMsg({ text: err.message, error: true });
    } finally {
      setLoading(false);
    }
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden flex flex-col border border-amu-border">
        
        {/* Header */}
        <div className="bg-amu-primary text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Key className="w-4 h-4" />
            <h2 className="font-bold text-xs uppercase tracking-wider">Gemini AI Configuration</h2>
          </div>
          <button onClick={onClose} className="text-white/80 hover:text-white p-1">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4 text-xs">
          
          {/* Status Box */}
          <div className={`p-3 rounded-xl border flex items-center gap-3 ${currentStatus.configured ? 'bg-emerald-50 border-emerald-200 text-emerald-900' : 'bg-amber-50 border-amber-200 text-amber-900'}`}>
            {currentStatus.configured ? (
              <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
            )}
            <div>
              <p className="font-semibold">
                {currentStatus.configured ? 'Gemini 3.1 Flash Active' : 'API Key Missing'}
              </p>
              <p className="text-[11px] opacity-80 mt-0.5">
                {currentStatus.configured
                  ? `Authenticated Key: ${currentStatus.masked}`
                  : 'Enter a Gemini API key to activate natural conversation.'}
              </p>
            </div>
          </div>

          {msg.text && (
            <div className={`p-2.5 rounded-lg text-xs ${msg.error ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-emerald-50 text-emerald-800 border border-emerald-200'}`}>
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
                placeholder="Enter Gemini API key"
                className="w-full text-xs border border-gray-300 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-amu-primary"
              />
              <p className="text-[11px] text-gray-400 mt-1">
                Obtain a key from the Google AI Studio console (aistudio.google.com).
              </p>
            </div>

            <button
              type="submit"
              disabled={loading || !apiKey.trim()}
              className="w-full bg-amu-primary hover:bg-amu-dark text-white text-xs font-medium py-2 rounded-lg transition disabled:opacity-50"
            >
              {loading ? 'Saving Key...' : 'Save & Verify Key'}
            </button>
          </form>
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-6 py-2.5 border-t border-gray-200 flex justify-end">
          <button
            onClick={onClose}
            className="text-xs font-medium text-gray-600 hover:text-gray-800 px-3 py-1"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
