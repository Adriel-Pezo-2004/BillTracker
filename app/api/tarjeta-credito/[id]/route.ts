import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

function getUserIdFromCookie(request: NextRequest) {
  const cookieHeader = request.headers.get('cookie') || '';
  const match = cookieHeader.match(/(?:^|;\s*)userId=([^;]*)/);
  return match ? decodeURIComponent(match[1]) : null;
}

// PUT - Actualizar un gasto de tarjeta de crédito
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = getUserIdFromCookie(request);
    
    if (!userId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { nombre, gasto, tipo } = await request.json();
    const { id } = await params;

    if (!nombre || gasto === undefined || !tipo) {
      return NextResponse.json({ error: 'Faltan campos requeridos' }, { status: 400 });
    }

    // Verificar que el gasto de tarjeta pertenece al usuario
    const gastoTarjetaExistente = await prisma.tarjetaCredito.findFirst({
      where: { id, userId }
    });

    if (!gastoTarjetaExistente) {
      return NextResponse.json({ error: 'Gasto de tarjeta no encontrado' }, { status: 404 });
    }

    const gastoTarjetaActualizado = await prisma.tarjetaCredito.update({
      where: { id },
      data: {
        nombre,
        gasto: parseFloat(gasto),
        tipo
      }
    });

    return NextResponse.json(gastoTarjetaActualizado);
  } catch (error) {
    console.error('Error al actualizar gasto de tarjeta:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

// DELETE - Eliminar un gasto de tarjeta de crédito
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = getUserIdFromCookie(request);
    
    if (!userId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { id } = await params;

    // Verificar que el gasto de tarjeta pertenece al usuario
    const gastoTarjetaExistente = await prisma.tarjetaCredito.findFirst({
      where: { id, userId }
    });

    if (!gastoTarjetaExistente) {
      return NextResponse.json({ error: 'Gasto de tarjeta no encontrado' }, { status: 404 });
    }

    await prisma.tarjetaCredito.delete({
      where: { id }
    });

    return NextResponse.json({ message: 'Gasto de tarjeta eliminado correctamente' });
  } catch (error) {
    console.error('Error al eliminar gasto de tarjeta:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}