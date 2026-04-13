import { state } from './state.js';
import { fbSaveTech, fbDeleteTech, createTechAccount, setUserRole, getNextTechNumber } from './firebase.js';
import { setLoading, showToast } from './ui.js';

// ========== GERAR CREDENCIAIS AUTO ==========
async function nextUserEmail() {
  const n = await getNextTechNumber();
  return `cautionuser${n}@caution.com`;
}

// ========== RENDERIZAR LISTA ==========
export function renderTechs() {
  const grid = document.getElementById('tech-grid');
  if (!grid) return;
  grid.innerHTML = '';
  state.technicians.forEach(t => {
    const initials = t.nome.split(' ').slice(0,2).map(w=>w[0]).join('').toUpperCase();
    const perfilLabel = t.perfil === 'dono' ? '👑 Dono' : '🔧 Técnico';
    const perfilColor = t.perfil === 'dono' ? '#F5A623' : '#3A8FD4';
    const card = document.createElement('div');
    card.className = 'tech-card';
    card.innerHTML = `
      <div style="display:flex;align-items:center;gap:12px">
        <div class="tech-avatar">${initials}</div>
        <div>
          <div class="tech-name">${t.nome}</div>
          <div style="display:flex;gap:6px;align-items:center;margin-top:3px">
            <span class="tech-status ${t.status}">${t.status==='ativo'?'Ativo':'Inativo'}</span>
            <span style="font-size:11px;color:${perfilColor};font-family:'IBM Plex Mono',monospace">${perfilLabel}</span>
          </div>
        </div>
      </div>
      <div class="tech-phone">📞 ${t.tel||'—'}</div>
      ${t.wpp?`<div class="tech-phone">📱 ${t.wpp}</div>`:''}
      ${t.email?`<div class="tech-phone" style="font-size:11px;color:var(--info)">✉️ ${t.email}</div>`:''}
      <div class="tech-specialty">${t.esp||'—'}</div>
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
  state.technicians.filter(t=>t.status==='ativo').forEach(t => {
    const opt = document.createElement('option');
    opt.value = t.firestoreId; opt.textContent = t.nome;
    if (cur===t.firestoreId) opt.selected=true;
    sel.appendChild(opt);
  });
}

// ========== MODAL ==========
export async function openTechModal(firestoreId=null) {
  const isNew = !firestoreId;
  document.getElementById('tech-modal-title').textContent = isNew ? 'Novo Técnico' : 'Editar Técnico';
  document.getElementById('tech-edit-id').value = firestoreId||'';

  // Bloco de credenciais: só aparece para novo técnico
  const credBlock = document.getElementById('tech-cred-block');
  if (credBlock) credBlock.style.display = isNew ? 'block' : 'none';

  if (isNew) {
    // Limpa campos
    ['tech-nome','tech-tel','tech-wpp','tech-esp'].forEach(id => { document.getElementById(id).value=''; });
    document.getElementById('tech-perfil').value  = 'tecnico';
    document.getElementById('tech-status').value  = 'ativo';
    // Pré-preenche email automático (read-only)
    const autoEmail = await nextUserEmail();
    const emailField = document.getElementById('tech-email-generated');
    if (emailField) emailField.textContent = autoEmail;
    document.getElementById('tech-email-hidden').value = autoEmail;
  } else {
    const t = state.technicians.find(x=>x.firestoreId===firestoreId);
    document.getElementById('tech-nome').value   = t.nome;
    document.getElementById('tech-tel').value    = t.tel||'';
    document.getElementById('tech-wpp').value    = t.wpp||'';
    document.getElementById('tech-esp').value    = t.esp||'';
    document.getElementById('tech-perfil').value = t.perfil||'tecnico';
    document.getElementById('tech-status').value = t.status;
  }
  document.getElementById('tech-modal').classList.add('open');
}

export function closeTechModal() {
  document.getElementById('tech-modal').classList.remove('open');
  document.getElementById('tech-cred-confirm').style.display  = 'none';
  document.getElementById('tech-form-fields').style.display   = 'block';
  document.getElementById('tech-save-btn').style.display      = '';
}

// ========== CRUD ==========
export async function saveTech() {
  const nome   = document.getElementById('tech-nome').value.trim();
  const firestoreId = document.getElementById('tech-edit-id').value;
  const isNew  = !firestoreId;
  const perfil = document.getElementById('tech-perfil').value;

  if (!nome) { alert('Informe o nome do técnico.'); return; }

  const data = {
    nome,
    tel:    document.getElementById('tech-tel').value,
    wpp:    document.getElementById('tech-wpp').value,
    esp:    document.getElementById('tech-esp').value,
    perfil,
    status: document.getElementById('tech-status').value,
  };

  if (isNew) {
    const email    = document.getElementById('tech-email-hidden').value;
    const password = '123456';
    data.email = email;

    setLoading(true, 'Criando conta de acesso...');
    try {
      const uid = await createTechAccount(email, password);
      await setUserRole(uid, perfil, email, nome);
      await fbSaveTech({ ...data, uid });
      closeTechModal();
      // Alert garantido — não pode ser perdido
      setTimeout(() => {
        alert(
          '✅ Técnico cadastrado com sucesso!\n\n' +
          '👤 Nome: ' + nome + '\n' +
          '📧 E-mail: ' + email + '\n' +
          '🔑 Senha: ' + password + '\n\n' +
          'Anote essas informações e repasse ao técnico.'
        );
      }, 300);
      showToast('Técnico cadastrado!');
    } catch(e) {
      const msgs = {
        'auth/email-already-in-use': 'Este e-mail já está em uso. Tente excluir e recriar o técnico.',
        'auth/invalid-email':        'E-mail inválido.',
        'auth/weak-password':        'Senha muito fraca.',
        'auth/operation-not-allowed': 'Autenticação por e-mail não está habilitada no Firebase.',
      };
      alert(msgs[e.code] || 'Erro ao criar conta: ' + e.message);
    }
    setLoading(false);
  } else {
    setLoading(true, 'Salvando técnico...');
    try {
      await fbSaveTech({ firestoreId, ...data });
      const t = state.technicians.find(x=>x.firestoreId===firestoreId);
      if (t?.uid) await setUserRole(t.uid, perfil, t.email||'', nome);
      closeTechModal();
      showToast('Técnico atualizado!');
    } catch(e) { showToast('Erro ao salvar técnico.'); }
    setLoading(false);
  }
}

function showCredConfirm(email, pass, nome) {
  const block = document.getElementById('tech-cred-confirm');
  if (!block) return;
  document.getElementById('cred-nome').textContent  = nome;
  document.getElementById('cred-email').textContent = email;
  document.getElementById('cred-pass').textContent  = pass;
  block.style.display = 'block';
  // Esconde o form, mostra só a confirmação
  document.getElementById('tech-form-fields').style.display = 'none';
  document.getElementById('tech-save-btn').style.display    = 'none';
}

export async function deleteTech(firestoreId) {
  if (!confirm('Remover este técnico?')) return;
  setLoading(true, 'Removendo...');
  try {
    await fbDeleteTech(firestoreId);
    showToast('Técnico removido.');
  } catch(e) { showToast('Erro ao remover técnico.'); }
  setLoading(false);
}
