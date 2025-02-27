import { create } from 'zustand';

const useViagensStore = create((set) => ({
  viagens: [],
  setViagens: (novasViagens) => set({ viagens: novasViagens }),
  addViagem: (novaViagem) => set((state) => ({ viagens: [...state.viagens, novaViagem] })),
  removeViagem: (id) => set((state) => ({ viagens: state.viagens.filter((v) => v.id !== id) })),
  updateViagem: (viagemAtualizada) => set((state) => ({
    viagens: state.viagens.map((v) => (v.id === viagemAtualizada.id ? viagemAtualizada : v))
  })),
}));

export default useViagensStore;
