// src/courses/interfaces/course-stats.interface.ts

export interface ModuleStats {
  totalItems: number;
  completedItems: number;
  totalDuration: number; // en segundos
}

export interface EnrollmentInfo {
  isEnrolled: boolean;
  enrollmentDate: Date | null;
  progress: number; // 0-100
  completedModules: number;
  totalModules: number;
}

// Extender las entidades para incluir estos campos dinámicos
// export interface CourseWithStats extends Courses {
//   enrollmentInfo: EnrollmentInfo;
//   modules: ModuleWithStats[];
// }

// export interface ModuleWithStats extends CourseModule {
//   stats: ModuleStats;
// }

// DTO para la respuesta del método findCourseForMake
// export class CourseForMakeDto {
//   id: string;
//   slug: string;
//   tenantId: string;
//   isActive: boolean;
//   created_at: Date;
//   updated_at: Date;
//   deleted_at: Date;
  
//   // Relaciones
//   sections: Section[];
//   modules: ModuleWithStats[];
//   configuration: CourseConfiguration;
//   translations: CourseTranslation[];
//   viewsConfig: CoursesViewsConfig[];
  
//   // Información agregada dinámicamente
//   enrollmentInfo: EnrollmentInfo;
// }