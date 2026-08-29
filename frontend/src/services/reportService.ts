import type { PublicationReportFilter, CollaborationReportFilter } from '../types';
import { getStoredPublications, getStoredCollaborations, getStoredResearchers } from '../data/mockData';

export class ReportService {
  static async publicationReportCsv(filters: PublicationReportFilter): Promise<void> {
    const data = await this.filterPublications(filters);
    
    // Generate CSV string
    let csv = "Publication ID,Title,Type,Status,Publication Date,DOI,Co-Authors Count\n";
    data.forEach(p => {
      const title = p.title.replace(/"/g, '""');
      csv += `${p.publication_id},"${title}",${p.publication_type},${p.status},${p.publication_date || ''},${p.doi || ''},${(p.researcher_ids || []).length}\n`;
    });

    this.triggerDownload(csv, "text/csv", "publication_report.csv");
  }

  static async publicationReportJson(filters: PublicationReportFilter): Promise<void> {
    const data = await this.filterPublications(filters);
    const jsonStr = JSON.stringify(data, null, 2);
    this.triggerDownload(jsonStr, "application/json", "publication_report.json");
  }

  static async collaborationReportCsv(filters: CollaborationReportFilter): Promise<void> {
    const collaborations = getStoredCollaborations();
    const researchers = getStoredResearchers();
    
    let filtered = collaborations;

    if (filters.researcher_id) {
      filtered = filtered.filter(c => c.researcher_ids.includes(filters.researcher_id!));
    }

    if (filters.from_date) {
      const from = new Date(filters.from_date);
      filtered = filtered.filter(c => new Date(c.created_at) >= from);
    }

    if (filters.to_date) {
      const to = new Date(filters.to_date);
      filtered = filtered.filter(c => new Date(c.created_at) <= to);
    }

    let csv = "Collaboration ID,Researcher 1,Researcher 2,Type,Count,Established Date\n";
    filtered.forEach(c => {
      const r1 = researchers.find(r => r.researcher_id === c.researcher_ids[0])?.name || `ID ${c.researcher_ids[0]}`;
      const r2 = researchers.find(r => r.researcher_id === c.researcher_ids[1])?.name || `ID ${c.researcher_ids[1]}`;
      csv += `${c.collaboration_id},"${r1}","${r2}",${c.collaboration_type || 'Unknown'},${c.collaboration_count},${c.created_at.split('T')[0]}\n`;
    });

    this.triggerDownload(csv, "text/csv", "collaboration_report.csv");
  }

  // Filter Publications Helper
  private static async filterPublications(filters: PublicationReportFilter) {
    const publications = getStoredPublications();
    let filtered = publications;

    if (filters.researcher_id) {
      filtered = filtered.filter(p => p.researcher_ids?.includes(filters.researcher_id!));
    }

    if (filters.publication_type) {
      filtered = filtered.filter(p => p.publication_type === filters.publication_type);
    }

    if (filters.status) {
      filtered = filtered.filter(p => p.status === filters.status);
    }

    if (filters.from_date) {
      const from = new Date(filters.from_date);
      filtered = filtered.filter(p => p.publication_date ? new Date(p.publication_date) >= from : false);
    }

    if (filters.to_date) {
      const to = new Date(filters.to_date);
      filtered = filtered.filter(p => p.publication_date ? new Date(p.publication_date) <= to : false);
    }

    return filtered;
  }

  // Browser download trigger
  private static triggerDownload(content: string, mimeType: string, filename: string): void {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
}
