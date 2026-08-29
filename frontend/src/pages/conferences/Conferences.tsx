import React, { useEffect, useState } from 'react';
import { ConferenceService } from '../../services/conferenceService';
import { PublicationService } from '../../services/publicationService';
import { ResearcherService } from '../../services/researcherService';
import type { Conference } from '../../types';
import { Search, MapPin, Calendar, Globe, BookOpen, Users } from 'lucide-react';

export const Conferences: React.FC = () => {
  const [conferences, setConferences] = useState<Conference[]>([]);
  
  // Stats mapping to show related papers/scholars
  const [relatedPubsCount, setRelatedPubsCount] = useState<Record<number, number>>({});
  const [relatedResCount, setRelatedResCount] = useState<Record<number, number>>({});

  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadConferences = async () => {
      setLoading(true);
      try {
        const confs = await ConferenceService.getAll();
        setConferences(confs);

        const pubs = await PublicationService.getAll();
        await ResearcherService.getAll(); // keep mock call to load but don't assign unused res

        const pubsCount: Record<number, number> = {};
        const resCount: Record<number, number> = {};

        confs.forEach(c => {
          const matchedPubs = pubs.filter(p => p.conference_id === c.conference_id);
          pubsCount[c.conference_id] = matchedPubs.length;

          // Get unique researcher IDs who published here
          const researcherIds = new Set<number>();
          matchedPubs.forEach(p => p.researcher_ids?.forEach(id => researcherIds.add(id)));
          resCount[c.conference_id] = researcherIds.size;
        });

        setRelatedPubsCount(pubsCount);
        setRelatedResCount(resCount);

      } catch (err) {
        console.error("Failed to load conferences:", err);
      } finally {
        setLoading(false);
      }
    };
    loadConferences();
  }, []);

  const filteredConfs = conferences.filter(c => 
    c.name.toLowerCase().includes(query.toLowerCase()) ||
    (c.description && c.description.toLowerCase().includes(query.toLowerCase())) ||
    (c.location && c.location.toLowerCase().includes(query.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Academic Conferences</h1>
          <p className="text-slate-500 text-sm">Discover international symposiums, dates, and related scientific outputs.</p>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative border border-slate-200/60 dark:border-slate-800/60 bg-white dark:bg-slate-900 p-4 rounded-2xl shadow-sm">
        <input 
          type="text"
          placeholder="Search by conference name, location details, topic keywords..."
          className="w-full pl-10 pr-4 py-2 border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 rounded-xl text-xs focus:border-navy-500 focus:outline-none transition-colors"
          value={query}
          onChange={e => setQuery(e.target.value)}
        />
        <Search className="absolute left-7 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
      </div>

      {/* Grid */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <div className="w-10 h-10 border-4 border-navy-500 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-slate-500 text-sm font-semibold">Retrieving conference schedules...</span>
        </div>
      ) : filteredConfs.length === 0 ? (
        <div className="p-8 text-center text-xs text-slate-400 border border-slate-200 bg-white dark:bg-slate-900 rounded-2xl shadow-sm">
          No conferences found matching your search.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredConfs.map(c => {
            const pCount = relatedPubsCount[c.conference_id] || 0;
            const rCount = relatedResCount[c.conference_id] || 0;

            return (
              <div 
                key={c.conference_id}
                className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/60 p-6 rounded-2xl shadow-sm flex flex-col justify-between hover:border-slate-300 dark:hover:border-slate-700 transition-all"
              >
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <h3 className="font-bold text-base leading-snug text-slate-855 dark:text-slate-100 line-clamp-1">{c.name}</h3>
                    
                    {/* Location & Dates */}
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-slate-500 text-[10px] font-medium">
                      <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" /> {c.location || 'Virtual'}</span>
                      <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" /> {c.start_date || 'N/A'} - {c.end_date || 'N/A'}</span>
                    </div>
                  </div>

                  <p className="text-xs text-slate-650 dark:text-slate-400 leading-relaxed line-clamp-3">{c.description || 'No description guidelines provided.'}</p>
                </div>

                {/* Footer specs */}
                <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-850 flex items-center justify-between">
                  <div className="flex gap-4 text-[10px] text-slate-500 font-semibold">
                    <span className="flex items-center gap-1 font-semibold text-navy-600"><BookOpen className="w-3.5 h-3.5" /> Papers: {pCount}</span>
                    <span className="flex items-center gap-1 font-semibold text-emerald-600"><Users className="w-3.5 h-3.5" /> Scholars: {rCount}</span>
                  </div>
                  {c.website && (
                    <a 
                      href={String(c.website)} 
                      target="_blank" 
                      rel="noreferrer" 
                      className="px-3.5 py-1.5 border border-slate-200 dark:border-slate-800 bg-slate-50 hover:bg-slate-100 dark:bg-slate-950 dark:hover:bg-slate-800 rounded-xl text-xs font-semibold inline-flex items-center gap-1 shadow-sm text-navy-500 dark:text-navy-400"
                    >
                      <Globe className="w-3.5 h-3.5" /> Website
                    </a>
                  )}
                </div>

              </div>
            );
          })}
        </div>
      )}

    </div>
  );
};
