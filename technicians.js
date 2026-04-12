import { state } from './state.js';
import { fbSaveTech, fbDeleteTech } from './firebase.js';
import { setLoading, showToast } from './ui.js';

// ========== RENDERIZAR LISTA ==========
export function renderTechs() {
  const grid = document.getElementById('tech-grid');
  if (!grid) return;
  grid.innerHTML = '';
  state.technicians.forEach(t => {
    const initials = t.nome.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase();
    const card = document.createElement('div');
    card.className = 'tech-card';
    card.innerHTML = `
      <div style="display:flex;align-items:center;gap:12px">
        <div class="tech-avatar">${initials}</div>
        <div>
          <div class="tech-name">${t.nome}</div>
          <span class="tech-status ${t.status}">${t.status === 'ativo' ? 'Ativo' : 'Inativo'}</span>
        </div>
      </div>
      <div class="tech-phone">📞 ${t.tel || '—'}</div>
      ${t.wpp ? `<div class="tech-phone">📱 ${t.wpp}</div>` : ''}
      <div class="tech-specialty">${t.esp || '—'}</div>
      <div class="tech-actions">
        <button class="btn btn-secondary btn-sm" onclick="editTech('${t.firestoreId}')">Editar</button>
        <button class="btn btn-danger btn-sm" onclick="deleteTech('${t.firestoreId}')">Remover</button>
      </div>
    `;
    grid.appendChild(card);
  });
}

// ========== SELECT DE TÉCNICO ==========
export function renderTechSelect() {
  const sel = document.getElementById('sel-tecnico');
  if (!sel) return;
  const cur = sel.value;
  sel.innerHTML = '<option value="">-- Selecionar técnico --</option>';
  state.technicians.filter(t => t.status === 'ativo').forEach(t => {
    const opt = document.createElement('option');
    opt.value = t.firestoreId;
    opt.textContent = t.nome;
    if (cur === t.firestoreId) opt.selected = true;
    sel.appendChild(opt);
  });
}

// ========== MODAL ==========
export function openTechModal(firestoreId = null) {
  document.getElementById('tech-modal-title').textContent = firestoreId ? 'Editar Técnico' : 'Novo Técnico';
  document.getElementById('tech-edit-id').value = firestoreId || '';
  if (firestoreId) {
    const t = state.technicians.find(x => x.firestoreId === firestoreId);
    document.getElementById('tech-nome').value = t.nome;
    document.getElementById('tech-tel').value = t.tel || '';
    document.getElementById('tech-wpp').value = t.wpp || '';
    document.getElementById('tech-esp').value = t.esp || '';
    document.getElementById('tech-status').value = t.status;
  } else {
    ['tech-nome', 'tech-tel', 'tech-wpp', 'tech-esp'].forEach(id => { document.getElementById(id).value = ''; });
    document.getElementById('tech-status').value = 'ativo';
  }
  document.getElementById('tech-modal').classList.add('open');
}

export function closeTechModal() {
  document.getElementById('tech-modal').classList.remove('open');
}

// ========== CRUD ==========
export async function saveTech() {
  const nome = document.getElementById('tech-nome').value.trim();
  if (!nome) { alert('Informe o nome do técnico.'); return; }
  const firestoreId = document.getElementById('tech-edit-id').value;
  const data = {
    nome,
    tel: document.getElementById('tech-tel').value,
    wpp: document.getElementById('tech-wpp').value,
    esp: document.getElementById('tech-esp').value,
    status: document.getElementById('tech-status').value
  };
  setLoading(true, 'Salvando técnico...');
  try {
    await fbSaveTech(firestoreId ? { firestoreId, ...data } : data);
    closeTechModal();
    showToast(firestoreId ? 'Técnico atualizado!' : 'Técnico cadastrado!');
  } catch (e) {
    showToast('Erro ao salvar técnico.');
  }
  setLoading(false);
}

export async function deleteTech(firestoreId) {
  if (!confirm('Remover este técnico?')) return;
  setLoading(true, 'Removendo técnico...');
  try {
    await fbDeleteTech(firestoreId);
    showToast('Técnico removido.');
  } catch (e) {
    showToast('Erro ao remover técnico.');
  }
  setLoading(false);
}
