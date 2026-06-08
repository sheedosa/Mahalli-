import { getI18n } from "@/i18n";

export default async function OfflinePage() {
  const { dict } = await getI18n();
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-3 p-8 text-center">
      <div className="text-4xl">📡</div>
      <h1 className="text-lg font-semibold text-zinc-900">
        {dict.meta.appName}
      </h1>
      <p className="max-w-xs text-sm text-zinc-500">{dict.common.genericError}</p>
    </main>
  );
}
