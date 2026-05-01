import { create } from "zustand";

interface FinanceFilterStore {
  statusFilter: string;
  search: string;
  setStatusFilter: (v: string) => void;
  setSearch: (v: string) => void;
}

export const useFinanceFilterStore = create<FinanceFilterStore>((set) => ({
  statusFilter: "open",
  search: "",
  setStatusFilter: (statusFilter) => set({ statusFilter }),
  setSearch: (search) => set({ search }),
}));
