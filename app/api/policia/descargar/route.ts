import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import type { Prisma } from '@prisma/client'; 
import { get } from '@vercel/blob';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const notificacionId = searchParams.get('id');

    if (!notificacionId) {
      return NextResponse.json({ error: 'Falta el ID de la notificación' }, { status: 400 });
    }

    // 1. Buscamos el registro en tu Postgres local
    const notificacion = await prisma.notificacion.findUnique({
      where: { id: notificacionId },
      select: { pdfUrl: true }
    });

    if (!notificacion || !notificacion.pdfUrl) {
      return NextResponse.json({ error: 'Archivo no encontrado en la base de datos' }, { status: 404 });
    }

        // 🚀 CORREGIDO: Usamos el casting tipado estricto de Prisma para evitar que salte el linter por el 'any'
    const opcionesActualizacion = {
      where: { id: notificacionId },
      data: {
        estado: 'IMPRESA',
        historialEstados: {
          create: {
            estado: 'IMPRESA'
          }
        }
      }
    } as Prisma.NotificacionUpdateArgs;

    await prisma.notificacion.update(opcionesActualizacion);

    // 2. 🚀 CORREGIDO: Usamos el SDK oficial con acceso privado. 
    // Esto inyecta tus tokens del .env automáticamente salteando el error de red.
    const datosBlob = await get(notificacion.pdfUrl, { access: 'private' });

    if (!datosBlob || !datosBlob.stream) {
      return NextResponse.json({ error: 'El repositorio central no devolvió el flujo de datos' }, { status: 500 });
    }

    // 3. Detectamos la extensión para configurar el Content-Type correcto
    const esWord = notificacion.pdfUrl.endsWith('.docx') || notificacion.pdfUrl.endsWith('.doc');
    const contentType = esWord 
      ? 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' 
      : 'application/pdf';

    // 4. Transformamos el flujo de lectura (stream) en una respuesta binaria directa para el navegador
    const response = new NextResponse(datosBlob.stream as any, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `inline; filename="cedula-${notificacionId}"`,
      },
    });

    return response;

  } catch (error) {
    console.error('❌ Error en el puente de descarga privada:', error);
    return NextResponse.json({ error: 'Error interno del servidor al procesar el binario' }, { status: 500 });
  }
}
