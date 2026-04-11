import bcrypt from 'bcryptjs';
import { StatusCodes } from 'http-status-codes';
import prisma from '../../config/prisma';
import { AppError } from '../../middleware/errorHandler';
import {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
} from '../../utils/jwt';
import { generateOTP, hashOTP, verifyOTP } from '../../utils/otp';
import { sendEmail } from '../../config/email';
import {
  otpVerificationTemplate,
  passwordResetTemplate,
} from '../../utils/emailTemplates';
import type {
  RegisterInput,
  LoginInput,
  VerifyOtpInput,
  ForgotPasswordInput,
  ResetPasswordInput,
} from './auth.validator';

const OTP_EXPIRY_MS = 5 * 60 * 1000;
const MAX_OTP_ATTEMPTS = 5;

export const registerUser = async (data: RegisterInput) => {
  const existingUser = await prisma.user.findUnique({
    where: { email: data.email },
  });

  if (existingUser && existingUser.isVerified) {
    throw new AppError('Email already registered', StatusCodes.CONFLICT);
  }

  const passwordHash = await bcrypt.hash(data.password, 12);

  const user = existingUser
    ? await prisma.user.update({
        where: { email: data.email },
        data: { name: data.name, passwordHash, phone: data.phone },
      })
    : await prisma.user.create({
        data: {
          name: data.name,
          email: data.email,
          passwordHash,
          phone: data.phone,
          isVerified: false,
        },
      });

  await prisma.otpVerification.deleteMany({
    where: { userId: user.id, purpose: 'EMAIL_VERIFICATION' },
  });

  const otp = generateOTP();
  const otpHash = hashOTP(otp);

  await prisma.otpVerification.create({
    data: {
      userId: user.id,
      email: data.email,
      otpHash,
      purpose: 'EMAIL_VERIFICATION',
      expiresAt: new Date(Date.now() + OTP_EXPIRY_MS),
    },
  });

  await sendEmail(
    data.email,
    'Verify your email — Educational Toy Centre',
    otpVerificationTemplate(data.name, otp)
  );

  return { message: 'OTP sent to your email. It expires in 5 minutes.' };
};

export const verifyEmailOtp = async (data: VerifyOtpInput) => {
  const user = await prisma.user.findUnique({
    where: { email: data.email },
  });

  if (!user) {
    throw new AppError('No account found with this email', StatusCodes.NOT_FOUND);
  }

  if (user.isVerified) {
    throw new AppError('Email already verified', StatusCodes.BAD_REQUEST);
  }

  const otpRecord = await prisma.otpVerification.findFirst({
    where: { userId: user.id, purpose: 'EMAIL_VERIFICATION' },
  });

  if (!otpRecord) {
    throw new AppError('No OTP found. Please register again.', StatusCodes.BAD_REQUEST);
  }

  if (otpRecord.expiresAt < new Date()) {
    await prisma.otpVerification.delete({ where: { id: otpRecord.id } });
    throw new AppError('OTP expired. Please request a new one.', StatusCodes.BAD_REQUEST);
  }

  if (otpRecord.attempts >= MAX_OTP_ATTEMPTS) {
    await prisma.otpVerification.delete({ where: { id: otpRecord.id } });
    throw new AppError('Too many wrong attempts. Please request a new OTP.', StatusCodes.BAD_REQUEST);
  }

  const isValid = verifyOTP(data.otp, otpRecord.otpHash);

  if (!isValid) {
    await prisma.otpVerification.update({
      where: { id: otpRecord.id },
      data: { attempts: otpRecord.attempts + 1 },
    });
    const attemptsLeft = MAX_OTP_ATTEMPTS - otpRecord.attempts - 1;
    throw new AppError(
      `Invalid OTP. ${attemptsLeft} attempt${attemptsLeft === 1 ? '' : 's'} remaining.`,
      StatusCodes.BAD_REQUEST
    );
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { isVerified: true },
  });

  await prisma.otpVerification.delete({ where: { id: otpRecord.id } });

  return { message: 'Email verified successfully. You can now log in.' };
};

