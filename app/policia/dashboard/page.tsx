import { redirect } from 'next/navigation' 
import { prisma } from '@/lib/db'
import { revalidatePath } from 'next/cache'
import crypto from 'crypto'
import Link from 'next/link'
import { put } from '@vercel/blob'
import { TablaCedulasPolicia } from '@/app/components/TablasCedulas'

interface NotificacionConCreador {
  id: string
  nroExpediente: string
  caratula: string
  destinatario: string
  domicilio: string
  pdfUrl: string
  fotoComprobanteUrl: string | null
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

  const notificacionExistente = await prisma.notificacion.findUnique({
    where: { id: notificacionId },
    select: { pdfUrl: true }
  })

  await prisma.notificacion.update({
    where: { id: notificacionId },
    data: { 
      estado: 'IMPRESA',
      historialEstados: { create: { estado: 'IMPRESA' } }
    }
  })

  await prisma.auditLog.create({
    data: {
      id: nuevoIdLog,
      accion: 'IMPRESA_POLICIA',
      detalles: 'La comisaria descargo / imprimio la cedula.',
      notificacionId: notificacionId,
      usuarioId: comisariaId,
    }
  })

  revalidatePath('/policia/dashboard')

  if (notificacionExistente && notificacionExistente.pdfUrl) {
    redirect(notificacionExistente.pdfUrl)
  }
}

// 2. ACCIÓN: Cerrar la Cédula (CUMPLIMENTADA o FRUSTRADA)
async function resolverNotificacion(formData: FormData) {
  'use server'
  const id = formData.get('id') as string
  const nuevoEstado = formData.get('estado') as 'CUMPLIMENTADA' | 'FRUSTRADA'
  const observaciones = formData.get('observaciones') as string
  const file = formData.get('comprobanteFoto') as File
  const comisariaId = "315acb5c-ac71-4abc-94c3-083f8e7c01cd" 
  const nuevoIdLog = crypto.randomUUID()

  let fotoComprobanteUrl: string | undefined = undefined

  if (file && file.size > 0) {
    const blob = await put(`comprobantes/${crypto.randomUUID()}-${file.name}`, file, {
      access: 'private',
    })
    fotoComprobanteUrl = blob.url
  }

    // Verificamos el estado actual en la base de datos antes de permitir guardar
  const actual = await prisma.notificacion.findUnique({
    where: { id },
    select: { estado: true }
  });

  if (!actual || actual.estado === 'CUMPLIMENTADA' || actual.estado === 'FRUSTRADA') {
    throw new Error('Operación denegada: esta cédula ya se encuentra cerrada.');
  }

  await prisma.notificacion.update({
    where: { id },
    data: {
      estado: nuevoEstado,
      observaciones,
      fechaCumplimentada: new Date(),
      ...(fotoComprobanteUrl && { fotoComprobanteUrl }),
      historialEstados: { create: { estado: nuevoEstado } }
    }
  })

  const accionLog = nuevoEstado === 'CUMPLIMENTADA' ? 'DILIGENCIA_POSITIVA' : 'DILIGENCIA_FRUSTRADA'
  const detallesLog = `Resultado cargado. Observaciones: ${observaciones}`

  await prisma.auditLog.create({
    data: {
      id: nuevoIdLog,
      accion: accionLog,
      detalles: detallesLog,
      notificacionId: id,
      usuarioId: comisariaId,
    }
  })

  revalidatePath('/policia/dashboard')
  redirect('/policia/dashboard') 
}

// 3. ACCIÓN: Cerrar sesión desde el Servidor
async function procesarCerrarSesion() {
  'use server'
  redirect('/')
}
export default async function PoliciaDashboard({
  searchParams,
}: {
  searchParams: Promise<{ id?: string; ver?: string }>
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

  const archivoAVer = params.ver || null
  const esWord = archivoAVer?.endsWith('.docx') || archivoAVer?.endsWith('.doc')

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

        <form action={procesarCerrarSesion}>
          <button 
            type="submit" 
            className="text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 px-4 py-2 rounded-lg transition-colors"
          >
            Cerrar Sesión
          </button>
        </form>
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

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">
                  📸 Adjuntar Acta Digitalizada / Foto de Firma
                </label>
                <input 
                  type="file" 
                  name="comprobanteFoto"
                  accept="image/*,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                  className="w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer border border-slate-200 rounded-lg p-1.5 bg-white"
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

                {notificacionSeleccionada.fotoComprobanteUrl && (
                  <Link 
                    href={`?id=${notificacionSeleccionada.id}&ver=${encodeURIComponent(notificacionSeleccionada.fotoComprobanteUrl)}`}
                    className="block text-center text-xs font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 py-2 rounded-lg mb-3 transition-colors border border-emerald-200"
                  >
                    👁️ Ver Acta Digitalizada Cargada
                  </Link>
                )}

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
        <TablaCedulasPolicia 
          notificaciones={notificaciones} 
          seleccionadaId={params.id} 
        />
      </main>
      {/* MODAL VISUALIZADOR DE ACTAS */}
      {archivoAVer && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl max-h-[85vh] flex flex-col border border-slate-200 overflow-hidden">
            
            <div className="p-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
              <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                📄 Visualización de Documento Adjunto
              </h3>
              <Link 
                href={params.id ? `?id=${params.id}` : "/policia/dashboard"} 
                className="text-slate-400 hover:text-slate-600 bg-white border border-slate-200 rounded-md p-1 px-2.5 text-xs font-semibold shadow-xs"
              >
                Cerrar ✕
              </Link>
            </div>

            <div className="p-4 flex-1 bg-slate-100 overflow-y-auto flex items-center justify-center min-h-[450px]">
              {esWord ? (
                <div className="text-center p-8 bg-white border rounded-xl max-w-sm shadow-xs">
                  <p className="text-slate-700 font-medium mb-3 text-sm">
                    Los archivos de Word (.doc / .docx) no se pueden previsualizar de forma nativa en el navegador.
                  </p>
                  <a 
                    href={archivoAVer} 
                    download
                    className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs px-4 py-2 rounded-lg transition-colors shadow-sm"
                  >
                    ⬇️ Descargar archivo Word
                  </a>
                </div>
              ) : (
                <iframe 
                  src={archivoAVer} 
                  className="w-full h-[60vh] rounded-lg border border-slate-300 bg-white"
                  title="Visor de Acta PDF"
                />
              )}
            </div>

          </div>
        </div>
      )}

    </div>
  )
}
