import { create } from 'zustand'

export const useSemestreStore = create((set) => ({
  semestreAtivo: null,
  setSemestreAtivo: (s) => set({ semestreAtivo: s }),
}))
