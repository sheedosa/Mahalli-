import Link from "next/link";
import { LocaleSwitcher } from "@/components/LocaleSwitcher";
import { Wordmark } from "@/components/brand/Wordmark";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="theme-mahalli sf">
      <div className="mx-auto flex min-h-dvh max-w-md flex-col" style={{ padding: "18px 20px 32px" }}>
        <header className="sf-row sf-between">
          <Link href="/" style={{ textDecoration: "none" }} aria-label="Mahalli">
            <Wordmark />
          </Link>
          <LocaleSwitcher />
        </header>
        <main className="flex flex-1 flex-col justify-center">{children}</main>
      </div>
    </div>
  );
}
