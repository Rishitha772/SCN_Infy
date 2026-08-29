import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/Auth';
import { ResearcherService } from '../../services/researcherService';
import { PublicationService } from '../../services/publicationService';
import { ProjectService } from '../../services/projectService';
import { AdminService } from '../../services/adminService';
import { CollaborationService } from '../../services/collaborationService';
import type { Researcher, Publication, Project, Institution, Collaboration } from '../../types';
import { 
  Landmark, BookOpen, FolderGit2, GitFork, 
  PenSquare, X, Check, Globe, AlertCircle 
} from 'lucide-react';

export const Profile: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { researcher: currentResearcher, refreshUser } = useAuth();

  const isOwnProfile = !id || (currentResearcher && Number(id) === currentResearcher.researcher_id);

  // States
  const [profile, setProfile] = useState<Researcher | null>(null);
  const [institution, setInstitution] = useState<Institution | null>(null);
  const [institutionsList, setInstitutionsList] = useState<Institution[]>([]);
  const [publications, setPublications] = useState<Publication[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [collaborations, setCollaborations] = useState<(Collaboration & { partnerName: string })[]>([]);
  const [loading, setLoading] = useState(true);

  // Editing States
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [editBio, setEditBio] = useState('');
  const [editDept, setEditDept] = useState('');
  const [editOrcid, setEditOrcid] = useState('');
  const [editSkills, setEditSkills] = useState('');
  const [editInterests, setEditInterests] = useState('');
  const [editInstId, setEditInstId] = useState<number | undefined>(undefined);
  const [editError, setEditError] = useState('');

  // Tab State
  const [activeTab, setActiveTab] = useState<'pubs' | 'projects' | 'collabs'>('pubs');

  useEffect(() => {
    const loadProfile = async () => {
      setLoading(true);
      try {
        let activeProfile: Researcher | null = null;
        if (isOwnProfile) {
          activeProfile = currentResearcher;
        } else {
          activeProfile = await ResearcherService.getById(Number(id));
        }

        if (!activeProfile) {
          setProfile(null);
          setLoading(false);
          return;
        }

        setProfile(activeProfile);

        // Load institutions
        const insts = await AdminService.getAllInstitutions();
        setInstitutionsList(insts);
        const inst = insts.find(i => i.institution_id === activeProfile?.institution_id);
        setInstitution(inst || null);

        // Load authored pubs
        const pubs = await PublicationService.getByResearcher(activeProfile.researcher_id);
        setPublications(pubs);

        // Load projects
        const projs = await ProjectService.getByResearcher(activeProfile.researcher_id);
        setProjects(projs);

        // Load collaborations and map partner names
        const colls = await CollaborationService.getByResearcher(activeProfile.researcher_id);
        const allRes = await ResearcherService.getAll();
        
        const mappedColls = colls.map(c => {
          const partnerId = c.researcher_ids.find(rid => rid !== activeProfile!.researcher_id);
          const partner = allRes.find(r => r.researcher_id === partnerId);
          return {
            ...c,
            partnerName: partner?.name || `Researcher ID ${partnerId}`
          };
        });
        setCollaborations(mappedColls);

        // Populate edit inputs
        setEditName(activeProfile.name);
        setEditBio(activeProfile.bio || '');
        setEditDept(activeProfile.department || '');
        setEditOrcid(activeProfile.orcid || '');
        setEditSkills(activeProfile.skills.join(', '));
        setEditInterests(activeProfile.research_interests.join(', '));
        setEditInstId(activeProfile.institution_id || undefined);

      } catch (err) {
        console.error("Failed to load profile details:", err);
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [id, currentResearcher, isOwnProfile]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setEditError('');

    if (editName.length < 5) {
      setEditError("Name must be at least 5 characters long.");
      return;
    }

    try {
      const skills = editSkills.split(',').map(s => s.trim()).filter(s => s.length > 0);
      const research_interests = editInterests.split(',').map(i => i.trim()).filter(i => i.length > 0);

      await ResearcherService.update({
        name: editName,
        bio: editBio.trim() || null,
        department: editDept.trim() || null,
        orcid: editOrcid.trim() || null,
        skills,
        research_interests,
        institution_id: editInstId || null
      });

      await refreshUser();
      setIsEditing(false);
    } catch (err: any) {
      setEditError(err.message || "Failed to update profile.");
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <div className="w-10 h-10 border-4 border-navy-500 border-t-transparent rounded-full animate-spin"></div>
        <span className="text-slate-500 text-sm font-semibold">Retrieving academic profile...</span>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="p-8 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-2xl text-center max-w-md mx-auto space-y-4">
        <h2 className="text-xl font-bold">Profile Not Found</h2>
        <p className="text-xs text-slate-500">The requested researcher profile does not exist or has been removed.</p>
        <Link to="/dashboard" className="inline-block text-xs font-semibold text-navy-600 hover:underline">Return to Dashboard</Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      
      {/* Profile Header Card */}
      <div className="p-6 lg:p-8 bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/60 rounded-2xl shadow-sm flex flex-col md:flex-row gap-6 items-start justify-between relative">
        <div className="flex flex-col md:flex-row gap-5 items-center md:items-start text-center md:text-left w-full">
          {/* Large Avatar */}
          <div className="w-20 h-20 md:w-24 md:h-24 bg-navy-600 text-white font-extrabold flex items-center justify-center rounded-full text-2xl md:text-4xl shadow-inner shrink-0 select-none">
            {profile.name.charAt(0)}
          </div>
          
          <div className="space-y-3 flex-1 min-w-0">
            <div className="space-y-1">
              <h2 className="text-2xl font-bold tracking-tight">{profile.name}</h2>
              <p className="text-xs font-semibold text-slate-500 flex items-center justify-center md:justify-start gap-1">
                <Landmark className="w-3.5 h-3.5" />
                {profile.department ? `${profile.department}, ` : ''} {institution?.name || 'Independent Researcher'}
              </p>
            </div>
            
            {/* Bio */}
            <p className="text-xs text-slate-650 dark:text-slate-400 leading-relaxed max-w-2xl">{profile.bio || 'No biography details provided.'}</p>
            
            {/* Academic links: ORCID, email */}
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 text-[10px]">
              <span className="bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded text-slate-600 dark:text-slate-400 font-medium font-mono">ORCID iD: {profile.orcid || 'N/A'}</span>
              {institution?.website && (
                <a href={String(institution.website)} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-navy-500 hover:underline">
                  <Globe className="w-3.5 h-3.5" /> Website
                </a>
              )}
            </div>
          </div>
        </div>

        {/* Edit Button (conditionally rendered) */}
        {isOwnProfile && (
          <button 
            onClick={() => setIsEditing(true)}
            className="md:absolute md:top-6 md:right-6 shrink-0 inline-flex items-center gap-1.5 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-3 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors shadow-sm"
          >
            <PenSquare className="w-4 h-4 text-navy-500" />
            Edit Profile
          </button>
        )}
      </div>

      {/* Skills & Interests Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        
        {/* Skills List Card */}
        <div className="p-5 bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/60 rounded-2xl shadow-sm">
          <h4 className="font-bold text-xs text-slate-400 uppercase tracking-widest mb-3">Skills & Expertise</h4>
          {profile.skills.length === 0 ? (
            <p className="text-xs text-slate-400">No skills registered yet.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {profile.skills.map(skill => (
                <span key={skill} className="bg-navy-50 dark:bg-navy-950/40 text-navy-650 dark:text-navy-400 px-2.5 py-1 rounded-lg text-xs font-medium border border-navy-100/50 dark:border-navy-900/30">{skill}</span>
              ))}
            </div>
          )}
        </div>

        {/* Interests Card */}
        <div className="p-5 bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/60 rounded-2xl shadow-sm">
          <h4 className="font-bold text-xs text-slate-400 uppercase tracking-widest mb-3">Research Interests</h4>
          {profile.research_interests.length === 0 ? (
            <p className="text-xs text-slate-400">No interests registered yet.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {profile.research_interests.map(interest => (
                <span key={interest} className="bg-indigo-50 dark:bg-indigo-950/40 text-indigo-650 dark:text-indigo-400 px-2.5 py-1 rounded-lg text-xs font-medium border border-indigo-100/50 dark:border-indigo-900/30">{interest}</span>
              ))}
            </div>
          )}
        </div>

      </div>

      {/* Tabs Container */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/60 rounded-2xl shadow-sm overflow-hidden flex flex-col">
        {/* Tab Controls */}
        <div className="flex border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
          {[
            { id: 'pubs', label: 'Publications', count: publications.length, icon: BookOpen },
            { id: 'projects', label: 'Projects', count: projects.length, icon: FolderGit2 },
            { id: 'collabs', label: 'Collaboration Connections', count: collaborations.length, icon: GitFork }
          ].map(tab => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex-1 md:flex-initial flex items-center justify-center gap-2 px-6 py-3.5 text-xs font-semibold border-b-2 transition-all ${
                  active 
                    ? 'border-navy-600 text-navy-600 dark:text-navy-400 bg-white dark:bg-slate-900' 
                    : 'border-transparent text-slate-550 hover:bg-slate-100/50 dark:hover:bg-slate-850 hover:text-slate-700'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
                <span className={`px-1.5 py-0.5 rounded-full text-[9px] ${active ? 'bg-navy-50 dark:bg-navy-950 text-navy-600' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'}`}>{tab.count}</span>
              </button>
            );
          })}
        </div>

        {/* Tab Content */}
        <div className="p-6">
          
          {/* 1. PUBLICATIONS TAB */}
          {activeTab === 'pubs' && (
            <div className="space-y-4">
              {publications.length === 0 ? (
                <div className="text-center py-10 text-xs text-slate-400">No publication records logged.</div>
              ) : (
                <div className="divide-y divide-slate-100 dark:divide-slate-850">
                  {publications.map(pub => (
                    <div key={pub.publication_id} className="py-4 first:pt-0 last:pb-0 flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="space-y-1">
                        <Link to={`/publications/${pub.publication_id}`} className="font-bold text-sm text-slate-800 dark:text-slate-200 hover:text-navy-650 hover:underline line-clamp-1">{pub.title}</Link>
                        <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed max-w-3xl">{pub.abstract || 'No abstract abstract text provided.'}</p>
                        <div className="flex flex-wrap items-center gap-2 text-[10px] text-slate-400">
                          <span className="capitalize font-semibold">{pub.publication_type}</span>
                          <span>•</span>
                          <span>DOI: {pub.doi || 'N/A'}</span>
                          <span>•</span>
                          <span>Logged: {pub.publication_date || pub.created_at.split('T')[0]}</span>
                        </div>
                      </div>
                      <Link 
                        to={`/publications/${pub.publication_id}`}
                        className="self-start md:self-center px-3 py-1.5 bg-slate-50 hover:bg-slate-100 dark:bg-slate-950 dark:hover:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded-lg text-xs font-semibold"
                      >
                        Details
                      </Link>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* 2. PROJECTS TAB */}
          {activeTab === 'projects' && (
            <div className="space-y-4">
              {projects.length === 0 ? (
                <div className="text-center py-10 text-xs text-slate-400">No project records cataloged.</div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {projects.map(proj => (
                    <div key={proj.project_id} className="p-4 border border-slate-150 dark:border-slate-800 rounded-xl space-y-3">
                      <div className="flex justify-between items-start gap-2">
                        <Link to={`/projects/${proj.project_id}`} className="font-bold text-xs text-slate-800 dark:text-slate-200 hover:text-navy-650 hover:underline line-clamp-1">{proj.name}</Link>
                        <span className={`text-[9px] font-semibold px-2 py-0.5 rounded capitalize ${
                          proj.status === 'active' 
                            ? 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600' 
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
                        }`}>{proj.status}</span>
                      </div>
                      <p className="text-[11px] text-slate-550 line-clamp-2 leading-relaxed">{proj.description}</p>
                      <div className="pt-2 border-t border-slate-50 dark:border-slate-850 flex justify-between items-center text-[10px] text-slate-400">
                        <span>Timeline: {proj.start_date || 'N/A'} - {proj.end_date || 'Ongoing'}</span>
                        <Link to={`/projects/${proj.project_id}`} className="font-semibold text-navy-500 hover:underline">View Timeline</Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* 3. COLLABORATIONS TAB */}
          {activeTab === 'collabs' && (
            <div className="space-y-4">
              {collaborations.length === 0 ? (
                <div className="text-center py-10 text-xs text-slate-400">No connections mapped in graph yet.</div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {collaborations.map(col => {
                    const partnerId = col.researcher_ids.find(rid => rid !== profile.researcher_id);
                    return (
                      <div key={col.collaboration_id} className="p-4 border border-slate-150 dark:border-slate-800 rounded-xl flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-navy-100 dark:bg-navy-950/40 text-navy-600 dark:text-navy-400 flex items-center justify-center font-bold text-xs">
                            {col.partnerName.charAt(0)}
                          </div>
                          <div>
                            <Link to={`/researchers/${partnerId}`} className="font-bold text-xs hover:underline hover:text-navy-650">{col.partnerName}</Link>
                            <p className="text-[10px] text-slate-400">Type: {col.collaboration_type || 'Co-author'}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="text-[10px] bg-navy-50 dark:bg-navy-950/20 text-navy-600 px-2 py-1 rounded-md font-semibold">Weight: {col.collaboration_count}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

        </div>
      </div>

      {/* EDIT PROFILE MODAL */}
      {isEditing && (
        <div className="fixed inset-0 z-50 bg-slate-950/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col animate-scale-in">
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-950">
              <h3 className="font-bold text-sm">Edit Academic Profile</h3>
              <button onClick={() => setIsEditing(false)} className="p-1 hover:bg-slate-250 rounded-lg"><X className="w-5 h-5" /></button>
            </div>
            
            <form onSubmit={handleUpdateProfile} className="p-6 space-y-4 overflow-y-auto max-h-[75vh]">
              {editError && (
                <div className="p-3 bg-red-50 text-red-650 rounded-xl text-xs flex gap-2">
                  <AlertCircle className="w-4.5 h-4.5" />
                  <span>{editError}</span>
                </div>
              )}

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-600">Full Name *</label>
                <input 
                  type="text" 
                  required
                  className="w-full px-4 py-2 border border-slate-200 bg-slate-50 rounded-xl text-xs outline-none focus:border-navy-500"
                  value={editName}
                  onChange={e => setEditName(e.target.value)}
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-600">Affiliation Institution</label>
                <select 
                  className="w-full px-4 py-2 border border-slate-200 bg-slate-50 rounded-xl text-xs outline-none focus:border-navy-500"
                  value={editInstId}
                  onChange={e => setEditInstId(Number(e.target.value))}
                >
                  <option value="">No Affiliation</option>
                  {institutionsList.map(inst => (
                    <option key={inst.institution_id} value={inst.institution_id}>
                      {inst.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-600">Department</label>
                  <input 
                    type="text" 
                    className="w-full px-4 py-2 border border-slate-200 bg-slate-50 rounded-xl text-xs outline-none focus:border-navy-500"
                    value={editDept}
                    onChange={e => setEditDept(e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-600">ORCID ID</label>
                  <input 
                    type="text" 
                    className="w-full px-4 py-2 border border-slate-200 bg-slate-50 rounded-xl text-xs outline-none focus:border-navy-500"
                    value={editOrcid}
                    onChange={e => setEditOrcid(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-600">Biography</label>
                <textarea 
                  rows={3}
                  className="w-full px-4 py-2 border border-slate-200 bg-slate-50 rounded-xl text-xs outline-none focus:border-navy-500"
                  value={editBio}
                  onChange={e => setEditBio(e.target.value)}
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-600">Skills (Comma-separated)</label>
                <input 
                  type="text" 
                  className="w-full px-4 py-2 border border-slate-200 bg-slate-50 rounded-xl text-xs outline-none focus:border-navy-500"
                  value={editSkills}
                  onChange={e => setEditSkills(e.target.value)}
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-600">Research Interests (Comma-separated)</label>
                <input 
                  type="text" 
                  className="w-full px-4 py-2 border border-slate-200 bg-slate-50 rounded-xl text-xs outline-none focus:border-navy-500"
                  value={editInterests}
                  onChange={e => setEditInterests(e.target.value)}
                />
              </div>

              <div className="flex gap-2 justify-end pt-4 border-t border-slate-100">
                <button 
                  type="button" 
                  onClick={() => setIsEditing(false)}
                  className="px-4 py-2 border border-slate-200 bg-white rounded-xl text-xs font-semibold text-slate-500 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="px-4 py-2 bg-navy-600 hover:bg-navy-500 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
