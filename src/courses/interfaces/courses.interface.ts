import { Courses } from "../entities/courses.entity";

// DTO para los parámetros de búsqueda
export interface FindAllCoursesParams {
    userId?: string;
    tenantId: string;
    search?: string;
    actives?: boolean;
    page?: number;
    limit?: number;
    languageCode?: string; // Para las traducciones
}

// Respuesta con paginación
export interface PaginatedCoursesResponse {
    data: Courses[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}