import httpStatus from 'http-status';
import { verifyToken } from '../utils/jwtUtils.js';
import ApiError from '../utils/apiError.js';
import asyncHandler from '../utils/asyncHandler.js';
import userModel from '../models/Role.model.js';

const protect = asyncHandler(async (req, res, next) => {
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return next(new ApiError(httpStatus.UNAUTHORIZED, 'You are not logged in! Please log in to get access.'));
  }

  try {
    const decoded = verifyToken(token);
    // Cek apakah user masih ada
    const currentUser = await userModel.findById(decoded.userId);
    if (!currentUser) {
      return next(new ApiError(httpStatus.UNAUTHORIZED, 'The user belonging to this token does longer exist.'));
    }
    if (!currentUser.is_active) {
        return next(new ApiError(httpStatus.FORBIDDEN, 'User account is deactivated.'));
    }
    // Tambahkan user ke request object
    req.user = { userId: decoded.userId, role: decoded.role }; // atau decoded utuh jika perlu info lain
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return next(new ApiError(httpStatus.UNAUTHORIZED, 'Invalid token. Please log in again!'));
    }
    if (error.name === 'TokenExpiredError') {
      return next(new ApiError(httpStatus.UNAUTHORIZED, 'Your token has expired! Please log in again.'));
    }
    return next(new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'Something went wrong during token verification.'));
  }
});

// Middleware untuk membatasi akses berdasarkan role
const restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !req.user.role) { // Pastikan req.user dan req.user.role ada
        return next(new ApiError(httpStatus.UNAUTHORIZED, 'User role not defined. Authentication issue.'));
    }
    if (!roles.includes(req.user.role)) {
      return next(new ApiError(httpStatus.FORBIDDEN, 'You do not have permission to perform this action'));
    }
    next();
  };
};

export { protect, restrictTo };