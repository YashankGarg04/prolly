"use client";

import { useEffect, useState } from "react";
import GameCard from "@/components/GameCard";

export default function GamesPage() {
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchGames = async () => {
      try {
        // Direct POST request to the NEAR RPC (No library needed!)
        const response = await fetch("https://rpc.testnet.near.org", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            jsonrpc: "2.0",
            id: "prolly-req",
            method: "query",
            params: {
              request_type: "call_function",
              finality: "optimistic",
              account_id: process.env.NEXT_PUBLIC_CONTRACT_ID as string,
              method_name: "get_games",
              args_base64: btoa(JSON.stringify({ from_index: 0, limit: 20 }))
            }
          })
        });

        const { result } = await response.json();
        
        // Decode the byte array returned by the blockchain
        if (result && result.result) {
          const decodedString = new TextDecoder().decode(new Uint8Array(result.result));
          setGames(JSON.parse(decodedString));
        }
      } catch (e) { 
        console.error("Failed to fetch games:", e); 
      } finally { 
        setLoading(false); 
      }
    };
    
    fetchGames();
  }, []);

  return (
    <div className="min-h-screen bg-[#06080D] pt-32 px-10">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-5xl font-black text-white mb-12 tracking-tighter">Active Terminal</h2>
        {loading ? (
           <div className="h-40 flex items-center justify-center text-blue-500 font-mono animate-pulse">Scanning Blockchain...</div>
        ) : games.length === 0 ? (
           <div className="text-center py-20 bg-white/5 backdrop-blur-md rounded-3xl border border-white/10 text-white font-mono">No active pools detected on-chain.</div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {games.map((g: any) => <GameCard key="{g.id}" game="{g}"/>)}
          </div>
        )}
      </div>
    </div>
  );
}