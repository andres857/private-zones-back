import { Task } from "../entities/courses-tasks.entity";

export interface GetAllTasksOptions {
  courseId: string;
  search?: string;
  page?: number;
  limit?: number;
  tenantId: string;
}

export interface TaskStats {
  totalTasks: number;
  totalSubmissions: number;
  gradedSubmissions: number;
  activeUsers: number;
}

export interface PaginatedTaskResponse {
  data: Task[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
  stats: TaskStats;
}