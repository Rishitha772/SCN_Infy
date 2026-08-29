import type { ResearcherDashboard, InstitutionStats, SystemStats } from '../types';
import { 
  getStoredUsers, getStoredResearchers, getStoredPublications, 
  getStoredProjects, getStoredCollaborations, getStoredCitations,
  getStoredInstitutions
} from '../data/mockData';

export class DashboardService {
  static async getResearcherDashboard(userId: number): Promise<ResearcherDashboard> {
    const researchers = getStoredResearchers();
    const researcher = researchers.find(r => r.user_id === userId);
    
    if (!researcher) {
      throw new Error("No researcher profile linked to this user account.");
    }

    const publications = getStoredPublications().filter(p => p.researcher_ids?.includes(researcher.researcher_id));
    const projects = getStoredProjects().filter(p => p.researcher_ids?.includes(researcher.researcher_id));
    const collaborations = getStoredCollaborations().filter(c => c.researcher_ids.includes(researcher.researcher_id));
    const citations = getStoredCitations();

    // Calculate pub stats
    const byType: Record<string, number> = {};
    const byStatus: Record<string, number> = {};
    publications.forEach(p => {
      byType[p.publication_type] = (byType[p.publication_type] || 0) + 1;
      byStatus[p.status] = (byStatus[p.status] || 0) + 1;
    });

    // Calculate project stats
    let activeProjects = 0;
    let completedProjects = 0;
    projects.forEach(p => {
      if (p.status === 'active') activeProjects++;
      else if (p.status === 'completed') completedProjects++;
    });

    // Calculate total citations received by researcher's publications
    let citationCount = 0;
    const pubIds = publications.map(p => p.publication_id);
    citations.forEach(c => {
      if (pubIds.includes(c.cited_publication_id)) {
        citationCount++;
      }
    });

    return {
      researcher_id: researcher.researcher_id,
      name: researcher.name,
      publication_stats: {
        total: publications.length,
        by_type: byType,
        by_status: byStatus
      },
      project_stats: {
        total: projects.length,
        active: activeProjects,
        completed: completedProjects
      },
      collaboration_count: collaborations.length,
      citation_count: citationCount
    };
  }

  static async getInstitutionStats(institutionId: number): Promise<InstitutionStats> {
    const insts = getStoredInstitutions();
    const inst = insts.find(i => i.institution_id === institutionId);
    if (!inst) throw new Error("Institution not found.");

    const researchers = getStoredResearchers().filter(r => r.institution_id === institutionId);
    const researcherIds = researchers.map(r => r.researcher_id);

    const publications = getStoredPublications().filter(p => 
      p.researcher_ids?.some((id: number) => researcherIds.includes(id))
    );

    const activeProjects = getStoredProjects().filter(p => 
      p.status === 'active' && p.researcher_ids?.some((id: number) => researcherIds.includes(id))
    );

    return {
      institution_id: institutionId,
      name: inst.name,
      total_researchers: researchers.length,
      total_publications: publications.length,
      active_projects: activeProjects.length
    };
  }

  static async getSystemStats(): Promise<SystemStats> {
    const users = getStoredUsers();
    const researchers = getStoredResearchers();
    const insts = getStoredInstitutions();
    const pubs = getStoredPublications();
    const projs = getStoredProjects();
    const collabs = getStoredCollaborations();
    const citations = getStoredCitations();

    let pendingUsers = 0;
    let activeUsers = 0;

    users.forEach(u => {
      if (u.status === 'pending' || !u.is_verified) pendingUsers++;
      else if (u.status === 'active') activeUsers++;
    });

    return {
      total_users: users.length,
      pending_users: pendingUsers,
      active_users: activeUsers,
      total_researchers: researchers.length,
      total_institutions: insts.length,
      total_publications: pubs.length,
      total_projects: projs.length,
      total_collaborations: collabs.length,
      total_citations: citations.length
    };
  }
}
