import { state } from './state.js';
import { fbDeleteOrder, fbUpdateOrderStatus } from './firebase.js';
import { setLoading, showToast } from './ui.js';
import { printOS } from './print.js';

// ========== LABELS E CORES ==========
export const STATUS_LABEL = {
  aguardando_orcamento: 'Aguardando Orçamento',
  aprovado:   'Aprovado',
  reprovado:  'Reprovado',
  finalizado: 'Finalizado',
  // legado
  aberta:        'Aberta',
  aguardando:    'Aguardando',
  em_andamento:  'Em andamento',
  concluida:     'Concluída',
  entregue:      'Entregue',
  cancelada:     'Cancelada',
};

export const STATUS_CLASS = {
  aguardando_orcamento: 'status-aguardando',
  aprovado:   'status-aprovado',
  reprovado:  'status-reprovado',
  finalizado: 'status-concluida',
  aberta:        'status-aberta',
  aguardando:    'status-aguardando',
  em_andamento:  'status-aguardando',
  concluida:     'status-concluida',
  entregue:      'status-concluida',
  cancelada:     'status-aberta',
};

// ========== RENDERIZAR HISTÓRICO ==========
export function renderHistory() {
  const search       = (document.getElementById('search-os')?.value||'').toLowerCase();
  const statusFilter = document.getElementById('filter-status')?.value||'';
  const tbody  = document.getElementById('history-body');
  const empty  = document.getElementById('history-empty');
  if (!tbody) return;
  tbody.innerHTML = '';

  const filtered = state.orders.filter(o => {
    const ms  = !search || o.cliente.nome.toLowerCase().includes(search) || o.id.toLowerCase().includes(search);
    const mst = !statusFilter || o.status === statusFilter;
    return ms && mst;
  });

  if (filtered.length === 0) { empty.style.display='block'; return; }
  empty.style.display = 'none';

  filtered.forEach(o => {
    const tr = document.createElement('tr');
    tr.style.cursor = 'pointer';
    const sc = STATUS_CLASS[o.status]||'status-aberta';
    const sl = STATUS_LABEL[o.status]||o.status;
    tr.innerHTML = `
      <td style="font-family:'IBM Plex Mono',monospace;color:var(--amber)">${o.id}</td>
      <td>${o.cliente.nome}</td>
      <td style="color:var(--text3)">${[o.produto.fab,o.produto.modelo].filter(Boolean).join(' ')||'—'}</td>
      <td>${o.tecnico}</td>
      <td style="font-family:'IBM Plex Mono',monospace;font-size:12px">${o.dataEntrada?new Date(o.dataEntrada+'T12:00:00').toLocaleDateString('pt-BR'):'—'}</td>
      <td><span class="status-badge ${sc}">${sl}</span></td>
      <td style="font-family:'IBM Plex Mono',monospace;color:var(--amber)">R$ ${(o.total||0).toFixed(2).replace('.',',')}</td>
    `;
    tr.addEventListener('click', e => openOSMenu(e, o.id));
    tbody.appendChild(tr);
  });
}

export function updateHistCount() {
  const el = document.getElementById('hist-count');
  if (el) el.textContent = '('+state.orders.length+')';
}

// ========== MENU FLUTUANTE ==========
export function openOSMenu(e, osId) {
  e.stopPropagation();
  state.menuOsId = osId;
  const o = state.orders.find(x=>x.id===osId);
  const menu = document.getElementById('os-menu');
  document.getElementById('os-menu-id').textContent   = o.id;
  document.getElementById('os-menu-name').textContent = o.cliente.nome;
  const x = Math.min(e.clientX, window.innerWidth-220);
  const y = Math.min(e.clientY+8, window.innerHeight-200);
  menu.style.left=x+'px'; menu.style.top=y+'px'; menu.style.display='block';
}

export function closeOSMenu() {
  document.getElementById('os-menu').style.display='none';
  state.menuOsId=null;
}

export function menuPrint() {
  const id=state.menuOsId; closeOSMenu(); if(id) printOS(id);
}

export function menuChangeStatus() {
  const id = state.menuOsId;
  closeOSMenu();
  if (!id) return;
  const o = state.orders.find(x=>x.id===id);
  openStatusModal(o);
}

export async function menuDelete() {
  if (!state.menuOsId) return;
  const o   = state.orders.find(x=>x.id===state.menuOsId);
  const fid = o.firestoreId;
  const osId= state.menuOsId;
  closeOSMenu();
  if (!confirm(`Excluir ${o.id} — ${o.cliente.nome}?\nEssa ação não pode ser desfeita.`)) return;
  setLoading(true,'Excluindo OS...');
  try { await fbDeleteOrder(fid); showToast(osId+' excluída.'); }
  catch(e) { showToast('Erro ao excluir OS.'); }
  setLoading(false);
}

// ========== MODAL DE STATUS ==========
function openStatusModal(o) {
  const current = o.status||'aguardando_orcamento';
  const modal = document.getElementById('status-modal');
  document.getElementById('status-modal-os').textContent = o.id+' — '+o.cliente.nome;
  // Marca o status atual
  document.querySelectorAll('.status-opt').forEach(btn => {
    btn.classList.toggle('selected', btn.dataset.status===current);
  });
  modal.dataset.osId       = o.id;
  modal.dataset.firestoreId = o.firestoreId;
  modal.classList.add('open');
}

export function closeStatusModal() {
  document.getElementById('status-modal').classList.remove('open');
}

export async function saveStatus() {
  const modal     = document.getElementById('status-modal');
  const selected  = document.querySelector('.status-opt.selected');
  if (!selected) { alert('Selecione um status.'); return; }
  const fid    = modal.dataset.firestoreId;
  const status = selected.dataset.status;
  setLoading(true,'Atualizando status...');
  try {
    await fbUpdateOrderStatus(fid, status);
    showToast('Status atualizado!');
    closeStatusModal();
  } catch(e) { showToast('Erro ao atualizar status.'); }
  setLoading(false);
}

export function selectStatusOpt(btn) {
  document.querySelectorAll('.status-opt').forEach(b=>b.classList.remove('selected'));
  btn.classList.add('selected');
}
