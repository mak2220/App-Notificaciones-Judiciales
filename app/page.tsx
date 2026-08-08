'use client';

import { useRouter } from 'next/navigation';

interface Perfil {
  id: 'judicial' | 'policia' | 'admin';
  titulo: string;
  descripcion: string;
  icono: string;
  color: string;
}

export default function HomePage() {
  const perfiles: Perfil[] = [
    {
      id: 'judicial',
      titulo: 'Poder Judicial',
      descripcion: 'Juzgados, Fiscalías y Defensorías. Carga y monitoreo de notificaciones.',
      icono: '🏛️',
      color: 'bg-blue-600 hover:bg-blue-700',
    },
    {
      id: 'policia',
      titulo: 'Comisarías / Notificadores',
      descripcion: 'Acceso institucional para la recepción, impresión y diligenciamiento de cédulas.',
      icono: '👮',
      color: 'bg-emerald-600 hover:bg-emerald-700',
    },
    {
      id: 'admin',
      titulo: 'Administrador',
      descripcion: 'Gestión de dependencias, auditoría del sistema y reportes de rendimiento.',
      icono: '⚙️',
      color: 'bg-slate-700 hover:bg-slate-800',
    },
  ];

  const router = useRouter();

  const handleIngresar = (perfilId: string) => {
    router.push(`/login?role=${perfilId}`);

};

  return (
    <main className="min-h-screen bg-slate-100 flex flex-col items-center justify-center p-6">
      <div className="max-w-4xl w-full text-center mb-12">
        <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight sm:text-5xl mb-3">
          App de Notificaciones Judiciales
        </h1>
        <p className="text-lg text-slate-600">
          Seleccione su perfil institucional para ingresar al sistema
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl w-full">
        {perfiles.map((perfil) => (
          <div
            key={perfil.id}
            className="bg-white rounded-2xl shadow-md border border-slate-200 p-6 flex flex-col justify-between transition-all hover:shadow-xl hover:-translate-y-1"
          >
            <div className="mb-6">
              <span className="text-4xl block mb-4" role="img" aria-label={perfil.titulo}>
                {perfil.icono}
              </span>
              <h2 className="text-xl font-bold text-slate-800 mb-2">
                {perfil.titulo}
              </h2>
              <p className="text-sm text-slate-500 leading-relaxed">
                {perfil.descripcion}
              </p>
            </div>
            
            <button
              onClick={() => handleIngresar(perfil.id)}
              className={`w-full py-3 px-4 text-white font-medium rounded-xl transition-colors shadow-sm ${perfil.color}`}
            >
              Ingresar
            </button>
          </div>
        ))}
      </div>
      
      <footer className="mt-16 text-xs text-slate-400">
        Poder Judicial - Sistema de Gestión de Notificaciones Digitales © {new Date().getFullYear()}
      </footer>
    </main>
  );
}
