import { ValidationPipe, BadRequestException } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

import { SocketIoAdapter } from './socket-io-adapter';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';


// Función helper para extraer errores anidados
function extractErrorMessages(errors: any[], parentPath = ''): string[] {
  const messages: string[] = [];
  
  for (const error of errors) {
    const path = parentPath ? `${parentPath}.${error.property}` : error.property;
    
    // Si tiene constraints, extraer los mensajes
    if (error.constraints) {
      if (error.constraints.whitelistValidation) {
        messages.push(`La propiedad "${path}" no está permitida`);
      } else {
        const constraintMessages = Object.values(error.constraints).map(
          msg => `${path}: ${msg}`
        );
        messages.push(...constraintMessages);
      }
    }
    
    // Si tiene errores anidados (children), procesarlos recursivamente
    if (error.children && error.children.length > 0) {
      const nestedMessages = extractErrorMessages(error.children, path);
      messages.push(...nestedMessages);
    }
  }
  
  return messages;
}

async function bootstrap() {
  process.env.TZ = 'America/Bogota';
  
  const app = await NestFactory.create(AppModule);
    const corsOptions = {
    origin: [
      'http://localhost:5173',
      'http://devel.klmsystem.test:5173',
      'http://devel.klmsystem.test:3000',
      'https://klmsystem.online'
    ],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    credentials: true,
  };

  const config = new DocumentBuilder()
    .setTitle('Kalm System API')
    .setDescription('API documentation for Kalm System')
    .setVersion('1.0')
    .addTag('klm-system')
    .build();
  const documentFactory = () => SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, documentFactory);

  app.useWebSocketAdapter(new SocketIoAdapter(app, corsOptions));
  app.setGlobalPrefix('v1');
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
    validateCustomDecorators: false,
    skipMissingProperties: false,
    exceptionFactory: (errors) => {
      console.log('Validation errors:', JSON.stringify(errors, null, 2)); // Para debugging
      
      const messages = extractErrorMessages(errors);
      
      if (messages.length === 0) {
        return new BadRequestException('Errores de validación');
      }
      
      return new BadRequestException(messages);
    }
  }));
  // Configurar CORS
  app.enableCors({
    origin: [
      'http://localhost:3000',
      'http://localhost:5173',
      'http://devel.klmsystem.test:5173',
      'http://devel.klmsystem.test:3000', 
      'https://klmsystem.online'
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
