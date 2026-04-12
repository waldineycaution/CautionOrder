import { state } from './state.js';

const MONTHS_PT = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];
let chartInstance = null;
let chartLoaded   = false;

// ========== ENTRY POINT ==========
export function renderDashboard() {
  const now      = new Date();
  const selYear  = parseInt(document.getElementById('dash-year')?.value  || now.getFullYear());
  const selMonth = document.getElementById('dash-month')?.value || 'all';

  const yearOrders = state.orders.filter(o => new Date(o.created).getFullYear() === selYear);
  const filtered   = selMonth === 'all' ? yearOrders
    : yearOrders.filter(o => new Date(o.created).getMonth() === parseInt(selMonth));

  const total      = filtered.length;
  const aguardando = filtered.filter(o => o.status === 'aguardando_orcamento').length;
  const aprovado   = filtered.filter(o => o.status === 'aprovado').length;
  const reprovado  = filtered.filter(o => o.status === 'reprovado').length;
  const finalizado = filtered.filter(o => o.status === 'finalizado').length;
  const receitaFin = filtered.filter(o => o.status === 'finalizado').reduce((s,o) => s + (parseFloat(o.total)||0), 0);
  const receitaApr = filtered.filter(o => o.status === 'aprovado').reduce((s,o) => s + (parseFloat(o.total)||0), 0);
  const taxaConv   = total > 0 ? Math.round((finalizado / total) * 100) : 0;

  // ---- Cards ----
  animateCard('dash-total',      total);
  animateCard('dash-aguardando', aguardando);
  animateCard('dash-aprovado',   aprovado);
  animateCard('dash-reprovado',  reprovado);
  animateCard('dash-finalizado', finalizado);
  animateCard('dash-conv',       taxaConv, '%');
  setText('dash-receita', fmtR(receitaFin));
  setText('dash-orcado',  fmtR(receitaApr));

  // ---- Sparkbars nas cards ----
  updateSparkbar('spark-aguardando', aguardando, total);
  updateSparkbar('spark-aprovado',   aprovado,   total);
  updateSparkbar('spark-reprovado',  reprovado,  total);
  updateSparkbar('spark-finalizado', finalizado, total);

  // ---- Gráfico ----
  if (!chartLoaded) {
    const s = document.createElement('script');
    s.src = 'https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js';
    s.onload = () => { chartLoaded = true; buildChart(yearOrders); };
    document.head.appendChild(s);
  } else {
    buildChart(yearOrders);
  }

  // ---- Lista recentes ----
  renderRecent(filtered);
}

function fmtR(n) {
  return 'R$ ' + n.toFixed(2).replace('.', ',');
}

function setText(id, val) {
  const el = document.getElementById(id);
  if (el) el.textContent = val;
}

function animateCard(id, target, suffix = '') {
  const el = document.getElementById(id);
  if (!el) return;
  const start = parseInt(el.textContent) || 0;
  const diff  = target - start;
  if (diff === 0) { el.textContent = target + suffix; return; }
  const steps = 20;
  let i = 0;
  const timer = setInterval(() => {
    i++;
    el.textContent = Math.round(start + diff * (i / steps)) + suffix;
    if (i >= steps) clearInterval(timer);
  }, 20);
}

function updateSparkbar(id, val, total) {
  const el = document.getElementById(id);
  if (!el) return;
  const pct = total > 0 ? Math.round((val / total) * 100) : 0;
  el.style.width = pct + '%';
}

