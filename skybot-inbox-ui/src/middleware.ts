import createMiddleware from 'next-intl/middleware';
import {locales, defaultLocale} from './i18n/config';
import { NextRequest, NextResponse } from 'next/server';

const intlMiddleware = createMiddleware({
  locales,
  defaultLocale
});

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
  '/account/login',
  '/account/register'
];

export default function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Extract locale and path without locale
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
    const locale = pathname.split('/')[1] || defaultLocale;
    const loginUrl = new URL(`/${locale}/account/login`, request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // If logged in and trying to access login page, redirect to inbox
  if (isPublicRoute && token && pathnameWithoutLocale === '/account/login') {
    const locale = pathname.split('/')[1] || defaultLocale;
    return NextResponse.redirect(new URL(`/${locale}/inbox`, request.url));
  }

  // Apply i18n middleware
  return intlMiddleware(request);
}

export const config = {
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)']
};
