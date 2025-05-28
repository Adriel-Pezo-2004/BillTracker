import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';

// Crear un gasto
export async function POST(request: Request) {
  const data = await request.json();

  // Obtener la sesión y el userId desde NextAuth
  const session = await getServerSession(authOptions);
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

  const gasto = await prisma.gastos.create({
    data: {
      ...data, // debe incluir tipo
      usuario: { connect: { id: userId } }
    }
  });

  return NextResponse.json(gasto);
}

// Listar todos los gastos
export async function GET() {
  const gastos = await prisma.gastos.findMany();
  return NextResponse.json(gastos);
}