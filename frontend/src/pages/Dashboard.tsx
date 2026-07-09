import React, { useEffect, useState } from 'react';
import { useApi } from '../hooks/useApi';
import { motion } from 'framer-motion';
import { Line, Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { 
  TrendingUp, 
  Briefcase, 
  Award, 
  HelpCircle, 
  Plus, 
  ArrowUpRight, 
  Sparkles,
  AlertCircle
} from 'lucide-react';
import { Link } from 'react-router-dom';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

export const Dashboard: React.FC = () => {
  const api = useApi();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const res = await api.get('/analytics/');
        setData(res);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 bg-slate-200 dark:bg-slate-800 rounded-lg w-1/4"></div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-32 bg-slate-200 dark:bg-slate-800 rounded-2xl"></div>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 h-80 bg-slate-200 dark:bg-slate-800 rounded-2xl"></div>
          <div className="h-80 bg-slate-200 dark:bg-slate-800 rounded-2xl"></div>
        </div>
      </div>
    );
  }

  // Chart configs
  const statusLabels = {
    wishlist: 'Wishlist',
    applied: 'Applied',
    interview: 'Interview',
    offer: 'Offer',
    rejected: 'Rejected'
  };

  const barChartData = {
    labels: Object.keys(data?.status_counts || {}).map(k => statusLabels[k as keyof typeof statusLabels]),
    datasets: [{
      label: 'Applications',
      data: Object.values(data?.status_counts || {}),
      backgroundColor: [
        'rgba(160, 174, 192, 0.5)',  // wishlist
        'rgba(49, 130, 206, 0.5)',   // applied
        'rgba(76, 81, 191, 0.5)',    // interview
        'rgba(16, 185, 129, 0.5)',   // offer
        'rgba(244, 63, 94, 0.5)'     // rejected
      ],
      borderColor: [
        '#A0AEC0', '#3182CE', '#4C51BF', '#10B981', '#F43F5E'
      ],
      borderWidth: 1.5,
      borderRadius: 8
    }]
  };

  const lineChartData = {
    labels: data?.ats_score_history?.map((h: any) => h.date) || [],
    datasets: [{
      fill: true,
      label: 'ATS Match Score',
      data: data?.ats_score_history?.map((h: any) => h.score) || [],
      borderColor: '#3182CE',
      backgroundColor: 'rgba(49, 130, 206, 0.1)',
      tension: 0.35,
      pointBackgroundColor: '#2B6CB0',
      pointHoverRadius: 6
    }]
  };

  const kpis = [
    { title: 'Total Applications', val: data?.total_applications || 0, icon: Briefcase, color: 'text-brand-500 bg-brand-500/10' },
    { title: 'Average ATS Score', val: `${data?.avg_ats_score || 0}%`, icon: Award, color: 'text-accent-teal bg-accent-teal/10' },
    { title: 'Interviews Scheduled', val: data?.status_counts?.interview || 0, icon: TrendingUp, color: 'text-accent-indigo bg-accent-indigo/10' },
    { title: 'Pending Skill Gaps', val: data?.skills_gap?.length || 0, icon: AlertCircle, color: 'text-accent-rose bg-accent-rose/10' }
  ];

  return (
    <div className="space-y-8">
      {/* Title section */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight font-sans">Dashboard</h1>
          <p className="text-slate-400 text-sm mt-1">Monitor job applications, skill gaps, and resume ATS score gains.</p>
        </div>
        <Link
          to="/tailor"
          className="inline-flex items-center space-x-2 px-5 py-3 rounded-xl bg-gradient-to-r from-brand-600 to-accent-indigo hover:from-brand-700 hover:to-accent-indigo text-white font-semibold text-sm shadow-md transition-all transform hover:-translate-y-0.5"
        >
          <Sparkles size={16} />
          <span>Tailor a New Resume</span>
        </Link>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {kpis.map((kpi, idx) => {
          const Icon = kpi.icon;
          return (
            <motion.div
              key={kpi.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              className="glass-panel p-6 rounded-2xl flex items-center justify-between"
            >
              <div className="space-y-2">
                <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">{kpi.title}</span>
                <p className="text-2xl font-extrabold tracking-tight">{kpi.val}</p>
              </div>
              <div className={`p-4 rounded-xl ${kpi.color}`}>
                <Icon size={24} />
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Main Charts & Analytics widgets */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* ATS score history line chart */}
        <div className="lg:col-span-2 glass-panel p-6 rounded-2xl space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-extrabold text-base">ATS Match Score Growth</h3>
              <p className="text-xs text-slate-400">Optimization progress over recent tailoring attempts.</p>
            </div>
            <TrendingUp size={16} className="text-brand-500" />
          </div>
          <div className="h-64 relative">
            {data?.ats_score_history?.length > 0 ? (
              <Line 
                data={lineChartData} 
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: { legend: { display: false } },
                  scales: { y: { min: 0, max: 100 } }
                }} 
              />
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400 text-sm">
                <p>No tailoring score history yet.</p>
                <Link to="/tailor" className="text-brand-500 hover:underline mt-1 text-xs">Run your first optimization</Link>
              </div>
            )}
          </div>
        </div>

        {/* Application Stage Distribution */}
        <div className="glass-panel p-6 rounded-2xl space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-extrabold text-base">Applications Funnel</h3>
              <p className="text-xs text-slate-400">Stages distribution across Kanban boards.</p>
            </div>
            <Briefcase size={16} className="text-accent-teal" />
          </div>
          <div className="h-64 relative">
            {data?.total_applications > 0 ? (
              <Bar 
                data={barChartData} 
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: { legend: { display: false } }
                }} 
              />
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400 text-sm">
                <p>No applications logged yet.</p>
                <Link to="/tracker" className="text-accent-teal hover:underline mt-1 text-xs">Add application entry</Link>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Lower Row: Skill Gaps and Recent Activities */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Skill gaps lists */}
        <div className="glass-panel p-6 rounded-2xl space-y-6">
          <div>
            <h3 className="font-extrabold text-base">Critical Skill Gaps</h3>
            <p className="text-xs text-slate-400">Missing technologies flagged during tailoring.</p>
          </div>
          <div className="space-y-3">
            {data?.skills_gap?.length > 0 ? (
              data.skills_gap.map((skill: string) => (
                <div 
                  key={skill}
                  className="flex items-center justify-between p-3.5 rounded-xl bg-slate-100/50 dark:bg-slate-800/30 border border-slate-200/50 dark:border-slate-800/20"
                >
                  <span className="text-sm font-semibold">{skill}</span>
                  <Link 
                    to="/career-coach" 
                    className="text-xs text-brand-500 hover:text-brand-600 font-bold flex items-center space-x-0.5"
                  >
                    <span>Roadmap</span>
                    <ArrowUpRight size={14} />
                  </Link>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-slate-400 text-sm">
                <p>No skill gaps flagged. Excellent job!</p>
              </div>
            )}
          </div>
        </div>

        {/* Activity feed list */}
        <div className="lg:col-span-2 glass-panel p-6 rounded-2xl space-y-6">
          <div>
            <h3 className="font-extrabold text-base">Recent Activities</h3>
            <p className="text-xs text-slate-400">Event history audit log.</p>
          </div>
          <div className="space-y-4">
            {data?.recent_activity?.length > 0 ? (
              data.recent_activity.map((activity: any, i: number) => (
                <div key={i} className="flex items-start space-x-4 pb-4 border-b border-slate-200/40 dark:border-slate-800/30 last:border-0 last:pb-0">
                  <div className="mt-1">
                    {activity.type === 'tailoring' ? (
                      <span className="inline-block p-2 rounded-lg bg-brand-500/10 text-brand-500"><Sparkles size={16} /></span>
                    ) : (
                      <span className="inline-block p-2 rounded-lg bg-accent-teal/10 text-accent-teal"><Briefcase size={16} /></span>
                    )}
                  </div>
                  <div className="flex-1 truncate">
                    <p className="text-sm font-semibold truncate">{activity.message}</p>
                    <span className="text-[10px] text-slate-400 font-bold">{activity.timestamp}</span>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-10 text-slate-400 text-sm">
                <p>No recent activity detected.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
