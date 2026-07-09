import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { 
  LayoutDashboard, 
  Sparkles, 
  CalendarDays, 
  FileText, 
  HelpCircle, 
  UserCheck, 
  Settings, 
  LogOut, 
  Sun, 
  Moon,
  Menu,
  X,
  Compass
} from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const menuItems = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'Tailor Resume', path: '/tailor', icon: Sparkles },
    { name: 'Job Tracker', path: '/tracker', icon: CalendarDays },
    { name: 'Cover Letter', path: '/cover-letter', icon: FileText },
    { name: 'Interview Prep', path: '/interview-prep', icon: HelpCircle },
    { name: 'Career Coach', path: '/career-coach', icon: Compass },
    { name: 'Settings', path: '/settings', icon: Settings },
  ];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen flex bg-background-light dark:bg-background-dark text-slate-800 dark:text-slate-100 transition-colors duration-200">
      
      {/* Mobile sidebar toggle */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-2 rounded-lg bg-white/80 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 backdrop-blur-md shadow-md"
        >
          {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Sidebar navigation */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 glass-panel border-r flex flex-col justify-between transform transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="p-6">
          <div className="flex items-center space-x-3 mb-8">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-500 to-accent-indigo flex items-center justify-center text-white font-bold text-xl shadow-lg">
              R
            </div>
            <div>
              <span className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-brand-600 to-accent-indigo bg-clip-text text-transparent dark:from-brand-500 dark:to-accent-indigo">
                ResumeForge AI
              </span>
              <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Fact Verified ATS</p>
            </div>
          </div>

          <nav className="space-y-1.5">
            {menuItems.map((item) => {
              const isActive = location.pathname === item.path;
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  to={item.path}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center space-x-3 px-4 py-3 rounded-xl font-medium text-sm transition-all ${
                    isActive
                      ? 'bg-brand-500/10 text-brand-600 dark:text-brand-400 border border-brand-500/20'
                      : 'hover:bg-slate-100 dark:hover:bg-slate-800/40 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                >
                  <Icon size={18} className={isActive ? 'text-brand-500' : ''} />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="p-6 space-y-4">
          {/* User Profile Summary */}
          {user && (
            <div className="flex items-center space-x-3 p-3 rounded-2xl bg-slate-100/50 dark:bg-slate-800/30 border border-slate-200/50 dark:border-slate-800/30">
              <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-brand-500 to-accent-teal flex items-center justify-center text-white font-semibold text-sm">
                {user.full_name?.charAt(0) || user.email.charAt(0).toUpperCase()}
              </div>
              <div className="truncate flex-1">
                <p className="text-xs font-semibold text-slate-700 dark:text-slate-200 truncate">{user.full_name || 'User Account'}</p>
                <p className="text-[10px] text-slate-400 truncate">{user.email}</p>
              </div>
            </div>
          )}

          {/* Theme Toggler & Logout */}
          <div className="flex items-center justify-between border-t border-slate-200/60 dark:border-slate-800/50 pt-4">
            <button
              onClick={toggleTheme}
              className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-colors"
              title="Toggle Light/Dark Theme"
            >
              {theme === 'light' ? <Moon size={16} /> : <Sun size={16} />}
            </button>

            <button
              onClick={handleLogout}
              className="flex items-center space-x-2 px-3 py-2 rounded-xl text-rose-500 hover:bg-rose-500/10 transition-colors text-xs font-semibold"
            >
              <LogOut size={14} />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 lg:pl-64 min-h-screen flex flex-col">
        <header className="h-16 border-b border-slate-200/40 dark:border-slate-800/30 flex items-center justify-between px-6 lg:px-8 bg-white/30 dark:bg-slate-900/20 backdrop-blur-md sticky top-0 z-30">
          <div className="flex items-center space-x-2">
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-brand-500/10 text-brand-600 dark:text-brand-400 border border-brand-500/20">
              Demo Active
            </span>
          </div>
          <div className="text-xs text-slate-400 font-semibold">
            {new Date().toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </div>
        </header>

        <div className="flex-1 p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
};
