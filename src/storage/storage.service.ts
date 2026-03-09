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
    folder?: string;        // subcarpeta custom (ej: 'thumbnails', 'avatars')
    customPath?: string;    // ruta completa personalizada, reemplaza courseId + folder
                            // ej: 'forums/thumbnails' → temp/{tenant}/forums/thumbnails/{file}
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

    private buildKey(options: {
        visibility: ContentVisibility;
        tenantSlug: string;
        courseId?: string;
        contentType: ContentType;
        fileName: string;
        folder?: string;
        customPath?: string;  // ← cuando se provee, reemplaza courseId + folder/typeSegment
    }): string {
        const { visibility, tenantSlug, courseId, contentType, fileName, folder, customPath } = options;

        // temp siempre ignora customPath/folder para mayor claridad
        if (visibility === 'temp') {
            if (customPath) {
                // temp/{tenantSlug}/{customPath}/{fileName}
                // ej: temp/mi-empresa/forums/thumbnails/uuid.jpg
                return `temp/${tenantSlug}/${customPath}/${fileName}`;
            }
            return `temp/${tenantSlug}/uploads/${fileName}`;
        }

        if (customPath) {
            // {visibility}/{tenantSlug}/{customPath}/{fileName}
            // ej: public/mi-empresa/forums/abc-123/thumbnails/uuid.jpg
            return `${visibility}/${tenantSlug}/${customPath}/${fileName}`;
        }

        const courseSegment = courseId ? `/${courseId}` : '';
        const typeSegment = folder ?? `${contentType}s`;
        return `${visibility}/${tenantSlug}${courseSegment}/${typeSegment}/${fileName}`;
    }

    private generateFileName(originalName: string): string {
        const ext = path.extname(originalName).toLowerCase();
        return `${uuidv4()}${ext}`;
    }

    private getAcl(visibility: ContentVisibility): 'public-read' | 'private' {
        return visibility === 'public' ? 'public-read' : 'private';
    }

    async upload(options: UploadOptions): Promise<UploadResult> {
        const { tenantSlug, courseId, contentType, originalName, mimeType, buffer, folder, customPath } = options;

        const visibility = options.visibility ?? this.getDefaultVisibility(contentType);
        const fileName = this.generateFileName(originalName);
        const key = this.buildKey({ visibility, tenantSlug, courseId, contentType, fileName, folder, customPath });

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
                    Metadata: {
                        tenantSlug,
                        courseId: courseId || '',
                        contentType,
                        originalName: encodeURIComponent(originalName),
                    },
                },
            });

            await upload.done();

            const url = `${this.endpoint}/${this.bucket}/${key}`;
            const cdnUrl = visibility === 'public'
                ? `${this.cdnEndpoint}/${key}`
                : url;

            this.logger.log(`File uploaded successfully: ${key}`);

            return { url, cdnUrl, key, visibility, size: buffer.length };
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            this.logger.error(`Failed to upload file: ${errorMessage}`);
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
                new DeleteObjectCommand({ Bucket: this.bucket, Key: key }),
            );
            this.logger.log(`File deleted: ${key}`);
        } catch (error) {
            throw new Error(`Error al eliminar el archivo: ${this.getErrorMessage(error)}`);
        }
    }

    /**
     * Mueve un archivo de una key a otra dentro del mismo bucket.
     * Útil para mover de temp → ubicación definitiva tras crear la entidad.
     *
     * @param sourceKey  key actual  (ej: temp/slug/forums/thumbnails/uuid.jpg)
     * @param destKey    key destino (ej: public/slug/forums/forum-id/thumbnails/uuid.jpg)
     * @param visibility visibilidad del archivo destino (determina ACL)
     */
    async moveTo(
        sourceKey: string,
        destKey: string,
        visibility: ContentVisibility = 'public',
    ): Promise<{ key: string; cdnUrl: string }> {
        await this.s3Client.send(
            new CopyObjectCommand({
                Bucket: this.bucket,
                CopySource: `${this.bucket}/${sourceKey}`,
                Key: destKey,
                ACL: this.getAcl(visibility),
            }),
        );

        await this.delete(sourceKey);

        const cdnUrl = visibility === 'public'
            ? `${this.cdnEndpoint}/${destKey}`
            : `${this.endpoint}/${this.bucket}/${destKey}`;

        this.logger.log(`Moved file: ${sourceKey} → ${destKey}`);
        return { key: destKey, cdnUrl };
    }

    /**
     * Caso de uso específico: mover thumbnail de foro de temp → lugar definitivo.
     * temp/{slug}/forums/thumbnails/{file}
     *   → public/{slug}/forums/{forumId}/thumbnails/{file}
     */
    async moveForumThumbnail(
        tempKey: string,
        tenantSlug: string,
        courseId: string,
        forumId: string,
    ): Promise<{ key: string; cdnUrl: string }> {
        const fileName = path.basename(tempKey);
        const destKey = `public/${tenantSlug}/${courseId}/forums/${forumId}/thumbnails/${fileName}`;
        return this.moveTo(tempKey, destKey, 'public');
    }

    // Mover archivo de temp a su ubicación final (método original, sin cambios)
    async moveFromTemp(options: {
        tempKey: string;
        tenantSlug: string;
        courseId: string;
        contentType: ContentType;
        visibility?: ContentVisibility;
    }): Promise<{ newKey: string; cdnUrl: string }> {
        const { tempKey, tenantSlug, courseId, contentType } = options;
        const visibility = options.visibility ?? this.getDefaultVisibility(contentType);

        const fileName = path.basename(tempKey);
        const newKey = this.buildKey({ visibility, tenantSlug, courseId, contentType, fileName });

        await this.s3Client.send(
            new CopyObjectCommand({
                Bucket: this.bucket,
                CopySource: `${this.bucket}/${tempKey}`,
                Key: newKey,
                ACL: this.getAcl(visibility),
            }),
        );

        await this.delete(tempKey);

        const cdnUrl = visibility === 'public'
            ? `${this.cdnEndpoint}/${newKey}`
            : `${this.endpoint}/${this.bucket}/${newKey}`;

        return { newKey, cdnUrl };
    }

    extractKeyFromUrl(url: string): string {
        return url
            .replace(`${this.endpoint}/${this.bucket}/`, '')
            .replace(`${this.cdnEndpoint}/`, '');
    }

    getSignedUrl(key: string, expiresInSeconds = 3600): Promise<string> {
        if (key.startsWith('public/')) {
            return Promise.resolve(`${this.cdnEndpoint}/${key}`);
        }
        const command = new GetObjectCommand({ Bucket: this.bucket, Key: key });
        return getSignedUrl(this.s3Client, command, { expiresIn: expiresInSeconds });
    }

    isPrivateUrl(url: string): boolean {
        return url.includes(this.endpoint) && !url.includes('public/');
    }
}