export const resendOtp = async (email: string) => {
  const user = await prisma.user.findUnique({ where: { email } });

  if (!user || user.isVerified) {
    return { message: 'If an unverified account exists, a new OTP has been sent.' };
  }

  const existingOtp = await prisma.otpVerification.findFirst({
    where: { userId: user.id, purpose: 'EMAIL_VERIFICATION' },
  });

  if (existingOtp) {
    const cooldownMs = 60 * 1000;
    const timeSinceCreated = Date.now() - existingOtp.createdAt.getTime();
    if (timeSinceCreated < cooldownMs) {
      const waitSeconds = Math.ceil((cooldownMs - timeSinceCreated) / 1000);
      throw new AppError(
        `Please wait ${waitSeconds} seconds before requesting a new OTP.`,
        StatusCodes.TOO_MANY_REQUESTS
      );
    }
    await prisma.otpVerification.delete({ where: { id: existingOtp.id } });
  }

  const otp = generateOTP();
  const otpHash = hashOTP(otp);

  await prisma.otpVerification.create({
    data: {
      userId: user.id,
      email,
      otpHash,
      purpose: 'EMAIL_VERIFICATION',
      expiresAt: new Date(Date.now() + OTP_EXPIRY_MS),
    },
  });

  await sendEmail(
    email,
    'New verification code — Educational Toy Centre',
    otpVerificationTemplate(user.name, otp)
  );

  return { message: 'If an unverified account exists, a new OTP has been sent.' };
};

export const loginUser = async (data: LoginInput) => {
  const user = await prisma.user.findUnique({ where: { email: data.email } });

  if (!user) {
    throw new AppError('Invalid email or password', StatusCodes.UNAUTHORIZED);
  }

  if (!user.isVerified) {
    throw new AppError(
      'Please verify your email before logging in.',
      StatusCodes.FORBIDDEN
    );
  }

  const isPasswordValid = await bcrypt.compare(data.password, user.passwordHash);

  if (!isPasswordValid) {
    throw new AppError('Invalid email or password', StatusCodes.UNAUTHORIZED);
  }

  const accessToken = signAccessToken({ userId: user.id, role: user.role });
  const refreshToken = signRefreshToken({ userId: user.id, role: user.role });

  await prisma.refreshToken.create({
    data: {
      token: refreshToken,
      userId: user.id,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    },
  });

  return {
    accessToken,
    refreshToken,
    user: { id: user.id, name: user.name, email: user.email, role: user.role },
  };
};

export const loginAdmin = async (data: LoginInput) => {
  const user = await prisma.user.findUnique({ where: { email: data.email } });

  if (!user || user.role !== 'ADMIN') {
    throw new AppError('Invalid credentials', StatusCodes.UNAUTHORIZED);
  }

  const isPasswordValid = await bcrypt.compare(data.password, user.passwordHash);

  if (!isPasswordValid) {
    throw new AppError('Invalid credentials', StatusCodes.UNAUTHORIZED);
  }

  const accessToken = signAccessToken({ userId: user.id, role: user.role });
  const refreshToken = signRefreshToken({ userId: user.id, role: user.role });

  await prisma.refreshToken.create({
    data: {
      token: refreshToken,
      userId: user.id,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    },
  });

  return {
    accessToken,
    refreshToken,
    user: { id: user.id, name: user.name, email: user.email, role: user.role },
  };
};

export const refreshAccessToken = async (token: string) => {
  if (!token) {
    throw new AppError('No refresh token provided', StatusCodes.UNAUTHORIZED);
  }

  let payload;
  try {
    payload = verifyRefreshToken(token);
  } catch {
    throw new AppError('Invalid or expired refresh token', StatusCodes.UNAUTHORIZED);
  }

  const storedToken = await prisma.refreshToken.findUnique({ where: { token } });

  if (
    !storedToken ||
    storedToken.expiresAt < new Date() ||
    storedToken.userId !== payload.userId
  ) {
    throw new AppError('Invalid or expired refresh token', StatusCodes.UNAUTHORIZED);
  }

  const accessToken = signAccessToken({
    userId: payload.userId,
    role: payload.role,
  });

  return { accessToken };
};

