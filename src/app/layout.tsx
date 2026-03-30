import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Social Work English Test | Professional Vocabulary Assessment",
  description: "Test your knowledge of English specialized vocabulary in Social Work. 30-minute timed assessment covering School Social Work and Disability Practice.",
  keywords: "social work, english test, professional vocabulary, school social work, disability",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
