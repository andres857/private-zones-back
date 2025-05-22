import { ValidationPipe } from '@nestjs/common';

import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('v1');

    app.useGlobalPipes(new ValidationPipe({
    whitelist: true,  // elimina propiedades no definidas en el DTO
    forbidNonWhitelisted: true,  // error si llegan propiedades extra
    transform: true,  // transforma payload a instancias de clases DTO
  }));
  // Configurar CORS
  app.enableCors({
    origin: [
      'http://localhost:5173',
      'http://localhost:3000', // Por si usas otro puerto para testing
      // Patrones para subdominios .test
      /^http:\/\/.*\.klmsystem\.test:5173$/,
      /^http:\/\/.*\.klmsystem\.test$/,
    ],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type', 
      'Authorization', 
      'X-Tenant-Domain', 
      'X-Tenant-ID',
      'Accept',
      'Origin',
      'X-Requested-With'
    ],
    credentials: true,
  });
  
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
