import { redirect } from 'next/navigation' 
import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import crypto from 'crypto'
import { put } from '@vercel/blob'

interface NotificacionConCreador {
  id: string
  nroExpediente: string
  caratula: string
  destinatario: string
  domicilio: string
  pdfUrl: string
  estado: 'ENVIADA' | 'IMPRESA' | 'CUMPLIMENTADA' | 'FRUSTRADA'
  usuarioCreador: {
    nombre: string
  }
}

// Helper seguro para obtener las clases de Tailwind según el estado del expediente
function obtenerEstilosBadge(estado: string): string {
  if (estado === 'ENVIADA') return 'bg-amber-50 text-amber-700 border-amber-200'
  if (estado === 'IMPRESA') return 'bg-blue-50 text-blue-700 border-blue-200'
  if (estado === 'CUMPLIMENTADA') return 'bg-emerald-50 text-emerald-700 border-emerald-200'
  return 'bg-rose-50 text-rose-700 border-rose-200'
}

// 1. ACCIÓN: Marcar Cédula como IMPRESA
async function marcarComoImpresa(formData: FormData) {
  'use server'
  const notificacionId = formData.get('notificacionId') as string
  const comisariaId = "315acb5c-ac71-4abc-94c3-083f8e7c01cd" 
  const nuevoIdLog = crypto.randomUUID()

  // Paso 1: Actualizar el estado de la notificación de forma segura y nativa
  await prisma.notificacion.update({
    where: { id: notificacionId },
    data: { estado: 'IMPRESA' }
  })

  // Paso 2: Crear el registro de auditoría ejecutando una consulta SQL pura
  await prisma.$executeRaw`
    INSERT INTO "AuditLog" (id, accion, detalles, "notificacionId", "comisariaId", fecha)
    VALUES (
      ${nuevoIdLog},
      'IMPRESA_POLICIA', 
      'La comisaria descargo / imprimio la cedula fisica para ir a la calle.', 
      ${notificacionId}, 
      ${comisariaId}, 
      NOW()
    )
  `
  revalidatePath('/policia/dashboard')
}

// 2. ACCIÓN: Cerrar la Cédula (CUMPLIMENTADA o FRUSTRADA)
async function resolverNotificacion(formData: FormData) {
  'use server'
  const id = formData.get('id') as string
  const nuevoEstado = formData.get('estado') as 'CUMPLIMENTADA' | 'FRUSTRADA'
  const observaciones = formData.get('observaciones') as string
  const comisariaId = "315acb5c-ac71-4abc-94c3-083f8e7c01cd" 
  const nuevoIdLog = crypto.randomUUID()

  // Paso 1: Actualizar el estado y el informe técnico de la cédula en Neon DB
  await prisma.notificacion.update({
    where: { id },
    data: {
      estado: nuevoEstado,
      observaciones,
      fechaCumplimentada: new Date()
    }
  })

  // Definir las etiquetas del log legal según el botón seleccionado por el oficial
  const accionLog = nuevoEstado === 'CUMPLIMENTADA' ? 'DILIGENCIA_POSITIVA' : 'DILIGENCIA_FRUSTRADA'
  const detallesLog = `Resultado final cargado por la seccional. Observaciones: ${observaciones}`

  // Paso 2: Grabar la auditoría inmutable directamente con SQL Puro en PostgreSQL
  await prisma.$executeRaw`
    INSERT INTO "AuditLog" (id, accion, detalles, "notificacionId", "comisariaId", fecha)
    VALUES (
      ${nuevoIdLog},
      ${accionLog}, 
      ${detallesLog}, 
      ${id}, 
      ${comisariaId}, 
      NOW()
    )
  `  
  revalidatePath('/policia/dashboard')
  // 👈 NUEVO: Al redireccionar a la ruta limpia, el formulario de la izquierda se vacía por completo al instante
  redirect('/policia/dashboard') 
}

