import { useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

// Demo credentials shown on page
const DEMO_USERS = [
  { name: 'Afroz Alam', faculty_no: '25CAMSA170', password: 'password123', programme: 'Student (MCA Sem 3)', role: 'student' },
  { name: 'Sara Khan',   faculty_no: '25CAMSA171', password: 'password123', programme: 'Student (Backlog case)', role: 'student' },
  { name: 'Dept Administrator', faculty_no: 'admin', password: 'admin123', programme: 'Admin (RAG & AI Settings)', role: 'admin' },
];

export default function Login() {
  const router = useRouter();
  const [form, setForm] = useState({ faculty_no: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleLogin(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch(`${API}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.detail || 'Login failed');
        setLoading(false);
        return;
      }
      const data = await res.json();
      sessionStorage.setItem('session_id', data.session_id);
      sessionStorage.setItem('student', JSON.stringify(data.student));
      router.push('/chat');
    } catch (err) {
      setError('Cannot connect to server. Make sure the backend is running on port 8000.');
      setLoading(false);
    }
  }

  function fillDemo(u) {
    setForm({ faculty_no: u.faculty_no, password: u.password });
  }

  return (
    <>
      <Head>
        <title>UniWise AI — Login</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-amu-dark to-amu-green p-4">

        {/* Logo Card */}
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8">

          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-amu-green rounded-2xl mb-4 shadow-lg">
              <span className="text-3xl">🎓</span>
            </div>
            <h1 className="text-3xl font-bold text-amu-green">UniWise AI</h1>
            <p className="text-gray-500 mt-1 text-sm">Agentic RAG Pipeline for Student Services</p>
            <p className="text-xs text-gray-400 mt-1">Department of Computer Science, AMU</p>
          </div>

          {/* Error */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 mb-4 text-sm">
              {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Faculty Number</label>
              <input
                type="text"
                value={form.faculty_no}
                onChange={e => setForm(f => ({ ...f, faculty_no: e.target.value }))}
                placeholder="e.g. 25CAMSA170"
                required
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amu-green focus:border-transparent transition"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <input
                type="password"
                value={form.password}
                onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                placeholder="Enter your password"
                required
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amu-green focus:border-transparent transition"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-amu-green hover:bg-amu-dark text-white font-semibold rounded-lg py-3 transition disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                  </svg>
                  Signing in...
                </>
              ) : 'Sign In'}
            </button>
          </form>

          {/* Demo Users */}
          <div className="mt-6">
            <p className="text-xs text-gray-500 text-center mb-3 font-medium uppercase tracking-wide">Demo Accounts</p>
            <div className="space-y-2">
              {DEMO_USERS.map(u => (
                <button
                  key={u.faculty_no}
                  onClick={() => fillDemo(u)}
                  className="w-full text-left border border-gray-200 rounded-lg px-3 py-2 hover:bg-amu-light hover:border-amu-green transition text-sm flex justify-between items-center"
                >
                  <span className="font-medium text-gray-700">{u.name}</span>
                  <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded">{u.programme}</span>
                </button>
              ))}
            </div>
            <p className="text-xs text-gray-400 mt-2 text-center">Click a demo user to fill credentials</p>
          </div>
        </div>

        <p className="text-white/60 text-xs mt-6">
          MCA Mini Project · Session 2025-26 · Afroz Alam (GR3328)
        </p>
      </div>
    </>
  );
}
