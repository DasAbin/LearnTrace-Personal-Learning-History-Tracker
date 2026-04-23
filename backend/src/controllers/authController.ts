import { Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import * as authService from '../services/authService';
import { asyncHandler } from '../middleware/asyncHandler';
import { AuthRequest } from '../types';
import logger from '../lib/logger';

export const signup = [
  body('firstName').trim().notEmpty().withMessage('First name is required'),
  body('lastName').trim().notEmpty().withMessage('Last name is required'),
  body('email').isEmail().withMessage('Valid email is required'),
  body('password')
    .isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
    .matches(/[A-Z]/).withMessage('Password must contain at least one uppercase letter')
    .matches(/[0-9]/).withMessage('Password must contain at least one number')
    .matches(/[!@#$%^&*]/).withMessage('Password must contain at least one special character (!@#$%^&*)'),
  body('role').optional().isIn(['STUDENT', 'TEACHER', 'HOD', 'ADMIN', 'VAC_INCHARGE']).withMessage('Invalid role'),
  body('gender').optional().isIn(['male', 'female', 'other']).withMessage('Invalid gender'),
  body('collegeName').optional().trim(),
  body('department').optional().trim(),
  body('className').optional().trim(),
  body('rollNumber').optional().trim(),
  body('yearOfStudy').optional().trim(),
  body('assignedClass').optional().trim(),

  async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    try {
      const {
        firstName, lastName, email, password, role, gender,
        collegeName, department, className, rollNumber, yearOfStudy, assignedClass
      } = req.body;

      const result = await authService.signup({
        firstName, lastName, email, password,
        role, gender, collegeName, department,
        className, rollNumber, yearOfStudy, assignedClass
      });

      res.status(201).json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }
];

export const login = [
  body('email').isEmail(),
  body('password').notEmpty(),

  async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    try {
      const { email, password } = req.body;
      logger.info({ email }, '🔐 Login attempt');
      const result = await authService.login({ email, password });
      logger.info({ email }, '✅ Login successful');
      res.json(result);
    } catch (error: any) {
      logger.error({ email: req.body.email, error: error.message }, '❌ Login failed');
      res.status(401).json({ error: 'Invalid email or password' });
    }
  }
];

export const getMe = asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).userId;
  if (!userId) return res.status(401).json({ error: 'Unauthorized' });
  const user = await authService.getUserById(userId);
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json({ user });
});

export const forgotPassword = asyncHandler(async (req: Request, res: Response) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'Email is required' });
  await authService.forgotPassword(email);
  res.json({ message: 'If the email exists, a password reset link has been sent.' });
});

export const resetPassword = [
  body('token').notEmpty(),
  body('newPassword')
    .isLength({ min: 8 })
    .matches(/[A-Z]/)
    .matches(/[0-9]/)
    .matches(/[!@#$%^&*]/),

  async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    try {
      const { token, newPassword } = req.body;
      await authService.resetPassword(token, newPassword);
      res.json({ message: 'Password reset successfully' });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }
];

export const refresh = async (req: Request, res: Response) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) return res.status(400).json({ error: 'Refresh token required' });
    const tokens = await authService.refresh(refreshToken);
    res.json(tokens);
  } catch (error: any) {
    res.status(401).json({ error: error.message });
  }
};

// ─── NEW: Change Password (logged-in user) ───────────────────────────
export const changePassword = asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.userId!;
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    return res.status(400).json({ error: 'Current and new password are required' });
  }

  const pwRegex = /^(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*]).{8,}$/;
  if (!pwRegex.test(newPassword)) {
    return res.status(400).json({
      error: 'New password must be 8+ characters with uppercase, number, and special character'
    });
  }

  await authService.changePassword(userId, currentPassword, newPassword);
  res.json({ message: 'Password changed successfully' });
});

// ─── NEW: Send/resend verification email ─────────────────────────────
export const sendVerificationEmail = asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.userId!;
  await authService.sendVerificationEmail(userId);
  res.json({ message: 'Verification email sent. Please check your inbox.' });
});

// ─── NEW: Verify email via token ─────────────────────────────────────
export const verifyEmail = asyncHandler(async (req: Request, res: Response) => {
  const { token } = req.query;
  if (!token || typeof token !== 'string') {
    return res.status(400).json({ error: 'Verification token is required' });
  }
  await authService.verifyEmail(token);
  // Redirect to frontend success page
  const frontendUrl = (process.env.FRONTEND_URL || 'http://localhost:5173').replace(/\/+$/, '');
  res.redirect(`${frontendUrl}/email-verified`);
});
