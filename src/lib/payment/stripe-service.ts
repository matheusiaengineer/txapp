import Stripe from "stripe";

let stripeClient: Stripe | null = null;

function getStripe(): Stripe {
  if (!stripeClient) {
    const secretKey = process.env.STRIPE_SECRET_KEY;
    if (!secretKey) {
      throw new Error("Stripe secret key not configured");
    }
    stripeClient = new Stripe(secretKey, {
      apiVersion: "2025-03-31.basil" as any,
      typescript: true,
    });
  }
  return stripeClient;
}

export class StripeService {
  async createPaymentIntent(amount: number, currency: string, metadata?: Record<string, string>) {
    const pi = await getStripe().paymentIntents.create({
      amount: Math.round(amount * 100),
      currency: currency.toLowerCase(),
      payment_method_types: ["card"],
      metadata: metadata || {},
    });
    return { id: pi.id, clientSecret: pi.client_secret, amount, currency };
  }

  async createPixPayment(amount: number, description: string) {
    const pi = await getStripe().paymentIntents.create({
      amount: Math.round(amount * 100),
      currency: "brl",
      payment_method_types: ["pix"],
      metadata: { description },
    });
    return {
      id: pi.id,
      qrCode: pi.next_action?.pix_display_qr_code?.data || null,
      qrCodeUrl: pi.next_action?.pix_display_qr_code?.image_url_png || null,
      amount,
      expiresAt: new Date(Date.now() + 3600000).toISOString(),
    };
  }

  async createCheckoutSession(items: { name: string; amount: number; quantity: number }[], currency: string, successUrl: string, cancelUrl: string) {
    const session = await getStripe().checkout.sessions.create({
      line_items: items.map((item) => ({
        price_data: {
          currency: currency.toLowerCase(),
          product_data: { name: item.name },
          unit_amount: Math.round(item.amount * 100),
        },
        quantity: item.quantity,
      })),
      mode: "payment",
      success_url: successUrl,
      cancel_url: cancelUrl,
    });
    return { id: session.id, url: session.url || successUrl };
  }

  async verifyWebhook(signature: string, body: string): Promise<{ type: string; data: any } | null> {
    try {
      const event = getStripe().webhooks.constructEvent(body, signature, process.env.STRIPE_WEBHOOK_SECRET || "");
      return { type: event.type, data: event.data.object };
    } catch {
      return null;
    }
  }

  async createConnectAccount(email: string, country: string) {
    const account = await getStripe().accounts.create({
      type: "express",
      country,
      email,
      capabilities: {
        transfers: { requested: true },
      },
    });
    return { id: account.id, email, country, status: "pending" };
  }

  async createTransfer(destinationId: string, amount: number, currency: string) {
    const transfer = await getStripe().transfers.create({
      amount: Math.round(amount * 100),
      currency: currency.toLowerCase(),
      destination: destinationId,
    });
    return { id: transfer.id, amount, currency, status: "completed" };
  }
}

export const stripeService = new StripeService();
