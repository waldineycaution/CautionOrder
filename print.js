import { state } from './state.js';

export function printOS(osId) {
  const o = state.orders.find(x => x.id === osId);
  if (!o) return;

  const condLabel = (v) =>
    v === 'sim' ? '<span style="color:#2a7a43;font-weight:600">Sim</span>' :
    v === 'nao' ? '<span style="color:#b83332;font-weight:600">Não</span>' :
    v === 'na'  ? '<span style="color:#1a5fa0;font-weight:600">N/A</span>' : '—';

  const fmtDate   = (d) => d ? new Date(d + 'T12:00:00').toLocaleDateString('pt-BR') : '—';
  const fmtMoney  = (n) => 'R$ ' + (parseFloat(n) || 0).toFixed(2).replace('.', ',');

  const statusLabel = {
    aberta: 'Aberta', aguardando: 'Aguardando Peça', em_andamento: 'Em andamento',
    concluida: 'Concluída', entregue: 'Entregue', cancelada: 'Cancelada'
  };

  const serviceRows = (o.services || []).map(s => `
    <tr>
      <td style="padding:6px 8px;border-bottom:1px solid #eee;text-align:center">${s.qty}</td>
      <td style="padding:6px 8px;border-bottom:1px solid #eee">${s.desc}</td>
      <td style="padding:6px 8px;border-bottom:1px solid #eee;text-align:right;font-family:monospace">${fmtMoney(s.unit)}</td>
      <td style="padding:6px 8px;border-bottom:1px solid #eee;text-align:right;font-family:monospace">${fmtMoney(s.total)}</td>
    </tr>`).join('');

  const pw = o.senha || {};
  let senhaInfo = '—';
  if (pw.ativa) {
    if (pw.modo === 'text')    senhaInfo = pw.texto || '(não informada)';
    else if (pw.modo === 'pattern') senhaInfo = 'Padrão: ' + (pw.padrao ? pw.padrao.split('-').map(n => parseInt(n) + 1).join(' → ') : '—');
    else if (pw.modo === 'none')    senhaInfo = 'Biométrico (Face ID / Digital)';
  } else {
    senhaInfo = 'Sem senha';
  }

  const html = `<!DOCTYPE html><html lang="pt-BR"><head><meta charset="UTF-8">
<title>${o.id} — Caution Tech</title>
<style>
  @page{size:A4;margin:0}
  *{box-sizing:border-box;margin:0;padding:0}
  body{font-family:'Segoe UI',Arial,sans-serif;font-size:10pt;color:#111;background:#fff;padding:12mm 10mm}
  .page-header{display:flex;align-items:center;gap:14px;border-bottom:2.5px solid #C47D0A;padding-bottom:10px;margin-bottom:14px}
  .page-header img{height:48px;width:auto}
  .page-header h1{font-size:18pt;font-weight:800;color:#C47D0A;letter-spacing:0.06em;text-transform:uppercase;margin:0;line-height:1.1}
  .page-header p{font-size:8pt;color:#888;letter-spacing:0.1em;text-transform:uppercase;margin-top:2px}
  .os-ref{margin-left:auto;text-align:right}
  .os-ref .num{font-size:18pt;font-weight:700;color:#C47D0A;font-family:monospace}
  .os-ref .date{font-size:8.5pt;color:#888;font-family:monospace}
  .section{margin-bottom:10px;page-break-inside:avoid;break-inside:avoid}
  .section-title{font-size:8pt;font-weight:700;letter-spacing:0.15em;text-transform:uppercase;color:#C47D0A;margin-bottom:6px;border-bottom:1px solid #f0d080;padding-bottom:3px}
  .card{border:1px solid #ddd;border-radius:5px;padding:9px 11px;background:#fff}
  .grid{display:grid;gap:8px}
  .g2{grid-template-columns:1fr 1fr}.g3{grid-template-columns:1fr 1fr 1fr}.g4{grid-template-columns:1fr 1fr 1fr 1fr}
  .field label{display:block;font-size:7.5pt;font-weight:600;color:#888;letter-spacing:0.1em;text-transform:uppercase;margin-bottom:2px}
  .field span{font-size:10pt;color:#111}
  .cond-grid{display:grid;grid-template-columns:1fr 1fr;gap:6px}
  .cond-item{display:flex;justify-content:space-between;align-items:center;background:#f9f9f9;border:1px solid #eee;border-radius:4px;padding:5px 9px;font-size:9.5pt}
  table.srv{width:100%;border-collapse:collapse}
  table.srv th{background:#f5f5f5;padding:7px 8px;text-align:left;font-size:8.5pt;font-weight:600;color:#555;letter-spacing:0.08em;text-transform:uppercase;border-bottom:1.5px solid #ddd}
  .totals{display:flex;flex-direction:column;align-items:flex-end;margin-top:8px;gap:4px}
  .totals .row{display:flex;gap:20px;font-size:10pt}
  .totals .row .lbl{color:#888;min-width:80px;text-align:right}
  .totals .row .val{font-family:monospace;min-width:100px;text-align:right}
  .total-final{border-top:2px solid #C47D0A;padding-top:6px;margin-top:2px}
  .total-final .lbl{color:#C47D0A;font-weight:700}
  .total-final .val{color:#C47D0A;font-weight:700;font-size:14pt}
  .pre-ap{background:#fff8ec;border:1px solid #C47D0A;border-radius:5px;padding:8px 12px;display:flex;align-items:center;gap:12px;margin-bottom:10px}
  .pre-ap label{font-size:8pt;font-weight:700;color:#C47D0A;letter-spacing:0.12em;text-transform:uppercase}
  .pre-ap span{font-size:14pt;font-weight:700;color:#C47D0A;font-family:monospace}
  .disclaimer{background:#fffbf0;border:1px solid #f0d080;border-radius:5px;padding:8px 11px;font-size:7.5pt;color:#666;line-height:1.5;margin-bottom:10px;font-family:monospace}
  .sign-row{display:grid;grid-template-columns:1fr 1fr;gap:20px;margin-top:16px}
  .sign-box{border-top:1px solid #ccc;padding-top:6px;font-size:8.5pt;color:#888;text-align:center}
</style></head><body>

<div class="page-header">
  <img src="https://res.cloudinary.com/doo0fzoef/image/upload/v1775270575/caution-tech_egsnfy.png" alt="Caution Tech" onerror="this.style.display='none'">
  <div><h1>Caution Tech</h1><p>Assistência Técnica · (11) 97684-8946</p></div>
  <div class="os-ref">
    <div class="num">${o.id}</div>
    <div class="date">${o.dataEntrada ? fmtDate(o.dataEntrada) : new Date(o.created).toLocaleDateString('pt-BR')}</div>
  </div>
</div>

<div class="section"><div class="section-title">Dados do Cliente</div><div class="card">
  <div class="grid g2" style="margin-bottom:8px"><div class="field" style="grid-column:span 2"><label>Nome</label><span>${o.cliente.nome || '—'}</span></div></div>
  <div class="grid g4" style="margin-bottom:8px">
    <div class="field" style="grid-column:span 3"><label>Endereço</label><span>${o.cliente.end || '—'}</span></div>
    <div class="field"><label>Nº</label><span>${o.cliente.num || '—'}</span></div>
  </div>
  <div class="grid g4" style="margin-bottom:8px">
    <div class="field" style="grid-column:span 2"><label>Cidade</label><span>${o.cliente.cidade || '—'}</span></div>
    <div class="field"><label>UF</label><span>${o.cliente.uf || '—'}</span></div>
    <div class="field"><label>CEP</label><span>${o.cliente.cep || '—'}</span></div>
  </div>
  <div class="grid g3" style="margin-bottom:8px">
    <div class="field"><label>Telefone</label><span>${o.cliente.tel || '—'}</span></div>
    <div class="field"><label>Celular</label><span>${o.cliente.cel || '—'}</span></div>
    <div class="field"><label>E-mail</label><span>${o.cliente.email || '—'}</span></div>
  </div>
  <div class="grid g2">
    <div class="field"><label>RG</label><span>${o.cliente.rg || '—'}</span></div>
    <div class="field"><label>CPF</label><span>${o.cliente.cpf || '—'}</span></div>
  </div>
</div></div>

<div class="grid g2" style="gap:10px;margin-bottom:10px">
  <div class="section" style="margin:0"><div class="section-title">Atendimento</div><div class="card">
    <div class="grid g2" style="margin-bottom:8px">
      <div class="field"><label>Técnico</label><span>${o.tecnico || '—'}</span></div>
      <div class="field"><label>Atendente</label><span>${o.atendente || '—'}</span></div>
    </div>
    <div class="field"><label>Data de Entrada</label><span>${fmtDate(o.dataEntrada)}</span></div>
  </div></div>
  <div class="section" style="margin:0"><div class="section-title">Produto para Reparo</div><div class="card">
    <div class="grid g2" style="margin-bottom:8px">
      <div class="field"><label>Tipo</label><span>${o.produto.tipo || '—'}</span></div>
      <div class="field"><label>Fabricante</label><span>${o.produto.fab || '—'}</span></div>
    </div>
    <div class="grid g3">
      <div class="field"><label>Modelo</label><span>${o.produto.modelo || '—'}</span></div>
      <div class="field"><label>IMEI/N/S</label><span>${o.produto.imei || '—'}</span></div>
      <div class="field"><label>Cor</label><span>${o.produto.cor || '—'}</span></div>
    </div>
  </div></div>
</div>

<div class="section"><div class="section-title">Condições Gerais do Aparelho</div><div class="card">
  <div class="cond-grid" style="margin-bottom:8px">
    <div class="cond-item"><span>Aparelho liga?</span>${condLabel(o.condicoes?.liga)}</div>
    <div class="cond-item"><span>Riscos / avarias?</span>${condLabel(o.condicoes?.riscos)}</div>
    <div class="cond-item"><span>Tela trincada?</span>${condLabel(o.condicoes?.tela)}</div>
    <div class="cond-item"><span>Outra assistência?</span>${condLabel(o.condicoes?.assist)}</div>
    <div class="cond-item"><span>Acessórios entregues?</span>${condLabel(o.condicoes?.acess)}</div>
    <div class="cond-item"><span>Carregador entregue?</span>${condLabel(o.condicoes?.carregador)}</div>
  </div>
  <div class="field"><label>Outras observações</label><span>${o.condicoes?.obs || 'Nenhuma'}</span></div>
</div></div>

<div class="grid g2" style="gap:10px;margin-bottom:10px">
  <div class="section" style="margin:0"><div class="section-title">Senha do Aparelho</div>
    <div class="card"><div class="field"><label>Informação</label><span>${senhaInfo}</span></div></div>
  </div>
  <div class="section" style="margin:0"><div class="section-title">Defeito Declarado</div><div class="card">
    <div class="field" style="margin-bottom:6px"><label>Descrição</label><span>${o.defeito?.desc || 'Não informado'}</span></div>
    <div class="grid g2">
      <div class="field"><label>Categoria</label><span>${o.defeito?.cat || '—'}</span></div>
      <div class="field"><label>Urgência</label><span>${o.defeito?.urgencia || 'Normal'}</span></div>
    </div>
  </div></div>
</div>

<div class="section"><div class="section-title">Peças e Serviços</div><div class="card">
  <table class="srv">
    <thead><tr>
      <th style="width:50px">Qtd</th><th>Descrição</th>
      <th style="width:120px;text-align:right">Vl Unit</th>
      <th style="width:120px;text-align:right">Vl Total</th>
    </tr></thead>
    <tbody>${serviceRows || '<tr><td colspan="4" style="padding:10px 8px;color:#bbb;text-align:center;font-style:italic">Nenhum item registrado</td></tr>'}</tbody>
  </table>
  <div class="totals">
    <div class="row"><span class="lbl">Subtotal</span><span class="val">${fmtMoney(o.subtotal)}</span></div>
    <div class="row"><span class="lbl">Desconto</span><span class="val">${fmtMoney(o.desconto)}</span></div>
    <div class="row total-final"><span class="lbl">Total</span><span class="val">${fmtMoney(o.total)}</span></div>
  </div>
</div></div>

<div class="pre-ap"><label>Valor Pré-Aprovado R$</label><span>${fmtMoney(o.preAprovado)}</span></div>

<div class="disclaimer">NÃO NOS RESPONSABILIZAMOS POR DADOS CONTIDOS NO HD, MEMÓRIA INTERNA OU CARTÃO SD. DEFEITO/VÍCIO OCULTO QUE NÃO SE APLIQUE AO SERVIÇO PRESTADO. SUBSTITUIÇÃO DE DISPLAY CORRE O RISCO DE NÃO FUNCIONAMENTO DO LEITOR DE DIGITAL OU CÂMERA FRONTAL. TROCA DE TELA NÃO GERA GARANTIA EM OUTROS COMPONENTES. PRODUTO QUE CHEGOU NA LOJA SEM LIGAR SUJEITO A ANÁLISE PRÉVIA.<br>
Peças e serviços comercializados com <strong>90 dias de garantia</strong> para reparo no balcão (conforme Art. 26, Seção IV do Código de Defesa do Consumidor).</div>

<div class="section"><div class="section-title">Aprovação / Conclusão</div><div class="card">
  <div class="grid g3" style="margin-bottom:8px">
    <div class="field"><label>Status</label><span>${statusLabel[o.status] || o.status || '—'}</span></div>
    <div class="field"><label>Data Conclusão</label><span>${fmtDate(o.dataConclusao)}</span></div>
    <div class="field"><label>Data Retirada</label><span>${fmtDate(o.dataRetirada)}</span></div>
  </div>
  <div class="field"><label>Laudo Técnico</label><span>${o.laudo || 'Não preenchido'}</span></div>
</div></div>

<div class="sign-row">
  <div class="sign-box">Assinatura do Técnico Responsável<br><br><br></div>
  <div class="sign-box">Assinatura do Cliente<br><br><br></div>
</div>

<script>window.onload=()=>{window.print();window.onafterprint=()=>window.close();}<\/script>
</body></html>`;

  const w = window.open('', '_blank', 'width=900,height=700');
  w.document.write(html);
  w.document.close();
}
