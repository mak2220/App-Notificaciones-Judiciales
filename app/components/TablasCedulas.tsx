'use client';

import { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { coincideNotificacion } from '@/app/utils/busquedaNotificaciones';

interface BuscadorCedulasProps {
    busqueda: string;
    onBusquedaChange: (valor: string) => void;
    filtroEstado: string;
    onFiltroEstadoChange: (estado: string) => void;
    totalNotificaciones: number;
}

export function BuscadorCedulas({
    busqueda,
    onBusquedaChange,
    filtroEstado,
    onFiltroEstadoChange,
    totalNotificaciones,
}: BuscadorCedulasProps) {
    return (
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
            <select
                value={filtroEstado}
                onChange={(e) => onFiltroEstadoChange(e.target.value)}
                className="px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
            >
                <option value="TODAS">Todos los estados ({totalNotificaciones})</option>
                <option value="ENVIADA">🟡 Pendientes (ENVIADA)</option>
                <option value="IMPRESA">🔵 En calle (IMPRESA)</option>
                <option value="CUMPLIMENTADA">🟢 Cumplimentadas</option>
                <option value="FRUSTRADA">🔴 Frustradas</option>
            </select>

            <div className="relative w-full sm:w-80">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-slate-400 text-xs">
                    🔍
                </span>
                <input
                    type="text"
                    value={busqueda}
                    onChange={(e) => onBusquedaChange(e.target.value)}
                    placeholder="Buscar por expediente, destinatario o carátula..."
                    className="w-full pl-8 pr-7 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white text-slate-800 transition-all placeholder:text-slate-400"
                />
                {busqueda.trim() !== '' && (
                    <button
                        type="button"
                        onClick={() => onBusquedaChange('')}
                        className="absolute inset-y-0 right-0 flex items-center pr-2.5 text-slate-400 hover:text-slate-600 text-xs font-bold cursor-pointer"
                        title="Limpiar búsqueda"
                    >
                        ✕
                    </button>
                )}
            </div>
        </div>
    );
}

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
    const router = useRouter();
    const [busqueda, setBusqueda] = useState('');
    const [filtroEstado, setFiltroEstado] = useState<string>('TODAS');  

    const notificacionesProcesadas = useMemo(() => {
        const filtradas = filtroEstado === 'TODAS'
            ? notificaciones
            : notificaciones.filter((n) => n.estado === filtroEstado);

        if (!busqueda.trim()) return filtradas;

        return [...filtradas].sort((a, b) => {
            const coincideA = coincideNotificacion(a, busqueda);
            const coincideB = coincideNotificacion(b, busqueda);
            if (coincideA && !coincideB) return -1;
            if (!coincideA && coincideB) return 1;
            return 0;
        });
    }, [notificaciones, busqueda, filtroEstado]);

    useEffect(() => {
        const intervalo = setInterval(() => {
            router.refresh();
        }, 30000);

        return () => clearInterval(intervalo);
    }, [router]);

        return (
        <section className="lg:col-span-8 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b pb-3 mb-4">
                <h2 className="text-lg font-bold text-slate-900">
                    Control de Cédulas Recibidas
                </h2>

                <BuscadorCedulas
                    busqueda={busqueda}
                    onBusquedaChange={setBusqueda}
                    filtroEstado={filtroEstado}
                    onFiltroEstadoChange={setFiltroEstado}
                    totalNotificaciones={notificaciones.length}
                />
            </div>

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
                                const esEditable = n.estado === 'IMPRESA';

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
                                            {esEditable ? (
                                                <Link href={`?id=${n.id}`} className="block w-full h-full">
                                                    {n.nroExpediente}
                                                </Link>
                                            ) : (
                                                <span>{n.nroExpediente}</span>
                                            )}
                                        </td>

                                        <td className="py-4 px-4">
                                            {esEditable ? (
                                                <Link href={`?id=${n.id}`} className="block w-full h-full">
                                                    <p className="font-medium text-slate-900">{n.caratula}</p>
                                                    <p className="text-xs text-slate-400">{n.usuarioCreador?.nombre}</p>
                                                </Link>
                                            ) : (
                                                <div>
                                                    <p className="font-medium text-slate-900">{n.caratula}</p>
                                                    <p className="text-xs text-slate-400">{n.usuarioCreador?.nombre}</p>
                                                </div>
                                            )}
                                        </td>

                                        <td className="py-4 px-4">
                                            {esEditable ? (
                                                <Link href={`?id=${n.id}`} className="block w-full h-full">
                                                    <p className="text-slate-700">{n.destinatario}</p>
                                                    <p className="text-xs text-slate-400 truncate max-w-[200px]">{n.domicilio}</p>
                                                </Link>
                                            ) : (
                                                <div>
                                                    <p className="text-slate-700">{n.destinatario}</p>
                                                    <p className="text-xs text-slate-400 truncate max-w-[200px]">{n.domicilio}</p>
                                                </div>
                                            )}
                                        </td>

                                        <td className="py-4 px-4 text-center">
                                            <div className="flex flex-col items-center gap-1.5">
                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${obtenerEstilosBadge(n.estado)}`}>
                                                    {n.estado}
                                                </span>
                                                {n.fotoComprobanteUrl && (
                                                    <Link
                                                        href={`?ver=${encodeURIComponent(n.fotoComprobanteUrl)}`}
                                                        className="text-xs text-blue-600 underline font-medium hover:text-blue-800 flex items-center gap-0.5"
                                                    >
                                                        📎 Ver acta
                                                    </Link>
                                                )}
                                            </div>
                                        </td>

                                        <td className="py-4 px-4 text-right align-middle">
                                            <div className="flex items-center justify-end">
                                                {n.estado === 'ENVIADA' ? (
                                                    <a
                                                        href={`/api/policia/descargar?id=${n.id}`}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        onClick={() => {
                                                            setTimeout(() => {
                                                                router.refresh();
                                                            }, 1500);
                                                        }}
                                                        className="inline-flex items-center gap-1.5 text-xs bg-blue-600 hover:bg-blue-700 text-white font-medium px-3 py-1.5 rounded-lg transition-colors shadow-sm cursor-pointer whitespace-nowrap"
                                                    >
                                                        🖨️ Imprimir
                                                    </a>
                                                ) : n.estado === 'IMPRESA' ? (
                                                    <Link
                                                        href={`?id=${n.id}`}
                                                        className="inline-flex items-center gap-1.5 text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-medium px-3 py-1.5 rounded-lg transition-colors shadow-sm whitespace-nowrap"
                                                    >
                                                        Procesar
                                                    </Link>
                                                ) : (
                                                    <button
                                                        type="button"
                                                        disabled
                                                        title="Esta cédula ya fue diligenciada y cerrada"
                                                        className="inline-flex items-center gap-1.5 text-xs bg-slate-100 text-slate-400 border border-slate-200 font-medium px-3 py-1.5 rounded-lg cursor-not-allowed whitespace-nowrap"
                                                    >
                                                        🔒 Finalizada
                                                    </button>
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
    );
}

