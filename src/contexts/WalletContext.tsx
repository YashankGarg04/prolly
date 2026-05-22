"use client";

import React, { useCallback, useContext, useEffect, useState, ReactNode } from "react";
import { setupWalletSelector, WalletSelector } from "@near-wallet-selector/core";
import { setupModal, WalletSelectorModal } from "@near-wallet-selector/modal-ui";
import { setupMyNearWallet } from "@near-wallet-selector/my-near-wallet";
import "@near-wallet-selector/modal-ui/styles.css";

interface WalletContextType {
  selector: WalletSelector | null;
  modal: WalletSelectorModal | null;
  accountId: string | null;
  signIn: () => void;
  signOut: () => void;
}

const WalletSelectorContext = React.createContext<WalletContextType | null>(null);

export const WalletSelectorContextProvider = ({ children }: { children: ReactNode }) => {
  const [selector, setSelector] = useState<WalletSelector | null>(null);
  const [modal, setModal] = useState<WalletSelectorModal | null>(null);
  const [accountId, setAccountId] = useState<string | null>(null);

  const init = useCallback(async () => {
    const _selector = await setupWalletSelector({
      network: "testnet",
      modules: [setupMyNearWallet()],
    });

    const _modal = setupModal(_selector, {
      contractId: process.env.NEXT_PUBLIC_CONTRACT_ID as string,
    });

    // 1. Get initial state
    const state = _selector.store.getState();
    setAccountId(state.accounts.find((acc) => acc.active)?.accountId || null);

    // 2. SUBSCRIBE to live changes (This fixes the Join button!)
    const subscription = _selector.store.observable.subscribe((state) => {
      setAccountId(state.accounts.find((acc) => acc.active)?.accountId || null);
    });

    setSelector(_selector);
    setModal(_modal);

    // Cleanup subscription on unmount
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    init().catch(console.error);
  }, [init]);

  const signIn = () => modal?.show();
  
  const signOut = async () => {
    if (!selector) return;
    const wallet = await selector.wallet();
    await wallet.signOut();
    setAccountId(null);
    window.location.replace("/");
  };

  return (
    <WalletSelectorContext.Provider value={{ selector, modal, accountId, signIn, signOut }}>
      {children}
    </WalletSelectorContext.Provider>
  );
};

export const useWallet = () => {
  const context = useContext(WalletSelectorContext);
  if (!context) throw new Error("useWallet must be used within a WalletSelectorContextProvider");
  return context;
};