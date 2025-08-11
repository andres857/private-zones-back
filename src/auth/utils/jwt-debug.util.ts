// src/auth/utils/jwt-debug.util.ts
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as jwt from 'jsonwebtoken';

@Injectable()
export class JwtDebugUtil {
  constructor(private configService: ConfigService) {}

  /**
   * Debug JWT token without verification (for troubleshooting)
   */
  decodeTokenWithoutVerification(token: string) {
    try {
      // Remove 'Bearer ' prefix if present
      const cleanToken = token.replace(/^Bearer\s+/i, '');
      
      // Decode without verification to see the payload
      const decoded = jwt.decode(cleanToken, { complete: true });
      
      if (!decoded) {
        return { error: 'Token could not be decoded' };
      }

      const header = decoded.header;
      const payload = decoded.payload as any;

      const now = Math.floor(Date.now() / 1000);
      const isExpired = payload.exp && payload.exp < now;
      const timeToExpiry = payload.exp ? payload.exp - now : null;

      return {
        header,
        payload,
        isExpired,
        timeToExpiry: timeToExpiry ? `${timeToExpiry} seconds` : null,
        expiryDate: payload.exp ? new Date(payload.exp * 1000) : null,
        issuedAt: payload.iat ? new Date(payload.iat * 1000) : null,
        currentTime: new Date(),
      };
    } catch (error) {
      return { error: error.message };
    }
  }

  /**
   * Verify JWT token with current secret
   */
  verifyToken(token: string) {
    try {
      const cleanToken = token.replace(/^Bearer\s+/i, '');
      const secret = this.configService.get<string>('JWT_SECRET');
      
      if (!secret) {
        return { error: 'JWT_SECRET not configured' };
      }

      const verified = jwt.verify(cleanToken, secret);
      return { verified, success: true };
    } catch (error) {
      return { error: error.message, success: false };
    }
  }

  /**
   * Complete token analysis
   */
  analyzeToken(token: string) {
    console.log('=== JWT Token Analysis ===');
    
    const decoded = this.decodeTokenWithoutVerification(token);
    console.log('Decoded token:', decoded);
    
    const verified = this.verifyToken(token);
    console.log('Verification result:', verified);
    
    return { decoded, verified };
  }
}

// Create a test endpoint to debug tokens (remove in production)
// Add this to your auth controller

/*
// In auth.controller.ts
import { JwtDebugUtil } from './utils/jwt-debug.util';

@Post('debug-token')
@Public() // Make this public for testing
debugToken(@Body('token') token: string) {
  return this.jwtDebugUtil.analyzeToken(token);
}
*/