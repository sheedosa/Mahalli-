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
    "Run your shop from your phone — products, orders, customers and a shop link.",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: [{ url: "/brand/icon.svg", type: "image/svg+xml" }],
    apple: [{ url: "/brand/icon.svg" }],
  },
  appleWebApp: { capable: true, statusBarStyle: "default", title: "Mahalli" },
  formatDetection: { telephone: false },
  // og:image comes from the opengraph-image.tsx file conventions (generated
  // at the edge via next/og) — no static binary asset to keep in sync.
  openGraph: {
    type: "website",
    siteName: "Mahalli",
    title: "Mahalli — Run your shop from your phone",
    description:
      "Run your shop from your phone: products, orders, customers and a shop link.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Mahalli — Run your shop from your phone",
    description:
      "Run your shop from your phone: products, orders, customers and a shop link.",
  },
};

export const viewport: Viewport = {
  themeColor: "#2f9e5e",
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
