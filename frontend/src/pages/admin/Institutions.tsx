import React, { useEffect, useState } from 'react';
import { AdminService } from '../../services/adminService';
import type { Institution } from '../../types';
import { InstitutionType } from '../../types';
import { Landmark, Plus, Edit, Trash2, X, Check, Globe, MapPin, AlertCircle } from 'lucide-react';

export const Institutions: React.FC = () => {
  const [institutions, setInstitutions] = useState<Institution[]>([]);
  const [loading, setLoading] = useState(true);

  // Dialog State
  const [formOpen, setFormOpen] = useState(false);
  const [editingInst, setEditingInst] = useState<Institution | null>(null);
  
  // Form fields
  const [name, setName] = useState('');
  const [city, setCity] = useState('');
  const [country, setCountry] = useState('');
  const [type, setType] = useState<InstitutionType>(InstitutionType.UNIVERSITY);
  const [website, setWebsite] = useState('');
  
  const [error, setError] = useState('');

  const loadInstitutions = async () => {
    setLoading(true);
    try {
      const list = await AdminService.getAllInstitutions();
      setInstitutions(list);
    } catch (err) {
      console.error("Failed to load institutions:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInstitutions();
  }, []);

  const handleOpenAdd = () => {
    setEditingInst(null);
    setName('');
    setCity('');
    setCountry('');
    setType(InstitutionType.UNIVERSITY);
    setWebsite('');
    setError('');
    setFormOpen(true);
  };

  const handleOpenEdit = (inst: Institution) => {
    setEditingInst(inst);
    setName(inst.name);
    setCity(inst.city);
    setCountry(inst.country);
    setType(inst.type);
    setWebsite(inst.website || '');
    setError('');
    setFormOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!name.trim()) {
      setError("Institution name is required.");
      return;
    }

    if (!country.trim()) {
      setError("Country is required.");
      return;
    }

    try {
      if (editingInst) {
        await AdminService.updateInstitution(editingInst.institution_id, {
          name,
          city: city.trim() || null as any,
          country,
          type,
          website: website.trim() || null as any
        });
      } else {
        await AdminService.createInstitution({
          name,
          city: city.trim() || null as any,
          country,
          type,
          website: website.trim() || null as any
        });
      }
      setFormOpen(false);
      loadInstitutions();
      alert(`Institution ${editingInst ? 'updated' : 'created'} successfully.`);
    } catch (err: any) {
      setError(err.message || "Operation failed.");
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm("Remove this institution? This will unlink affiliated researchers.")) return;
    try {
      await AdminService.deleteInstitution(id);
      loadInstitutions();
    } catch (err: any) {
      alert(err.message || "Failed to remove institution.");
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-200/50 dark:border-slate-800/50 pb-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Landmark className="w-8 h-8 text-navy-500" />
            Affiliated Institutions
          </h1>
          <p className="text-slate-500 text-sm">Register universities, laboratories, or companies to verify researcher emails.</p>
        </div>
        <button 
          onClick={handleOpenAdd}
          className="px-3.5 py-2 bg-navy-600 hover:bg-navy-500 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-md shadow-navy-500/10 transition-all hover:scale-[1.01]"
        >
          <Plus className="w-4 h-4" /> Add Institution
        </button>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <div className="w-10 h-10 border-4 border-navy-500 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-slate-500 text-sm font-semibold">Retrieving institution registries...</span>
        </div>
      ) : institutions.length === 0 ? (
        <div className="p-8 text-center text-xs text-slate-450 border border-slate-200 bg-white dark:bg-slate-900 rounded-2xl shadow-sm">
          No institutions registered in database.
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/60 rounded-2xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs divide-y divide-slate-150 dark:divide-slate-800">
              <thead>
                <tr className="bg-slate-50/50 dark:bg-slate-950/20 text-slate-450 font-semibold">
                  <th className="px-6 py-3">ID</th>
                  <th className="px-6 py-3">Institution Name</th>
                  <th className="px-6 py-3">Type</th>
                  <th className="px-6 py-3">Location</th>
                  <th className="px-6 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-850">
                {institutions.map(inst => (
                  <tr key={inst.institution_id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20">
                    <td className="px-6 py-4 font-mono text-[10px] text-slate-400">INST-{inst.institution_id}</td>
                    <td className="px-6 py-4">
                      <div className="font-semibold text-slate-800 dark:text-slate-200">{inst.name}</div>
                      {inst.website && (
                        <a href={inst.website} target="_blank" rel="noreferrer" className="text-[10px] text-navy-500 hover:underline inline-flex items-center gap-0.5 mt-0.5"><Globe className="w-3 h-3" /> {inst.website}</a>
                      )}
                    </td>
                    <td className="px-6 py-4 capitalize text-slate-500">{inst.type.replace('_', ' ')}</td>
                    <td className="px-6 py-4 text-slate-500 inline-flex items-center gap-1 mt-3.5"><MapPin className="w-3.5 h-3.5 text-slate-400" /> {inst.city ? `${inst.city}, ` : ''}{inst.country}</td>
                    <td className="px-6 py-4 text-right flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleOpenEdit(inst)}
                        className="p-1.5 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg text-slate-500 hover:text-navy-650"
                        title="Edit Institution"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(inst.institution_id)}
                        className="p-1.5 border border-slate-200 dark:border-slate-800 hover:bg-red-50 dark:hover:bg-red-950/20 text-slate-500 hover:text-red-650 rounded-lg"
                        title="Delete Institution"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ADD/EDIT DIALOG MODAL */}
      {formOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col animate-scale-in">
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-950">
              <h3 className="font-bold text-sm">{editingInst ? 'Edit Institution Registry' : 'Register New Institution'}</h3>
              <button onClick={() => setFormOpen(false)} className="p-1 hover:bg-slate-200 rounded-lg"><X className="w-5 h-5" /></button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {error && (
                <div className="p-2.5 bg-red-50 text-red-655 rounded-xl text-xs flex gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-655 block">Institution Name *</label>
                <input 
                  type="text" 
                  placeholder="e.g. University of California, Berkeley"
                  required
                  className="w-full px-4 py-2 border border-slate-200 bg-slate-50 rounded-xl text-xs focus:outline-none"
                  value={name}
                  onChange={e => setName(e.target.value)}
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-655 block">Institution Type *</label>
                <select 
                  className="w-full px-4 py-2 border border-slate-200 bg-slate-50 rounded-xl text-xs focus:outline-none"
                  value={type}
                  onChange={e => setType(e.target.value as any)}
                  required
                >
                  <option value={InstitutionType.UNIVERSITY}>University</option>
                  <option value={InstitutionType.RESEARCH_INSTITUTE}>Research Institute</option>
                  <option value={InstitutionType.GOVERNMENT_LAB}>Government Lab</option>
                  <option value={InstitutionType.PRIVATE_COMPANY}>Private Company</option>
                  <option value={InstitutionType.NONPROFIT_ORGANIZATION}>Non-profit Org</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-655 block">City</label>
                  <input 
                    type="text" 
                    placeholder="e.g. Berkeley"
                    className="w-full px-4 py-2 border border-slate-200 bg-slate-50 rounded-xl text-xs focus:outline-none"
                    value={city}
                    onChange={e => setCity(e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-655 block">Country *</label>
                  <input 
                    type="text" 
                    placeholder="e.g. USA"
                    required
                    className="w-full px-4 py-2 border border-slate-200 bg-slate-50 rounded-xl text-xs focus:outline-none"
                    value={country}
                    onChange={e => setCountry(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-655 block">Website (http/https)</label>
                <input 
                  type="url" 
                  placeholder="e.g. https://berkeley.edu"
                  className="w-full px-4 py-2 border border-slate-200 bg-slate-50 rounded-xl text-xs focus:outline-none"
                  value={website}
                  onChange={e => setWebsite(e.target.value)}
                />
              </div>

              <div className="flex gap-2 justify-end pt-4 border-t border-slate-100">
                <button 
                  type="button" 
                  onClick={() => setFormOpen(false)}
                  className="px-4 py-2 border border-slate-200 bg-white rounded-xl text-xs font-semibold text-slate-550 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="px-4 py-2 bg-navy-600 hover:bg-navy-500 text-white rounded-xl text-xs font-semibold inline-flex items-center gap-1"
                >
                  <Check className="w-3.5 h-3.5" /> Save Institution
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
