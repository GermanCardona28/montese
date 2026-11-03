import type { Metadata, Viewport } from "next";
import "./globals.css";
import BottomNav, { TopBar } from "@/components/BottomNav";

export const metadata: Metadata = {
  title: "Móntese — el bus que te lleva",
  description: "Rutas, tiempos y tarifas del transporte público en el área metropolitana de Bucaramanga",
};

export const viewport: Viewport = {
  themeColor: "#191919",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className="h-full">
      <body className="flex min-h-full flex-col">
        <TopBar />
        <div className="flex flex-1 flex-col">{children}</div>
        <BottomNav />
      </body>
    </html>
  );
}
