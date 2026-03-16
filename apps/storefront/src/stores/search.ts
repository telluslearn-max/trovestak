"use client";

import { create } from "zustand";

interface SearchState {
    isOpen: boolean;
    setIsOpen: (open: boolean) => void;
}

export const useSearchStore = create<SearchState>()((set) => ({
    isOpen: false,
    setIsOpen: (open) => set({ isOpen: open }),
}));
