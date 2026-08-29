import type { Collaboration, CollaborationRequest } from '../types';
import { getStoredCollaborations, saveStoredCollaborations, getStoredResearchers } from '../data/mockData';

export class CollaborationService {
  static async getAll(): Promise<Collaboration[]> {
    return getStoredCollaborations();
  }

  static async getByResearcher(researcherId: number): Promise<Collaboration[]> {
    const collaborations = getStoredCollaborations();
    return collaborations.filter(c => c.researcher_ids.includes(researcherId));
  }

  static async create(data: CollaborationRequest): Promise<Collaboration> {
    if (data.researcher_ids.length < 2) {
      throw new Error("Collaboration must involve at least 2 researchers.");
    }

    const uniqueIds: number[] = Array.from(new Set(data.researcher_ids));
    if (uniqueIds.length !== data.researcher_ids.length) {
      throw new Error("A researcher cannot collaborate with themselves.");
    }

    const researchers = getStoredResearchers();
    for (const rid of uniqueIds) {
      const exists = researchers.some(r => r.researcher_id === rid);
      if (!exists) throw new Error(`Researcher with ID ${rid} does not exist.`);
    }

    const collaborations = getStoredCollaborations();

    // Check if edge already exists between these two (for 2-node links)
    if (uniqueIds.length === 2) {
      const existing = collaborations.find(c => 
        c.researcher_ids.includes(uniqueIds[0]) && c.researcher_ids.includes(uniqueIds[1])
      );
      if (existing) {
        existing.collaboration_count += 1;
        if (data.collaboration_type) {
          existing.collaboration_type = data.collaboration_type;
        }
        saveStoredCollaborations(collaborations);
        return existing;
      }
    }

    const newCol: Collaboration = {
      collaboration_id: collaborations.length > 0 ? Math.max(...collaborations.map(c => c.collaboration_id)) + 1 : 1,
      researcher_ids: uniqueIds,
      collaboration_type: data.collaboration_type || "Joint Project",
      collaboration_count: 1,
      created_at: new Date().toISOString()
    };

    collaborations.push(newCol);
    saveStoredCollaborations(collaborations);
    return newCol;
  }

  static async delete(collaborationId: number): Promise<void> {
    const collaborations = getStoredCollaborations();
    const filtered = collaborations.filter(c => c.collaboration_id !== collaborationId);
    saveStoredCollaborations(filtered);
  }
}
