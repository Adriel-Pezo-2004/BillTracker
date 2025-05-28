import { NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import type { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Permitir acceso libre a login, registro, API, archivos estáticos, etc.
  if (
    pathname.startsWith('/login') ||
    pathname.startsWith('/registro') ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon.ico')
  ) {
    return NextResponse.next();
  }

  // Verifica si hay sesión
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });

  const res = NextResponse.next();

  if (!token) {
    // Elimina cookie userId si existe (opcional, pero recomendado para evitar desincronía)
    if (request.cookies.get('userId')) {
      res.cookies.set('userId', '', { path: '/', maxAge: 0 });
    }
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    return NextResponse.redirect(url);
  }

  // Si tenemos sesión, sincroniza la cookie userId (si no existe o cambió)
  if (token.id && request.cookies.get('userId')?.value !== String(token.id)) {
    res.cookies.set('userId', String(token.id), {
      path: '/',
      httpOnly: false, // para que el frontend la lea
      sameSite: 'lax',
      // secure: true, // descomenta si solo usas https
    });
  }

  return res;
}

export const config = {
  matcher: [
    // Proteger todas las rutas menos las públicas
    '/((?!api|login|registro|_next|favicon.ico).*)',
  ],
};