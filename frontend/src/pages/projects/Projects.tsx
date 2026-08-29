import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/Auth';
import { ProjectService } from '../../services/projectService';
import { ResearcherService } from '../../services/researcherService';
import type { Project, Researcher } from '../../types';
import { ProjectStatus } from '../../types';
import { Search, Plus, Users, ArrowRight, Clock } from 'lucide-react';

export const Projects: React.FC = () => {
  const { researcher: currentResearcher } = useAuth();

  const [projects, setProjects] = useState<Project[]>([]);
  const [researchers, setResearchers] = useState<Researcher[]>([]);
  
  // Search & Filters
  const [activeTab, setActiveTab] = useState<'all' | 'my'>('all');
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadProjects = async () => {
      setLoading(true);
      try {
        const projs = await ProjectService.getAll();
        setProjects(projs);

        const res = await ResearcherService.getAll();
        setResearchers(res);
      } catch (err) {
        console.error("Failed to load projects:", err);
      } finally {
        setLoading(false);
      }
    };
    loadProjects();
  }, [currentResearcher]);

  // Filtering
  const filteredProjects = projects.filter(p => {
    if (activeTab === 'my') {
      if (!currentResearcher) return false;
      if (!p.researcher_ids?.includes(currentResearcher.researcher_id)) return false;
    }

    const matchesQuery = p.name.toLowerCase().includes(query.toLowerCase()) ||
      (p.description && p.description.toLowerCase().includes(query.toLowerCase()));

    const matchesStatus = statusFilter === 'all' || p.status === statusFilter;

    return matchesQuery && matchesStatus;
  });

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Research Projects</h1>
          <p className="text-slate-500 text-sm">Observe ongoing collaborations, timelines, and study grants.</p>
        </div>
        {currentResearcher && (
          <Link 
            to="/projects/new"
            className="px-4 py-2 bg-navy-600 hover:bg-navy-500 text-white rounded-xl text-sm font-semibold flex items-center gap-2 shadow-md shadow-navy-500/10 transition-all hover:scale-[1.02]"
          >
            <Plus className="w-4 h-4" /> New Project
          </Link>
        )}
      </div>

      {/* Tabs */}
      {currentResearcher && (
        <div className="flex border-b border-slate-200 dark:border-slate-800">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-5 py-3 text-xs font-semibold border-b-2 transition-all ${
              activeTab === 'all' 
                ? 'border-navy-600 text-navy-600 dark:text-navy-400 font-bold' 
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            All Network Projects
          </button>
          <button
            onClick={() => setActiveTab('my')}
            className={`px-5 py-3 text-xs font-semibold border-b-2 transition-all ${
              activeTab === 'my' 
                ? 'border-navy-600 text-navy-600 dark:text-navy-400 font-bold' 
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            My Active Collaborations
          </button>
        </div>
      )}

      {/* Search & Filters */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 border border-slate-200/60 dark:border-slate-800/60 bg-white dark:bg-slate-900 p-4 rounded-2xl shadow-sm">
        
        {/* Search */}
        <div className="sm:col-span-2 relative">
          <input 
            type="text"
            placeholder="Search projects by name or description summary..."
            className="w-full pl-10 pr-4 py-2 border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-955 rounded-xl text-xs focus:border-navy-500 focus:outline-none transition-colors"
            value={query}
            onChange={e => setQuery(e.target.value)}
          />
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        </div>

        {/* Status filter */}
        <div className="relative">
          <select 
            className="w-full px-4 py-2 border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 rounded-xl text-xs focus:border-navy-500 focus:outline-none appearance-none transition-colors"
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
          >
            <option value="all">All Statuses</option>
            <option value={ProjectStatus.ACTIVE}>Active</option>
            <option value={ProjectStatus.COMPLETED}>Completed</option>
            <option value={ProjectStatus.CANCELLED}>Cancelled</option>
          </select>
          <Clock className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
        </div>

      </div>

      {/* Content list */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <div className="w-10 h-10 border-4 border-navy-500 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-slate-500 text-sm font-semibold">Retrieving network projects...</span>
        </div>
      ) : filteredProjects.length === 0 ? (
        <div className="p-8 text-center text-xs text-slate-400 border border-slate-200 bg-white dark:bg-slate-900 rounded-2xl shadow-sm space-y-2">
          <p>No projects registered matching criteria.</p>
          {activeTab === 'my' && (
            <Link to="/projects/new" className="text-navy-500 hover:underline block font-semibold">Initiate a new project &rarr;</Link>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredProjects.map(proj => {
            const projectMembers = researchers.filter(r => proj.researcher_ids?.includes(r.researcher_id));

            return (
              <div 
                key={proj.project_id}
                className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/60 p-6 rounded-2xl shadow-sm hover:border-slate-350 dark:hover:border-slate-700 transition-all flex flex-col justify-between"
              >
                <div className="space-y-3.5">
                  <div className="flex items-start justify-between gap-2">
                    <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                      proj.status === ProjectStatus.ACTIVE 
                        ? 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600' 
                        : proj.status === ProjectStatus.COMPLETED
                        ? 'bg-navy-50 dark:bg-navy-950/20 text-navy-650'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
                    }`}>
                      {proj.status}
                    </span>
                    <span className="text-[10px] text-slate-400 flex items-center gap-1 font-mono">ID: {proj.project_id}</span>
                  </div>

                  <Link 
                    to={`/projects/${proj.project_id}`}
                    className="block text-base font-bold text-slate-855 dark:text-slate-100 hover:text-navy-650 hover:underline leading-snug line-clamp-1"
                  >
                    {proj.name}
                  </Link>

                  <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-3 leading-relaxed">{proj.description || 'No description summary logged.'}</p>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-850 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-slate-400 shrink-0" />
                    <div className="flex -space-x-2">
                      {projectMembers.slice(0, 3).map(m => (
                        <div 
                          key={m.researcher_id}
                          className="w-6 h-6 rounded-full bg-navy-600 text-white font-bold border-2 border-white dark:border-slate-900 flex items-center justify-center text-[9px]"
                          title={m.name}
                        >
                          {m.name.charAt(0)}
                        </div>
                      ))}
                      {projectMembers.length > 3 && (
                        <div className="w-6 h-6 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-[8px] font-bold text-slate-500">
                          +{projectMembers.length - 3}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <Link 
                    to={`/projects/${proj.project_id}`}
                    className="px-3.5 py-1.5 bg-slate-50 border border-slate-200 dark:bg-slate-950 dark:border-slate-850 dark:hover:bg-slate-800 rounded-xl text-xs font-semibold hover:bg-slate-100 transition-colors inline-flex items-center gap-1"
                  >
                    Timeline <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                  </Link>
                </div>

              </div>
            );
          })}
        </div>
      )}

    </div>
  );
};
