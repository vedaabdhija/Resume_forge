import React, { useState, useEffect } from 'react';
import { useApi } from '../hooks/useApi';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Upload, 
  Sparkles, 
  Download, 
  ArrowRight, 
  CheckCircle, 
  AlertTriangle, 
  XCircle,
  RefreshCw,
  FileText,
  FileCheck
} from 'lucide-react';

export const TailorResume: React.FC = () => {
  const api = useApi();
  const [step, setStep] = useState(1); // 1: Input, 2: Loading/Progress, 3: Optimization Workspace
  const [loadingMsg, setLoadingMsg] = useState('Initiating AI optimization...');
  
  // Forms states
  const [title, setTitle] = useState('My Master Resume');
  const [file, setFile] = useState<File | null>(null);
  const [jobText, setJobText] = useState('');
  const [company, setCompany] = useState('');
  const [jobTitle, setJobTitle] = useState('');
  
  // Active Tailored output details
  const [tailoredId, setTailoredId] = useState<number | null>(null);
  const [tailoredData, setTailoredData] = useState<any>(null);
  const [selectedTemplate, setSelectedTemplate] = useState('professional');
  const [progressVal, setProgressVal] = useState(0);

  // File Upload Drag and Drop
  const [dragActive, setDragActive] = useState(false);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  // Run Async Optimization
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !jobText.trim()) return;

    setStep(2);
    setProgressVal(10);
    setLoadingMsg("Uploading and Parsing Master Resume...");

    try {
      // 1. Upload Master Resume
      const formData = new FormData();
      formData.append('title', title);
      formData.append('file', file);
      
      const resumeRes = await api.post('/resumes/upload', formData);
      const resumeId = resumeRes.id;
      
      setProgressVal(35);
      setLoadingMsg("Submitting tailoring background job...");

      // 2. Start Async Tailoring Job
      const tailorRes = await api.post('/tailor/', {
        resume_id: resumeId,
        job_description_text: jobText,
        company_name: company,
        job_title: jobTitle
      });
      
      setTailoredId(tailorRes.id);
      
      // Start polling status
      pollTailoringStatus(tailorRes.id);
    } catch (err) {
      console.error(err);
      setStep(1);
      alert("Error starting tailoring pipeline.");
    }
  };

  // Poll status endpoint
  const pollTailoringStatus = async (id: number) => {
    const timer = setInterval(async () => {
      try {
        const statusRes = await api.get(`/tailor/${id}/status`);
        setProgressVal(statusRes.progress);
        
        if (statusRes.status === "RUNNING") {
          if (statusRes.progress < 50) setLoadingMsg("Parsing target job description...");
          else if (statusRes.progress < 80) setLoadingMsg("Querying RAG Vector index and analyzing matching gaps...");
          else setLoadingMsg("Classifying fact-audit edits and tailoring experience metrics...");
        } else if (statusRes.status === "COMPLETED") {
          clearInterval(timer);
          setLoadingMsg("Parsing completed!");
          // Fetch complete tailored results
          const resultRes = await api.get(`/tailor/${id}`);
          setTailoredData(resultRes);
          // Auto link gaps to skill tracker
          await api.post(`/skills/generate-roadmap/${id}`, {});
          setStep(3);
        } else if (statusRes.status === "FAILED") {
          clearInterval(timer);
          setStep(1);
          alert(`Tailoring job failed: ${statusRes.error_message}`);
        }
      } catch (err) {
        clearInterval(timer);
        setStep(1);
      }
    }, 1500);
  };

  // Download PDF file
  const handleDownloadPdf = async () => {
    if (!tailoredId) return;
    try {
      const blob = await api.get(`/tailor/${tailoredId}/download-pdf?template=${selectedTemplate}`);
      const url = window.URL.createObjectURL(blob as Blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${company || 'tailored'}_resume_${selectedTemplate}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      alert("Error generating PDF.");
    }
  };

  // Download DOCX file
  const handleDownloadDocx = async () => {
    if (!tailoredId) return;
    try {
      const blob = await api.get(`/tailor/${tailoredId}/download-docx`);
      const url = window.URL.createObjectURL(blob as Blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${company || 'tailored'}_resume_optimized.docx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      alert("Error downloading DOCX file.");
    }
  };

  return (
    <div className="space-y-8">
      {/* Title */}
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight">Resume AI Optimizer</h1>
        <p className="text-slate-400 text-sm mt-1">Submit your profile and job description to optimize bullet points, inspect gaps, and generate ATS compliance.</p>
      </div>

      <AnimatePresence mode="wait">
        
        {/* Step 1: Submit Form */}
        {step === 1 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="grid grid-cols-1 lg:grid-cols-2 gap-8"
          >
            {/* Left: File upload */}
            <div className="glass-panel p-6 rounded-2xl space-y-6">
              <h3 className="font-extrabold text-lg flex items-center space-x-2">
                <FileText size={18} className="text-brand-500" />
                <span>1. Upload Master Resume</span>
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2">Resume Label</label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white/20 dark:bg-slate-900/20 focus:ring-2 focus:ring-brand-500 focus:outline-none"
                    placeholder="E.g. Senior Software Engineer Master Profile"
                  />
                </div>

                {/* Drag-drop zone */}
                <div
                  onDragEnter={handleDrag}
                  onDragOver={handleDrag}
                  onDragLeave={handleDrag}
                  onDrop={handleDrop}
                  className={`border-2 border-dashed rounded-2xl p-8 flex flex-col items-center justify-center text-center transition-all ${
                    dragActive
                      ? 'border-brand-500 bg-brand-500/5'
                      : file
                      ? 'border-emerald-500 bg-emerald-500/5'
                      : 'border-slate-300 dark:border-slate-800 hover:border-brand-500'
                  }`}
                >
                  {file ? (
                    <div className="space-y-2">
                      <FileCheck size={40} className="text-emerald-500 mx-auto" />
                      <p className="font-semibold text-sm">{file.name}</p>
                      <button 
                        onClick={() => setFile(null)} 
                        className="text-xs text-rose-500 hover:underline font-bold"
                      >
                        Remove file
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <Upload size={40} className="text-slate-400 mx-auto" />
                      <p className="font-medium text-sm">Drag and drop file here, or click to upload</p>
                      <p className="text-[10px] text-slate-400">PDF, DOCX, TXT (Max 10MB)</p>
                      <label className="inline-block mt-2 px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-semibold hover:bg-slate-200 dark:hover:bg-slate-700 cursor-pointer">
                        Browse Files
                        <input
                          type="file"
                          accept=".pdf,.docx,.txt"
                          onChange={handleFileChange}
                          className="hidden"
                        />
                      </label>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Right: Job details */}
            <form onSubmit={handleSubmit} className="glass-panel p-6 rounded-2xl flex flex-col justify-between space-y-6">
              <div className="space-y-6">
                <h3 className="font-extrabold text-lg flex items-center space-x-2">
                  <Sparkles size={18} className="text-accent-teal" />
                  <span>2. Target Position details</span>
                </h3>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2">Company Name</label>
                    <input
                      type="text"
                      value={company}
                      onChange={(e) => setCompany(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white/20 dark:bg-slate-900/20 focus:ring-2 focus:ring-brand-500 focus:outline-none"
                      placeholder="E.g. Stripe"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2">Job Title</label>
                    <input
                      type="text"
                      value={jobTitle}
                      onChange={(e) => setJobTitle(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white/20 dark:bg-slate-900/20 focus:ring-2 focus:ring-brand-500 focus:outline-none"
                      placeholder="E.g. Senior Frontend Engineer"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2">Paste Job Description</label>
                  <textarea
                    rows={6}
                    value={jobText}
                    onChange={(e) => setJobText(e.target.value)}
                    required
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white/20 dark:bg-slate-900/20 focus:ring-2 focus:ring-brand-500 focus:outline-none text-sm resize-none"
                    placeholder="Paste job posting details here. We'll run semantic RAG parsing..."
                  ></textarea>
                </div>
              </div>

              <button
                type="submit"
                disabled={!file || !jobText.trim()}
                className="w-full py-4 rounded-xl bg-gradient-to-r from-brand-600 to-accent-indigo hover:from-brand-700 hover:to-accent-indigo text-white font-semibold text-sm flex items-center justify-center space-x-2 disabled:opacity-50 disabled:pointer-events-none transition-all shadow-md mt-6"
              >
                <span>Optimize Resume</span>
                <ArrowRight size={16} />
              </button>
            </form>
          </motion.div>
        )}

        {/* Step 2: Loader */}
        {step === 2 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="glass-panel p-12 rounded-2xl flex flex-col items-center justify-center text-center space-y-6 max-w-lg mx-auto"
          >
            <RefreshCw size={40} className="text-brand-500 animate-spin" />
            <div className="space-y-2">
              <h3 className="font-extrabold text-lg">{loadingMsg}</h3>
              <p className="text-xs text-slate-400">Executing semantic RAG matching & fact classification reports...</p>
            </div>
            
            {/* Progress gauge */}
            <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-brand-500 to-accent-indigo transition-all duration-500"
                style={{ width: `${progressVal}%` }}
              ></div>
            </div>
            <span className="text-xs font-bold text-slate-400">{progressVal}%</span>
          </motion.div>
        )}

        {/* Step 3: Workspace */}
        {step === 3 && tailoredData && (
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="grid grid-cols-1 lg:grid-cols-12 gap-8"
          >
            {/* Left Column (Fact Checker, ATS score analysis) - span 7 */}
            <div className="lg:col-span-7 space-y-8">
              
              {/* ATS explainability */}
              <div className="glass-panel p-6 rounded-2xl space-y-6">
                <div>
                  <h3 className="font-extrabold text-lg">ATS Optimization Report</h3>
                  <p className="text-xs text-slate-400">Category-level breakdown scores.</p>
                </div>
                
                <div className="flex items-center space-x-6">
                  {/* Huge Circular Indicator */}
                  <div className="relative w-28 h-28 rounded-full bg-gradient-to-br from-brand-500 to-accent-indigo flex items-center justify-center text-white font-extrabold text-2xl shadow-lg">
                    {tailoredData.ats_score}%
                  </div>
                  
                  {/* Progress lines */}
                  <div className="flex-1 space-y-3">
                    {Object.entries(tailoredData.ats_analysis || {}).map(([key, val]: any) => {
                      if (key === 'detailed_feedback') return null;
                      return (
                        <div key={key} className="space-y-1">
                          <div className="flex justify-between text-xs font-bold">
                            <span className="capitalize">{key.replace('_', ' ')}</span>
                            <span>{val}%</span>
                          </div>
                          <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-brand-500 rounded-full"
                              style={{ width: `${val}%` }}
                            ></div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
                <p className="text-xs text-slate-400 border-t border-slate-200/40 dark:border-slate-800/30 pt-4 italic">
                  &ldquo;{tailoredData.ats_analysis?.detailed_feedback}&rdquo;
                </p>
              </div>

              {/* Fact check classifier */}
              <div className="glass-panel p-6 rounded-2xl space-y-6">
                <div>
                  <h3 className="font-extrabold text-lg">AI Fact Verification Auditor</h3>
                  <p className="text-xs text-slate-400">Ensures absolute truthfulness. Missing criteria are blocked and suggested separately.</p>
                </div>

                <div className="space-y-4">
                  {/* Verified */}
                  <div className="space-y-2">
                    <span className="text-[10px] font-bold text-emerald-500 uppercase bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">Verified Matches</span>
                    <div className="space-y-1.5">
                      {tailoredData.fact_verification?.verified_items?.map((item: any) => (
                        <div key={item.item} className="flex items-center space-x-2 text-xs">
                          <CheckCircle size={14} className="text-emerald-500 shrink-0" />
                          <span className="font-semibold">{item.item}</span>
                          <span className="text-slate-400">&middot; {item.explanation}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Synonyms / Similar */}
                  {tailoredData.fact_verification?.similar_items?.length > 0 && (
                    <div className="space-y-2">
                      <span className="text-[10px] font-bold text-amber-500 uppercase bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">Synonym Alignments</span>
                      <div className="space-y-1.5">
                        {tailoredData.fact_verification?.similar_items?.map((item: any) => (
                          <div key={item.item} className="flex items-center space-x-2 text-xs">
                            <AlertTriangle size={14} className="text-amber-500 shrink-0" />
                            <span className="font-semibold">{item.item}</span>
                            <span className="text-slate-400">&middot; {item.explanation}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Gaps / Unsupported */}
                  {tailoredData.fact_verification?.unsupported_items?.length > 0 && (
                    <div className="space-y-2">
                      <span className="text-[10px] font-bold text-rose-500 uppercase bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/20">Missing Gaps (Blocked from inserting)</span>
                      <div className="space-y-1.5">
                        {tailoredData.fact_verification?.unsupported_items?.map((item: any) => (
                          <div key={item.item} className="flex items-center space-x-2 text-xs">
                            <XCircle size={14} className="text-rose-500 shrink-0" />
                            <span className="font-semibold">{item.item}</span>
                            <span className="text-slate-400">&middot; {item.explanation}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Bullet updates details */}
              <div className="glass-panel p-6 rounded-2xl space-y-6">
                <div>
                  <h3 className="font-extrabold text-lg">Rewrite Changelog</h3>
                  <p className="text-xs text-slate-400">Side-by-side comparison explaining metrics rewrites.</p>
                </div>
                <div className="space-y-4">
                  {tailoredData.modifications?.map((mod: any, idx: number) => (
                    <div key={idx} className="p-4 rounded-xl bg-slate-100/30 dark:bg-slate-800/10 border border-slate-200/50 dark:border-slate-800/25 space-y-2">
                      <div className="text-xs">
                        <span className="font-bold text-rose-500">Original:</span>
                        <p className="text-slate-500 mt-0.5 line-through">{mod.original}</p>
                      </div>
                      <div className="text-xs">
                        <span className="font-bold text-emerald-500">Tailored:</span>
                        <p className="font-medium text-slate-800 dark:text-slate-200 mt-0.5">{mod.modified}</p>
                      </div>
                      <p className="text-[10px] text-brand-500 font-semibold italic mt-1">&rarr; {mod.reason}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Column (Template Switcher + Export preview) - span 5 */}
            <div className="lg:col-span-5 glass-panel p-6 rounded-2xl flex flex-col justify-between space-y-6 h-fit sticky top-24">
              <div className="space-y-6">
                <div>
                  <h3 className="font-extrabold text-lg">Templates & Export</h3>
                  <p className="text-xs text-slate-400">Switch styles and export ATS compliant PDFs.</p>
                </div>

                {/* Templates Selector */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Style Layout</label>
                  <div className="grid grid-cols-3 gap-3">
                    {['professional', 'tech', 'minimal'].map((temp) => (
                      <button
                        key={temp}
                        onClick={() => setSelectedTemplate(temp)}
                        className={`py-3 px-2 rounded-xl text-xs font-bold border capitalize transition-all ${
                          selectedTemplate === temp
                            ? 'border-brand-500 bg-brand-500/10 text-brand-600 dark:text-brand-400'
                            : 'border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800/50'
                        }`}
                      >
                        {temp}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Mock Visual Page Preview */}
                <div className="border border-slate-200/50 dark:border-slate-800/30 rounded-xl p-4 bg-white dark:bg-slate-950 text-[8px] space-y-3 font-mono shadow-inner select-none h-80 overflow-y-auto">
                  <div className="text-center space-y-0.5 border-b pb-2">
                    <div className="font-bold text-slate-800 dark:text-slate-100">{tailoredData.tailored_json?.name}</div>
                    <div>{tailoredData.tailored_json?.email} | {tailoredData.tailored_json?.phone}</div>
                    <div className="text-[6px] text-blue-500">linkedin.com/in/demo &middot; github.com/demo</div>
                  </div>
                  
                  <div className="space-y-1">
                    <div className="font-bold border-b pb-0.5 text-brand-500 uppercase text-[6px]">Skills</div>
                    <div className="text-slate-600 dark:text-slate-300">{tailoredData.tailored_json?.skills?.join(', ')}</div>
                  </div>

                  <div className="space-y-1.5">
                    <div className="font-bold border-b pb-0.5 text-brand-500 uppercase text-[6px]">Experience</div>
                    {tailoredData.tailored_json?.experience?.map((job: any, i: number) => (
                      <div key={i} className="space-y-0.5">
                        <div className="flex justify-between font-semibold">
                          <span>{job.role} at {job.company}</span>
                          <span>{job.duration}</span>
                        </div>
                        {job.highlights?.map((h: string, idx: number) => (
                          <div key={idx} className="pl-2">&bull; {h}</div>
                        ))}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="space-y-3 pt-6">
                {tailoredData.file_path && (
                  <button
                    onClick={handleDownloadDocx}
                    className="w-full py-4 rounded-xl bg-gradient-to-r from-emerald-600 to-brand-500 hover:from-emerald-700 hover:to-brand-600 text-white font-semibold text-sm flex items-center justify-center space-x-2 shadow-md transition-all transform hover:-translate-y-0.5"
                  >
                    <Download size={16} />
                    <span>Download Tailored DOCX (Preserved Layout)</span>
                  </button>
                )}
                <button
                  onClick={handleDownloadPdf}
                  className="w-full py-4 rounded-xl bg-gradient-to-r from-brand-600 to-accent-indigo hover:from-brand-700 hover:to-accent-indigo text-white font-semibold text-sm flex items-center justify-center space-x-2 shadow-md transition-all transform hover:-translate-y-0.5"
                >
                  <Download size={16} />
                  <span>Download PDF Document</span>
                </button>
                <button
                  onClick={() => setStep(1)}
                  className="w-full py-3.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800/40 text-xs font-semibold transition-colors"
                >
                  Start another optimization
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
