import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { put } from '@vercel/blob';
import crypto from 'crypto';

// GET: Trae todas las comisarías AND las notificaciones existentes
export async function GET() {
  try {
    const comisarías = await prisma.comisaria.findMany({
      select: { id: true, nombre: true },
      orderBy: { nombre: 'asc' },
    });

    const notificaciones = await prisma.notificacion.findMany({
      orderBy: { fechaCreacion: 'desc' },
    });

    return NextResponse.json({ comisarías, notificaciones });
  } catch (error) {
    console.error('❌ Error al obtener datos judiciales:', error);
    return NextResponse.json({ error: 'Error al obtener datos judiciales' }, { status: 500 });
  }
}

// POST: Crea una nueva notificación enviada por el juzgado
export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    
    const nroExpediente = formData.get('nroExpediente') as string;
    const caratula = formData.get('caratula') as string;
    const destinatario = formData.get('destinatario') as string;
    const domicilio = formData.get('domicilio') as string;
    const comisariaAsignadaId = formData.get('comisariaAsignadaId') as string;
    const archivoDoc = formData.get('documentoJudicial') as File;

    if (!nroExpediente || !caratula || !destinatario || !domicilio || !comisariaAsignadaId || !archivoDoc) {
      return NextResponse.json({ error: 'Faltan campos obligatorios o el documento judicial' }, { status: 400 });
    }

    const usuarioJudicial = await prisma.usuario.findFirst({
      where: { rol: 'JUDICIAL' }
    });

    if (!usuarioJudicial) {
      return NextResponse.json({ error: 'No hay usuarios judiciales configurados' }, { status: 500 });
    }

    let documentoUrl = "";
    if (archivoDoc.size > 0) {
      const nombreArchivoLimpio = `cedula-${nroExpediente.replace(/[/ ]/g, '-')}-${Date.now()}.${archivoDoc.name.split('.').pop()}`;
      
      const blobRealizado = await put(nombreArchivoSanitizado(nombreArchivoLimpio), archivoDoc, {
        access: 'private', 
      });
      documentoUrl = blobRealizado.url;
    } else {
      return NextResponse.json({ error: 'El archivo adjunto se encuentra vacío' }, { status: 400 });
    }

    const nuevaNotificacion = await prisma.notificacion.create({
      data: {
        nroExpediente,
        caratula,
        destinatario,
        domicilio,
        comisariaAsignadaId,
        usuarioCreadorId: usuarioJudicial.id,
        pdfUrl: documentoUrl,
        estado: 'ENVIADA',
      },
    });

    const nuevoIdLog = crypto.randomUUID();
    const detallesLog = `Cédula emitida formalmente por el Juzgado. Documento alojado en el repositorio central de Vercel Blob.`;
    
    await prisma.$executeRaw`
      INSERT INTO "AuditLog" (id, accion, detalles, "notificacionId", "usuarioId", fecha)
      VALUES (${nuevoIdLog}, 'EMISION_CEDULA', ${detallesLog}, ${nuevaNotificacion.id}, ${usuarioJudicial.id}, NOW())
    `;

    return NextResponse.json({ success: true, notificacion: nuevaNotificacion }, { status: 201 });
  } catch (error) {
    console.error('❌ Error al crear la notificación:', error);
    return NextResponse.json({ error: 'Error interno al procesar la notificación' }, { status: 500 });
  }
}

function nombreArchivoSanitizado(nombre: string): string {
  return nombre.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}




