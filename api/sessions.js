const { prisma } = require('./db');
const { authMiddleware, roleMiddleware } = require('./middleware');

async function handler(req, res) {
  authMiddleware(req, res, () => {
    // Only admin+ can view sessions
    roleMiddleware(['admin', 'super_admin', 'root'])(req, res, () => {
      if (req.method === 'GET') {
        return getSessions(req, res);
      }
      res.setHeader('Allow', 'GET');
      res.status(405).end('Method not allowed');
    });
  });
}

async function getSessions(req, res) {
  try {
    const sessions = await prisma.session.findMany({
      orderBy: { loginAt: 'desc' },
      include: { user: { select: { fullName: true, email: true, role: true } } }
    });
    res.status(200).json({ sessions });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch sessions' });
  }
}

module.exports = handler;
