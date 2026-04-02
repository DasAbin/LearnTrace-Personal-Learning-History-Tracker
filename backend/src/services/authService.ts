import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import prisma from '../lib/prisma';
import { sendVerificationEmail } from './emailService';

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
}

export interface LoginData {
  email: string;
  password: string;
}

/**
 * User Registration Service
 * 
 * Creates a new user account with:
 * - Email uniqueness validation
 * - Password hashing using bcrypt (10 salt rounds)
 * - JWT token generation for immediate authentication
 */
export const signup = async (data: SignupData) => {
  // Check if email already exists
  const existingUser = await prisma.user.findUnique({
    where: { email: data.email }
  });

  if (existingUser) {
    throw new Error('Email already registered');
  }

  // Hash password with bcrypt (10 salt rounds for security)
  const passwordHash = await bcrypt.hash(data.password, 10);
  const verificationToken = crypto.randomUUID();

  const user = await prisma.user.create({
    data: {
      firstName: data.firstName.replace(/<[^>]*>/g, '').trim(),
      lastName: data.lastName.replace(/<[^>]*>/g, '').trim(),
      email: data.email,
      passwordHash,
      verificationToken
    },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      emailVerified: true,
      createdAt: true
    }
  });

  const token = jwt.sign(
    { userId: user.id, email: user.email },
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

  // Send verification email (async, non-blocking)
  sendVerificationEmail(user.email, verificationToken, user.firstName).catch(() => {});

  return { user, token, refreshToken, verificationToken };
};

/**
 * Verify Email Service
 */
export const verifyEmail = async (token: string) => {
  const user = await prisma.user.findUnique({
    where: { verificationToken: token }
  });

  if (!user) {
    throw new Error('Invalid or expired verification token');
  }

  const updatedUser = await prisma.user.update({
    where: { id: user.id },
    data: {
      emailVerified: true,
      verificationToken: null
    },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      emailVerified: true,
      createdAt: true
    }
  });

  const accessToken = jwt.sign(
    { userId: updatedUser.id, email: updatedUser.email },
    getJwtSecret(),
    { expiresIn: '7d' }
  );

  const refreshToken = jwt.sign(
    { userId: updatedUser.id },
    getJwtSecret(),
    { expiresIn: '30d' }
  );

  await prisma.user.update({
    where: { id: updatedUser.id },
    data: { refreshToken }
  });

  return { user: updatedUser, token: accessToken, refreshToken };
};

/**
 * Resend Verification Email Service
 */
export const resendVerification = async (userId: string) => {
  const user = await prisma.user.findUnique({
    where: { id: userId }
  });

  if (!user) {
    throw new Error('User not found');
  }

  if (user.emailVerified) {
    throw new Error('Email is already verified');
  }

  let token = user.verificationToken;
  if (!token) {
    token = crypto.randomUUID();
    await prisma.user.update({
      where: { id: user.id },
      data: { verificationToken: token }
    });
  }

  // Send verification email
  sendVerificationEmail(user.email, token, user.firstName).catch(() => {});

  return { message: 'Verification email sent', token };
};

/**
 * User Login Service
 * 
 * Authenticates user by:
 * - Finding user by email
 * - Comparing provided password with stored hash using bcrypt
 * - Generating JWT token on successful authentication
 */
export const login = async (data: LoginData) => {
  // Find user by email
  const user = await prisma.user.findUnique({
    where: { email: data.email }
  });

  if (!user) {
    // Don't reveal if email exists (security best practice)
    throw new Error('Invalid email or password');
  }

  // Compare password with stored hash
  const isValid = await bcrypt.compare(data.password, user.passwordHash);

  if (!isValid) {
    throw new Error('Invalid email or password');
  }

  const token = jwt.sign(
    { userId: user.id, email: user.email },
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
      emailVerified: user.emailVerified,
      createdAt: user.createdAt
    },
    token,
    refreshToken
  };
};

export const getUserById = async (userId: string) => {
  return prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      emailVerified: true,
      createdAt: true
    }
  });
};

export const forgotPassword = async (email: string) => {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return null; // Don't throw exception to prevent email enumeration

  const resetToken = crypto.randomBytes(32).toString('hex');
  const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');
  const resetTokenExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 mins

  await prisma.user.update({
    where: { id: user.id },
    data: { resetToken: hashedToken, resetTokenExpiry }
  });

  // Since we don't have email setup yet in MVP, return the raw token.
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
      refreshToken: null // invalidate existing sessions
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
       { userId: user.id, email: user.email },
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
