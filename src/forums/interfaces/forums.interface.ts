import { Forum } from "../entities/forum.entity";

export interface GetAllForumsOptions {
  courseId: string;
  search?: string;
  page?: number;
  limit?: number;
  tenantId: string;
}

export interface ForumStats {
  totalForums: number;
  totalThreads: number;
  totalPosts: number;
  activeUsers: number;
}

export interface PaginatedForumResponse {
  data: Forum[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
  stats: ForumStats;
}