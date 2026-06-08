import type { Metadata, Viewport } from "next";
import { Cairo } from "next/font/google";
import "./globals.css";
import { getI18n } from "@/i18n";
import { dir } from "@/i18n/config";
import { I18nProvider } from "@/i18n/provider";
import { ServiceWorkerRegister } from "@/components/ServiceWorkerRegister";

// Cairo covers Arabic and Latin well and reads cleanly on small screens.
const cairo = Cairo({
  subsets: ["arabic", "latin"],
  variable: "--font-app",
  display: "swap",
});

export const metadata: Metadata = {
  title: { default: "Mahalli", template: "%s · Mahalli" },
  description:
    "Run your Instagram shop — products, orders, customers and a storefront.",
  manifest: "/manifest.webmanifest",
  appleWebApp: { capable: true, statusBarStyle: "default", title: "Mahalli" },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  themeColor: "#18181b",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const { locale, dict } = await getI18n();

  return (
    <html
      lang={locale}
      dir={dir(locale)}
      className={`${cairo.variable} h-full antialiased`}
    >
      <body className="min-h-full">
        <I18nProvider locale={locale} dict={dict}>
          {children}
        </I18nProvider>
        <ServiceWorkerRegister />
      </body>
    </html>
  );
}
