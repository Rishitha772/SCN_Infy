import type { Project, ProjectRequest, ProjectUpdateRequest } from '../types';
import { getStoredProjects, saveStoredProjects } from '../data/mockData';
import { AuthService } from './authService';
import { ResearcherService } from './researcherService';

export class ProjectService {
  static async getAll(): Promise<Project[]> {
    return getStoredProjects();
  }

  static async getByResearcher(researcherId: number): Promise<Project[]> {
    const projects = getStoredProjects();
    return projects.filter(p => p.researcher_ids?.includes(researcherId));
  }

  static async getById(projectId: number): Promise<Project> {
    const projects = getStoredProjects();
    const proj = projects.find(p => p.project_id === projectId);
    if (!proj) throw new Error("Project not found");
    return proj;
  }

  static async create(data: ProjectRequest): Promise<Project> {
    const currentUser = await AuthService.getCurrentUser();
    if (!currentUser) throw new Error("Not authenticated");

    const currentResearcher = await ResearcherService.getByUserId(currentUser.user_id);
    if (!currentResearcher) throw new Error("Please complete your researcher profile first.");

    // Date validation
    if (data.start_date && data.end_date && new Date(data.end_date) < new Date(data.start_date)) {
      throw new Error("End date cannot be prior to start date.");
    }

    const projects = getStoredProjects();

    const finalResearcherIds = [...new Set([...(data.researcher_ids || []), currentResearcher.researcher_id])];

    const newProj: Project = {
      project_id: projects.length > 0 ? Math.max(...projects.map(p => p.project_id)) + 1 : 1,
      name: data.name,
      description: data.description || null,
      start_date: data.start_date || null,
      end_date: data.end_date || null,
      status: data.status || "active",
      created_at: new Date().toISOString(),
      researcher_ids: finalResearcherIds
    } as any;

    projects.push(newProj);
    saveStoredProjects(projects);
    return newProj;
  }

  static async update(projectId: number, data: ProjectUpdateRequest): Promise<Project> {
    const projects = getStoredProjects();
    const index = projects.findIndex(p => p.project_id === projectId);

    if (index === -1) throw new Error("Project not found.");

    const current = projects[index];
    const start = data.start_date !== undefined ? data.start_date : current.start_date;
    const end = data.end_date !== undefined ? data.end_date : current.end_date;

    if (start && end && new Date(end) < new Date(start)) {
      throw new Error("End date cannot be prior to start date.");
    }

    const updated = {
      ...current,
      ...(data.name !== undefined && data.name !== null ? { name: data.name } : {}),
      ...(data.description !== undefined ? { description: data.description } : {}),
      ...(data.start_date !== undefined ? { start_date: data.start_date } : {}),
      ...(data.end_date !== undefined ? { end_date: data.end_date } : {}),
      ...(data.status !== undefined && data.status !== null ? { status: data.status } : {}),
      ...(data.researcher_ids !== undefined && data.researcher_ids !== null ? { researcher_ids: data.researcher_ids } : {})
    };

    projects[index] = updated;
    saveStoredProjects(projects);
    return updated;
  }

  static async delete(projectId: number): Promise<void> {
    const projects = getStoredProjects();
    const filtered = projects.filter(p => p.project_id !== projectId);
    saveStoredProjects(filtered);
  }
}
