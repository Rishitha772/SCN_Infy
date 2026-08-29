import type { 
  User, Researcher, Institution, Publication, 
  Project, Conference, Collaboration, Citation
} from '../types';
import { 
  UserRole, UserStatus, InstitutionType, PublicationType, 
  PublicationStatus, ProjectStatus
} from '../types';

// Helper to load/save from localStorage
const loadFromStorage = <T>(key: string, defaultValue: T): T => {
  const stored = localStorage.getItem(key);
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch {
      return defaultValue;
    }
  }
  return defaultValue;
};

const saveToStorage = <T>(key: string, value: T): void => {
  localStorage.setItem(key, JSON.stringify(value));
};

// Initial Data Definitions
const INITIAL_USERS: User[] = [
  {
    user_id: 1,
    email: "dr.singhal@university.edu",
    role: UserRole.RESEARCHER,
    status: UserStatus.ACTIVE,
    is_verified: true
  },
  {
    user_id: 2,
    email: "dr.khandesh@university.edu",
    role: UserRole.RESEARCHER,
    status: UserStatus.ACTIVE,
    is_verified: true
  },
  {
    user_id: 3,
    email: "dr.smith@university.edu",
    role: UserRole.RESEARCHER,
    status: UserStatus.ACTIVE,
    is_verified: true
  },
  {
    user_id: 4,
    email: "admin@university.edu",
    role: UserRole.SYSTEM_ADMIN,
    status: UserStatus.ACTIVE,
    is_verified: true
  },
  {
    user_id: 5,
    email: "reviewer@university.edu",
    role: UserRole.REVIEWER,
    status: UserStatus.ACTIVE,
    is_verified: true
  },
  {
    user_id: 6,
    email: "pending@university.edu",
    role: UserRole.RESEARCHER,
    status: UserStatus.PENDING,
    is_verified: false,
    requested_role: UserRole.RESEARCHER
  },
  {
    user_id: 7,
    email: "inst_admin@university.edu",
    role: UserRole.INSTITUTION_ADMIN,
    status: UserStatus.ACTIVE,
    is_verified: true
  }
];

const INITIAL_RESEARCHERS: Researcher[] = [
  {
    researcher_id: 1,
    user_id: 1,
    name: "Dr. Rishabh Singhal",
    bio: "Associate Professor of Computer Science specializing in network theory, graph algorithms, and autonomous agent systems.",
    department: "Computer Science",
    orcid: "0000-0002-1823-4521",
    skills: ["Graph Networks", "Python", "React", "AI Routing", "Network Analysis"],
    research_interests: ["Network Analytics", "Agentic Coding", "Social Network Analysis", "Semantic Search"],
    institution_id: 1
  },
  {
    researcher_id: 2,
    user_id: 2,
    name: "Dr. Rishitha Khandesh",
    bio: "Professor of Data Science and Web Analytics. Research focuses on styled design systems, HCI, and visual network modeling.",
    department: "Information Technology",
    orcid: "0000-0003-9912-7312",
    skills: ["CSS Grid", "Tailwind CSS", "Data Science", "TypeScript", "UI Design"],
    research_interests: ["Visual Analytics", "Academic Networks", "HCI", "Data Visualization"],
    institution_id: 1
  },
  {
    researcher_id: 3,
    user_id: 3,
    name: "Dr. John Smith",
    bio: "Deep Learning Specialist. Focused on NLP architectures, transformer models, and semantic representations in search engines.",
    department: "EECS",
    orcid: "0000-0001-7231-1022",
    skills: ["PyTorch", "NLP", "Transformers", "Python", "BERT"],
    research_interests: ["Transformers", "Semantics", "Machine Learning", "Recommendation Systems"],
    institution_id: 2
  }
];

