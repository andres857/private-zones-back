// src/contents/contents.controller.ts
import { Controller, Get, Param, Query, UseGuards, Req, UseInterceptors, Post, Body, DefaultValuePipe, ParseIntPipe, BadRequestException, InternalServerErrorException, UploadedFile, NotFoundException } from '@nestjs/common';
import { ContentsService } from './contents.service';
import { AuthGuard } from '@nestjs/passport';
import { Request } from 'express';
import { TenantValidationInterceptor } from 'src/auth/interceptors/tenant-validation.interceptor';
import { AuthenticatedRequest } from 'src/common/enums/types/request.types';
import { UserProgressService } from '../progress/services/user-progress.service';
import { CreateCategoryDto } from './dto/contents.dto';
import { ContentType, StorageService } from 'src/storage/storage.service';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { CurrentUser } from 'src/auth/decorators/user.decorator';
import { ALLOWED_MIMES, FILE_SIZE_LIMITS } from './constants/storage.constants';

export interface GetContentOptions {
    includeCourse?: boolean;
    includeModule?: boolean;
    includeNavigation?: boolean;
    fromModule?: boolean;
}

@Controller('contents')
@UseGuards(AuthGuard('jwt'))
@UseInterceptors(TenantValidationInterceptor)
export class ContentsController {
    constructor(
        private readonly contentsService: ContentsService,
        private readonly progressService: UserProgressService,
        private readonly storageService: StorageService,
    ) { }


    @Get(':contentId/signed-url')
    async getSignedUrl(
        @Param('contentId') contentId: string,
        @Req() req: any,
    ) {
        const tenantId = req.tenant?.id;
        const content = await this.contentsService.findOne(contentId, tenantId);

        if (!content) {
            throw new NotFoundException('Contenido no encontrado');
        }

        // Si es embed o URL externa, devolver tal cual
        if (content.contentType === 'embed' || content.contentUrl.startsWith('http') === false) {
            return { url: content.contentUrl, signed: false };
        }

        // Extraer el key del archivo desde la URL guardada
        const key = this.storageService.extractKeyFromUrl(content.contentUrl);

        // Públicos: URL del CDN directamente
        // Privados: URL firmada que expira en 1 hora
        const isPrivate = key.startsWith('private/');
        const url = isPrivate
            ? await this.storageService.getSignedUrl(key, 3600)
            : content.contentUrl;

        return {
            url,
            signed: isPrivate,
            expiresIn: isPrivate ? 3600 : null,
            contentType: content.contentType,
        };
    }

    // ──────────────────────────────────────────────
    // POST /contents/upload
    // Sube un archivo y devuelve la URL. 
    // Usar esto ANTES de crear el contenido.
    // ──────────────────────────────────────────────
    @Post('upload')
    @UseInterceptors(
        FileInterceptor('file', {
        storage: memoryStorage(), // Guardar en memoria, no en disco
        limits: { fileSize: 500 * 1024 * 1024 }, // 500MB máx global
        }),
    )
    async uploadFile(
        @UploadedFile() file: Express.Multer.File,
        @Body('contentType') contentType: ContentType,
        @Body('courseId') courseId: string,
        @CurrentUser() user: any,
        @Req() req: any,
    ) {
        if (!file) {
            throw new BadRequestException('No se proporcionó ningún archivo');
        }

        if (!contentType) {
            throw new BadRequestException('El tipo de contenido es requerido');
        }

        const tenantSlug = req.tenant?.slug || user.tenantSlug;
        
        if (!tenantSlug) {
            throw new BadRequestException('Tenant no identificado');
        }

        // Validar tamaño por tipo
        const maxSize = FILE_SIZE_LIMITS[contentType];
        
        if (maxSize && file.size > maxSize) {
            throw new BadRequestException(
                `El archivo excede el tamaño máximo de ${maxSize / (1024 * 1024)}MB para ${contentType}`,
            );
        }

        // Validar MIME type
        const allowedMimes = ALLOWED_MIMES[contentType];
        if (allowedMimes && !allowedMimes.includes(file.mimetype)) {
        throw new BadRequestException(
            `Tipo de archivo no permitido. Tipos aceptados: ${allowedMimes.join(', ')}`,
        );
        }

        const result = await this.storageService.upload({
            tenantSlug,
            courseId,
            contentType,
            originalName: file.originalname,
            mimeType: file.mimetype,
            buffer: file.buffer,
        });

        return {
            success: true,
            data: {
                url: result.cdnUrl,    // URL para guardar en BD
                rawUrl: result.url,
                key: result.key,
                visibility: result.visibility,
                size: result.size,
                originalName: file.originalname,
                mimeType: file.mimetype,
            },
        };
    }


