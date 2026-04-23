import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import prisma from '../lib/prisma';
import { sendPasswordResetEmail, sendVerificationEmailToUser } from './emailService';
import { AppError } from '../utils/appError';

function getJwtSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET is not defined in environment variables');
  }
  return secret;
}

export interface SignupData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  role?: 'STUDENT' | 'TEACHER' | 'HOD' | 'ADMIN' | 'VAC_INCHARGE';
  gender?: string;
  collegeName?: string;
  department?: string;
  className?: string;
  rollNumber?: string;
  yearOfStudy?: string;
  assignedClass?: string;
}

export interface LoginData {
  email: string;
  password: string;
}

const userSelectFields = {
  id: true,
  firstName: true,
  lastName: true,
  email: true,
  role: true,
  gender: true,
  collegeName: true,
  department: true,
  className: true,
  rollNumber: true,
  yearOfStudy: true,
  assignedClass: true,
  emailVerified: true,
  createdAt: true,
};

/**
 * User Registration Service
 * Creates a new user account with role and college information.
 * Email verification is disabled — users are immediately active.
 */
export const signup = async (data: SignupData) => {
  const existingUser = await prisma.user.findUnique({
    where: { email: data.email }
  });

  if (existingUser) {
    throw new AppError('Email already registered', 400);
  }

  const passwordHash = await bcrypt.hash(data.password, 10);
  const verificationToken = crypto.randomBytes(32).toString('hex');

  const user = await prisma.user.create({
    data: {
      firstName: data.firstName.replace(/<[^>]*>/g, '').trim(),
      lastName: data.lastName.replace(/<[^>]*>/g, '').trim(),
      email: data.email,
      passwordHash,
      emailVerified: false,
      verificationToken,
      role: data.role || 'STUDENT',
      gender: data.gender || null,
      collegeName: data.collegeName || null,
      department: data.department || null,
      className: data.className || null,
      rollNumber: data.rollNumber || null,
      yearOfStudy: data.yearOfStudy || null,
      assignedClass: data.assignedClass || null,
    },
    select: userSelectFields,
  });

  // Fire-and-forget: send verification email (works even without SMTP)
  sendVerificationEmailToUser(user.email, verificationToken, user.firstName).catch(() => {});

  const token = jwt.sign(
    { userId: user.id, email: user.email, role: user.role },
    getJwtSecret(),
    { expiresIn: '7d' }
  );

  const refreshToken = jwt.sign(
    { userId: user.id },
    getJwtSecret(),
    { expiresIn: '30d' }
  );

  await prisma.user.update({
    where: { id: user.id },
    data: { refreshToken }
  });

  return { user, token, refreshToken };
};

/**
 * User Login Service
 */
export const login = async (data: LoginData) => {
  const user = await prisma.user.findUnique({
    where: { email: data.email }
  });

  if (!user) {
    throw new AppError('Invalid email or password', 401);
  }

  const isValid = await bcrypt.compare(data.password, user.passwordHash);
  if (!isValid) {
    throw new AppError('Invalid email or password', 401);
  }

  const token = jwt.sign(
    { userId: user.id, email: user.email, role: user.role },
    getJwtSecret(),
    { expiresIn: '7d' }
  );

  const refreshToken = jwt.sign(
    { userId: user.id },
    getJwtSecret(),
    { expiresIn: '30d' }
  );

  await prisma.user.update({
    where: { id: user.id },
    data: { refreshToken }
  });

  return {
    user: {
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      role: user.role,
      gender: user.gender,
      collegeName: user.collegeName,
      department: user.department,
      className: user.className,
      rollNumber: user.rollNumber,
      yearOfStudy: user.yearOfStudy,
      assignedClass: user.assignedClass,
      emailVerified: user.emailVerified,
      createdAt: user.createdAt,
    },
    token,
    refreshToken
  };
};

export const getUserById = async (userId: string) => {
  return prisma.user.findUnique({
    where: { id: userId },
    select: userSelectFields,
  });
};

export const forgotPassword = async (email: string) => {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return null;

  const resetToken = crypto.randomBytes(32).toString('hex');
  const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');
  const resetTokenExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 mins

  await prisma.user.update({
    where: { id: user.id },
    data: { resetToken: hashedToken, resetTokenExpiry }
  });
  
  sendPasswordResetEmail(user.email, resetToken, user.firstName).catch(() => {});

  return resetToken;
};

export const resetPassword = async (token: string, newPassword: string) => {
  const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
  const user = await prisma.user.findFirst({
    where: {
      resetToken: hashedToken,
      resetTokenExpiry: { gt: new Date() }
    }
  });

  if (!user) throw new Error('Invalid or expired password reset token');

  const passwordHash = await bcrypt.hash(newPassword, 10);
  await prisma.user.update({
    where: { id: user.id },
    data: {
      passwordHash,
      resetToken: null,
      resetTokenExpiry: null,
      refreshToken: null
    }
  });
};

export const refresh = async (refreshToken: string) => {
  try {
    const decoded: any = jwt.verify(refreshToken, getJwtSecret());
    const user = await prisma.user.findFirst({
      where: {
        id: decoded.userId,
        refreshToken: refreshToken
      }
    });

    if (!user) throw new Error('Invalid refresh token');

    const newToken = jwt.sign(
       { userId: user.id, email: user.email, role: user.role },
       getJwtSecret(),
       { expiresIn: '7d' }
    );
    const newRefreshToken = jwt.sign(
       { userId: user.id },
       getJwtSecret(),
       { expiresIn: '30d' }
    );

    await prisma.user.update({
      where: { id: user.id },
      data: { refreshToken: newRefreshToken }
    });

    return { token: newToken, refreshToken: newRefreshToken };
  } catch (error) {
    throw new Error('Invalid refresh token');
  }
};

// ─── Change Password ────────────────────────────────────────────────
export const changePassword = async (userId: string, currentPassword: string, newPassword: string) => {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new AppError('User not found', 404);

  const isValid = await bcrypt.compare(currentPassword, user.passwordHash);
  if (!isValid) throw new AppError('Current password is incorrect', 400);

  const passwordHash = await bcrypt.hash(newPassword, 10);
  await prisma.user.update({
    where: { id: userId },
    data: { passwordHash, refreshToken: null } // invalidate all sessions
  });
};

// ─── Send verification email ────────────────────────────────────────
export const sendVerificationEmail = async (userId: string) => {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new AppError('User not found', 404);
  if (user.emailVerified) throw new AppError('Email is already verified', 400);

  const token = crypto.randomBytes(32).toString('hex');
  await prisma.user.update({
    where: { id: userId },
    data: { verificationToken: token }
  });

  await sendVerificationEmailToUser(user.email, token, user.firstName);
};

// ─── Verify email token ─────────────────────────────────────────────
export const verifyEmail = async (token: string) => {
  const user = await prisma.user.findFirst({
    where: { verificationToken: token }
  });

  if (!user) throw new AppError('Invalid or expired verification link', 400);

  await prisma.user.update({
    where: { id: user.id },
    data: { emailVerified: true, verificationToken: null }
  });
};
