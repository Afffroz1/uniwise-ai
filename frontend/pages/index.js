import { useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Image from 'next/image';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

const DEMO_USERS = [
  { name: 'Afroz Alam', faculty_no: '25CAMSA170', password: 'password123', label: 'Student · MCA Sem 3', role: 'student' },
  { name: 'Sara Khan', faculty_no: '25CAMSA171', password: 'password123', label: 'Student · Backlog case', role: 'student' },
  { name: 'Dept Administrator', faculty_no: 'admin', password: 'admin123', label: 'Admin Console Access', role: 'admin' },
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
        setError(data.detail || 'Authentication failed');
        setLoading(false);
        return;
      }
      const data = await res.json();
      sessionStorage.setItem('session_id', data.session_id);
      sessionStorage.setItem('student', JSON.stringify(data.student));
      router.push('/chat');
    } catch (err) {
      setError('Cannot connect to server. Please verify backend is running on port 8000.');
      setLoading(false);
    }
  }

  function fillDemo(u) {
    setForm({ faculty_no: u.faculty_no, password: u.password });
  }

  return (
    <>
      <Head>
        <title>Sign In — UNIWISE | AMU Student Services</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <div className="min-h-screen flex flex-col items-center justify-center bg-[#f2f7f4] p-4 text-gray-800">
        
        {/* Main Card */}
        <div className="bg-white border border-amu-border/80 rounded-2xl shadow-sm w-full max-w-md p-8">
          
          {/* Header with Crest */}
          <div className="text-center mb-6">
            <div className="w-16 h-16 mx-auto mb-3 relative">
              <Image
                src="/amu-logo.png"
                alt="AMU Seal"
                width={64}
                height={64}
                className="object-contain"
                priority
              />
            </div>
            <h1 className="text-xl font-bold tracking-tight text-amu-primary font-serif-amu uppercase">
              UNIWISE
            </h1>
            <p className="text-xs text-gray-500 mt-0.5">Aligarh Muslim University Student Lifecycle Portal</p>
          </div>

          {/* Error notice */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-3 py-2.5 mb-4 text-xs">
              {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleLogin} className="space-y-3.5">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Faculty Number or Username
              </label>
              <input
                type="text"
                value={form.faculty_no}
                onChange={e => setForm(f => ({ ...f, faculty_no: e.target.value }))}
                placeholder="e.g. 25CAMSA170 or admin"
                required
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-xs text-gray-800 focus:outline-none focus:ring-2 focus:ring-amu-primary focus:border-transparent transition"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Password
              </label>
              <input
                type="password"
                value={form.password}
                onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                placeholder="Enter password"
                required
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-xs text-gray-800 focus:outline-none focus:ring-2 focus:ring-amu-primary focus:border-transparent transition"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-amu-primary hover:bg-amu-dark text-white font-medium rounded-lg py-2.5 text-xs transition disabled:opacity-50"
            >
              {loading ? 'Authenticating...' : 'Sign In to Portal'}
            </button>
          </form>

          {/* Demo Users */}
          <div className="mt-6 pt-4 border-t border-gray-100">
            <p className="text-[10px] text-gray-400 uppercase font-bold tracking-wider mb-2 text-center">
              Quick Sign In Accounts
            </p>
            <div className="space-y-1.5">
              {DEMO_USERS.map((u, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => fillDemo(u)}
                  className="w-full text-left border border-gray-200 rounded-lg px-3 py-2 hover:bg-amu-light hover:border-amu-primary/40 transition text-xs flex justify-between items-center"
                >
                  <span className="font-medium text-gray-800">{u.name}</span>
                  <span className="text-[10px] text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                    {u.label}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <p className="text-gray-400 text-[11px] mt-6 tracking-wide">
          Aligarh Muslim University, Aligarh · Department of Computer Science
        </p>
      </div>
    </>
  );
}
