const { prisma } = require('../db');
const { hashPassword } = require('./utils');

async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { fullName, email, password, role } = req.body;

  if (!fullName || !email || !password || !role) {
    return res.status(400).json({ error: 'fullName, email, password, role are required' });
  }

  try {
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return res.status(409).json({ error: 'Email already exists' });
    }

    let roleRecord = await prisma.role.findUnique({ where: { name: role } });
    if (!roleRecord) {
      roleRecord = await prisma.role.create({ data: { name: role } });
    }

    const passwordHash = await hashPassword(password);

    const user = await prisma.user.create({
      data: {
        fullName,
        email,
        passwordHash,
        roleId: roleRecord.id,
      },
      select: { id: true, fullName: true, email: true, roleId: true }
    });

    return res.status(201).json({ success: true, user });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

module.exports = handler;
