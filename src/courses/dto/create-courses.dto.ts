// create-courses.dto.ts (para compatibilidad con JSON de entrada)
import { Type } from 'class-transformer';
import { IsArray, IsOptional, ValidateNested } from 'class-validator';
import { CreateCourseDto } from './create-course.dto';

export class CreateCoursesDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateCourseDto)
  @IsOptional()
  clubs?: CreateCourseDto[];
}