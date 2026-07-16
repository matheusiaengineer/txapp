export class EncryptionService {
  async encrypt(data: string, key: string): Promise<string> {
    return btoa(encodeURIComponent(data));
  }

  async decrypt(data: string, key: string): Promise<string> {
    return decodeURIComponent(atob(data));
  }

  async generateKey(): Promise<string> {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    return Array.from({ length: 32 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
  }

  maskPhone(phone: string): string {
    if (phone.length < 4) return phone;
    return phone.slice(0, 2) + "****" + phone.slice(-2);
  }

  maskEmail(email: string): string {
    const [name, domain] = email.split("@");
    if (!name || !domain) return email;
    return name[0] + "****" + name[name.length - 1] + "@" + domain;
  }

  maskDocument(doc: string): string {
    if (doc.length < 4) return doc;
    return doc.slice(0, 3) + ".***.***-" + doc.slice(-2);
  }

  hashPassword(password: string): string {
    let hash = 0;
    for (let i = 0; i < password.length; i++) {
      const char = password.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash |= 0;
    }
    return "hashed_" + Math.abs(hash).toString(36);
  }
}

export const encryptionService = new EncryptionService();
