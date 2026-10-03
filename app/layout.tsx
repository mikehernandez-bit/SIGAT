import type { Metadata } from "next";
import "./globals.css";
import "./portal.css";

export const metadata: Metadata = {
  metadataBase: new URL(
    "https://uns-tramites-pasantia-2026.anghelinaosa123.chatgpt.site",
  ),
  title: "SIGET-UNS · Gestión de trámites",
  description:
    "FUT digital y seguimiento de solicitudes académicas y administrativas. Proyecto de pasantía 2026 para la Universidad Nacional del Santa.",
  other: {
    "codex-preview": "development",
  },
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className="antialiased">{children}</body>
    </html>
  );
}
