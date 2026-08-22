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

  // 3. Crear una Comisaría de prueba (Forzamos tu UUID real de Neon)
  const comisaria = await prisma.comisaria.upsert({
    where: { id: '315acb5c-ac71-4abc-94c3-083f8e7c01cd' }, // 👈 Forzamos tu ID real de Neon
    update: {},
    create: {
      id: '315acb5c-ac71-4abc-94c3-083f8e7c01cd',
      nombre: 'Comisaría Seccional Primera',
      direccion: 'Calle Falsa 123, Centro',
      email: 'seccional1@policia.gov.ar',
      passwordHash: passwordHasheada,
    },
  });
  console.log(`👮 Dependencia Policial creada: ${comisaria.nombre}`);

  // 4. NUEVO: Crear la Notificación vinculada con el PDF de prueba permanente
  // Usamos un upsert simulado buscando por el número de expediente de la causa
  const expedientePrueba = 'Expe-12345/2026';
  
  // Limpiamos notificaciones previas con ese expediente para evitar duplicaciones en la grilla
  await prisma.notificacion.deleteMany({
    where: { nroExpediente: expedientePrueba }
  });

  const notificacion = await prisma.notificacion.create({
    data: {
      nroExpediente: expedientePrueba,
      caratula: 'Juancho Carancho / Causa de Prueba Piloto',
      destinatario: 'Gómez Carlos Alberto',
      domicilio: 'Av. Belgrano 1234, Planta Alta, Chajarí',
      // 👈 URL permanente y segura que no deriva a GoDaddy
      pdfUrl: 'https://unec.edu.az', 
      estado: 'ENVIADA',
      usuarioCreadorId: juzgado.id,
      comisariaAsignadaId: comisaria.id,
    },
  });
  console.log(`📄 Notificación de prueba creada para el expediente: ${notificacion.nroExpediente}`);

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

