import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "NeurEscape — Escape Room Digital para Neurociencias",
  description:
    "Juego serio de drag & drop para la enseñanza de funciones cognitivas cerebrales con Learning Analytics integrado.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
