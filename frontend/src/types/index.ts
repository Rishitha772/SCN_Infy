export const UserRole = {
  RESEARCHER: "researcher",
  INSTITUTION_ADMIN: "institution_admin",
  REVIEWER: "reviewer",
  SYSTEM_ADMIN: "system_admin"
} as const;
export type UserRole = typeof UserRole[keyof typeof UserRole];

export const UserStatus = {
  PENDING: "pending",
  ACTIVE: "active",
  REJECTED: "rejected",
  BANNED: "banned"
} as const;
export type UserStatus = typeof UserStatus[keyof typeof UserStatus];

export const InstitutionType = {
  UNIVERSITY: "university",
  RESEARCH_INSTITUTE: "research_institute",
  GOVERNMENT_LAB: "government_lab",
  PRIVATE_COMPANY: "private_company",
  NONPROFIT_ORGANIZATION: "non_profit_organization"
} as const;
export type InstitutionType = typeof InstitutionType[keyof typeof InstitutionType];

export const PublicationType = {
  JOURNAL: "journal",
  CONFERENCE: "conference",
  BOOK: "book",
  PATENT: "patent",
  REPORT: "report"
} as const;
export type PublicationType = typeof PublicationType[keyof typeof PublicationType];

export const PublicationStatus = {
  DRAFT: "draft",
  SUBMITTED: "submitted",
  PUBLISHED: "published",
  ARCHIVED: "archived"
} as const;
export type PublicationStatus = typeof PublicationStatus[keyof typeof PublicationStatus];

export const ProjectStatus = {
  ACTIVE: "active",
  COMPLETED: "completed",
  CANCELLED: "cancelled"
} as const;
export type ProjectStatus = typeof ProjectStatus[keyof typeof ProjectStatus];

export const ProjectRole = {
  PI: "principal_investigator",
  CO_PI: "co_investigator",
  MEMBER: "member"
} as const;
export type ProjectRole = typeof ProjectRole[keyof typeof ProjectRole];

// --- Primary Data Entities ---

export interface User {
  user_id: number;
  email: string;
  role: UserRole;
  status: UserStatus;
  is_verified: boolean;
  pending_email?: string | null;
  requested_role?: UserRole | null;
}

export interface Researcher {
  researcher_id: number;
  user_id: number;
  name: string;
  bio?: string | null;
  department?: string | null;
  orcid?: string | null;
  skills: string[];
  research_interests: string[];
  institution_id?: number | null;
}

export interface Institution {
  institution_id: number;
  name: string;
  city: string;
  country: string;
  type: InstitutionType;
  website?: string | null;
}

export interface Publication {
  publication_id: number;
  title: string;
  abstract?: string | null;
  doi?: string | null;
  publication_type: PublicationType;
  status: PublicationStatus;
  file_path?: string | null;
  publication_date?: string | null;
  conference_id?: number | null;
  researcher_ids?: number[];
  external_authors?: string[] | null;
  created_at: string;
  updated_at: string;
}

export interface Project {
  project_id: number;
  name: string;
  description?: string | null;
  start_date?: string | null;
  end_date?: string | null;
  status: ProjectStatus;
  created_at: string;
  researcher_ids?: number[];
}

export interface Collaboration {
  collaboration_id: number;
  researcher_ids: number[];
  collaboration_type?: string | null;
  collaboration_count: number;
  created_at: string;
}

export interface Conference {
  conference_id: number;
  name: string;
  description?: string | null;
  location?: string | null;
  start_date?: string | null;
  end_date?: string | null;
  website?: string | null;
  created_at: string;
}

export interface Citation {
  citation_id: number;
  citing_publication_id: number;
  cited_publication_id: number;
  created_at: string;
}

// --- Request and Response Schemas ---

export interface UserRequest {
  email: string;
  password?: string;
  requested_role?: UserRole;
}

export interface UserUpdateRequest {
  email?: string;
  password?: string;
}

export interface VerificationCodeRequest {
  email: string;
  code: string;
}

export interface TokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
}

export interface MessageResponse {
  message: string;
}

export interface RefreshRequest {
  refresh_token: string;
}

export interface EmailChangeRequest {
  new_email: string;
}

export interface ResearcherRequest {
  name: string;
  bio?: string | null;
  department?: string | null;
  orcid?: string | null;
  skills: string[];
  research_interests: string[];
  institution_id?: number | null;
}

export interface ResearcherUpdateRequest {
  name?: string;
  bio?: string | null;
  department?: string | null;
  orcid?: string | null;
  skills?: string[];
  research_interests?: string[];
  institution_id?: number | null;
}

export interface InstitutionRequest {
  name: string;
  city?: string | null;
  country: string;
  type: InstitutionType;
  website?: string | null;
}

export interface InstitutionUpdateRequest {
  name?: string;
  city?: string | null;
  country?: string;
  type?: InstitutionType;
  website?: string | null;
}

export interface PublicationRequest {
  title: string;
  abstract?: string | null;
  doi?: string | null;
  publication_type: PublicationType;
  status: PublicationStatus;
  file_path?: string | null;
  publication_date?: string | null;
  conference_id?: number | null;
  researcher_ids?: number[];
  external_authors?: string[];
}

export interface PublicationUpdateRequest {
  title?: string;
  abstract?: string | null;
  doi?: string | null;
  publication_type?: PublicationType;
  status?: PublicationStatus;
  file_path?: string | null;
  publication_date?: string | null;
  conference_id?: number | null;
  researcher_ids?: number[];
  external_authors?: string[];
}

export interface ProjectRequest {
  name: string;
  description?: string | null;
  start_date?: string | null;
  end_date?: string | null;
  status: ProjectStatus;
  researcher_ids?: number[];
}

export interface ProjectUpdateRequest {
  name?: string;
  description?: string | null;
  start_date?: string | null;
  end_date?: string | null;
  status?: ProjectStatus;
  researcher_ids?: number[];
}

export interface CollaborationRequest {
  researcher_ids: number[];
  collaboration_type?: string | null;
}

export interface ConferenceRequest {
  name: string;
  description?: string | null;
  location?: string | null;
  start_date?: string | null;
  end_date?: string | null;
  website?: string | null;
}

export interface ConferenceUpdateRequest {
  name?: string;
  description?: string | null;
  location?: string | null;
  start_date?: string | null;
  end_date?: string | null;
  website?: string | null;
}

export interface CitationRequest {
  citing_publication_id: number;
  cited_publication_ids: number[];
}

export interface PublicationReportFilter {
  researcher_id?: number;
  institution_id?: number;
  publication_type?: PublicationType;
  status?: PublicationStatus;
  from_date?: string;
  to_date?: string;
}

export interface CollaborationReportFilter {
  researcher_id?: number;
  institution_id?: number;
  from_date?: string;
  to_date?: string;
}

// --- Aggregate Analytics Schemas ---

export interface PublicationStats {
  total: number;
  by_type: Record<string, number>;
  by_status: Record<string, number>;
}

export interface ProjectStats {
  total: number;
  active: number;
  completed: number;
}

export interface ResearcherDashboard {
  researcher_id: number;
  name: string;
  publication_stats: PublicationStats;
  project_stats: ProjectStats;
  collaboration_count: number;
  citation_count: number;
}

export interface InstitutionStats {
  institution_id: number;
  name: string;
  total_researchers: number;
  total_publications: number;
  active_projects: number;
}

export interface SystemStats {
  total_users: number;
  pending_users: number;
  active_users: number;
  total_researchers: number;
  total_institutions: number;
  total_publications: number;
  total_projects: number;
  total_collaborations: number;
  total_citations: number;
}
