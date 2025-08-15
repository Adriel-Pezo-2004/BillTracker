import { type NextRequest, NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

function getUserIdFromCookie(request: NextRequest) {
  const cookieHeader = request.headers.get("cookie") || ""
  const match = cookieHeader.match(/(?:^|;\s*)userId=([^;]*)/)
  return match ? decodeURIComponent(match[1]) : null
}

// GET - Obtener todos los gastos de tarjeta de crédito del usuario
export async function GET(request: NextRequest) {
  try {
    const userId = getUserIdFromCookie(request)

    if (!userId) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const tarjetaCredito = await prisma.tarjetaCredito.findMany({
      where: { userId },
      orderBy: { fecha: "desc" },
    })

    return NextResponse.json(tarjetaCredito)
  } catch (error) {
    console.error("Error al obtener gastos de tarjeta:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}

// POST - Crear un nuevo gasto de tarjeta de crédito
export async function POST(request: NextRequest) {
  try {
    const userId = getUserIdFromCookie(request)

    if (!userId) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const { nombre, gasto, tipo } = await request.json()

    if (!nombre || gasto === undefined || !tipo) {
      return NextResponse.json({ error: "Faltan campos requeridos" }, { status: 400 })
    }

    const nuevoGastoTarjeta = await prisma.tarjetaCredito.create({
      data: {
        nombre,
        gasto: Number.parseFloat(gasto),
        tipo,
        userId,
      },
    })

    return NextResponse.json(nuevoGastoTarjeta, { status: 201 })
  } catch (error) {
    console.error("Error al crear gasto de tarjeta:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
