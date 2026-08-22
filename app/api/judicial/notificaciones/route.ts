// src/app/api/judicial/notificaciones/route.ts
import { NextResponse } from 'next/server';
import prisma from '@/lib/db';

// GET: Trae todas las comisarías para el formulario de carga
// REEMPLAZÁ SOLO EL BLOQUE GET EN src/app/api/judicial/notificaciones/route.ts

// GET: Trae todas las comisarías AND las notificaciones existentes
export async function GET() {
  try {
    // 1. Traemos las comisarías para el formulario desplegable
    const comisarías = await prisma.comisaria.findMany({
      select: { id: true, nombre: true },
      orderBy: { nombre: 'asc' },
    });

    // 2. Traemos todas las notificaciones con los datos de la comisaría asignada
    const notificaciones = await prisma.notificacion.findMany({
      orderBy: { fechaCreacion: 'desc' }, // Las más nuevas primero
    });

    // Devolvemos ambos listados agrupados en un objeto JSON
    return NextResponse.json({ comisarías, notificaciones });
  } catch (error) {
    console.error('❌ Error al obtener datos judiciales:', error);
    return NextResponse.json({ error: 'Error al obtener datos judiciales' }, { status: 500 });
  }
}

// POST: Crea una nueva notificación enviada por el juzgado
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { nroExpediente, caratula, destinatario, domicilio, comisariaAsignadaId } = body;

    // Validamos campos requeridos (Removimos usuarioCreadorId porque lo buscamos acá abajo)
    if (!nroExpediente || !caratula || !destinatario || !domicilio || !comisariaAsignadaId) {
      return NextResponse.json({ error: 'Faltan campos obligatorios' }, { status: 400 });
    }

    // TAREA PENDIENTE: Antes de crear la notificación, buscamos un usuario judicial real en la DB
    const usuarioJudicial = await prisma.usuario.findFirst({
      where: { rol: 'JUDICIAL' }
    });

    if (!usuarioJudicial) {
      return NextResponse.json({ error: 'No hay usuarios judiciales configurados' }, { status: 500 });
    }

    // Guardamos en la base de datos de Neon vía Prisma usando el ID real encontrado
    const nuevaNotificacion = await prisma.notificacion.create({
      data: {
        nroExpediente,
        caratula,
        destinatario,
        domicilio,
        comisariaAsignadaId,
        usuarioCreadorId: usuarioJudicial.id, // Usamos el id real encontrado en la DB
        pdfUrl: 'https://ejemplo.com', // Simulación temporal de archivo
        estado: 'ENVIADA',
      },
    });

    return NextResponse.json({ success: true, notificacion: nuevaNotificacion }, { status: 201 });
  } catch (error) {
    console.error('❌ Error al crear la notificación:', error); // Usamos la variable para cumplir con ESLint
    return NextResponse.json({ error: 'Error al crear la notificación' }, { status: 500 });
  }
}
