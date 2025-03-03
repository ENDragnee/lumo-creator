// middleware.ts
import { getToken } from 'next-auth/jwt';
import { NextResponse } from 'next/server';

const publicRoutes = ['/', '/home', '/auth/signin', '/auth/signup'];

export async function middleware(request) {
  const token = await getToken({ req: request });
  const { pathname } = new URL(request.url);

  // Authentication logic
  if (publicRoutes.includes(pathname)) {
    return NextResponse.next();
  }

  if (!token && !publicRoutes.includes(pathname)) {
    const signInUrl = new URL('/auth/signin', request.url);
    signInUrl.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(signInUrl);
  }

  if (token && publicRoutes.includes(pathname)) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|public).*)'
  ]
};
