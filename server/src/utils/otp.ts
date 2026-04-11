import crypto from 'crypto';
import { env } from '../config/env';

export const generateOTP = (): string => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

export const hashOTP = (otp: string): string => {
  return crypto
    .createHmac('sha256', env.JWT_ACCESS_SECRET)
    .update(otp)
    .digest('hex');
};

export const verifyOTP = (otp: string, hashedOTP: string): boolean => {
  const hash = hashOTP(otp);
  if (hash.length !== hashedOTP.length) {
    return false;
  }

  return crypto.timingSafeEqual(
    Buffer.from(hash),
    Buffer.from(hashedOTP)
  );
};