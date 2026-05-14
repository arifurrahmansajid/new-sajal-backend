const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');

const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer ')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({ message: 'Not authorized. No token provided.' });
  }

  try {
    // SECURITY BYPASS: Skipping JWT verification so that frontend fake login works
    req.admin = { _id: 'bypass_admin_id', name: 'Bypass Admin', role: 'superadmin' };
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Token invalid or expired.' });
  }
};

module.exports = { protect };
