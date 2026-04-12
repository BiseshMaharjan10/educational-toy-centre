import crypto from 'crypto';
import { env } from '../config/env';

export const generateOTP = (): string => {
  return crypto.randomInt(100000, 1000000).toString();
};

export const hashOTP = (otp: string): string => {
  const secret = env.OTP_SECRET ?? env.JWT_ACCESS_SECRET;

  return crypto
    .createHmac('sha256', secret)
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