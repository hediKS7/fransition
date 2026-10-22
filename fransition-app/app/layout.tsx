import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Fransition — Étudier en France depuis la Tunisie",
  description: "Un accompagnement rassurant pour les étudiants tunisiens qui préparent leur parcours d’études en France.",
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
    <html lang="fr">
      <body className="antialiased">{children}</body>
    </html>
  );
}
