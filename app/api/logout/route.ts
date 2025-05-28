import { NextResponse } from 'next/server';

export async function POST() {
  const response = NextResponse.json({ message: 'Sesión cerrada correctamente' });

  // Eliminar cookie
  response.cookies.set('userId', '', {
    httpOnly: true,
    path: '/',
    sameSite: 'lax',
    maxAge: 0, // Expira inmediatamente
    secure: process.env.NODE_ENV === 'production',
  });

  return response;
}
