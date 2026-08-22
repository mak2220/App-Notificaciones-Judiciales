"use client";

import { useEffect, useState } from "react";

interface Notificacion {
  id: string;
  nroExpediente: string;
  caratula: string;
  destinatario: string;
  domicilio: string;
  pdfUrl: string;
  estado: "ENVIADA" | "IMPRESA" | "CUMPLIMENTADA" | "FRUSTRADA";
  fechaCreacion: string;
  comisariaAsignada: {
    nombre: string;
  };
}

export default function TablaControl() {
  const [notificaciones, setNotificaciones] = useState<Notificacion[]>([]);
  const [cargando, setCargando] = useState(true);

  // Función para obtener los datos de la API
  const cargarNotificaciones = async () => {
    try {
      const res = await fetch("/api/judicial/control");
      if (res.ok) {
        const data = await res.json();
        setNotificaciones(data);
      }
    } catch (error) {
      console.error("Error cargando datos:", error);
    } finally {
      setCargando(false);
    }
  };

  // Simulación de "Tiempo Real": Pooling cada 10 segundos para actualizar estados
  useEffect(() => {
    const inicializarCarga = async () => {
      await cargarNotificaciones();
    };
    
    inicializarCarga();

    const intervalo = setInterval(() => {
      cargarNotificaciones();
    }, 10000); 

    return () => clearInterval(intervalo);
  }, []);

  // Función auxiliar para pintar los badges de estado
  const obtenerEstiloEstado = (estado: string) => {
    switch (estado) {
      case "ENVIADA":
        return "bg-gray-100 text-gray-800 border-gray-300";
      case "IMPRESA":
        return "bg-blue-100 text-blue-800 border-blue-300";
      case "CUMPLIMENTADA":
        return "bg-green-100 text-green-800 border-green-300";
      case "FRUSTRADA":
        return "bg-red-100 text-red-800 border-red-300";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (cargando) return <p className="text-gray-500 text-sm">Cargando listado de control...</p>;

  return (
    <div className="bg-white shadow rounded-lg overflow-hidden border border-gray-200 mt-6">
      <div className="px-4 py-5 sm:px-6 bg-gray-50 border-b border-gray-200">
        <h3 className="text-lg leading-6 font-medium text-gray-900">Listado de Control de Cédulas</h3>
        <p className="mt-1 max-w-2xl text-sm text-gray-500">Monitoreo en tiempo real del estado de diligenciamiento.</p>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 text-left text-sm">
          <thead className="bg-gray-100 text-gray-700 uppercase text-xs tracking-wider">
            <tr>
              <th className="px-6 py-3">Expediente / Carátula</th>
              <th className="px-6 py-3">Destinatario / Domicilio</th>
              <th className="px-6 py-3">Asignado a</th>
              <th className="px-6 py-3">Estado</th>
              <th className="px-6 py-3">Fecha Envío</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200 text-gray-900">
            {notificaciones.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-10 text-center text-gray-500">No hay notificaciones emitidas todavía.</td>
              </tr>
            ) : (
              notificaciones.map((notif) => (
                <tr key={notif.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="font-bold text-indigo-600">{notif.nroExpediente}</div>
                    <div className="text-xs text-gray-500 truncate max-w-xs">{notif.caratula}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="font-medium">{notif.destinatario}</div>
                    <div className="text-xs text-gray-500">{notif.domicilio}</div>
                  </td>
                  <td className="px-6 py-4 text-gray-700 font-medium">
                    {notif.comisariaAsignada?.nombre || "No asignada"}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 text-xs font-semibold rounded-full border ${obtenerEstiloEstado(notif.estado)}`}>
                      {notif.estado}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-xs text-gray-500">
                    {new Date(notif.fechaCreacion).toLocaleDateString("es-AR")}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
