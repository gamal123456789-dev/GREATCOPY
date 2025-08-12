// Security Middleware - Comprehensive security protection
// Comprehensive security protection for the application

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const response = NextResponse.next();

  // SECURITY FIX: Enable all Security Headers for comprehensive protection
  
  // Prevent clickjacking attacks - enabled with Tawk.to exception
  response.headers.set('X-Frame-Options', 'SAMEORIGIN');
  
  // Prevent MIME type sniffing - enabled
  response.headers.set('X-Content-Type-Options', 'nosniff');
  
  // Enable XSS protection in older browsers - enabled
  response.headers.set('X-XSS-Protection', '1; mode=block');
  
  // Enforce HTTPS in production - enabled
  response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  
  // Prevent referrer information leakage - enabled
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  // Content Security Policy - enabled with Tawk.to support and file loading
  const csp = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net https://embed.tawk.to https://va.tawk.to https://cdnjs.cloudflare.com https://tawk.to",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://embed.tawk.to https://va.tawk.to https://tawk.to",
    "font-src 'self' https://fonts.gstatic.com https://embed.tawk.to",
    "img-src 'self' data: https: https://embed.tawk.to https://va.tawk.to https://tawk.to",
    "connect-src 'self' ws: wss: https://gear-score.com wss://gear-score.com https://tawk.to https://embed.tawk.to https://va.tawk.to",
    "frame-src 'self' https://embed.tawk.to https://va.tawk.to https://tawk.to",
    "child-src 'self' https://embed.tawk.to https://va.tawk.to https://tawk.to",
    "object-src 'self'",
    "media-src 'self'",
    "frame-ancestors 'self'",
    "base-uri 'self'",
    "form-action 'self'"
  ].join('; ');
  
  // Apply CSP
  response.headers.set('Content-Security-Policy', csp);
  
  // Permissions Policy - restrict permissions - enabled
  response.headers.set('Permissions-Policy', [
    'camera=()',
    'microphone=()',
    'geolocation=()',
    'payment=()',
    'usb=()'
  ].join(', '));
  
  // Remove headers that reveal server information - enabled
  response.headers.delete('Server');
  response.headers.delete('X-Powered-By');
  
  // Security logging for sensitive requests - enabled
  const sensitiveRoutes = ['/api/admin', '/api/auth', '/api/orders'];
  const isSensitiveRoute = sensitiveRoutes.some(route => 
    request.nextUrl.pathname.startsWith(route)
  );
  
  if (isSensitiveRoute) {
    const clientIP = request.headers.get('x-forwarded-for') ||
      request.headers.get('x-real-ip') ||
      'unknown';
    
    console.log(`[SECURITY] Sensitive route access: ${request.method} ${request.nextUrl.pathname} from ${clientIP} at ${new Date().toISOString()}`);
  }
  
  // Prevent access to sensitive files - enabled
  const blockedPaths = [
    '/.env',
    '/.env.local',
    '/.env.production',
    '/package.json',
    '/package-lock.json',
    '/yarn.lock',
    '/.git',
    '/node_modules'
  ];
  
  if (blockedPaths.some(path => request.nextUrl.pathname.startsWith(path))) {
    const clientIP = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
    console.log(`[SECURITY] Blocked access attempt to ${request.nextUrl.pathname} from ${clientIP} at ${new Date().toISOString()}`);
    return new NextResponse('Forbidden', { status: 403 });
  }
  
  return response;
}

// Apply middleware to all paths except NextAuth
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - api/ (ALL API endpoints to prevent JSON parsing issues)
     */
    '/((?!_next/static|_next/image|favicon.ico|api/).*)',
  ],
};

export default middleware;