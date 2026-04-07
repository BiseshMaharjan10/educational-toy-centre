import crypto from 'crypto';

export const generateOTP = (): string => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

export const hashOTP = (otp: string): string => {
  return crypto.createHash('sha256').update(otp).digest('hex');
};

export const verifyOTP = (otp: string, hashedOTP: string): boolean => {
  const hash = hashOTP(otp);
  return crypto.timingSafeEqual(
    Buffer.from(hash),
    Buffer.from(hashedOTP)
  );
};