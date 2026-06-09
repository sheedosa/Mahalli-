import "server-only";

export type OutboundMessage = { toPhone: string; body: string };
export type SendResult = {
  status: "sent" | "skipped" | "failed";
  channel: string; // wa_link | wa_cloud | sms
  providerMsgId?: string;
  error?: string;
};

/**
 * Send a buyer message. Uses WhatsApp Cloud when credentials are configured;
 * otherwise records it as `skipped` on the wa_link channel (P1a default — the
 * seller can still reach the buyer via a wa.me link). Never throws on missing
 * config; returns `failed` only on a real provider error so the job retries.
 * P1b adds SMS + per-seller `seller_connections` to pick the channel.
 */
export async function sendMessage(msg: OutboundMessage): Promise<SendResult> {
  const token = process.env.WHATSAPP_CLOUD_TOKEN;
  const phoneId = process.env.WHATSAPP_PHONE_ID;
  if (!token || !phoneId) {
    return { status: "skipped", channel: "wa_link" };
  }

  try {
    const to = msg.toPhone.replace(/\D/g, "");
    const res = await fetch(`https://graph.facebook.com/v21.0/${phoneId}/messages`, {
      method: "POST",
      headers: { authorization: `Bearer ${token}`, "content-type": "application/json" },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to,
        type: "text",
        text: { body: msg.body },
      }),
    });
    if (!res.ok) {
      return { status: "failed", channel: "wa_cloud", error: `whatsapp ${res.status}` };
    }
    const data = (await res.json()) as { messages?: { id?: string }[] };
    return { status: "sent", channel: "wa_cloud", providerMsgId: data.messages?.[0]?.id };
  } catch (err) {
    return {
      status: "failed",
      channel: "wa_cloud",
      error: err instanceof Error ? err.message : "send failed",
    };
  }
}
