import type { Metadata } from "next";
import "./globals.css";
import "./hero-motion.css";

export const metadata: Metadata = {
  title: "Fransition — Étudier en France depuis la Tunisie",
  description: "Un accompagnement rassurant pour les étudiants tunisiens qui préparent leur parcours d’études en France.",
  icons: {
    icon: [
      {
        url: "/fransition-logo.png",
        type: "image/png",
        sizes: "1080x1080",
      },
    ],
    shortcut: "/fransition-logo.png",
    apple: "/fransition-logo.png",
  },
  themeColor: "#202f64",
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
