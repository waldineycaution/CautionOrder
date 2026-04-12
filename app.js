import { state } from './state.js';
import { fbLoadTechs, fbLoadOrders, fbSaveTech, listenOrders, listenTechs, login, logout, onAuth } from './firebase.js';
import {
  setLoading, showToast, showPage, setCondition,
  toggleSenha, setPwMode, initPatternGrid, clearPattern,
  addServiceRow, calcRow, removeRow, calcTotals
} from './ui.js';
import { renderTechs, renderTechSelect, openTechModal, closeTechModal, saveTech, deleteTech } from './technicians.js';
import { saveOS, clearForm } from './orders.js';
import { renderHistory, updateHistCount, openOSMenu, closeOSMenu, menuPrint, menuDelete } from './history.js';
import { printOS } from './print.js';

// ========== PWA INSTALL ==========
window.addEventListener('beforeinstallprompt', e => {
  e.preventDefault();
  state.deferredInstallPrompt = e;
  if (!localStorage.getItem('ct_install_dismissed')) {
    document.getElementById('install-banner').classList.add('show');
  }
});
window.addEventListener('appinstalled', () => {
  document.getElementById('install-banner').classList.remove('show');
  showToast('App instalado com sucesso!');
});

// ========== SERVICE WORKER ==========
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('./sw.js')
    .then(r => console.log('[CautionOS] SW:', r.scope))
    .catch(e => console.log('[CautionOS] SW erro:', e));
}

// ========== OFFLINE ==========
function updateOnlineStatus() {
  document.body.classList.toggle('offline', !navigator.onLine);
}
window.addEventListener('online', updateOnlineStatus);
window.addEventListener('offline', updateOnlineStatus);
updateOnlineStatus();

// ========== LOGIN ==========
async function doLogin() {
  const email = document.getElementById('login-email').value.trim();
  const pass  = document.getElementById('login-pass').value;
  const err   = document.getElementById('login-error');
  const btn   = document.getElementById('login-btn');
  if (!email || !pass) { err.textContent = 'Preencha e-mail e senha.'; return; }
  err.textContent = '';
  btn.textContent = 'Entrando...';
  btn.disabled = true;
  try {
    await login(email, pass);
  } catch (e) {
    const msgs = {
      'auth/invalid-credential': 'E-mail ou senha incorretos.',
      'auth/user-not-found':     'Usuário não encontrado.',
      'auth/wrong-password':     'Senha incorreta.',
      'auth/too-many-requests':  'Muitas tentativas. Aguarde um momento.',
      'auth/invalid-email':      'E-mail inválido.',
    };
    err.textContent = msgs[e.code] || 'Erro ao entrar. Tente novamente.';
    btn.textContent = 'Entrar';
    btn.disabled = false;
  }
}

async function doLogout() {
  await logout();
}

function showLoginScreen() {
  document.getElementById('app-root').style.display     = 'none';
  document.getElementById('login-screen').style.display = 'flex';
  document.getElementById('login-pass').value = '';
  document.getElementById('login-error').textContent = '';
  document.getElementById('login-btn').textContent = 'Entrar';
  document.getElementById('login-btn').disabled = false;
}

function showApp() {
  document.getElementById('login-screen').style.display = 'none';
  document.getElementById('app-root').style.display     = 'block';
}

// ========== INIT ==========
document.addEventListener('DOMContentLoaded', () => {
  onAuth(async (user) => {
    if (!user) { showLoginScreen(); return; }

    showApp();
    setLoading(true, 'Carregando dados...');
    try {
      await fbLoadTechs();
      await fbLoadOrders();
      if (state.technicians.length === 0) {
        setLoading(true, 'Configurando primeiro acesso...');
        const id = await fbSaveTech({ nome: 'Waldiney', tel: '(11) 97684-8946', wpp: '(11) 97684-8946', esp: 'Celular, Tablet', status: 'ativo' });
        state.technicians = [{ firestoreId: id, nome: 'Waldiney', tel: '(11) 97684-8946', wpp: '(11) 97684-8946', esp: 'Celular, Tablet', status: 'ativo' }];
      }
    } catch (e) {
      console.error('Firebase erro:', e);
      showToast('Erro ao carregar dados.');
    }
    setLoading(false);

    const now = new Date();
    const nextNum    = String(state.orders.length + 1).padStart(4, '0');
    const osNumText  = 'OS #' + nextNum;
    const osDateText = now.toLocaleDateString('pt-BR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    document.getElementById('os-number-display').textContent = osNumText;
    document.getElementById('os-date-display').textContent   = osDateText;
    document.getElementById('print-os-num').textContent  = osNumText;
    document.getElementById('print-os-date').textContent = osDateText;
    document.getElementById('data-entrada').value = now.toISOString().split('T')[0];
    document.getElementById('user-email').textContent = user.email;

    addServiceRow(); addServiceRow(); addServiceRow();
    renderTechs(); renderTechSelect(); renderHistory();
    initPatternGrid(); updateHistCount();

    listenOrders(() => {
      renderHistory(); updateHistCount();
      const n = String(state.orders.length + 1).padStart(4, '0');
      document.getElementById('os-number-display').textContent = 'OS #' + n;
      document.getElementById('print-os-num').textContent = 'OS #' + n;
    });
    listenTechs(() => { renderTechs(); renderTechSelect(); });

    if (location.hash === '#historico') showPage('historico');
    if (location.hash === '#nova-os')   showPage('nova-os');

    document.addEventListener('click', (e) => {
      const menu = document.getElementById('os-menu');
      if (menu && !menu.contains(e.target)) closeOSMenu();
    });
    document.getElementById('tech-modal').addEventListener('click', function (e) {
      if (e.target === this) closeTechModal();
    });
  });

  document.getElementById('login-pass').addEventListener('keydown', e => {
    if (e.key === 'Enter') doLogin();
  });
});

// ========== EXPOR FUNÇÕES PARA O HTML ==========
window.installApp     = () => { if (state.deferredInstallPrompt) { state.deferredInstallPrompt.prompt(); state.deferredInstallPrompt.userChoice.then(() => { state.deferredInstallPrompt = null; document.getElementById('install-banner').classList.remove('show'); }); } };
window.dismissInstall = () => { localStorage.setItem('ct_install_dismissed', '1'); document.getElementById('install-banner').classList.remove('show'); };
window.doLogin        = doLogin;
window.doLogout       = doLogout;
window.showPage       = showPage;
window.setCondition   = setCondition;
window.toggleSenha    = toggleSenha;
window.setPwMode      = setPwMode;
window.clearPattern   = clearPattern;
window.addServiceRow  = addServiceRow;
window.calcRow        = calcRow;
window.removeRow      = removeRow;
window.calcTotals     = calcTotals;
window.renderHistory  = renderHistory;
window.openTechModal  = openTechModal;
window.closeTechModal = closeTechModal;
window.editTech       = (id) => openTechModal(id);
window.saveTech       = saveTech;
window.deleteTech     = deleteTech;
window.saveOS         = saveOS;
window.clearForm      = clearForm;
window.openOSMenu     = openOSMenu;
window.menuPrint      = menuPrint;
window.menuDelete     = menuDelete;
window.printOS        = printOS;
window.showToast      = showToast;