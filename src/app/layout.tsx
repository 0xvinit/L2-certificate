import type { Metadata } from "next";
import { Cairo, Poppins, Saira, Major_Mono_Display } from "next/font/google";
import "./globals.css";
import PrivyProvider from "../providers/PrivyProvider";
import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar/Navbar";

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

const majorMono = Major_Mono_Display({
  variable: "--font-major-mono",
  subsets: ["latin"],
  weight: "400",
});

export const metadata: Metadata = {
  title: "Patram — Decentralized Certificate Verification Platform",
  description:
    "Patram is a decentralized certificate issuance and verification platform ensuring authenticity and transparency through blockchain technology. Admins can create academic or training programs, issue blockchain-secured certificates, and allow anyone to verify authenticity via unique on-chain hashes.",
  metadataBase: new URL("https://Patram.vercel.app"),
  keywords: [
    "Patram",
    "Blockchain Certificates",
    "Decentralized Verification",
    "Digital Credentials",
    "Web3 Education",
    "L2 Blockchain",
    "Certificate Authentication",
    "Tamper-proof Certificates",
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${cairo.variable} ${majorMono.variable} ${poppins.variable} ${saira.variable} antialiased`}
      >
        <PrivyProvider>
          {/* <Navbar />
          <main className="min-h-[calc(100vh-64px)]">{children}</main>
          <Footer /> */}
          <Navbar />
          {children}
          <Footer />
        </PrivyProvider>
      </body>
    </html>
  );
}
