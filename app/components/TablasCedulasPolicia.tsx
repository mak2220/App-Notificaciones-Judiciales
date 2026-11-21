'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { coincideNotificacion } from '@/app/utils/busquedaNotificaciones';

export interface NotificacionPolicia {
    id: string;
    nroExpediente: string;
    caratula: string;
    destinatario: string;
    domicilio: string;
    pdfUrl: string;
    fotoComprobanteUrl: string | null;
    estado: 'ENVIADA' | 'IMPRESA' | 'CUMPLIMENTADA' | 'FRUSTRADA';
    usuarioCreador: {
        nombre: string;
    };
}

function obtenerEstilosBadge(estado: string): string {
    if (estado === 'ENVIADA') return 'bg-amber-50 text-amber-700 border-amber-200';
    if (estado === 'IMPRESA') return 'bg-blue-50 text-blue-700 border-blue-200';
    if (estado === 'CUMPLIMENTADA') return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    return 'bg-rose-50 text-rose-700 border-rose-200';
}

interface Props {
    notificaciones: NotificacionPolicia[];
    seleccionadaId?: string;
}

export function TablaCedulasPolicia({ notificaciones, seleccionadaId }: Props) {
    const [busqueda, setBusqueda] = useState('');
    const [filtroEstado, setFiltroEstado] = useState<string>('TODAS');  
    const notificacionesProcesadas = useMemo(() => {
      // 1. Filtrado opcional por estado
        const filtradas = filtroEstado === 'TODAS'
        ? notificaciones
        : notificaciones.filter((n) => n.estado === filtroEstado);

    // 2. Priorización dinámica por texto (expediente, destinatario, carátula o domicilio)
    if (!busqueda.trim()) return filtradas;

    return [...filtradas].sort((a, b) => {
    const coincideA = coincideNotificacion(a, busqueda);
    const coincideB = coincideNotificacion(b, busqueda);
    if (coincideA && !coincideB) return -1;
    if (!coincideA && coincideB) return 1;
    return 0;
    });
}, [notificaciones, busqueda, filtroEstado]);

    return (
        <section className="lg:col-span-8 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
            {/* CABECERA CON BUSCADOR Y FILTRO DE ESTADO */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b pb-3 mb-4">
                <h2 className="text-lg font-bold text-slate-900">
                    Control de Cédulas Recibidas
                </h2>
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
            {/* Filtro rápido por estado */}
            <select
                value={filtroEstado}
                onChange={(e) => setFiltroEstado(e.target.value)}
                className="px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
                <option value="TODAS">Todos los estados ({notificaciones.length})</option>
                <option value="ENVIADA">🟡 Pendientes (ENVIADA)</option>
                <option value="IMPRESA">🔵 En calle (IMPRESA)</option>
                <option value="CUMPLIMENTADA">🟢 Cumplimentadas</option>
                <option value="FRUSTRADA">🔴 Frustradas</option>
            </select>

          {/* Cuadro de búsqueda */}
            <div className="relative w-full sm:w-72">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-slate-400 text-xs">
                🔍
                </span>
            <input
                type="text"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                placeholder="Expediente, destinatario o carátula..."
                className="w-full pl-8 pr-7 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white text-slate-800 transition-all placeholder:text-slate-400"
            />
            {busqueda.trim() !== '' && (
            <button
                type="button"
                onClick={() => setBusqueda('')}
                className="absolute inset-y-0 right-0 flex items-center pr-2.5 text-slate-400 hover:text-slate-600 text-xs font-bold cursor-pointer"
                title="Limpiar búsqueda"
            >
                ✕
            </button>
            )}
            </div>
        </div>
    </div>

      {/* INDICADOR DE ORDEN DINÁMICO */}
    {busqueda.trim() !== '' && (
        <div className="mb-3 px-3 py-1.5 bg-blue-50 border border-blue-100 rounded-lg text-xs font-medium text-blue-700 flex items-center gap-1.5">
        <span className="w-1.5 h-1.5 bg-blue-600 rounded-full animate-ping"></span>
        Orden dinámico activo: Coincidencias priorizadas en primer lugar.
        </div>
    )}

    {notificacionesProcesadas.length === 0 ? (
        <div className="text-center py-12 text-slate-400 text-sm">
            No se encontraron directivas judiciales con los filtros aplicados.
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
            {notificacionesProcesadas.map((n) => {
                const esSeleccionada = seleccionadaId === n.id;
                const esDestacada = coincideNotificacion(n, busqueda);

                return (
                <tr
                    key={n.id}
                    className={`transition-colors border-b border-slate-100 ${
                        esSeleccionada
                        ? 'bg-blue-100/80 border-l-4 border-l-blue-700'
                        : esDestacada
                        ? 'bg-blue-50/90 hover:bg-blue-100/70 border-l-4 border-l-blue-500 font-medium'
                        : 'hover:bg-slate-50/80'
                    }`}
                >
                    <td className="py-4 px-4 font-mono text-xs font-semibold text-slate-600">
                        <Link href={`?id=${n.id}`} className="block w-full h-full">
                            {n.nroExpediente}
                        </Link>
                    </td>

                    <td className="py-4 px-4">
                        <Link href={`?id=${n.id}`} className="block w-full h-full">
                            <p className="font-medium text-slate-900">{n.caratula}</p>
                            <p className="text-xs text-slate-400">{n.usuarioCreador?.nombre}</p>
                        </Link>
                    </td>

                    <td className="py-4 px-4">
                        <Link href={`?id=${n.id}`} className="block w-full h-full">
                            <p className="text-slate-700">{n.destinatario}</p>
                            <p className="text-xs text-slate-400 truncate max-w-[200px]">{n.domicilio}</p>
                        </Link>
                    </td>

                    <td className="py-4 px-4 text-center">
                        <div className="flex flex-col items-center gap-1.5">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${obtenerEstilosBadge(n.estado)}`}>
                                {n.estado}
                            </span>
                        {n.fotoComprobanteUrl && (
                            <Link
                                href={`?id=${n.id}&ver=${encodeURIComponent(n.fotoComprobanteUrl)}`}
                                className="text-xs text-blue-600 underline font-medium hover:text-blue-800 flex items-center gap-0.5"
                            >
                            📎 Ver acta
                            </Link>
                        )}
                        </div>
                    </td>

                    <td className="py-4 px-4 text-right align-middle">
                        <div className="flex items-center justify-end gap-2">
                            {n.estado === 'ENVIADA' && (
                        <a
                            href={`/api/policia/descargar?id=${n.id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs bg-blue-600 hover:bg-blue-700 text-white font-medium px-2.5 py-1.5 rounded-lg transition-colors flex items-center gap-1 shadow-sm cursor-pointer"
                        >
                            🖨️ Imprimir
                        </a>
                        )}
                        <Link
                            href={`?id=${n.id}`}
                            className="inline-block text-xs bg-blue-600 hover:bg-blue-700 text-white px-2.5 py-1.5 rounded-lg font-medium transition-colors shadow-sm"
                            >
                                Procesar
                            </Link>
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
    );
}
