import { NextRequest, NextResponse } from 'next/server';

// Hardcoded locale - simplified i18n
const LOCALE = 'es';

// Protected routes that require authentication
const protectedRoutes = [
  '/inbox',
  '/alerts',
  '/analytics',
  '/calendar',
  '/crm',
  '/settings'
];

// Public routes that don't require authentication
const publicRoutes = [
  '/account/login'
];

export default function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Extract path without locale prefix
  const pathnameWithoutLocale = pathname.replace(/^\/[a-z]{2}/, '');

  // Check if accessing a protected route
  const isProtectedRoute = protectedRoutes.some(route =>
    pathnameWithoutLocale.startsWith(route)
  );

  // Check if accessing a public route
  const isPublicRoute = publicRoutes.some(route =>
    pathnameWithoutLocale.startsWith(route)
  );

  // Get auth token from cookies
  const token = request.cookies.get('accessToken')?.value;

  // If trying to access protected route without token, redirect to login
  if (isProtectedRoute && !token) {
    const loginUrl = new URL(`/${LOCALE}/account/login`, request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // If logged in and trying to access login page, redirect to inbox
  if (isPublicRoute && token && pathnameWithoutLocale === '/account/login') {
    return NextResponse.redirect(new URL(`/${LOCALE}/inbox`, request.url));
  }

  // Redirect root to /fr
  if (pathname === '/') {
    return NextResponse.redirect(new URL(`/${LOCALE}`, request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)']
};
