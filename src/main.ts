import { ValidationPipe, BadRequestException } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

import { SocketIoAdapter } from './socket-io-adapter';

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

  app.useWebSocketAdapter(new SocketIoAdapter(app, corsOptions));
  app.setGlobalPrefix('v1');
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
    exceptionFactory: (errors) => {
      const messages = errors.map(err => {
        if (err.constraints?.whitelistValidation) {
          return `La propiedad "${err.property}" no está permitida\n`;
        }
        return Object.values(err.constraints || {}).map(msg => `${msg}\n`);
      }).flat();

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
