import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Helper para extraer el id de la URL
function getIdFromRequest(request: Request) {
  const url = new URL(request.url);
  const parts = url.pathname.split("/");
  return parts[parts.length - 1];
}

// Obtener un gasto por ID
export async function GET(request: Request) {
  const id = getIdFromRequest(request);

  try {
    const gasto = await prisma.gastos.findUnique({ where: { id } });
    if (!gasto) {
      return NextResponse.json({ error: "No encontrado" }, { status: 404 });
    }
    return NextResponse.json(gasto);
  } catch (error) {
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}

// Editar un gasto por ID
export async function PUT(request: Request) {
  const id = getIdFromRequest(request);

  try {
    const data = await request.json();
    const gasto = await prisma.gastos.update({
      where: { id },
      data,
    });
    return NextResponse.json(gasto);
  } catch (error) {
    if (typeof error === "object" && error !== null && "code" in error && (error as any).code === "P2025") {
      return NextResponse.json({ error: "Gasto no encontrado" }, { status: 404 });
    }
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}

// Eliminar un gasto por ID
export async function DELETE(request: Request) {
  const id = getIdFromRequest(request);

  try {
    await prisma.gastos.delete({ where: { id } });
    return NextResponse.json({ message: "Eliminado" });
  } catch (error) {
    if (typeof error === "object" && error !== null && "code" in error && (error as any).code === "P2025") {
      return NextResponse.json({ error: "Gasto no encontrado" }, { status: 404 });
    }
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}