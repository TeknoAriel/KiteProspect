import type { Metadata } from "next";
import { Providers } from "@/components/providers";

export const metadata: Metadata = {
  title: "Kite Prospect",
  description: "Plataforma de prospección inmobiliaria asistida",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
