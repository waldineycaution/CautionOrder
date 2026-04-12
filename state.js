// ========== ESTADO COMPARTILHADO ==========
export const state = {
  technicians: [],
  orders: [],
  conditions: {},
  patternSequence: [],
  pwMode: 'text',
  senhaActive: false,
  deferredInstallPrompt: null,
  menuOsId: null,
  editingOsId: null,      // firestoreId da OS em edição (null = nova OS)
  // Usuário logado
  userRole: null,   // 'dono' | 'tecnico'
  userId: null,
  userEmail: null,
};
