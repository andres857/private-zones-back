// src/common/types/request.types.ts
import { Request } from 'express';

export interface Tenant {
  id: string;
  name: string;
  domain: string;
  // Agregar otras propiedades del tenant según entidad
}

export interface User {
  id: string;
  email: string;
  name: string;
  roles: string[];
  // Agregar otras propiedades del usuario según JWT payload
}

export interface AuthenticatedRequest extends Request {
  user?: User;
  tenant?: Tenant;
}