    @Get('course/:courseId')
    async getAllByCourse(
        @Req() request: AuthenticatedRequest,
        @Param('courseId') courseId: string,
        @Query('search') search?: string,
        @Query('contentType') contentType?: string,
        @Query('page', new DefaultValuePipe(1), ParseIntPipe) page?: number,
        @Query('limit', new DefaultValuePipe(12), ParseIntPipe) limit?: number,
    ) {
        const userId = request.user?.['id'];
        const tenantId = request.tenant?.id;

        if (!userId) throw new Error('User not authenticated');
        if (!tenantId) throw new Error('Tenant not validated');

        // 📌 Validar que page y limit sean valores válidos
        const validPage = Math.max(1, page || 1);
        const validLimit = Math.min(Math.max(1, limit || 12), 100); // máximo 100 por página

        return this.contentsService.getAll({
        courseId,
        search,
        contentType,
        page: validPage,
        limit: validLimit,
        userId,
        tenantId,
        });
    }



    @Get(':contentId')
    async getById(
        @Req() request: AuthenticatedRequest,
        @Param('contentId') contentId: string,
        @Query('fromModule') fromModule?: string,
        @Query('includeCourse') includeCourse?: string,
        @Query('includeModule') includeModule?: string,
        @Query('includeNavigation') includeNavigation?: string,
    ) {
        const userId = request.user?.['id'];
        const tenantId = request.tenant?.id;

        if (!userId) {
            throw new Error('User not authenticated');
        }

        if (!tenantId) {
            throw new Error('Tenant not validated');
        }

        const isFromModule = fromModule === 'true';

        const options: GetContentOptions = {
            includeCourse: includeCourse === 'true',
            includeModule: includeModule === 'true',
            includeNavigation: includeNavigation === 'true',
            fromModule: isFromModule
        };

        if(isFromModule){
            await this.progressService.startItemProgress(contentId, userId);
        }

        return await this.contentsService.getById(contentId, options, userId, tenantId);
    }

    @Post(':contentId/progress')
    async updateProgress(
        @Req() request: AuthenticatedRequest,
        @Param('contentId') contentId: string,
        @Body() progressData: { progressPercentage?: number; timeSpent?: number; }
    ) {
        const userId = request.user?.['id'];

        console.log('inicia proceso de actualizacion de progreso');

        if (!userId) {
            throw new Error('User not authenticated');
        }

        console.log('itemId:',contentId, 'userId',userId, 'progreso:', progressData.progressPercentage ?? 0, progressData.timeSpent);

        return await this.progressService.updateItemProgress(contentId, userId, progressData.progressPercentage ?? 0, progressData.timeSpent);
    }

    @Post(':contentId/complete')
    async markComplete(
        @Req() request: AuthenticatedRequest,
        @Param('contentId') contentId: string
    ) {
        const userId = request.user?.['id'];

        console.log('inicia proceso de completado de progreso');


        if (!userId) {
            throw new Error('User not authenticated');
        }

        return await this.progressService.completeItem(contentId, userId);
    }

    @Post('/create')
    async createContents(@Req() request: AuthenticatedRequest, @Body() body: any){
        try {
            const savedContent = await this.contentsService.createContent(body);
            
            // Retornar respuesta exitosa con el contenido creado
            return {
                success: true,
                message: 'Contenido creado exitosamente',
                data: {
                    id: savedContent.id,
                    title: savedContent.title,
                    contentType: savedContent.contentType,
                    contentUrl: savedContent.contentUrl,
                    description: savedContent.description,
                    createdAt: savedContent.createdAt
                }
            };
        } catch (error) {
            // Los errores ya son manejados en el service, simplemente los re-lanzamos
            throw error;
        }
    }

    @Post('/create/category')
    async createCategory(@Req() request: AuthenticatedRequest, @Body() body: CreateCategoryDto) {
        try {
            const savedCategory = await this.contentsService.createCategory(body);

            // Retornar respuesta exitosa
            return {
                success: true,
                message: 'Categoría creada exitosamente',
                data: {
                    id: savedCategory.id,
                    title: savedCategory.title,
                    description: savedCategory.description,
                    order: savedCategory.order,
                    metadata: savedCategory.metadata,
                    createdAt: savedCategory.createdAt
                }
            };
        } catch (error) {
            // Si es BadRequestException o InternalServerErrorException, dejar que NestJS lo maneje
            if (error instanceof BadRequestException || error instanceof InternalServerErrorException) {
                throw error;
            }

            // Log del error
            console.error('Error en endpoint createCategory:', error);

            // Retornar error genérico
            throw new InternalServerErrorException('Error al procesar la solicitud');
        }
    }
}