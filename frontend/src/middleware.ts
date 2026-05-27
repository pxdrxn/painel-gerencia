import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const token = request.cookies.get('sos_access_token')?.value;
  const { pathname } = request.nextUrl;

  // Rotas que exigem autenticação
  const protectedRoutes = [
    '/dashboard',
    '/disponibilidade',
    '/ferias',
    '/funcionarios',
    '/producao',
    '/unidades',
  ];

  const isProtected = protectedRoutes.some((route) => pathname.startsWith(route)) || pathname === '/';

  // Se o usuário não está autenticado e tenta acessar uma rota protegida
  if (isProtected && !token) {
    const loginUrl = new URL('/login', request.url);
    return NextResponse.redirect(loginUrl);
  }

  // Se o usuário já está autenticado e tenta acessar a tela de login
  if (pathname === '/login' && token) {
    const dashboardUrl = new URL('/dashboard', request.url);
    return NextResponse.redirect(dashboardUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
