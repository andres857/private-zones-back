// src/storage/storage.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
    S3Client,
    PutObjectCommand,
    DeleteObjectCommand,
    CopyObjectCommand,
    GetObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { Upload } from '@aws-sdk/lib-storage';
import { v4 as uuidv4 } from 'uuid';
import * as path from 'path';
import { Readable } from 'stream';

export type ContentVisibility = 'public' | 'private' | 'temp';
export type ContentType = 'video' | 'image' | 'document' | 'embed' | 'scorm';

interface UploadOptions {
    tenantSlug: string;
    courseId?: string;
    contentType: ContentType;
    visibility?: ContentVisibility;
    originalName: string;
    mimeType: string;
    buffer: Buffer;
}

interface UploadResult {
    url: string;
    cdnUrl: string;
    key: string;
    visibility: ContentVisibility;
    size: number;
}

@Injectable()
export class StorageService {
    private readonly logger = new Logger(StorageService.name);
    private readonly s3Client: S3Client;
    private readonly bucket: string;
    private readonly endpoint: string;
    private readonly cdnEndpoint: string;

    constructor(private configService: ConfigService) {
        this.bucket = this.configService.get<string>('DO_SPACES_BUCKET')!;
        this.endpoint = this.configService.get<string>('DO_SPACES_ENDPOINT')!;
        this.cdnEndpoint = this.configService.get<string>('DO_SPACES_CDN_ENDPOINT')!;

        this.s3Client = new S3Client({
            endpoint: this.endpoint,
            region: 'sfo3',
            credentials: {
                accessKeyId: this.configService.get<string>('DO_SPACES_KEY')!,
                secretAccessKey: this.configService.get<string>('DO_SPACES_SECRET')!,
            },
            forcePathStyle: false,
        });
    }

    // Determinar visibilidad según tipo de contenido
    private getDefaultVisibility(contentType: ContentType): ContentVisibility {
        const visibilityMap: Record<ContentType, ContentVisibility> = {
            image: 'public',
            video: 'public',
            document: 'private',
            scorm: 'private',
            embed: 'public',
        };
        return visibilityMap[contentType];
    }

    // Construir la ruta del archivo en el bucket
    private buildKey(options: {
        visibility: ContentVisibility;
        tenantSlug: string;
        courseId?: string;
        contentType: ContentType;
        fileName: string;
    }): string {
        const { visibility, tenantSlug, courseId, contentType, fileName } = options;

        // temp/{tenantSlug}/uploads/{filename}
        if (visibility === 'temp') {
            return `temp/${tenantSlug}/uploads/${fileName}`;
        }

        // {visibility}/{tenantSlug}/{courseId}/{contentType}/{filename}
        // Si no hay courseId, va a nivel de tenant
        const courseSegment = courseId ? `/${courseId}` : '';
        return `${visibility}/${tenantSlug}${courseSegment}/${contentType}s/${fileName}`;
    }

    // Generar nombre único para el archivo
    private generateFileName(originalName: string): string {
        const ext = path.extname(originalName).toLowerCase();
        const uuid = uuidv4();
        return `${uuid}${ext}`;
    }

    // Determinar ACL según visibilidad
    private getAcl(visibility: ContentVisibility): 'public-read' | 'private' {
        return visibility === 'public' ? 'public-read' : 'private';
    }