export default async function PoliciaDashboard({
  searchParams,
}: {
  searchParams: Promise<{ id?: string }>
}) {
  const params = await searchParams
  const miComisariaId = "315acb5c-ac71-4abc-94c3-083f8e7c01cd"

  const notificacionesRaw = await prisma.notificacion.findMany({
    where: { comisariaAsignadaId: miComisariaId },
    include: { usuarioCreador: { select: { nombre: true } } },
    orderBy: { fechaCreacion: 'desc' }
  })

  const notificaciones = notificacionesRaw as unknown as NotificacionConCreador[]

  const notificacionSeleccionada = params.id 
    ? notificaciones.find((n: NotificacionConCreador) => n.id === params.id)
    : null

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 antialiased">
      {/* BARRA SUPERIOR INSTITUCIONAL */}
      <header className="bg-white border-b border-slate-200 px-8 py-4 flex justify-between items-center shadow-sm">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            👮 Portal Comisarías y Notificadores
          </h1>
          <p className="text-xs text-slate-500">Seccional Interviniente - En línea</p>
        </div>
        <button className="text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 px-4 py-2 rounded-lg transition-colors">
          Cerrar Sesión
        </button>
      </header>

      {/* DISEÑO DE PANTALLA PARTIDA DE DOS COLUMNAS */}
      <main className="max-w-[1600px] mx-auto p-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* COLUMNA IZQUIERDA: GESTIÓN Y CIERRE DE CÉDULA SELECCIONADA */}
        <section className="lg:col-span-4 bg-white p-6 rounded-xl border border-slate-200 shadow-sm h-fit">
          <h2 className="text-lg font-bold text-slate-900 border-b pb-3 mb-4">
            Diligenciar Notificación
          </h2>

          {notificacionSeleccionada ? (
            <form action={resolverNotificacion} className="space-y-4">
              <input type="hidden" name="id" value={notificacionSeleccionada.id} />
              
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">Causa / Carátula</label>
                <div className="p-3 bg-slate-50 rounded-lg text-sm font-medium border border-slate-100">
                  {notificacionSeleccionada.caratula}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">Destinatario y Domicilio</label>
                <div className="p-3 bg-slate-50 rounded-lg text-sm border border-slate-100 space-y-1">
                  <p><strong>Persona:</strong> {notificacionSeleccionada.destinatario}</p>
                  <p><strong>Lugar:</strong> {notificacionSeleccionada.domicilio}</p>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">Resultado del Acto en la Calle</label>
                <select 
                  name="estado" 
                  required
                  className="w-full p-2.5 bg-white border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                >
                  <option value="CUMPLIMENTADA">✔️ CUMPLIMENTADA (Diligencia Positiva)</option>
                  <option value="FRUSTRADA">❌ FRUSTRADA (Diligencia Negativa)</option>
                </select>
              </div>

              {/* 📷 NUEVO CAMPO: ADJUNTAR ACTA / FOTO DEL COMPROBANTE PAPEL */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">
                  📸 Adjuntar Acta Digitalizada / Foto de Firma
                </label>
                <input 
                  type="file" 
                  name="comprobanteFoto"
                  accept="image/*,application/pdf" // Permite sacar fotos directas con la cámara del celular o subir PDFs
                  className="w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer border border-slate-200 rounded-lg p-1.5"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">Informe u Observaciones del Acta</label>
                <textarea 
                  name="observaciones"
                  rows={4}
                  required
                  placeholder="Ej: Se notificó a la persona bajo firma / El domicilio se encuentra abandonado..."
                  className="w-full p-2.5 bg-white border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                />
              </div>

              <div className="pt-2">
                <a 
                  href={notificacionSeleccionada.pdfUrl} 
                  target="_blank" 
                  rel="noreferrer"
                  className="block text-center text-xs font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 py-2 rounded-lg mb-3 transition-colors"
                >
                  📄 Descargar Documento Judicial Original
                </a>

                <button 
                  type="submit" 
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-sm py-2.5 px-4 rounded-lg transition-colors shadow-sm"
                >
                  Cargar Resultado Legal
                </button>
              </div>
            </form>
          ) : (
            <div className="text-center py-12 text-slate-400 text-sm border-2 border-dashed border-slate-200 rounded-lg">
              Seleccioná una cédula del panel derecho para iniciar el informe técnico de entrega.
            </div>
          )}
        </section>

        {/* COLUMNA DERECHA: CONTROL DE CÉDULAS RECIBIDAS */}
        <section className="lg:col-span-8 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <h2 className="text-lg font-bold text-slate-900 border-b pb-3 mb-4">
            Control de Cédulas Recibidas
          </h2>

          {notificaciones.length === 0 ? (
            <div className="text-center py-12 text-slate-400 text-sm">
              No hay directivas judiciales registradas en esta seccional.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-400 text-xs font-semibold uppercase tracking-wider bg-slate-50/70">
                    <th className="py-3 px-4">Expediente</th>
                    <th className="py-3 px-4">Carátula / Juzgado</th>
                    <th className="py-3 px-4">Destinatario</th>
                    <th className="py-3 px-4 text-center">Estado</th>
                    <th className="py-3 px-4 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                {notificaciones.map((n: NotificacionConCreador) => {
                  const esSeleccionada = params.id === n.id;
                  return (
                    <tr 
                      key={n.id} 
                      className={`transition-colors border-b border-slate-100 cursor-pointer ${
                        esSeleccionada ? 'bg-blue-50/60 hover:bg-blue-50/80' : 'hover:bg-slate-50/80'
                      }`}
                    >
                      {/* Usamos padding cero en la celda y padding real en el enlace para que ocupe todo el espacio clickeable */}
                      <td className="p-0">
                        <a href={`?id=${n.id}`} className="block py-4 px-4 font-mono text-xs font-semibold text-slate-600 w-full h-full">
                          {n.nroExpediente}
                        </a>
                      </td>
                      
                      <td className="p-0">
                        <a href={`?id=${n.id}`} className="block py-4 px-4 w-full h-full">
                          <p className="font-medium text-slate-900">{n.caratula}</p>
                          <p className="text-xs text-slate-400">{n.usuarioCreador?.nombre}</p>
                        </a>
                      </td>
                    
                      <td className="p-0">
                        <a href={`?id=${n.id}`} className="block py-4 px-4 w-full h-full">
                          <p className="text-slate-700">{n.destinatario}</p>
                          <p className="text-xs text-slate-400 truncate max-w-[200px]">{n.domicilio}</p>
                        </a>
                      </td>
                    
                      <td className="p-0 text-center">
                        <a href={`?id=${n.id}`} className="block py-4 px-4 w-full h-full">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${obtenerEstilosBadge(n.estado)}`}>
                            {n.estado}
                          </span>
                        </a>
                      </td>
                    
                      {/* Las acciones de los botones quedan aisladas en su propia celda */}
                      <td className="py-4 px-4 text-right space-x-2 align-middle">
                        {n.estado === 'ENVIADA' && (
                          <form action={marcarComoImpresa} className="inline-block">
                            <input type="hidden" name="notificacionId" value={n.id} />
                            <button type="submit" className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 px-2.5 py-1.5 rounded font-medium transition-colors cursor-pointer">
                              🖨️ Imprimir
                            </button>
                          </form>
                        )}
                        
                        <a 
                          href={`?id=${n.id}`}
                          className="inline-block text-xs bg-blue-600 hover:bg-blue-700 text-white px-2.5 py-1.5 rounded font-medium transition-colors shadow-sm"
                        >
                          Procesar
                        </a>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              </table>
            </div>
          )}
        </section>

      </main>
    </div>
  )
}

