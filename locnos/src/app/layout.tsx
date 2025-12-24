import type { Metadata } from "next";
import "./globals.css";
import { ToastProvider } from "@/hooks/use-toast";
import ToastContainer from "@/components/ui/toast-container";

export const metadata: Metadata = {
  title: "Locnos - Sistema de Gestão Logística",
  description: 'Sistema de Gestão de Locação e Logística',
  manifest: '/manifest.json',
  themeColor: '#2563eb',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Locnos Driver'
  },
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
    userScalable: false // Prevent zooming on inputs in mobile
  }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body>
        <ToastProvider>
          {children}
          <ToastContainer />
        </ToastProvider>
      </body>
    </html>
  );
}
