import { state } from './state.js';
import {
  fbLoadTechs, fbLoadOrders, fbSaveTech, listenOrders, listenTechs,
  login, logout, onAuth, getUserRole, setUserRole, isFirstUser
} from './firebase.js';
import {
  setLoading, showToast, showPage, setCondition,
  toggleSenha, setPwMode, initPatternGrid, clearPattern,
  addServiceRow, calcRow, removeRow, calcTotals
} from './ui.js';
import { renderTechs, renderTechSelect, openTechModal, closeTechModal, saveTech, deleteTech } from './technicians.js';
import { saveOS, clearForm, loadOSForEdit } from './orders.js';
import {
  renderHistory, updateHistCount,
  openOSMenu, closeOSMenu, menuPrint, menuEdit, menuChangeStatus, menuDelete,
  closeStatusModal, saveStatus, selectStatusOpt
} from './history.js';
import { printOS } from './print.js';
import { renderDashboard, populateDashYears } from './dashboard.js';

// ========== PWA ==========
window.addEventListener('beforeinstallprompt', e => {
  e.preventDefault(); state.deferredInstallPrompt = e;
  if (!localStorage.getItem('ct_install_dismissed'))
    document.getElementById('install-banner').classList.add('show');
});
window.addEventListener('appinstalled', () => {
  document.getElementById('install-banner').classList.remove('show');
  showToast('App instalado com sucesso!');
});

if ('serviceWorker' in navigator)
  navigator.serviceWorker.register('./sw.js').catch(()=>{});

window.addEventListener('online',  () => document.body.classList.remove('offline'));
window.addEventListener('offline', () => document.body.classList.add('offline'));

// ========== LOGIN ==========
async function doLogin() {
  const email = document.getElementById('login-email').value.trim();
  const pass  = document.getElementById('login-pass').value;
  const err   = document.getElementById('login-error');
  const btn   = document.getElementById('login-btn');
  if (!email||!pass) { err.textContent='Preencha e-mail e senha.'; return; }
  err.textContent=''; btn.textContent='Entrando...'; btn.disabled=true;
  try { await login(email, pass); }
  catch(e) {
    const msgs = {
      'auth/invalid-credential':'E-mail ou senha incorretos.',
      'auth/user-not-found':    'Usuário não encontrado.',
      'auth/wrong-password':    'Senha incorreta.',
      'auth/too-many-requests': 'Muitas tentativas. Aguarde.',
      'auth/invalid-email':     'E-mail inválido.',
    };
    err.textContent = msgs[e.code]||'Erro ao entrar.';
    btn.textContent='Entrar'; btn.disabled=false;
  }
}

function showLoginScreen() {
  document.getElementById('app-root').style.display      = 'none';
  document.getElementById('login-screen').style.display  = 'flex';
  document.getElementById('login-pass').value = '';
  document.getElementById('login-error').textContent = '';
  document.getElementById('login-btn').textContent = 'Entrar';
  document.getElementById('login-btn').disabled = false;
}

function showApp() {
  document.getElementById('login-screen').style.display = 'none';
  document.getElementById('app-root').style.display     = 'block';
}

// ========== APLICA PERMISSÕES POR PERFIL ==========
function applyRole(role) {
  state.userRole = role;
  const isDono = role === 'dono';

  // Nav desktop
  document.getElementById('nav-tecnicos')?.classList.toggle('hidden-role', !isDono);
  document.getElementById('nav-dashboard')?.classList.toggle('hidden-role', !isDono);
  // Nav mobile
  document.getElementById('mob-tec')?.classList.toggle('hidden-role', !isDono);
  document.getElementById('mob-dash')?.classList.toggle('hidden-role', !isDono);

  // Aba Nova OS visível para todos
  // Dashboard e Técnicos só para dono
}

