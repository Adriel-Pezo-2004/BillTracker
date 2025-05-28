import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';

export async function POST(request: Request) {
  const data = await request.json();

  // Obtener la sesión y el userId desde NextAuth
  const session = await getServerSession(authOptions);
  // Type assertion to include 'id' in user object
  const userId = (session?.user as { id?: string })?.id;

  if (!userId) {
    return NextResponse.json({ error: 'Usuario no autenticado' }, { status: 401 });
  }

  // Verifica que el usuario exista
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });
  if (!user) {
    return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
  }

  const ingreso = await prisma.ingresos.create({
    data: {
      ...data,
      usuario: { connect: { id: userId } }
    }
  });

  return NextResponse.json(ingreso);
}

// Listar todos los ingresos
export async function GET() {
  const ingresos = await prisma.ingresos.findMany();
  return NextResponse.json(ingresos);
}