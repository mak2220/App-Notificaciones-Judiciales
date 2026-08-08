// prisma/seed.ts
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando el sembrado de datos (Seed)...');

  // Generamos una contraseña encriptada segura para las pruebas
  const saltRounds = 10;
  const passwordHasheada = await bcrypt.hash('password123', saltRounds);

  // 1. Crear un Usuario con Rol ADMIN
  const admin = await prisma.usuario.upsert({
    where: { email: 'admin@notificaciones.gov.ar' },
    update: {},
    create: {
      nombre: 'Administrador Central - Poder Judicial',
      email: 'admin@notificaciones.gov.ar',
      passwordHash: passwordHasheada,
      rol: 'ADMIN',
    },
  });
  console.log(`🏛️ Usuario Administrador creado: ${admin.email}`);

  // 2. Crear un Usuario con Rol JUDICIAL (Un juzgado de prueba)
  const juzgado = await prisma.usuario.upsert({
    where: { email: 'juzgado1@justicia.gov.ar' },
    update: {},
    create: {
      nombre: 'Juzgado de Garantías N° 1',
      email: 'juzgado1@justicia.gov.ar',
      passwordHash: passwordHasheada,
      rol: 'JUDICIAL',
    },
  });
  console.log(`⚖️ Usuario Judicial creado: ${juzgado.email}`);

  // 3. Crear una Comisaría de prueba
  const comisaria = await prisma.comisaria.upsert({
    where: { email: 'seccional1@policia.gov.ar' },
    update: {},
    create: {
      nombre: 'Comisaría Seccional Primera',
      direccion: 'Calle Falsa 123, Centro',
      email: 'seccional1@policia.gov.ar',
      passwordHash: passwordHasheada,
    },
  });
  console.log(`👮 Dependencia Policial creada: ${comisaria.nombre}`);

  console.log('✅ ¡Datos de prueba cargados con éxito!');
}

main()
  .catch((e) => {
    console.error('❌ Error en el seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
