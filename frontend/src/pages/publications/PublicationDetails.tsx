import React, { useEffect, useState, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/Auth';
import { PublicationService } from '../../services/publicationService';
import { ResearcherService } from '../../services/researcherService';
import { CitationService } from '../../services/citationService';
import { ConferenceService } from '../../services/conferenceService';
import type { Publication, Researcher, Conference, Citation } from '../../types';
import { 
  ArrowLeft, Calendar, Landmark, FileText, Download, 
  UploadCloud, CheckCircle, Edit, Trash2, Link as LinkIcon, Plus, AlertCircle, Bookmark, X 
} from 'lucide-react';

export const PublicationDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { researcher: currentResearcher } = useAuth();

  // Primary states
  const [publication, setPublication] = useState<Publication | null>(null);
  const [authors, setAuthors] = useState<Researcher[]>([]);
  const [conference, setConference] = useState<Conference | null>(null);
  const [citationsReceived, setCitationsReceived] = useState<(Citation & { citingTitle: string; citingId: number })[]>([]);
  const [citationsMade, setCitationsMade] = useState<(Citation & { citedTitle: string; citedId: number })[]>([]);
  
  // All other papers list (for citing reference dialog)
  const [allPublications, setAllPublications] = useState<Publication[]>([]);
  
  // UI Interactions
  const [loading, setLoading] = useState(true);
  const [isAuthor, setIsAuthor] = useState(false);
  
  // File Upload states
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [uploadError, setUploadError] = useState('');

  // Cite Dialog State
  const [citeDialogOpen, setCiteDialogOpen] = useState(false);
  const [selectedCiteId, setSelectedCiteId] = useState<number | undefined>(undefined);
  const [citeError, setCiteError] = useState('');

  const loadDetails = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const pub = await PublicationService.getById(Number(id));
      setPublication(pub);

      // Check author permissions
      if (currentResearcher && pub.researcher_ids?.includes(currentResearcher.researcher_id)) {
        setIsAuthor(true);
      } else {
        setIsAuthor(false);
      }

      // Load authors profiles details
      const allRes = await ResearcherService.getAll();
      const linkedAuthors = allRes.filter(r => pub.researcher_ids?.includes(r.researcher_id));
      setAuthors(linkedAuthors);

      // Load conference if present
      if (pub.conference_id) {
        const conf = await ConferenceService.getById(pub.conference_id);
        setConference(conf);
      } else {
        setConference(null);
      }

      // Load citations received (who cited this paper)
      const received = await CitationService.getCitedBy(pub.publication_id);
      const allPubs = await PublicationService.getAll();
      setAllPublications(allPubs);

      const mappedReceived = received.map(c => {
        const citingPub = allPubs.find(p => p.publication_id === c.citing_publication_id);
        return {
          ...c,
          citingTitle: citingPub?.title || `Publication ID ${c.citing_publication_id}`,
          citingId: c.citing_publication_id
        };
      });
      setCitationsReceived(mappedReceived);

      // Load citations made (references this paper cited)
      const made = await CitationService.getByPublication(pub.publication_id);
      const mappedMade = made.map(c => {
        const citedPub = allPubs.find(p => p.publication_id === c.cited_publication_id);
        return {
          ...c,
          citedTitle: citedPub?.title || `Publication ID ${c.cited_publication_id}`,
          citedId: c.cited_publication_id
        };
      });
      setCitationsMade(mappedMade);

    } catch (err) {
      console.error("Failed to load publication details:", err);
    } finally {
      setLoading(false);
    }
  }, [id, currentResearcher]);

  useEffect(() => {
    loadDetails();
  }, [loadDetails]);

  const handleDelete = async () => {
    if (!window.confirm("Are you sure you want to delete this publication record?")) return;
    if (publication) {
      await PublicationService.delete(publication.publication_id);
      navigate("/publications");
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !publication) return;

    setUploading(true);
    setUploadProgress(0);
    setUploadSuccess(false);
    setUploadError('');

    // Simulate upload timer
    const interval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + 10;
      });
    }, 150);

    try {
      // Simulate file upload service call after progress is done
      await new Promise(resolve => setTimeout(resolve, 1600));
      await PublicationService.uploadFile(publication.publication_id, file);
      setUploadSuccess(true);
      // Reload details to show file
      loadDetails();
    } catch (err: any) {
      setUploadError(err.message || 'File upload failed.');
    } finally {
      setUploading(false);
    }
  };

  const handleAddCitation = async (e: React.FormEvent) => {
    e.preventDefault();
    setCiteError('');
    if (!selectedCiteId || !publication) return;

    try {
      await CitationService.create({
        citing_publication_id: publication.publication_id,
        cited_publication_ids: [selectedCiteId]
      });
      setCiteDialogOpen(false);
      setSelectedCiteId(undefined);
      loadDetails();
    } catch (err: any) {
      setCiteError(err.message || "Failed to create citation link.");
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <div className="w-10 h-10 border-4 border-navy-500 border-t-transparent rounded-full animate-spin"></div>
        <span className="text-slate-505 text-sm font-semibold">Loading publication metadata...</span>
      </div>
    );
  }

  if (!publication) {
    return (
      <div className="p-8 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-2xl text-center max-w-md mx-auto space-y-4">
        <h2 className="text-xl font-bold">Publication Not Found</h2>
        <p className="text-xs text-slate-500">The requested publication record does not exist or has been archived.</p>
        <Link to="/publications" className="inline-block text-xs font-semibold text-navy-600 hover:underline">Back to Directory</Link>
      </div>
    );
  }

  // Filter list of papers we can cite (can't cite itself or papers already cited)
  const existingCitedIds = citationsMade.map(c => c.citedId);
  const eligibleCitePapers = allPublications.filter(p => 
    p.publication_id !== publication.publication_id && 
    !existingCitedIds.includes(p.publication_id)
  );

  return (
    <div className="space-y-6">
      
      {/* Navigation Header */}
      <div className="flex items-center justify-between border-b border-slate-250/50 dark:border-slate-800/50 pb-4">
        <Link to="/publications" className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-700 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to Publications
        </Link>
        {isAuthor && (
          <div className="flex items-center gap-2">
            <Link 
              to={`/publications/${publication.publication_id}/edit`}
              className="px-3 py-1.5 border border-slate-200 dark:border-slate-850 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl text-xs font-semibold inline-flex items-center gap-1"
            >
              <Edit className="w-3.5 h-3.5" /> Edit Record
            </Link>
            <button 
              onClick={handleDelete}
              className="px-3 py-1.5 border border-slate-200 dark:border-slate-850 hover:bg-red-50 dark:hover:bg-red-950/20 text-red-650 rounded-xl text-xs font-semibold inline-flex items-center gap-1"
            >
              <Trash2 className="w-3.5 h-3.5" /> Delete
            </button>
          </div>
        )}
      </div>

      {/* Main Info Card */}
      <div className="p-6 lg:p-8 bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/60 rounded-2xl shadow-sm space-y-5">
        
        {/* Badges and metadata */}
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold uppercase tracking-wider bg-navy-50 dark:bg-navy-950/20 text-navy-600 dark:text-navy-450 px-2 py-0.5 rounded border border-navy-100/50 dark:border-navy-900/10">
            {publication.publication_type}
          </span>
          <span className="text-[10px] font-bold uppercase tracking-wider bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 px-2 py-0.5 rounded border border-emerald-100/50 dark:border-emerald-900/10">
            {publication.status}
          </span>
        </div>

        <h1 className="text-xl sm:text-2xl lg:text-3xl font-extrabold tracking-tight leading-snug">{publication.title}</h1>
        
        {/* Author Lists */}
        <div className="space-y-1.5">
          <h5 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Authors</h5>
          <div className="flex flex-wrap gap-x-2 gap-y-1 text-xs">
            {authors.map((a, idx) => (
              <span key={a.researcher_id} className="font-semibold text-slate-800 dark:text-slate-200">
                <Link to={`/researchers/${a.researcher_id}`} className="hover:text-navy-650 hover:underline">{a.name}</Link>
                {idx < authors.length - 1 || (publication.external_authors && publication.external_authors.length > 0) ? ',' : ''}
              </span>
            ))}
            {publication.external_authors?.map((ext, idx) => (
              <span key={ext} className="text-slate-500 italic">
                {ext}
                {idx < publication.external_authors!.length - 1 ? ',' : ''}
              </span>
            ))}
          </div>
        </div>

        {/* Core details grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 py-4 border-y border-slate-100 dark:border-slate-850 text-xs">
          <div className="flex items-center gap-2 text-slate-500">
            <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
            <span>Published: <span className="font-semibold text-slate-800 dark:text-slate-200">{publication.publication_date || 'N/A'}</span></span>
          </div>
          {publication.doi && (
            <div className="flex items-center gap-2 text-slate-500">
              <LinkIcon className="w-4 h-4 text-slate-400 shrink-0" />
              <span>DOI: <a href={`https://doi.org/${publication.doi}`} target="_blank" rel="noreferrer" className="font-semibold text-navy-500 hover:underline">{publication.doi}</a></span>
            </div>
          )}
          {conference && (
            <div className="flex items-center gap-2 text-slate-500">
              <Landmark className="w-4 h-4 text-slate-400 shrink-0" />
              <span className="truncate">Conference: <span className="font-semibold text-slate-855 dark:text-slate-200 truncate">{conference.name}</span></span>
            </div>
          )}
        </div>

        {/* Abstract */}
        <div className="space-y-2">
          <h5 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Abstract</h5>
          <p className="text-xs text-slate-650 dark:text-slate-400 leading-relaxed font-sans">{publication.abstract || 'No abstract abstract text provided.'}</p>
        </div>

      </div>

      {/* Grid: Left column (PDF Upload/download), Right column (Citations lists) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* PDF Attachment Column */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* File Card */}
          <div className="p-6 bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/60 rounded-2xl shadow-sm space-y-4">
            <h4 className="font-bold text-xs text-slate-400 uppercase tracking-widest border-b border-slate-100 dark:border-slate-850 pb-2">Full-Text Document</h4>
            
            {publication.file_path ? (
              <div className="space-y-3">
                <div className="p-3 bg-navy-50/50 dark:bg-navy-950/20 border border-navy-100/50 dark:border-navy-900/10 rounded-xl flex items-center gap-3">
                  <FileText className="w-8 h-8 text-navy-500 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-xs font-semibold truncate leading-none">Manuscript PDF</p>
                    <p className="text-[10px] text-slate-400 mt-1">Format: PDF/Docx</p>
                  </div>
                </div>
                <button 
                  onClick={() => alert(`[DEMO SYSTEM] Simulating download for manuscript: ${publication.file_path}`)}
                  className="w-full py-2 bg-navy-600 hover:bg-navy-500 text-white font-semibold rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-md shadow-navy-500/10 transition-all hover:scale-[1.01]"
                >
                  <Download className="w-3.5 h-3.5" /> Download Full Text
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-xs text-slate-500">No manuscript file uploaded yet.</p>
                
                {isAuthor ? (
                  <div className="space-y-3">
                    <div className="relative border-2 border-dashed border-slate-200 dark:border-slate-800 hover:border-navy-400 dark:hover:border-navy-500 rounded-xl p-4 flex flex-col items-center justify-center text-center cursor-pointer transition-colors">
                      <input 
                        type="file" 
                        accept=".pdf,.docx"
                        onChange={handleFileUpload}
                        disabled={uploading}
                        className="absolute inset-0 opacity-0 cursor-pointer"
                      />
                      <UploadCloud className="w-8 h-8 text-slate-400 mb-2" />
                      <span className="text-xs font-semibold text-slate-650">Select PDF or Word File</span>
                      <span className="text-[10px] text-slate-450 mt-1">Accepts .pdf, .docx (Max 10MB)</span>
                    </div>

                    {uploading && (
                      <div className="space-y-1.5">
                        <div className="flex justify-between text-[10px] text-slate-500">
                          <span>Uploading file...</span>
                          <span>{uploadProgress}%</span>
                        </div>
                        <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                          <div className="bg-navy-500 h-full transition-all duration-150" style={{ width: `${uploadProgress}%` }}></div>
                        </div>
                      </div>
                    )}

                    {uploadError && (
                      <div className="p-2.5 bg-red-50 text-red-650 rounded-xl text-[10px] flex items-start gap-1.5">
                        <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                        <span>{uploadError}</span>
                      </div>
                    )}

                    {uploadSuccess && (
                      <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl text-[10px] flex items-center gap-1.5">
                        <CheckCircle className="w-3.5 h-3.5 shrink-0" />
                        <span>Manuscript uploaded successfully!</span>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-[10px] text-slate-400 italic">Only primary co-authors can upload manuscript attachments.</p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Citations Column */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* References Card */}
          <div className="p-6 bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/60 rounded-2xl shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-850 pb-2">
              <h4 className="font-bold text-xs text-slate-400 uppercase tracking-widest">Bibliography References</h4>
              {isAuthor && (
                <button 
                  onClick={() => setCiteDialogOpen(true)}
                  className="inline-flex items-center gap-1 text-[10px] font-bold text-navy-600 dark:text-navy-400 hover:underline"
                >
                  <Plus className="w-3 h-3" /> Add Reference
                </button>
              )}
            </div>

            <div className="space-y-2">
              {citationsMade.length === 0 ? (
                <p className="text-xs text-slate-400 py-3">No bibliography references logged.</p>
              ) : (
                <div className="space-y-3">
                  {citationsMade.map((ref, idx) => (
                    <div key={ref.citation_id} className="flex gap-2 text-xs items-start">
                      <span className="font-mono text-slate-450 shrink-0">[{idx + 1}]</span>
                      <Link to={`/publications/${ref.citedId}`} className="hover:text-navy-650 hover:underline font-semibold leading-snug">{ref.citedTitle}</Link>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Cited By Card */}
          <div className="p-6 bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/60 rounded-2xl shadow-sm space-y-4">
            <h4 className="font-bold text-xs text-slate-400 uppercase tracking-widest border-b border-slate-100 dark:border-slate-850 pb-2">Cited By</h4>
            
            <div className="space-y-3">
              {citationsReceived.length === 0 ? (
                <p className="text-xs text-slate-400 py-3">This publication has not been cited yet.</p>
              ) : (
                citationsReceived.map(c => (
                  <div key={c.citation_id} className="flex items-start gap-2.5 text-xs">
                    <Bookmark className="w-4 h-4 text-navy-500 shrink-0 mt-0.5" />
                    <Link to={`/publications/${c.citingId}`} className="hover:text-navy-650 hover:underline font-medium leading-relaxed">{c.citingTitle}</Link>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>

      </div>

      {/* CITE REFERENCE MODAL */}
      {citeDialogOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col animate-scale-in">
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-950">
              <h3 className="font-bold text-sm">Add Bibliography Citation</h3>
              <button onClick={() => setCiteDialogOpen(false)} className="p-1 hover:bg-slate-200 rounded-lg"><X className="w-5 h-5" /></button>
            </div>
            
            <form onSubmit={handleAddCitation} className="p-6 space-y-4">
              {citeError && (
                <div className="p-2.5 bg-red-50 text-red-650 rounded-xl text-xs flex gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{citeError}</span>
                </div>
              )}

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-600 block">Select Cited Paper</label>
                <select 
                  className="w-full px-4 py-2.5 border border-slate-200 bg-slate-50 rounded-xl text-xs focus:outline-none"
                  value={selectedCiteId}
                  onChange={e => setSelectedCiteId(Number(e.target.value))}
                  required
                >
                  <option value="">-- Choose Publication --</option>
                  {eligibleCitePapers.map(p => (
                    <option key={p.publication_id} value={p.publication_id}>
                      {p.title}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex gap-2 justify-end pt-4 border-t border-slate-100">
                <button 
                  type="button" 
                  onClick={() => setCiteDialogOpen(false)}
                  className="px-4 py-2 border border-slate-200 bg-white rounded-xl text-xs font-semibold text-slate-500 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={!selectedCiteId}
                  className="px-4 py-2 bg-navy-600 hover:bg-navy-500 disabled:opacity-50 text-white rounded-xl text-xs font-semibold"
                >
                  Cite Paper
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
