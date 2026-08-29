import type { Conference, ConferenceRequest, ConferenceUpdateRequest } from '../types';
import { getStoredConferences, saveStoredConferences } from '../data/mockData';

export class ConferenceService {
  static async getAll(): Promise<Conference[]> {
    return getStoredConferences();
  }

  static async getById(conferenceId: number): Promise<Conference> {
    const conferences = getStoredConferences();
    const conf = conferences.find(c => c.conference_id === conferenceId);
    if (!conf) throw new Error("Conference not found.");
    return conf;
  }

  static async create(data: ConferenceRequest): Promise<Conference> {
    if (data.start_date && data.end_date && new Date(data.end_date) < new Date(data.start_date)) {
      throw new Error("End date cannot be before start date.");
    }

    const conferences = getStoredConferences();
    const newConf: Conference = {
      conference_id: conferences.length > 0 ? Math.max(...conferences.map(c => c.conference_id)) + 1 : 1,
      name: data.name,
      description: data.description || null,
      location: data.location || null,
      start_date: data.start_date || null,
      end_date: data.end_date || null,
      website: data.website ? String(data.website) : null,
      created_at: new Date().toISOString()
    } as any;

    conferences.push(newConf);
    saveStoredConferences(conferences);
    return newConf;
  }

  static async update(conferenceId: number, data: ConferenceUpdateRequest): Promise<Conference> {
    const conferences = getStoredConferences();
    const index = conferences.findIndex(c => c.conference_id === conferenceId);

    if (index === -1) throw new Error("Conference not found.");

    const current = conferences[index];
    const start = data.start_date !== undefined ? data.start_date : current.start_date;
    const end = data.end_date !== undefined ? data.end_date : current.end_date;

    if (start && end && new Date(end) < new Date(start)) {
      throw new Error("End date cannot be before start date.");
    }

    const updated = {
      ...current,
      ...(data.name !== undefined && data.name !== null ? { name: data.name } : {}),
      ...(data.description !== undefined ? { description: data.description } : {}),
      ...(data.location !== undefined ? { location: data.location } : {}),
      ...(data.start_date !== undefined ? { start_date: data.start_date } : {}),
      ...(data.end_date !== undefined ? { end_date: data.end_date } : {}),
      ...(data.website !== undefined ? { website: data.website ? String(data.website) : null } : {})
    };

    conferences[index] = updated;
    saveStoredConferences(conferences);
    return updated;
  }

  static async delete(conferenceId: number): Promise<void> {
    const conferences = getStoredConferences();
    const filtered = conferences.filter(c => c.conference_id !== conferenceId);
    saveStoredConferences(filtered);
  }
}
