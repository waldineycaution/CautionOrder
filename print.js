import { state } from './state.js';

export function printOS(osId) {
  const o = state.orders.find(x => x.id === osId);
  if (!o) return;

  const yn = v => v==='sim'?'<b style="color:#2a7a43">Sim</b>':v==='nao'?'<b style="color:#b83332">Não</b>':v==='na'?'<b style="color:#1a5fa0">N/A</b>':'—';
  const fd = d => d ? new Date(d+'T12:00:00').toLocaleDateString('pt-BR') : '—';
  const fm = n => 'R$\u00a0'+(parseFloat(n)||0).toFixed(2).replace('.',',');

  const STATUS = { aguardando_orcamento:'Aguardando Orçamento', aprovado:'Aprovado', reprovado:'Reprovado', finalizado:'Finalizado', aberta:'Aberta', concluida:'Concluída', entregue:'Entregue', cancelada:'Cancelada' };

  const pw = o.senha||{};
  const senhaInfo = pw.ativa
    ? pw.modo==='text' ? (pw.texto||'não informada')
    : pw.modo==='pattern' ? 'Padrão: '+(pw.padrao?pw.padrao.split('-').map(n=>parseInt(n)+1).join('→'):'—')
    : 'Biométrico'
    : 'Sem senha';

  const svcRows = (o.services||[]).filter(s=>s.desc).map(s=>`
    <tr><td>${s.qty}</td><td>${s.desc}</td><td style="text-align:right">${fm(s.unit)}</td><td style="text-align:right">${fm(s.total)}</td></tr>`).join('') ||
    '<tr><td colspan="4" style="color:#aaa;font-style:italic">Nenhum item</td></tr>';

  const html = `<!DOCTYPE html><html lang="pt-BR"><head><meta charset="UTF-8">
<title>${o.id}</title>
<style>
@page{size:A4 portrait;margin:0}
*{box-sizing:border-box;margin:0;padding:0;-webkit-print-color-adjust:exact;print-color-adjust:exact}
html,body{width:210mm;height:297mm;overflow:hidden}
body{font-family:Arial,sans-serif;font-size:7.5pt;color:#111;padding:7mm 7mm 5mm}

/* HEADER */
.hd{display:flex;align-items:center;border-bottom:2px solid #C47D0A;padding-bottom:4px;margin-bottom:5px}
.hd img{height:32px;width:auto;margin-right:8px}
.hd-title{font-size:12pt;font-weight:900;color:#C47D0A;letter-spacing:.05em;text-transform:uppercase;line-height:1}
.hd-sub{font-size:6pt;color:#888;text-transform:uppercase;letter-spacing:.1em}
.hd-os{margin-left:auto;text-align:right}
.hd-os .num{font-size:13pt;font-weight:900;color:#C47D0A;font-family:monospace}
.hd-os .dt{font-size:6.5pt;color:#888;font-family:monospace}

/* BLOCOS */
.row{display:grid;gap:4px;margin-bottom:4px}
.r2{grid-template-columns:1fr 1fr}
.r3{grid-template-columns:1fr 1fr 1fr}
.r4{grid-template-columns:1fr 1fr 1fr 1fr}
.r13{grid-template-columns:1fr 3fr}
.r31{grid-template-columns:3fr 1fr}
.r23{grid-template-columns:2fr 3fr}

.blk{border:1px solid #ddd;padding:4px 6px}
.ttl{font-size:6pt;font-weight:700;color:#C47D0A;letter-spacing:.12em;text-transform:uppercase;border-bottom:1px solid #f0d080;padding-bottom:2px;margin-bottom:3px}

/* CAMPOS */
.f{margin-bottom:2px}
.fl{font-size:5.5pt;font-weight:700;color:#888;text-transform:uppercase;letter-spacing:.08em;display:block;line-height:1.2}
.fv{font-size:7.5pt;color:#111;line-height:1.3}

/* CONDIÇÕES - 3 por linha */
.conds{display:grid;grid-template-columns:repeat(3,1fr);gap:2px}
.cond{display:flex;justify-content:space-between;background:#f9f9f9;border:1px solid #eee;padding:2px 5px;font-size:7pt}

/* TABELA SERVIÇOS */
table{width:100%;border-collapse:collapse}
th{background:#f5f5f5;padding:3px 5px;font-size:6.5pt;font-weight:700;color:#555;text-transform:uppercase;border-bottom:1px solid #ddd;text-align:left}
td{padding:2px 5px;border-bottom:1px solid #f5f5f5;font-size:7.5pt}

/* TOTAIS */
.tots{display:flex;flex-direction:column;align-items:flex-end;margin-top:3px;gap:1px}
.tot-row{display:flex;gap:10px;font-size:7.5pt}
.tot-row .lb{color:#888;min-width:60px;text-align:right}
.tot-row .vl{font-family:monospace;min-width:80px;text-align:right}
.tot-final{border-top:1.5px solid #C47D0A;padding-top:2px}
.tot-final .lb,.tot-final .vl{color:#C47D0A;font-weight:700}
.tot-final .vl{font-size:10pt}

/* PRÉ-APROVADO */
.preap{background:#fff8ec;border:1px solid #C47D0A;padding:3px 7px;display:flex;align-items:center;gap:8px}
.preap .lb{font-size:6pt;font-weight:700;color:#C47D0A;text-transform:uppercase;letter-spacing:.1em}
.preap .vl{font-size:10pt;font-weight:900;color:#C47D0A;font-family:monospace}

/* DISCLAIMER */
.disc{font-size:5.5pt;color:#777;line-height:1.35;font-family:monospace;border:1px solid #f0d080;background:#fffbf0;padding:3px 5px;margin:4px 0}

/* ASSINATURA */
.sigs{display:grid;grid-template-columns:1fr 1fr;gap:20mm;margin-top:5px}
.sig{border-top:1px solid #aaa;padding-top:3px;font-size:6.5pt;color:#888;text-align:center}
</style></head><body>

<!-- CABEÇALHO -->
<div class="hd">
  <img src="https://res.cloudinary.com/doo0fzoef/image/upload/v1775270575/caution-tech_egsnfy.png" onerror="this.style.display='none'">
  <div><div class="hd-title">Caution Tech</div><div class="hd-sub">Assistência Técnica · (11) 97684-8946</div></div>
  <div class="hd-os"><div class="num">${o.id}</div><div class="dt">${fd(o.dataEntrada)}</div></div>
</div>

<!-- CLIENTE + PRODUTO + ATENDIMENTO numa linha -->
<div class="row r3" style="margin-bottom:4px">
  <div class="blk" style="grid-column:span 2">
    <div class="ttl">Dados do Cliente</div>
    <div class="row r4" style="gap:3px;margin-bottom:2px">
      <div class="f" style="grid-column:span 2"><span class="fl">Nome</span><span class="fv">${o.cliente.nome||'—'}</span></div>
      <div class="f"><span class="fl">CPF</span><span class="fv">${o.cliente.cpf||'—'}</span></div>
      <div class="f"><span class="fl">Tel / Cel</span><span class="fv">${o.cliente.tel||'—'}</span></div>
    </div>
    <div class="row r4" style="gap:3px">
      <div class="f" style="grid-column:span 2"><span class="fl">Endereço</span><span class="fv">${o.cliente.end||'—'}, ${o.cliente.num||'—'} · ${o.cliente.cidade||'—'} / ${o.cliente.uf||'—'}</span></div>
      <div class="f"><span class="fl">CEP</span><span class="fv">${o.cliente.cep||'—'}</span></div>
      <div class="f"><span class="fl">E-mail</span><span class="fv">${o.cliente.email||'—'}</span></div>
    </div>
  </div>
  <div class="blk">
    <div class="ttl">Produto / Atendimento</div>
    <div class="f"><span class="fl">Produto</span><span class="fv">${o.produto.fab||'—'} ${o.produto.modelo||'—'}</span></div>
    <div class="f"><span class="fl">Tipo / Cor</span><span class="fv">${o.produto.tipo||'—'} · ${o.produto.cor||'—'}</span></div>
    <div class="f"><span class="fl">IMEI / N/S</span><span class="fv">${o.produto.imei||'—'}</span></div>
    <div class="f"><span class="fl">Técnico</span><span class="fv">${o.tecnico||'—'}</span></div>
    <div class="f"><span class="fl">Atendente</span><span class="fv">${o.atendente||'—'}</span></div>
  </div>
</div>

<!-- CONDIÇÕES + SENHA + DEFEITO -->
<div class="row r2" style="margin-bottom:4px">
  <div class="blk">
    <div class="ttl">Condições do Aparelho</div>
    <div class="conds">
      <div class="cond"><span>Liga?</span>${yn(o.condicoes?.liga)}</div>
      <div class="cond"><span>Riscos?</span>${yn(o.condicoes?.riscos)}</div>
      <div class="cond"><span>Tela trincada?</span>${yn(o.condicoes?.tela)}</div>
      <div class="cond"><span>Outra assist.?</span>${yn(o.condicoes?.assist)}</div>
      <div class="cond"><span>Acessórios?</span>${yn(o.condicoes?.acess)}</div>
      <div class="cond"><span>Carregador?</span>${yn(o.condicoes?.carregador)}</div>
    </div>
    ${o.condicoes?.obs?`<div class="f" style="margin-top:2px"><span class="fl">Obs</span><span class="fv">${o.condicoes.obs}</span></div>`:''}
  </div>
  <div class="blk">
    <div class="ttl">Senha · Defeito Declarado</div>
    <div class="row r2" style="gap:3px;margin-bottom:2px">
      <div class="f"><span class="fl">Senha</span><span class="fv">${senhaInfo}</span></div>
      <div class="f"><span class="fl">Urgência</span><span class="fv">${o.defeito?.urgencia||'Normal'}</span></div>
    </div>
    <div class="f" style="margin-bottom:2px"><span class="fl">Defeito</span><span class="fv">${o.defeito?.desc||'Não informado'}</span></div>
    <div class="f"><span class="fl">Categoria</span><span class="fv">${o.defeito?.cat||'—'}</span></div>
  </div>
</div>

<!-- PEÇAS + TOTAIS + PRÉ-APROVADO -->
<div class="blk" style="margin-bottom:4px">
  <div class="ttl">Peças e Serviços</div>
  <table>
    <thead><tr><th style="width:28px">Qtd</th><th>Descrição</th><th style="width:75px;text-align:right">Vl Unit</th><th style="width:75px;text-align:right">Vl Total</th></tr></thead>
    <tbody>${svcRows}</tbody>
  </table>
  <div style="display:flex;justify-content:space-between;align-items:flex-end;margin-top:3px">
    <div class="preap">
      <span class="lb">Valor Pré-Aprovado</span><span class="vl">${fm(o.preAprovado)}</span>
    </div>
    <div class="tots">
      <div class="tot-row"><span class="lb">Subtotal</span><span class="vl">${fm(o.subtotal)}</span></div>
      <div class="tot-row"><span class="lb">Desconto</span><span class="vl">${fm(o.desconto)}</span></div>
      <div class="tot-row tot-final"><span class="lb">Total</span><span class="vl">${fm(o.total)}</span></div>
    </div>
  </div>
</div>

<!-- CONCLUSÃO -->
<div class="blk" style="margin-bottom:4px">
  <div class="ttl">Aprovação / Conclusão</div>
  <div class="row r4" style="gap:3px;margin-bottom:2px">
    <div class="f"><span class="fl">Status</span><span class="fv">${STATUS[o.status]||o.status||'—'}</span></div>
    <div class="f"><span class="fl">Data Conclusão</span><span class="fv">${fd(o.dataConclusao)}</span></div>
    <div class="f"><span class="fl">Data Retirada</span><span class="fv">${fd(o.dataRetirada)}</span></div>
    <div class="f"><span class="fl">Laudo</span><span class="fv">${o.laudo||'—'}</span></div>
  </div>
</div>

<!-- DISCLAIMER -->
<div class="disc">Não nos responsabilizamos por dados contidos no HD, memória interna ou cartão SD. Defeito/vício oculto que não se aplique ao serviço prestado. Substituição de display corre o risco de não funcionamento do leitor de digital ou câmera frontal. Troca de tela não gera garantia em outros componentes. <b>Garantia: 90 dias (Art. 26 §IV CDC).</b></div>

<!-- ASSINATURAS -->
<div class="sigs">
  <div class="sig">Assinatura do Técnico Responsável</div>
  <div class="sig">Assinatura do Cliente</div>
</div>

<script>window.onload=()=>{window.print();window.onafterprint=()=>window.close();}<\/script>
</body></html>`;

  const w = window.open('', '_blank', 'width=900,height=700');
  w.document.write(html);
  w.document.close();
}
