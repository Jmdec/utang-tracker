// middleware.ts
import { NextRequest, NextResponse } from 'next/server';

export function middleware(req: NextRequest) {
  const token = req.cookies.get('auth_token')?.value;
  const { pathname } = req.nextUrl;

  // Allow auth pages through
  const isAuthPage =
    pathname.startsWith('/auth/login') ||
    pathname.startsWith('/auth/register');

  // If no token and not on auth page → redirect to /auth/login
  if (!token && !isAuthPage) {
    return NextResponse.redirect(new URL('/auth/login', req.url));
  }

  // If logged in and trying to access auth pages → redirect to home
  if (token && isAuthPage) {
    return NextResponse.redirect(new URL('/', req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|manifest.json|icon.*|apple-icon.*).*)',
  ],
};