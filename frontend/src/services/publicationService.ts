import type { Publication, PublicationRequest, PublicationUpdateRequest } from '../types';
import { getStoredPublications, saveStoredPublications, getStoredCollaborations, saveStoredCollaborations } from '../data/mockData';
import { AuthService } from './authService';
import { ResearcherService } from './researcherService';

export class PublicationService {
  static async getAll(): Promise<Publication[]> {
    return getStoredPublications();
  }

  static async getByResearcher(researcherId: number): Promise<Publication[]> {
    const publications = getStoredPublications();
    return publications.filter(p => p.researcher_ids?.includes(researcherId));
  }

  static async getById(publicationId: number): Promise<Publication> {
    const publications = getStoredPublications();
    const pub = publications.find(p => p.publication_id === publicationId);
    if (!pub) throw new Error("Publication not found");
    return pub;
  }

  static async create(data: PublicationRequest): Promise<Publication> {
    const currentUser = await AuthService.getCurrentUser();
    if (!currentUser) throw new Error("Not authenticated");
    
    const currentResearcher = await ResearcherService.getByUserId(currentUser.user_id);
    if (!currentResearcher) throw new Error("Please complete your researcher profile first.");

    const publications = getStoredPublications();

    if (data.doi) {
      const doiExists = publications.some(p => p.doi === data.doi);
      if (doiExists) throw new Error("A publication with this DOI is already logged.");
    }

    // Ensure the current researcher is included in the list of co-authors
    const finalResearcherIds = [...new Set([...(data.researcher_ids || []), currentResearcher.researcher_id])];

    const newPub: Publication = {
      publication_id: publications.length > 0 ? Math.max(...publications.map(p => p.publication_id)) + 1 : 1,
      title: data.title,
      abstract: data.abstract || null,
      doi: data.doi || null,
      publication_type: data.publication_type,
      status: data.status,
      file_path: null,
      publication_date: data.publication_date || new Date().toISOString().split('T')[0],
      conference_id: data.conference_id || null,
      external_authors: data.external_authors || [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      researcher_ids: finalResearcherIds
    } as any;

    publications.push(newPub);
    saveStoredPublications(publications);

    // Dynamic Collaboration Edge Creation:
    // If there are multiple authors, we update or add collaboration links between them in the mock DB.
    if (finalResearcherIds.length >= 2) {
      const collaborations = getStoredCollaborations();
      for (let i = 0; i < finalResearcherIds.length; i++) {
        for (let j = i + 1; j < finalResearcherIds.length; j++) {
          const r1 = finalResearcherIds[i];
          const r2 = finalResearcherIds[j];
          
          const existingEdge = collaborations.find(c => 
            (c.researcher_ids.includes(r1) && c.researcher_ids.includes(r2))
          );

          if (existingEdge) {
            existingEdge.collaboration_count += 1;
          } else {
            collaborations.push({
              collaboration_id: collaborations.length > 0 ? Math.max(...collaborations.map(c => c.collaboration_id)) + 1 : 1,
              researcher_ids: [r1, r2],
              collaboration_type: "Co-authored Publication",
              collaboration_count: 1,
              created_at: new Date().toISOString()
            });
          }
        }
      }
      saveStoredCollaborations(collaborations);
    }

    return newPub;
  }

  static async update(publicationId: number, data: PublicationUpdateRequest): Promise<Publication> {
    const publications = getStoredPublications();
    const index = publications.findIndex(p => p.publication_id === publicationId);

    if (index === -1) throw new Error("Publication not found.");

    if (data.doi) {
      const doiExists = publications.some(p => p.doi === data.doi && p.publication_id !== publicationId);
      if (doiExists) throw new Error("DOI belongs to another publication record.");
    }

    const updated = {
      ...publications[index],
      ...(data.title !== undefined && data.title !== null ? { title: data.title } : {}),
      ...(data.abstract !== undefined ? { abstract: data.abstract } : {}),
      ...(data.doi !== undefined ? { doi: data.doi } : {}),
      ...(data.publication_type !== undefined && data.publication_type !== null ? { publication_type: data.publication_type } : {}),
      ...(data.status !== undefined && data.status !== null ? { status: data.status } : {}),
      ...(data.publication_date !== undefined ? { publication_date: data.publication_date } : {}),
      ...(data.conference_id !== undefined ? { conference_id: data.conference_id } : {}),
      ...(data.researcher_ids !== undefined && data.researcher_ids !== null ? { researcher_ids: data.researcher_ids } : {}),
      ...(data.external_authors !== undefined && data.external_authors !== null ? { external_authors: data.external_authors } : {}),
      updated_at: new Date().toISOString()
    };

    publications[index] = updated;
    saveStoredPublications(publications);
    return updated;
  }

  static async delete(publicationId: number): Promise<void> {
    const publications = getStoredPublications();
    const filtered = publications.filter(p => p.publication_id !== publicationId);
    saveStoredPublications(filtered);
  }

  static async uploadFile(publicationId: number, file: File): Promise<Publication> {
    // Simulating upload file: PDF or DOCX format checking
    const extension = file.name.slice(file.name.lastIndexOf('.')).toLowerCase();
    if (!['.pdf', '.docx'].includes(extension)) {
      throw new Error("Invalid file extension. Only .pdf and .docx files are permitted.");
    }

    if (file.size > 10 * 1024 * 1024) {
      throw new Error("File exceeds the maximum limit of 10MB.");
    }

    const publications = getStoredPublications();
    const index = publications.findIndex(p => p.publication_id === publicationId);

    if (index === -1) throw new Error("Publication not found.");

    const mockFilePath = `/uploads/${Date.now()}_${file.name}`;
    publications[index].file_path = mockFilePath;
    publications[index].updated_at = new Date().toISOString();

    saveStoredPublications(publications);
    return publications[index];
  }
}
