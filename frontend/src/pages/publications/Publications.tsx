import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/Auth';
import { PublicationService } from '../../services/publicationService';
import { ResearcherService } from '../../services/researcherService';
import { CitationService } from '../../services/citationService';
import type { Publication, Researcher } from '../../types';
import { PublicationType, PublicationStatus } from '../../types';
import { 
  Search, BookOpen, Plus, FileText, Calendar, Link as LinkIcon, 
  Trash2, Edit, Award
} from 'lucide-react';

export const Publications: React.FC = () => {
  const { researcher: currentResearcher } = useAuth();

  const [publications, setPublications] = useState<Publication[]>([]);
  const [researchers, setResearchers] = useState<Researcher[]>([]);
  const [citationCounts, setCitationCounts] = useState<Record<number, number>>({});
  
  // Tabs & Search
  const [activeTab, setActiveTab] = useState<'all' | 'my'>('all');
  const [query, setQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadPublications = async () => {
      setLoading(true);
      try {
        const pubs = await PublicationService.getAll();
        setPublications(pubs);

        const res = await ResearcherService.getAll();
        setResearchers(res);

        // Load citation counts for each publication
        const counts: Record<number, number> = {};
        for (const p of pubs) {
          const cit = await CitationService.getCitedBy(p.publication_id);
          counts[p.publication_id] = cit.length;
        }
        setCitationCounts(counts);

      } catch (err) {
        console.error("Failed to load publications:", err);
      } finally {
        setLoading(false);
      }
    };
    loadPublications();
  }, [currentResearcher]);

  const handleDelete = async (pubId: number) => {
    if (!window.confirm("Are you sure you want to delete this publication? This action is permanent.")) return;
    try {
      await PublicationService.delete(pubId);
      setPublications(prev => prev.filter(p => p.publication_id !== pubId));
    } catch (err: any) {
      alert(err.message || "Failed to delete publication.");
    }
  };

  // Filter logic
  const filteredPubs = publications.filter(p => {
    // Tab filter
    if (activeTab === 'my') {
      if (!currentResearcher) return false;
      if (!p.researcher_ids?.includes(currentResearcher.researcher_id)) return false;
    }

    // Query filter
    const matchesQuery = p.title.toLowerCase().includes(query.toLowerCase()) ||
      (p.abstract && p.abstract.toLowerCase().includes(query.toLowerCase())) ||
      (p.doi && p.doi.toLowerCase().includes(query.toLowerCase()));

    // Type filter
    const matchesType = typeFilter === 'all' || p.publication_type === typeFilter;

    // Status filter
    const matchesStatus = statusFilter === 'all' || p.status === statusFilter;

    return matchesQuery && matchesType && matchesStatus;
  });

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Publications Directory</h1>
          <p className="text-slate-500 text-sm">Explore journal articles, books, patents, and conference proceedings.</p>
        </div>
        {currentResearcher && (
          <Link 
            to="/publications/new"
            className="px-4 py-2 bg-navy-600 hover:bg-navy-500 text-white rounded-xl text-sm font-semibold flex items-center gap-2 shadow-md shadow-navy-500/10 transition-all hover:scale-[1.02]"
          >
            <Plus className="w-4 h-4" /> Add Publication
          </Link>
        )}
      </div>

      {/* Tabs list (My vs All) */}
      {currentResearcher && (
        <div className="flex border-b border-slate-200 dark:border-slate-800">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-5 py-3 text-xs font-semibold border-b-2 transition-all ${
              activeTab === 'all' 
                ? 'border-navy-600 text-navy-600 dark:text-navy-400 font-bold' 
                : 'border-transparent text-slate-550 hover:text-slate-700'
            }`}
          >
            All Scholarly Works
          </button>
          <button
            onClick={() => setActiveTab('my')}
            className={`px-5 py-3 text-xs font-semibold border-b-2 transition-all ${
              activeTab === 'my' 
                ? 'border-navy-600 text-navy-600 dark:text-navy-400 font-bold' 
                : 'border-transparent text-slate-550 hover:text-slate-700'
            }`}
          >
            My Authored Papers
          </button>
        </div>
      )}

      {/* Filter and Search */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 border border-slate-200/60 dark:border-slate-800/60 bg-white dark:bg-slate-900 p-4 rounded-2xl shadow-sm">
        
        {/* Search */}
        <div className="sm:col-span-2 relative">
          <input 
            type="text"
            placeholder="Search by publication title, abstract, or DOI..."
            className="w-full pl-10 pr-4 py-2 border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 rounded-xl text-xs focus:border-navy-500 focus:outline-none transition-colors"
            value={query}
            onChange={e => setQuery(e.target.value)}
          />
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        </div>

        {/* Type Select */}
        <div className="relative">
          <select 
            className="w-full px-4 py-2 border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 rounded-xl text-xs focus:border-navy-500 focus:outline-none appearance-none transition-colors"
            value={typeFilter}
            onChange={e => setTypeFilter(e.target.value)}
          >
            <option value="all">All Types</option>
            <option value={PublicationType.JOURNAL}>Journals</option>
            <option value={PublicationType.CONFERENCE}>Conferences</option>
            <option value={PublicationType.BOOK}>Books</option>
            <option value={PublicationType.PATENT}>Patents</option>
            <option value={PublicationType.REPORT}>Reports</option>
          </select>
          <BookOpen className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
        </div>

        {/* Status Select */}
        <div className="relative">
          <select 
            className="w-full px-4 py-2 border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 rounded-xl text-xs focus:border-navy-500 focus:outline-none appearance-none transition-colors"
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
          >
            <option value="all">All Statuses</option>
            <option value={PublicationStatus.DRAFT}>Draft</option>
            <option value={PublicationStatus.SUBMITTED}>Submitted</option>
            <option value={PublicationStatus.PUBLISHED}>Published</option>
            <option value={PublicationStatus.ARCHIVED}>Archived</option>
          </select>
          <FileText className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
        </div>

      </div>

      {/* Content List */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <div className="w-10 h-10 border-4 border-navy-500 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-slate-500 text-sm font-semibold">Retrieving publications list...</span>
        </div>
      ) : filteredPubs.length === 0 ? (
        <div className="p-8 text-center text-xs text-slate-400 border border-slate-200 bg-white dark:bg-slate-900 rounded-2xl shadow-sm space-y-2">
          <p>No publications found matching current criteria.</p>
          {activeTab === 'my' && (
            <Link to="/publications/new" className="text-navy-500 hover:underline block font-semibold">Log your first authored paper &rarr;</Link>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredPubs.map(pub => {
            // Find internal authors
            const authorsList = researchers.filter(r => pub.researcher_ids?.includes(r.researcher_id));
            const authorsNames = [
              ...authorsList.map(a => a.name),
              ...(pub.external_authors || [])
            ].join(', ');

            const isAuthor = currentResearcher && pub.researcher_ids?.includes(currentResearcher.researcher_id);

            return (
              <div 
                key={pub.publication_id} 
                className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/60 p-6 rounded-2xl shadow-sm hover:border-slate-350 dark:hover:border-slate-700 transition-all flex flex-col md:flex-row md:items-center justify-between gap-6"
              >
                <div className="space-y-2.5 min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                      pub.publication_type === PublicationType.JOURNAL 
                        ? 'bg-navy-50 dark:bg-navy-950/20 text-navy-600' 
                        : pub.publication_type === PublicationType.CONFERENCE
                        ? 'bg-indigo-50 dark:bg-indigo-950/20 text-indigo-650'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                    }`}>
                      {pub.publication_type}
                    </span>
                    <span className={`text-[9px] font-semibold px-2 py-0.5 rounded capitalize ${
                      pub.status === PublicationStatus.PUBLISHED 
                        ? 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600' 
                        : pub.status === PublicationStatus.SUBMITTED
                        ? 'bg-amber-50 dark:bg-amber-950/20 text-amber-600'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
                    }`}>
                      {pub.status}
                    </span>
                  </div>

                  <Link 
                    to={`/publications/${pub.publication_id}`}
                    className="block text-base font-bold text-slate-855 dark:text-slate-100 hover:text-navy-650 hover:underline line-clamp-1 leading-snug"
                  >
                    {pub.title}
                  </Link>

                  <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">{pub.abstract || 'No abstract abstract text provided.'}</p>
                  
                  <div className="text-[10px] text-slate-400 font-semibold truncate leading-none mt-1">
                    Authors: <span className="text-slate-600 dark:text-slate-350">{authorsNames || 'Unknown'}</span>
                  </div>

                  <div className="flex flex-wrap items-center gap-3 pt-1 text-[10px] text-slate-400">
                    <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> Date: {pub.publication_date || 'N/A'}</span>
                    {pub.doi && (
                      <span className="flex items-center gap-1"><LinkIcon className="w-3.5 h-3.5" /> DOI: {pub.doi}</span>
                    )}
                    <span className="flex items-center gap-1 font-semibold text-emerald-600"><Award className="w-3.5 h-3.5" /> Citations: {citationCounts[pub.publication_id] || 0}</span>
                  </div>
                </div>

                {/* Actions Panel */}
                <div className="flex items-center gap-3 shrink-0 self-start md:self-center pt-3 md:pt-0 border-t md:border-0 border-slate-100 dark:border-slate-850 w-full md:w-auto justify-end">
                  {isAuthor && (
                    <>
                      <Link 
                        to={`/publications/${pub.publication_id}/edit`}
                        className="p-2 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg text-slate-500 hover:text-slate-700"
                        title="Edit Details"
                      >
                        <Edit className="w-4 h-4" />
                      </Link>
                      <button 
                        onClick={() => handleDelete(pub.publication_id)}
                        className="p-2 border border-slate-200 dark:border-slate-800 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-lg text-slate-500 hover:text-red-650"
                        title="Delete Record"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </>
                  )}
                  <Link 
                    to={`/publications/${pub.publication_id}`}
                    className="px-4 py-2 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 dark:hover:bg-slate-850 rounded-xl text-xs font-semibold shadow-sm"
                  >
                    View Details
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
