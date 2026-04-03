const { prisma } = require('../db');
const { authMiddleware } = require('../middleware');

function normalizeTableName(moduleKey) {
  if (!/^[_a-zA-Z][_a-zA-Z0-9]*$/.test(moduleKey)) throw new Error('Invalid module name');
  return moduleKey;
}

async function handler(req, res) {
  authMiddleware(req, res, () => {
    const { module: moduleKey } = req.query;
    if (!moduleKey || Array.isArray(moduleKey)) {
      return res.status(400).json({ error: 'module required' });
    }

    try {
      const name = normalizeTableName(moduleKey);
      const module = await prisma.module.findUnique({ where: { tableName: name } });
      if (!module) return res.status(404).json({ error: 'Module not found' });

      // TODO: Check if user has access to this module via ModuleRole

      if (req.method === 'GET') {
        return getData(req, res, name);
      }

      if (req.method === 'POST') {
        // Allow admin+ to create
        if (!['admin', 'super_admin', 'root'].includes(req.user.role)) {
          return res.status(403).json({ error: 'Insufficient permissions to create' });
        }
        return postData(req, res, name);
      }

      if (req.method === 'PUT') {
        if (!['admin', 'super_admin', 'root'].includes(req.user.role)) {
          return res.status(403).json({ error: 'Insufficient permissions to update' });
        }
        return putData(req, res, name);
      }

      if (req.method === 'DELETE') {
        if (!['super_admin'].includes(req.user.role)) {
          return res.status(403).json({ error: 'Insufficient permissions to delete' });
        }
        return deleteData(req, res, name);
      }

      res.setHeader('Allow', 'GET, POST, PUT, DELETE');
      return res.status(405).end('Method not allowed');
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: err && err.message ? err.message : 'Server error' });
    }
  });
}

async function getData(req, res, name) {
  const rows = await prisma.$queryRawUnsafe(`SELECT id, created_at, updated_at, data FROM "${name}" ORDER BY id DESC LIMIT 100`);
  return res.status(200).json({ rows });
}

async function postData(req, res, name) {
  const { data } = req.body;
  if (!data) return res.status(400).json({ error: 'payload data required' });
  const row = await prisma.$queryRawUnsafe(`INSERT INTO "${name}" (data) VALUES ($1::jsonb) RETURNING id, created_at, updated_at, data`, JSON.stringify(data));
  return res.status(201).json({ row });
}

async function putData(req, res, name) {
  const { id } = req.query;
  if (!id) return res.status(400).json({ error: 'id required' });
  const { data } = req.body;
  if (!data) return res.status(400).json({ error: 'payload data required' });
  await prisma.$executeRawUnsafe(`UPDATE "${name}" SET data = $1::jsonb, updated_at = NOW() WHERE id = $2`, JSON.stringify(data), Number(id));
  return res.status(200).json({ success: true });
}

async function deleteData(req, res, name) {
  const { id } = req.query;
  if (!id) return res.status(400).json({ error: 'id required' });
  await prisma.$executeRawUnsafe(`DELETE FROM "${name}" WHERE id = $1`, Number(id));
  return res.status(200).json({ success: true });
}

module.exports = handler;
