import html2pdf from 'html2pdf.js';

const formatCurrency = (value) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0);

export const gerarDemonstrativoPDF = (lancamentos, config, lojaConfig) => {
  const { ano, periodo } = config;
  
  // 1. Filtrar lançamentos (Apenas pagos/recebidos do Ano selecionado)
  const lancamentosAno = lancamentos.filter(l => {
    if (!l.vencimento || (l.status !== 'pago' && l.status !== 'parcial')) return false;
    return l.vencimento.startsWith(ano);
  });

  let totalEntradas = 0;
  let totalSaidas = 0;

  // 2. Agrupar por Categoria e por Mês
  const resumoCategorias = {};
  const resumoMensal = Array.from({ length: 12 }, () => ({ entradas: 0, saidas: 0 }));
  const nomesMeses = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

  lancamentosAno.forEach(l => {
    const valor = Number(l.valor_pago || 0);
    const cat = l.categoria || 'Outros';
    const mesIndex = parseInt(l.vencimento.split('-')[1], 10) - 1;

    // Categorias
    if (!resumoCategorias[cat]) resumoCategorias[cat] = { receitas: 0, despesas: 0 };
    
    if (l.tipo === 'receita') {
      totalEntradas += valor;
      resumoCategorias[cat].receitas += valor;
      if(mesIndex >= 0 && mesIndex < 12) resumoMensal[mesIndex].entradas += valor;
    } else {
      totalSaidas += valor;
      resumoCategorias[cat].despesas += valor;
      if(mesIndex >= 0 && mesIndex < 12) resumoMensal[mesIndex].saidas += valor;
    }
  });

  const saldo = totalEntradas - totalSaidas;
  const corBase = lojaConfig?.cor_orcamento || '#0f172a';
  const nomeLoja = lojaConfig?.nome_loja || 'MINHA EMPRESA';
  const dataGeracao = new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });

  // 3. Montar Linhas HTML (Categorias)
  const linhasCategoriaHTML = Object.keys(resumoCategorias).sort().map(cat => `
    <tr style="border-bottom: 1px solid #f1f5f9;">
      <td style="padding: 8px 12px; font-size: 10px; color: #475569; font-weight: 600; text-transform: uppercase;">${cat}</td>
      <td style="padding: 8px 12px; font-size: 10px; color: #059669; text-align: right; font-weight: 500;">${formatCurrency(resumoCategorias[cat].receitas)}</td>
      <td style="padding: 8px 12px; font-size: 10px; color: #e11d48; text-align: right; font-weight: 500;">${formatCurrency(resumoCategorias[cat].despesas)}</td>
      <td style="padding: 8px 12px; font-size: 10px; color: #0f172a; text-align: right; font-weight: bold;">${formatCurrency(resumoCategorias[cat].receitas - resumoCategorias[cat].despesas)}</td>
    </tr>
  `).join('');

  // 4. Montar Linhas HTML (Mensal)
  const linhasMensalHTML = resumoMensal.map((m, idx) => {
    if (m.entradas === 0 && m.saidas === 0) return '';
    return `
      <tr style="border-bottom: 1px solid #f1f5f9;">
        <td style="padding: 8px 12px; font-size: 10px; color: #475569; font-weight: 600; text-transform: uppercase;">${nomesMeses[idx]}</td>
        <td style="padding: 8px 12px; font-size: 10px; color: #059669; text-align: right; font-weight: 500;">${formatCurrency(m.entradas)}</td>
        <td style="padding: 8px 12px; font-size: 10px; color: #e11d48; text-align: right; font-weight: 500;">${formatCurrency(m.saidas)}</td>
        <td style="padding: 8px 12px; font-size: 10px; color: #0f172a; text-align: right; font-weight: bold;">${formatCurrency(m.entradas - m.saidas)}</td>
      </tr>
    `;
  }).join('');

  // 5. Construir o HTML Final
  const htmlContent = `
    <div style="font-family: 'Inter', sans-serif; padding: 15mm; width: 210mm; box-sizing: border-box; background: white;">
      
      <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid ${corBase}; padding-bottom: 20px; margin-bottom: 25px;">
        <div style="display: flex; align-items: center; gap: 15px;">
          ${lojaConfig?.logo_url ? `<img src="${lojaConfig.logo_url}" style="height: 50px; width: 50px; object-fit: contain; border-radius: 6px;">` : ''}
          <div>
            <h1 style="margin: 0; font-size: 18px; font-weight: bold; color: ${corBase}; text-transform: uppercase; letter-spacing: -0.5px;">${nomeLoja}</h1>
            <p style="margin: 2px 0 0; font-size: 9px; color: #64748b; font-weight: 500; text-transform: uppercase; tracking-widest;">CNPJ: ${lojaConfig?.cnpj || 'Não informado'}</p>
          </div>
        </div>
        <div style="text-align: right;">
          <h2 style="margin: 0; font-size: 14px; color: #1e293b; font-weight: 800; text-transform: uppercase; letter-spacing: 1px;">DEMONSTRATIVO ${periodo}</h2>
          <p style="margin: 4px 0 0; font-size: 12px; font-weight: bold; color: ${corBase};">Exercício: ${ano}</p>
        </div>
      </div>

      <div style="display: flex; gap: 15px; margin-bottom: 30px;">
        <div style="flex: 1; background: #f8fafc; border: 1px solid #e2e8f0; border-left: 4px solid #10b981; padding: 12px; border-radius: 6px;">
          <p style="margin: 0 0 4px 0; font-size: 8px; color: #64748b; text-transform: uppercase; font-weight: 700; letter-spacing: 1px;">Receitas Operacionais</p>
          <h3 style="margin: 0; font-size: 18px; color: #065f46;">${formatCurrency(totalEntradas)}</h3>
        </div>
        <div style="flex: 1; background: #f8fafc; border: 1px solid #e2e8f0; border-left: 4px solid #f43f5e; padding: 12px; border-radius: 6px;">
          <p style="margin: 0 0 4px 0; font-size: 8px; color: #64748b; text-transform: uppercase; font-weight: 700; letter-spacing: 1px;">Custos e Despesas</p>
          <h3 style="margin: 0; font-size: 18px; color: #9f1239;">${formatCurrency(totalSaidas)}</h3>
        </div>
        <div style="flex: 1; background: ${saldo >= 0 ? '#eff6ff' : '#fff1f2'}; border: 1px solid ${saldo >= 0 ? '#bfdbfe' : '#fecdd3'}; border-left: 4px solid ${saldo >= 0 ? '#3b82f6' : '#e11d48'}; padding: 12px; border-radius: 6px;">
          <p style="margin: 0 0 4px 0; font-size: 8px; color: ${saldo >= 0 ? '#1e40af' : '#9f1239'}; text-transform: uppercase; font-weight: 700; letter-spacing: 1px;">Resultado Líquido</p>
          <h3 style="margin: 0; font-size: 18px; color: ${saldo >= 0 ? '#1d4ed8' : '#be123c'};">${formatCurrency(saldo)}</h3>
        </div>
      </div>

      <div style="display: flex; gap: 20px;">
        <div style="flex: 1;">
          <h3 style="font-size: 10px; font-weight: 800; color: #475569; text-transform: uppercase; margin-bottom: 10px; letter-spacing: 1px;">Análise por Categoria</h3>
          <table style="width: 100%; border-collapse: collapse; border: 1px solid #e2e8f0; border-radius: 6px; overflow: hidden;">
            <thead>
              <tr style="background-color: #f8fafc; border-bottom: 2px solid #e2e8f0;">
                <th style="padding: 8px 12px; font-size: 8px; font-weight: 700; text-transform: uppercase; color: #64748b; text-align: left;">Categoria</th>
                <th style="padding: 8px 12px; font-size: 8px; font-weight: 700; text-transform: uppercase; color: #64748b; text-align: right;">Entradas</th>
                <th style="padding: 8px 12px; font-size: 8px; font-weight: 700; text-transform: uppercase; color: #64748b; text-align: right;">Saídas</th>
                <th style="padding: 8px 12px; font-size: 8px; font-weight: 700; text-transform: uppercase; color: #64748b; text-align: right;">Saldo</th>
              </tr>
            </thead>
            <tbody style="background: white;">
              ${linhasCategoriaHTML || `<tr><td colspan="4" style="padding: 12px; text-align: center; font-size: 9px; color: #94a3b8; text-transform: uppercase;">Sem dados neste período</td></tr>`}
            </tbody>
          </table>
        </div>

        <div style="flex: 1;">
          <h3 style="font-size: 10px; font-weight: 800; color: #475569; text-transform: uppercase; margin-bottom: 10px; letter-spacing: 1px;">Evolução Mensal</h3>
          <table style="width: 100%; border-collapse: collapse; border: 1px solid #e2e8f0; border-radius: 6px; overflow: hidden;">
            <thead>
              <tr style="background-color: #f8fafc; border-bottom: 2px solid #e2e8f0;">
                <th style="padding: 8px 12px; font-size: 8px; font-weight: 700; text-transform: uppercase; color: #64748b; text-align: left;">Mês</th>
                <th style="padding: 8px 12px; font-size: 8px; font-weight: 700; text-transform: uppercase; color: #64748b; text-align: right;">Entradas</th>
                <th style="padding: 8px 12px; font-size: 8px; font-weight: 700; text-transform: uppercase; color: #64748b; text-align: right;">Saídas</th>
                <th style="padding: 8px 12px; font-size: 8px; font-weight: 700; text-transform: uppercase; color: #64748b; text-align: right;">Saldo</th>
              </tr>
            </thead>
            <tbody style="background: white;">
              ${linhasMensalHTML || `<tr><td colspan="4" style="padding: 12px; text-align: center; font-size: 9px; color: #94a3b8; text-transform: uppercase;">Sem dados neste período</td></tr>`}
            </tbody>
          </table>
        </div>
      </div>

      <div style="margin-top: 40px; text-align: center; padding-top: 15px; border-top: 1px solid #f1f5f9;">
        <p style="margin: 0; font-size: 8px; font-weight: 600; color: #94a3b8; text-transform: uppercase; letter-spacing: 1px;">
          Documento gerado automaticamente em ${dataGeracao} pelo Sistema Organize.
        </p>
      </div>
    </div>
  `;

  const opt = {
    margin:       0,
    filename:     `Demonstrativo_${periodo}_${ano}.pdf`,
    image:        { type: 'jpeg', quality: 0.98 },
    html2canvas:  { scale: 2, useCORS: true, logging: false },
    jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' },
    pagebreak:    { mode: 'avoid-all' }
  };

  html2pdf().set(opt).from(htmlContent).save();
};