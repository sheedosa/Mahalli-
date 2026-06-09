import Link from "next/link";
import { Compass } from "lucide-react";
import { getI18n } from "@/i18n";

// App-wide 404. Catches reserved-but-unbuilt routes (e.g. /broadcasts, a Growth
// roadmap slug with no UI yet) and any mistyped path, so nothing dead-ends on
// Next's unstyled default 404. Force the light "cream" surface for legibility.
export default async function NotFound() {
  const { dict } = await getI18n();
  const t = dict.notFound;
  return (
    <main className="theme-cream sf flex min-h-dvh flex-col items-center justify-center gap-4 p-8 text-center">
      <div className="empty-art">
        <Compass className="size-9" />
      </div>
      <div className="sf-stack" style={{ gap: 6 }}>
        <h1 style={{ margin: 0, fontSize: 20, fontWeight: 800 }}>{t.title}</h1>
        <p
          className="muted"
          style={{ margin: 0, fontSize: 14, maxWidth: 280, lineHeight: 1.6 }}
        >
          {t.body}
        </p>
      </div>
      <Link href="/" className="btn btn-primary btn-pill">
        {t.home}
      </Link>
    </main>
  );
}
