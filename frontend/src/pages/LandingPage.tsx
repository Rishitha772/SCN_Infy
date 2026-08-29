import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { GitFork, Network, Award, ChevronRight, Compass, Landmark, Info } from 'lucide-react';
import { ResearcherService } from '../services/researcherService';
import { DashboardService } from '../services/dashboardService';
import type { Researcher, SystemStats } from '../types';

export const LandingPage: React.FC = () => {
  const [featured, setFeatured] = useState<Researcher[]>([]);
  const [stats, setStats] = useState<SystemStats | null>(null);
  const [hoveredNode, setHoveredNode] = useState<number | null>(null);

  useEffect(() => {
    ResearcherService.getAll().then(res => setFeatured(res.slice(0, 3)));
    DashboardService.getSystemStats().then(s => setStats(s));
  }, []);

  // Demo Network preview data
  const previewNodes = [
    { id: 1, name: 'Dr. Maria Chen', role: 'Machine Learning', x: 250, y: 130, type: 'researcher', color: '#123B63' },
    { id: 2, name: 'Stanford University', role: 'Institution', x: 500, y: 110, type: 'institution', color: '#167D9A' },
    { id: 3, name: 'Dr. Sarah Patel', role: 'Bioinformatics', x: 180, y: 260, type: 'researcher', color: '#123B63' },
    { id: 4, name: 'Prof. James Lee', role: 'Network Security', x: 580, y: 250, type: 'researcher', color: '#123B63' },
    { id: 5, name: 'MIT Research Lab', role: 'Institution', x: 380, y: 310, type: 'institution', color: '#167D9A' },
    { id: 6, name: 'AI & Knowledge Graph', role: 'Research Focus', x: 380, y: 190, type: 'core', color: '#36B7C9' }
  ];

  const previewEdges = [
    { source: 6, target: 1, label: 'Joint Project' },
    { source: 6, target: 2, label: 'Affiliation' },
    { source: 6, target: 3, label: 'Joint Paper' },
    { source: 6, target: 4, label: 'Joint Paper' },
    { source: 6, target: 5, label: 'Affiliation' },
    { source: 1, target: 2, label: 'Employment' },
    { source: 3, target: 5, label: 'Employment' },
    { source: 4, target: 2, label: 'Fellow' }
  ];

  const getActiveNodeData = () => {
    return previewNodes.find(n => n.id === hoveredNode);
  };

  const isConnected = (nId: number) => {
    if (hoveredNode === null) return false;
    if (hoveredNode === nId) return true;
    return previewEdges.some(e => 
      (e.source === hoveredNode && e.target === nId) || 
      (e.target === hoveredNode && e.source === nId)
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col text-slate-900 dark:text-slate-100 font-sans transition-colors duration-200">
      
      {/* Landing Topbar */}
      <header className="h-16 px-6 lg:px-12 border-b border-slate-200/50 dark:border-slate-800 bg-white/80 dark:bg-slate-900/70 backdrop-blur-md flex items-center justify-between sticky top-0 z-40 select-none">
        <Link to="/" className="flex items-center gap-2 font-bold text-navy-600 dark:text-navy-450 text-base">
          <GitFork className="w-4 h-4 text-navy-600" />
          <span className="tracking-tight text-slate-900 dark:text-slate-200">SCN Platform</span>
        </Link>
        <div className="flex items-center gap-6">
          <Link to="/researchers" className="text-xs font-bold text-slate-650 dark:text-slate-400 hover:text-navy-600 dark:hover:text-navy-450 transition-colors">Explore Directory</Link>
          <Link to="/login" className="px-3.5 py-1.5 bg-navy-600 hover:bg-navy-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-all">Sign In</Link>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-20 pb-8 px-6 lg:px-12 max-w-4xl mx-auto w-full text-center space-y-6">
        <div className="inline-flex items-center gap-2 bg-navy-50 dark:bg-navy-950/40 text-navy-600 dark:text-navy-400 px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider select-none border border-navy-100/50 dark:border-navy-900/50">
          <Compass className="w-3.5 h-3.5 text-navy-500" />
          Empowering Scholarly Discovery
        </div>
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-[1.1]">
          Scientific Collaboration Network
        </h1>
        <h2 className="text-lg sm:text-xl font-semibold text-slate-500 dark:text-slate-400 max-w-2xl mx-auto">
          Understand the people, ideas, and institutions behind scientific discovery.
        </h2>
        <p className="text-slate-600 dark:text-slate-400 max-w-2xl text-xs sm:text-sm leading-relaxed mx-auto">
          Discover researchers, visualize collaboration networks, analyze research impact, and uncover meaningful scientific connections.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
          <Link to="/researchers" className="px-5 py-2.5 bg-navy-600 hover:bg-navy-700 text-white rounded-lg text-xs font-bold shadow-md shadow-navy-600/10 hover:scale-[1.01] flex items-center gap-1.5 transition-all group">
            Explore Network
            <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
          </Link>
          <Link to="/login" className="px-5 py-2.5 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-350 rounded-lg text-xs font-bold hover:bg-slate-50 dark:hover:bg-slate-850 transition-colors">
            Get Started
          </Link>
        </div>
      </section>

      {/* Network visualization preview */}
      <section className="max-w-4xl mx-auto w-full px-6 pb-16 select-none">
        <div className="relative border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-2xl p-4 shadow-lg flex flex-col md:flex-row gap-6 items-center">
          
          <div className="absolute top-4 left-6 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></span>
            <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Interactive Network Preview</span>
          </div>

          <div className="w-full md:w-2/3 flex justify-center items-center pt-8 md:pt-4">
            <svg className="w-full h-auto max-w-[500px] aspect-[5/4] bg-slate-50/50 dark:bg-slate-950/20 border border-slate-100 dark:border-slate-850 rounded-xl" viewBox="0 0 800 400">
              {/* Draw Edges */}
              {previewEdges.map((e, idx) => {
                const sourceNode = previewNodes.find(n => n.id === e.source)!;
                const targetNode = previewNodes.find(n => n.id === e.target)!;
                const highlight = hoveredNode !== null && (e.source === hoveredNode || e.target === hoveredNode);
                const muted = hoveredNode !== null && !highlight;
                return (
                  <g key={idx}>
                    <line
                      x1={sourceNode.x}
                      y1={sourceNode.y}
                      x2={targetNode.x}
                      y2={targetNode.y}
                      stroke={highlight ? '#36B7C9' : '#cbd5e1'}
                      strokeWidth={highlight ? 2 : 1.2}
                      strokeDasharray={highlight ? '0' : '4 4'}
                      opacity={highlight ? 1 : muted ? 0.2 : 0.6}
                      className="transition-all duration-300 dark:stroke-slate-850"
                    />
                  </g>
                );
              })}

              {/* Draw Nodes */}
              {previewNodes.map(n => {
                const highlight = hoveredNode !== null && isConnected(n.id);
                const isSelected = hoveredNode === n.id;
                const muted = hoveredNode !== null && !highlight;
                const radius = n.type === 'core' ? 24 : 18;
                return (
                  <g
                    key={n.id}
                    onMouseEnter={() => setHoveredNode(n.id)}
                    onMouseLeave={() => setHoveredNode(null)}
                    className="cursor-pointer"
                  >
                    <circle
                      cx={n.x}
                      cy={n.y}
                      r={radius}
                      fill={isSelected ? '#36B7C9' : n.type === 'institution' ? '#167D9A' : '#123B63'}
                      stroke="#ffffff"
                      strokeWidth={2}
                      opacity={muted ? 0.3 : 1}
                      className="transition-all duration-300"
                    />
                    <text
                      x={n.x}
                      y={n.y + 4}
                      textAnchor="middle"
                      fill="#ffffff"
                      className="text-[10px] font-bold font-sans pointer-events-none"
                    >
                      {n.name.charAt(0)}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>

          <div className="w-full md:w-1/3 space-y-4 self-stretch flex flex-col justify-center border-t md:border-t-0 md:border-l border-slate-100 dark:border-slate-800 p-2">
            <div className="flex items-center gap-2 text-navy-600 dark:text-navy-450">
              <Info className="w-4 h-4" />
              <h4 className="text-xs font-bold uppercase tracking-wider">Network Insight</h4>
            </div>
            
            {hoveredNode !== null && getActiveNodeData() ? (
              <div className="space-y-2 animate-fade-in">
                <h5 className="text-sm font-semibold text-slate-800 dark:text-slate-100">{getActiveNodeData()?.name}</h5>
                <span className="inline-block text-[10px] font-bold px-2 py-0.5 bg-navy-50 dark:bg-navy-950/40 text-navy-600 dark:text-navy-400 rounded-md border border-navy-100/50 dark:border-navy-900/10">
                  {getActiveNodeData()?.role}
                </span>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  {getActiveNodeData()?.type === 'institution' 
                    ? 'Explore connections and scientific output mappings from this collaborative research center.' 
                    : 'Analyze peer citation growth, co-authored publication records, and institutional collaborations.'}
                </p>
              </div>
            ) : (
              <div className="text-slate-400 text-xs py-6">
                Hover over the nodes on the network preview map to inspect researchers and connected scientific institutions.
              </div>
            )}
          </div>

        </div>
      </section>

      {/* Aggregate Stats Cards */}
      <section className="bg-white dark:bg-slate-900 border-y border-slate-150 dark:border-slate-850 py-10 px-6 shadow-sm">
        <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          <div className="space-y-1">
            <h3 className="text-2xl font-bold text-navy-600 dark:text-navy-400">{stats?.total_researchers || 0}</h3>
            <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">Active Researchers</p>
          </div>
          <div className="space-y-1">
            <h3 className="text-2xl font-bold text-navy-600 dark:text-navy-400">{stats?.total_publications || 0}</h3>
            <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">Publications Logged</p>
          </div>
          <div className="space-y-1">
            <h3 className="text-2xl font-bold text-navy-600 dark:text-navy-400">{stats?.total_collaborations || 0}</h3>
            <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">Collaborators</p>
          </div>
          <div className="space-y-1">
            <h3 className="text-2xl font-bold text-navy-600 dark:text-navy-400">{stats?.total_citations || 0}</h3>
            <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">Citations Logged</p>
          </div>
        </div>
      </section>

      {/* Platform Capabilities */}
      <section className="py-16 px-6 max-w-5xl mx-auto space-y-12">
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-bold tracking-tight text-slate-850 dark:text-slate-100">Platform Capabilities</h2>
          <p className="text-slate-500 max-w-md mx-auto text-xs">A comprehensive intelligence platform mapping scholarly output, institution hubs, and citation vectors.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="p-5 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-xl space-y-3 shadow-sm">
            <div className="w-9 h-9 rounded-lg bg-navy-50 dark:bg-navy-950/40 flex items-center justify-center text-navy-600 dark:text-navy-455">
              <Network className="w-5 h-5" />
            </div>
            <h4 className="font-semibold text-sm">Research Intelligence</h4>
            <p className="text-[11px] text-slate-500 dark:text-slate-450 leading-relaxed">
              Understand the footprint of scholarly discoveries, tracking growth curves and collaboration centrality metrics across disciplines.
            </p>
          </div>

          <div className="p-5 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-xl space-y-3 shadow-sm">
            <div className="w-9 h-9 rounded-lg bg-navy-50 dark:bg-navy-950/40 flex items-center justify-center text-navy-600 dark:text-navy-455">
              <GitFork className="w-5 h-5" />
            </div>
            <h4 className="font-semibold text-sm">Collaboration Discovery</h4>
            <p className="text-[11px] text-slate-500 dark:text-slate-450 leading-relaxed">
              Find potential co-authors and explore active collaboration clusters. Analyze connections by department or scientific area.
            </p>
          </div>

          <div className="p-5 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-xl space-y-3 shadow-sm">
            <div className="w-9 h-9 rounded-lg bg-navy-50 dark:bg-navy-950/40 flex items-center justify-center text-navy-600 dark:text-navy-455">
              <Award className="w-5 h-5" />
            </div>
            <h4 className="font-semibold text-sm">Research Impact</h4>
            <p className="text-[11px] text-slate-500 dark:text-slate-450 leading-relaxed">
              Log bib citation links, map citing publications, and export dynamic timeline charts tracking citations of published materials.
            </p>
          </div>

          <div className="p-5 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-xl space-y-3 shadow-sm">
            <div className="w-9 h-9 rounded-lg bg-navy-50 dark:bg-navy-950/40 flex items-center justify-center text-navy-600 dark:text-navy-455">
              <Landmark className="w-5 h-5" />
            </div>
            <h4 className="font-semibold text-sm">Institution Connections</h4>
            <p className="text-[11px] text-slate-500 dark:text-slate-450 leading-relaxed">
              Bridge boundaries between organizations. Search affiliated scholars and understand inter-institutional scientific pipelines.
            </p>
          </div>
        </div>
      </section>

      {/* Featured Scholar Profiles */}
      <section className="bg-slate-100 dark:bg-slate-900/50 border-t border-slate-200/50 dark:border-slate-850 py-16 px-6">
        <div className="max-w-5xl mx-auto space-y-10">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">Featured Scholar Profiles</h2>
            <Link to="/researchers" className="text-xs font-bold text-navy-600 dark:text-navy-400 hover:underline">View Full Directory &rarr;</Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {featured.length === 0 ? (
              <div className="col-span-3 text-center py-6 text-xs text-slate-400">Loading directory...</div>
            ) : (
              featured.map(r => (
                <div key={r.researcher_id} className="p-5 bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800 rounded-xl shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-navy-600 text-white text-sm font-bold flex items-center justify-center rounded-full">
                        {r.name.charAt(0)}
                      </div>
                      <div>
                        <h4 className="font-semibold text-xs text-slate-850 dark:text-slate-100">{r.name}</h4>
                        <p className="text-[10px] text-slate-400">{r.department || 'Academic Department'}</p>
                      </div>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-3 leading-relaxed">{r.bio || 'No biography details provided.'}</p>
                  </div>
                  <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-850 flex items-center justify-between">
                    <span className="text-[9px] bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-850 px-2 py-0.5 rounded text-slate-500 dark:text-slate-400 font-semibold font-mono">ORCID: {r.orcid || 'N/A'}</span>
                    <Link to={`/researchers/${r.researcher_id}`} className="text-[11px] font-bold text-navy-600 dark:text-navy-450 hover:underline">View Profile</Link>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 py-8 px-6 text-center text-xs text-slate-400 select-none">
        <p>&copy; 2026 Scientific Collaboration Network (SCN). All rights reserved.</p>
        <p className="mt-1 text-[10px] text-slate-500">Premium Research Intelligence Dashboard &bull; FastAPI, PostgreSQL, and React-Vite Analytics.</p>
      </footer>

    </div>
  );
};
