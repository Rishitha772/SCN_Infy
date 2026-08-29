import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { DashboardService } from '../../services/dashboardService';
import type { SystemStats } from '../../types';
import { 
  ShieldAlert, Users, Clock, Landmark, FileText, 
  FolderGit2, GitFork, Award, TrendingUp 
} from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';

export const AdminDashboard: React.FC = () => {
  const [stats, setStats] = useState<SystemStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    DashboardService.getSystemStats()
      .then(s => setStats(s))
      .catch(err => console.error("Error loading system metrics:", err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <div className="w-10 h-10 border-4 border-red-500 border-t-transparent rounded-full animate-spin"></div>
        <span className="text-slate-505 text-sm font-semibold">Generating global system reports...</span>
      </div>
    );
  }

  // System Growth Chart Data
  const monthlyActivityData = [
    { month: 'Mar', publications: 1, collaborations: 1, users: 3 },
    { month: 'Apr', publications: 2, collaborations: 2, users: 5 },
    { month: 'May', publications: stats?.total_publications || 3, collaborations: stats?.total_collaborations || 2, users: stats?.total_users || 7 }
  ];

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2 text-red-650">
          <ShieldAlert className="w-8 h-8 text-red-650 shrink-0" />
          Global Platform Administration
        </h1>
        <p className="text-slate-500 text-sm">Overview of institutional registrations, database aggregates, and account approvals.</p>
      </div>

      {/* Grid: Administration Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        
        {/* Users */}
        <div className="p-5 bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/60 rounded-2xl shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 bg-red-50 dark:bg-red-950/20 text-red-600 rounded-xl flex items-center justify-center shrink-0">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-xl font-bold tracking-tight">{stats?.total_users || 0}</h3>
            <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Total Accounts</p>
          </div>
        </div>

        {/* Pending approvals */}
        <Link 
          to="/admin/pending-users" 
          className="p-5 bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/60 rounded-2xl shadow-sm flex items-center gap-3 hover:border-red-400 transition-all hover:scale-[1.01]"
        >
          <div className="w-10 h-10 bg-amber-50 dark:bg-amber-950/20 text-amber-600 rounded-xl flex items-center justify-center shrink-0">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-xl font-bold tracking-tight">{stats?.pending_users || 0}</h3>
            <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Pending Approvals</p>
          </div>
        </Link>

        {/* Institutions */}
        <Link 
          to="/admin/institutions"
          className="p-5 bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/60 rounded-2xl shadow-sm flex items-center gap-3 hover:border-red-400 transition-all hover:scale-[1.01]"
        >
          <div className="w-10 h-10 bg-blue-50 dark:bg-blue-950/20 text-blue-600 rounded-xl flex items-center justify-center shrink-0">
            <Landmark className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-xl font-bold tracking-tight">{stats?.total_institutions || 0}</h3>
            <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Institutions</p>
          </div>
        </Link>

        {/* Publications */}
        <div className="p-5 bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/60 rounded-2xl shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 rounded-xl flex items-center justify-center shrink-0">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-xl font-bold tracking-tight">{stats?.total_publications || 0}</h3>
            <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Publications Logged</p>
          </div>
        </div>

      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Projects */}
        <div className="p-5 bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/60 rounded-2xl shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-50 dark:bg-indigo-950/20 text-indigo-650 rounded-xl flex items-center justify-center shrink-0">
            <FolderGit2 className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-xl font-bold tracking-tight">{stats?.total_projects || 0}</h3>
            <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Research Projects</p>
          </div>
        </div>

        {/* Collaborations */}
        <div className="p-5 bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/60 rounded-2xl shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 bg-purple-50 dark:bg-purple-950/20 text-purple-600 rounded-xl flex items-center justify-center shrink-0">
            <GitFork className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-xl font-bold tracking-tight">{stats?.total_collaborations || 0}</h3>
            <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Collab Edges</p>
          </div>
        </div>

        {/* Citations */}
        <div className="p-5 bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/60 rounded-2xl shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 bg-teal-50 dark:bg-teal-950/20 text-teal-600 rounded-xl flex items-center justify-center shrink-0">
            <Award className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-xl font-bold tracking-tight">{stats?.total_citations || 0}</h3>
            <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Citations Link</p>
          </div>
        </div>

        {/* Active Accounts Ratio */}
        <div className="p-5 bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/60 rounded-2xl shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 bg-rose-50 dark:bg-rose-950/20 text-rose-600 rounded-xl flex items-center justify-center shrink-0">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-xl font-bold tracking-tight">{stats?.active_users || 0}</h3>
            <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Active Users</p>
          </div>
        </div>
      </div>

      {/* Global growth chart */}
      <div className="p-6 bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/60 rounded-2xl shadow-sm space-y-4">
        <h3 className="font-bold text-sm flex items-center gap-1.5"><TrendingUp className="w-4.5 h-4.5 text-red-650" /> Platform Data Expansion Activity</h3>
        <div className="h-64 w-full text-xs">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={monthlyActivityData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" className="dark:stroke-slate-800" />
              <XAxis dataKey="month" stroke="#94a3b8" />
              <YAxis stroke="#94a3b8" />
              <Tooltip />
              <Legend />
              <Bar dataKey="users" fill="#ef4444" name="Registered Users" />
              <Bar dataKey="publications" fill="#123B63" name="Logged Publications" />
              <Bar dataKey="collaborations" fill="#10b981" name="Collaboration Edges" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

    </div>
  );
};
