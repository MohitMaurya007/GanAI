import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { prisma } from '../utils/database';
import { generateToken } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';
import { ValidationError, ConflictError, AuthenticationError } from '../types';
import { UserRole } from '@prisma/client';

interface RegisterRequest {
  email: string;
  username: string;
  password: string;
  firstName?: string;
  lastName?: string;
  role?: UserRole;
}

interface LoginRequest {
  email: string;
  password: string;
}

export const register = asyncHandler(async (req: Request, res: Response) => {
  const { email, username, password, firstName, lastName, role }: RegisterRequest = req.body;

  // Validation
  if (!email || !username || !password) {
    throw new ValidationError('Email, username, and password are required');
  }

  if (password.length < 8) {
    throw new ValidationError('Password must be at least 8 characters long');
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    throw new ValidationError('Please provide a valid email address');
  }

  if (username.length < 3) {
    throw new ValidationError('Username must be at least 3 characters long');
  }

  // Check if user already exists
  const existingUser = await prisma.user.findFirst({
    where: {
      OR: [
        { email },
        { username }
      ]
    }
  });

  if (existingUser) {
    if (existingUser.email === email) {
      throw new ConflictError('Email already registered');
    }
    if (existingUser.username === username) {
      throw new ConflictError('Username already taken');
    }
  }

  // Hash password
  const saltRounds = parseInt(process.env.BCRYPT_ROUNDS || '12');
  const hashedPassword = await bcrypt.hash(password, saltRounds);

  // Create user
  const user = await prisma.user.create({
    data: {
      email,
      username,
      password: hashedPassword,
      firstName,
      lastName,
      role: role || UserRole.STANDARD_USER,
      userSettings: {
        create: {} // Create default settings
      }
    },
    select: {
      id: true,
      email: true,
      username: true,
      role: true,
      firstName: true,
      lastName: true,
      avatar: true,
      createdAt: true,
    }
  });

  // Generate token
  const token = generateToken({
    userId: user.id,
    email: user.email,
    role: user.role,
  });

  res.status(201).json({
    success: true,
    message: 'User registered successfully',
    data: {
      user,
      token,
    }
  });
});

export const login = asyncHandler(async (req: Request, res: Response) => {
  const { email, password }: LoginRequest = req.body;

  // Validation
  if (!email || !password) {
    throw new ValidationError('Email and password are required');
  }

  // Find user
  const user = await prisma.user.findUnique({
    where: { email },
    select: {
      id: true,
      email: true,
      username: true,
      password: true,
      role: true,
      firstName: true,
      lastName: true,
      avatar: true,
      isActive: true,
    }
  });

  if (!user) {
    throw new AuthenticationError('Invalid email or password');
  }

  if (!user.isActive) {
    throw new AuthenticationError('Account is deactivated');
  }

  // Check password
  const isPasswordValid = await bcrypt.compare(password, user.password);
  if (!isPasswordValid) {
    throw new AuthenticationError('Invalid email or password');
  }

  // Update last login
  await prisma.user.update({
    where: { id: user.id },
    data: { lastLoginAt: new Date() }
  });

  // Generate token
  const token = generateToken({
    userId: user.id,
    email: user.email,
    role: user.role,
  });

  // Remove password from response
  const { password: _, ...userWithoutPassword } = user;

  res.json({
    success: true,
    message: 'Login successful',
    data: {
      user: userWithoutPassword,
      token,
    }
  });
});

export const getProfile = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw new AuthenticationError('User not authenticated');
  }

  const user = await prisma.user.findUnique({
    where: { id: req.user.id },
    select: {
      id: true,
      email: true,
      username: true,
      role: true,
      firstName: true,
      lastName: true,
      avatar: true,
      isActive: true,
      createdAt: true,
      updatedAt: true,
      lastLoginAt: true,
      userSettings: {
        select: {
          faceThreshold: true,
          objectThreshold: true,
          sceneThreshold: true,
          audioThreshold: true,
          autoProcessDuplicates: true,
          enableFaceDetection: true,
          enableObjectDetection: true,
          enableSceneAnalysis: true,
          enableAudioFingerprinting: true,
          emailNotifications: true,
          pushNotifications: true,
        }
      }
    }
  });

  if (!user) {
    throw new AuthenticationError('User not found');
  }

  res.json({
    success: true,
    data: { user }
  });
});

export const updateProfile = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw new AuthenticationError('User not authenticated');
  }

  const { firstName, lastName, avatar } = req.body;

  const updatedUser = await prisma.user.update({
    where: { id: req.user.id },
    data: {
      ...(firstName !== undefined && { firstName }),
      ...(lastName !== undefined && { lastName }),
      ...(avatar !== undefined && { avatar }),
    },
    select: {
      id: true,
      email: true,
      username: true,
      role: true,
      firstName: true,
      lastName: true,
      avatar: true,
      updatedAt: true,
    }
  });

  res.json({
    success: true,
    message: 'Profile updated successfully',
    data: { user: updatedUser }
  });
});

export const changePassword = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw new AuthenticationError('User not authenticated');
  }

  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    throw new ValidationError('Current password and new password are required');
  }

  if (newPassword.length < 8) {
    throw new ValidationError('New password must be at least 8 characters long');
  }

  // Get user with password
  const user = await prisma.user.findUnique({
    where: { id: req.user.id },
    select: { password: true }
  });

  if (!user) {
    throw new AuthenticationError('User not found');
  }

  // Verify current password
  const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);
  if (!isCurrentPasswordValid) {
    throw new AuthenticationError('Current password is incorrect');
  }

  // Hash new password
  const saltRounds = parseInt(process.env.BCRYPT_ROUNDS || '12');
  const hashedNewPassword = await bcrypt.hash(newPassword, saltRounds);

  // Update password
  await prisma.user.update({
    where: { id: req.user.id },
    data: { password: hashedNewPassword }
  });

  res.json({
    success: true,
    message: 'Password changed successfully'
  });
});

export const refreshToken = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw new AuthenticationError('User not authenticated');
  }

  // Generate new token
  const token = generateToken({
    userId: req.user.id,
    email: req.user.email,
    role: req.user.role,
  });

  res.json({
    success: true,
    message: 'Token refreshed successfully',
    data: { token }
  });
});

export const logout = asyncHandler(async (req: Request, res: Response) => {
  // In a stateless JWT setup, logout is handled client-side by removing the token
  // However, we can add the token to a blacklist if needed
  
  res.json({
    success: true,
    message: 'Logged out successfully'
  });
});

export const deleteAccount = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw new AuthenticationError('User not authenticated');
  }

  const { password } = req.body;

  if (!password) {
    throw new ValidationError('Password is required to delete account');
  }

  // Get user with password
  const user = await prisma.user.findUnique({
    where: { id: req.user.id },
    select: { password: true }
  });

  if (!user) {
    throw new AuthenticationError('User not found');
  }

  // Verify password
  const isPasswordValid = await bcrypt.compare(password, user.password);
  if (!isPasswordValid) {
    throw new AuthenticationError('Invalid password');
  }

  // Delete user (this will cascade delete related data)
  await prisma.user.delete({
    where: { id: req.user.id }
  });

  res.json({
    success: true,
    message: 'Account deleted successfully'
  });
});