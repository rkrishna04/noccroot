const { prisma } = require('./db');

async function handler(req, res) {
  if (req.method === 'GET') {
    const logs = await prisma.reportLog.findMany({ orderBy: { generatedAt: 'desc' }, take: 200, include: { user: { select: { fullName: true, email: true } } } });
    return res.status(200).json({ logs });
  }

  if (req.method === 'POST') {
    const { userId, moduleId, filterJson, outputType, downloadUrl } = req.body;
    if (!userId || !moduleId || !outputType) {
      return res.status(400).json({ error: 'userId, moduleId, outputType required' });
    }
    const log = await prisma.reportLog.create({ data: { userId, moduleId, filterJson: filterJson || null, outputType, downloadUrl: downloadUrl || null } });
    return res.status(201).json({ log });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}

module.exports = handler;
