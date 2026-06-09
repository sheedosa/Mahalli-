import Link from "next/link";
import { getI18n } from "@/i18n";

export default async function OfflinePage() {
  const { dict } = await getI18n();
  return (
    <main className="theme-mahalli sf flex min-h-dvh flex-col items-center justify-center gap-4 p-8 text-center">
      <div className="text-4xl">📡</div>
      <div className="sf-stack" style={{ gap: 6 }}>
        <h1 style={{ margin: 0, fontSize: 19, fontWeight: 800 }}>{dict.meta.appName}</h1>
        <p className="muted" style={{ margin: 0, fontSize: 14, lineHeight: 1.6, maxWidth: 280 }}>
          {dict.common.genericError}
        </p>
      </div>
      <Link href="/" className="btn btn-primary btn-pill" style={{ width: "auto", paddingInline: 26 }}>
        {dict.common.retry}
      </Link>
    </main>
  );
}
