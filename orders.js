import { state } from './state.js';
import { fbSaveOrder, fbUpdateOrder } from './firebase.js';
import { setLoading, showToast, addServiceRow, calcTotals, clearPattern, v } from './ui.js';

// ========== MONTAR OBJETO OS ==========
function buildOSData() {
  const services = [];
  document.querySelectorAll('#services-body tr').forEach(tr => {
    const qty   = tr.querySelector('.qty')?.value;
    const desc  = tr.querySelector('.desc')?.value.trim();
    const unit  = tr.querySelector('.unit-price')?.value;
    const total = tr.querySelector('.row-total')?.value;
    if (desc) services.push({ qty, desc, unit, total });
  });

  const techId = document.getElementById('sel-tecnico').value;
  const tech   = state.technicians.find(t => t.firestoreId === techId);
  const sub    = parseFloat(document.getElementById('subtotal-display').textContent.replace('R$ ','').replace(',','.')) || 0;
  const disc   = parseFloat(document.getElementById('discount-input').value) || 0;

  return {
    cliente: {
      nome: document.getElementById('cli-nome').value.trim(),
      end: v('cli-end'), num: v('cli-num'), cidade: v('cli-cidade'),
      uf: v('cli-uf'), cep: v('cli-cep'), tel: v('cli-tel'), cel: v('cli-cel'),
      email: v('cli-email'), rg: v('cli-rg'), cpf: v('cli-cpf')
    },
    tecnico:     tech?.nome || '—',
    tecnicoId:   techId,
    atendente:   v('atendente'),
    dataEntrada: v('data-entrada'),
    produto: {
      tipo: v('prod-tipo'), fab: v('prod-fab'), modelo: v('prod-modelo'),
      imei: v('prod-imei'), cor: v('prod-cor')
    },
    condicoes: { ...state.conditions, obs: v('cond-obs') },
    senha: {
      ativa:  state.senhaActive,
      modo:   state.pwMode,
      texto:  v('pw-text'),
      padrao: state.patternSequence.join('-')
    },
    defeito: {
      desc:     v('defeito'),
      cat:      v('defeito-cat'),
      urgencia: v('defeito-urgencia')
    },
    services,
    subtotal:      sub,
    desconto:      disc,
    total:         Math.max(0, sub - disc),
    preAprovado:   v('pre-aprovado'),
    dataConclusao: v('data-conclusao'),
    dataRetirada:  v('data-retirada'),
    laudo:         v('laudo')
  };
}

// ========== SALVAR / ATUALIZAR OS ==========
export async function saveOS() {
  const nome = document.getElementById('cli-nome').value.trim();
  if (!nome) { alert('Informe o nome do cliente.'); return; }

  const data = buildOSData();

  // ---- EDIÇÃO ----
  if (state.editingOsId) {
    const original = state.orders.find(o => o.firestoreId === state.editingOsId);
    const updated  = { ...original, ...data };

    setLoading(true, 'Salvando alterações...');
    try {
      await fbUpdateOrder(state.editingOsId, updated);
      showToast(original.id + ' atualizada!');
      state.editingOsId = null;
      setEditMode(false);
      clearForm();
    } catch(e) {
      console.error(e);
      showToast('Erro ao atualizar OS.');
    }
    setLoading(false);
    return;
  }

  // ---- NOVA OS ----
  const nextNum = String(state.orders.length + 1).padStart(4, '0');
  const os = {
    id:      'OS#' + nextNum,
    num:     state.orders.length + 1,
    created: new Date().toISOString(),
    status:  'aguardando_orcamento',
    ...data
  };

  setLoading(true, 'Salvando ordem de serviço...');
  try {
    await fbSaveOrder(os);
    showToast(os.id + ' salva com sucesso!');
    clearForm();
  } catch(e) {
    console.error(e);
    showToast('Erro ao salvar OS. Verifique sua conexão.');
  }
  setLoading(false);
}

