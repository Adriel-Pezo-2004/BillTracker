import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const [ingresosRaw, gastosRaw] = await Promise.all([
      prisma.ingresos.findMany(),
      prisma.gastos.findMany(),
    ]);

    // Mapea los campos para que coincidan con lo que espera el frontend
    const ingresos = ingresosRaw.map(i => ({
      id: i.id,
      nombre: i.nombre,
      monto: i.ingresos, // <-- aquí
      tipo: i.tipo,
      createdAt: i.fecha ? new Date(i.fecha).toISOString() : null, // <-- aquí
    }));

    const gastos = gastosRaw.map(g => ({
      id: g.id,
      nombre: g.nombre,
      monto: g.gasto, // <-- aquí
      tipo: g.tipo,
      createdAt: g.fecha ? new Date(g.fecha).toISOString() : null, // <-- aquí
    }));

    return NextResponse.json({ ingresos, gastos });
  } catch (error) {
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}