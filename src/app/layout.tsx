import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "SkillProof - Prove What You Can Do",
  description: "Resumes show where you've been. SkillProof shows what you can do. Generate custom skills assessments based on real job requirements and stand out from the crowd.",
  keywords: ["skills assessment", "job application", "hiring", "career", "job seekers", "prove your skills", "interview prep", "career change"],
  authors: [{ name: "ClearKreak" }],
  creator: "ClearKreak",
  publisher: "SkillProof",
  metadataBase: new URL("https://skillproof.io"),
  openGraph: {
    title: "SkillProof - Prove What You Can Do",
    description: "Resumes show where you've been. SkillProof shows what you can do. Generate custom skills assessments based on real job requirements.",
    url: "https://skillproof.io",
    siteName: "SkillProof",
    type: "website",
    locale: "en_US",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "SkillProof - Prove What You Can Do",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "SkillProof - Prove What You Can Do",
    description: "Resumes show where you've been. SkillProof shows what you can do.",
    images: ["/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon-16x16.png",
    apple: "/apple-touch-icon.png",
  },
  manifest: "/site.webmanifest",
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0f172a" },
  ],
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`scroll-smooth ${inter.variable}`}>
      <body className={`${inter.className} antialiased min-h-screen bg-white dark:bg-slate-950 text-gray-900 dark:text-gray-100`}>
        {children}
      </body>
    </html>
  );
}
