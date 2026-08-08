import type { Metadata } from "next";
import { Plus_Jakarta_Sans, IBM_Plex_Mono } from "next/font/google";
import localFont from "next/font/local";
import "./globals.css";
import { FormModalProvider } from "../components/FormModalContext";
import ConsultationForm from "@/components/Form";
import MetaPixel from "@/components/MetaPixel";
import HeadTagManager from "@/components/HeadTagManger";
import BodyTagManager from "@/components/BodyTagManager";
import WhatsAppButton from "@/components/Whatsappbutton";

const satoshi = localFont({
  src: [
    { path: "./fonts/Satoshi-Light.woff2", weight: "300", style: "normal" },
    { path: "./fonts/Satoshi-Regular.woff2", weight: "400", style: "normal" },
    { path: "./fonts/Satoshi-Medium.woff2", weight: "500", style: "normal" },
    { path: "./fonts/Satoshi-Bold.woff2", weight: "700", style: "normal" },
    { path: "./fonts/Satoshi-Black.woff2", weight: "900", style: "normal" },
    { path: "./fonts/Satoshi-Italic.woff2", weight: "400", style: "italic" },
  ],
  variable: "--font-display",
  display: "swap",
});

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-body",
  weight: ["400", "500", "600", "700", "800"],
});

const plexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  title: "Custom LMS Development | Build Your Learning Platform",
  description:
    "We build fully customized Learning Management Systems designed around the way your business actually works.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <HeadTagManager />
      </head>
      <body
        className={`${satoshi.variable} ${jakarta.variable} ${plexMono.variable} font-body bg-ink antialiased`}
      > <BodyTagManager />
        <MetaPixel />
        <FormModalProvider>
          {children}
          <ConsultationForm />
          <WhatsAppButton />
        </FormModalProvider>
      </body>
    </html>
  );
}