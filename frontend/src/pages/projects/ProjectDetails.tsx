import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/Auth';
import { ProjectService } from '../../services/projectService';
import { ResearcherService } from '../../services/researcherService';
import { PublicationService } from '../../services/publicationService';
import type { Project, Researcher, Publication } from '../../types';
import { 
  ArrowLeft, Calendar, Edit, Trash2, BookOpen, Activity 
} from 'lucide-react';

export const ProjectDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { researcher: currentResearcher } = useAuth();

  const [project, setProject] = useState<Project | null>(null);
  const [members, setMembers] = useState<Researcher[]>([]);
  const [relatedPubs, setRelatedPubs] = useState<Publication[]>([]);
  const [loading, setLoading] = useState(true);
  const [isMember, setIsMember] = useState(false);

  useEffect(() => {
    const loadProjectDetails = async () => {
      if (!id) return;
      setLoading(true);
      try {
        const proj = await ProjectService.getById(Number(id));
        setProject(proj);

        // Check membership
        if (currentResearcher && proj.researcher_ids?.includes(currentResearcher.researcher_id)) {
          setIsMember(true);
        } else {
          setIsMember(false);
        }

        // Fetch researchers
        const allRes = await ResearcherService.getAll();
        const linkedMembers = allRes.filter(r => proj.researcher_ids?.includes(r.researcher_id));
        setMembers(linkedMembers);

        // Find publications associated with co-authors
        const memberIds = linkedMembers.map(m => m.researcher_id);
        const allPubs = await PublicationService.getAll();
        const linkedPubs = allPubs.filter(p => 
          p.researcher_ids?.some(rid => memberIds.includes(rid))
        );
        setRelatedPubs(linkedPubs);

      } catch (err) {
        console.error("Failed to load project details:", err);
      } finally {
        setLoading(false);
      }
    };
    loadProjectDetails();
  }, [id, currentResearcher]);

  const handleDelete = async () => {
    if (!window.confirm("Are you sure you want to delete this project? This is irreversible.")) return;
    if (project) {
      await ProjectService.delete(project.project_id);
      navigate("/projects");
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <div className="w-10 h-10 border-4 border-navy-500 border-t-transparent rounded-full animate-spin"></div>
        <span className="text-slate-500 text-sm font-semibold">Retrieving project metadata...</span>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="p-8 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-2xl text-center max-w-md mx-auto space-y-4">
        <h2 className="text-xl font-bold">Project Not Found</h2>
        <p className="text-xs text-slate-500">The requested research project does not exist or has been cancelled.</p>
        <Link to="/projects" className="inline-block text-xs font-semibold text-navy-600 hover:underline">Back to Directory</Link>
      </div>
    );
  }

  // Simulated Milestones Timeline
  const timelines = [
    { title: 'Project Initiated', desc: 'Core parameters mapped and co-authors linked to SCN repository.', date: project.start_date || 'Initial Phase', status: 'completed' },
    { title: 'Bibliography Integration', desc: 'Literature review logs and citation mappings completed.', date: 'Phase 2', status: project.status === 'completed' ? 'completed' : 'active' },
    { title: 'Final Report Drafting', desc: 'CSV exports compiled and academic summaries submitted to reviewer panel.', date: project.end_date || 'End Phase', status: project.status === 'completed' ? 'completed' : 'pending' }
  ];

  return (
    <div className="space-y-6">
      
      {/* Back/Actions Header */}
      <div className="flex items-center justify-between border-b border-slate-200/50 dark:border-slate-800/50 pb-4">
        <Link to="/projects" className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-700 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to Projects
        </Link>
        {isMember && (
          <div className="flex items-center gap-2">
            <Link 
              to={`/projects/${project.project_id}/edit`}
              className="px-3 py-1.5 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl text-xs font-semibold inline-flex items-center gap-1 shadow-sm"
            >
              <Edit className="w-3.5 h-3.5" /> Edit Project
            </Link>
            <button 
              onClick={handleDelete}
              className="px-3 py-1.5 border border-slate-200 dark:border-slate-800 hover:bg-red-50 dark:hover:bg-red-950/20 text-red-650 rounded-xl text-xs font-semibold inline-flex items-center gap-1 shadow-sm"
            >
              <Trash2 className="w-3.5 h-3.5" /> Delete Project
            </button>
          </div>
        )}
      </div>

      {/* Main Info Card */}
      <div className="p-6 lg:p-8 bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/60 rounded-2xl shadow-sm space-y-4">
        <div className="flex items-center gap-2">
          <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${
            project.status === 'active' 
              ? 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 border-emerald-100 dark:border-emerald-900/10' 
              : 'bg-slate-100 dark:bg-slate-800 text-slate-400 border-slate-200 dark:border-slate-700'
          }`}>
            {project.status}
          </span>
          <span className="text-[10px] text-slate-400 font-mono">Project Reference: SCN-PROJ-{project.project_id}</span>
        </div>

        <h1 className="text-xl sm:text-2xl lg:text-3xl font-extrabold tracking-tight leading-snug">{project.name}</h1>

        <p className="text-xs text-slate-650 dark:text-slate-400 leading-relaxed font-sans">{project.description || 'No description summary logged.'}</p>

        {/* Date line */}
        <div className="pt-4 border-t border-slate-100 dark:border-slate-850 flex items-center gap-2 text-xs text-slate-500">
          <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
          <span>Research Timeline: <span className="font-semibold text-slate-800 dark:text-slate-200">{project.start_date || 'N/A'}</span> to <span className="font-semibold text-slate-800 dark:text-slate-200">{project.end_date || 'Ongoing'}</span></span>
        </div>
      </div>

      {/* Dynamic Columns: Left (Members/Outputs), Right (Milestones Timeline) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Members & Outputs */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Members */}
          <div className="p-6 bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/60 rounded-2xl shadow-sm space-y-4">
            <h4 className="font-bold text-xs text-slate-400 uppercase tracking-widest border-b border-slate-100 dark:border-slate-850 pb-2">Research Team Members</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {members.map(m => (
                <div key={m.researcher_id} className="p-3 border border-slate-150 dark:border-slate-850 bg-slate-50/50 dark:bg-slate-950/20 rounded-xl flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-navy-600 text-white font-bold flex items-center justify-center text-xs shrink-0 select-none">
                    {m.name.charAt(0)}
                  </div>
                  <div className="min-w-0">
                    <h5 className="text-xs font-semibold truncate leading-none">
                      <Link to={`/researchers/${m.researcher_id}`} className="hover:underline hover:text-navy-650">{m.name}</Link>
                    </h5>
                    <p className="text-[10px] text-slate-500 mt-1 truncate">{m.department || 'Academic Department'}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Project Outputs */}
          <div className="p-6 bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/60 rounded-2xl shadow-sm space-y-4">
            <h4 className="font-bold text-xs text-slate-400 uppercase tracking-widest border-b border-slate-100 dark:border-slate-850 pb-2">Related Project Outputs</h4>
            {relatedPubs.length === 0 ? (
              <p className="text-xs text-slate-400 py-2">No publications registered for this team members yet.</p>
            ) : (
              <div className="space-y-3.5">
                {relatedPubs.map(pub => (
                  <div key={pub.publication_id} className="flex items-start gap-2.5 text-xs">
                    <BookOpen className="w-4.5 h-4.5 text-navy-500 shrink-0 mt-0.5" />
                    <div>
                      <Link to={`/publications/${pub.publication_id}`} className="hover:text-navy-650 hover:underline font-semibold leading-snug">{pub.title}</Link>
                      <span className="text-[9px] bg-slate-100 dark:bg-slate-800 text-slate-500 px-1.5 py-0.5 rounded ml-2 capitalize">{pub.publication_type}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

        {/* Milestones Column */}
        <div className="lg:col-span-5 space-y-6">
          <div className="p-6 bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/60 rounded-2xl shadow-sm space-y-4">
            <h4 className="font-bold text-xs text-slate-400 uppercase tracking-widest border-b border-slate-100 dark:border-slate-850 pb-2 flex items-center gap-1.5">
              <Activity className="w-4 h-4 text-slate-400" />
              Project Milestones
            </h4>
            
            {/* Timeline Tree */}
            <div className="relative pl-6 border-l border-slate-200 dark:border-slate-800 space-y-6">
              {timelines.map((node, index) => (
                <div key={index} className="relative">
                  {/* Dot */}
                  <span className={`absolute -left-[30px] top-1.5 w-4 h-4 rounded-full border-2 border-white dark:border-slate-900 ${
                    node.status === 'completed' 
                      ? 'bg-emerald-500' 
                      : node.status === 'active'
                      ? 'bg-navy-500 animate-pulse'
                      : 'bg-slate-200 dark:bg-slate-800'
                  }`} />
                  
                  {/* Description */}
                  <div className="space-y-1">
                    <h5 className="font-semibold text-xs leading-none">{node.title}</h5>
                    <p className="text-[10px] text-slate-500 leading-normal">{node.desc}</p>
                    <span className="text-[9px] text-slate-400 block">{node.date}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>

    </div>
  );
};
