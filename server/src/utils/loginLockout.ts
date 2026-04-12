import prisma from '../config/prisma';

const FAILURE_THRESHOLDS = [5, 10, 15] as const;
const LOCKOUT_MINUTES = [15, 60, 24 * 60] as const;

const MESSAGES = [
  'Too many login attempts. Account locked for 15 minutes.',
  'Too many login attempts. Account locked for 1 hour.',
  'Too many login attempts. Account locked for 24 hours.',
] as const;

export const buildLoginKeys = (email: string, ip?: string) => ({
  email: email.toLowerCase(),
  ip: ip ?? 'unknown',
});

export const checkLoginLockout = async (
  keys: ReturnType<typeof buildLoginKeys>
) => {
  const record = await prisma.loginAttempt.findUnique({
    where: { email_ip: { email: keys.email, ip: keys.ip } },
  });

  if (!record || !record.lockedUntil) {
    return { locked: false, message: null, escalationLevel: 0 };
  }

  if (record.lockedUntil > new Date()) {
    return {
      locked: true,
      message: MESSAGES[Math.min(record.escalation, 2)],
      escalationLevel: record.escalation,
    };
  }

  await prisma.loginAttempt.delete({
    where: { email_ip: { email: keys.email, ip: keys.ip } },
  });

  return { locked: false, message: null, escalationLevel: 0 };
};

export const registerLoginFailure = async (
  keys: ReturnType<typeof buildLoginKeys>
) => {
  const existing = await prisma.loginAttempt.findUnique({
    where: { email_ip: { email: keys.email, ip: keys.ip } },
  });

  const attempts = (existing?.attempts ?? 0) + 1;

  let escalation = 0;
  if (attempts >= FAILURE_THRESHOLDS[2]) escalation = 2;
  else if (attempts >= FAILURE_THRESHOLDS[1]) escalation = 1;
  else if (attempts >= FAILURE_THRESHOLDS[0]) escalation = 0;

  const lockedUntil = attempts >= FAILURE_THRESHOLDS[0]
    ? new Date(Date.now() + LOCKOUT_MINUTES[escalation] * 60 * 1000)
    : null;

  await prisma.loginAttempt.upsert({
    where: { email_ip: { email: keys.email, ip: keys.ip } },
    create: {
      email: keys.email,
      ip: keys.ip,
      attempts,
      escalation,
      lockedUntil,
    },
    update: {
      attempts,
      escalation,
      lockedUntil,
    },
  });

  return {
    locked: Boolean(lockedUntil),
    message: lockedUntil ? MESSAGES[escalation] : null,
    escalationLevel: escalation,
  };
};

export const clearLoginFailures = async (
  keys: ReturnType<typeof buildLoginKeys>
) => {
  await prisma.loginAttempt.deleteMany({
    where: { email: keys.email, ip: keys.ip },
  });
};