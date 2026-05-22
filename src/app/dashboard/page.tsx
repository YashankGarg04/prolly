"use client";

import { useWallet } from "@/contexts/WalletContext";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

/**
 * Utility to convert NEAR to yoctoNEAR (10^24) without external library dependencies
 * to avoid version conflicts with near-api-js v4.
 */
const parseNearAmount = (amount: string) => {
  if (!amount) return "0";
  const [whole, fraction = ""] = amount.split(".");
  const fractionPadded = fraction.padEnd(24, "0").slice(0, 24);
  return `${whole}${fractionPadded}`.replace(/^0+/, "") || "0";
};

export default function Dashboard() {
  const { accountId, selector } = useWallet();
  const router = useRouter();
  
  // Dynamically pull the contract ID from environment variables
  const CONTRACT_ID = process.env.NEXT_PUBLIC_CONTRACT_ID as string;

  // Form State matching lib.rs structure
  const [form, setForm] = useState({
    name: "",
    description: "",
    entryFee: "",
    processingFee: "0.01",
    nVariable: "10",
    maxMultiplier: "3"
  });
  
  const [isDeploying, setIsDeploying] = useState(false);

  // Security: Only allow the contract owner to access this page
  useEffect(() => {
    if (accountId && accountId !== CONTRACT_ID) {
      router.push("/");
    }
  }, [accountId, router, CONTRACT_ID]);

  const handleDeploy = async () => {
    if (!selector || !accountId) return;
    
    try {
      setIsDeploying(true);
      const wallet = await selector.wallet();
      
      // Convert standard NEAR to yoctoNEAR format for the contract
      const entryFeeYocto = parseNearAmount(form.entryFee);
      const processingFeeYocto = parseNearAmount(form.processingFee);

      // Trigger the blockchain transaction using exact Rust parameter names
      await wallet.signAndSendTransaction({
        signerId: accountId,
        receiverId: CONTRACT_ID,
        actions: [
          {
            type: "FunctionCall",
            params: {
              methodName: "create_game", 
              args: {
                entry_fee_yocto: entryFeeYocto,
                processing_fee_yocto: processingFeeYocto,
                n_variable: parseInt(form.nVariable),
                max_multiplier: parseInt(form.maxMultiplier)
              },
              gas: "300000000000000", // 300 TGas
              deposit: "100000000000000000000000", // 0.1 NEAR for storage deposit
            },
          } as any // Use 'as any' to bypass type conflicts in near-api-js v4
        ],
      });
      
      console.log("Deployment initiated for:", form.name);

    } catch (error) {
      console.error("Deployment failed:", error);
    } finally {
      setIsDeploying(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#06080D] pt-32 px-10 relative overflow-hidden">
      {/* Nexus-Style Aesthetic Elements */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:40px_40px]"></div>
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-blue-600/5 rounded-full blur-[120px] pointer-events-none"></div>
      
      <div className="max-w-3xl mx-auto relative z-10">
        <header className="mb-12">
          <div className="flex items-center gap-2 mb-4">
            <span className="px-3 py-1 rounded-md bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[10px] font-bold uppercase tracking-widest">
              Admin Terminal
            </span>
          </div>
          <h2 className="text-5xl font-black text-white tracking-tighter">Initialize Prolly</h2>
          <p className="text-gray-400 mt-2 font-medium">Configure mathematical parameters for the next probability pool.</p>
        </header>
        
        <div className="bg-[#0B0E14]/80 backdrop-blur-2xl border border-white/5 p-10 rounded-[2.5rem] shadow-2xl">
          <div className="grid gap-8">
            {/* Row 1: Basic Info */}
            <div className="grid md:grid-cols-2 gap-8">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Pool Identifier</label>
                <input 
                  value={form.name} 
                  onChange={(e) => setForm({...form, name: e.target.value})} 
                  type="text" 
                  className="w-full p-4 bg-black/40 border border-white/10 rounded-2xl outline-none focus:border-blue-500 text-white transition placeholder:text-gray-700" 
                  placeholder="Nexus Alpha" 
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-blue-500 uppercase tracking-widest">Entry Fee (NEAR)</label>
                <input 
                  value={form.entryFee} 
                  onChange={(e) => setForm({...form, entryFee: e.target.value})} 
                  type="number" 
                  className="w-full p-4 bg-black/40 border border-white/10 rounded-2xl outline-none focus:border-blue-500 text-white transition font-mono" 
                  placeholder="1.0" 
                />
              </div>
            </div>

            {/* Row 2: Description */}
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Operational Metadata</label>
              <textarea 
                value={form.description} 
                onChange={(e) => setForm({...form, description: e.target.value})} 
                className="w-full p-4 bg-black/40 border border-white/10 rounded-2xl outline-none focus:border-blue-500 text-white transition min-h-[100px] placeholder:text-gray-700" 
                placeholder="Details for off-chain indexing..." 
              />
            </div>

            {/* Row 3: Math Parameters */}
            <div className="grid md:grid-cols-3 gap-8">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Processing Fee</label>
                <input 
                  value={form.processingFee} 
                  onChange={(e) => setForm({...form, processingFee: e.target.value})} 
                  type="number" 
                  className="w-full p-4 bg-black/40 border border-white/10 rounded-2xl outline-none focus:border-blue-500 text-white transition font-mono" 
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">N-Variable</label>
                <input 
                  value={form.nVariable} 
                  onChange={(e) => setForm({...form, nVariable: e.target.value})} 
                  type="number" 
                  className="w-full p-4 bg-black/40 border border-white/10 rounded-2xl outline-none focus:border-blue-500 text-white transition font-mono" 
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Max Multiplier</label>
                <input 
                  value={form.maxMultiplier} 
                  onChange={(e) => setForm({...form, maxMultiplier: e.target.value})} 
                  type="number" 
                  className="w-full p-4 bg-black/40 border border-white/10 rounded-2xl outline-none focus:border-blue-500 text-white transition font-mono" 
                />
              </div>
            </div>

            {/* Deployment Action */}
            <button 
              onClick={handleDeploy}
              disabled={isDeploying || !form.entryFee}
              className="mt-4 w-full py-5 bg-blue-600 hover:bg-blue-500 text-white font-black rounded-2xl transition-all shadow-[0_0_30px_rgba(37,99,235,0.3)] hover:shadow-[0_0_50px_rgba(37,99,235,0.5)] disabled:opacity-50 disabled:cursor-not-allowed transform hover:-translate-y-1 active:translate-y-0"
            >
              {isDeploying ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Awaiting Blockchain Confirmation...
                </span>
              ) : (
                "Execute On-Chain Deployment"
              )}
            </button>
          </div>
        </div>
        
        <footer className="mt-8 text-center">
          <p className="text-[10px] text-gray-600 font-bold uppercase tracking-[0.2em]">
            Connected as: {CONTRACT_ID}
          </p>
        </footer>
      </div>
    </div>
  );
}