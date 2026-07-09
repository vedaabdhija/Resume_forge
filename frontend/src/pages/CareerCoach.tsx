import React, { useEffect, useState } from 'react';
import { useApi } from '../hooks/useApi';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Compass, 
  Send, 
  Sparkles, 
  BookOpen, 
  GraduationCap, 
  Code,
  AlertCircle
} from 'lucide-react';

interface SkillRoadmap {
  skill_name: string;
  category: string;
  proficiency: string;
  roadmap: {
    skills_gap: string[];
    roadmap: Array<{
      skill: string;
      courses: string[];
      books: string[];
      projects: string[];
    }>;
    salary_estimate?: string;
    role_suitability?: string;
    next_steps?: string;
  };
}

export const CareerCoach: React.FC = () => {
  const api = useApi();
  const [loading, setLoading] = useState(true);
  const [skills, setSkills] = useState<SkillRoadmap[]>([]);
  const [selectedSkill, setSelectedSkill] = useState<SkillRoadmap | null>(null);
  
  // Chat bot state
  const [messages, setMessages] = useState<Array<{ sender: 'user' | 'coach', text: string }>>([
    { sender: 'coach', text: "Hello! I am your ResumeForge Career Coach. I can analyze your resume gaps, recommend custom portfolios to build, or suggest courses. Ask me anything!" }
  ]);
  const [inputVal, setInputVal] = useState('');

  useEffect(() => {
    const fetchSkills = async () => {
      try {
        const res = await api.get('/skills/');
        setSkills(res || []);
        if (res && res.length > 0) {
          setSelectedSkill(res[0]);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchSkills();
  }, []);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputVal.trim()) return;
    
    const userMsg = inputVal;
    setMessages(prev => [...prev, { sender: 'user', text: userMsg }]);
    setInputVal('');

    setTimeout(() => {
      let reply = "That is a great career objective! I recommend focusing on containerization tools like Docker and setting up localized Kubernetes pods, as modern full-stack systems heavily rely on deployment orchestration. You can track this skill in your gap roadmaps.";
      if (userMsg.toLowerCase().includes("resume") || userMsg.toLowerCase().includes("ats")) {
        reply = "To maximize your ATS match score, always check the synonym alignments and verify that primary requirements are naturally integrated. Never hardcode unsupported technologies; instead, build a portfolio project demonstrating them first.";
      }
      setMessages(prev => [...prev, { sender: 'coach', text: reply }]);
    }, 1000);
  };

  return (
    <div className="space-y-8">
      {/* Title */}
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight">AI Career Coach</h1>
        <p className="text-slate-400 text-sm mt-1">Explore custom roadmap recommendations for technical gaps and interact with your personal career assistant.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column - Gaps Roadmaps - span 7 */}
        <div className="lg:col-span-7 space-y-6">
          <div className="glass-panel p-6 rounded-2xl space-y-6">
            <div>
              <h3 className="font-extrabold text-lg flex items-center space-x-2">
                <Compass size={18} className="text-brand-500" />
                <span>Roadmaps from Gaps</span>
              </h3>
              <p className="text-xs text-slate-400">Expand flagged technologies to see learning paths.</p>
            </div>

            {loading ? (
              <div className="h-40 animate-pulse bg-slate-200 dark:bg-slate-800 rounded-xl"></div>
            ) : skills.length > 0 ? (
              <div className="space-y-6">
                {/* Horizontal tabs */}
                <div className="flex space-x-2 overflow-x-auto pb-2 border-b border-slate-200/40 dark:border-slate-800/30">
                  {skills.map((s) => (
                    <button
                      key={s.id}
                      onClick={() => setSelectedSkill(s)}
                      className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border ${
                        selectedSkill?.id === s.id
                          ? 'border-brand-500 bg-brand-500/10 text-brand-600 dark:text-brand-400'
                          : 'border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800/40'
                      }`}
                    >
                      {s.skill_name}
                    </button>
                  ))}
                </div>

                {/* Selected roadmap details */}
                {selectedSkill && (
                  <div className="space-y-6">
                    {/* Suitability details */}
                    <div className="p-4 rounded-xl bg-slate-100/30 dark:bg-slate-800/10 border border-slate-200/40 dark:border-slate-800/30 space-y-3">
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-bold text-slate-400 uppercase tracking-wider">Salary Estimate</span>
                        <span className="font-extrabold text-emerald-500">{selectedSkill.roadmap?.salary_estimate}</span>
                      </div>
                      <div className="text-xs space-y-1">
                        <span className="font-bold text-slate-400 uppercase tracking-wider block">Suitability Audit</span>
                        <p className="text-slate-600 dark:text-slate-300">{selectedSkill.roadmap?.role_suitability}</p>
                      </div>
                    </div>

                    {/* Roadmap sections (Courses, Books, Projects) */}
                    {selectedSkill.roadmap?.roadmap?.map((rm: any, idx: number) => (
                      <div key={idx} className="space-y-4">
                        {/* Courses */}
                        <div className="space-y-2">
                          <span className="text-xs font-bold text-slate-500 dark:text-slate-300 flex items-center space-x-1.5">
                            <GraduationCap size={16} className="text-brand-500" />
                            <span>Recommended Courses</span>
                          </span>
                          <ul className="text-xs text-slate-600 dark:text-slate-400 space-y-1 pl-5 list-disc">
                            {rm.courses?.map((c: string) => <li key={c}>{c}</li>)}
                          </ul>
                        </div>

                        {/* Books */}
                        <div className="space-y-2">
                          <span className="text-xs font-bold text-slate-500 dark:text-slate-300 flex items-center space-x-1.5">
                            <BookOpen size={16} className="text-accent-teal" />
                            <span>Readings & Documentation</span>
                          </span>
                          <ul className="text-xs text-slate-600 dark:text-slate-400 space-y-1 pl-5 list-disc">
                            {rm.books?.map((b: string) => <li key={b}>{b}</li>)}
                          </ul>
                        </div>

                        {/* Projects */}
                        <div className="space-y-2">
                          <span className="text-xs font-bold text-slate-500 dark:text-slate-300 flex items-center space-x-1.5">
                            <Code size={16} className="text-accent-indigo" />
                            <span>Portfolio Projects to Build</span>
                          </span>
                          <ul className="text-xs text-slate-600 dark:text-slate-400 space-y-1 pl-5 list-disc">
                            {rm.projects?.map((p: string) => <li key={p}>{p}</li>)}
                          </ul>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-12 text-slate-400 text-sm flex flex-col items-center justify-center space-y-3">
                <AlertCircle size={40} className="text-slate-400" />
                <p>No missing skill trackers logged yet. Run a resume tailoring process to analyze missing skill gaps.</p>
              </div>
            )}
          </div>
        </div>

        {/* Right Column - Chat Assistant - span 5 */}
        <div className="lg:col-span-5 glass-panel p-6 rounded-2xl flex flex-col justify-between h-[500px]">
          <div className="space-y-4 flex-1 flex flex-col min-h-0">
            <div className="flex justify-between items-center border-b border-slate-200/40 dark:border-slate-800/30 pb-4">
              <h3 className="font-extrabold text-base flex items-center space-x-2">
                <Sparkles size={16} className="text-brand-500" />
                <span>Coach Chat</span>
              </h3>
            </div>

            {/* Chat Messages Logs */}
            <div className="flex-1 overflow-y-auto space-y-4 pr-2 select-text min-h-0">
              {messages.map((m, idx) => (
                <div 
                  key={idx} 
                  className={`flex ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div 
                    className={`max-w-[85%] p-3.5 rounded-2xl text-xs leading-relaxed ${
                      m.sender === 'user'
                        ? 'bg-brand-500 text-white rounded-tr-none'
                        : 'bg-slate-100 dark:bg-slate-800/60 text-slate-800 dark:text-slate-200 rounded-tl-none border border-slate-200/40 dark:border-slate-800/30'
                    }`}
                  >
                    {m.text}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <form onSubmit={handleSendMessage} className="flex items-center space-x-3 pt-4 border-t border-slate-200/40 dark:border-slate-800/30">
            <input
              type="text"
              value={inputVal}
              onChange={(e) => setInputVal(e.target.value)}
              placeholder="Ask the coach for roadmap details, project suggestions..."
              className="flex-1 px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white/20 dark:bg-slate-900/20 focus:outline-none focus:ring-2 focus:ring-brand-500 text-xs"
            />
            <button 
              type="submit" 
              className="p-3 rounded-xl bg-brand-500 hover:bg-brand-600 text-white transition-colors flex items-center justify-center shrink-0 shadow-md shadow-brand-500/10"
            >
              <Send size={14} />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
