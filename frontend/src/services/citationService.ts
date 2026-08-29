import type { Citation, CitationRequest } from '../types';
import { getStoredCitations, saveStoredCitations, getStoredPublications } from '../data/mockData';

export class CitationService {
  static async create(data: CitationRequest): Promise<Citation[]> {
    const publications = getStoredPublications();
    
    // Validate citing publication
    const citingExists = publications.some(p => p.publication_id === data.citing_publication_id);
    if (!citingExists) {
      throw new Error(`Citing publication with ID ${data.citing_publication_id} does not exist.`);
    }

    if (data.cited_publication_ids.includes(data.citing_publication_id)) {
      throw new Error("A publication cannot cite itself.");
    }

    const uniqueCitedIds: number[] = Array.from(new Set(data.cited_publication_ids));
    if (uniqueCitedIds.length !== data.cited_publication_ids.length) {
      throw new Error("Duplicate cited publication IDs are not allowed.");
    }

    // Verify all cited papers exist
    for (const id of uniqueCitedIds) {
      const exists = publications.some(p => p.publication_id === id);
      if (!exists) {
        throw new Error(`Cited publication with ID ${id} does not exist.`);
      }
    }

    const citations = getStoredCitations();
    const created: Citation[] = [];

    for (const citedId of uniqueCitedIds) {
      // Check if citation link already exists
      const exists = citations.some(c => 
        c.citing_publication_id === data.citing_publication_id && 
        c.cited_publication_id === citedId
      );

      if (!exists) {
        const newCit: Citation = {
          citation_id: citations.length > 0 ? Math.max(...citations.map(c => c.citation_id)) + 1 : 1,
          citing_publication_id: data.citing_publication_id,
          cited_publication_id: citedId,
          created_at: new Date().toISOString()
        };
        citations.push(newCit);
        created.push(newCit);
      }
    }

    saveStoredCitations(citations);
    return created;
  }

  static async getByPublication(publicationId: number): Promise<Citation[]> {
    const citations = getStoredCitations();
    // References made by this publication (which papers did this paper cite)
    return citations.filter(c => c.citing_publication_id === publicationId);
  }

  static async getCitedBy(publicationId: number): Promise<Citation[]> {
    const citations = getStoredCitations();
    // Papers citing this publication (which papers cited this paper)
    return citations.filter(c => c.cited_publication_id === publicationId);
  }

  static async delete(citationId: number): Promise<void> {
    const citations = getStoredCitations();
    const filtered = citations.filter(c => c.citation_id !== citationId);
    saveStoredCitations(filtered);
  }
}
