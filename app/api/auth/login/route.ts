// src/app/api/auth/login/route.ts
import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import bcrypt from 'bcrypt';

export async function POST(request: Request) {
  try {
    const { email, password, role } = await request.json();

    // 1. Validaciones básicas de entrada
    if (!email || !password || !role) {
      return NextResponse.json(
        { error: 'Todos los campos son obligatorios' },
        { status: 400 }
      );
    }

    let usuarioValido = null;
    let nombreUsuario = '';

    // 2. Buscar en la tabla correspondiente según el tipo de ingreso
    if (role === 'policia') {
      // Si entra por el portal de Comisarías, buscamos en la tabla Comisaria
      const comisaria = await prisma.comisaria.findUnique({
        where: { email: email.toLowerCase() },
      });
      
      if (comisaria) {
        usuarioValido = comisaria;
        nombreUsuario = comisaria.nombre;
      }
    } else {
      // Si entra por Poder Judicial o Admin, buscamos en la tabla Usuario
      const usuario = await prisma.usuario.findUnique({
        where: { email: email.toLowerCase() },
      });

      // Verificamos que el rol coincida con el portal por el que intenta entrar
      if (usuario && usuario.rol === role.toUpperCase()) {
        usuarioValido = usuario;
        nombreUsuario = usuario.nombre;
      }
    }

    // 3. Si no encontramos ningún registro que coincida
    if (!usuarioValido) {
      return NextResponse.json(
        { error: 'El usuario no existe o no tiene permisos para este portal' },
        { status: 401 }
      );
    }

    // 4. Verificar si la contraseña coincide utilizando bcrypt
    const contraseñaCorrecta = await bcrypt.compare(password, usuarioValido.passwordHash);

    if (!contraseñaCorrecta) {
      return NextResponse.json(
        { error: 'Contraseña incorrecta' },
        { status: 401 }
      );
    }

    // 5. Autenticación exitosa (En el futuro acá generaremos las Cookies o JWT)
    return NextResponse.json({
      success: true,
      mensaje: 'Inicio de sesión correcto',
      usuario: {
        id: usuarioValido.id,
        nombre: nombreUsuario,
        email: usuarioValido.email,
        rol: role,
      },
    }, { status: 200 });

  } catch (error) {
    console.error('❌ Error en el servidor durante el login:', error);
    return NextResponse.json(
      { error: 'Ocurrió un error inesperado en el servidor' },
      { status: 500 }
    );
  }
}
