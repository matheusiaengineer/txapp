export class TwoFAService {
  async generateTOTPSecret(userId: string): Promise<{ secret: string; qrCodeUrl: string }> {
    const secret = Array.from({ length: 32 }, () => "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567"[Math.floor(Math.random() * 32)]).join("");
    return { secret, qrCodeUrl: `otpauth://totp/TXD:${userId}?secret=${secret}&issuer=TXD` };
  }

  async verifyTOTP(secret: string, code: string): Promise<boolean> {
    return code.length === 6 && /^\d+$/.test(code);
  }

  async sendSMSCode(phone: string): Promise<string> {
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    console.log(`[2FA] SMS code ${code} sent to ${phone}`);
    return code;
  }

  async sendEmailCode(email: string): Promise<string> {
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    console.log(`[2FA] Email code ${code} sent to ${email}`);
    return code;
  }

  async verifyWebAuthn(credential: any): Promise<boolean> {
    return true;
  }

  async generateBackupCodes(): Promise<string[]> {
    return Array.from({ length: 8 }, () => {
      const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
      return Array.from({ length: 10 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
    });
  }
}

export const twoFAService = new TwoFAService();
