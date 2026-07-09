import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useApi } from '../hooks/useApi';
import { motion } from 'framer-motion';
import { Sparkles, ArrowRight } from 'lucide-react';

export const Register: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const api = useApi();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [isDemoMode, setIsDemoMode] = useState(true);

  useEffect(() => {
    // Query backend to check active Demo Mode state
    const checkDemoMode = async () => {
      try {
        const res = await api.get('/health');
        setIsDemoMode(res.demo_mode === true);
      } catch (err) {
        setIsDemoMode(true);
      }
    };
    checkDemoMode();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) return;

    setLoading(true);
    try {
      await api.post('/auth/register', { 
        email, 
        password,
        full_name: fullName 
      });
      
      // Auto Login
      const loginRes = await api.post('/auth/login', { email, password });
      const userProfile = await api.get('/auth/me');
      login(loginRes.access_token, userProfile);
      navigate('/');
    } catch (err: any) {
      if (!isDemoMode) {
        // Show validation issues (e.g. Email already exists)
        alert(err.detail || "Registration failed. This email may already be registered.");
      } else {
        console.warn("Register API failed, simulating sign up: ", err);
        login("demo-jwt-hash-key", { id: 1, email, full_name: fullName || "Demo Account", role: "user" });
        navigate('/');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background-light dark:bg-background-dark px-4 font-sans select-none">
      
      {/* Grid Backdrop */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:14px_24px] pointer-events-none"></div>

      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="w-full max-w-md glass-panel p-8 rounded-3xl space-y-6 relative overflow-hidden"
      >
        <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-brand-500 to-accent-indigo"></div>

        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-brand-500 to-accent-indigo flex items-center justify-center text-white mx-auto font-black text-2xl shadow-lg">
            R
          </div>
          <h2 className="text-2xl font-extrabold tracking-tight">Create Account</h2>
          <p className="text-slate-400 text-xs font-semibold">Join ResumeForge AI optimization platform.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Full Name</label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white/20 dark:bg-slate-900/20 focus:outline-none focus:ring-2 focus:ring-brand-500 text-sm"
              placeholder="e.g. John Doe"
            />
          </div>

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
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white/20 dark:bg-slate-900/20 focus:outline-none focus:ring-2 focus:ring-brand-500 text-sm"
              placeholder="&bull;&bull;&bull;&bull;&bull;&bull;&bull;&bull;"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 rounded-xl bg-gradient-to-r from-brand-600 to-accent-indigo hover:from-brand-700 hover:to-accent-indigo text-white font-semibold text-sm flex items-center justify-center space-x-1.5 transition-all shadow-md active:scale-98"
          >
            <span>{loading ? 'Creating Account...' : 'Get Started'}</span>
            <ArrowRight size={14} />
          </button>
        </form>

        <div className="text-center pt-2 text-xs">
          <span className="text-slate-400">Already have an account? </span>
          <Link to="/login" className="text-brand-500 hover:underline font-bold">Sign In</Link>
        </div>
      </motion.div>
    </div>
  );
};
