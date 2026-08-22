// src/app/judicial/dashboard/page.tsx
'use client';

import { useState, useEffect, FormEvent } from 'react';

interface Comisaria {
  id: string;
  nombre: string;
}

interface Notificacion {
  id: string;
  nroExpediente: string;
  caratula: string;
  destinatario: string;
  domicilio: string;
  estado: 'ENVIADA' | 'IMPRESA' | 'CUMPLIMENTADA' | 'FRUSTRADA';
}

export default function JudicialDashboard() {
  const [comisarias, setComisarias] = useState<Comisaria[]>([]);
  const [notificaciones, setNotificaciones] = useState<Notificacion[]>([]);
  
  const [nroExpediente, setNroExpediente] = useState('');
  const [caratula, setCaratula] = useState('');
  const [destinatario, setDestinatario] = useState('');
  const [domicilio, setDomicilio] = useState('');
  const [comisariaId, setComisariaId] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [mensaje, setMensaje] = useState({ texto: '', tipo: '' });

  const refrescarDatos = async () => {
    try {
      const res = await fetch('/api/judicial/notificaciones');
      if (res.ok) {
        const data = await res.json();
        setComisarias(data.comisarías || []);
        setNotificaciones(data.notificaciones || []);
      }
    } catch (err) {
      console.error('Error refrescando datos', err);
    }
  };


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

  const handleCrearNotificacion = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMensaje({ texto: '', tipo: '' });

    try {
      const res = await fetch('/api/judicial/notificaciones', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nroExpediente,
          caratula,
          destinatario,
          domicilio,
          comisariaAsignadaId: comisariaId,
        }),
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.error || 'Error al procesar');

      setMensaje({ texto: '⚖️ Notificación creada y enviada a la comisaría con éxito.', tipo: 'exito' });
      
      const nueva = data.notificacion as Notificacion;
      setNotificaciones((prev) => [nueva, ...prev]);

      setNroExpediente('');
      setCaratula('');
      setDestinatario('');
      setDomicilio('');
      setComisariaId('');
    } catch (err: unknown) {
      if (err instanceof Error) {
        setMensaje({ texto: err.message, tipo: 'error' });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <header className="max-w-7xl mx-auto mb-8 flex justify-between items-center bg-white p-4 rounded-xl shadow-sm border border-slate-200">
        <div>
          <h1 className="text-xl font-bold text-slate-800">🏛️ Portal Poder Judicial</h1>
          <p className="text-xs text-slate-500">Juzgado de Garantías N° 1 - En línea</p>
        </div>
        <button 
          onClick={() => window.location.href = '/'}
          className="text-sm bg-slate-100 hover:bg-slate-200 text-slate-600 font-medium py-2 px-4 rounded-lg transition-colors"
        >
          Cerrar Sesión
        </button>
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
          <h2 className="text-lg font-bold text-slate-800 mb-4 border-b pb-2">Control de Cédulas Enviadas</h2>
          
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
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {notificaciones.map((n) => (
                    <tr key={n.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="p-3">
                        <div className="font-bold text-slate-800">{n.nroExpediente}</div>
                        <div className="text-xs text-slate-500 max-w-37.5 truncate">{n.caratula}</div>
                      </td>
                      <td className="p-3 text-slate-700 font-medium">{n.destinatario}</td>
                      <td className="p-3 text-slate-500 text-xs">{n.domicilio}</td>
                      <td className="p-3 text-center">
                        <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-blue-100 text-blue-800 border border-blue-200">
                          {n.estado}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