const INITIAL_INSTITUTIONS: Institution[] = [
  {
    institution_id: 1,
    name: "University of Scientific Collaboration",
    city: "San Francisco",
    country: "United States",
    type: InstitutionType.UNIVERSITY,
    website: "https://university.edu"
  },
  {
    institution_id: 2,
    name: "Massachusetts Institute of Technology",
    city: "Cambridge",
    country: "United States",
    type: InstitutionType.UNIVERSITY,
    website: "https://mit.edu"
  },
  {
    institution_id: 3,
    name: "National Research Institute",
    city: "Munich",
    country: "Germany",
    type: InstitutionType.RESEARCH_INSTITUTE,
    website: "https://nri.de"
  }
];

const INITIAL_PUBLICATIONS: Publication[] = [
  {
    publication_id: 1,
    title: "Analyzing Scientific Collaborations via Agentic Graph Architectures",
    abstract: "This paper presents a novel framework for analyzing scientific collaboration networks using autonomous agentic processes. We map researchers as graph nodes and analyze edge densities to discover hidden expert connections, applying reinforcement models to predict collaboration successes.",
    doi: "10.1145/3318464.3389700",
    publication_type: PublicationType.JOURNAL,
    status: PublicationStatus.PUBLISHED,
    file_path: "/uploads/agentic_graphs.pdf",
    publication_date: "2025-05-12",
    conference_id: null,
    external_authors: ["Dr. Sarah Connor"],
    created_at: "2025-05-12T10:00:00Z",
    updated_at: "2025-05-12T10:00:00Z",
    researcher_ids: [1, 2] // Singhal, Khandesh
  },
  {
    publication_id: 2,
    title: "A Visual Interface for Interactive Academic Exchanges",
    abstract: "Depicting dynamic, multi-dimensional networks on web interfaces presents styling and performance bottlenecks. This paper discusses styling conventions, CSS layouts, and WebGL fallbacks to render 5000+ edge connections smoothly for interactive desktop and tablet dashboards.",
    doi: "10.1149/1.38721",
    publication_type: PublicationType.CONFERENCE,
    status: PublicationStatus.PUBLISHED,
    file_path: null,
    publication_date: "2025-11-20",
    conference_id: 1,
    external_authors: [],
    created_at: "2025-11-20T14:30:00Z",
    updated_at: "2025-11-20T14:30:00Z",
    researcher_ids: [2] // Khandesh
  },
  {
    publication_id: 3,
    title: "Large Scale Transformers in Scholarly Search Engine Recommendations",
    abstract: "Scholarly publications are growing exponentially. We evaluate transformer-based semantic search to link citation contexts. In our experiments, semantic similarity indices outperform traditional bag-of-words indexations by 42% on recall tests.",
    doi: "10.1109/LST.2026.9",
    publication_type: PublicationType.JOURNAL,
    status: PublicationStatus.SUBMITTED,
    file_path: "/uploads/scholarly_transformers.pdf",
    publication_date: "2026-03-01",
    conference_id: null,
    external_authors: ["Emily Blunt"],
    created_at: "2026-03-01T09:15:00Z",
    updated_at: "2026-03-01T09:15:00Z",
    researcher_ids: [3, 1] // Smith, Singhal
  }
];

const INITIAL_PROJECTS: Project[] = [
  {
    project_id: 1,
    name: "Graph Mining for Academic Networks",
    description: "Developing visual graphs, mining connectivity weights between institutions, and constructing prediction metrics for future funding targets based on network densities.",
    start_date: "2024-01-01",
    end_date: "2026-12-31",
    status: ProjectStatus.ACTIVE,
    created_at: "2024-01-01T08:00:00Z",
    researcher_ids: [1, 2]
  },
  {
    project_id: 2,
    name: "Self-Correcting Agent Interfaces",
    description: "A research project exploring double-verification loops in agentic software engineering to reduce compilation faults and optimize execution pathfinding.",
    start_date: "2025-06-01",
    end_date: "2026-06-01",
    status: ProjectStatus.COMPLETED,
    created_at: "2025-06-01T09:00:00Z",
    researcher_ids: [1]
  }
];

