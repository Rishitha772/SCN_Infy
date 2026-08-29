import React, { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { CollaborationService } from '../../services/collaborationService';
import { ResearcherService } from '../../services/researcherService';
import { PublicationService } from '../../services/publicationService';
import { AdminService } from '../../services/adminService';
import type { Collaboration, Researcher, Publication, Institution } from '../../types';
import { 
  Search, List, Grid, Plus, X, AlertCircle, ZoomIn, ZoomOut, 
  RotateCcw, Info, Landmark, Users, Activity
} from 'lucide-react';

export const Collaborations: React.FC = () => {

  const [collaborations, setCollaborations] = useState<Collaboration[]>([]);
  const [researchers, setResearchers] = useState<Researcher[]>([]);
  const [institutions, setInstitutions] = useState<Institution[]>([]);
  const [loading, setLoading] = useState(true);

  // View state: graph vs list (table fallback)
  const [viewMode, setViewMode] = useState<'graph' | 'list'>('graph');
  
  // Interactive navigation states (Zoom & Pan)
  const [zoom, setZoom] = useState(1);
  const [panX, setPanX] = useState(0);
  const [panY, setPanY] = useState(0);
  const [isPanning, setIsPanning] = useState(false);
  const [startPan, setStartPan] = useState({ x: 0, y: 0 });

  // Filtering form states
  const [nameQuery, setNameQuery] = useState('');
  const [instFilter, setInstFilter] = useState('');
  const [interestFilter, setInterestFilter] = useState('');
  const [collabTypeFilter, setCollabTypeFilter] = useState('');

  // Selected details states
  const [selectedResId, setSelectedResId] = useState<number | null>(null);
  const [selectedInstId, setSelectedInstId] = useState<number | null>(null);
  
  // Sub-metrics fetched on demand
  const [selectedPubs, setSelectedPubs] = useState<Publication[]>([]);
  const [selectedLoading, setSelectedLoading] = useState(false);

  // Connection Dialog states
  const [edgeDialogOpen, setEdgeDialogOpen] = useState(false);
  const [partnerId1, setPartnerId1] = useState<number | undefined>(undefined);
  const [partnerId2, setPartnerId2] = useState<number | undefined>(undefined);
  const [collabType, setCollabType] = useState('Joint Publication');
  const [edgeError, setEdgeError] = useState('');

  const loadData = async () => {
    setLoading(true);
    try {
      const [colls, resList, instsList] = await Promise.all([
        CollaborationService.getAll(),
        ResearcherService.getAll(),
        AdminService.getAllInstitutions().catch(() => [])
      ]);
      setCollaborations(colls);
      setResearchers(resList);
      setInstitutions(instsList);
    } catch (err) {
      console.error("Failed to load collaborations data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Fetch selected node portfolio metrics
  useEffect(() => {
    if (!selectedResId) {
      setSelectedPubs([]);
      return;
    }

    setSelectedLoading(true);
    PublicationService.getByResearcher(selectedResId)
      .then(pubs => {
        setSelectedPubs(pubs);
      })
      .catch(() => {
        setSelectedPubs([]);
      })
      .finally(() => {
        setSelectedLoading(false);
      });
  }, [selectedResId]);

  const handleAddEdge = async (e: React.FormEvent) => {
    e.preventDefault();
    setEdgeError('');
    if (!partnerId1 || !partnerId2) return;

    if (partnerId1 === partnerId2) {
      setEdgeError("A researcher cannot collaborate with themselves.");
      return;
    }

    try {
      await CollaborationService.create({
        researcher_ids: [partnerId1, partnerId2],
        collaboration_type: collabType
      });
      setEdgeDialogOpen(false);
      setPartnerId1(undefined);
      setPartnerId2(undefined);
      loadData();
    } catch (err: any) {
      setEdgeError(err.message || "Failed to establish connection.");
    }
  };

  // Compile all unique interests for filter selector
  const allInterests = useMemo(() => {
    const set = new Set<string>();
    researchers.forEach(r => {
      if (r.research_interests) r.research_interests.forEach((i: string) => set.add(i));
      if (r.skills) r.skills.forEach(s => set.add(s));
    });
    return Array.from(set).sort();
  }, [researchers]);

  // PAN / DRAG MOUSE HANDLERS ON SVG
  const handleMouseDown = (e: React.MouseEvent<SVGSVGElement>) => {
    const target = e.target as SVGElement;
    if (target.tagName === 'svg' || target.tagName === 'line' || target.getAttribute('data-bg') === 'true') {
      setIsPanning(true);
      setStartPan({ x: e.clientX - panX, y: e.clientY - panY });
    }
  };

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (isPanning) {
      setPanX(e.clientX - startPan.x);
      setPanY(e.clientY - startPan.y);
    }
  };

  const handleMouseUp = () => {
    setIsPanning(false);
  };

  // ZOOM CONTROLLERS
  const handleZoomIn = () => setZoom(prev => Math.min(prev + 0.1, 3.0));
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 0.1, 0.4));
  const handleResetZoom = () => {
    setZoom(1);
    setPanX(0);
    setPanY(0);
    setSelectedResId(null);
    setSelectedInstId(null);
  };

  // DYNAMIC SPRING FORCE GRAPH GENERATION
  const graphData = useMemo(() => {
    // 1. Filter Researchers
    const filteredResearchers = researchers.filter(r => {
      const matchName = !nameQuery || r.name.toLowerCase().includes(nameQuery.toLowerCase()) || (r.department && r.department.toLowerCase().includes(nameQuery.toLowerCase()));
      const matchInst = !instFilter || String(r.institution_id) === instFilter;
      const matchInterest = !interestFilter || 
        (r.research_interests && r.research_interests.includes(interestFilter)) ||
        (r.skills && r.skills.includes(interestFilter));
      return matchName && matchInst && matchInterest;
    });

    const activeResearcherIds = filteredResearchers.map(r => r.researcher_id);

    // 2. Filter Collaborations
    const filteredCollabs = collaborations.filter(col => {
      const inNodes = col.researcher_ids.every(id => activeResearcherIds.includes(id));
      const matchType = !collabTypeFilter || col.collaboration_type === collabTypeFilter;
      return inNodes && matchType;
    });

    // 3. Compile Node objects (Researchers + unique affiliated Institutions)
    const nodes: any[] = [];
    const edges: any[] = [];

    // Add researcher nodes
    filteredResearchers.forEach(r => {
      nodes.push({
        id: `res_${r.researcher_id}`,
        dbId: r.researcher_id,
        label: r.name,
        type: 'researcher',
        subtext: r.department || 'Researcher',
        color: '#123B63'
      });
    });

    // Gather unique institutions in use
    const usedInstIds = new Set<number>();
    filteredResearchers.forEach(r => {
      if (r.institution_id) usedInstIds.add(r.institution_id);
    });

    // Add institution nodes
    usedInstIds.forEach(instId => {
      const instObj = institutions.find(i => i.institution_id === instId);
      const instName = instObj ? instObj.name : `Institution #${instId}`;
      nodes.push({
        id: `inst_${instId}`,
        dbId: instId,
        label: instName,
        type: 'institution',
        subtext: instObj ? `${instObj.city}, ${instObj.country}` : 'Research Center',
        color: '#167D9A'
      });
    });

    // 4. Compile Edges (Research Collabs + Affiliations)
    // Research collaborations
    filteredCollabs.forEach(col => {
      edges.push({
        id: `col_${col.collaboration_id}`,
        source: `res_${col.researcher_ids[0]}`,
        target: `res_${col.researcher_ids[1]}`,
        type: 'collaboration',
        weight: col.collaboration_count,
        label: col.collaboration_type || 'Co-author'
      });
    });

    // Affiliation links
    filteredResearchers.forEach(r => {
      if (r.institution_id) {
        edges.push({
          id: `aff_${r.researcher_id}_${r.institution_id}`,
          source: `res_${r.researcher_id}`,
          target: `inst_${r.institution_id}`,
          type: 'affiliation',
          weight: 1,
          label: 'Affiliation'
        });
      }
    });

    // 5. Run Spring Force-Directed Layout Simulation
    const width = 600;
    const height = 450;
    const cx = width / 2;
    const cy = height / 2;

    // Initialize circular positions
    const layoutNodes = nodes.map((n, i) => {
      const angle = (i * 2 * Math.PI) / nodes.length;
      return {
        ...n,
        x: cx + 160 * Math.cos(angle) + (Math.random() - 0.5) * 8,
        y: cy + 160 * Math.sin(angle) + (Math.random() - 0.5) * 8,
        vx: 0,
        vy: 0
      };
    });

    const kRep = 9000;
    const kAtt = 0.08;
    const damping = 0.8;

    for (let tick = 0; tick < 120; tick++) {
      // Repulsion force
      for (let i = 0; i < layoutNodes.length; i++) {
        for (let j = i + 1; j < layoutNodes.length; j++) {
          const dx = layoutNodes[j].x - layoutNodes[i].x;
          const dy = layoutNodes[j].y - layoutNodes[i].y;
          const distSq = dx * dx + dy * dy + 0.1;
          const dist = Math.sqrt(distSq);
          if (dist < 220) {
            const force = kRep / distSq;
            const fx = (dx / dist) * force;
            const fy = (dy / dist) * force;
            layoutNodes[i].vx -= fx;
            layoutNodes[i].vy -= fy;
            layoutNodes[j].vx += fx;
            layoutNodes[j].vy += fy;
          }
        }
      }

      // Attraction force along edges
      edges.forEach(e => {
        const sourceNode = layoutNodes.find(n => n.id === e.source);
        const targetNode = layoutNodes.find(n => n.id === e.target);
        if (sourceNode && targetNode) {
          const dx = targetNode.x - sourceNode.x;
          const dy = targetNode.y - sourceNode.y;
          const dist = Math.sqrt(dx * dx + dy * dy) || 0.1;
          const force = kAtt * dist;
          const fx = (dx / dist) * force;
          const fy = (dy / dist) * force;
          sourceNode.vx += fx;
          sourceNode.vy += fy;
          targetNode.vx -= fx;
          targetNode.vy -= fy;
        }
      });

      // Gravity and dampening
      layoutNodes.forEach(n => {
        const dx = cx - n.x;
        const dy = cy - n.y;
        n.vx += dx * 0.012;
        n.vy += dy * 0.012;

        n.x += n.vx;
        n.y += n.vy;
        n.vx *= damping;
        n.vy *= damping;
      });
    }

    return { nodes: layoutNodes, edges };
  }, [researchers, collaborations, institutions, nameQuery, instFilter, interestFilter, collabTypeFilter]);

  // NETWORK METRICS CALCULATIONS
  const networkMetrics = useMemo(() => {
    const V = graphData.nodes.filter(n => n.type === 'researcher').length;
    // Count only researcher-researcher collaboration edges
    const E = graphData.edges.filter(e => e.type === 'collaboration').length;

    // Density
    const density = V > 1 ? (2 * E) / (V * (V - 1)) : 0;

    // Average collaboration count
    const totalWeight = graphData.edges
      .filter(e => e.type === 'collaboration')
      .reduce((sum, e) => sum + e.weight, 0);
    const avgStrength = E > 0 ? totalWeight / E : 0;

    return {
      nodeCount: V,
      edgeCount: E,
      density,
      avgStrength
    };
  }, [graphData]);

  // Node Degree and Closeness Centrality Calculation on demand
  const activeCentralities = useMemo(() => {
    if (!selectedResId) return { degree: 0, closeness: 0 };
    const startId = `res_${selectedResId}`;
    
    // Degree
    const degreeEdges = graphData.edges.filter(e => e.type === 'collaboration' && (e.source === startId || e.target === startId));
    const degree = degreeEdges.length;

    // Closeness Centrality (BFS shortest paths)
    const resNodes = graphData.nodes.filter(n => n.type === 'researcher');
    const adj: Record<string, string[]> = {};
    resNodes.forEach(n => adj[n.id] = []);
    graphData.edges.forEach(e => {
      if (e.type === 'collaboration') {
        adj[e.source]?.push(e.target);
        adj[e.target]?.push(e.source);
      }
    });

    const dists: Record<string, number> = {};
    resNodes.forEach(n => dists[n.id] = Infinity);
    dists[startId] = 0;

    const queue: string[] = [startId];
    let reachableCount = 0;
    let distanceSum = 0;

    while (queue.length > 0) {
      const curr = queue.shift()!;
      reachableCount++;
      const neighbors = adj[curr] || [];
      neighbors.forEach(n => {
        if (dists[n] === Infinity) {
          dists[n] = dists[curr] + 1;
          distanceSum += dists[n];
          queue.push(n);
        }
      });
    }

    const closeness = (reachableCount > 1 && distanceSum > 0) 
      ? (reachableCount - 1) / distanceSum 
      : 0;

    return { degree, closeness };
  }, [selectedResId, graphData]);

  // Insight Calculations
  const networkInsights = useMemo(() => {
    // 1. Identify strongly connected hubs
    const degrees: Record<string, number> = {};
    graphData.edges.forEach(e => {
      if (e.type === 'collaboration') {
        degrees[e.source] = (degrees[e.source] || 0) + 1;
        degrees[e.target] = (degrees[e.target] || 0) + 1;
      }
    });

    let topHubNodeId = '';
    let maxDegree = 0;
    Object.keys(degrees).forEach(id => {
      if (degrees[id] > maxDegree) {
        maxDegree = degrees[id];
        topHubNodeId = id;
      }
    });

    let topHubName = 'N/A';
    if (topHubNodeId) {
      const node = graphData.nodes.find(n => n.id === topHubNodeId);
      if (node) topHubName = node.label;
    }

    // 2. Identify top collaboration fields
    const interestCounts: Record<string, number> = {};
    researchers.forEach(r => {
      const combined = [...(r.research_interests || []), ...(r.skills || [])];
      combined.forEach(interest => {
        interestCounts[interest] = (interestCounts[interest] || 0) + 1;
      });
    });

    let topField = 'N/A';
    let maxCount = 0;
    Object.keys(interestCounts).forEach(f => {
      if (interestCounts[f] > maxCount) {
        maxCount = interestCounts[f];
        topField = f;
      }
    });

    return {
      topHubName,
      maxDegree,
      topField
    };
  }, [graphData, researchers]);

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Collaboration Network</h1>
          <p className="text-slate-500 text-xs text-slate-500 dark:text-slate-400">
            Map peer connections, institutional pipelines, and academic co-authorship indexes.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setEdgeDialogOpen(true)}
            className="px-3.5 py-1.5 bg-navy-600 hover:bg-navy-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-sm transition-colors"
          >
            <Plus className="w-4 h-4" /> Add Connection
          </button>
          
          <div className="flex items-center gap-1.5 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-lg p-1 shadow-sm select-none">
            <button 
              onClick={() => setViewMode('graph')}
              className={`p-1.5 rounded-md transition-colors ${viewMode === 'graph' ? 'bg-navy-600 text-white' : 'text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
              title="Interactive Graph View"
            >
              <Grid className="w-4 h-4" />
            </button>
            <button 
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded-md transition-colors ${viewMode === 'list' ? 'bg-navy-600 text-white' : 'text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
              title="Table Tabular View"
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <div className="w-10 h-10 border-4 border-navy-600 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-slate-500 text-sm font-semibold">Generating spring nodes physics...</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* LEFT COLUMN: FILTERS & DENSITY DETAILS */}
          <div className="lg:col-span-3 space-y-6">
            
            {/* Filter Panel */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-850 p-5 rounded-xl shadow-sm space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 pb-2 border-b border-slate-100 dark:border-slate-800">
                Filter Explorer
              </h3>
              
              <div className="space-y-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-450 uppercase tracking-widest block">Researcher Name</label>
                  <div className="relative">
                    <input 
                      type="text" 
                      placeholder="Search name/dept..."
                      className="w-full pl-8 pr-3 py-1.5 border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 rounded-lg text-xs outline-none"
                      value={nameQuery}
                      onChange={e => setNameQuery(e.target.value)}
                    />
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-450 uppercase tracking-widest block">Institution</label>
                  <select 
                    className="w-full px-3 py-1.5 border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 rounded-lg text-xs outline-none"
                    value={instFilter}
                    onChange={e => setInstFilter(e.target.value)}
                  >
                    <option value="">All Institutions</option>
                    {institutions.map(inst => (
                      <option key={inst.institution_id} value={inst.institution_id}>{inst.name}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-450 uppercase tracking-widest block">Research Area</label>
                  <select 
                    className="w-full px-3 py-1.5 border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 rounded-lg text-xs outline-none"
                    value={interestFilter}
                    onChange={e => setInterestFilter(e.target.value)}
                  >
                    <option value="">All Fields</option>
                    {allInterests.map(interest => (
                      <option key={interest} value={interest}>{interest}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-450 uppercase tracking-widest block">Collaboration Type</label>
                  <select 
                    className="w-full px-3 py-1.5 border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 rounded-lg text-xs outline-none"
                    value={collabTypeFilter}
                    onChange={e => setCollabTypeFilter(e.target.value)}
                  >
                    <option value="">All Types</option>
                    <option value="Joint Publication">Joint Publication</option>
                    <option value="Joint Project">Joint Project</option>
                    <option value="Co-author">Co-author</option>
                    <option value="Peer Review">Peer Review</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Network Analytics Metrics Summary */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-850 p-5 rounded-xl shadow-sm space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 pb-2 border-b border-slate-100 dark:border-slate-800 flex items-center gap-1">
                <Activity className="w-4 h-4 text-navy-600" />
                Network Metrics
              </h3>
              <div className="space-y-3 font-semibold text-xs text-slate-650 dark:text-slate-400">
                <div className="flex justify-between">
                  <span>Network Size (V):</span>
                  <span className="font-bold text-slate-850 dark:text-slate-100">{networkMetrics.nodeCount} scholars</span>
                </div>
                <div className="flex justify-between">
                  <span>Active Connections (E):</span>
                  <span className="font-bold text-slate-850 dark:text-slate-100">{networkMetrics.edgeCount} edges</span>
                </div>
                <div className="flex justify-between">
                  <span>Network Density:</span>
                  <span className="font-bold text-slate-850 dark:text-slate-100">{(networkMetrics.density * 100).toFixed(1)}%</span>
                </div>
                <div className="flex justify-between">
                  <span>Avg Edge Weight:</span>
                  <span className="font-bold text-slate-850 dark:text-slate-100">{networkMetrics.avgStrength.toFixed(2)}</span>
                </div>
              </div>
            </div>

          </div>

          {/* CENTER COLUMN: INTERACTIVE VISUALIZER */}
          <div className="lg:col-span-6 space-y-6">
            
            {viewMode === 'graph' ? (
              <div className="relative border border-slate-250/60 dark:border-slate-850 bg-white dark:bg-slate-900 rounded-2xl shadow-sm overflow-hidden flex flex-col p-4">
                
                {/* Visual controls */}
                <div className="absolute top-4 right-4 flex items-center gap-1.5 bg-slate-50/80 dark:bg-slate-950/80 backdrop-blur border border-slate-200 dark:border-slate-800 p-1.5 rounded-lg z-15 select-none shadow-sm">
                  <button onClick={handleZoomIn} className="p-1 hover:bg-slate-200 dark:hover:bg-slate-800 rounded text-slate-600 dark:text-slate-400" title="Zoom In"><ZoomIn className="w-4 h-4" /></button>
                  <button onClick={handleZoomOut} className="p-1 hover:bg-slate-200 dark:hover:bg-slate-800 rounded text-slate-600 dark:text-slate-400" title="Zoom Out"><ZoomOut className="w-4 h-4" /></button>
                  <button onClick={handleResetZoom} className="p-1 hover:bg-slate-200 dark:hover:bg-slate-800 rounded text-slate-600 dark:text-slate-400" title="Reset View"><RotateCcw className="w-4 h-4" /></button>
                </div>

                <div className="absolute top-4 left-4 flex items-center gap-1 text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest select-none">
                  <span className="w-1.5 h-1.5 bg-navy-600 rounded-full inline-block"></span> Researcher
                  <span className="w-1.5 h-1.5 bg-navy-500 rounded-full inline-block ml-2"></span> Institution
                </div>

                {/* Main Graph SVG Canvas */}
                <div className="w-full overflow-hidden select-none">
                  <svg 
                    className="w-full h-auto aspect-[4/3] border border-slate-100 dark:border-slate-850 rounded-xl bg-slate-50/50 dark:bg-slate-950/20 cursor-grab active:cursor-grabbing" 
                    viewBox="0 0 600 450"
                    onMouseDown={handleMouseDown}
                    onMouseMove={handleMouseMove}
                    onMouseUp={handleMouseUp}
                    onMouseLeave={handleMouseUp}
                  >
                    <rect width="600" height="450" fill="transparent" data-bg="true" />
                    
                    <g transform={`translate(${panX}, ${panY}) scale(${zoom})`} className="transition-transform duration-75">
                      
                      {/* 1. Draw Edges */}
                      {graphData.edges.map((e: any) => {
                        const sourceNode = graphData.nodes.find(n => n.id === e.source)!;
                        const targetNode = graphData.nodes.find(n => n.id === e.target)!;
                        if (!sourceNode || !targetNode) return null;

                        const isSourceSelected = selectedResId && sourceNode.id === `res_${selectedResId}`;
                        const isTargetSelected = selectedResId && targetNode.id === `res_${selectedResId}`;
                        const isInstSelected = selectedInstId && (sourceNode.id === `inst_${selectedInstId}` || targetNode.id === `inst_${selectedInstId}`);
                        
                        const isEdgeSelected = isSourceSelected || isTargetSelected || isInstSelected;
                        const isNodeSelectedState = selectedResId !== null || selectedInstId !== null;
                        
                        const strokeColor = isEdgeSelected 
                          ? '#36B7C9' // Cyan Accent
                          : e.type === 'affiliation' 
                            ? '#e2e8f0' 
                            : '#cbd5e1';

                        const strokeWidth = isEdgeSelected 
                          ? 2.5 
                          : e.type === 'affiliation' 
                            ? 1.0 
                            : Math.min(e.weight + 0.8, 5);

                        const opacity = isNodeSelectedState 
                          ? (isEdgeSelected ? 1.0 : 0.15) 
                          : 0.55;

                        return (
                          <line 
                            key={e.id}
                            x1={sourceNode.x}
                            y1={sourceNode.y}
                            x2={targetNode.x}
                            y2={targetNode.y}
                            stroke={strokeColor}
                            strokeWidth={strokeWidth}
                            opacity={opacity}
                            strokeDasharray={e.type === 'affiliation' ? '3 3' : '0'}
                            className="transition-all duration-300 dark:stroke-slate-800"
                          />
                        );
                      })}

                      {/* 2. Draw Nodes */}
                      {graphData.nodes.map(n => {
                        const isSelected = (n.type === 'researcher' && selectedResId === n.dbId) || (n.type === 'institution' && selectedInstId === n.dbId);
                        
                        // Check if node is connected to the selected researcher node
                        let isConnectedToSelected = false;
                        if (selectedResId) {
                          const startId = `res_${selectedResId}`;
                          isConnectedToSelected = n.id === startId || graphData.edges.some(e => 
                            (e.source === startId && e.target === n.id) || (e.target === startId && e.source === n.id)
                          );
                        } else if (selectedInstId) {
                          const startId = `inst_${selectedInstId}`;
                          isConnectedToSelected = n.id === startId || graphData.edges.some(e => 
                            (e.source === startId && e.target === n.id) || (e.target === startId && e.source === n.id)
                          );
                        }

                        const hasSelection = selectedResId !== null || selectedInstId !== null;
                        const opacity = hasSelection ? (isConnectedToSelected ? 1.0 : 0.2) : 1.0;
                        const radius = n.type === 'institution' ? 18 : 15;
                        const fillColor = isSelected 
                          ? '#36B7C9' // Cyan Accent
                          : n.type === 'institution' 
                            ? '#167D9A' // Teal
                            : '#123B63'; // Deep Scientific Blue

                        return (
                          <g 
                            key={n.id}
                            onClick={() => {
                              if (n.type === 'researcher') {
                                setSelectedResId(n.dbId);
                                setSelectedInstId(null);
                              } else {
                                setSelectedInstId(n.dbId);
                                setSelectedResId(null);
                              }
                            }}
                            className="cursor-pointer group"
                            opacity={opacity}
                          >
                            <circle 
                              cx={n.x}
                              cy={n.y}
                              r={radius}
                              fill={fillColor}
                              stroke="#ffffff"
                              strokeWidth={2}
                              className="transition-all duration-300 dark:stroke-slate-900 shadow-md group-hover:scale-105"
                            />
                            <text
                              x={n.x}
                              y={n.y + 4}
                              textAnchor="middle"
                              fill="white"
                              className="text-[9px] font-bold font-sans pointer-events-none select-none"
                            >
                              {n.label.charAt(0)}
                            </text>
                            
                            {/* Text label below node */}
                            <text
                              x={n.x}
                              y={n.y + radius + 12}
                              textAnchor="middle"
                              fill="#475569"
                              className="text-[8px] font-bold fill-slate-500 dark:fill-slate-400 select-none pointer-events-none"
                            >
                              {n.label.split(' ').pop()}
                            </text>
                          </g>
                        );
                      })}

                    </g>
                  </svg>
                </div>

                <div className="w-full text-center mt-3 text-[10px] text-slate-400">
                  * Drag canvas to Pan. Click nodes to select. Highlighted links show scholastic ties.
                </div>

              </div>
            ) : (
              
              // tabular list view fallback
              <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/60 rounded-xl shadow-sm overflow-hidden flex flex-col">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs divide-y divide-slate-150 dark:divide-slate-800">
                    <thead>
                      <tr className="bg-slate-50/50 dark:bg-slate-950/20 text-slate-450 font-bold uppercase tracking-wider text-[10px]">
                        <th className="px-6 py-3">Researcher A</th>
                        <th className="px-6 py-3">Researcher B</th>
                        <th className="px-6 py-3">Link Classification</th>
                        <th className="px-6 py-3 text-center">Publications Count</th>
                        <th className="px-6 py-3 text-right">Reference Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-855">
                      {collaborations.map(col => {
                        const res1 = researchers.find(r => r.researcher_id === col.researcher_ids[0]);
                        const res2 = researchers.find(r => r.researcher_id === col.researcher_ids[1]);
                        return (
                          <tr key={col.collaboration_id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors">
                            <td className="px-6 py-3.5 font-bold text-slate-800 dark:text-slate-200">
                              {res1 ? <Link to={`/researchers/${res1.researcher_id}`} className="hover:underline">{res1.name}</Link> : `ID ${col.researcher_ids[0]}`}
                            </td>
                            <td className="px-6 py-3.5 font-bold text-slate-800 dark:text-slate-200">
                              {res2 ? <Link to={`/researchers/${res2.researcher_id}`} className="hover:underline">{res2.name}</Link> : `ID ${col.researcher_ids[1]}`}
                            </td>
                            <td className="px-6 py-3.5 text-slate-500 capitalize">{col.collaboration_type || 'Co-author'}</td>
                            <td className="px-6 py-3.5 text-center font-bold text-navy-600 dark:text-navy-450">{col.collaboration_count}</td>
                            <td className="px-6 py-3.5 text-right">
                              <button 
                                onClick={async () => {
                                  if (window.confirm("Remove this collaboration link?")) {
                                    await CollaborationService.delete(col.collaboration_id);
                                    loadData();
                                  }
                                }}
                                className="text-red-650 font-bold hover:underline"
                              >
                                Remove
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Network Insights summary block */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-850 p-5 rounded-xl shadow-sm space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1">
                <Info className="w-4 h-4 text-navy-600" />
                Network Insights
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div className="p-3 bg-slate-50 dark:bg-slate-950/40 rounded-lg space-y-1">
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Top Network Hub</p>
                  <p className="font-bold text-slate-850 dark:text-slate-200">{networkInsights.topHubName}</p>
                  <p className="text-[10px] text-slate-500">Connected to {networkInsights.maxDegree} partners</p>
                </div>
                <div className="p-3 bg-slate-50 dark:bg-slate-950/40 rounded-lg space-y-1">
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Primary Research Domain</p>
                  <p className="font-bold text-slate-850 dark:text-slate-200">{networkInsights.topField}</p>
                  <p className="text-[10px] text-slate-500">Highest skill frequency in active web</p>
                </div>
              </div>
            </div>

          </div>

          {/* RIGHT COLUMN: SELECTED PROFILE & CALCULATIONS DETAILS */}
          <div className="lg:col-span-3 space-y-6">
            
            {/* Context Sidebar */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-850 p-5 rounded-xl shadow-sm min-h-[400px] flex flex-col justify-start">
              
              {selectedResId ? (
                // Selected Researcher view
                (() => {
                  const res = researchers.find(r => r.researcher_id === selectedResId)!;
                  const inst = institutions.find(i => i.institution_id === res.institution_id);
                  return (
                    <div className="space-y-4 animate-fade-in flex-1 flex flex-col justify-between">
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <h3 className="text-sm font-bold text-slate-850 dark:text-slate-100">{res.name}</h3>
                          <button onClick={() => setSelectedResId(null)} className="p-1 hover:bg-slate-100 rounded text-slate-400"><X className="w-4 h-4" /></button>
                        </div>
                        
                        <div className="space-y-1.5 text-xs text-slate-500">
                          <p className="flex items-center gap-1.5"><Landmark className="w-3.5 h-3.5 text-slate-400" /> {inst ? inst.name : 'Unknown Institution'}</p>
                          <p className="flex items-center gap-1.5"><Users className="w-3.5 h-3.5 text-slate-400" /> {res.department || 'Academic Department'}</p>
                          <p className="flex items-center gap-1.5 font-mono"><Info className="w-3.5 h-3.5 text-slate-400" /> ORCID: {res.orcid || 'N/A'}</p>
                        </div>

                        {/* Node centralities */}
                        <div className="p-3 bg-navy-50/20 dark:bg-navy-950/20 rounded-lg space-y-2 border border-navy-150/10">
                          <h5 className="text-[10px] font-bold text-navy-650 dark:text-navy-400 uppercase tracking-widest">Centrality Metrics</h5>
                          <div className="grid grid-cols-2 gap-2 text-xs">
                            <div>
                              <p className="text-[9px] text-slate-400">Degree centrality</p>
                              <p className="font-bold text-slate-850 dark:text-slate-150">{activeCentralities.degree}</p>
                            </div>
                            <div>
                              <p className="text-[9px] text-slate-400">Closeness index</p>
                              <p className="font-bold text-slate-850 dark:text-slate-150">{activeCentralities.closeness.toFixed(3)}</p>
                            </div>
                          </div>
                        </div>

                        {/* Publications brief */}
                        <div className="space-y-1">
                          <h5 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Active Output</h5>
                          {selectedLoading ? (
                            <p className="text-[10px] text-slate-400">Loading publications...</p>
                          ) : selectedPubs.length === 0 ? (
                            <p className="text-[10px] text-slate-450 italic">No publications logged.</p>
                          ) : (
                            <ul className="list-disc list-inside text-[11px] text-slate-600 dark:text-slate-350 space-y-1">
                              {selectedPubs.slice(0, 3).map(p => (
                                <li key={p.publication_id} className="truncate">
                                  <Link to={`/publications/${p.publication_id}`} className="hover:underline hover:text-navy-600">{p.title}</Link>
                                </li>
                              ))}
                              {selectedPubs.length > 3 && (
                                <li className="text-[10px] text-navy-600 dark:text-navy-450 font-bold">+ {selectedPubs.length - 3} more publications</li>
                              )}
                            </ul>
                          )}
                        </div>
                      </div>

                      <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
                        <Link 
                          to={`/researchers/${res.researcher_id}`}
                          className="w-full py-2 bg-navy-600 hover:bg-navy-700 text-white rounded-lg text-xs font-bold inline-flex items-center justify-center gap-1 shadow-sm"
                        >
                          View Full Profile
                        </Link>
                      </div>
                    </div>
                  );
                })()
              ) : selectedInstId ? (
                // Selected Institution view
                (() => {
                  const inst = institutions.find(i => i.institution_id === selectedInstId)!;
                  const affiliatedResearchers = researchers.filter(r => r.institution_id === selectedInstId);
                  return (
                    <div className="space-y-4 animate-fade-in flex-1 flex flex-col justify-between">
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <h3 className="text-sm font-bold text-slate-850 dark:text-slate-100">{inst.name}</h3>
                          <button onClick={() => setSelectedInstId(null)} className="p-1 hover:bg-slate-100 rounded text-slate-400"><X className="w-4 h-4" /></button>
                        </div>
                        
                        <div className="space-y-1.5 text-xs text-slate-500">
                          <p className="flex items-center gap-1.5"><Landmark className="w-3.5 h-3.5 text-slate-400" /> Type: {inst.type.replace('_', ' ')}</p>
                          <p className="flex items-center gap-1.5"><Info className="w-3.5 h-3.5 text-slate-400" /> Location: {inst.city}, {inst.country}</p>
                          {inst.website && (
                            <p className="flex items-center gap-1.5">
                              <Info className="w-3.5 h-3.5 text-slate-400" /> 
                              <a href={inst.website} target="_blank" rel="noreferrer" className="text-navy-600 hover:underline truncate max-w-[150px]">{inst.website}</a>
                            </p>
                          )}
                        </div>

                        {/* Affiliated researchers */}
                        <div className="space-y-1">
                          <h5 className="text-[10px] font-bold text-slate-450 uppercase tracking-widest">Affiliated Scholars ({affiliatedResearchers.length})</h5>
                          {affiliatedResearchers.length === 0 ? (
                            <p className="text-[10px] text-slate-450 italic">No researchers affiliated with this institution.</p>
                          ) : (
                            <ul className="list-disc list-inside text-[11px] text-slate-600 dark:text-slate-350 space-y-1">
                              {affiliatedResearchers.slice(0, 5).map(r => (
                                <li key={r.researcher_id} className="truncate">
                                  <Link to={`/researchers/${r.researcher_id}`} className="hover:underline hover:text-navy-600">{r.name}</Link>
                                </li>
                              ))}
                              {affiliatedResearchers.length > 5 && (
                                <li className="text-[10px] text-navy-600 dark:text-navy-450 font-bold">+ {affiliatedResearchers.length - 5} more scholars</li>
                              )}
                            </ul>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })()
              ) : (
                // Default empty state message
                <div className="text-center py-20 flex-1 flex flex-col items-center justify-center space-y-3">
                  <Info className="w-8 h-8 text-slate-300" />
                  <div className="space-y-1">
                    <p className="text-xs font-bold text-slate-500">No Node Selected</p>
                    <p className="text-[10px] text-slate-450 leading-relaxed max-w-[180px] mx-auto">
                      Click any researcher or institution node on the visual graph to inspect active centralities, details, and scholarly output.
                    </p>
                  </div>
                </div>
              )}

            </div>

          </div>

        </div>
      )}

      {/* ADD EDGE CONNECTION DIALOG */}
      {edgeDialogOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl overflow-hidden flex flex-col animate-scale-in">
            <div className="px-5 py-3.5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-950">
              <h3 className="font-bold text-xs uppercase tracking-wider text-slate-650 dark:text-slate-300">Add Collaboration Connection</h3>
              <button onClick={() => setEdgeDialogOpen(false)} className="p-1 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg"><X className="w-4 h-4" /></button>
            </div>
            
            <form onSubmit={handleAddEdge} className="p-5 space-y-4">
              {edgeError && (
                <div className="p-2.5 bg-red-50 dark:bg-red-950/20 text-red-650 dark:text-red-400 rounded-lg text-[10px] flex gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{edgeError}</span>
                </div>
              )}

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-450 uppercase tracking-widest block">First Collaborator</label>
                <select 
                  className="w-full px-3 py-2 border border-slate-200 dark:border-slate-800 bg-slate-55 dark:bg-slate-950 rounded-lg text-xs outline-none"
                  value={partnerId1}
                  onChange={e => setPartnerId1(Number(e.target.value))}
                  required
                >
                  <option value="">-- Choose Researcher --</option>
                  {researchers.map(r => (
                    <option key={r.researcher_id} value={r.researcher_id}>
                      {r.name} ({r.department || 'Research'})
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-450 uppercase tracking-widest block">Second Collaborator</label>
                <select 
                  className="w-full px-3 py-2 border border-slate-200 dark:border-slate-800 bg-slate-55 dark:bg-slate-950 rounded-lg text-xs outline-none"
                  value={partnerId2}
                  onChange={e => setPartnerId2(Number(e.target.value))}
                  required
                >
                  <option value="">-- Choose Researcher --</option>
                  {researchers.map(r => (
                    <option key={r.researcher_id} value={r.researcher_id}>
                      {r.name} ({r.department || 'Research'})
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-450 uppercase tracking-widest block">Collaboration Type</label>
                <select 
                  className="w-full px-3 py-2 border border-slate-200 dark:border-slate-800 bg-slate-55 dark:bg-slate-950 rounded-lg text-xs outline-none"
                  value={collabType}
                  onChange={e => setCollabType(e.target.value)}
                  required
                >
                  <option value="Joint Publication">Joint Publication</option>
                  <option value="Joint Project">Joint Project</option>
                  <option value="Co-author">Co-author</option>
                  <option value="Peer Review">Peer Review</option>
                </select>
              </div>

              <button 
                type="submit"
                className="w-full py-2 bg-navy-600 hover:bg-navy-700 text-white rounded-lg text-xs font-bold shadow-sm transition-colors mt-2"
              >
                Establish Link
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
