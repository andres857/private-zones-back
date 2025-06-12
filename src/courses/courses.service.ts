// // courses.service.ts
// import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
// import { InjectRepository } from '@nestjs/typeorm';
// import { Repository } from 'typeorm';
// import { Course } from './entities/course.entity';
// import { CreateCourseDto } from './dto/create-course.dto';

// @Injectable()
// export class CoursesService {
//   constructor(
//     @InjectRepository(Course)
//     private readonly courseRepository: Repository<Course>,
//   ) {}

//   /**
//    * Verifica si una fecha es válida para PostgreSQL
//    */
//   private isValidDate(dateString: string): boolean {
//     // Rechazar explícitamente las fechas "0000-00-00"
//     if (dateString === '0000-00-00' || dateString.startsWith('0000-00-00')) {
//       return false;
//     }
    
//     // Verificar si la fecha es válida
//     const date = new Date(dateString);
//     return !isNaN(date.getTime());
//   }

//   /**
//    * Crea un nuevo curso
//    */
// async create(createCourseDto: CreateCourseDto): Promise<Course> {
//   try {
//     console.log('DTO recibido:', createCourseDto);
    
//     const course = new Course();
//     const courseData = { ...createCourseDto };
    
//     // Solo asignar fechas válidas
//     if (courseData.created_at && this.isValidDate(courseData.created_at)) {
//       course.created_at = new Date(courseData.created_at);
//     }
    
//     if (courseData.updated_at && this.isValidDate(courseData.updated_at)) {
//       course.updated_at = new Date(courseData.updated_at);
//     }
    
//     if (courseData.deleted_at && this.isValidDate(courseData.deleted_at)) {
//       course.deleted_at = new Date(courseData.deleted_at);
//     }
    
//     if (courseData.start_date && this.isValidDate(courseData.start_date)) {
//       course.start_date = new Date(courseData.start_date);
//     }
    
//     if (courseData.end_date && this.isValidDate(courseData.end_date)) {
//       course.end_date = new Date(courseData.end_date);
//     }
    
//     // Eliminar las propiedades de fecha del objeto
//     delete courseData.created_at;
//     delete courseData.updated_at;
//     delete courseData.deleted_at;
//     delete courseData.start_date;
//     delete courseData.end_date;
    
//     // Asignar el resto de propiedades
//     Object.assign(course, courseData);
    
//     console.log('Objeto Course preparado:', course);
    
//     return await this.courseRepository.save(course);
//   } catch (error) {
//     console.error('Error completo:', error);
//     throw new BadRequestException(`Error al crear el curso: ${error.message}`);
//   }
// }

//   /**
//    * Procesa datos legacy (desde clubs) y crea cursos
//    */
//   async createFromLegacy(legacyData: any): Promise<Course[]> {
//     try {
//       const courses: Course[] = [];
      
//       // Si el JSON tiene formato clubs[...]
//       if (legacyData.clubs && Array.isArray(legacyData.clubs)) {
//         for (const clubData of legacyData.clubs) {
//           // Extraer el título de las traducciones si existe
//           let title = clubData.name;
//           if (clubData.club_translation && clubData.club_translation.length > 0) {
//             const esTranslation = clubData.club_translation.find(t => t.locale === 'es');
//             if (esTranslation) {
//               title = esTranslation.title;
//             }
//           }
          
//           // Crear DTO para el curso
//           const courseDto: CreateCourseDto = {
//             ...clubData,
//             title: title // Asignar el título extraído
//           };
          
//           // Eliminar la propiedad club_translation que ya no se usa
//           delete courseDto['club_translation'];
          
//           // Crear y guardar el curso
//           const course = await this.create(courseDto);
//           courses.push(course);
//         }
//       }
      
//       return courses;
//     } catch (error) {
//       throw new BadRequestException(`Error al crear cursos desde datos legacy: ${error.message}`);
//     }
//   }

//   /**
//    * Encuentra un curso por su ID
//    */
//   async findOne(id: number): Promise<Course> {
//     const course = await this.courseRepository.findOne({
//       where: { id }
//     });

//     if (!course) {
//       throw new NotFoundException(`Curso con ID ${id} no encontrado`);
//     }

//     return course;
//   }

//   /**
//    * Encuentra todos los cursos
//    */
//   async findAll(): Promise<Course[]> {
//     return this.courseRepository.find();
//   }

//   /**
//    * Elimina un curso (soft delete)
//    */
//   async remove(id: number): Promise<void> {
//     await this.findOne(id);
//     await this.courseRepository.softDelete(id);
//   }
  
//   /**
//    * Elimina un curso permanentemente
//    */
//   async hardDelete(id: number): Promise<void> {
//     await this.findOne(id);
//     await this.courseRepository.delete(id);
//   }
// }