import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css"; // וודא שיש לך קובץ css כזה, בד"כ זה בא ברירת מחדל

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "מערכת שליחים",
  description: "ניהול שליחויות ופעילויות",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="he" dir="rtl">
      <body className={inter.className}>
        {children}
      </body>
    </html>
  );
}