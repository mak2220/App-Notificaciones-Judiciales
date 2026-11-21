//app/judicial/dashboard/page.tsx
'use client';

import { useState, useEffect, FormEvent } from 'react';
import Link from 'next/link';
interface Comisaria {
  id: string;
  nombre: string;
}

interface HistorialEstado {
  id: string;
  estado: 'ENVIADA' | 'IMPRESA' | 'CUMPLIMENTADA' | 'FRUSTRADA';
  fechaHora: string; 
}

interface Notificacion {
  id: string;
  nroExpediente: string;
  caratula: string;
  destinatario: string;
  domicilio: string;
  estado: 'ENVIADA' | 'IMPRESA' | 'CUMPLIMENTADA' | 'FRUSTRADA';
  pdfUrl: string; 
  fotoComprobanteUrl?: string | null;
  historialEstados?: HistorialEstado[];
}


export default function JudicialDashboard() {
  const [comisarias, setComisarias] = useState<Comisaria[]>([]);
  const [notificaciones, setNotificaciones] = useState<Notificacion[]>([]);
  
  const [nroExpediente, setNroExpediente] = useState('');
  const [caratula, setCaratula] = useState('');
  const [destinatario, setDestinatario] = useState('');
  const [domicilio, setDomicilio] = useState('');
  const [comisariaId, setComisariaId] = useState('');
  // 📎 NUEVO ESTADO: Guarda el archivo seleccionado en la computadora antes de enviarlo
  const [documentoJudicial, setDocumentoJudicial] = useState<File | null>(null);
    // 🔍 NUEVO ESTADO: Para capturar el número de expediente a destacar
  const [expedienteBuscado, setExpedienteBuscado] = useState('');
  const notificacionesOrdenadas = [...notificaciones].sort((a, b) => {
 
    if (expedienteBuscado.trim() !== '') {
      const coincideA = a.nroExpediente.toLowerCase().includes(expedienteBuscado.toLowerCase());
      const coincideB = b.nroExpediente.toLowerCase().includes(expedienteBuscado.toLowerCase());
      if (coincideA && !coincideB) return -1;
      if (!coincideA && coincideB) return 1;
    }
    return 0; 
  });

  const [loading, setLoading] = useState(false);
  const [mensaje, setMensaje] = useState({ texto: '', tipo: '' });

  useEffect(() => {
    let activo = true;

    async function iniciarCarga() {
      try {
        const res = await fetch('/api/judicial/notificaciones');
        if (!res.ok) return;
        const data = await res.json();
        
        if (activo) {
          setComisarias(data.comisarías || []);
          setNotificaciones(data.notificaciones || []);
        }
      } catch (err) {
        console.error('Error en carga inicial', err);
      }
    }

    iniciarCarga();

    return () => {
      activo = false;
    };
  }, []);

  // 🚀 FUNCIÓN ACTUALIZADA: Envía los campos de texto junto al archivo binario mediante FormData
  const handleCrearNotificacion = async (e: FormEvent) => {
    e.preventDefault();
    
    // Validación de seguridad para obligar al usuario a cargar la cédula papel o digital
    if (!documentoJudicial) {
      setMensaje({ texto: '⚠️ Es obligatorio adjuntar el documento judicial original (PDF o Word).', tipo: 'error' });
      return;
    }

    setLoading(true);
    setMensaje({ texto: '', tipo: '' });

    try {
      // Usamos FormData para dar soporte multimedia a la transferencia de datos
      const formData = new FormData();
      formData.append('nroExpediente', nroExpediente);
      formData.append('caratula', caratula);
      formData.append('destinatario', destinatario);
      formData.append('domicilio', domicilio);
      formData.append('comisariaAsignadaId', comisariaId);
      formData.append('documentoJudicial', documentoJudicial); // 👈 El archivo binario original

      const res = await fetch('/api/judicial/notificaciones', {
        method: 'POST',
        // NOTA: Cuando se envía FormData, NO se debe definir el header 'Content-Type'. 
        // El navegador lo configura de forma automática incluyendo los límites boundary del archivo.
        body: formData, 
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.error || 'Error al procesar');

      setMensaje({ texto: '⚖️ Notificación creada y enviada a la comisaría con éxito.', tipo: 'exito' });
      
      const nueva = data.notificacion as Notificacion;
      setNotificaciones((prev) => [nueva, ...prev]);

      // Limpieza completa del panel izquierdo tras el éxito
      setNroExpediente('');
      setCaratula('');
      setDestinatario('');
      setDomicilio('');
      setComisariaId('');
      setDocumentoJudicial(null);
      
      // Reseteamos visualmente el selector de archivos de la PC de forma manual
      const fileInput = document.getElementById('file-input-cedula') as HTMLInputElement;
      if (fileInput) fileInput.value = '';

    } catch (err: unknown) {
      if (err instanceof Error) {
        setMensaje({ texto: err.message, tipo: 'error' });
      }
    } finally {
      setLoading(false);
    }
  };

   const refrescarDatos = async () => {
    try {
      const res = await fetch('/api/judicial/notificaciones');
      if (res.ok) {
        const data = await res.json();
        setComisarias(data.comisarías || []);
        setNotificaciones(data.notificaciones || []);
      }
    } catch (err) {
      console.error('Error refrescando datos desde el panel', err);
    }
  };

  useEffect(() => {
    let activo = true;

    // 1. Carga inicial declarada adentro (cumple con react-hooks/set-state-in-effect)
    async function iniciarCarga() {
      try {
        const res = await fetch('/api/judicial/notificaciones');
        if (!res.ok) return;
        const data = await res.json();
        
        if (activo) {
          setComisarias(data.comisarías || []);
          setNotificaciones(data.notificaciones || []);
        }
      } catch (err) {
        console.error('Error en carga inicial', err);
      }
    }

    iniciarCarga();

    // 2. Polling automático cada 30 segundos (dentro del callback del intervalo sí está permitido)
    const intervalo = setInterval(() => {
      refrescarDatos();
    }, 30000);

    return () => {
      activo = false;
      clearInterval(intervalo);
    };
  }, []);

    return (
    <div className="min-h-screen bg-slate-50 p-6">
      <header className="max-w-7xl mx-auto mb-8 flex justify-between items-center bg-white p-4 rounded-xl shadow-sm border border-slate-200">
        <div>
          <h1 className="text-xl font-bold text-slate-800">🏛️ Portal Poder Judicial</h1>
          <p className="text-xs text-slate-500">Juzgado de Garantías N° 1 - En línea</p>
        </div>
        <Link 
          href = '/'
          className="text-sm bg-slate-100 hover:bg-slate-200 text-slate-600 font-medium py-2 px-4 rounded-lg transition-colors"
        >
          Cerrar Sesión
        </Link>
      </header>

      <main className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Formulario de Carga */}
        <section className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 lg:col-span-1 h-fit">
          <h2 className="text-lg font-bold text-slate-800 mb-4 border-b pb-2">Nueva Notificación</h2>
          
          <form onSubmit={handleCrearNotificacion} className="space-y-4">
            {mensaje.texto && (
              <div className={`p-3 rounded-lg text-xs font-medium ${mensaje.tipo === 'exito' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-red-50 text-red-800 border border-red-200'}`}>
                {mensaje.texto}
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Nro. de Expediente</label>
              <input 
                type="text" required value={nroExpediente} onChange={(e) => setNroExpediente(e.target.value)}
                placeholder="Expe-12345/2026" className="w-full text-sm px-3 py-2 border rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-900 bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Carátula / Autos</label>
              <input 
                type="text" required value={caratula} onChange={(e) => setCaratula(e.target.value)}
                placeholder="Pérez Juan s/ Hurto" className="w-full text-sm px-3 py-2 border rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-900 bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Destinatario (Persona a notificar)</label>
              <input 
                type="text" required value={destinatario} onChange={(e) => setDestinatario(e.target.value)}
                placeholder="Nombre Completo" className="w-full text-sm px-3 py-2 border rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-900 bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Domicilio de Entrega</label>
              <input 
                type="text" required value={domicilio} onChange={(e) => setDomicilio(e.target.value)}
                placeholder="Calle, Altura, Localidad" className="w-full text-sm px-3 py-2 border rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-900 bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Comisaría Interviniente</label>
              <select 
                required value={comisariaId} onChange={(e) => setComisariaId(e.target.value)}
                className="w-full text-sm px-3 py-2 border rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-900"
              >
                <option value="">Seleccionar seccional...</option>
                {comisarias.map((c) => (
                  <option key={c.id} value={c.id}>{c.nombre}</option>
                ))}
              </select>
            </div>
            {/* 📎 ADJUNTAR EXPEDIENTE DIGITAL DESDE LA PC (CORREGIDO) */}
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                📎 Adjuntar Documento Judicial Original
              </label>
              <input 
                id="file-input-cedula"
                type="file" 
                required
                accept=".pdf,.doc,.docx"
                onChange={(e) => {
                  const lista = e.target.files;
                  if (lista && lista.length > 0) {
                    setDocumentoJudicial(lista[0]); // Extracción segura por índice directo sin conflictos
                  }
                }}
                className="w-full text-xs text-slate-500 file:mr-4 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer border rounded-lg p-1"
              />
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button" onClick={refrescarDatos}
                className="bg-slate-100 hover:bg-slate-200 text-slate-600 p-2.5 rounded-lg text-sm shadow-sm transition-colors"
                title="Actualizar listas"
              >
                🔄
              </button>
              <button
                type="submit" disabled={loading}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 px-4 rounded-lg text-sm shadow-sm transition-colors disabled:opacity-50"
              >
                {loading ? 'Enviando...' : 'Enviar a Comisaría'}
              </button>
            </div>
          </form>
        </section>

                {/* Panel de Monitoreo Dinámico */}
        <section className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 lg:col-span-2 overflow-hidden">
          
          {/* CABECERA CON CONTROLES DE BÚSQUEDA Y FILTRADO */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b pb-3 mb-4">
            <h2 className="text-lg font-bold text-slate-800">Control de Cédulas Enviadas</h2>
            
            {/* 🔍 CUADRO DE BÚSQUEDA FLOTANTE */}
            <div className="relative w-full sm:w-72">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-slate-400 text-xs">
                🔍
              </span>
              <input
                type="text"
                value={expedienteBuscado}
                onChange={(e) => setExpedienteBuscado(e.target.value)}
                placeholder="Buscar y destacar expediente..."
                className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white text-slate-800 transition-all placeholder:text-slate-400"
              />
              {expedienteBuscado.trim() !== '' && (
                <button
                  type="button"
                  onClick={() => setExpedienteBuscado('')}
                  className="absolute inset-y-0 right-0 flex items-center pr-2.5 text-slate-400 hover:text-slate-600 text-xs font-bold cursor-pointer"
                  title="Limpiar búsqueda"
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          {/* INDICADOR DE REORDENAMIENTO ACTIVO */}
          {expedienteBuscado.trim() !== '' && (
            <div className="mb-3 px-3 py-1.5 bg-blue-50 border border-blue-100 rounded-lg text-xs font-medium text-blue-700 flex items-center gap-1.5 animate-pulse">
              <span className="w-1.5 h-1.5 bg-blue-600 rounded-full"></span>
              Orden dinámico activo: Expedientes coincidentes priorizados en el primer lugar.
            </div>
          )}
          
          {notificaciones.length === 0 ? (
            <div className="text-center py-12 text-slate-400 text-sm">
              <span className="text-3xl block mb-2">📋</span>
              Las cédulas que envíes aparecerán acá en tiempo real trackeando el estado de la policía.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                    <th className="p-3">Expediente</th>
                    <th className="p-3">Destinatario</th>
                    <th className="p-3">Dirección</th>
                    <th className="p-3 text-center">Estado</th>
                    <th className="p-3 text-right">Acciones</th> 
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {notificacionesOrdenadas.map((n) => {
                    const esDestacada = expedienteBuscado.trim() !== '' && 
                      n.nroExpediente.toLowerCase().includes(expedienteBuscado.toLowerCase());
                    return (
                      <tr 
                        key={n.id} 
                        className={`transition-all border-b border-slate-100 ${
                          esDestacada 
                            ? 'bg-blue-50/90 hover:bg-blue-100/90 border-l-4 border-l-blue-600 font-medium' 
                            : 'hover:bg-slate-50/80'
                        }`}
                      >
                        <td className="p-3">
                          <div className="font-bold text-slate-800">{n.nroExpediente}</div>
                          <div className="text-xs text-slate-500 max-w-37.5 truncate">{n.caratula}</div>
                        </td>
                        <td className="p-3 text-slate-700 font-medium">{n.destinatario}</td>
                        <td className="p-3 text-slate-500 text-xs">{n.domicilio}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                          <div className="flex flex-col items-start gap-1">
                            {/* Tu etiqueta actual adaptada a tu variable 'n' */}
                            <span className={`px-2.5 py-1 text-xs font-bold rounded-full ${
                              n.estado === 'ENVIADA' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                              n.estado === 'IMPRESA' ? 'bg-blue-50 text-blue-700 border border-blue-200' :
                              n.estado === 'CUMPLIMENTADA' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                              'bg-rose-50 text-rose-700 border border-rose-200'
                            }`}>
                              {n.estado}
                            </span>

                            {/* 🕒 NUEVO: Muestra la fecha y hora del cambio de estado */}
                            {n.historialEstados && n.historialEstados.length > 0 ? (
                              (() => {
                                // Ordenamos cronológicamente para tomar el cambio más reciente
                                const ordenados = [...n.historialEstados].sort(
                                  (a, b) => new Date(b.fechaHora).getTime() - new Date(a.fechaHora).getTime()
                                );
                                // 🚀 CORREGIDO: Tomamos explícitamente el primer elemento del array ordenado
                                const ultimoCambio = ordenados[0]; 

                                if (!ultimoCambio || !ultimoCambio.fechaHora) return null;

                                return (
                                  <span className="text-[10px] text-slate-400 font-medium italic mt-0.5">
                                    {new Date(ultimoCambio.fechaHora).toLocaleString('es-AR', {
                                      day: '2-digit',
                                      month: '2-digit',
                                      year: 'numeric',
                                      hour: '2-digit',
                                      minute: '2-digit'
                                    })} hs
                                  </span>
                                );
                              })()
                            ) : (
                              <span className="text-[10px] text-slate-400 font-medium italic mt-0.5">
                                Sin fecha registrada
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="p-3">
                          <div className="flex items-center justify-end gap-2">
                            {n.pdfUrl ? (
                              <button 
                                type="button"
                                onClick={async () => {
                                  try {
                                    const res = await fetch(`/api/judicial/download?url=${encodeURIComponent(n.pdfUrl)}`);
                                    if (!res.ok) {
                                      alert('No se pudo autorizar la lectura del documento.');
                                      return;
                                    }
                                    const archivoBlob = await res.blob();
                                    const urlDescargaUrl = window.URL.createObjectURL(archivoBlob);
                                    const enlaceTemporal = document.createElement('a');
                                    enlaceTemporal.href = urlDescargaUrl;
                                    enlaceTemporal.download = n.pdfUrl.split('/').pop() || 'documento-judicial';
                                    document.body.appendChild(enlaceTemporal);
                                    enlaceTemporal.click();
                                    document.body.removeChild(enlaceTemporal);
                                    window.URL.revokeObjectURL(urlDescargaUrl);
                                  } catch (err) {
                                    console.error(err);
                                  }
                                }}
                                className="inline-flex items-center gap-1.5 text-xs bg-white hover:bg-blue-50 text-slate-700 hover:text-blue-700 font-medium py-1.5 px-3 rounded-lg border border-slate-200 hover:border-blue-200 transition-colors cursor-pointer shadow-sm"
                              >
                                📄 Ver Documento
                              </button>
                            ) : (
                              <span className="text-xs text-slate-400 italic">Sin archivo</span>
                            )}

                            {/* Botón 2: 📷 CONTROL DE AUDITORÍA */}
                            {(n.estado === 'CUMPLIMENTADA' || n.estado === 'FRUSTRADA') && (
                              n.fotoComprobanteUrl ? (
                                <button
                                  type="button"
                                  onClick={async () => {
                                    try {
                                      const res = await fetch(`/api/judicial/download?url=${encodeURIComponent(n.fotoComprobanteUrl!)}`);
                                      if (!res.ok) {
                                        alert('No se pudo leer la firma digitalizada del acta.');
                                        return;
                                      }
                                      const archivoBlob = await res.blob();
                                      const urlDescargaUrl = window.URL.createObjectURL(archivoBlob);
                                      const enlaceTemporal = document.createElement('a');
                                      enlaceTemporal.href = urlDescargaUrl;
                                      enlaceTemporal.download = n.fotoComprobanteUrl!.split('/').pop() || 'acta-diligencia';
                                      document.body.appendChild(enlaceTemporal);
                                      enlaceTemporal.click();
                                      document.body.removeChild(enlaceTemporal);
                                      window.URL.revokeObjectURL(urlDescargaUrl);
                                    } catch (err) {
                                      console.error(err);
                                    }
                                  }}
                                  className="inline-flex items-center gap-1.5 text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-1.5 px-3 rounded-lg transition-colors cursor-pointer shadow-sm border border-emerald-700"
                                  title="Descargar acta firmada digitalizada por la comisaría"
                                >
                                  📷 Acta Digital
                                </button>
                              ) : (
                                <span className="text-xs text-slate-400 italic font-normal">Sin acta cargada</span>
                              )
                            )}
                          </div>
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
  );
}
