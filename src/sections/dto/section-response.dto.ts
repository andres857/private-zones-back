export class SectionCourseDto {
  id: string;
  title: string;
  slug: string;
  isActive: boolean;
}

export class SectionResponseDto {
  id: string;
  tenantId: string;
  slug: string;
  name: string;
  description?: string;
  thumbnailImagePath?: string;
  order?: number;
  allowBanner: boolean;
  bannerPath?: string;
  courses?: SectionCourseDto[]; // NUEVO
  courseCount?: number; // NUEVO
  createdAt: Date;
  updatedAt: Date;
}