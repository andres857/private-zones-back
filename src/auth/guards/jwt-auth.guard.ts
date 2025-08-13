// src/auth/guards/jwt-auth.guard.ts
import { Injectable, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private reflector: Reflector) {
    super();
  }

  canActivate(context: ExecutionContext) {
    // console.log('=== JWT Auth Guard - canActivate ===');
    
    // Check for public decorator
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // console.log('Route is public:', isPublic);

    if (isPublic) {
      console.log('Public route, skipping authentication');
      return true;
    }

    // Extract and log the authorization header
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers.authorization;

    // console.log('Authorization header:', request.headers);
    
    // console.log('Authorization header present:', !!authHeader);
    // console.log('Authorization header format:', authHeader ? authHeader.substring(0, 20) + '...' : 'NONE');

    return super.canActivate(context);
  }

  handleRequest(err, user, info, context) {
    // console.log('=== JWT Auth Guard - handleRequest ===');
    // console.log('Error:', err?.message || 'None');
    // console.log('User:', user ? 'Present' : 'None');
    // console.log('Info:', info?.message || info || 'None');
    
    // Log more details about the error
    if (err) {
      console.log('Error details:', err);
    }
    
    if (info) {
      console.log('Info details:', info);
    }

    if (err) {
      console.log('Authentication failed with error');
      throw err;
    }
    
    if (!user) {
      console.log('Authentication failed - no user returned');
      
      // Provide more specific error messages based on info
      let errorMessage = 'Access token is invalid or expired';
      
      if (info?.message) {
        if (info.message.includes('jwt expired')) {
          errorMessage = 'Access token has expired';
        } else if (info.message.includes('invalid token')) {
          errorMessage = 'Access token is invalid';
        } else if (info.message.includes('jwt malformed')) {
          errorMessage = 'Access token is malformed';
        } else if (info.message.includes('invalid signature')) {
          errorMessage = 'Access token has invalid signature';
        }
      }
      
      throw new UnauthorizedException(errorMessage);
    }
    
    // console.log('Authentication successful for user:', user.id);
    return user;
  }
}