import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/Auth';
import { ResearcherService } from '../../services/researcherService';
import { AdminService } from '../../services/adminService';
import type { Institution } from '../../types';
import { Landmark, ArrowRight, UserPlus, AlertCircle } from 'lucide-react';

export const ProfileCreate: React.FC = () => {
  const { user, refreshUser } = useAuth();
  const navigate = useNavigate();

  const [institutions, setInstitutions] = useState<Institution[]>([]);
  const [name, setName] = useState(() => {
    return user ? localStorage.getItem(`pending_name_${user.email}`) || '' : '';
  });
  const [bio, setBio] = useState('');
  const [department, setDepartment] = useState('');
  const [orcid, setOrcid] = useState('');
  const [skillsStr, setSkillsStr] = useState('');
  const [interestsStr, setInterestsStr] = useState('');
  const [institutionId, setInstitutionId] = useState<number | undefined>(undefined);

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    AdminService.getAllInstitutions().then(inst => {
      setInstitutions(inst);
      if (inst.length > 0) {
        setInstitutionId(inst[0].institution_id);
      }
    });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (name.length < 5) {
      setError("Name must be at least 5 characters long.");
      return;
    }

    if (orcid && (orcid.length > 16 || orcid.length < 15)) {
      setError("ORCID must be a valid 15 or 16 digit identifier.");
      return;
    }

    setLoading(true);
    try {
      const skills = skillsStr.split(',').map(s => s.trim()).filter(s => s.length > 0);
      const research_interests = interestsStr.split(',').map(i => i.trim()).filter(i => i.length > 0);

      await ResearcherService.create({
        name,
        bio: bio.trim() || null,
        department: department.trim() || null,
        orcid: orcid.trim() || null,
        skills,
        research_interests,
        institution_id: institutionId || null
      });

      // Clear pending name cache
      if (user) {
        localStorage.removeItem(`pending_name_${user.email}`);
      }

      await refreshUser();
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || "Failed to create profile.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto py-10 px-6">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl p-8 space-y-6">
        
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 bg-navy-50 dark:bg-navy-950/40 rounded-full flex items-center justify-center mx-auto text-navy-600 dark:text-navy-400">
            <UserPlus className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-bold tracking-tight">Complete Researcher Profile</h2>
          <p className="text-xs text-slate-500">Provide details to construct your scholarly collaboration nodes.</p>
        </div>

        {/* Error message */}
        {error && (
          <div className="p-3.5 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/40 rounded-xl text-xs text-red-650 dark:text-red-400 flex items-start gap-2.5">
            <AlertCircle className="w-4.5 h-4.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">Full Name *</label>
            <input 
              type="text" 
              required
              placeholder="Dr. John Doe"
              className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 rounded-xl text-sm focus:border-navy-500 focus:outline-none transition-colors"
              value={name}
              onChange={e => setName(e.target.value)}
              disabled={loading}
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 font-medium">Affiliation Institution *</label>
            <div className="relative">
              <select 
                required
                className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 rounded-xl text-sm focus:border-navy-500 focus:outline-none appearance-none transition-colors"
                value={institutionId}
                onChange={e => setInstitutionId(Number(e.target.value))}
                disabled={loading}
              >
                {institutions.map(inst => (
                  <option key={inst.institution_id} value={inst.institution_id}>
                    {inst.name} ({inst.city}, {inst.country})
                  </option>
                ))}
              </select>
              <Landmark className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">Department</label>
              <input 
                type="text" 
                placeholder="e.g. Computer Science"
                className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 rounded-xl text-sm focus:border-navy-500 focus:outline-none transition-colors"
                value={department}
                onChange={e => setDepartment(e.target.value)}
                disabled={loading}
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">ORCID iD</label>
              <input 
                type="text" 
                placeholder="e.g. 0000000218234521"
                className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 rounded-xl text-sm focus:border-navy-500 focus:outline-none transition-colors font-mono"
                value={orcid}
                onChange={e => setOrcid(e.target.value.replace(/\D/g, ''))}
                disabled={loading}
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">Short Bio</label>
            <textarea 
              rows={3}
              placeholder="Describe your research directions and scholarly background..."
              className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 rounded-xl text-sm focus:border-navy-500 focus:outline-none transition-colors"
              value={bio}
              onChange={e => setBio(e.target.value)}
              disabled={loading}
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">Skills (Comma-separated)</label>
            <input 
              type="text" 
              placeholder="e.g. React, Python, Graph Analytics"
              className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 rounded-xl text-sm focus:border-navy-500 focus:outline-none transition-colors"
              value={skillsStr}
              onChange={e => setSkillsStr(e.target.value)}
              disabled={loading}
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">Research Interests (Comma-separated)</label>
            <input 
              type="text" 
              placeholder="e.g. HCI, Social Networks, Semantic AI"
              className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 rounded-xl text-sm focus:border-navy-500 focus:outline-none transition-colors"
              value={interestsStr}
              onChange={e => setInterestsStr(e.target.value)}
              disabled={loading}
            />
          </div>

          <button 
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-navy-600 hover:bg-navy-500 disabled:opacity-50 text-white rounded-xl text-sm font-semibold shadow-lg shadow-navy-500/10 flex items-center justify-center gap-2 transition-all mt-4"
          >
            Create Profile & continue
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

      </div>
    </div>
  );
};
