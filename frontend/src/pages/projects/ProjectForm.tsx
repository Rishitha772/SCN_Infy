import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ProjectService } from '../../services/projectService';
import { ResearcherService } from '../../services/researcherService';
import { useAuth } from '../../contexts/Auth';
import type { Researcher } from '../../types';
import { ProjectStatus } from '../../types';
import { ArrowLeft, Save, Users, AlertCircle } from 'lucide-react';

export const ProjectForm: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { researcher: currentResearcher } = useAuth();

  const isEditMode = !!id;

  // Form Field States
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<ProjectStatus>(ProjectStatus.ACTIVE);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedResearcherIds, setSelectedResearcherIds] = useState<number[]>([]);

  // Collections state
  const [researchers, setResearchers] = useState<Researcher[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadCollectionsAndForm = async () => {
      setLoading(true);
      try {
        const resList = await ResearcherService.getAll();
        setResearchers(resList);

        if (isEditMode) {
          const proj = await ProjectService.getById(Number(id));
          
          // Verify permissions: must be a project member to edit
          if (currentResearcher && !proj.researcher_ids?.includes(currentResearcher.researcher_id)) {
            navigate("/projects", { replace: true });
            return;
          }

          setName(proj.name);
          setDescription(proj.description || '');
          setStatus(proj.status);
          setStartDate(proj.start_date || '');
          setEndDate(proj.end_date || '');
          setSelectedResearcherIds(proj.researcher_ids || []);
        } else {
          if (currentResearcher) {
            setSelectedResearcherIds([currentResearcher.researcher_id]);
          }
        }
      } catch (err) {
        console.error("Failed to load project details:", err);
      } finally {
        setLoading(false);
      }
    };

    loadCollectionsAndForm();
  }, [id, isEditMode, currentResearcher, navigate]);

  const handleCheckboxChange = (resId: number) => {
    setSelectedResearcherIds(prev => {
      if (prev.includes(resId)) {
        // Can't uncheck self in add mode
        if (!isEditMode && currentResearcher && resId === currentResearcher.researcher_id) {
          return prev;
        }
        return prev.filter(id => id !== resId);
      } else {
        return [...prev, resId];
      }
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (name.length < 5) {
      setError("Project name must be at least 5 characters long.");
      return;
    }

    if (startDate && endDate && new Date(endDate) < new Date(startDate)) {
      setError("End date cannot be prior to start date.");
      return;
    }

    setLoading(true);
    try {
      if (isEditMode) {
        await ProjectService.update(Number(id), {
          name,
          description: description.trim() || null,
          status,
          start_date: startDate || null,
          end_date: endDate || null,
          researcher_ids: selectedResearcherIds
        });
        navigate(`/projects/${id}`);
      } else {
        await ProjectService.create({
          name,
          description: description.trim() || null,
          status,
          start_date: startDate || null,
          end_date: endDate || null,
          researcher_ids: selectedResearcherIds
        });
        navigate("/projects");
      }
    } catch (err: any) {
      setError(err.message || "Failed to save project.");
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <div className="w-10 h-10 border-4 border-navy-500 border-t-transparent rounded-full animate-spin"></div>
        <span className="text-slate-505 text-sm font-semibold">Preparing project form...</span>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-200/50 dark:border-slate-800/50">
        <Link 
          to={isEditMode ? `/projects/${id}` : "/projects"} 
          className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-700 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Cancel
        </Link>
        <h2 className="text-lg font-bold">{isEditMode ? 'Edit Project parameters' : 'Initiate New Project'}</h2>
      </div>

      <div className="bg-white dark:bg-slate-900 border border-slate-200/65 dark:border-slate-800/65 rounded-2xl p-6 lg:p-8 shadow-sm">
        
        {error && (
          <div className="p-3.5 bg-red-50 text-red-650 rounded-xl text-xs flex gap-2 mb-6">
            <AlertCircle className="w-4.5 h-4.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* Project Name */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-655 dark:text-slate-400">Project Name *</label>
            <input 
              type="text" 
              required
              placeholder="e.g. Graph Mining for Academic Networks"
              className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-850 bg-slate-50 dark:bg-slate-950 rounded-xl text-sm focus:border-navy-500 focus:outline-none transition-colors"
              value={name}
              onChange={e => setName(e.target.value)}
            />
          </div>

          {/* Description */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-655 dark:text-slate-400">Description</label>
            <textarea 
              rows={4}
              placeholder="Briefly state study targets, grants constraints, and research parameters..."
              className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-850 bg-slate-50 dark:bg-slate-955 rounded-xl text-sm focus:border-navy-500 focus:outline-none transition-colors"
              value={description}
              onChange={e => setDescription(e.target.value)}
            />
          </div>

          {/* Dates & Status */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-655 dark:text-slate-400">Status *</label>
              <select
                className="w-full px-3 py-2 border border-slate-200 dark:border-slate-850 bg-slate-50 dark:bg-slate-950 rounded-xl text-xs focus:border-navy-500 focus:outline-none"
                value={status}
                onChange={e => setStatus(e.target.value as any)}
              >
                <option value={ProjectStatus.ACTIVE}>Active</option>
                <option value={ProjectStatus.COMPLETED}>Completed</option>
                <option value={ProjectStatus.CANCELLED}>Cancelled</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-655 dark:text-slate-400">Start Date</label>
              <input 
                type="date"
                className="w-full px-3 py-2 border border-slate-200 dark:border-slate-850 bg-slate-50 dark:bg-slate-950 rounded-xl text-xs focus:border-navy-500 focus:outline-none"
                value={startDate}
                onChange={e => setStartDate(e.target.value)}
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-655 dark:text-slate-400">End Date</label>
              <input 
                type="date"
                className="w-full px-3 py-2 border border-slate-200 dark:border-slate-850 bg-slate-50 dark:bg-slate-950 rounded-xl text-xs focus:border-navy-500 focus:outline-none"
                value={endDate}
                onChange={e => setEndDate(e.target.value)}
              />
            </div>

          </div>

          {/* Members Checkbox list */}
          <div className="space-y-2 border-t border-slate-100 dark:border-slate-850 pt-4">
            <h4 className="text-xs font-semibold text-slate-655 dark:text-slate-400 flex items-center gap-1.5">
              <Users className="w-4 h-4 text-slate-450" />
              Research Team Investigators
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
                      disabled={isSelf && !isEditMode} // Cannot uncheck self
                    />
                    <span className={isSelf ? 'font-bold text-navy-600' : ''}>
                      {r.name} {isSelf ? '(You)' : ''}
                    </span>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex gap-3 justify-end pt-5 border-t border-slate-100 dark:border-slate-850">
            <button 
              type="button" 
              onClick={() => navigate(isEditMode ? `/projects/${id}` : "/projects")}
              className="px-5 py-2.5 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 dark:hover:bg-slate-850 rounded-xl text-xs font-semibold text-slate-550 hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button 
              type="submit"
              className="px-5 py-2.5 bg-navy-600 hover:bg-navy-500 text-white rounded-xl text-xs font-semibold flex items-center gap-2 shadow-lg shadow-navy-500/10 transition-all hover:scale-[1.01]"
            >
              <Save className="w-4 h-4" />
              {isEditMode ? 'Save Project' : 'Launch Project'}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
