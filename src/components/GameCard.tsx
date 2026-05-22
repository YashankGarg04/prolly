"use client";

import { useWallet } from "@/contexts/WalletContext";

export default function GameCard({ game }: { game: any }) {
  const { accountId, selector } = useWallet();

  const handleJoin = async () => {
    if (!selector) return;
    const wallet = await selector.wallet();
    
    // Logic: (Entry Fee * 1) + Processing Fee (Assuming multiplier 1 for now)
    const entry = BigInt(game.entry_fee);
    const processing = BigInt(game.processing_fee);
    const total = (entry + processing).toString();

    await wallet.signAndSendTransaction({
      receiverId: process.env.NEXT_PUBLIC_CONTRACT_ID as string,
      actions: [{
        type: "FunctionCall",
        params: {
          methodName: "join_game",
          args: { game_id: game.id, multiplier: 1 },
          gas: "300000000000000",
          deposit: total
        }
      } as any]
    });
  };

  return (
    <div className="bg-white/[0.03] border border-white/10 p-8 rounded-[2rem] hover:bg-white/[0.06] transition shadow-2xl relative group">
      <div className="absolute top-0 right-8 w-px h-full bg-gradient-to-b from-transparent via-blue-500/20 to-transparent"></div>
      <h4 className="text-xl font-bold text-white mb-6 font-mono tracking-tight uppercase">Game ID: {game.id}</h4>
      
      <div className="space-y-4 mb-8">
        <div className="flex justify-between items-center">
          <span className="text-[10px] text-gray-500 font-bold tracking-widest">ODDS</span>
          <span className="text-white font-mono text-sm">1 IN {game.n_variable}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-[10px] text-blue-400 font-bold tracking-widest">REWARD</span>
          <span className="text-blue-400 font-mono text-sm">{game.max_multiplier}X MAX</span>
        </div>
      </div>

      <button onClick={handleJoin} className="w-full py-4 bg-white/5 hover:bg-white text-white hover:text-black font-black rounded-xl border border-white/10 transition duration-300">
        Launch Entry
      </button>
    </div>
  );
}