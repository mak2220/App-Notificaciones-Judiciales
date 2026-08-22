import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma"; 

export async function GET() {
  try {
    // 1. Buscamos todas las notificaciones en la base de datos
    // Podés filtrar por el ID del usuario creador si querés que cada juzgado solo vea las suyas
    const notificaciones = await prisma.notificacion.findMany({
      include: {
        comisariaAsignada: {
          select: {
            nombre: true, // Traemos solo el nombre de la comisaría para no exponer datos sensibles
          },
        },
      },
      orderBy: {
        fechaActualizada: "desc", // Mostramos primero lo último que se movió
      },
    });

    return NextResponse.json(notificaciones, { status: 200 });
  } catch (error) {
    console.error("Error al obtener el listado de control:", error);
    return NextResponse.json(
      { error: "Error interno del servidor al cargar las notificaciones." },
      { status: 500 }
    );
  }
}