    async upload(options: UploadOptions): Promise<UploadResult> {
        const {
            tenantSlug,
            courseId,
            contentType,
            originalName,
            mimeType,
            buffer,
        } = options;

        const visibility = options.visibility ?? this.getDefaultVisibility(contentType);
        const fileName = this.generateFileName(originalName);
        const key = this.buildKey({ visibility, tenantSlug, courseId, contentType, fileName });

        this.logger.log(`Uploading file to Spaces: ${key}`);

        try {
            const upload = new Upload({
                client: this.s3Client,
                params: {
                    Bucket: this.bucket,
                    Key: key,
                    Body: buffer,
                    ContentType: mimeType,
                    ACL: this.getAcl(visibility),
                    // Metadata para rastreo
                    Metadata: {
                        tenantSlug,
                        courseId: courseId || '',
                        contentType,
                        originalName: encodeURIComponent(originalName),
                    },
                },
            });

            await upload.done();

            // URL directa al bucket
            const url = `${this.endpoint}/${this.bucket}/${key}`;
            // URL via CDN (más rápida para archivos públicos)
            const cdnUrl = visibility === 'public'
                ? `${this.cdnEndpoint}/${key}`
                : url;

            this.logger.log(`File uploaded successfully: ${key}`);

            return {
                url,
                cdnUrl,
                key,
                visibility,
                size: buffer.length,
            };
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            const errorStack = error instanceof Error ? error.stack : '';

            this.logger.error(`Failed to upload file: ${errorMessage}`, errorStack);
            throw new Error(`Error al subir el archivo: ${errorMessage}`);
        }
    }

    private getErrorMessage(error: unknown): string {
        if (error instanceof Error) return error.message;
        return String(error);
    }

    async delete(key: string): Promise<void> {
        try {
            await this.s3Client.send(
                new DeleteObjectCommand({
                    Bucket: this.bucket,
                    Key: key,
                }),
            );
            this.logger.log(`File deleted: ${key}`);
        } catch (error) {
            const msg = this.getErrorMessage(error);
            this.logger.error(`Failed to delete file: ${key}`, error instanceof Error ? error.stack : undefined);
            throw new Error(`Error al eliminar el archivo: ${msg}`);
        }
    }

    // Mover archivo de temp a su ubicación final
    async moveFromTemp(options: {
        tempKey: string;
        tenantSlug: string;
        courseId: string;
        contentType: ContentType;
        visibility?: ContentVisibility;
    }): Promise<{ newKey: string; cdnUrl: string }> {
        const { tempKey, tenantSlug, courseId, contentType } = options;
        const visibility = options.visibility ?? this.getDefaultVisibility(contentType);

        // Extraer nombre del archivo del key temporal
        const fileName = path.basename(tempKey);
        const newKey = this.buildKey({ visibility, tenantSlug, courseId, contentType, fileName });

        // Copiar a nueva ubicación
        await this.s3Client.send(
            new CopyObjectCommand({
                Bucket: this.bucket,
                CopySource: `${this.bucket}/${tempKey}`,
                Key: newKey,
                ACL: this.getAcl(visibility),
            }),
        );

        // Eliminar temporal
        await this.delete(tempKey);

        const cdnUrl = visibility === 'public'
            ? `${this.cdnEndpoint}/${newKey}`
            : `${this.endpoint}/${this.bucket}/${newKey}`;

        return { newKey, cdnUrl };
    }

    // Extraer key de una URL completa
    extractKeyFromUrl(url: string): string {
        const urlWithoutEndpoint = url
            .replace(`${this.endpoint}/${this.bucket}/`, '')
            .replace(`${this.cdnEndpoint}/`, '');
        return urlWithoutEndpoint;
    }

    getSignedUrl(key: string, expiresInSeconds = 3600): Promise<string> {
        // Si el archivo es público, devolver CDN url directamente
        if (key.startsWith('public/')) {
            return Promise.resolve(`${this.cdnEndpoint}/${key}`);
        }

        // Para archivos privados, generar URL firmada temporal
        const command = new GetObjectCommand({
            Bucket: this.bucket,
            Key: key,
        });

        return getSignedUrl(this.s3Client, command, {
            expiresIn: expiresInSeconds,
        });
    }

    // Determinar si una URL es privada
    isPrivateUrl(url: string): boolean {
        // Las URLs privadas contienen el endpoint del bucket pero no el CDN público
        return url.includes(this.endpoint) && !url.includes('public/');
    }
}