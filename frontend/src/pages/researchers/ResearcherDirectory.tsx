import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ResearcherService } from '../../services/researcherService';
import { AdminService } from '../../services/adminService';
import { PublicationService } from '../../services/publicationService';
import { ProjectService } from '../../services/projectService';
import { CollaborationService } from '../../services/collaborationService';
import type { Researcher, Institution } from '../../types';
import { Search, Landmark, Grid, List, GraduationCap } from 'lucide-react';

export const ResearcherDirectory: React.FC = () => {
  const [researchers, setResearchers] = useState<Researcher[]>([]);
  const [institutions, setInstitutions] = useState<Institution[]>([]);
  const [stats, setStats] = useState<Record<number, { pubs: number; projs: number; collabs: number }>>({});
  
  // Search & Filter
  const [query, setQuery] = useState('');
  const [instFilter, setInstFilter] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadDirectory = async () => {
      setLoading(true);
      try {
        const resList = await ResearcherService.getAll();
        setResearchers(resList);

        const instList = await AdminService.getAllInstitutions();
        setInstitutions(instList);

        // Load statistics for each researcher dynamically
        const calculatedStats: typeof stats = {};
        for (const r of resList) {
          const pubs = await PublicationService.getByResearcher(r.researcher_id);
          const projs = await ProjectService.getByResearcher(r.researcher_id);
          const colls = await CollaborationService.getByResearcher(r.researcher_id);
          calculatedStats[r.researcher_id] = {
            pubs: pubs.length,
            projs: projs.length,
            collabs: colls.length
          };
        }
        setStats(calculatedStats);

      } catch (err) {
        console.error("Failed to load researcher directory:", err);
      } finally {
        setLoading(false);
      }
    };
    loadDirectory();
  }, []);

  // Filtered list
  const filteredResearchers = researchers.filter(r => {
    const matchesQuery = r.name.toLowerCase().includes(query.toLowerCase()) ||
      (r.department && r.department.toLowerCase().includes(query.toLowerCase())) ||
      r.skills.some(s => s.toLowerCase().includes(query.toLowerCase())) ||
      r.research_interests.some(i => i.toLowerCase().includes(query.toLowerCase()));
      
    const matchesInst = instFilter === 'all' || r.institution_id === Number(instFilter);
    
    return matchesQuery && matchesInst;
  });

  return (
    <div className="space-y-6">
      
      {/* Page Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Discover Researchers</h1>
          <p className="text-slate-500 text-sm">Search and browse academic profiles across network institutions.</p>
        </div>
        <div className="flex items-center gap-1.5 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-xl p-1 shadow-sm select-none">
          <button 
            onClick={() => setViewMode('grid')}
            className={`p-1.5 rounded-md transition-colors ${viewMode === 'grid' ? 'bg-navy-600 text-white' : 'text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
            title="Grid View"
          >
            <Grid className="w-4 h-4" />
          </button>
          <button 
            onClick={() => setViewMode('list')}
            className={`p-1.5 rounded-md transition-colors ${viewMode === 'list' ? 'bg-navy-600 text-white' : 'text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
            title="List View"
          >
            <List className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 border border-slate-200/60 dark:border-slate-800/60 bg-white dark:bg-slate-900 p-4 rounded-2xl shadow-sm">
        
        {/* Search */}
        <div className="sm:col-span-2 relative">
          <input 
            type="text"
            placeholder="Search by name, expertise, department, skills..."
            className="w-full pl-10 pr-4 py-2 border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 rounded-xl text-xs focus:border-navy-500 focus:outline-none transition-colors"
            value={query}
            onChange={e => setQuery(e.target.value)}
          />
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        </div>

        {/* Institution filter */}
        <div className="relative">
          <select 
            className="w-full px-4 py-2 border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 rounded-xl text-xs focus:border-navy-500 focus:outline-none appearance-none transition-colors"
            value={instFilter}
            onChange={e => setInstFilter(e.target.value)}
          >
            <option value="all">All Institutions</option>
            {institutions.map(inst => (
              <option key={inst.institution_id} value={inst.institution_id}>
                {inst.name}
              </option>
            ))}
          </select>
          <Landmark className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
        </div>

      </div>

      {/* Loading state */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <div className="w-10 h-10 border-4 border-navy-500 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-slate-500 text-sm font-medium">Assembling scholars directory...</span>
        </div>
      ) : filteredResearchers.length === 0 ? (
        <div className="p-8 text-center text-xs text-slate-450 border border-slate-200 bg-white dark:bg-slate-900 rounded-2xl shadow-sm">
          No researchers matched your current search filters.
        </div>
      ) : viewMode === 'grid' ? (
        
        // GRID VIEW
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {filteredResearchers.map(r => {
            const inst = institutions.find(i => i.institution_id === r.institution_id);
            const rStats = stats[r.researcher_id] || { pubs: 0, projs: 0, collabs: 0 };
            return (
              <div key={r.researcher_id} className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/60 rounded-2xl shadow-sm p-6 flex flex-col justify-between hover:border-slate-300 dark:hover:border-slate-700 transition-all hover:shadow-md">
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-navy-600 text-white font-extrabold flex items-center justify-center text-sm shadow-inner">
                      {r.name.charAt(0)}
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-slate-800 dark:text-slate-200 line-clamp-1">{r.name}</h4>
                      <p className="text-[10px] text-slate-400 font-semibold truncate leading-none mt-1 flex items-center gap-0.5"><GraduationCap className="w-3 h-3 text-slate-500" />{r.department || 'Researcher'}</p>
                    </div>
                  </div>

                  <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-3 leading-relaxed">{r.bio || 'No biography details provided.'}</p>
                  
                  {/* Inst Label */}
                  <div className="text-[10px] text-slate-400 flex items-center gap-1">
                    <Landmark className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">{inst?.name || 'Independent Scholar'}</span>
                  </div>

                  {/* Skills badges */}
                  <div className="flex flex-wrap gap-1">
                    {r.skills.slice(0, 3).map(skill => (
                      <span key={skill} className="bg-navy-50 dark:bg-navy-950/20 text-navy-650 dark:text-navy-450 px-2 py-0.5 rounded text-[9px] font-semibold border border-navy-100/50 dark:border-navy-900/10">{skill}</span>
                    ))}
                    {r.skills.length > 3 && (
                      <span className="text-[9px] text-slate-400 self-center pl-1">+{r.skills.length - 3} more</span>
                    )}
                  </div>
                </div>

                {/* Footer Metrics */}
                <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-850 flex items-center justify-between">
                  <div className="flex gap-4 text-center text-slate-500">
                    <div>
                      <p className="text-xs font-bold text-slate-800 dark:text-slate-200">{rStats.pubs}</p>
                      <p className="text-[9px] uppercase tracking-wider text-slate-400">Pubs</p>
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-800 dark:text-slate-200">{rStats.projs}</p>
                      <p className="text-[9px] uppercase tracking-wider text-slate-400">Projects</p>
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-800 dark:text-slate-200">{rStats.collabs}</p>
                      <p className="text-[9px] uppercase tracking-wider text-slate-400">Links</p>
                    </div>
                  </div>
                  
                  <Link 
                    to={`/researchers/${r.researcher_id}`}
                    className="px-3 py-1.5 bg-navy-50 hover:bg-navy-100 dark:bg-navy-950 dark:hover:bg-navy-900/60 border border-navy-100/50 dark:border-navy-900/20 rounded-xl text-xs font-semibold text-navy-650 dark:text-navy-400"
                  >
                    View Profile
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        
        // LIST VIEW
        <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/60 rounded-2xl shadow-sm overflow-hidden divide-y divide-slate-100 dark:divide-slate-850">
          {filteredResearchers.map(r => {
            const inst = institutions.find(i => i.institution_id === r.institution_id);
            const rStats = stats[r.researcher_id] || { pubs: 0, projs: 0, collabs: 0 };
            return (
              <div key={r.researcher_id} className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/50 dark:hover:bg-slate-800/10">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-navy-600 text-white font-extrabold flex items-center justify-center text-xs shrink-0 select-none">
                    {r.name.charAt(0)}
                  </div>
                  <div className="space-y-1">
                    <h4 className="font-bold text-sm hover:text-navy-650 hover:underline">
                      <Link to={`/researchers/${r.researcher_id}`}>{r.name}</Link>
                    </h4>
                    <p className="text-[11px] text-slate-500">{r.department} • {inst?.name || 'Independent Researcher'}</p>
                    <div className="flex flex-wrap gap-1 pt-1">
                      {r.research_interests.slice(0, 3).map(interest => (
                        <span key={interest} className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-2 py-0.5 rounded text-[9px] font-semibold">{interest}</span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-6 self-start sm:self-center">
                  <div className="flex gap-4 text-center text-slate-400">
                    <div>
                      <span className="text-xs font-bold text-slate-855 dark:text-slate-200 block">{rStats.pubs}</span>
                      <span className="text-[8px] uppercase font-bold tracking-wider">Publications</span>
                    </div>
                    <div>
                      <span className="text-xs font-bold text-slate-855 dark:text-slate-200 block">{rStats.projs}</span>
                      <span className="text-[8px] uppercase font-bold tracking-wider">Projects</span>
                    </div>
                  </div>
                  <Link 
                    to={`/researchers/${r.researcher_id}`}
                    className="px-3 py-1.5 bg-slate-50 border border-slate-200 dark:bg-slate-950 dark:border-slate-800 dark:hover:bg-slate-850 rounded-xl text-xs font-semibold"
                  >
                    Profile
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
