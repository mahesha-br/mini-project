import { ClerkProvider } from "@clerk/nextjs";
import { shadcn } from "@clerk/ui/themes";
import type { Metadata } from "next";
import { Geist, Geist_Mono, Noto_Sans, Playfair_Display } from "next/font/google";
import Image from "next/image";
import Link from "next/link";
import "./globals.css";
import { cn } from "@/lib/utils";
import Provider from "./provider";
import { Toaster } from "@/components/ui/toaster";

const playfairDisplayHeading = Playfair_Display({ subsets: ['latin'], variable: '--font-heading' });

const notoSans = Noto_Sans({ subsets: ['latin'], variable: '--font-sans' });

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "OnlineAI Learning Platform",
  description: "Generate, edit, and explore AI-powered learning content.",
  icons: {
    icon: [
      {
        url: "/ai_learning_logo_only.svg",
        sizes: "any",
        type: "image/svg+xml",
      },
      {
        url: "/ai_learning_logo_only.svg",
        sizes: "192x192",
        type: "image/svg+xml",
      },
      {
        url: "/ai_learning_logo_only.svg",
        sizes: "512x512",
        type: "image/svg+xml",
      },
    ],
    shortcut: "/ai_learning_logo_only.svg",
    apple: [
      {
        url: "/ai_learning_logo_only.svg",
        sizes: "180x180",
        type: "image/svg+xml",
      },
    ],
  },
  openGraph: {
    title: "OnlineAI Learning Platform",
    description: "Generate, edit, and explore AI-powered learning content.",
    images: [
      {
        url: "/ai_learning_logo_only.svg",
        width: 1600,
        height: 1600,
        alt: "OnlineAI Learning Platform Logo",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "OnlineAI Learning Platform",
    description: "Generate, edit, and explore AI-powered learning content.",
    images: ["/ai_learning_logo_only.svg"],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider appearance={{ theme: shadcn }}>
      <html
        lang="en"
        className={cn("h-full", "antialiased", geistSans.variable, geistMono.variable, "font-sans", notoSans.variable, playfairDisplayHeading.variable)}
      >
        <body className="min-h-full flex flex-col">
          <Provider>
            {children}
            <Toaster />
          </Provider>
        </body>
      </html>
    </ClerkProvider>
  );
}