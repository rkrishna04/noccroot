const { prisma } = require('./db');
const { hashPassword } = require('./auth/utils');
const { authMiddleware, roleMiddleware } = require('./middleware');

async function handler(req, res) {
  authMiddleware(req, res, () => {
    const { method } = req;

    if (method === 'GET') {
      // Only super_admin and root can list users
      roleMiddleware(['super_admin', 'root'])(req, res, () => getUsers(req, res));
    } else if (method === 'POST') {
      // Only super_admin can create users
      roleMiddleware(['super_admin'])(req, res, () => postUser(req, res));
    } else {
      res.setHeader('Allow', 'GET, POST');
      res.status(405).end('Method not allowed');
    }
  });
}

async function getUsers(req, res) {
  const users = await prisma.user.findMany({ select: { id: true, fullName: true, email: true, status: true, role: { select: { name: true } }, createdAt: true } });
  return res.status(200).json({ users });
}

async function postUser(req, res) {
  const { fullName, email, password, role } = req.body;
  if (!fullName || !email || !password || !role) {
    return res.status(400).json({ error: 'fullName, email, password, role are required' });
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return res.status(409).json({ error: 'Email already exists' });

  let roleRecord = await prisma.role.findUnique({ where: { name: role } });
  if (!roleRecord) roleRecord = await prisma.role.create({ data: { name: role } });

  const passwordHash = await hashPassword(password);

  const user = await prisma.user.create({ data: { fullName, email, passwordHash, roleId: roleRecord.id } });
  return res.status(201).json({ user: { id: user.id, fullName: user.fullName, email: user.email, role } });
}

module.exports = handler;

