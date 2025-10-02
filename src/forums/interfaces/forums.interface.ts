import { Forum } from "../entities/forum.entity";

export interface GetAllForumsOptions {
  courseId: string;
  search?: string;
  contentType?: string;
  page?: number;
  limit?: number;
  userId: string;
  tenantId: string;
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
}