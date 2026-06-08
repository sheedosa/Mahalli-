import Link from "next/link";
import { getI18n } from "@/i18n";

export default async function StorefrontNotFound() {
  const { dict } = await getI18n();
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-3 p-8 text-center">
      <div className="text-4xl">🛍️</div>
      <h1 className="text-lg font-semibold text-zinc-900">
        {dict.storefront.notFoundTitle}
      </h1>
      <p className="max-w-xs text-sm text-zinc-500">
        {dict.storefront.notFoundBody}
      </p>
      <Link href="/" className="text-sm font-medium text-zinc-900 underline">
        {dict.meta.appName}
      </Link>
    </main>
  );
}
