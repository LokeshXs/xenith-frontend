import { create } from "zustand";

export interface XAccount {
  name: string;
  username: string;
  avatar: string;
}

interface XAccountState {
  account: XAccount | null;
  setAccount: (account: XAccount) => void;
  clearAccount: () => void;
}

export const useXAccountStore = create<XAccountState>((set) => ({
  account: null,
  setAccount: (account) => set({ account }),
  clearAccount: () => set({ account: null }),
}));
