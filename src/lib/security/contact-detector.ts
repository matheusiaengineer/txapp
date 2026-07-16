export interface DetectionResult {
  blocked: boolean;
  reason?: string;
  matches: string[];
  warning?: string;
}

const CONTACT_PATTERNS: { regex: RegExp; label: string; warning: string }[] = [
  {
    regex: /(\+?\d{1,3}[-\s]?)?\(?\d{2,3}\)?[-\s]?\d{4,5}[-\s]?\d{4}/g,
    label: "telefone",
    warning: "Compartilhar telefone fora da plataforma não é permitido",
  },
  {
    regex: /wa\.me\/\S+/gi,
    label: "WhatsApp",
    warning: "Compartilhar WhatsApp fora da plataforma não é permitido",
  },
  {
    regex: /(?:whatsapp\.com|wa\.me)\/\S+/gi,
    label: "WhatsApp",
    warning: "Compartilhar WhatsApp fora da plataforma não é permitido",
  },
  {
    regex: /(?:chat\.)?whatsapp\.com\/\S+/gi,
    label: "WhatsApp",
    warning: "Compartilhar WhatsApp fora da plataforma não é permitido",
  },
  {
    regex: /\bw(?:hats)?(?:app)?\s*\d{2,}\b/gi,
    label: "WhatsApp",
    warning: "Compartilhar WhatsApp fora da plataforma não é permitido",
  },
  {
    regex: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,
    label: "e-mail",
    warning: "Compartilhar e-mail fora da plataforma não é permitido",
  },
  {
    regex: /(?:instagram\.com|insta\.com)\/\S+/gi,
    label: "Instagram",
    warning: "Compartilhar redes sociais fora da plataforma não é permitido",
  },
  {
    regex: /(?:facebook\.com|fb\.com)\/\S+/gi,
    label: "Facebook",
    warning: "Compartilhar redes sociais fora da plataforma não é permitido",
  },
  {
    regex: /@\w{3,30}/g,
    label: "usuário de rede social",
    warning: "Compartilhar perfis de redes sociais não é permitido",
  },
  {
    regex: /\b(zap|zapzap|telegram|signal|discord|messenger|skype)\b/i,
    label: "aplicativo de mensagens",
    warning: "Compartilhar contatos de outros aplicativos não é permitido",
  },
];

const TRIGGER_PHRASES = [
  { phrase: "me liga", warning: "Combinar contato fora da plataforma não é permitido" },
  { phrase: "me chama", warning: "Combinar contato fora da plataforma não é permitido" },
  { phrase: "me add", warning: "Combinar contato fora da plataforma não é permitido" },
  { phrase: "me adiciona", warning: "Combinar contato fora da plataforma não é permitido" },
  { phrase: "passa seu", warning: "Compartilhar contato fora da plataforma não é permitido" },
  { phrase: "passa o", warning: "Compartilhar contato fora da plataforma não é permitido" },
  { phrase: "passa teu", warning: "Compartilhar contato fora da plataforma não é permitido" },
  { phrase: "manda seu", warning: "Compartilhar contato fora da plataforma não é permitido" },
  { phrase: "manda teu", warning: "Compartilhar contato fora da plataforma não é permitido" },
  { phrase: "fala seu", warning: "Compartilhar contato fora da plataforma não é permitido" },
  { phrase: "fala teu", warning: "Compartilhar contato fora da plataforma não é permitido" },
  { phrase: "numero", warning: "Compartilhar número de telefone não é permitido" },
  { phrase: "número", warning: "Compartilhar número de telefone não é permitido" },
  { phrase: "telefone", warning: "Compartilhar telefone não é permitido" },
  { phrase: "celular", warning: "Compartilhar celular não é permitido" },
  { phrase: "whats", warning: "Compartilhar WhatsApp não é permitido" },
  { phrase: "zap", warning: "Compartilhar WhatsApp não é permitido" },
  { phrase: "te ligo", warning: "Combinar contato fora da plataforma não é permitido" },
  { phrase: "te chamo", warning: "Combinar contato fora da plataforma não é permitido" },
];

export class ContactDetector {
  static MAX_VIOLATIONS = 3;
  private violations: Map<string, number> = new Map();

  check(content: string, userId: string): DetectionResult {
    const normalized = content.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
    const matches: string[] = [];
    let reason: string | undefined;
    let warning: string | undefined;

    for (const pattern of CONTACT_PATTERNS) {
      const found = content.match(pattern.regex);
      if (found) {
        matches.push(...found);
        if (!reason) reason = pattern.label;
        warning = pattern.warning;
      }
    }

    if (matches.length === 0) {
      for (const tp of TRIGGER_PHRASES) {
        if (normalized.includes(tp.phrase)) {
          warning = tp.warning;
          reason = "frase suspeita";
          matches.push(tp.phrase);
          break;
        }
      }
    }

    if (matches.length > 0) {
      const current = this.violations.get(userId) || 0;
      this.violations.set(userId, current + 1);

      const violationCount = current + 1;
      const remaining = ContactDetector.MAX_VIOLATIONS - violationCount;

      if (violationCount >= ContactDetector.MAX_VIOLATIONS) {
        return {
          blocked: true,
          reason: `Violação #${violationCount} - Contato bloqueado temporariamente`,
          matches,
          warning: `Você excedeu o limite de tentativas. Seu chat foi bloqueado temporariamente. Entre em contato com o suporte.`,
        };
      }

      return {
        blocked: true,
        reason: `${reason} detectado`,
        matches,
        warning: remaining > 0
          ? `${warning}. Você tem mais ${remaining} tentativa(s) antes do bloqueio.`
          : warning,
      };
    }

    return { blocked: false, matches: [] };
  }

  getViolationCount(userId: string): number {
    return this.violations.get(userId) || 0;
  }

  resetViolations(userId: string): void {
    this.violations.delete(userId);
  }
}

export const contactDetector = new ContactDetector();
