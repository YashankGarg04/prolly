"use client";

import Link from "next/link";
import { useWallet } from "@/contexts/WalletContext";

export default function Navbar() {
  const { accountId, signIn, signOut } = useWallet();
  const CONTRACT_ID = process.env.NEXT_PUBLIC_CONTRACT_ID as string;

  return (
    <nav className="absolute top-0 left-0 w-full z-50 flex justify-between items-center px-8 py-6 bg-transparent">
      <Link href="/" className="flex items-center gap-2 group">
        <div className="w-8 h-8 rounded bg-blue-600 flex items-center justify-center group-hover:bg-blue-500 transition">
          <span className="text-white font-black text-xs">P.</span>
        </div>
        <span className="text-xl font-bold text-white tracking-wide">Prolly</span>
      </Link>

      <div className="flex items-center gap-4">
        {accountId === CONTRACT_ID && (
          <Link href="/dashboard" className="px-4 py-2 text-sm font-medium text-gray-300 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg transition">
            Admin Controls
          </Link>
        )}

        {accountId ? (
          <div className="flex items-center gap-3 bg-[#5A4BFF] hover:bg-[#6b5eff] border border-[#7a6fff] px-4 py-2 rounded-lg cursor-pointer transition shadow-[0_0_15px_rgba(90,75,255,0.3)]">
            <div className="w-2 h-2 rounded-full bg-white animate-pulse"></div>
            <span className="text-sm font-semibold text-white">
              {accountId.length > 14 ? `${accountId.substring(0, 6)}...${accountId.slice(-4)}` : accountId}
            </span>
            <button onClick={signOut} className="ml-2 text-xs text-white/70 hover:text-white">
              ✕
            </button>
          </div>
        ) : (
          <button 
            onClick={signIn}
            className="px-6 py-2.5 bg-[#5A4BFF] hover:bg-[#6b5eff] text-white rounded-lg text-sm font-bold transition shadow-[0_0_15px_rgba(90,75,255,0.3)]"
          >
            Connect Wallet
          </button>
        )}
      </div>
    </nav>
  );
}