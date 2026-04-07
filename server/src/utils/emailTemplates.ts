export const otpVerificationTemplate = (name: string, otp: string): string => {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #1A2F4A;">Verify Your Email</h2>
      <p>Hi ${name},</p>
      <p>Thank you for registering with Educational Toy Centre.</p>
      <p>Your verification code is:</p>
      <div style="background: #F5C518; padding: 20px; text-align: center; border-radius: 8px; margin: 20px 0;">
        <h1 style="color: #1A2F4A; letter-spacing: 8px; margin: 0;">${otp}</h1>
      </div>
      <p>This code expires in <strong>5 minutes</strong>.</p>
      <p>If you did not register, please ignore this email.</p>
      <p>— Educational Toy Centre Team</p>
    </div>
  `;
};

export const passwordResetTemplate = (name: string, otp: string): string => {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #1A2F4A;">Reset Your Password</h2>
      <p>Hi ${name},</p>
      <p>You requested a password reset for your Educational Toy Centre account.</p>
      <p>Your reset code is:</p>
      <div style="background: #F5C518; padding: 20px; text-align: center; border-radius: 8px; margin: 20px 0;">
        <h1 style="color: #1A2F4A; letter-spacing: 8px; margin: 0;">${otp}</h1>
      </div>
      <p>This code expires in <strong>5 minutes</strong>.</p>
      <p>After resetting your password, you will be logged out of all devices.</p>
      <p>If you did not request this, please ignore this email and your password will remain unchanged.</p>
      <p>— Educational Toy Centre Team</p>
    </div>
  `;
};