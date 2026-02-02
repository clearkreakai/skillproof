import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SkillProof - Prove What You Can Do",
  description: "Resumes show where you've been. SkillProof shows what you can do. Generate custom skills assessments based on real job requirements.",
  keywords: ["skills assessment", "job application", "hiring", "career", "job seekers"],
  openGraph: {
    title: "SkillProof - Prove What You Can Do",
    description: "Resumes show where you've been. SkillProof shows what you can do.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "SkillProof - Prove What You Can Do",
    description: "Resumes show where you've been. SkillProof shows what you can do.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
