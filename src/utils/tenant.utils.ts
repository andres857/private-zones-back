// utils/tenant.utils.ts

export function extractTenantSlugFromRequest(request: any): string | null {
  const hostHeader = request.headers['x-tenant-host'] as string;

  if (!hostHeader) return null;

  // Ejemplo: tenant1.miapp.com -> 'tenant1'
  const slug = hostHeader.split('.')[0];

  return slug;
}


// export function extractTenantSlugFromRequest(request: any): string | null {
//   const hostHeader = request.headers['x-tenant-host'] as string;

//   if (!hostHeader) return null;

//   // Quitar el TLD (última parte después del último punto)
//   const parts = hostHeader.split('.');

//   if (parts.length < 2) return null;

//   // Eliminar el último elemento (.com, .co, .test, etc.)
//   parts.pop();

//   // Volver a unir el resto del dominio
//   const slug = parts.join('.');

//   return slug;
// }



export function extractTenantDomainFromRequest(request: any): string | null {
  const hostHeader = request.headers['x-tenant-host'] as string;

  if (!hostHeader) return null;

  // Quitar el puerto si está presente (e.g. tenant1.miapp.com:3000 -> tenant1.miapp.com)
  const hostWithoutPort = hostHeader.split(':')[0];

  return hostWithoutPort;
}
