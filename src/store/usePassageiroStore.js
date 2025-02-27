import { create } from 'zustand';

const usePassageirosStore = create((set) => ({
  passageiros: [],
  total: 0,
  setPassageiros: (passageiros, total) => set({ passageiros, total }),
  addPassageiro: (newPassageiro) =>
    set((state) => ({
      passageiros: [...state.passageiros, newPassageiro],
      total: state.total + 1,
    })),
  updatePassageiro: (updatedPassageiro) =>
    set((state) => ({
      passageiros: state.passageiros.map((passageiro) =>
        passageiro.id === updatedPassageiro.id ? updatedPassageiro : passageiro
      ),
    })),
  removePassageiro: (id) =>
    set((state) => ({
      passageiros: state.passageiros.filter((passageiro) => passageiro.id !== id),
      total: state.total - 1,
    })),
}));

export default usePassageirosStore;
