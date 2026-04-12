import { beforeEach, describe, expect, it } from 'vitest';
import {
  buildLoginKeys,
  checkLoginLockout,
  clearLoginFailures,
  registerLoginFailure,
} from '../src/utils/loginLockout';

describe('loginLockout', () => {
  const keys = buildLoginKeys('test@example.com', '192.168.1.1');

  beforeEach(async () => {
    await clearLoginFailures(keys);
  });

  it('should lock after 5 failures', async () => {
    for (let i = 0; i < 5; i += 1) {
      await registerLoginFailure(keys);
    }

    const lockout = await checkLoginLockout(keys);
    expect(lockout.locked).toBe(true);
    expect(lockout.escalationLevel).toBe(0);
  });

  it('should clear failures on successful login', async () => {
    await registerLoginFailure(keys);
    await clearLoginFailures(keys);
    const lockout = await checkLoginLockout(keys);
    expect(lockout.locked).toBe(false);
  });
});
