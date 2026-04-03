const { prisma } = require('./db');

async function handler(req, res) {
  if (req.method === 'GET') {
    const logs = await prisma.auditLog.findMany({ orderBy: { createdAt: 'desc' }, take: 200, include: { user: { select: { fullName: true, email: true } } } });
    return res.status(200).json({ logs });
  }

  if (req.method === 'POST') {
    const { userId, action, targetType, targetId, diff, ip } = req.body;
    if (!userId || !action || !targetType) {
      return res.status(400).json({ error: 'userId, action, targetType are required' });
    }
    const log = await prisma.auditLog.create({ data: { userId, action, targetType, targetId: targetId || null, diff: diff || null, ip: ip || null } });
    return res.status(201).json({ log });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}

module.exports = handler;
