import type { Metadata, Viewport } from "next";
import { Geist } from "next/font/google";
import ChaoWidgetLoader from "@/components/chao-widget-loader";
import SerwistRegister from "@/components/serwist-register";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Mibegnon, Bourses et universités pour les élèves ivoiriens",
  description:
    "Trouve des bourses et des universités dans le monde entier. Gratuit pour tous les élèves de Côte d'Ivoire.",
  appleWebApp: {
    capable: true,
    title: "Mibegnon",
    statusBarStyle: "default",
  },
};

export const viewport: Viewport = {
  themeColor: "#1B1D42",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <head>
        <link
          rel="preconnect"
          href="https://pofsfuydfwvctkgmiios.supabase.co"
          crossOrigin=""
        />
        <link
          rel="dns-prefetch"
          href="https://pofsfuydfwvctkgmiios.supabase.co"
        />
      </head>
      <body
        className={`${geistSans.variable} antialiased`}
        suppressHydrationWarning
      >
        {children}
        <ChaoWidgetLoader />
        <SerwistRegister />
      </body>
    </html>
  );
}
