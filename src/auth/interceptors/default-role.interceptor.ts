import { Injectable, NestInterceptor, ExecutionContext, CallHandler, Logger } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { UserRole } from 'src/common/enums/user-role.enum';

@Injectable()
export class DefaultRoleInterceptor implements NestInterceptor {
  private readonly logger = new Logger(DefaultRoleInterceptor.name);
  
  constructor(private readonly defaultRole: UserRole = UserRole.USER) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();

    this.logger.log('Request body completo:', JSON.stringify(request.body, null, 2));
    this.logger.log('Request route path:', request.route?.path);
    this.logger.log('Request method:', request.method);
    
    // Verificar si es el endpoint de registro
    const isRegisterEndpoint = request.route?.path.includes('register') || 
                              request.url.includes('register');
    
    if (isRegisterEndpoint && request.body) {
      if (!request.body.role) {
        request.body.role = this.defaultRole;
        this.logger.log(`Rol asignado automáticamente: ${this.defaultRole}`);
      } else {
        this.logger.log(`Rol ya especificado: ${request.body.role}`);
      }
    }

    return next.handle().pipe(
      tap(() => {
        this.logger.log('Request procesado exitosamente');
      })
    );
  }
}