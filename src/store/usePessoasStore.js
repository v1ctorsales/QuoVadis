import { create } from 'zustand';

const usePessoasStore = create((set) => ({
  pessoas: [],
  total: 0,
  setPessoas: (pessoas, total) => set({ pessoas, total }),

  addPessoa: (newPerson) =>
    set((state) => {
      if (state.pessoas.length >= 10) {
        return state; // Retorna o estado atual sem adicionar
      }
      return {
        pessoas: [...state.pessoas, newPerson],
        total: state.total + 1, // Atualiza o total corretamente
      };
    }),

  updatePessoa: (updatedPerson) =>
    set((state) => ({
      pessoas: state.pessoas.map((pessoa) =>
        pessoa.id === updatedPerson.id ? updatedPerson : pessoa
      ),
    })),

  removePessoa: (id) =>
    set((state) => ({
      pessoas: state.pessoas.filter((pessoa) => pessoa.id !== id),
      total: state.total - 1,
    })),
}));

export default usePessoasStore;
