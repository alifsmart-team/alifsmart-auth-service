import jwt from 'jsonwebtoken';
import config from '../config/index.js';

const generateToken = (payload) => {
  return jwt.sign(payload, config.jwt.secret, {
    expiresIn: config.jwt.expiresIn,
  });
};

const verifyToken = (token) => {
  try {
    return jwt.verify(token, config.jwt.secret);
  } catch (error) {
    // Error akan ditangani oleh pemanggil (misal, authMiddleware)
    throw error;
  }
};

export { generateToken, verifyToken };