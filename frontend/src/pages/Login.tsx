import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useApi } from '../hooks/useApi';
import { motion } from 'framer-motion';
import { Sparkles, ArrowRight, ShieldCheck, Check } from 'lucide-react';

export const Login: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const api = useApi();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isDemoMode, setIsDemoMode] = useState(true);

  useEffect(() => {
    // 1. Load remembered email
    const savedEmail = localStorage.getItem('remember_email');
    if (savedEmail) {
      setEmail(savedEmail);
      setRememberMe(true);
    }

    // 2. Query backend to check active Demo Mode state
    const checkDemoMode = async () => {
      try {
        const res = await api.get('/health');
        setIsDemoMode(res.demo_mode === true);
      } catch (err) {
        setIsDemoMode(true); // Fallback to demo mode if backend is unreachable
      }
    };
    checkDemoMode();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) return;
    
    setLoading(true);
    try {
      const res = await api.post('/auth/login', { email, password });
      
      // Request active profile
      const userProfile = await api.get('/auth/me');
      login(res.access_token, userProfile);
      
      // Persist email if Remember Me is checked
      if (rememberMe) {
        localStorage.setItem('remember_email', email);
      } else {
        localStorage.removeItem('remember_email');
      }

      navigate('/');
    } catch (err: any) {
      if (!isDemoMode) {
        // In real deployment, show validation errors instead of bypass login
        alert(err.detail || "Invalid email or password. Please try again.");
      } else {
        console.warn("API Auth failed, logging in with Demo Credentials: ", err);
        login("demo-jwt-hash-key", { id: 1, email, full_name: "Demo Account", role: "user" });
        navigate('/');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background-light dark:bg-background-dark px-4 font-sans select-none">
      
      {/* Absolute Backdrop Grid */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:14px_24px] pointer-events-none"></div>

      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="w-full max-w-md glass-panel p-8 rounded-3xl space-y-6 relative overflow-hidden"
      >
        {/* Glow header */}
        <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-brand-500 to-accent-indigo"></div>

        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-brand-500 to-accent-indigo flex items-center justify-center text-white mx-auto font-black text-2xl shadow-lg">
            R
          </div>
          <h2 className="text-2xl font-extrabold tracking-tight">Welcome Back</h2>
          <p className="text-slate-400 text-xs font-semibold">Enter credentials to optimize your career path.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Email Address</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white/20 dark:bg-slate-900/20 focus:outline-none focus:ring-2 focus:ring-brand-500 text-sm"
              placeholder="e.g. name@example.com"
            />
          </div>

          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Password</label>
              <a href="#" className="text-[10px] text-brand-500 font-bold hover:underline">Forgot?</a>
            </div>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white/20 dark:bg-slate-900/20 focus:outline-none focus:ring-2 focus:ring-brand-500 text-sm"
              placeholder="&bull;&bull;&bull;&bull;&bull;&bull;&bull;&bull;"
            />
          </div>

          {/* Remember Me Checkbox */}
          <div className="flex items-center justify-between pb-2">
            <label className="flex items-center space-x-2.5 cursor-pointer text-xs font-medium text-slate-600 dark:text-slate-300">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="rounded border-slate-300 dark:border-slate-800 bg-white/10 text-brand-500 focus:ring-brand-500 focus:ring-offset-0 focus:outline-none h-4 w-4"
              />
              <span>Remember me</span>
            </label>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 rounded-xl bg-gradient-to-r from-brand-600 to-accent-indigo hover:from-brand-700 hover:to-accent-indigo text-white font-semibold text-sm flex items-center justify-center space-x-1.5 transition-all shadow-md active:scale-98"
          >
            <span>{loading ? 'Signing In...' : 'Sign In'}</span>
            <ArrowRight size={14} />
          </button>
        </form>

        {isDemoMode && (
          <div className="flex items-center space-x-2 justify-center text-[10px] font-bold text-slate-400 bg-slate-100/50 dark:bg-slate-900/40 p-2.5 rounded-xl border border-slate-200/50 dark:border-slate-800/20">
            <ShieldCheck size={14} className="text-brand-500" />
            <span>Demo Mode: Any credentials will log in immediately.</span>
          </div>
        )}

        <div className="text-center pt-2 text-xs">
          <span className="text-slate-400">Don't have an account? </span>
          <Link to="/register" className="text-brand-500 hover:underline font-bold">Sign Up</Link>
        </div>
      </motion.div>
    </div>
  );
};
