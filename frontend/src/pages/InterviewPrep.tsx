import React, { useEffect, useState } from 'react';
import { useApi } from '../hooks/useApi';
import { motion, AnimatePresence } from 'framer-motion';
import { HelpCircle, Eye, EyeOff, CheckCircle } from 'lucide-react';

interface Question {
  category: string;
  question: string;
  answer: string;
}

export const InterviewPrep: React.FC = () => {
  const api = useApi();
  const [loading, setLoading] = useState(true);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [revealed, setRevealed] = useState<{ [key: number]: boolean }>({});

  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        const apps = await api.get('/applications/');
        const interviewApps = apps.filter((a: any) => a.tailored_resume_id);
        
        if (interviewApps.length > 0) {
          const firstApp = interviewApps[0];
          const prep = await api.get(`/interviews/${firstApp.tailored_resume_id}`);
          setQuestions(prep.questions || []);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchQuestions();
  }, []);

  const toggleReveal = (idx: number) => {
    setRevealed(prev => ({ ...prev, [idx]: !prev[idx] }));
  };

  return (
    <div className="space-y-8">
      {/* Title */}
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight">Interview Preparation</h1>
        <p className="text-slate-400 text-sm mt-1">Review customized technical, behavioral, and system design questions tailored to your resume and role details.</p>
      </div>

      {loading ? (
        <div className="space-y-4 animate-pulse">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-24 bg-slate-200 dark:bg-slate-800 rounded-2xl"></div>
          ))}
        </div>
      ) : questions.length > 0 ? (
        <div className="space-y-6 max-w-3xl">
          {questions.map((q, idx) => (
            <div key={idx} className="glass-panel p-6 rounded-2xl space-y-4">
              <div className="flex justify-between items-start space-x-4">
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-brand-600 bg-brand-500/10 px-2.5 py-1 rounded-full border border-brand-500/20">
                    {q.category}
                  </span>
                  <h3 className="font-extrabold text-base pt-2 text-slate-800 dark:text-slate-100">{q.question}</h3>
                </div>
                
                <button
                  onClick={() => toggleReveal(idx)}
                  className="px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-xs font-semibold flex items-center space-x-1 transition-colors select-none shrink-0"
                >
                  {revealed[idx] ? <EyeOff size={14} /> : <Eye size={14} />}
                  <span>{revealed[idx] ? 'Hide Answer' : 'Reveal Answer'}</span>
                </button>
              </div>

              {/* Revealed Answer Box */}
              <AnimatePresence>
                {revealed[idx] && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden border-t border-slate-200/40 dark:border-slate-800/30 pt-4"
                  >
                    <div className="p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/15 text-sm text-slate-700 dark:text-slate-300 leading-relaxed space-y-2">
                      <span className="font-bold text-xs text-emerald-600 flex items-center space-x-1">
                        <CheckCircle size={14} />
                        <span>Ideal response guidance:</span>
                      </span>
                      <p>{q.answer}</p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>
      ) : (
        <div className="glass-panel p-12 rounded-2xl text-center flex flex-col items-center justify-center space-y-4 max-w-md mx-auto">
          <HelpCircle size={48} className="text-slate-400" />
          <div className="space-y-1">
            <h3 className="font-extrabold text-base">No Questions Ready</h3>
            <p className="text-xs text-slate-400">Questions are auto-compiled on tailoring a resume for a job posting. Optimize a resume to begin practice.</p>
          </div>
        </div>
      )}
    </div>
  );
};
