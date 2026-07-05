const express = require('express');
const jwt = require('jsonwebtoken');
const router = express.Router();

const ADMIN_USERS = [
  {
    username: process.env.ADMIN_1_USERNAME || 'admin1',
    password: process.env.ADMIN_1_PASSWORD || 'password123',
  },
  {
    username: process.env.ADMIN_2_USERNAME || 'admin2',
    password: process.env.ADMIN_2_PASSWORD || 'password456',
  },
];

// Login Route
router.post('/login', (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ message: 'Username and password required' });
  }

  const admin = ADMIN_USERS.find(
    (u) => u.username === username && u.password === password
  );

  if (!admin) {
    return res.status(401).json({ message: 'Invalid credentials' });
  }

  const token = jwt.sign({ username }, process.env.JWT_SECRET, {
    expiresIn: '7d',
  });

  res.json({ token, message: 'Login successful' });
});

// Verify Token Middleware
const verifyToken = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'No token provided' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ message: 'Invalid token' });
  }
};

module.exports = router;
module.exports.verifyToken = verifyToken;