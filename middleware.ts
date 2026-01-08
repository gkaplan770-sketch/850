import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(req: NextRequest) {
  const isAdminArea = req.nextUrl.pathname.startsWith('/admin');
  const isLoginPage = req.nextUrl.pathname === '/admin/login';
  const hasToken = req.cookies.has('admin_token');

  // הדפסה כדי שנבין מה קורה
  if (isAdminArea) {
      console.log(`Middleware Check: Page: ${req.nextUrl.pathname}, Has Token? ${hasToken}`);
  }

  if (isAdminArea && !isLoginPage && !hasToken) {
    console.log("Blocking user: Redirecting to login");
    return NextResponse.redirect(new URL('/admin/login', req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*'],
}