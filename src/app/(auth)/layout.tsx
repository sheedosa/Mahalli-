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
    <div className="theme-cream sf">
      <div className="mx-auto flex min-h-dvh max-w-md flex-col" style={{ padding: "18px 20px 32px" }}>
        <header className="sf-row sf-between">
          <Link href="/" style={{ fontSize: 22, fontWeight: 900, color: "var(--ink)", textDecoration: "none" }}>
            {dict.meta.appName}
          </Link>
          <LocaleSwitcher />
        </header>
        <main className="flex flex-1 flex-col justify-center">{children}</main>
      </div>
    </div>
  );
}
