// wa.me deep-link builder — the zero-setup channel (the seller taps to message a
// buyer). Pure; used by the UI and recorded by the notify handler.
export function waMeLink(phone: string, text?: string): string {
  const digits = (phone || "").replace(/\D/g, "");
  const q = text ? `?text=${encodeURIComponent(text)}` : "";
  return `https://wa.me/${digits}${q}`;
}
