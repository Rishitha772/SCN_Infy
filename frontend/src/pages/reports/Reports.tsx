import React, { useEffect, useState } from 'react';
import { ReportService } from '../../services/reportService';
import { ResearcherService } from '../../services/researcherService';
import { AdminService } from '../../services/adminService';
import { PublicationService } from '../../services/publicationService';
import { CollaborationService } from '../../services/collaborationService';
import type { Researcher, Institution, Publication, Collaboration } from '../../types';
import { FileSpreadsheet, FileJson, Play, Filter, BookOpen, GitFork } from 'lucide-react';

export const Reports: React.FC = () => {
  // Filters State
  const [reportType, setReportType] = useState<'pubs' | 'collabs'>('pubs');
  const [researcherId, setResearcherId] = useState<number | undefined>(undefined);
  const [institutionId, setInstitutionId] = useState<number | undefined>(undefined);
  const [pubType, setPubType] = useState<string>('all');
  const [status, setStatus] = useState<string>('all');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  // Collections state
  const [researchers, setResearchers] = useState<Researcher[]>([]);
  const [institutions, setInstitutions] = useState<Institution[]>([]);
  
  // Preview State
  const [previewPubs, setPreviewPubs] = useState<Publication[]>([]);
  const [previewCollabs, setPreviewCollabs] = useState<(Collaboration & { r1Name: string; r2Name: string })[]>([]);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [hasPreviewed, setHasPreviewed] = useState(false);

  useEffect(() => {
    Promise.all([
      ResearcherService.getAll(),
      AdminService.getAllInstitutions()
    ]).then(([res, inst]) => {
      setResearchers(res);
      setInstitutions(inst);
    });
  }, []);

  const handlePreview = async () => {
    setPreviewLoading(true);
    setHasPreviewed(true);
    
    try {
      if (reportType === 'pubs') {
        const pubs = await PublicationService.getAll();
        const filtered = pubs.filter(p => {
          if (researcherId && !p.researcher_ids?.includes(researcherId)) return false;
          // Filter by institution (requires looking up researchers)
          if (institutionId) {
            const authorProfiles = researchers.filter(r => p.researcher_ids?.includes(r.researcher_id));
            const matchesInst = authorProfiles.some(r => r.institution_id === institutionId);
            if (!matchesInst) return false;
          }
          if (pubType !== 'all' && p.publication_type !== pubType) return false;
          if (status !== 'all' && p.status !== status) return false;
          if (fromDate && p.publication_date && new Date(p.publication_date) < new Date(fromDate)) return false;
          if (toDate && p.publication_date && new Date(p.publication_date) > new Date(toDate)) return false;
          return true;
        });
        setPreviewPubs(filtered.slice(0, 5));
      } else {
        const collabs = await CollaborationService.getAll();
        const filtered = collabs.filter(c => {
          if (researcherId && !c.researcher_ids.includes(researcherId)) return false;
          if (institutionId) {
            const resProfiles = researchers.filter(r => c.researcher_ids.includes(r.researcher_id));
            const matchesInst = resProfiles.some(r => r.institution_id === institutionId);
            if (!matchesInst) return false;
          }
          if (fromDate && new Date(c.created_at) < new Date(fromDate)) return false;
          if (toDate && new Date(c.created_at) > new Date(toDate)) return false;
          return true;
        });

        // Map researcher names
        const mapped = filtered.slice(0, 5).map(c => {
          const r1 = researchers.find(r => r.researcher_id === c.researcher_ids[0])?.name || `ID ${c.researcher_ids[0]}`;
          const r2 = researchers.find(r => r.researcher_id === c.researcher_ids[1])?.name || `ID ${c.researcher_ids[1]}`;
          return {
            ...c,
            r1Name: r1,
            r2Name: r2
          };
        });
        setPreviewCollabs(mapped);
      }
    } catch (err) {
      console.error("Preview failed:", err);
    } finally {
      setPreviewLoading(false);
    }
  };

  const handleExportCSV = async () => {
    try {
      if (reportType === 'pubs') {
        await ReportService.publicationReportCsv({
          researcher_id: researcherId,
          institution_id: institutionId,
          publication_type: pubType !== 'all' ? pubType as any : undefined,
          status: status !== 'all' ? status as any : undefined,
          from_date: fromDate || undefined,
          to_date: toDate || undefined
        });
      } else {
        await ReportService.collaborationReportCsv({
          researcher_id: researcherId,
          institution_id: institutionId,
          from_date: fromDate || undefined,
          to_date: toDate || undefined
        });
      }
    } catch {
      alert("Failed to export CSV report.");
    }
  };

  const handleExportJSON = async () => {
    if (reportType !== 'pubs') return;
    try {
      await ReportService.publicationReportJson({
        researcher_id: researcherId,
        institution_id: institutionId,
        publication_type: pubType !== 'all' ? pubType as any : undefined,
        status: status !== 'all' ? status as any : undefined,
        from_date: fromDate || undefined,
        to_date: toDate || undefined
      });
    } catch {
      alert("Failed to export JSON report.");
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Research Reports</h1>
        <p className="text-slate-500 text-sm">Export filtered datasets on publication statuses, timelines, and academic collaborations.</p>
      </div>

      {/* Grid: Left Filters, Right Operations */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Filters Panel */}
        <div className="lg:col-span-8 p-6 bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/60 rounded-2xl shadow-sm space-y-5">
          <h3 className="font-bold text-sm flex items-center gap-1.5"><Filter className="w-4.5 h-4.5 text-navy-600" /> Filter Criteria</h3>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            {/* Report Type */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-655 dark:text-slate-400">Report Focus *</label>
              <div className="flex gap-2 pt-0.5">
                <button
                  type="button"
                  onClick={() => { setReportType('pubs'); setHasPreviewed(false); }}
                  className={`flex-1 py-2 px-3 border rounded-xl text-xs font-semibold flex items-center justify-center gap-1 transition-all ${
                    reportType === 'pubs' 
                      ? 'border-navy-600 bg-navy-50 dark:bg-navy-950/20 text-navy-650 dark:text-navy-455' 
                      : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-500 hover:bg-slate-50'
                  }`}
                >
                  <BookOpen className="w-3.5 h-3.5" /> Publications
                </button>
                <button
                  type="button"
                  onClick={() => { setReportType('collabs'); setHasPreviewed(false); }}
                  className={`flex-1 py-2 px-3 border rounded-xl text-xs font-semibold flex items-center justify-center gap-1 transition-all ${
                    reportType === 'collabs' 
                      ? 'border-navy-600 bg-navy-50 dark:bg-navy-950/20 text-navy-650 dark:text-navy-455' 
                      : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-500 hover:bg-slate-50'
                  }`}
                >
                  <GitFork className="w-3.5 h-3.5" /> Collaborations
                </button>
              </div>
            </div>

            {/* Researcher */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-655 dark:text-slate-400">Target Researcher</label>
              <select
                className="w-full px-3 py-2 border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 rounded-xl text-xs focus:outline-none"
                value={researcherId || ''}
                onChange={e => setResearcherId(e.target.value ? Number(e.target.value) : undefined)}
              >
                <option value="">-- All Researchers --</option>
                {researchers.map(r => (
                  <option key={r.researcher_id} value={r.researcher_id}>{r.name}</option>
                ))}
              </select>
            </div>

            {/* Institution */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-655 dark:text-slate-400">Institutional Filter</label>
              <select
                className="w-full px-3 py-2 border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 rounded-xl text-xs focus:outline-none"
                value={institutionId || ''}
                onChange={e => setInstitutionId(e.target.value ? Number(e.target.value) : undefined)}
              >
                <option value="">-- All Institutions --</option>
                {institutions.map(i => (
                  <option key={i.institution_id} value={i.institution_id}>{i.name}</option>
                ))}
              </select>
            </div>

            {/* Date timeline */}
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-655 dark:text-slate-400">From Date</label>
                <input 
                  type="date"
                  className="w-full px-3 py-1.5 border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 rounded-xl text-xs focus:outline-none"
                  value={fromDate}
                  onChange={e => setFromDate(e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-655 dark:text-slate-400">To Date</label>
                <input 
                  type="date"
                  className="w-full px-3 py-1.5 border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 rounded-xl text-xs focus:outline-none"
                  value={toDate}
                  onChange={e => setToDate(e.target.value)}
                />
              </div>
            </div>

          </div>

          {/* Conditional filters for Publication report */}
          {reportType === 'pubs' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-100 dark:border-slate-850">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-655 dark:text-slate-400">Publication Type</label>
                <select
                  className="w-full px-3 py-2 border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 rounded-xl text-xs focus:outline-none"
                  value={pubType}
                  onChange={e => setPubType(e.target.value)}
                >
                  <option value="all">All Types</option>
                  <option value="journal">Journal Articles</option>
                  <option value="conference">Conferences</option>
                  <option value="book">Books</option>
                  <option value="patent">Patents</option>
                  <option value="report">Reports</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-655 dark:text-slate-400">Status</label>
                <select
                  className="w-full px-3 py-2 border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 rounded-xl text-xs focus:outline-none"
                  value={status}
                  onChange={e => setStatus(e.target.value)}
                >
                  <option value="all">All Statuses</option>
                  <option value="draft">Draft</option>
                  <option value="submitted">Submitted</option>
                  <option value="published">Published</option>
                  <option value="archived">Archived</option>
                </select>
              </div>
            </div>
          )}

        </div>

        {/* Action Panel */}
        <div className="lg:col-span-4 p-6 bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/60 rounded-2xl shadow-sm flex flex-col justify-between space-y-4">
          <h3 className="font-bold text-sm">Export Actions</h3>
          
          <div className="space-y-3 flex-1 flex flex-col justify-center">
            {/* Preview Button */}
            <button 
              onClick={handlePreview}
              className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-750 dark:text-slate-200 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
            >
              <Play className="w-3.5 h-3.5 text-slate-500" /> Preview Data List
            </button>

            {/* CSV export */}
            <button 
              onClick={handleExportCSV}
              className="w-full py-2.5 bg-navy-600 hover:bg-navy-500 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 shadow-md shadow-navy-500/10 transition-all hover:scale-[1.01]"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" /> Export CSV Report
            </button>

            {/* JSON export (conditional) */}
            {reportType === 'pubs' && (
              <button 
                onClick={handleExportJSON}
                className="w-full py-2.5 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-850 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
              >
                <FileJson className="w-3.5 h-3.5 text-navy-500" /> Export JSON Format
              </button>
            )}
          </div>
          
          <p className="text-[10px] text-slate-450 leading-normal border-t border-slate-100 dark:border-slate-850 pt-3">
            * Generated files will follow strictly the formats of SCN database schemas. Downloads trigger immediately in the browser.
          </p>
        </div>

      </div>

      {/* PREVIEW CONTAINER */}
      {hasPreviewed && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/60 rounded-2xl shadow-sm overflow-hidden flex flex-col">
          <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-850">
            <h4 className="font-bold text-sm">Report Preview (Showing top 5 matches)</h4>
          </div>

          <div className="p-6">
            {previewLoading ? (
              <div className="text-center py-6 text-xs text-slate-400">Loading Preview...</div>
            ) : reportType === 'pubs' ? (
              
              // Publication Report Preview
              previewPubs.length === 0 ? (
                <div className="text-center text-xs text-slate-400 py-6">No publications matched your search criteria.</div>
              ) : (
                <table className="w-full text-left text-xs divide-y divide-slate-150 dark:divide-slate-800">
                  <thead>
                    <tr className="text-slate-450 font-semibold pb-2">
                      <th className="py-2">Publication ID</th>
                      <th className="py-2">Title</th>
                      <th className="py-2">Type</th>
                      <th className="py-2">Status</th>
                      <th className="py-2">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-850">
                    {previewPubs.map(p => (
                      <tr key={p.publication_id}>
                        <td className="py-3 font-mono text-[10px] text-slate-400">SCN-PUB-{p.publication_id}</td>
                        <td className="py-3 font-semibold max-w-[250px] truncate pr-4">{p.title}</td>
                        <td className="py-3 capitalize text-slate-500">{p.publication_type}</td>
                        <td className="py-3 capitalize text-slate-500">{p.status}</td>
                        <td className="py-3 text-slate-450">{p.publication_date || 'N/A'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )
            ) : (
              
              // Collaboration Report Preview
              previewCollabs.length === 0 ? (
                <div className="text-center text-xs text-slate-400 py-6">No collaborations matched your search criteria.</div>
              ) : (
                <table className="w-full text-left text-xs divide-y divide-slate-150 dark:divide-slate-800">
                  <thead>
                    <tr className="text-slate-450 font-semibold pb-2">
                      <th className="py-2">Collaboration ID</th>
                      <th className="py-2">Researcher A</th>
                      <th className="py-2">Researcher B</th>
                      <th className="py-2">Connection Type</th>
                      <th className="py-2 text-center">Weight</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-850">
                    {previewCollabs.map(c => (
                      <tr key={c.collaboration_id}>
                        <td className="py-3 font-mono text-[10px] text-slate-400">SCN-EDGE-{c.collaboration_id}</td>
                        <td className="py-3 font-semibold">{c.r1Name}</td>
                        <td className="py-3 font-semibold">{c.r2Name}</td>
                        <td className="py-3 text-slate-500 capitalize">{c.collaboration_type}</td>
                        <td className="py-3 text-center font-bold text-navy-600 dark:text-navy-450">{c.collaboration_count}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )
            )}
          </div>
        </div>
      )}

    </div>
  );
};
