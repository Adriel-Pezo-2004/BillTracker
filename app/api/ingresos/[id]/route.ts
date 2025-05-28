import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

// Obtener un ingreso por ID
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  try {
    const ingreso = await prisma.ingresos.findUnique({ where: { id } })
    if (!ingreso) {
      return NextResponse.json({ error: "No encontrado" }, { status: 404 })
    }
    return NextResponse.json(ingreso)
  } catch (error) {
    if (typeof error === "object" && error !== null && "code" in error && (error as any).code === "P2025") {
      return NextResponse.json({ error: "Ingreso no encontrado" }, { status: 404 })
    }
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}

// Editar un ingreso por ID
export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  try {
    const data = await request.json()
    const ingreso = await prisma.ingresos.update({
      where: { id },
      data,
    })
    return NextResponse.json(ingreso)
  } catch (error) {
    if (typeof error === "object" && error !== null && "code" in error && (error as any).code === "P2025") {
      return NextResponse.json({ error: "Ingreso no encontrado" }, { status: 404 })
    }
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}

// Eliminar un ingreso por ID
export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  try {
    await prisma.ingresos.delete({ where: { id } })
    return NextResponse.json({ message: "Eliminado" })
  } catch (error) {
    if (typeof error === "object" && error !== null && "code" in error && (error as any).code === "P2025") {
      return NextResponse.json({ error: "Ingreso no encontrado" }, { status: 404 })
    }
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
