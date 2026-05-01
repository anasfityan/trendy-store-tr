import { create } from "zustand";

interface BatchFilterStore {
  statusFilter: string;
  counts: Record<string, number>;
  setStatusFilter: (v: string) => void;
  setCounts: (c: Record<string, number>) => void;
}

export const useBatchFilterStore = create<BatchFilterStore>((set) => ({
  statusFilter: "open",
  counts: {},
  setStatusFilter: (statusFilter) => set({ statusFilter }),
  setCounts: (counts) => set({ counts }),
}));
