import React, { useEffect, useState } from 'react';
import { ConferenceService } from '../../services/conferenceService';
import type { Conference } from '../../types';
import { Calendar, Plus, Edit, Trash2, X, Check, Globe, MapPin, AlertCircle } from 'lucide-react';

export const ConferencesAdmin: React.FC = () => {
  const [conferences, setConferences] = useState<Conference[]>([]);
  const [loading, setLoading] = useState(true);

  // Form State
  const [formOpen, setFormOpen] = useState(false);
  const [editingConf, setEditingConf] = useState<Conference | null>(null);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [website, setWebsite] = useState('');
  
  const [error, setError] = useState('');

  const loadConferences = async () => {
    setLoading(true);
    try {
      const list = await ConferenceService.getAll();
      setConferences(list);
    } catch (err) {
      console.error("Failed to load conferences:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadConferences();
  }, []);

  const handleOpenAdd = () => {
    setEditingConf(null);
    setName('');
    setDescription('');
    setLocation('');
    setStartDate('');
    setEndDate('');
    setWebsite('');
    setError('');
    setFormOpen(true);
  };

  const handleOpenEdit = (c: Conference) => {
    setEditingConf(c);
    setName(c.name);
    setDescription(c.description || '');
    setLocation(c.location || '');
    setStartDate(c.start_date || '');
    setEndDate(c.end_date || '');
    setWebsite(c.website || '');
    setError('');
    setFormOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (name.length < 5) {
      setError("Conference name must be at least 5 characters long.");
      return;
    }

    if (startDate && endDate && new Date(endDate) < new Date(startDate)) {
      setError("End date cannot be prior to start date.");
      return;
    }

    try {
      if (editingConf) {
        await ConferenceService.update(editingConf.conference_id, {
          name,
          description: description.trim() || null,
          location: location.trim() || null,
          start_date: startDate || null,
          end_date: endDate || null,
          website: website.trim() || null as any
        });
      } else {
        await ConferenceService.create({
          name,
          description: description.trim() || null,
          location: location.trim() || null,
          start_date: startDate || null,
          end_date: endDate || null,
          website: website.trim() || null as any
        });
      }
      setFormOpen(false);
      loadConferences();
      alert(`Conference ${editingConf ? 'updated' : 'registered'} successfully.`);
    } catch (err: any) {
      setError(err.message || "Failed to save conference.");
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm("Remove this conference registry? Associated publications will have conference unlinked.")) return;
    try {
      await ConferenceService.delete(id);
      loadConferences();
    } catch (err: any) {
      alert(err.message || "Deletion failed.");
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-200/50 dark:border-slate-800/50 pb-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Calendar className="w-8 h-8 text-red-650" />
            Conferences Administration
          </h1>
          <p className="text-slate-500 text-sm">Register upcoming symposiums, locations, and link website URLs.</p>
        </div>
        <button 
          onClick={handleOpenAdd}
          className="px-3.5 py-2 bg-navy-600 hover:bg-navy-500 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-md shadow-navy-500/10 transition-all hover:scale-[1.01]"
        >
          <Plus className="w-4 h-4" /> Add Conference
        </button>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <div className="w-10 h-10 border-4 border-red-500 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-slate-500 text-sm font-semibold">Retrieving global conference lists...</span>
        </div>
      ) : conferences.length === 0 ? (
        <div className="p-8 text-center text-xs text-slate-450 border border-slate-200 bg-white dark:bg-slate-900 rounded-2xl shadow-sm">
          No conferences currently registered.
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/60 rounded-2xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs divide-y divide-slate-150 dark:divide-slate-800">
              <thead>
                <tr className="bg-slate-50/50 dark:bg-slate-950/20 text-slate-450 font-semibold">
                  <th className="px-6 py-3">ID</th>
                  <th className="px-6 py-3">Conference Name</th>
                  <th className="px-6 py-3">Location</th>
                  <th className="px-6 py-3">Dates</th>
                  <th className="px-6 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-850">
                {conferences.map(c => (
                  <tr key={c.conference_id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20">
                    <td className="px-6 py-4 font-mono text-[10px] text-slate-400">CONF-{c.conference_id}</td>
                    <td className="px-6 py-4 font-semibold text-slate-800 dark:text-slate-200">
                      <div>{c.name}</div>
                      {c.website && (
                        <a href={String(c.website)} target="_blank" rel="noreferrer" className="text-[10px] text-navy-500 hover:underline inline-flex items-center gap-0.5 mt-0.5"><Globe className="w-3 h-3" /> {String(c.website)}</a>
                      )}
                    </td>
                    <td className="px-6 py-4 text-slate-500 inline-flex items-center gap-1 mt-3.5"><MapPin className="w-3.5 h-3.5 text-slate-400" /> {c.location || 'Virtual'}</td>
                    <td className="px-6 py-4 text-slate-500">{c.start_date || 'N/A'} - {c.end_date || 'N/A'}</td>
                    <td className="px-6 py-4 text-right flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleOpenEdit(c)}
                        className="p-1.5 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg text-slate-500 hover:text-navy-650"
                        title="Edit Details"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(c.conference_id)}
                        className="p-1.5 border border-slate-200 dark:border-slate-800 hover:bg-red-50 dark:hover:bg-red-950/20 text-slate-500 hover:text-red-650 rounded-lg"
                        title="Delete Conference"
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

      {/* FORM DIALOG */}
      {formOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col animate-scale-in">
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-950">
              <h3 className="font-bold text-sm">{editingConf ? 'Edit Conference Registry' : 'Register New Conference'}</h3>
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
                <label className="text-xs font-semibold text-slate-655 block">Conference Name *</label>
                <input 
                  type="text" 
                  placeholder="e.g. International Conference on Graph Networks 2026"
                  required
                  className="w-full px-4 py-2 border border-slate-200 bg-slate-50 rounded-xl text-xs focus:outline-none"
                  value={name}
                  onChange={e => setName(e.target.value)}
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-655 block">Description</label>
                <textarea 
                  rows={2}
                  placeholder="Focus topics, organizers, etc."
                  className="w-full px-4 py-2 border border-slate-200 bg-slate-50 rounded-xl text-xs focus:outline-none"
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-655 block">Location</label>
                <input 
                  type="text" 
                  placeholder="e.g. Geneva, Switzerland"
                  className="w-full px-4 py-2 border border-slate-200 bg-slate-50 rounded-xl text-xs focus:outline-none"
                  value={location}
                  onChange={e => setLocation(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-655 block">Start Date</label>
                  <input 
                    type="date" 
                    className="w-full px-4 py-1.5 border border-slate-200 bg-slate-50 rounded-xl text-xs focus:outline-none"
                    value={startDate}
                    onChange={e => setStartDate(e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-655 block">End Date</label>
                  <input 
                    type="date" 
                    className="w-full px-4 py-1.5 border border-slate-200 bg-slate-50 rounded-xl text-xs focus:outline-none"
                    value={endDate}
                    onChange={e => setEndDate(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-655 block">Website URL (http/https)</label>
                <input 
                  type="url" 
                  placeholder="e.g. https://icgn2026.org"
                  className="w-full px-4 py-2 border border-slate-200 bg-slate-50 rounded-xl text-xs focus:outline-none"
                  value={website}
                  onChange={e => setWebsite(e.target.value)}
                />
              </div>

              <div className="flex gap-2 justify-end pt-4 border-t border-slate-100">
                <button 
                  type="button" 
                  onClick={() => setFormOpen(false)}
                  className="px-4 py-2 border border-slate-200 bg-white rounded-xl text-xs font-semibold text-slate-500 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="px-4 py-2 bg-navy-600 hover:bg-navy-500 text-white rounded-xl text-xs font-semibold inline-flex items-center gap-1"
                >
                  <Check className="w-3.5 h-3.5" /> Save Conference
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
