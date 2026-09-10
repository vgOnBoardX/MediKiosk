import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { ShieldCheck, LogIn, User, Mail, Lock, UserPlus, Building2, Stethoscope, ChevronDown, Eye, EyeOff } from 'lucide-react';

// Simple frontend roles — server maps these to Prisma enums
const ROLES = [
  { value: 'DOCTOR',  label: '🩺  Doctor / Consultant' },
  { value: 'NURSE',   label: '👩‍⚕️  Nurse / Paramedic' },
  { value: 'ADMIN',   label: '🏥  Hospital Admin' },
];

const TIERS = [
  { value: 'PHC',      label: 'Primary Health Centre (PHC)' },
  { value: 'DISTRICT', label: 'District Hospital (Secondary)' },
  { value: 'APEX',     label: 'Apex Hospital (AIIMS/Tertiary)' },
];

const getDashboardPath = (role) => {
  if (role === 'DOCTOR') return '/doctor';
  if (role === 'NURSE')  return '/nurse';
  if (role === 'ADMIN')  return '/admin';
  if (role === 'PATIENT') return '/kiosk';
  return '/nurse'; // fallback
};

export default function Login() {
  const [tab, setTab] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState('DOCTOR');
  const [tier, setTier] = useState('PHC');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const { login, register } = useAuth();
  const navigate = useNavigate();

  const switchTab = (t) => { setTab(t); setError(null); };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const res = await login(email, password, tier);
    setLoading(false);
    if (res.success) {
      navigate(getDashboardPath(res.user?.role));
    } else {
      setError(res.error || 'Login failed. Check your credentials.');
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError(null);
    if (!name.trim()) return setError('Please enter your full name.');
    if (password.length < 6) return setError('Password must be at least 6 characters.');
    if (password !== confirmPassword) return setError('Passwords do not match.');
    setLoading(true);
    const res = await register(email, password, name.trim(), role, tier);
    setLoading(false);
    if (res.success) {
      navigate(getDashboardPath(res.user?.role));
    } else {
      const msg = res.error || 'Registration failed.';
      if (msg.toLowerCase().includes('already')) {
        setError(null);
        // Auto-switch to login tab with message
        switchTab('login');
        setTimeout(() => setError('⚡ Account exists! Sign in with your password below.'), 50);
      } else {
        setError(msg);
      }
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 text-white">
      {/* Ambient background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-sky-600 rounded-full mix-blend-screen filter blur-[120px] opacity-15" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-600 rounded-full mix-blend-screen filter blur-[120px] opacity-15" />
      </div>

      <div className="relative z-10 w-full max-w-md">
        {/* Logo */}
        <div className="flex flex-col items-center mb-6">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-sky-400 to-indigo-600 flex items-center justify-center shadow-2xl shadow-sky-500/30 mb-3">
            <ShieldCheck className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-sky-300 to-indigo-300">
            MediKiosk
          </h1>
          <p className="text-slate-500 mt-1 text-xs tracking-widest uppercase">Sanjeevani AI-OS · Staff Portal</p>
        </div>

        {/* Card */}
        <div className="rounded-2xl border border-white/8 bg-slate-900/70 backdrop-blur-xl shadow-2xl overflow-hidden">

          {/* Tabs */}
          <div className="flex p-1.5 m-3 rounded-xl bg-slate-950/80 border border-white/5 gap-1">
            {[['login','Sign In', <LogIn key="l" className="w-3.5 h-3.5"/>], ['register','First Time? Register', <UserPlus key="r" className="w-3.5 h-3.5"/>]].map(([t, label, icon]) => (
              <button key={t} onClick={() => switchTab(t)}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-xs font-semibold transition-all duration-200 ${
                  tab === t
                    ? 'bg-gradient-to-r from-sky-500 to-indigo-500 text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}>
                {icon} {label}
              </button>
            ))}
          </div>

          <div className="px-5 pb-5">
            {/* Error Banner */}
            {error && (
              <div className="mb-3 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300 text-xs text-center">
                {error}
              </div>
            )}

            {/* ── LOGIN ── */}
            {tab === 'login' && (
              <form onSubmit={handleLogin} className="space-y-3">
                <Field label="Email / Staff ID" icon={<Mail className="w-4 h-4 text-slate-500"/>}>
                  <input type="text" value={email} onChange={e => setEmail(e.target.value)}
                    className="input-base pl-9"
                    placeholder="doctor@hospital.gov.in" required />
                </Field>
                <Field label="Password" icon={<Lock className="w-4 h-4 text-slate-500"/>}
                  suffix={
                    <button type="button" onClick={() => setShowPwd(!showPwd)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300">
                      {showPwd ? <EyeOff className="w-4 h-4"/> : <Eye className="w-4 h-4"/>}
                    </button>
                  }>
                  <input type={showPwd ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)}
                    className="input-base pl-9 pr-10" placeholder="••••••••" required />
                </Field>
                <Field label="Facility Level" icon={<Building2 className="w-4 h-4 text-slate-500"/>}>
                  <Select value={tier} onChange={setTier} options={TIERS} />
                </Field>
                <Btn loading={loading} label="Sign In to Dashboard" />
                <p className="text-center text-slate-600 text-xs pt-0.5">
                  First time here?{' '}
                  <button type="button" onClick={() => switchTab('register')} className="text-sky-400 hover:text-sky-300 font-medium">
                    Create an account →
                  </button>
                </p>
              </form>
            )}

            {/* ── REGISTER ── */}
            {tab === 'register' && (
              <form onSubmit={handleRegister} className="space-y-3">
                <Field label="Full Name" icon={<User className="w-4 h-4 text-slate-500"/>}>
                  <input type="text" value={name} onChange={e => setName(e.target.value)}
                    className="input-base pl-9" placeholder="Dr. Vashkar Ghosh" required />
                </Field>
                <Field label="Official Email" icon={<Mail className="w-4 h-4 text-slate-500"/>}>
                  <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                    className="input-base pl-9" placeholder="you@hospital.gov.in" required />
                </Field>
                <Field label="Create Password" icon={<Lock className="w-4 h-4 text-slate-500"/>}
                  suffix={
                    <button type="button" onClick={() => setShowPwd(!showPwd)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300">
                      {showPwd ? <EyeOff className="w-4 h-4"/> : <Eye className="w-4 h-4"/>}
                    </button>
                  }>
                  <input type={showPwd ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)}
                    className="input-base pl-9 pr-10" placeholder="Min. 6 characters" required />
                </Field>
                <Field label="Confirm Password" icon={<Lock className="w-4 h-4 text-slate-500"/>}>
                  <input type={showPwd ? 'text' : 'password'} value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)}
                    className="input-base pl-9" placeholder="Re-enter password" required />
                </Field>
                <Field label="Your Role" icon={<Stethoscope className="w-4 h-4 text-slate-500"/>}>
                  <Select value={role} onChange={setRole} options={ROLES} />
                </Field>
                <Field label="Facility Level" icon={<Building2 className="w-4 h-4 text-slate-500"/>}>
                  <Select value={tier} onChange={setTier} options={TIERS} />
                </Field>
                <Btn loading={loading} label="Create Account & Enter Dashboard" isRegister />
                <p className="text-center text-slate-600 text-xs pt-0.5">
                  Already registered?{' '}
                  <button type="button" onClick={() => switchTab('login')} className="text-sky-400 hover:text-sky-300 font-medium">
                    Sign in →
                  </button>
                </p>
              </form>
            )}
          </div>
        </div>

        <p className="text-center text-slate-700 text-xs mt-4">
          <a href="http://localhost:5173/kiosk" target="_blank" rel="noreferrer"
            className="text-sky-500 hover:text-sky-400 hover:underline transition-colors font-medium">
            Sanjeevani AI-OS
          </a>
          {' · MediKiosk v1.0 · Govt. of India'}
        </p>
      </div>
    </div>
  );
}

