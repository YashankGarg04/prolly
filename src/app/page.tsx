"use client";

import { useRouter } from "next/navigation";
import { useWallet } from "@/contexts/WalletContext";

export default function HomePage() {
  const { accountId, signIn } = useWallet();
  const router = useRouter();

  const handleJoin = () => {
    if (!accountId) {
      signIn();
    } else {
      router.push("/games");
    }
  };

  return (
    <main className="relative flex flex-col items-center justify-center min-h-screen bg-[#06080D] overflow-hidden">
      {/* Nexus-Style Grid Background */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:40px_40px]"></div>
      
      {/* Central Blue Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-600/10 rounded-full blur-[100px] pointer-events-none"></div>

      <div className="relative z-10 flex flex-col items-center text-center px-4 max-w-3xl">
        {/* Hexagon Icon */}
        <div className="mb-8 relative flex items-center justify-center">
          <svg className="w-16 h-16 text-blue-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
          </svg>
          <div className="absolute w-2 h-2 bg-white rounded-full shadow-[0_0_10px_white]"></div>
        </div>

        {/* Live Badge */}
        <div className="mb-6 px-4 py-1.5 rounded-full border border-blue-500/30 bg-blue-500/10 text-blue-400 text-xs font-bold tracking-widest uppercase flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse"></span>
          Testnet Beta Live
        </div>

        {/* Typography */}
        <h1 className="text-6xl md:text-8xl font-black tracking-tighter text-white mb-6">
          Prolly<span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-blue-600">.net</span>
        </h1>
        <p className="text-lg md:text-xl text-gray-400 mb-12 max-w-2xl font-medium leading-relaxed">
          The abstraction layer for decentralized probability. Execute complex mathematical interactions effortlessly on-chain.
        </p>
        
        {/* Call to Action */}
        <button 
          onClick={handleJoin}
          className="group flex items-center gap-2 px-8 py-4 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl transition-all shadow-[0_0_30px_rgba(37,99,235,0.4)] hover:shadow-[0_0_50px_rgba(37,99,235,0.6)]"
        >
          <span>Launch Terminal</span>
          <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
          </svg>
        </button>
      </div>
    </main>
  );
}