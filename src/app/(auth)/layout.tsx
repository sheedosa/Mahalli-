import Link from "next/link";
import { getI18n } from "@/i18n";
import { LocaleSwitcher } from "@/components/LocaleSwitcher";

export default async function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { dict } = await getI18n();
  return (
    <div className="mx-auto flex min-h-dvh max-w-md flex-col px-5 pb-10 pt-5">
      <header className="flex items-center justify-between">
        <Link href="/" className="text-lg font-bold text-zinc-900">
          {dict.meta.appName}
        </Link>
        <LocaleSwitcher />
      </header>
      <main className="flex flex-1 flex-col justify-center">{children}</main>
    </div>
  );
}
