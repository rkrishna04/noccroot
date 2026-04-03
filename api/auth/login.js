const { prisma } = require('../db');
const { comparePassword, signToken } = require('./utils');

async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  const user = await prisma.user.findUnique({
    where: { email },
    include: { role: true }
  });

  if (!user) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  if (user.lockedUntil && new Date(user.lockedUntil) > new Date()) {
    return res.status(423).json({ error: 'Account locked. Try after 30 minutes' });
  }

  const match = await comparePassword(password, user.passwordHash);
  if (!match) {
    await prisma.user.update({
      where: { id: user.id },
      data: {
        failedLogins: { increment: 1 }
      }
    });

    const afterFailed = user.failedLogins + 1;
    if (afterFailed >= 3) {
      const unlockAt = new Date(Date.now() + 30 * 60 * 1000);
      await prisma.user.update({ where: { id: user.id }, data: { lockedUntil: unlockAt, failedLogins: 0 } });
      return res.status(423).json({ error: 'Too many attempts. Account locked for 30 minutes.' });
    }

    return res.status(401).json({ error: 'Invalid credentials' });
  }

  await prisma.user.update({ where: { id: user.id }, data: { failedLogins: 0, lockedUntil: null, lastLogin: new Date() } });

  const token = signToken({ userId: user.id, role: user.role.name });
  await prisma.session.create({ data: { userId: user.id, ip: req.headers['x-forwarded-for']?.toString() || req.socket.remoteAddress || 'unknown', device: req.headers['user-agent'] || 'unknown' } });

  return res.status(200).json({ token, user: { id: user.id, fullName: user.fullName, email: user.email, role: user.role.name } });
}

module.exports = handler;