/* ── Reusable helpers ── */
function Field({ label, icon, children, suffix }) {
  return (
    <div>
      <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase tracking-widest">{label}</label>
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 z-10">{icon}</span>
        {children}
        {suffix}
      </div>
    </div>
  );
}

function Select({ value, onChange, options }) {
  return (
    <div className="relative">
      <select value={value} onChange={e => onChange(e.target.value)}
        className="input-base pl-9 pr-8 appearance-none">
        {options.map(o => <option key={o.value} value={o.value} className="bg-slate-900">{o.label}</option>)}
      </select>
      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500 pointer-events-none" />
    </div>
  );
}

function Btn({ loading, label, isRegister }) {
  return (
    <button type="submit" disabled={loading}
      className={`w-full mt-1 py-3 rounded-xl font-bold text-sm text-white transition-all duration-200
        ${loading ? 'opacity-60 cursor-not-allowed' : 'hover:opacity-90 hover:scale-[1.015] active:scale-[0.98]'}
        bg-gradient-to-r ${isRegister ? 'from-emerald-500 to-sky-500' : 'from-sky-500 to-indigo-500'}
      `}>
      {loading ? (
        <span className="flex items-center justify-center gap-2">
          <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
          </svg>
          {isRegister ? 'Creating account...' : 'Signing in...'}
        </span>
      ) : label}
    </button>
  );
}
