'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { useState, FormEvent, Suspense } from 'react';

function LoginContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  
  // Obtenemos el rol de la URL (judicial, policia o admin)
  const role = searchParams.get('role') || 'judicial';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Configuramos los textos dinámicos según el rol
  const configConfig = {
    judicial: {
      titulo: 'Poder Judicial',
      subtitulo: 'Acceso para Juzgados y Fiscalías',
      icono: '🏛️',
      colorBoton: 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500',
    },
    policia: {
      titulo: 'Comisarías / Notificadores',
      subtitulo: 'Acceso Institucional de Dependencias',
      icono: '👮',
      colorBoton: 'bg-emerald-600 hover:bg-emerald-700 focus:ring-emerald-500',
    },
    admin: {
      titulo: 'Administrador',
      subtitulo: 'Panel de Control y Gestión Superior',
      icono: '⚙️',
      colorBoton: 'bg-slate-700 hover:bg-slate-800 focus:ring-slate-500',
    },
  };

  // Validamos que el rol sea correcto, sino usamos 'judicial' por defecto
  const info = configConfig[role as keyof typeof configConfig] || configConfig.judicial;

  const handleSubmit = async (e: FormEvent) => {
  e.preventDefault();
  setError('');
  setLoading(true);

  try {
    const respuesta = await fetch('/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        password,
        role, // judicial, policia o admin
      }),
    });

    const datos = await respuesta.json();

    if (!respuesta.ok) {
      // Si la API devolvió un error (400, 401, 500), lo mostramos en pantalla
      throw new Error(datos.error || 'Error al iniciar sesión');
    }

    // Si todo salió bien, guardamos el resultado provisoriamente
    alert(`¡Bienvenido/a ${datos.usuario.nombre}! Login exitoso.`);
    
    // Próximamente: Redireccionar a los dashboards internos
    // router.push(`/${role}/dashboard`);

  } catch (err: unknown) {
    if (err instanceof Error) {
      setError(err.message);
    } else {
      setError('Credenciales inválidas. Por favor reintente.');
    } 
  }
};

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl border border-slate-200 p-8">
        
        {/* Encabezado Dinámico */}
        <div className="text-center mb-8">
          <span className="text-5xl block mb-3" role="img" aria-label={info.titulo}>
            {info.icono}
          </span>
          <h2 className="text-2xl font-bold text-slate-800">
            {info.titulo}
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            {info.subtitulo}
          </p>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="bg-red-50 border-l-4 border-red-500 p-3 rounded text-sm text-red-700">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Correo Electrónico
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:border-transparent transition-all"
              placeholder="nombre@dominio.gov"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Contraseña
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:border-transparent transition-all"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`w-full py-3 px-4 text-white font-medium rounded-xl transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed ${info.colorBoton}`}
          >
            {loading ? 'Ingresando...' : 'Iniciar Sesión'}
          </button>
        </form>

        {/* Botón para volver atrás */}
        <div className="text-center mt-6">
          <button
            onClick={() => router.push('/')}
            className="text-sm text-slate-500 hover:text-slate-700 underline underline-offset-4"
          >
            ← Volver al selector de perfiles
          </button>
        </div>

      </div>
    </div>
  );
}

// Next.js requiere envolver useSearchParams en un Suspense para renderizado estático en servidor
export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-100 flex items-center justify-center">Cargando...</div>}>
      <LoginContent />
    </Suspense>
  );
}
