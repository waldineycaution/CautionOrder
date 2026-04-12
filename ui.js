import { state } from './state.js';

// ========== LOADING ==========
export function setLoading(on, msg = 'Carregando...') {
  let el = document.getElementById('fb-loading');
  if (!el) {
    el = document.createElement('div');
    el.id = 'fb-loading';
    el.style.cssText = 'position:fixed;inset:0;background:rgba(15,14,13,0.85);z-index:500;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:12px';
    el.innerHTML = `<div style="width:36px;height:36px;border:3px solid #2E2C28;border-top-color:#F5A623;border-radius:50%;animation:spin 0.7s linear infinite"></div><div style="font-family:'IBM Plex Mono',monospace;font-size:13px;color:#9E9A92" id="fb-loading-msg"></div><style>@keyframes spin{to{transform:rotate(360deg)}}</style>`;
    document.body.appendChild(el);
  }
  el.querySelector('#fb-loading-msg').textContent = msg;
  el.style.display = on ? 'flex' : 'none';
}

// ========== TOAST ==========
let toastTimer;
export function showToast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('visible');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('visible'), 3000);
}

// ========== NAVEGAÇÃO ==========
export function showPage(name) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
  document.querySelectorAll('.mobile-nav-btn').forEach(b => b.classList.remove('active'));
  document.getElementById('page-' + name).classList.add('active');
  const map = { 'nova-os': [0, 'mob-nova'], 'tecnicos': [1, 'mob-tec'], 'historico': [2, 'mob-hist'] };
  if (map[name]) {
    document.querySelectorAll('.nav-btn')[map[name][0]].classList.add('active');
    document.getElementById(map[name][1]).classList.add('active');
  }
  window.scrollTo(0, 0);
  document.getElementById('page-' + name).scrollTop = 0;
  if (name === 'historico') window.renderHistory();
}

// ========== CONDIÇÕES ==========
export function setCondition(btn, field, val) {
  btn.closest('.cond-btns').querySelectorAll('.cond-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  state.conditions[field] = val;
}

// ========== SENHA ==========
export function toggleSenha() {
  state.senhaActive = !state.senhaActive;
  document.getElementById('senha-toggle').classList.toggle('on', state.senhaActive);
  document.getElementById('senha-section').classList.toggle('visible', state.senhaActive);
}

export function setPwMode(mode) {
  state.pwMode = mode;
  document.querySelectorAll('.pw-tab').forEach((t, i) => {
    t.classList.toggle('active', ['text', 'pattern', 'none'][i] === mode);
  });
  document.getElementById('pw-text-wrap').classList.toggle('visible', mode === 'text');
  document.getElementById('pw-pattern-wrap').classList.toggle('visible', mode === 'pattern');
  document.getElementById('pw-none-wrap').classList.toggle('visible', mode === 'none');
}

// ========== PADRÃO DE TOQUE ==========
export function initPatternGrid() {
  const grid = document.getElementById('pattern-grid');
  for (let i = 0; i < 9; i++) {
    const dot = document.createElement('div');
    dot.className = 'pattern-dot';
    dot.dataset.idx = i;
    const inner = document.createElement('div');
    inner.className = 'dot-inner';
    inner.id = 'pdot-' + i;
    dot.appendChild(inner);
    dot.addEventListener('click', () => activateDot(i));
    dot.addEventListener('touchstart', (e) => { e.preventDefault(); activateDot(i); }, { passive: false });
    grid.insertBefore(dot, document.getElementById('pattern-canvas'));
  }
}

function activateDot(idx) {
  if (state.patternSequence.includes(idx)) return;
  state.patternSequence.push(idx);
  document.getElementById('pdot-' + idx).classList.add('active');
  drawPatternLines();
  document.getElementById('pattern-display').textContent = 'Padrão: ' + state.patternSequence.map(n => n + 1).join(' → ');
}

function drawPatternLines() {
  const canvas = document.getElementById('pattern-canvas');
  const grid = document.getElementById('pattern-grid');
  canvas.width = grid.offsetWidth;
  canvas.height = grid.offsetHeight;
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  if (state.patternSequence.length < 2) return;
  ctx.strokeStyle = '#F5A623';
  ctx.lineWidth = 2;
  ctx.globalAlpha = 0.6;
  ctx.beginPath();
  const dots = grid.querySelectorAll('.pattern-dot');
  for (let i = 0; i < state.patternSequence.length; i++) {
    const dot = dots[state.patternSequence[i]];
    const r = dot.getBoundingClientRect(), gr = grid.getBoundingClientRect();
    const x = r.left - gr.left + r.width / 2;
    const y = r.top - gr.top + r.height / 2;
    i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
  }
  ctx.stroke();
}

export function clearPattern() {
  state.patternSequence = [];
  document.querySelectorAll('.dot-inner').forEach(d => d.classList.remove('active'));
  const canvas = document.getElementById('pattern-canvas');
  canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height);
  document.getElementById('pattern-display').textContent = 'Padrão: —';
}

// ========== TABELA DE SERVIÇOS ==========
export function addServiceRow() {
  const tbody = document.getElementById('services-body');
  const tr = document.createElement('tr');
  tr.innerHTML = `
    <td><input type="number" class="qty" min="1" value="1" inputmode="numeric" oninput="calcRow(this)"></td>
    <td><input type="text" class="desc" placeholder="Serviço ou peça..."></td>
    <td><input type="number" class="unit-price currency" placeholder="0,00" min="0" step="0.01" inputmode="decimal" oninput="calcRow(this)"></td>
    <td><input type="number" class="row-total currency" readonly placeholder="0,00"></td>
    <td><button class="remove-row-btn" onclick="removeRow(this)">×</button></td>
  `;
  tbody.appendChild(tr);
}

export function calcRow(input) {
  const row = input.closest('tr');
  const qty = parseFloat(row.querySelector('.qty').value) || 0;
  const unit = parseFloat(row.querySelector('.unit-price').value) || 0;
  row.querySelector('.row-total').value = (qty * unit).toFixed(2);
  calcTotals();
}

export function removeRow(btn) {
  btn.closest('tr').remove();
  calcTotals();
}

export function calcTotals() {
  let sub = 0;
  document.querySelectorAll('#services-body .row-total').forEach(i => { sub += parseFloat(i.value) || 0; });
  const disc = parseFloat(document.getElementById('discount-input').value) || 0;
  const total = Math.max(0, sub - disc);
  document.getElementById('subtotal-display').textContent = 'R$ ' + sub.toFixed(2).replace('.', ',');
  document.getElementById('total-display').textContent = 'R$ ' + total.toFixed(2).replace('.', ',');
}

// ========== HELPER ==========
export function v(id) {
  return document.getElementById(id)?.value || '';
}