export const logoutUser = async (token: string) => {
  await prisma.refreshToken.deleteMany({ where: { token } });
};

export const forgotPassword = async (data: ForgotPasswordInput) => {
  const user = await prisma.user.findUnique({ where: { email: data.email } });

  if (!user || !user.isVerified) {
    return { message: 'If this email exists, an OTP has been sent.' };
  }

  const existingOtp = await prisma.otpVerification.findFirst({
    where: { userId: user.id, purpose: 'PASSWORD_RESET' },
  });

  if (existingOtp) {
    const cooldownMs = 60 * 1000;
    const timeSinceCreated = Date.now() - existingOtp.createdAt.getTime();
    if (timeSinceCreated < cooldownMs) {
      const waitSeconds = Math.ceil((cooldownMs - timeSinceCreated) / 1000);
      throw new AppError(
        `Please wait ${waitSeconds} seconds before requesting a new OTP.`,
        StatusCodes.TOO_MANY_REQUESTS
      );
    }
    await prisma.otpVerification.delete({ where: { id: existingOtp.id } });
  }

  const otp = generateOTP();
  const otpHash = hashOTP(otp);

  await prisma.otpVerification.create({
    data: {
      userId: user.id,
      email: data.email,
      otpHash,
      purpose: 'PASSWORD_RESET',
      expiresAt: new Date(Date.now() + OTP_EXPIRY_MS),
    },
  });

  await sendEmail(
    data.email,
    'Reset your password — Educational Toy Centre',
    passwordResetTemplate(user.name, otp)
  );

  return { message: 'If this email exists, an OTP has been sent.' };
};

export const resetPassword = async (data: ResetPasswordInput) => {
  const user = await prisma.user.findUnique({ where: { email: data.email } });

  if (!user) {
    throw new AppError('Invalid or expired OTP', StatusCodes.BAD_REQUEST);
  }

  const otpRecord = await prisma.otpVerification.findFirst({
    where: { userId: user.id, purpose: 'PASSWORD_RESET' },
  });

  if (!otpRecord) {
    throw new AppError('Invalid or expired OTP', StatusCodes.BAD_REQUEST);
  }

  if (otpRecord.expiresAt < new Date()) {
    await prisma.otpVerification.delete({ where: { id: otpRecord.id } });
    throw new AppError('OTP expired. Please request a new one.', StatusCodes.BAD_REQUEST);
  }

  if (otpRecord.attempts >= MAX_OTP_ATTEMPTS) {
    await prisma.otpVerification.delete({ where: { id: otpRecord.id } });
    throw new AppError('Too many wrong attempts. Please request a new OTP.', StatusCodes.BAD_REQUEST);
  }

  const isValid = verifyOTP(data.otp, otpRecord.otpHash);

  if (!isValid) {
    await prisma.otpVerification.update({
      where: { id: otpRecord.id },
      data: { attempts: otpRecord.attempts + 1 },
    });
    const attemptsLeft = MAX_OTP_ATTEMPTS - otpRecord.attempts - 1;
    throw new AppError(
      `Invalid OTP. ${attemptsLeft} attempt${attemptsLeft === 1 ? '' : 's'} remaining.`,
      StatusCodes.BAD_REQUEST
    );
  }

  const passwordHash = await bcrypt.hash(data.newPassword, 12);

  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash },
  });

  await prisma.otpVerification.delete({ where: { id: otpRecord.id } });

  await prisma.refreshToken.deleteMany({ where: { userId: user.id } });

  return { message: 'Password reset successfully. Please log in with your new password.' };
};