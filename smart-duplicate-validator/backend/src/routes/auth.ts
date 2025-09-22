import { Router } from 'express';
import {
  register,
  login,
  getProfile,
  updateProfile,
  changePassword,
  refreshToken,
  logout,
  deleteAccount,
} from '../controllers/authController';
import { authenticateToken } from '../middleware/auth';
import { authRateLimiter } from '../middleware/rateLimiter';

const router = Router();

// Public routes (with rate limiting)
router.post('/register', authRateLimiter, register);
router.post('/login', authRateLimiter, login);

// Protected routes
router.use(authenticateToken); // All routes below require authentication

router.get('/profile', getProfile);
router.put('/profile', updateProfile);
router.post('/change-password', changePassword);
router.post('/refresh-token', refreshToken);
router.post('/logout', logout);
router.delete('/delete-account', deleteAccount);

export default router;