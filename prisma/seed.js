const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

async function main() {
  const prisma = new PrismaClient();

  const roles = ['normal', 'admin', 'super_admin', 'root'];
  for (const roleName of roles) {
    await prisma.role.upsert({
      where: { name: roleName },
      update: {},
      create: { name: roleName }
    });
  }

  const hashed = await bcrypt.hash('Admin@123', 10);
  await prisma.user.upsert({
    where: { email: 'root@gov.in' },
    update: {
      fullName: 'Root User',
      passwordHash: hashed,
      roleId: (await prisma.role.findUnique({ where: { name: 'root' } })).id,
      status: 'active'
    },
    create: {
      fullName: 'Root User',
      email: 'root@gov.in',
      passwordHash: hashed,
      roleId: (await prisma.role.findUnique({ where: { name: 'root' } })).id,
      status: 'active'
    }
  });

  await prisma.module.upsert({
    where: { tableName: 'assets' },
    update: {},
    create: {
      name: 'Assets',
      path: 'assets',
      tableName: 'assets',
      configJson: {},
    }
  });

  await prisma.module.upsert({
    where: { tableName: 'pdfs' },
    update: {},
    create: {
      name: 'PDF Documents',
      path: 'pdfs',
      tableName: 'pdfs',
      configJson: {},
    }
  });

  await prisma.$executeRawUnsafe(`CREATE TABLE IF NOT EXISTS "assets" (id SERIAL PRIMARY KEY, created_at timestamptz DEFAULT NOW(), updated_at timestamptz DEFAULT NOW(), data JSONB NOT NULL);`);
  await prisma.$executeRawUnsafe(`CREATE TABLE IF NOT EXISTS "pdfs" (id SERIAL PRIMARY KEY, created_at timestamptz DEFAULT NOW(), updated_at timestamptz DEFAULT NOW(), data JSONB NOT NULL);`);

  console.log('Seed complete');

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
