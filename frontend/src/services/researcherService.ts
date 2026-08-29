import type { Researcher, ResearcherRequest, ResearcherUpdateRequest } from '../types';
import { getStoredResearchers, saveStoredResearchers } from '../data/mockData';
import { AuthService } from './authService';

export class ResearcherService {
  static async getAll(): Promise<Researcher[]> {
    return getStoredResearchers();
  }

  static async getById(researcherId: number): Promise<Researcher> {
    const researchers = getStoredResearchers();
    const res = researchers.find(r => r.researcher_id === researcherId);
    if (!res) throw new Error("Researcher profile not found");
    return res;
  }

  static async getByUserId(userId: number): Promise<Researcher | null> {
    const researchers = getStoredResearchers();
    return researchers.find(r => r.user_id === userId) || null;
  }

  static async create(data: ResearcherRequest): Promise<Researcher> {
    const currentUser = await AuthService.getCurrentUser();
    if (!currentUser) throw new Error("Not authenticated");

    const researchers = getStoredResearchers();
    const existing = researchers.find(r => r.user_id === currentUser.user_id);
    if (existing) throw new Error("Researcher profile already exists for this user.");

    if (data.orcid) {
      const orcidExists = researchers.some(r => r.orcid === data.orcid);
      if (orcidExists) throw new Error("ORCID identifier already registered by another profile.");
    }

    const newProfile: Researcher = {
      researcher_id: researchers.length > 0 ? Math.max(...researchers.map(r => r.researcher_id)) + 1 : 1,
      user_id: currentUser.user_id,
      name: data.name,
      bio: data.bio || null,
      department: data.department || null,
      orcid: data.orcid || null,
      skills: data.skills || [],
      research_interests: data.research_interests || [],
      institution_id: data.institution_id || null
    };

    researchers.push(newProfile);
    saveStoredResearchers(researchers);

    return newProfile;
  }

  static async update(data: ResearcherUpdateRequest): Promise<Researcher> {
    const currentUser = await AuthService.getCurrentUser();
    if (!currentUser) throw new Error("Not authenticated");

    const researchers = getStoredResearchers();
    const index = researchers.findIndex(r => r.user_id === currentUser.user_id);

    if (index === -1) throw new Error("Researcher profile not found. Please create one first.");

    if (data.orcid) {
      const orcidExists = researchers.some(r => r.orcid === data.orcid && r.user_id !== currentUser.user_id);
      if (orcidExists) throw new Error("ORCID identifier is already in use by another researcher.");
    }

    const updated = {
      ...researchers[index],
      ...(data.name !== undefined && data.name !== null ? { name: data.name } : {}),
      ...(data.bio !== undefined ? { bio: data.bio } : {}),
      ...(data.department !== undefined ? { department: data.department } : {}),
      ...(data.orcid !== undefined ? { orcid: data.orcid } : {}),
      ...(data.skills !== undefined && data.skills !== null ? { skills: data.skills } : {}),
      ...(data.research_interests !== undefined && data.research_interests !== null ? { research_interests: data.research_interests } : {}),
      ...(data.institution_id !== undefined ? { institution_id: data.institution_id } : {})
    };

    researchers[index] = updated;
    saveStoredResearchers(researchers);

    return updated;
  }

  static async delete(): Promise<void> {
    const currentUser = await AuthService.getCurrentUser();
    if (!currentUser) throw new Error("Not authenticated");

    const researchers = getStoredResearchers();
    const filtered = researchers.filter(r => r.user_id !== currentUser.user_id);
    saveStoredResearchers(filtered);
  }
}
