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
  
  // Función para validar orígenes permitidos
  const allowedOriginsPattern = (origin: string, callback: (err: Error | null, allow?: boolean) => void) => {
    const allowedLocalOrigins = [
      'http://localhost:5173',
      'http://localhost:3000',
      'http://devel.klmsystem.test:5173',
      'http://devel.klmsystem.test:3000',
    ];
    
    // Permitir orígenes locales
    if (allowedLocalOrigins.includes(origin)) {
      callback(null, true);
      return;
    }
    
    // Permitir cualquier dominio que termine con klmsystem.online, klmsystem.com o kalmsystem.com
    if (
      origin &&
      origin.match(/https?:\/\/.*\.?(klmsystem|kalmsystem)\.(online|com)$/)
    ) {
      callback(null, true);
      return;
    }
    
    // Permitir requests sin origin (como Postman, curl, etc.)
    if (!origin) {
      callback(null, true);
      return;
    }
    
    callback(new Error('Not allowed by CORS'));
  };

  const corsOptions = {
    origin: allowedOriginsPattern,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    credentials: true,
    allowedHeaders: [
      'Content-Type', 
      'Authorization', 
      'X-Tenant-Domain', 
      'X-Tenant-ID',
      'Accept',
      'Origin',
      'X-Requested-With'
    ],
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
      console.log('Validation errors:', JSON.stringify(errors, null, 2));
      
      const messages = extractErrorMessages(errors);
      
      if (messages.length === 0) {
        return new BadRequestException('Errores de validación');
      }
      
      return new BadRequestException(messages);
    }
  }));
  
  // Configurar CORS usando la misma función
  app.enableCors(corsOptions);
  
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();