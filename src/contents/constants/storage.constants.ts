// src/contents/constants/storage.constants.ts

export const FILE_SIZE_LIMITS: Record<string, number> = {
  video: 500 * 1024 * 1024,    // 500MB
  document: 50 * 1024 * 1024,  // 50MB
  image: 10 * 1024 * 1024,     // 10MB
  scorm: 100 * 1024 * 1024,    // 100MB
};

export const ALLOWED_MIMES: Record<string, string[]> = {
  video: ['video/mp4', 'video/webm', 'video/quicktime'],
  document: [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  ],
  image: ['image/jpeg', 'image/png', 'image/gif', 'image/svg+xml', 'image/webp'],
  scorm: ['application/zip', 'application/x-zip-compressed'],
};