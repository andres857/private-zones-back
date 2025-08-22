import { ContentItem } from "../entities/courses-contents.entity";

export interface GetAllContentsOptions {
  courseId: string;
  search?: string;
  contentType?: string;
  page?: number;
  limit?: number;
  userId: string;
  tenantId: string;
}

export interface PaginatedContentResponse {
  data: ContentItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}