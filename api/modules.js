const { prisma } = require('./db');

function safeIdentifier(name) {
  if (!/^[_a-zA-Z][_a-zA-Z0-9]*$/.test(name)) {
    throw new Error('Invalid identifier');
  }
  return name;
}

async function handler(req, res) {
  // Auth required for all module operations
  const { authMiddleware, roleMiddleware } = require('./middleware');
  authMiddleware(req, res, () => {
    const { method } = req;

    if (method === 'GET') {
      // Authenticated users can view modules
      return getModules(req, res);
    }

    if (method === 'POST') {
      // Only super_admin can create modules
      roleMiddleware(['super_admin'])(req, res, () => postModule(req, res));
    } else {
      res.setHeader('Allow', 'GET, POST');
      res.status(405).end('Method not allowed');
    }
  });
}

async function getModules(req, res) {
  const modules = await prisma.module.findMany();
  return res.status(200).json({ modules });
}

async function postModule(req, res) {
  const { name, tableName, path, icon, configJson, roleNames } = req.body;
  if (!name || !tableName || !path) {
    return res.status(400).json({ error: 'name, tableName and path are required' });
  }

  try {
    const safeTableName = safeIdentifier(tableName);
    const safePath = path;

    const existing = await prisma.module.findUnique({ where: { tableName: safeTableName } });
    if (existing) {
      return res.status(409).json({ error: 'Module already exists' });
    }

    const moduleRecord = await prisma.module.create({
      data: {
        name,
        path: safePath,
        icon: icon || '',
        tableName: safeTableName,
        configJson: configJson || {}
      }
    });

    // create table for module data
    await prisma.$executeRawUnsafe(`CREATE TABLE IF NOT EXISTS "${safeTableName}" (id SERIAL PRIMARY KEY, created_at timestamptz DEFAULT NOW(), updated_at timestamptz DEFAULT NOW(), data JSONB NOT NULL);`);

    if (Array.isArray(roleNames)) {
      for (const roleName of roleNames) {
        const role = await prisma.role.upsert({
          where: { name: roleName },
          update: {},
          create: { name: roleName }
        });
        await prisma.moduleRole.create({ data: { moduleId: moduleRecord.id, roleId: role.id } });
      }
    }

    return res.status(201).json({ module: moduleRecord });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: (error && error.message) || 'Internal server error' });
  }
}

module.exports = handler;