// ========== GRÁFICO ==========
function buildChart(yearOrders) {
  const canvas = document.getElementById('dash-chart');
  if (!canvas || !window.Chart) return;
  if (chartInstance) { chartInstance.destroy(); chartInstance = null; }

  const mkData = (status) => MONTHS_PT.map((_, m) =>
    yearOrders.filter(o => new Date(o.created).getMonth() === m && o.status === status).length
  );

  chartInstance = new window.Chart(canvas, {
    type: 'bar',
    data: {
      labels: MONTHS_PT,
      datasets: [
        { label: 'Aguardando', data: mkData('aguardando_orcamento'), backgroundColor: 'rgba(58,143,212,0.75)',  borderRadius: 4, borderSkipped: false },
        { label: 'Aprovado',   data: mkData('aprovado'),             backgroundColor: 'rgba(59,158,90,0.75)',   borderRadius: 4, borderSkipped: false },
        { label: 'Reprovado',  data: mkData('reprovado'),            backgroundColor: 'rgba(226,75,74,0.75)',   borderRadius: 4, borderSkipped: false },
        { label: 'Finalizado', data: mkData('finalizado'),           backgroundColor: 'rgba(245,166,35,0.9)',   borderRadius: 4, borderSkipped: false },
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      animation: { duration: 600, easing: 'easeOutQuart' },
      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            color: '#9E9A92',
            font: { family: "'IBM Plex Sans', sans-serif", size: 11 },
            boxWidth: 10, boxHeight: 10, borderRadius: 3, padding: 16,
            usePointStyle: true, pointStyle: 'rectRounded'
          }
        },
        tooltip: {
          backgroundColor: '#1A1916',
          borderColor: '#3D3A34',
          borderWidth: 1,
          titleColor: '#F0EDE8',
          bodyColor: '#9E9A92',
          padding: 10,
          cornerRadius: 8,
        }
      },
      scales: {
        x: {
          stacked: false,
          ticks:   { color: '#5C5952', font: { size: 11 } },
          grid:    { color: 'rgba(46,44,40,0.5)', lineWidth: 0.5 },
          border:  { color: 'rgba(46,44,40,0.5)' }
        },
        y: {
          ticks:       { color: '#5C5952', font: { size: 11 }, stepSize: 1 },
          grid:        { color: 'rgba(46,44,40,0.5)', lineWidth: 0.5 },
          border:      { dash: [4, 4], color: 'transparent' },
          beginAtZero: true
        }
      }
    }
  });
}

// ========== LISTA DE RECENTES ==========
function renderRecent(filtered) {
  const container = document.getElementById('dash-recent');
  if (!container) return;
  const recent = [...filtered]
    .sort((a, b) => new Date(b.created) - new Date(a.created))
    .slice(0, 6);
  if (recent.length === 0) {
    container.innerHTML = '<div style="color:var(--text3);font-size:13px;padding:16px;text-align:center">Nenhuma OS no período</div>';
    return;
  }
  const statusColor = { aguardando_orcamento:'#3A8FD4', aprovado:'#3B9E5A', reprovado:'#E24B4A', finalizado:'#F5A623' };
  const statusLabel = { aguardando_orcamento:'Aguardando', aprovado:'Aprovado', reprovado:'Reprovado', finalizado:'Finalizado' };
  container.innerHTML = recent.map(o => `
    <div style="display:flex;align-items:center;gap:12px;padding:10px 0;border-bottom:1px solid var(--border)">
      <div style="width:6px;height:6px;border-radius:50%;background:${statusColor[o.status]||'#5C5952'};flex-shrink:0"></div>
      <div style="flex:1;min-width:0">
        <div style="font-size:13px;color:var(--text);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${o.cliente.nome}</div>
        <div style="font-size:11px;color:var(--text3);font-family:'IBM Plex Mono',monospace">${o.id} · ${o.produto?.modelo||'—'}</div>
      </div>
      <div style="text-align:right;flex-shrink:0">
        <div style="font-size:11px;color:${statusColor[o.status]||'#5C5952'};font-family:'IBM Plex Mono',monospace;font-weight:600">${statusLabel[o.status]||o.status}</div>
        <div style="font-size:12px;color:var(--amber);font-family:'IBM Plex Mono',monospace">R$ ${(o.total||0).toFixed(2).replace('.',',')}</div>
      </div>
    </div>
  `).join('');
}

// ========== ANOS NO SELECT ==========
export function populateDashYears() {
  const sel = document.getElementById('dash-year');
  if (!sel) return;
  const now = new Date().getFullYear();
  const years = new Set([now]);
  state.orders.forEach(o => years.add(new Date(o.created).getFullYear()));
  sel.innerHTML = '';
  [...years].sort((a, b) => b - a).forEach(y => {
    const opt = document.createElement('option');
    opt.value = y; opt.textContent = y;
    if (y === now) opt.selected = true;
    sel.appendChild(opt);
  });
}