// ========== INIT ==========
document.addEventListener('DOMContentLoaded', () => {
  onAuth(async (user) => {
    if (!user) { showLoginScreen(); return; }

    state.userId    = user.uid;
    state.userEmail = user.email;

    setLoading(true, 'Verificando acesso...');

    let roleData = null;
    try {
      // Verifica se é o primeiro usuário (vira dono automaticamente)
      if (await isFirstUser()) {
        await setUserRole(user.uid, 'dono', user.email, user.email.split('@')[0]);
        roleData = { role: 'dono' };
      } else {
        roleData = await getUserRole(user.uid);
      }
    } catch(e) { console.error(e); }

    if (!roleData) {
      setLoading(false);
      await logout();
      showLoginScreen();
      document.getElementById('login-error').textContent = 'Acesso não autorizado para este e-mail.';
      return;
    }

    applyRole(roleData.role);
    showApp();
    setLoading(true, 'Carregando dados...');

    try {
      await fbLoadTechs();
      await fbLoadOrders();
      if (state.technicians.length===0) {
        const id = await fbSaveTech({ nome:'Waldiney', tel:'(11) 97684-8946', wpp:'(11) 97684-8946', esp:'Celular, Tablet', status:'ativo', perfil:'dono' });
        state.technicians = [{ firestoreId:id, nome:'Waldiney', tel:'(11) 97684-8946', wpp:'(11) 97684-8946', esp:'Celular, Tablet', status:'ativo', perfil:'dono' }];
      }
    } catch(e) { showToast('Erro ao carregar dados.'); }

    setLoading(false);

    const now = new Date();
    const nn  = String(state.orders.length+1).padStart(4,'0');
    document.getElementById('os-number-display').textContent = 'OS #'+nn;
    document.getElementById('os-date-display').textContent   = now.toLocaleDateString('pt-BR',{weekday:'long',year:'numeric',month:'long',day:'numeric'});
    document.getElementById('print-os-num').textContent  = 'OS #'+nn;
    document.getElementById('print-os-date').textContent = now.toLocaleDateString('pt-BR',{weekday:'long',year:'numeric',month:'long',day:'numeric'});
    document.getElementById('data-entrada').value = now.toISOString().split('T')[0];
    document.getElementById('user-email').textContent = user.email;
    document.getElementById('user-role-badge').textContent = roleData.role==='dono'?'👑 Dono':'🔧 Técnico';

    addServiceRow(); addServiceRow(); addServiceRow();
    renderTechs(); renderTechSelect(); renderHistory(); updateHistCount();
    initPatternGrid();
    if (roleData.role==='dono') { populateDashYears(); renderDashboard(); }

    listenOrders(() => {
      renderHistory(); updateHistCount();
      const n = String(state.orders.length+1).padStart(4,'0');
      document.getElementById('os-number-display').textContent = 'OS #'+n;
      document.getElementById('print-os-num').textContent      = 'OS #'+n;
      if (state.userRole==='dono') { populateDashYears(); renderDashboard(); }
    });
    listenTechs(() => { renderTechs(); renderTechSelect(); });

    if (location.hash==='#historico') showPage('historico');
    else if (location.hash==='#dashboard') showPage('dashboard');

    document.addEventListener('click', e => {
      const menu = document.getElementById('os-menu');
      if (menu && !menu.contains(e.target)) closeOSMenu();
    });
    document.getElementById('tech-modal').addEventListener('click', function(e) {
      if (e.target===this) closeTechModal();
    });
    document.getElementById('status-modal').addEventListener('click', function(e) {
      if (e.target===this) closeStatusModal();
    });
  });

  document.getElementById('login-pass').addEventListener('keydown', e => {
    if (e.key==='Enter') doLogin();
  });
});

// ========== EXPOR FUNÇÕES ==========
window.installApp     = ()=>{ if(state.deferredInstallPrompt){ state.deferredInstallPrompt.prompt(); state.deferredInstallPrompt.userChoice.then(()=>{ state.deferredInstallPrompt=null; document.getElementById('install-banner').classList.remove('show'); }); } };
window.dismissInstall = ()=>{ localStorage.setItem('ct_install_dismissed','1'); document.getElementById('install-banner').classList.remove('show'); };
window.doLogin        = doLogin;
window.doLogout       = async ()=>{ await logout(); };
window.showPage       = (n)=>{
  // Bloqueia dashboard e técnicos para não-donos
  if ((n==='dashboard'||n==='tecnicos') && state.userRole!=='dono') return;
  showPage(n);
  if (n==='dashboard') { populateDashYears(); renderDashboard(); }
};
window.setCondition   = setCondition;
window.toggleSenha    = toggleSenha;
window.setPwMode      = setPwMode;
window.clearPattern   = clearPattern;
window.addServiceRow  = addServiceRow;
window.calcRow        = calcRow;
window.removeRow      = removeRow;
window.calcTotals     = calcTotals;
window.renderHistory  = renderHistory;
window.renderDashboard = renderDashboard;
window.openTechModal  = openTechModal;
window.closeTechModal = closeTechModal;
window.editTech       = id=>openTechModal(id);
window.saveTech       = saveTech;
window.deleteTech     = deleteTech;
window.saveOS         = saveOS;
window.clearForm      = clearForm;
window.loadOSForEdit  = loadOSForEdit;
window.openOSMenu     = openOSMenu;
window.menuPrint      = menuPrint;
window.menuEdit       = menuEdit;
window.menuChangeStatus = menuChangeStatus;
window.menuDelete     = menuDelete;
window.closeStatusModal = closeStatusModal;
window.saveStatus     = saveStatus;
window.selectStatusOpt  = selectStatusOpt;
window.printOS        = printOS;
window.showToast      = showToast;
