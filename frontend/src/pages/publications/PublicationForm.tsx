import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { PublicationService } from '../../services/publicationService';
import { ResearcherService } from '../../services/researcherService';
import { ConferenceService } from '../../services/conferenceService';
import { useAuth } from '../../contexts/Auth';
import type { Researcher, Conference } from '../../types';
import { PublicationType, PublicationStatus } from '../../types';
import { ArrowLeft, Save, Plus, Trash2, Users, AlertCircle } from 'lucide-react';

export const PublicationForm: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { researcher: currentResearcher } = useAuth();

  const isEditMode = !!id;

  // Form Field States
  const [title, setTitle] = useState('');
  const [abstract, setAbstract] = useState('');
  const [pubType, setPubType] = useState<PublicationType>(PublicationType.JOURNAL);
  const [status, setStatus] = useState<PublicationStatus>(PublicationStatus.DRAFT);
  const [pubDate, setPubDate] = useState('');
  const [doi, setDoi] = useState('');
  const [conferenceId, setConferenceId] = useState<number | undefined>(undefined);
  const [selectedResearcherIds, setSelectedResearcherIds] = useState<number[]>([]);
  const [externalAuthors, setExternalAuthors] = useState<string[]>([]);
  const [newExtAuthor, setNewExtAuthor] = useState('');

  // Collections state
  const [researchers, setResearchers] = useState<Researcher[]>([]);
  const [conferences, setConferences] = useState<Conference[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadCollectionsAndForm = async () => {
      setLoading(true);
      try {
        // Fetch researchers and conferences
        const resList = await ResearcherService.getAll();
        setResearchers(resList);
        
        const confList = await ConferenceService.getAll();
        setConferences(confList);

        if (isEditMode) {
          const pub = await PublicationService.getById(Number(id));
          
          // Verify editing permissions (must be a co-author)
          if (currentResearcher && !pub.researcher_ids?.includes(currentResearcher.researcher_id)) {
            navigate("/publications", { replace: true });
            return;
          }

          setTitle(pub.title);
          setAbstract(pub.abstract || '');
          setPubType(pub.publication_type);
          setStatus(pub.status);
          setPubDate(pub.publication_date || '');
          setDoi(pub.doi || '');
          setConferenceId(pub.conference_id || undefined);
          setSelectedResearcherIds(pub.researcher_ids || []);
          setExternalAuthors(pub.external_authors || []);
        } else {
          // Add mode: default researcher is the logged in user
          if (currentResearcher) {
            setSelectedResearcherIds([currentResearcher.researcher_id]);
          }
        }
      } catch (err) {
        console.error("Failed to load form details:", err);
      } finally {
        setLoading(false);
      }
    };

    loadCollectionsAndForm();
  }, [id, isEditMode, currentResearcher, navigate]);

  const handleCheckboxChange = (resId: number) => {
    setSelectedResearcherIds(prev => {
      if (prev.includes(resId)) {
        // Don't let current researcher remove themselves in add mode
        if (!isEditMode && currentResearcher && resId === currentResearcher.researcher_id) {
          return prev;
        }
        return prev.filter(id => id !== resId);
      } else {
        return [...prev, resId];
      }
    });
  };

  const handleAddExternalAuthor = () => {
    if (newExtAuthor.trim() && !externalAuthors.includes(newExtAuthor.trim())) {
      setExternalAuthors([...externalAuthors, newExtAuthor.trim()]);
      setNewExtAuthor('');
    }
  };

  const handleRemoveExternalAuthor = (name: string) => {
    setExternalAuthors(externalAuthors.filter(n => n !== name));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (title.length < 5) {
      setError("Title must be at least 5 characters long.");
      return;
    }

    setLoading(true);
    try {
      if (isEditMode) {
        await PublicationService.update(Number(id), {
          title,
          abstract: abstract.trim() || null,
          doi: doi.trim() || null,
          publication_type: pubType,
          status,
          publication_date: pubDate || null,
          conference_id: conferenceId || null,
          researcher_ids: selectedResearcherIds,
          external_authors: externalAuthors
        });
        navigate(`/publications/${id}`);
      } else {
        await PublicationService.create({
          title,
          abstract: abstract.trim() || null,
          doi: doi.trim() || null,
          publication_type: pubType,
          status,
          publication_date: pubDate || null,
          conference_id: conferenceId || null,
          researcher_ids: selectedResearcherIds,
          external_authors: externalAuthors
        });
        navigate("/publications");
      }
    } catch (err: any) {
      setError(err.message || "Failed to save publication.");
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <div className="w-10 h-10 border-4 border-navy-500 border-t-transparent rounded-full animate-spin"></div>
        <span className="text-slate-500 text-sm font-semibold">Preparing publication editor form...</span>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      
      {/* Back Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-200/50 dark:border-slate-800/50">
        <Link 
          to={isEditMode ? `/publications/${id}` : "/publications"} 
          className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-700 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Cancel
        </Link>
        <h2 className="text-lg font-bold">{isEditMode ? 'Edit Publication Details' : 'Register New Publication'}</h2>
      </div>

      <div className="bg-white dark:bg-slate-900 border border-slate-200/65 dark:border-slate-800/65 rounded-2xl p-6 lg:p-8 shadow-sm">
        
        {error && (
          <div className="p-3.5 bg-red-50 text-red-650 rounded-xl text-xs flex gap-2 mb-6">
            <AlertCircle className="w-4.5 h-4.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* Title */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-655 dark:text-slate-400">Publication Title *</label>
            <input 
              type="text" 
              required
              placeholder="e.g. Analyzing Scientific Collaborations via Agentic Graph Architectures"
              className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-850 bg-slate-50 dark:bg-slate-950 rounded-xl text-sm focus:border-navy-500 focus:outline-none transition-colors"
              value={title}
              onChange={e => setTitle(e.target.value)}
            />
          </div>

          {/* Abstract */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-655 dark:text-slate-400">Abstract</label>
            <textarea 
              rows={4}
              placeholder="Paste abstract metadata or overview here..."
              className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-850 bg-slate-50 dark:bg-slate-950 rounded-xl text-sm focus:border-navy-500 focus:outline-none transition-colors"
              value={abstract}
              onChange={e => setAbstract(e.target.value)}
            />
          </div>

          {/* Type, Status, Date grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            
            {/* Type */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-655 dark:text-slate-400">Publication Type *</label>
              <select
                className="w-full px-3 py-2 border border-slate-200 dark:border-slate-850 bg-slate-50 dark:bg-slate-950 rounded-xl text-xs focus:border-navy-500 focus:outline-none"
                value={pubType}
                onChange={e => setPubType(e.target.value as any)}
              >
                <option value={PublicationType.JOURNAL}>Journal Article</option>
                <option value={PublicationType.CONFERENCE}>Conference Proceeding</option>
                <option value={PublicationType.BOOK}>Book Chapter</option>
                <option value={PublicationType.PATENT}>Patent</option>
                <option value={PublicationType.REPORT}>Technical Report</option>
              </select>
            </div>

            {/* Status */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-655 dark:text-slate-400">Status *</label>
              <select
                className="w-full px-3 py-2 border border-slate-200 dark:border-slate-850 bg-slate-50 dark:bg-slate-950 rounded-xl text-xs focus:border-navy-500 focus:outline-none"
                value={status}
                onChange={e => setStatus(e.target.value as any)}
              >
                <option value={PublicationStatus.DRAFT}>Draft</option>
                <option value={PublicationStatus.SUBMITTED}>Submitted</option>
                <option value={PublicationStatus.PUBLISHED}>Published</option>
                <option value={PublicationStatus.ARCHIVED}>Archived</option>
              </select>
            </div>

            {/* Date */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-655 dark:text-slate-400">Publication Date</label>
              <input 
                type="date"
                className="w-full px-3 py-2 border border-slate-200 dark:border-slate-850 bg-slate-50 dark:bg-slate-950 rounded-xl text-xs focus:border-navy-500 focus:outline-none"
                value={pubDate}
                onChange={e => setPubDate(e.target.value)}
              />
            </div>

          </div>

          {/* DOI, Conference */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            {/* DOI */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-655 dark:text-slate-400">DOI Identifier</label>
              <input 
                type="text" 
                placeholder="e.g. 10.1145/3318464.3389700"
                className="w-full px-4 py-2 border border-slate-200 dark:border-slate-850 bg-slate-50 dark:bg-slate-950 rounded-xl text-xs focus:border-navy-500 focus:outline-none transition-colors"
                value={doi}
                onChange={e => setDoi(e.target.value)}
              />
            </div>

            {/* Conference select */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-655 dark:text-slate-400">Associated Conference</label>
              <select
                className="w-full px-4 py-2 border border-slate-200 dark:border-slate-850 bg-slate-50 dark:bg-slate-950 rounded-xl text-xs focus:border-navy-500 focus:outline-none"
                value={conferenceId || ''}
                onChange={e => setConferenceId(e.target.value ? Number(e.target.value) : undefined)}
              >
                <option value="">-- Select Conference --</option>
                {conferences.map(c => (
                  <option key={c.conference_id} value={c.conference_id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

          </div>

          {/* Internal Co-Authors */}
          <div className="space-y-2 border-t border-slate-100 dark:border-slate-850 pt-4">
            <h4 className="text-xs font-semibold text-slate-655 dark:text-slate-400 flex items-center gap-1.5">
              <Users className="w-4 h-4 text-slate-450" />
              Internal Platform Co-Authors
            </h4>
            <div className="max-h-40 overflow-y-auto border border-slate-200 dark:border-slate-850 bg-slate-50 dark:bg-slate-950 rounded-xl p-3 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              {researchers.map(r => {
                const isSelf = !!(currentResearcher && r.researcher_id === currentResearcher.researcher_id);
                return (
                  <label key={r.researcher_id} className="flex items-center gap-2.5 p-1.5 hover:bg-white dark:hover:bg-slate-900 rounded-lg cursor-pointer">
                    <input 
                      type="checkbox"
                      className="accent-navy-600 rounded"
                      checked={selectedResearcherIds.includes(r.researcher_id)}
                      onChange={() => handleCheckboxChange(r.researcher_id)}
                      disabled={isSelf && !isEditMode} // Cannot uncheck self when adding new pub
                    />
                    <span className={isSelf ? 'font-bold text-navy-600' : ''}>
                      {r.name} {isSelf ? '(You)' : ''}
                    </span>
                  </label>
                );
              })}
            </div>
          </div>

          {/* External Authors */}
          <div className="space-y-2 border-t border-slate-100 dark:border-slate-850 pt-4">
            <label className="text-xs font-semibold text-slate-655 dark:text-slate-400 block">External Co-Authors (Not on SCN)</label>
            <div className="flex gap-2">
              <input 
                type="text" 
                placeholder="e.g. Dr. Sarah Connor"
                className="flex-1 px-4 py-2 border border-slate-200 dark:border-slate-850 bg-slate-50 dark:bg-slate-950 rounded-xl text-xs focus:outline-none"
                value={newExtAuthor}
                onChange={e => setNewExtAuthor(e.target.value)}
              />
              <button 
                type="button"
                onClick={handleAddExternalAuthor}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-250 dark:bg-slate-850 rounded-xl text-xs font-semibold flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" /> Add
              </button>
            </div>
            
            {externalAuthors.length > 0 && (
              <div className="flex flex-wrap gap-2 pt-2">
                {externalAuthors.map(name => (
                  <span key={name} className="inline-flex items-center gap-1 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 pl-2.5 pr-1.5 py-1 rounded-xl text-xs font-medium border border-slate-200 dark:border-slate-750">
                    {name}
                    <button 
                      type="button" 
                      onClick={() => handleRemoveExternalAuthor(name)}
                      className="p-0.5 text-slate-400 hover:text-slate-600 rounded-full"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-red-500" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex gap-3 justify-end pt-5 border-t border-slate-100 dark:border-slate-850">
            <button 
              type="button" 
              onClick={() => navigate(isEditMode ? `/publications/${id}` : "/publications")}
              className="px-5 py-2.5 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 dark:hover:bg-slate-850 rounded-xl text-xs font-semibold text-slate-550 hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button 
              type="submit"
              className="px-5 py-2.5 bg-navy-600 hover:bg-navy-500 text-white rounded-xl text-xs font-semibold flex items-center gap-2 shadow-lg shadow-navy-500/10 transition-all hover:scale-[1.01]"
            >
              <Save className="w-4 h-4" />
              {isEditMode ? 'Save Edits' : 'Register Paper'}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
