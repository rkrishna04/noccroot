const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

async function hashPassword(password) {
  const saltRounds = 10;
  return bcrypt.hash(password, saltRounds);
}

async function comparePassword(password, hash) {
  return bcrypt.compare(password, hash);
}

function signToken(payload) {
  const secret = process.env.JWT_SECRET || 'noccroot-secret-key';
  return jwt.sign(payload, secret, { expiresIn: '4h' });
}

function verifyToken(token) {
  const secret = process.env.JWT_SECRET || 'noccroot-secret-key';
  return jwt.verify(token, secret);
}

module.exports = {
  hashPassword,
  comparePassword,
  signToken,
  verifyToken,
};
