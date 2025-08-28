import { CourseModule } from "../../courses/entities/courses-modules.entity";

export interface GetAllModulesOptions {
    courseId: string;
    search?: string;
    page?: number;
    limit?: number;
    userId: string;
    tenantId: string;
    actives?: boolean;
}

export interface PaginatedModuleResponse {
    data: CourseModule[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
        hasNext: boolean;
        hasPrev: boolean;
    };
}