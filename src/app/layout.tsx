import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./global.css";
import { WalletSelectorContextProvider } from "@/contexts/WalletContext";
import Navbar from "@/components/Navbar";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Prolly - Provably Fair Games",
  description: "Web3 Prediction Market on NEAR",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-black text-white antialiased`}>
        <WalletSelectorContextProvider>
          <Navbar />
          {children}
        </WalletSelectorContextProvider>
      </body>
    </html>
  );
}