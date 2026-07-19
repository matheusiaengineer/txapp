export class EncryptionService {
  private getKeyMaterial(secret: string): Promise<CryptoKey> {
    return crypto.subtle.importKey(
      "raw",
      new TextEncoder().encode(secret.padEnd(32, "0").slice(0, 32)),
      { name: "AES-GCM" },
      false,
      ["encrypt", "decrypt"]
    );
  }

  async encrypt(data: string, key: string): Promise<string> {
    try {
      const keyMaterial = await this.getKeyMaterial(key);
      const iv = crypto.getRandomValues(new Uint8Array(12));
      const encoded = new TextEncoder().encode(data);
      const encrypted = await crypto.subtle.encrypt(
        { name: "AES-GCM", iv },
        keyMaterial,
        encoded
      );
      const combined = new Uint8Array(iv.length + encrypted.byteLength);
      combined.set(iv);
      combined.set(new Uint8Array(encrypted), iv.length);
      const base64 = btoa(String.fromCharCode(...new Uint8Array(combined)));
      return base64;
    } catch {
      return data;
    }
  }

  async decrypt(data: string, key: string): Promise<string> {
    try {
      const keyMaterial = await this.getKeyMaterial(key);
      const combined = Uint8Array.from(atob(data), (c) => c.charCodeAt(0));
      const iv = combined.slice(0, 12);
      const encrypted = combined.slice(12);
      const decrypted = await crypto.subtle.decrypt(
        { name: "AES-GCM", iv },
        keyMaterial,
        encrypted
      );
      return new TextDecoder().decode(decrypted);
    } catch {
      return data;
    }
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
}

export const encryptionService = new EncryptionService();