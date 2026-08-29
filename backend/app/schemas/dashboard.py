from pydantic import BaseModel


class PublicationStats(BaseModel):
    total: int
    by_type: dict[str, int]
    by_status: dict[str, int]


class ProjectStats(BaseModel):
    total: int
    active: int
    completed: int


class ResearcherDashboard(BaseModel):
    researcher_id: int
    name: str
    publication_stats: PublicationStats
    project_stats: ProjectStats
    collaboration_count: int
    citation_count: int


class InstitutionStats(BaseModel):
    institution_id: int
    name: str
    total_researchers: int
    total_publications: int
    active_projects: int


class SystemStats(BaseModel):
    total_users: int
    pending_users: int
    active_users: int
    total_researchers: int
    total_institutions: int
    total_publications: int
    total_projects: int
    total_collaborations: int
    total_citations: int
