import React, { useEffect, useState } from 'react';
import { useApi } from '../hooks/useApi';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, 
  Search, 
  Calendar, 
  MapPin, 
  Trash2, 
  CalendarDays,
  FileText,
  CheckCircle,
  HelpCircle,
  ExternalLink
} from 'lucide-react';

interface Application {
  id: number;
  company: string;
  role: string;
  status: string;
  notes?: string;
  interview_date?: string;
}

export const Tracker: React.FC = () => {
  const api = useApi();
  const [loading, setLoading] = useState(true);
  const [apps, setApps] = useState<Application[]>([]);
  const [search, setSearch] = useState('');
  
  // Dialog modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [company, setCompany] = useState('');
  const [role, setRole] = useState('');
  const [notes, setNotes] = useState('');
  const [status, setStatus] = useState('wishlist');
  const [interviewDate, setInterviewDate] = useState('');

  const columns = [
    { id: 'wishlist', title: 'Wishlist', color: 'bg-slate-500/10 text-slate-500 border-slate-500/20' },
    { id: 'applied', title: 'Applied', color: 'bg-blue-500/10 text-blue-500 border-blue-500/20' },
    { id: 'interview', title: 'Interviewing', color: 'bg-indigo-500/10 text-indigo-500 border-indigo-500/20' },
    { id: 'offer', title: 'Offer Received', color: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' },
    { id: 'rejected', title: 'Rejected', color: 'bg-rose-500/10 text-rose-500 border-rose-500/20' },
  ];

  const fetchApps = async () => {
    try {
      const res = await api.get('/applications/');
      setApps(res || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApps();
  }, []);

  // HTML5 Drag and Drop Handlers
  const handleDragStart = (e: React.DragEvent, id: number) => {
    e.dataTransfer.setData('applicationId', id.toString());
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = async (e: React.DragEvent, targetStatus: string) => {
    const appIdStr = e.dataTransfer.getData('applicationId');
    if (!appIdStr) return;
    const appId = parseInt(appIdStr);
    
    // Optimistic Update
    setApps(prev => prev.map(a => a.id === appId ? { ...a, status: targetStatus } : a));
    
    try {
      await api.put(`/applications/${appId}`, { status: targetStatus });
      fetchApps();
    } catch (err) {
      console.error(err);
      fetchApps(); // Rollback
    }
  };

  const handleAddJob = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!company.trim() || !role.trim()) return;
    
    try {
      const body: any = { company, role, status, notes };
      if (interviewDate) body.interview_date = new Date(interviewDate).toISOString();
      
      await api.post('/applications/', body);
      
      // Reset & Refresh
      setCompany('');
      setRole('');
      setNotes('');
      setInterviewDate('');
      setStatus('wishlist');
      setIsModalOpen(false);
      fetchApps();
    } catch (err) {
      alert("Error adding application");
    }
  };

  const handleDeleteJob = async (id: number) => {
    if (!window.confirm("Are you sure you want to delete this application?")) return;
    try {
      await api.delete(`/applications/${id}`);
      fetchApps();
    } catch (err) {
      alert("Error deleting application");
    }
  };

  // Filter apps by search
  const filteredApps = apps.filter(app => 
    app.company.toLowerCase().includes(search.toLowerCase()) || 
    app.role.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Job Application Tracker</h1>
          <p className="text-slate-400 text-sm mt-1">Organize your job search funnel. Drag cards across columns to update stages.</p>
        </div>
        
        <div className="flex items-center space-x-4">
          {/* Search bar */}
          <div className="relative">
            <Search className="absolute left-3.5 top-3.5 text-slate-400" size={16} />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 pr-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white/20 dark:bg-slate-900/20 focus:ring-2 focus:ring-brand-500 focus:outline-none text-sm w-60"
              placeholder="Search companies, roles..."
            />
          </div>

          <button
            onClick={() => setIsModalOpen(true)}
            className="px-5 py-3 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-semibold text-sm flex items-center space-x-1.5 shadow-md shadow-brand-500/10"
          >
            <Plus size={16} />
            <span>Add Job</span>
          </button>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 animate-pulse">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-96 bg-slate-200 dark:bg-slate-800 rounded-2xl"></div>
          ))}
        </div>
      ) : (
        /* Kanban Columns Container */
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 overflow-x-auto pb-4">
          {columns.map((col) => {
            const columnApps = filteredApps.filter(app => app.status === col.id);
            return (
              <div
                key={col.id}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, col.id)}
                className="kanban-col flex flex-col space-y-4 min-w-[200px]"
              >
                {/* Column header */}
                <div className={`p-3 rounded-xl border flex items-center justify-between font-bold text-xs ${col.color}`}>
                  <span>{col.title}</span>
                  <span className="px-2 py-0.5 rounded bg-white/50 dark:bg-slate-900/40">{columnApps.length}</span>
                </div>

                {/* Cards stack */}
                <div className="flex-1 space-y-3 rounded-xl bg-slate-100/10 dark:bg-slate-900/10 p-2 min-h-[300px]">
                  <AnimatePresence>
                    {columnApps.map((app) => (
                      <motion.div
                        key={app.id}
                        layout
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        draggable
                        onDragStart={(e) => handleDragStart(e, app.id)}
                        className="glass-panel p-4 rounded-xl space-y-3 cursor-grab active:cursor-grabbing hover:border-brand-500/30 transition-all shadow-sm"
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="font-extrabold text-sm truncate">{app.role}</h4>
                            <p className="text-xs text-slate-400 font-bold mt-0.5">{app.company}</p>
                          </div>
                          <button
                            onClick={() => handleDeleteJob(app.id)}
                            className="text-slate-400 hover:text-rose-500 p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800/60"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>

                        {app.notes && (
                          <p className="text-xs text-slate-500 line-clamp-2 italic">{app.notes}</p>
                        )}

                        {app.interview_date && (
                          <div className="flex items-center space-x-1.5 text-[10px] font-bold text-indigo-500 bg-indigo-500/10 px-2 py-1 rounded w-fit border border-indigo-500/20">
                            <CalendarDays size={12} />
                            <span>{new Date(app.interview_date).toLocaleDateString()}</span>
                          </div>
                        )}
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Job Modal Dialog */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="glass-panel max-w-md w-full p-6 rounded-2xl space-y-6"
          >
            <div className="flex justify-between items-center">
              <h3 className="font-extrabold text-lg">Add New Application</h3>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                Close
              </button>
            </div>

            <form onSubmit={handleAddJob} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">Company</label>
                <input
                  type="text"
                  required
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white/20 dark:bg-slate-900/20 focus:outline-none focus:ring-2 focus:ring-brand-500 text-sm"
                  placeholder="E.g. Apple"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">Role Title</label>
                <input
                  type="text"
                  required
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white/20 dark:bg-slate-900/20 focus:outline-none focus:ring-2 focus:ring-brand-500 text-sm"
                  placeholder="E.g. Frontend Engineer"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">Board Column</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white/20 dark:bg-slate-900/20 focus:outline-none text-sm"
                  >
                    <option value="wishlist">Wishlist</option>
                    <option value="applied">Applied</option>
                    <option value="interview">Interviewing</option>
                    <option value="offer">Offer Received</option>
                    <option value="rejected">Rejected</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">Interview Date (Optional)</label>
                  <input
                    type="date"
                    value={interviewDate}
                    onChange={(e) => setInterviewDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white/20 dark:bg-slate-900/20 focus:outline-none text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">Notes / Reminders</label>
                <textarea
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white/20 dark:bg-slate-900/20 focus:outline-none text-sm resize-none"
                  placeholder="Any context notes about requirements, referrers..."
                ></textarea>
              </div>

              <button
                type="submit"
                className="w-full py-3.5 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-semibold text-sm transition-colors shadow-md"
              >
                Save Application
              </button>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
};
