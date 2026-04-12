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
  // Usuário logado
  userRole: null,   // 'dono' | 'tecnico'
  userId: null,
  userEmail: null,
};
