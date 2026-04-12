import { state } from './state.js';

const MONTHS_PT = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];

let chartInstance = null;

// ========== RENDERIZAR DASHBOARD ==========
export function renderDashboard() {
  const now       = new Date();
  const selYear   = parseInt(document.getElementById('dash-year')?.value  || now.getFullYear());
  const selMonth  = document.getElementById('dash-month')?.value || 'all';

  // Filtra ordens pelo ano selecionado
  const yearOrders = state.orders.filter(o => {
    const d = new Date(o.created);
    return d.getFullYear() === selYear;
  });

  // Filtra por mês se necessário
  const filtered = selMonth === 'all' ? yearOrders : yearOrders.filter(o => {
    return new Date(o.created).getMonth() === parseInt(selMonth);
  });

  // Totais
  const total       = filtered.length;
  const aguardando  = filtered.filter(o=>o.status==='aguardando_orcamento').length;
  const aprovado    = filtered.filter(o=>o.status==='aprovado').length;
  const reprovado   = filtered.filter(o=>o.status==='reprovado').length;
  const finalizado  = filtered.filter(o=>o.status==='finalizado').length;
  const receitaTotal = filtered.filter(o=>o.status==='finalizado').reduce((s,o)=>s+(o.total||0),0);

  // Cards
  setCard('dash-total',      total,       '');
  setCard('dash-aguardando', aguardando,  '');
  setCard('dash-aprovado',   aprovado,    '');
  setCard('dash-reprovado',  reprovado,   '');
  setCard('dash-finalizado', finalizado,  '');
  setCard('dash-receita',    'R$ '+receitaTotal.toFixed(2).replace('.',','), '');

  // Gráfico mensal
  renderChart(yearOrders, selYear);
}

function setCard(id, val) {
  const el = document.getElementById(id);
  if (el) el.textContent = val;
}

function renderChart(yearOrders, year) {
  const canvas = document.getElementById('dash-chart');
  if (!canvas) return;

  // Monta dados por mês
  const months = Array.from({length:12}, (_,i)=>i);
  const mkData = (status) => months.map(m =>
    yearOrders.filter(o => new Date(o.created).getMonth()===m && o.status===status).length
  );

  const data = {
    labels: MONTHS_PT,
    datasets: [
      { label:'Aguardando', data: mkData('aguardando_orcamento'), backgroundColor:'rgba(58,143,212,0.7)',  borderColor:'#3A8FD4', borderWidth:1.5 },
      { label:'Aprovado',   data: mkData('aprovado'),             backgroundColor:'rgba(59,158,90,0.7)',   borderColor:'#3B9E5A', borderWidth:1.5 },
      { label:'Reprovado',  data: mkData('reprovado'),            backgroundColor:'rgba(226,75,74,0.7)',   borderColor:'#E24B4A', borderWidth:1.5 },
      { label:'Finalizado', data: mkData('finalizado'),           backgroundColor:'rgba(245,166,35,0.7)',  borderColor:'#F5A623', borderWidth:1.5 },
    ]
  };

  if (chartInstance) { chartInstance.destroy(); chartInstance=null; }

  // Load Chart.js dynamically
  if (!window.Chart) {
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js';
    script.onload = () => buildChart(canvas, data, year);
    document.head.appendChild(script);
  } else {
    buildChart(canvas, data, year);
  }
}

function buildChart(canvas, data, year) {
  chartInstance = new window.Chart(canvas, {
    type: 'bar',
    data,
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          labels: { color:'#9E9A92', font:{ family:"'IBM Plex Sans',sans-serif", size:12 } }
        },
        title: {
          display: true,
          text: 'Ordens por Mês — '+year,
          color: '#F0EDE8',
          font: { family:"'Syne',sans-serif", size:14, weight:'700' },
          padding: { bottom:16 }
        }
      },
      scales: {
        x: {
          ticks: { color:'#9E9A92' },
          grid:  { color:'rgba(46,44,40,0.8)' }
        },
        y: {
          ticks: { color:'#9E9A92', stepSize:1 },
          grid:  { color:'rgba(46,44,40,0.8)' },
          beginAtZero: true
        }
      }
    }
  });
}

// ========== POPULAR ANOS NO SELECT ==========
export function populateDashYears() {
  const sel = document.getElementById('dash-year');
  if (!sel) return;
  const now  = new Date().getFullYear();
  const years = new Set([now]);
  state.orders.forEach(o => years.add(new Date(o.created).getFullYear()));
  sel.innerHTML = '';
  [...years].sort((a,b)=>b-a).forEach(y => {
    const opt = document.createElement('option');
    opt.value = y; opt.textContent = y;
    if (y===now) opt.selected=true;
    sel.appendChild(opt);
  });
}
