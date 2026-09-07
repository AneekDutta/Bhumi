/**
 * Centralized Route Configuration & Role-Based Access Control (RBAC) Registry
 * 
 * Single authoritative source of truth for:
 * - Application route definitions and role requirements
 * - Access control verification
 * - Safe post-authentication return URL resolution
 */

export type UserRole = 'ADMIN' | 'FIELD_OFFICER' | 'LANDOWNER';

// =============================================================================
// ROUTE TAXONOMY
// =============================================================================

export const PUBLIC_ROUTES = [
  '/',
  '/highway-register',
  '/gazette',
  '/calculator',
  '/grievance',
  '/login',
  '/field/login',
  '/landowner/login',
  '/landowner/register',
  '/unauthorized',
] as const;

export const ADMIN_ROUTES = [
  '/dashboard',
  '/projects',
  '/parcels',
  '/landowner-cases',
  '/landowner-gis',
  '/verification',
  '/intelligence',
  '/reports',
  '/timeline',
  '/status',
] as const;

export const FIELD_ROUTES = [
  '/field',
  '/field/dashboard',
  '/field/parcels',
  '/field/complaints',
  '/field/sync',
  '/field/settings',
  '/field/map',
  '/field/verify',
] as const;

export const LANDOWNER_ROUTES = [
  '/landowner',
  '/landowner/home',
  '/landowner/parcels',
  '/landowner/complaints',
  '/landowner/boundary',
  '/landowner/profile',
] as const;

// =============================================================================
// DEFAULT DESTINATIONS
// =============================================================================

export const ROLE_DASHBOARDS: Record<UserRole, string> = {
  ADMIN: '/dashboard',
  FIELD_OFFICER: '/field/dashboard',
  LANDOWNER: '/landowner/home',
};

export const ROLE_LOGIN_PATHS: Record<UserRole, string> = {
  ADMIN: '/login',
  FIELD_OFFICER: '/field/login',
  LANDOWNER: '/landowner/login',
};

// =============================================================================
// ROUTE CLASSIFICATION HELPERS
// =============================================================================

export function isPublicRoute(pathname: string): boolean {
  if (pathname === '/' || pathname === '/unauthorized') return true;
  if (pathname.startsWith('/auth/')) return true;
  if (pathname.startsWith('/api/')) return true;

  // Specific public routes and their dynamic sub-paths
  if (pathname === '/highway-register' || pathname.startsWith('/highway-register/')) return true;
  if (pathname === '/gazette' || pathname.startsWith('/gazette/')) return true;
  if (pathname === '/calculator' || pathname.startsWith('/calculator/')) return true;
  if (pathname === '/grievance' || pathname.startsWith('/grievance/')) return true;
  if (pathname === '/legal-rights' || pathname.startsWith('/legal-rights/')) return true;

  // Public login / registration gateways
  if (pathname === '/login' || pathname.startsWith('/login/')) return true;
  if (pathname === '/field/login' || pathname.startsWith('/field/login/')) return true;
  if (pathname === '/landowner/login' || pathname.startsWith('/landowner/login/')) return true;
  if (pathname === '/landowner/register' || pathname.startsWith('/landowner/register/')) return true;

  return false;
}

export function isFieldRoute(pathname: string): boolean {
  if (pathname === '/field/login' || pathname.startsWith('/field/login/')) return false;
  return pathname === '/field' || pathname.startsWith('/field/');
}

export function isLandownerRoute(pathname: string): boolean {
  if (pathname === '/landowner/login' || pathname.startsWith('/landowner/login/')) return false;
  if (pathname === '/landowner/register' || pathname.startsWith('/landowner/register/')) return false;
  // Distinguish /landowner-cases (Admin) vs /landowner/* (Citizen)
  if (pathname.startsWith('/landowner-')) return false;
  return pathname === '/landowner' || pathname.startsWith('/landowner/');
}

export function isAdminRoute(pathname: string): boolean {
  if (pathname === '/dashboard' || pathname.startsWith('/dashboard/')) return true;
  if (pathname === '/projects' || pathname.startsWith('/projects/')) return true;
  if (pathname === '/parcels' || pathname.startsWith('/parcels/')) return true;
  if (pathname === '/landowner-cases' || pathname.startsWith('/landowner-cases/')) return true;
  if (pathname === '/landowner-gis' || pathname.startsWith('/landowner-gis/')) return true;
  if (pathname === '/verification' || pathname.startsWith('/verification/')) return true;
  if (pathname === '/intelligence' || pathname.startsWith('/intelligence/')) return true;
  if (pathname === '/reports' || pathname.startsWith('/reports/')) return true;
  if (pathname === '/timeline' || pathname.startsWith('/timeline/')) return true;
  if (pathname === '/status' || pathname.startsWith('/status/')) return true;
  if (pathname === '/action-center' || pathname.startsWith('/action-center/')) return true;
  if (pathname === '/document-intelligence' || pathname.startsWith('/document-intelligence/')) return true;
  return false;
}

export function getRequiredRoleForRoute(pathname: string): UserRole | null {
  if (isFieldRoute(pathname)) return 'FIELD_OFFICER';
  if (isLandownerRoute(pathname)) return 'LANDOWNER';
  if (isAdminRoute(pathname)) return 'ADMIN';
  return null;
}

export function canRoleAccessRoute(role: UserRole | null | undefined, pathname: string): boolean {
  if (isPublicRoute(pathname)) return true;
  if (!role) return false;

  const requiredRole = getRequiredRoleForRoute(pathname);
  if (!requiredRole) return true;

  return role === requiredRole;
}

// =============================================================================
// SAFE REDIRECT RESOLVER
// =============================================================================

/**
 * Validates and resolves a safe post-authentication return URL.
 * Prevents open-redirect vulnerabilities and cross-portal bounce loops.
 *
 * @param role The authenticated user's role
 * @param requestedNext The raw ?next= search param
 * @returns The authorized destination URL (defaults to role dashboard if invalid/unauthorized)
 */
export function getSafeRedirectUrl(role: UserRole | null | undefined, requestedNext?: string | null): string {
  const defaultDashboard = role ? ROLE_DASHBOARDS[role] : '/';

  if (!requestedNext) {
    return defaultDashboard;
  }

  const trimmed = requestedNext.trim();

  // Strict check: must start with '/' and not '//' (prevents protocol-relative open redirects like //evil.com)
  if (!trimmed.startsWith('/') || trimmed.startsWith('//') || trimmed.includes('\\')) {
    return defaultDashboard;
  }

  // Parse path without query or hash for permission validation
  const pathOnly = trimmed.split('?')[0].split('#')[0];

  // If user cannot access the requested path with their role, route to their default dashboard
  if (!canRoleAccessRoute(role, pathOnly)) {
    return defaultDashboard;
  }

  // Don't redirect back to a login or unauthorized page
  if (
    pathOnly === '/login' ||
    pathOnly === '/field/login' ||
    pathOnly === '/landowner/login' ||
    pathOnly === '/unauthorized'
  ) {
    return defaultDashboard;
  }

  return trimmed;
}
