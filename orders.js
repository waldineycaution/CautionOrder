import { state } from './state.js';
import { fbSaveOrder } from './firebase.js';
import { setLoading, showToast, addServiceRow, calcTotals, clearPattern, v } from './ui.js';

// ========== SALVAR OS ==========
export async function saveOS() {
  const nome = document.getElementById('cli-nome').value.trim();
  if (!nome) { alert('Informe o nome do cliente.'); return; }

  const services = [];
  document.querySelectorAll('#services-body tr').forEach(tr => {
    const qty = tr.querySelector('.qty')?.value;
    const desc = tr.querySelector('.desc')?.value.trim();
    const unit = tr.querySelector('.unit-price')?.value;
    const total = tr.querySelector('.row-total')?.value;
    if (desc) services.push({ qty, desc, unit, total });
  });

  const techId = document.getElementById('sel-tecnico').value;
  const tech = state.technicians.find(t => t.firestoreId === techId);
  const sub = parseFloat(document.getElementById('subtotal-display').textContent.replace('R$ ', '').replace(',', '.')) || 0;
  const disc = parseFloat(document.getElementById('discount-input').value) || 0;
  const total = Math.max(0, sub - disc);
  const nextNum = String(state.orders.length + 1).padStart(4, '0');

  const os = {
    id: 'OS#' + nextNum,
    num: state.orders.length + 1,
    created: new Date().toISOString(),
    cliente: {
      nome,
      end: v('cli-end'), num: v('cli-num'), cidade: v('cli-cidade'), uf: v('cli-uf'),
      cep: v('cli-cep'), tel: v('cli-tel'), cel: v('cli-cel'),
      email: v('cli-email'), rg: v('cli-rg'), cpf: v('cli-cpf')
    },
    tecnico: tech?.nome || '—',
    tecnicoId: techId,
    atendente: v('atendente'),
    dataEntrada: v('data-entrada'),
    produto: {
      tipo: v('prod-tipo'), fab: v('prod-fab'), modelo: v('prod-modelo'),
      imei: v('prod-imei'), cor: v('prod-cor')
    },
    condicoes: { ...state.conditions, obs: v('cond-obs') },
    senha: {
      ativa: state.senhaActive,
      modo: state.pwMode,
      texto: v('pw-text'),
      padrao: state.patternSequence.join('-')
    },
    defeito: {
      desc: v('defeito'),
      cat: v('defeito-cat'),
      urgencia: v('defeito-urgencia')
    },
    services,
    subtotal: sub,
    desconto: disc,
    total,
    preAprovado: v('pre-aprovado'),
    status: v('status-os'),
    dataConclusao: v('data-conclusao'),
    dataRetirada: v('data-retirada'),
    laudo: v('laudo')
  };

  setLoading(true, 'Salvando ordem de serviço...');
  try {
    await fbSaveOrder(os);
    showToast(os.id + ' salva com sucesso!');
    clearForm();
  } catch (e) {
    console.error(e);
    showToast('Erro ao salvar OS. Verifique sua conexão.');
  }
  setLoading(false);
}

// ========== LIMPAR FORMULÁRIO ==========
export function clearForm() {
  [
    'cli-nome', 'cli-end', 'cli-num', 'cli-cidade', 'cli-uf', 'cli-cep',
    'cli-tel', 'cli-cel', 'cli-email', 'cli-rg', 'cli-cpf',
    'atendente', 'prod-tipo', 'prod-fab', 'prod-modelo', 'prod-imei', 'prod-cor',
    'cond-obs', 'defeito', 'laudo', 'defeito-cat', 'defeito-urgencia',
    'pre-aprovado', 'discount-input', 'data-conclusao', 'data-retirada'
  ].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = '';
  });

  document.getElementById('data-entrada').value = new Date().toISOString().split('T')[0];
  document.getElementById('sel-tecnico').value = '';
  document.getElementById('status-os').value = 'aberta';

  state.conditions = {};
  document.querySelectorAll('.cond-btn').forEach(b => b.classList.remove('active'));

  state.senhaActive = false;
  document.getElementById('senha-toggle').classList.remove('on');
  document.getElementById('senha-section').classList.remove('visible');
  clearPattern();
  document.getElementById('pw-text').value = '';

  document.getElementById('services-body').innerHTML = '';
  addServiceRow(); addServiceRow(); addServiceRow();
  calcTotals();

  const nextNum = String(state.orders.length + 1).padStart(4, '0');
  document.getElementById('os-number-display').textContent = 'OS #' + nextNum;
  document.getElementById('print-os-num').textContent = 'OS #' + nextNum;
  window.scrollTo(0, 0);
}