const INITIAL_CONFERENCES: Conference[] = [
  {
    conference_id: 1,
    name: "International Conference on Graph Networks (ICGN 2026)",
    description: "The premier global conference focusing on graph algorithms, node properties, and applications to semantic and citation networks.",
    location: "Zurich, Switzerland",
    start_date: "2026-09-15",
    end_date: "2026-09-18",
    website: "https://icgn2026.org",
    created_at: "2026-01-10T12:00:00Z"
  },
  {
    conference_id: 2,
    name: "World Academic Summit (WAS 2026)",
    description: "Annual forum bringing together university presidents, researchers, and tech policy experts to debate collaboration networks and global grants.",
    location: "London, UK",
    start_date: "2026-11-02",
    end_date: "2026-11-05",
    website: "https://was2026.com",
    created_at: "2026-02-15T10:00:00Z"
  }
];

const INITIAL_COLLABORATIONS: Collaboration[] = [
  {
    collaboration_id: 1,
    researcher_ids: [1, 2],
    collaboration_type: "Joint Publication",
    collaboration_count: 2,
    created_at: "2025-05-12T10:00:00Z"
  },
  {
    collaboration_id: 2,
    researcher_ids: [1, 3],
    collaboration_type: "Research Grant Proposal",
    collaboration_count: 1,
    created_at: "2026-03-01T09:15:00Z"
  }
];

const INITIAL_CITATIONS: Citation[] = [
  {
    citation_id: 1,
    citing_publication_id: 1,
    cited_publication_id: 2,
    created_at: "2025-05-12T10:00:00Z"
  },
  {
    citation_id: 2,
    citing_publication_id: 3,
    cited_publication_id: 1,
    created_at: "2026-03-01T09:15:00Z"
  }
];

// LocalStorage Persistent Store Hooks
export const getStoredUsers = () => loadFromStorage<User[]>("scn_users", INITIAL_USERS);
export const saveStoredUsers = (users: User[]) => saveToStorage("scn_users", users);

export const getStoredResearchers = () => loadFromStorage<Researcher[]>("scn_researchers", INITIAL_RESEARCHERS);
export const saveStoredResearchers = (res: Researcher[]) => saveToStorage("scn_researchers", res);

export const getStoredInstitutions = () => loadFromStorage<Institution[]>("scn_institutions", INITIAL_INSTITUTIONS);
export const saveStoredInstitutions = (inst: Institution[]) => saveToStorage("scn_institutions", inst);

export const getStoredPublications = () => {
  // We need to fetch publication data with their researcher links
  return loadFromStorage<Publication[]>("scn_publications", INITIAL_PUBLICATIONS);
};
export const saveStoredPublications = (pub: Publication[]) => saveToStorage("scn_publications", pub);

export const getStoredProjects = () => loadFromStorage<Project[]>("scn_projects", INITIAL_PROJECTS);
export const saveStoredProjects = (proj: Project[]) => saveToStorage("scn_projects", proj);

export const getStoredConferences = () => loadFromStorage<Conference[]>("scn_conferences", INITIAL_CONFERENCES);
export const saveStoredConferences = (conf: Conference[]) => saveToStorage("scn_conferences", conf);

export const getStoredCollaborations = () => loadFromStorage<Collaboration[]>("scn_collaborations", INITIAL_COLLABORATIONS);
export const saveStoredCollaborations = (col: Collaboration[]) => saveToStorage("scn_collaborations", col);

export const getStoredCitations = () => loadFromStorage<Citation[]>("scn_citations", INITIAL_CITATIONS);
export const saveStoredCitations = (cit: Citation[]) => saveToStorage("scn_citations", cit);

// Helper to reset dataset to defaults
export const resetToDefaults = () => {
  localStorage.removeItem("scn_users");
  localStorage.removeItem("scn_researchers");
  localStorage.removeItem("scn_institutions");
  localStorage.removeItem("scn_publications");
  localStorage.removeItem("scn_projects");
  localStorage.removeItem("scn_conferences");
  localStorage.removeItem("scn_collaborations");
  localStorage.removeItem("scn_citations");
  window.location.reload();
};
