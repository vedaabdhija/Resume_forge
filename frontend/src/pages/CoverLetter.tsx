import React, { useEffect, useState } from 'react';
import { useApi } from '../hooks/useApi';
import { motion } from 'framer-motion';
import { Copy, Check, FileText } from 'lucide-react';

export const CoverLetter: React.FC = () => {
  const api = useApi();
  const [loading, setLoading] = useState(true);
  const [coverLetters, setCoverLetters] = useState<any[]>([]);
  const [selectedLetter, setSelectedLetter] = useState<any>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const fetchLetter = async () => {
      try {
        // Fetch matching applications to find generated jobs
        const apps = await api.get('/applications/');
        const interviewApps = apps.filter((a: any) => a.tailored_resume_id);
        
        if (interviewApps.length > 0) {
          const firstApp = interviewApps[0];
          // Get cover letter for job
          const letter = await api.get(`/cover-letter/${firstApp.tailored_resume_id}`);
          setCoverLetters([{
            ...letter,
            company: firstApp.company,
            role: firstApp.role
          }]);
          setSelectedLetter({
            ...letter,
            company: firstApp.company,
            role: firstApp.role
          });
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchLetter();
  }, []);

  const handleCopy = () => {
    if (!selectedLetter) return;
    navigator.clipboard.writeText(selectedLetter.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-8">
      {/* Title */}
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight">Tailored Cover Letter</h1>
        <p className="text-slate-400 text-sm mt-1">Review, refine, and copy role-specific cover letters compiled during resume optimizations.</p>
      </div>

      {loading ? (
        <div className="h-64 animate-pulse bg-slate-200 dark:bg-slate-800 rounded-2xl"></div>
      ) : selectedLetter ? (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar projects selection */}
          <div className="glass-panel p-4 rounded-2xl space-y-4 h-fit">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Active projects</span>
            <div className="space-y-2">
              {coverLetters.map((letter) => (
                <button
                  key={letter.id}
                  onClick={() => setSelectedLetter(letter)}
                  className="w-full p-3 rounded-xl border border-brand-500/20 bg-brand-500/5 text-left space-y-1 block hover:bg-brand-500/10 transition-colors"
                >
                  <p className="text-xs font-extrabold truncate">{letter.role}</p>
                  <p className="text-[10px] text-slate-400 font-bold">{letter.company}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Letter Editor Display */}
          <div className="lg:col-span-3 glass-panel p-6 rounded-2xl space-y-6 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex justify-between items-center border-b border-slate-200/40 dark:border-slate-800/30 pb-4">
                <div>
                  <h3 className="font-extrabold text-base">{selectedLetter.company} Cover Letter</h3>
                  <p className="text-xs text-slate-400">Position: {selectedLetter.role}</p>
                </div>
                
                <button
                  onClick={handleCopy}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-xs font-semibold flex items-center space-x-1.5 transition-all active:scale-95"
                >
                  {copied ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
                  <span>{copied ? 'Copied' : 'Copy'}</span>
                </button>
              </div>

              {/* Cover Letter Text Box */}
              <div className="bg-slate-100/30 dark:bg-slate-900/40 border border-slate-200/40 dark:border-slate-800/30 rounded-2xl p-6 font-serif text-sm leading-relaxed text-slate-800 dark:text-slate-200 whitespace-pre-wrap shadow-inner h-[400px] overflow-y-auto select-text">
                {selectedLetter.content}
              </div>
            </div>

            <div className="text-[10px] text-slate-400 font-semibold border-t border-slate-200/40 dark:border-slate-800/30 pt-4 flex justify-between">
              <span>Model Used: {selectedLetter.ai_metadata?.model_name || 'Gemini 1.5'}</span>
              <span>Prompt version: {selectedLetter.ai_metadata?.prompt_version || '2.1.0'}</span>
            </div>
          </div>
        </div>
      ) : (
        <div className="glass-panel p-12 rounded-2xl text-center flex flex-col items-center justify-center space-y-4 max-w-md mx-auto">
          <FileText size={48} className="text-slate-400" />
          <div className="space-y-1">
            <h3 className="font-extrabold text-base">No Cover Letters Found</h3>
            <p className="text-xs text-slate-400">Optimize your master resume for a job posting. We'll automatically generate a customized cover letter for you.</p>
          </div>
        </div>
      )}
    </div>
  );
};
