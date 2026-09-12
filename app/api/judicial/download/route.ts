import { NextResponse } from 'next/server';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const fileUrl = searchParams.get('url');

    if (!fileUrl) {
        return NextResponse.json({ error: 'Falta la URL del documento' }, { status: 400 });
    }

    // 🔐 Hacemos un fetch directo al archivo privado inyectando el token secreto de tu .env
    const respuestaArchivo = await fetch(fileUrl, {
        headers: {
        Authorization: `Bearer ${process.env.BLOB_READ_WRITE_TOKEN}`,
        },
    });

    if (!respuestaArchivo.ok) {
        return NextResponse.json({ error: 'No se pudo leer el archivo privado' }, { status: 403 });
    }

    // Convertimos el archivo recibido en un array de datos binarios pura
    const datosBinarios = await respuestaArchivo.arrayBuffer();
    
    // Obtenemos el nombre original del archivo leyendo la URL
    const nombreArchivo = fileUrl.split('/').pop() || 'documento-judicial';

    // Devolvemos el archivo binario directo al navegador con los headers de descarga nativa
    return new Response(datosBinarios, {
        headers: {
        'Content-Type': respuestaArchivo.headers.get('Content-Type') || 'application/octet-stream',
        'Content-Disposition': `attachment; filename="${nombreArchivo}"`,
        },
    });
    } catch (error) {
    console.error('❌ Error en el proxy de descarga:', error);
    return NextResponse.json({ error: 'Error al procesar la descarga' }, { status: 500 });
    }
}
