import type { Metadata } from "next";
import { Plus_Jakarta_Sans, Noto_Sans, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const plusJakarta = Plus_Jakarta_Sans({
  variable: "--font-headline",
  subsets: ["latin"],
  weight: ["600", "700", "800"],
});

const notoSans = Noto_Sans({
  variable: "--font-body",
  subsets: ["latin", "devanagari"],
  weight: ["400", "500", "600", "700"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: ["500"],
});

export const metadata: Metadata = {
  title: "भगवती किसान मार्ट | Maa Bhagwati Kisan Seva Kendra",
  description: "केंद्रीय कीटनाशक बोर्ड (CIB&RC) द्वारा मान्यता प्राप्त प्राधिकृत कृषि रक्षा केंद्र। 100% शुद्ध खाद, बीज व कीटनाशक।",
};

import { Providers } from "../components/Providers";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="hi"
      className={`${plusJakarta.variable} ${notoSans.variable} ${jetbrainsMono.variable} h-full antialiased`}
    >
      <head>
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200"
        />
      </head>
      <body className="min-h-full flex flex-col bg-surface text-on-surface">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
