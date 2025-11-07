import type { Metadata } from "next";
import {  Cairo, Poppins, Saira } from "next/font/google";
import "./globals.css";
import PrivyProvider from "../providers/PrivyProvider";
import { Providers } from "../providers/AlchemyWallet";
import { cookieToInitialState } from "@account-kit/core";
import { config } from "../../config.ts";
import { headers } from "next/headers";


const saira = Saira({
  variable: "--font-saira",
  subsets: ["latin"],
});

const cairo = Cairo({
  variable: "--font-cairo",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"], 
});

export const metadata: Metadata = {
  title: {
    default: "UniCerti — Digital University Certificates",
    template: "%s — UniCerti",
  },
  description:
    "Issue, verify, and manage tamper-proof digital certificates for universities and institutions.",
  metadataBase: new URL("https://unlicerti.example.com"),
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const headersList = await headers();
  const initialState = cookieToInitialState(
    config,
    headersList.get("cookie") ?? undefined,
  );
  return (
    <html lang="en">
      <body className={`${cairo.variable} ${poppins.variable} ${saira.variable} antialiased`}>
      <Providers initialState={initialState}>{children}</Providers>
      </body>
    </html>
  );
}
