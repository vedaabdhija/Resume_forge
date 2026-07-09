import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { Settings as SettingsIcon, Shield, Bell, Key, Sparkles, RefreshCw } from 'lucide-react';

export const Settings: React.FC = () => {
  const { user, updateUser } = useAuth();
  const { theme, toggleTheme } = useTheme();
  
  // Forms states
  const [fullName, setFullName] = useState(user?.full_name || '');
  const [geminiKey, setGeminiKey] = useState(localStorage.getItem('GEMINI_API_KEY') || '');
  const [openaiKey, setOpenaiKey] = useState(localStorage.getItem('OPENAI_API_KEY') || '');
  const [demoMode, setDemoMode] = useState(localStorage.getItem('DEMO_MODE') !== 'false');

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (user) {
      updateUser({
        ...user,
        full_name: fullName
      });
      alert('Profile updated successfully.');
    }
  };

  const handleSaveKeys = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem('GEMINI_API_KEY', geminiKey);
    localStorage.setItem('OPENAI_API_KEY', openaiKey);
    localStorage.setItem('DEMO_MODE', demoMode.toString());
    alert('AI credentials and Mode preferences saved. Refreshing configuration...');
    window.location.reload();
  };

  return (
    <div className="space-y-8 max-w-3xl">
      {/* Title */}
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight">System Settings</h1>
        <p className="text-slate-400 text-sm mt-1">Configure profile details, active themes, API modes, and third-party AI keys.</p>
      </div>

      <div className="space-y-6">
        
        {/* Profile */}
        <div className="glass-panel p-6 rounded-2xl space-y-4">
          <h3 className="font-extrabold text-base flex items-center space-x-2">
            <Shield size={16} className="text-brand-500" />
            <span>Profile Details</span>
          </h3>

          <form onSubmit={handleSaveProfile} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">Email (Read only)</label>
                <input
                  type="email"
                  disabled
                  value={user?.email || ''}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-800/40 text-slate-500 text-sm cursor-not-allowed"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">Full Name</label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white/20 dark:bg-slate-900/20 focus:outline-none focus:ring-2 focus:ring-brand-500 text-sm"
                  placeholder="Enter full name"
                />
              </div>
            </div>

            <button
              type="submit"
              className="px-4 py-2.5 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-semibold text-xs shadow-md transition-colors"
            >
              Update Profile
            </button>
          </form>
        </div>

        {/* Display / Theme settings */}
        <div className="glass-panel p-6 rounded-2xl space-y-4">
          <h3 className="font-extrabold text-base flex items-center space-x-2">
            <Sparkles size={16} className="text-accent-teal" />
            <span>Display Layout Theme</span>
          </h3>
          <div className="flex justify-between items-center text-sm">
            <div>
              <p className="font-semibold">Active Theme Mode</p>
              <p className="text-xs text-slate-400">Toggle light / dark layouts dynamically.</p>
            </div>
            <button
              onClick={toggleTheme}
              className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800/40 text-xs font-bold capitalize"
            >
              {theme} Mode
            </button>
          </div>
        </div>

        {/* AI Key Integrations / Demo Mode */}
        <div className="glass-panel p-6 rounded-2xl space-y-4">
          <h3 className="font-extrabold text-base flex items-center space-x-2">
            <Key size={16} className="text-accent-indigo" />
            <span>AI Platform Integrations</span>
          </h3>

          <form onSubmit={handleSaveKeys} className="space-y-6">
            <div className="flex items-center justify-between p-4 rounded-xl bg-brand-500/5 border border-brand-500/15">
              <div>
                <p className="text-xs font-bold text-brand-600 dark:text-brand-400">Offline Demo Mode Fallback</p>
                <p className="text-[10px] text-slate-400">Forces local mock predictions without calling remote APIs.</p>
              </div>
              <input
                type="checkbox"
                checked={demoMode}
                onChange={(e) => setDemoMode(e.target.checked)}
                className="w-4 h-4 text-brand-500 accent-brand-500 cursor-pointer"
              />
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">Google Gemini API Key</label>
                <input
                  type="password"
                  value={geminiKey}
                  onChange={(e) => setGeminiKey(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white/20 dark:bg-slate-900/20 focus:outline-none focus:ring-2 focus:ring-brand-500 text-xs font-mono"
                  placeholder="AIzaSy..."
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">OpenAI API Key (Optional)</label>
                <input
                  type="password"
                  value={openaiKey}
                  onChange={(e) => setOpenaiKey(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white/20 dark:bg-slate-900/20 focus:outline-none focus:ring-2 focus:ring-brand-500 text-xs font-mono"
                  placeholder="sk-proj-..."
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-brand-600 to-accent-indigo text-white font-semibold text-xs flex items-center justify-center space-x-1.5 shadow-md"
            >
              <RefreshCw size={14} />
              <span>Save AI Settings</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