// ========== CARREGAR OS PARA EDIÇÃO ==========
export function loadOSForEdit(osId) {
  const o = state.orders.find(x => x.id === osId);
  if (!o) return;

  state.editingOsId = o.firestoreId;

  // Navega para Nova OS
  window.showPage('nova-os');
  setEditMode(true, o.id);

  // Preenche cliente
  setVal('cli-nome',   o.cliente?.nome);
  setVal('cli-end',    o.cliente?.end);
  setVal('cli-num',    o.cliente?.num);
  setVal('cli-cidade', o.cliente?.cidade);
  setVal('cli-uf',     o.cliente?.uf);
  setVal('cli-cep',    o.cliente?.cep);
  setVal('cli-tel',    o.cliente?.tel);
  setVal('cli-cel',    o.cliente?.cel);
  setVal('cli-email',  o.cliente?.email);
  setVal('cli-rg',     o.cliente?.rg);
  setVal('cli-cpf',    o.cliente?.cpf);

  // Atendimento
  setVal('atendente',    o.atendente);
  setVal('data-entrada', o.dataEntrada);
  const selTec = document.getElementById('sel-tecnico');
  if (selTec) selTec.value = o.tecnicoId || '';

  // Produto
  setVal('prod-tipo',   o.produto?.tipo);
  setVal('prod-fab',    o.produto?.fab);
  setVal('prod-modelo', o.produto?.modelo);
  setVal('prod-imei',   o.produto?.imei);
  setVal('prod-cor',    o.produto?.cor);

  // Condições
  state.conditions = { ...(o.condicoes || {}) };
  document.querySelectorAll('.cond-btn').forEach(b => b.classList.remove('active'));
  Object.entries(state.conditions).forEach(([field, val]) => {
    if (field === 'obs') return;
    const btn = document.querySelector(`.cond-btn[onclick*="'${field}','${val}'"]`);
    if (btn) btn.classList.add('active');
  });
  setVal('cond-obs', o.condicoes?.obs);

  // Senha
  const pw = o.senha || {};
  state.senhaActive = !!pw.ativa;
  document.getElementById('senha-toggle').classList.toggle('on', state.senhaActive);
  document.getElementById('senha-section').classList.toggle('visible', state.senhaActive);
  if (pw.modo) window.setPwMode(pw.modo);
  setVal('pw-text', pw.texto);

  // Defeito
  setVal('defeito',      o.defeito?.desc);
  setVal('defeito-cat',  o.defeito?.cat);
  setVal('defeito-urgencia', o.defeito?.urgencia);

  // Serviços
  document.getElementById('services-body').innerHTML = '';
  if (o.services && o.services.length > 0) {
    o.services.forEach(s => {
      window.addServiceRow();
      const rows = document.querySelectorAll('#services-body tr');
      const last = rows[rows.length - 1];
      last.querySelector('.qty').value        = s.qty;
      last.querySelector('.desc').value       = s.desc;
      last.querySelector('.unit-price').value = s.unit;
      last.querySelector('.row-total').value  = s.total;
    });
  } else {
    window.addServiceRow(); window.addServiceRow(); window.addServiceRow();
  }
  setVal('discount-input', o.desconto || '');
  calcTotals();

  // Outros
  setVal('pre-aprovado',   o.preAprovado);
  setVal('data-conclusao', o.dataConclusao);
  setVal('data-retirada',  o.dataRetirada);
  setVal('laudo',          o.laudo);

  window.scrollTo(0, 0);
}

function setVal(id, val) {
  const el = document.getElementById(id);
  if (el && val !== undefined && val !== null) el.value = val;
}

// ========== MODO EDIÇÃO (visual) ==========
function setEditMode(on, osId = '') {
  const banner = document.getElementById('edit-mode-banner');
  if (banner) {
    banner.style.display = on ? 'flex' : 'none';
    const label = banner.querySelector('#edit-os-label');
    if (label) label.textContent = 'Editando ' + osId;
  }
  // Troca texto do botão salvar
  const btn = document.querySelector('button[onclick="saveOS()"]');
  if (btn) btn.textContent = on ? '✓ Salvar Alterações' : '✓ Salvar OS';
}

// ========== LIMPAR FORMULÁRIO ==========
export function clearForm() {
  state.editingOsId = null;
  setEditMode(false);

  [
    'cli-nome','cli-end','cli-num','cli-cidade','cli-uf','cli-cep',
    'cli-tel','cli-cel','cli-email','cli-rg','cli-cpf',
    'atendente','prod-tipo','prod-fab','prod-modelo','prod-imei','prod-cor',
    'cond-obs','defeito','laudo','defeito-cat','defeito-urgencia',
    'pre-aprovado','discount-input','data-conclusao','data-retirada'
  ].forEach(id => { const el=document.getElementById(id); if(el) el.value=''; });

  document.getElementById('data-entrada').value = new Date().toISOString().split('T')[0];
  document.getElementById('sel-tecnico').value  = '';

  state.conditions  = {};
  document.querySelectorAll('.cond-btn').forEach(b=>b.classList.remove('active'));
  state.senhaActive = false;
  document.getElementById('senha-toggle').classList.remove('on');
  document.getElementById('senha-section').classList.remove('visible');
  clearPattern();
  document.getElementById('pw-text').value = '';
  document.getElementById('services-body').innerHTML = '';
  window.addServiceRow(); window.addServiceRow(); window.addServiceRow();
  calcTotals();
  const nextNum = String(state.orders.length+1).padStart(4,'0');
  document.getElementById('os-number-display').textContent = 'OS #'+nextNum;
  document.getElementById('print-os-num').textContent      = 'OS #'+nextNum;
  window.scrollTo(0,0);
}
