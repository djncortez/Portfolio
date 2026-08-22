import type { Metadata } from "next";
import { Figtree } from "next/font/google";
import "./globals.css";

// Figtree substitutes for Mori — humanist warmth, not a geometric grotesk.
// The reference forbids Inter/Roboto/system defaults here.
const figtree = Figtree({ subsets: ["latin"], weight: ["300", "400", "600"], display: "swap" });

const SITE = "https://djncortez.netlify.app";

export const metadata: Metadata = {
  metadataBase: new URL(SITE),
  title: "David Joseph Cortez",
  description:
    "Portfolio of David Joseph Cortez, a Computer Science graduate specializing in data science, analytics, and software development.",
  alternates: { canonical: "/" },
  openGraph: {
    title: "David Joseph Cortez | Portfolio",
    description:
      "Computer Science graduate specializing in data science, analytics, and software development.",
    url: SITE,
    type: "website",
    images: [{ url: "/assets/og-card.jpg", width: 1200, height: 630,
               alt: "David Joseph Cortez — Data Science & Analytics" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "David Joseph Cortez | Portfolio",
    description:
      "Computer Science graduate specializing in data science, analytics, and software development.",
    images: ["/assets/og-card.jpg"],
  },
  icons: {
    icon: [{ url: "/assets/logo/favicon.svg", type: "image/svg+xml" }],
    apple: "/assets/logo/apple-touch-icon.png",
  },
};

export const viewport = { themeColor: "#0e100f" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={figtree.className}>
      <body>{children}</body>
    </html>
  );
}
