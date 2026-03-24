import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FileText, Settings, Plus, Search, Trash2, Copy, 
  Download, ChevronLeft, Save, Loader2, Building2, 
  History, Package, X, Minus, UserSquare2, CheckCircle2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "../lib/supabase";
import html2pdf from 'html2pdf.js';
import EditTaskModal from "@/components/tasks/EditTaskModal";

export default function Orcamentos() {
  const [view, setView] = useState('lista');
  const [loading, setLoading] = useState(true);
  
  const [orcamentos, setOrcamentos] = useState([]);
  const [produtos, setProdutos] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [config, setConfig] = useState(null);

  const [clienteAtual, setClienteAtual] = useState({ nome: '', telefone: '' });
  const [mostrarDropdownCliente, setMostrarDropdownCliente] = useState(false);
  
  const [itens, setItens] = useState([]);
  const [termo, setTermo] = useState({ validade: 7, prazo: '5 a 7 dias úteis', entrada_percentual: 50, desconto: 0 });
  const [buscaProduto, setBuscaProduto] = useState('');
  
  const [produtoSendoAdicionado, setProdutoSendoAdicionado] = useState(null);
  const [selecoesVariacao, setSelecoesVariacao] = useState({});

  const [orcamentoAprovado, setOrcamentoAprovado] = useState(null);
  const navigate = useNavigate();

  const printRef = useRef();

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    setLoading(true);
    const [resConf, resProd, resCli, resOrc] = await Promise.all([
      supabase.from('configuracoes').select('*').eq('id', 1).single(),
      supabase.from('produtos').select('id, nome, preco, preco_promocional, imagem_url, variacoes, atacado').eq('status_online', true).order('nome'),
      supabase.from('clientes').select('*').order('nome'),
      supabase.from('orcamentos').select('*').order('created_at', { ascending: false })
    ]);

    if (resConf.data) setConfig(resConf.data);
    if (resProd.data) setProdutos(resProd.data);
    if (resCli.data) setClientes(resCli.data);
    if (resOrc.data) setOrcamentos(resOrc.data);
    setLoading(false);
  }

  const subtotal = itens.reduce((acc, item) => acc + (item.preco * item.quantidade), 0);
  const descontoReal = Number(termo.desconto) || 0;
  const totalOrcamento = Math.max(0, subtotal - descontoReal);
  const valorEntrada = (totalOrcamento * termo.entrada_percentual) / 100;
  const valorRestante = totalOrcamento - valorEntrada;
  
  const corBase = config?.cor_orcamento || '#0f172a';
  const corNomeEmpresa = config?.cor_nome_empresa || corBase;

  const selecionarClienteExistente = (cli) => {
    setClienteAtual({ nome: cli.nome, telefone: cli.whatsapp || '' });
    setMostrarDropdownCliente(false);
  };

  const calcularPrecoDinamico = (prodOrig, qty, selecoesVar) => {
    let basePrice = prodOrig.preco_promocional > 0 ? prodOrig.preco_promocional : prodOrig.preco;
    let currentPrice = basePrice;
    let hasVarPrice = false;
    let varSum = 0;
    
    if (selecoesVar && Object.keys(selecoesVar).length > 0) {
      Object.values(selecoesVar).forEach(op => {
        if (op && Number(op.preco) > 0) { varSum += Number(op.preco); hasVarPrice = true; }
      });
    }
    if (hasVarPrice) currentPrice = varSum;

    let finalPrice = currentPrice;
    if (prodOrig.atacado?.ativa && prodOrig.atacado?.regras?.length > 0) {
      const validRules = prodOrig.atacado.regras.filter(r => qty >= r.min && (!r.max || qty <= r.max)).sort((a,b) => b.min - a.min);
      if (validRules.length > 0) {
        const rulePrice = validRules[0].preco;
        if (hasVarPrice && basePrice > 0) {
          finalPrice = Math.max(0, currentPrice - (basePrice - rulePrice));
        } else {
          finalPrice = rulePrice;
        }
      }
    }
    return finalPrice;
  };

  const processarCliqueProduto = (prod) => {
    if (prod.variacoes?.ativa && prod.variacoes.atributos?.length > 0) {
      setProdutoSendoAdicionado(prod);
      const iniciais = {};
      prod.variacoes.atributos.forEach(atrib => {
        if (atrib.opcoes?.length > 0) iniciais[atrib.nome] = atrib.opcoes[0];
      });
      setSelecoesVariacao(iniciais);
    } else {
      adicionarItemOrçamento(prod, {});
    }
  };

  const adicionarItemOrçamento = (prod, selecoes) => {
    const qty = 1;
    const finalPrice = calcularPrecoDinamico(prod, qty, selecoes);
    let nomeFormatado = prod.nome;
    
    if (selecoes && Object.keys(selecoes).length > 0) {
      const varsStr = Object.values(selecoes).map(s => s.nome).join(', ');
      nomeFormatado += ` (${varsStr})`;
    }

    const jaExiste = itens.find(i => i.produto_id === prod.id && JSON.stringify(i.selecoes) === JSON.stringify(selecoes));
    if (jaExiste) {
      atualizarQuantidade(jaExiste.id, jaExiste.quantidade + 1);
    } else {
      setItens([...itens, { 
        id: Date.now().toString(), 
        produto_id: prod.id, 
        produto_original: prod, 
        selecoes: selecoes, 
        nome: nomeFormatado, 
        preco: finalPrice, 
        quantidade: qty
      }]);
    }
    setBuscaProduto('');
    setProdutoSendoAdicionado(null);
  };

  const adicionarItemAvulso = () => {
    setItens([...itens, { id: Date.now().toString(), nome: 'Item Personalizado', preco: 0, quantidade: 1 }]);
    setBuscaProduto('');
  };

  const removerItem = (id) => setItens(itens.filter(i => i.id !== id));

  const atualizarQuantidade = (id, novaQtd) => {
    setItens(itens.map(item => {
      if (item.id === id) {
        let novoPreco = item.preco;
        if (item.produto_original) {
          novoPreco = calcularPrecoDinamico(item.produto_original, novaQtd, item.selecoes);
        }
        return { ...item, quantidade: novaQtd, preco: novoPreco };
      }
      return item;
    }));
  };

  const atualizarPrecoManual = (id, novoPreco) => setItens(itens.map(i => i.id === id ? { ...i, preco: novoPreco, produto_original: null } : i));
  const atualizarNomeManual = (id, novoNome) => setItens(itens.map(i => i.id === id ? { ...i, nome: novoNome } : i));

  const salvarOrcamento = async () => {
    if (!clienteAtual.nome || itens.length === 0) return alert("Preencha o cliente e adicione pelo menos um item.");
    
    const clienteExistente = clientes.find(c => c.nome.toLowerCase() === clienteAtual.nome.toLowerCase());
    if (!clienteExistente) {
      await supabase.from('clientes').insert([{ nome: clienteAtual.nome, whatsapp: clienteAtual.telefone }]);
    }

    const novoOrcamento = {
      cliente_nome: clienteAtual.nome,
      cliente_telefone: clienteAtual.telefone,
      itens: itens,
      total: totalOrcamento,
      entrada_valor: valorEntrada,
      validade_dias: termo.validade,
      prazo_producao: termo.prazo
    };

    const { error } = await supabase.from('orcamentos').insert([novoOrcamento]).select().single();
    if (!error) {
      alert("Orçamento salvo com sucesso!");
      fetchData();
      setView('lista');
      setItens([]);
      setClienteAtual({ nome: '', telefone: '' });
      setTermo({...termo, desconto: 0});
    }
  };

  const gerarTextoWhatsApp = () => {
    const dataAtual = new Date().toLocaleDateString('pt-BR');
    let texto = `*ORÇAMENTO - ${config?.nome_loja}*\nData: ${dataAtual}\n\n👤 *Cliente:* ${clienteAtual.nome}\n\n🛍️ *ITENS:*\n`;
    itens.forEach(item => { 
      texto += `▪️ ${item.quantidade}x ${item.nome} - R$ ${(item.preco * item.quantidade).toFixed(2)}\n`; 
    });
    
    texto += `\n💰 *VALORES:*\n*Subtotal:* R$ ${subtotal.toFixed(2)}\n`;
    if (descontoReal > 0) texto += `*Desconto:* -R$ ${descontoReal.toFixed(2)}\n`;
    
    texto += `*Total Final:* R$ ${totalOrcamento.toFixed(2)}\n*Sinal (${termo.entrada_percentual}%):* R$ ${valorEntrada.toFixed(2)}\n*Restante:* R$ ${valorRestante.toFixed(2)}\n\n`;
    texto += `💳 *PIX:* ${config?.chave_pix || 'A combinar'}\n⏱️ *PRAZO:* ${termo.prazo}\n\nQualquer dúvida, estou à disposição!`;
    navigator.clipboard.writeText(texto);
    alert("Texto copiado! É só colar no WhatsApp.");
  };

  const gerarPDF = () => {
    const element = printRef.current;
    const nomeDoCliente = clienteAtual.nome ? clienteAtual.nome.trim() : 'Novo_Cliente';
    const nomeArquivo = `${nomeDoCliente} - Orcamento.pdf`;

    const opt = {
      margin:       0,
      filename:     nomeArquivo,
      image:        { type: 'jpeg', quality: 0.98 },
      html2canvas:  { scale: 2, useCORS: true, logging: false },
      jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };

    html2pdf().set(opt).from(element).save();
  };

  const salvarConfig = async (e) => {
    e.preventDefault();
    await supabase.from('configuracoes').update({
      nome_loja: config.nome_loja,
      cnpj: config.cnpj,
      chave_pix: config.chave_pix,
      cor_orcamento: config.cor_orcamento,
      cor_nome_empresa: config.cor_nome_empresa
    }).eq('id', 1);
    alert("Configurações da empresa salvas!");
    setView('lista');
  };

  // --- NOVA LÓGICA: APROVAR ORÇAMENTO ---
  const handleAprovarOrcamento = async (orc) => {
    if (!window.confirm("Deseja aprovar este orçamento e gerar um novo pedido?")) return;

    // Transforma os itens do orçamento no formato do checklist de pedidos
    const checklist = orc.itens.map(item => ({
      name: `${item.quantidade}x ${item.nome}`,
      value: Number((item.preco * item.quantidade).toFixed(2)),
      done: false
    }));

    // Criação da estrutura do pedido provisório
    const novoPedido = {
      title: `Pedido de ${orc.cliente_nome}`,
      description: `Orçamento aprovado #${String(orc.numero || 1).padStart(4, '0')}\nPrazo: ${orc.prazo_producao || '--'}`,
      cliente_nome: orc.cliente_nome,
      service_value: orc.total,
      valor_pago: 0,
      payment_status: "em_aberto",
      status: "pendente",
      priority: "media",
      category: "Produção",
      checklist: checklist
    };

    try {
      // Salva o pedido no banco primeiro para pegar o ID real
      const { data, error } = await supabase.from('pedidos').insert([novoPedido]).select().single();
      if (error) throw error;
      
      // Abre o modal com o pedido criado
      setOrcamentoAprovado(data);
    } catch (err) {
      console.error("Erro ao gerar pedido:", err);
      alert("Erro ao aprovar orçamento e gerar o pedido.");
    }
  };

  // Atualiza os dados que você editar no Modal Flutuante
  const handleSavePedido = async (id, dataEditada) => {
    try {
      await supabase.from('pedidos').update(dataEditada).eq('id', id);
    } catch (err) {
      console.error("Erro ao atualizar pedido:", err);
    }
  };

  // Ao fechar o Modal, vai direto para a tela de Pedidos
  const handleCloseModal = () => {
    setOrcamentoAprovado(null);
    navigate('/pedidos');
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-slate-50"><Loader2 className="animate-spin text-blue-600" size={40} /></div>;

  if (view === 'config') {
    return (
      <div className="max-w-3xl mx-auto p-4 md:p-6 animate-in fade-in">
        <button onClick={() => setView('lista')} className="flex items-center gap-2 text-slate-500 font-medium text-xs mb-6 hover:text-slate-900 transition-colors">
          <ChevronLeft size={16} /> Voltar para Orçamentos
        </button>
        <div className="bg-white p-6 md:p-8 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-4 mb-6 border-b border-slate-100 pb-5">
            <div className="w-10 h-10 bg-slate-900 text-white rounded-lg flex items-center justify-center"><Building2 size={20}/></div>
            <div>
              <h2 className="text-lg font-semibold text-slate-800 uppercase tracking-tight">Dados da Empresa</h2>
              <p className="text-[10px] md:text-xs font-medium text-slate-500 uppercase tracking-widest mt-0.5">Estas informações aparecem no topo do PDF</p>
            </div>
          </div>
          <form onSubmit={salvarConfig} className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-1.5"><label className="text-[10px] md:text-xs font-semibold uppercase text-slate-500">Nome da Empresa</label><Input value={config?.nome_loja || ''} onChange={e => setConfig({...config, nome_loja: e.target.value})} className="h-11 md:h-10 font-medium rounded-md" /></div>
              <div className="space-y-1.5"><label className="text-[10px] md:text-xs font-semibold uppercase text-slate-500">CNPJ (Opcional)</label><Input value={config?.cnpj || ''} onChange={e => setConfig({...config, cnpj: e.target.value})} placeholder="00.000.000/0001-00" className="h-11 md:h-10 font-medium rounded-md" /></div>
              <div className="space-y-1.5"><label className="text-[10px] md:text-xs font-semibold uppercase text-slate-500">Chave Pix</label><Input value={config?.chave_pix || ''} onChange={e => setConfig({...config, chave_pix: e.target.value})} placeholder="CPF, CNPJ, Email ou Celular" className="h-11 md:h-10 font-medium bg-emerald-50 border-emerald-200 rounded-md" /></div>
              
              <div className="space-y-1.5">
                <label className="text-[10px] md:text-xs font-semibold uppercase text-slate-500">Cor do Layout (Tabelas)</label>
                <div className="flex gap-2 items-center">
                  <div className="relative w-10 h-10 md:w-10 md:h-10 rounded-md overflow-hidden shadow-sm border border-slate-200 shrink-0">
                    <Input type="color" value={config?.cor_orcamento || '#000000'} onChange={e => setConfig({...config, cor_orcamento: e.target.value})} className="absolute -inset-2 w-14 h-14 cursor-pointer appearance-none border-none p-0 bg-transparent" />
                  </div>
                  <Input value={config?.cor_orcamento || ''} onChange={e => setConfig({...config, cor_orcamento: e.target.value})} className="h-10 md:h-10 font-mono text-xs uppercase rounded-md" />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] md:text-xs font-semibold uppercase text-slate-500">Cor do Nome da Empresa</label>
                <div className="flex gap-2 items-center">
                  <div className="relative w-10 h-10 md:w-10 md:h-10 rounded-md overflow-hidden shadow-sm border border-slate-200 shrink-0">
                    <Input type="color" value={config?.cor_nome_empresa || '#000000'} onChange={e => setConfig({...config, cor_nome_empresa: e.target.value})} className="absolute -inset-2 w-14 h-14 cursor-pointer appearance-none border-none p-0 bg-transparent" />
                  </div>
                  <Input value={config?.cor_nome_empresa || ''} onChange={e => setConfig({...config, cor_nome_empresa: e.target.value})} className="h-10 md:h-10 font-mono text-xs uppercase rounded-md" />
                </div>
              </div>
            </div>
            <Button type="submit" className="w-full h-12 md:h-10 bg-slate-800 hover:bg-slate-900 text-white rounded-md font-semibold uppercase text-xs shadow-sm mt-2">Salvar Dados da Empresa</Button>
          </form>
        </div>
      </div>
    );
  }

  if (view === 'novo') {
    return (
      <div className="max-w-[1400px] mx-auto p-4 md:p-6 animate-in fade-in pb-32 md:pb-8 relative overflow-x-hidden">
        
        {/* MODAL DE VARIAÇÕES */}
        {produtoSendoAdicionado && (
           <div className="fixed inset-0 z-[200] bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
              <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-xl animate-in fade-in zoom-in-95">
                 <h3 className="text-[10px] md:text-xs font-semibold uppercase tracking-widest text-slate-500 mb-1">Configurar Item</h3>
                 <p className="text-lg font-semibold text-slate-800 mb-5 leading-tight">{produtoSendoAdicionado.nome}</p>
                 <div className="space-y-4">
                    {produtoSendoAdicionado.variacoes.atributos.map(atrib => (
                       <div key={atrib.id}>
                          <label className="text-[10px] font-semibold uppercase text-slate-500 mb-1.5 block">{atrib.nome}</label>
                          <div className="flex flex-wrap gap-2">
                             {atrib.opcoes.map(op => {
                               const isSelected = selecoesVariacao[atrib.nome]?.id === op.id;
                               return (
                                 <button
                                    key={op.id}
                                    onClick={() => setSelecoesVariacao({...selecoesVariacao, [atrib.nome]: op})}
                                    className={`px-3 py-1.5 rounded-md text-[11px] font-medium transition-all border shadow-sm ${isSelected ? 'bg-slate-800 text-white border-slate-800' : 'bg-white text-slate-600 hover:border-slate-300'}`}
                                 >
                                    {op.nome}
                                 </button>
                               );
                             })}
                          </div>
                       </div>
                    ))}
                 </div>
                 <div className="flex gap-2 mt-6">
                    <Button variant="outline" onClick={() => setProdutoSendoAdicionado(null)} className="flex-1 h-10 rounded-md font-semibold uppercase text-[10px] md:text-xs">Cancelar</Button>
                    <Button onClick={() => adicionarItemOrçamento(produtoSendoAdicionado, selecoesVariacao)} className="flex-1 h-10 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-semibold uppercase text-[10px] md:text-xs shadow-sm">Adicionar</Button>
                 </div>
              </div>
           </div>
        )}

        {/* CABEÇALHO */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between mb-6 gap-4">
          <button onClick={() => setView('lista')} className="flex items-center gap-2 text-slate-500 font-medium text-xs hover:text-slate-800 transition-colors">
            <ChevronLeft size={16} /> Voltar
          </button>
          
          <div className="grid grid-cols-2 md:flex md:flex-wrap gap-2 md:gap-3">
             <Button onClick={() => setView('config')} variant="ghost" className="h-10 md:h-9 rounded-md font-semibold uppercase text-[10px] md:text-xs gap-1.5 text-slate-600 hover:bg-slate-100 border border-slate-200">
               <Settings size={14}/> <span className="hidden sm:inline">Empresa</span>
             </Button>
             <Button onClick={gerarTextoWhatsApp} variant="outline" className="h-10 md:h-9 rounded-md font-semibold uppercase text-[10px] md:text-xs gap-1.5 border border-slate-200 text-slate-600 hover:bg-slate-50">
               <Copy size={14}/> Copiar
             </Button>
             <Button onClick={gerarPDF} className="h-10 md:h-9 bg-slate-800 hover:bg-slate-900 text-white rounded-md font-semibold uppercase text-[10px] md:text-xs gap-1.5 shadow-sm">
               <Download size={14}/> PDF
             </Button>
             <Button onClick={salvarOrcamento} className="h-10 md:h-9 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md font-semibold uppercase text-[10px] md:text-xs gap-1.5 shadow-sm">
               <Save size={14}/> Salvar
             </Button>
          </div>
        </div>

        <div className="flex flex-col xl:flex-row gap-6">
          
          {/* COLUNA ESQUERDA: EDITOR DE ORÇAMENTO */}
          <div className="w-full xl:w-[45%] space-y-4 md:space-y-5">
            
            <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm space-y-3 relative z-20">
              <h3 className="text-xs font-semibold uppercase text-slate-700 tracking-widest border-b border-slate-100 pb-2.5 flex items-center gap-1.5"><Building2 size={14} className="text-blue-500"/> Cliente</h3>
              <div className="space-y-3 pt-1">
                <div className="space-y-1 relative">
                  <label className="text-[10px] font-semibold uppercase text-slate-500">Nome do Cliente</label>
                  <div className="relative">
                    <UserSquare2 className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                    <Input 
                      value={clienteAtual.nome} 
                      onChange={e => { 
                        setClienteAtual({...clienteAtual, nome: e.target.value}); 
                        setMostrarDropdownCliente(true); 
                      }} 
                      onFocus={() => setMostrarDropdownCliente(true)}
                      onBlur={() => setTimeout(() => setMostrarDropdownCliente(false), 200)}
                      placeholder="Busque ou digite o nome..." 
                      className="h-11 md:h-10 pl-9 font-medium bg-slate-50 border-slate-200 focus:bg-white rounded-md text-sm" 
                    />
                    
                    {mostrarDropdownCliente && clienteAtual.nome.length > 0 && (
                      <div className="absolute top-12 left-0 right-0 bg-white border border-slate-200 rounded-md shadow-lg max-h-48 overflow-y-auto p-1.5 space-y-0.5 z-50">
                        {clientes.filter(c => c.nome.toLowerCase().includes(clienteAtual.nome.toLowerCase())).length > 0 ? (
                          clientes.filter(c => c.nome.toLowerCase().includes(clienteAtual.nome.toLowerCase())).map(cli => (
                            <div 
                              key={cli.id} 
                              onMouseDown={() => selecionarClienteExistente(cli)} 
                              className="flex flex-col p-2.5 hover:bg-slate-50 rounded-md cursor-pointer transition-colors"
                            >
                              <span className="text-xs font-semibold text-slate-800 uppercase">{cli.nome}</span>
                              <span className="text-[10px] font-medium text-slate-400">{cli.whatsapp || 'Sem WhatsApp'}</span>
                            </div>
                          ))
                        ) : (
                          <div className="p-3 text-center">
                            <span className="text-[10px] font-medium text-slate-500 uppercase">Novo cliente será salvo automaticamente</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-semibold uppercase text-slate-500">WhatsApp / Telefone</label>
                  <Input value={clienteAtual.telefone} onChange={e => setClienteAtual({...clienteAtual, telefone: e.target.value})} placeholder="(00) 00000-0000" className="h-11 md:h-10 font-medium bg-slate-50 rounded-md text-sm" />
                </div>
              </div>
            </div>

            <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm space-y-3 relative z-10">
              <h3 className="text-xs font-semibold uppercase text-slate-700 tracking-widest border-b border-slate-100 pb-2.5 flex items-center gap-1.5"><Package size={14} className="text-emerald-500"/> Itens do Pedido</h3>
              <div className="relative pt-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 mt-0.5 text-slate-400" size={16} />
                <Input value={buscaProduto} onChange={e => setBuscaProduto(e.target.value)} placeholder="Buscar produto do catálogo..." className="h-11 md:h-10 pl-9 font-medium border-slate-200 rounded-md text-sm" />
                {buscaProduto && (
                  <div className="absolute top-12 left-0 right-0 bg-white border border-slate-200 rounded-md shadow-lg max-h-48 overflow-y-auto z-50 p-1.5 space-y-0.5">
                    {produtos.filter(p => p.nome.toLowerCase().includes(buscaProduto.toLowerCase())).map(prod => (
                      <div key={prod.id} onClick={() => processarCliqueProduto(prod)} className="flex items-center justify-between p-2 hover:bg-slate-50 rounded-md cursor-pointer">
                        <div className="flex flex-col">
                           <span className="text-xs font-semibold text-slate-800">{prod.nome}</span>
                           {prod.variacoes?.ativa && <span className="text-[9px] font-semibold uppercase text-blue-500 mt-0.5">Tem Opções</span>}
                        </div>
                        <span className="text-[10px] font-bold text-emerald-600">R$ {Number(prod.preco_promocional > 0 ? prod.preco_promocional : prod.preco).toFixed(2)}</span>
                      </div>
                    ))}
                    <button onClick={adicionarItemAvulso} className="w-full p-2 text-center text-[10px] font-semibold uppercase text-blue-600 hover:bg-blue-50 rounded-md mt-1 border border-blue-100">+ Criar Item Avulso</button>
                  </div>
                )}
              </div>
              <div className="space-y-2.5 mt-3">
                {itens.map((item) => (
                  <div key={item.id} className="bg-slate-50 p-2.5 rounded-md border border-slate-200 flex flex-col gap-2.5 group relative">
                    <button onClick={() => removerItem(item.id)} className="absolute -top-2 -right-2 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"><X size={12}/></button>
                    
                    <Input value={item.nome} onChange={e => atualizarNomeManual(item.id, e.target.value)} placeholder="Nome do Item" className="h-9 md:h-8 text-xs font-semibold bg-white rounded-md" />

                    <div className="flex gap-2.5 items-center">
                       <div className="flex items-center border border-slate-200 rounded-md h-9 md:h-8 bg-white overflow-hidden w-24">
                          <button onClick={() => atualizarQuantidade(item.id, Math.max(1, item.quantidade - 1))} className="w-7 h-full flex items-center justify-center text-slate-500 hover:bg-slate-50"><Minus size={12}/></button>
                          <input type="text" value={item.quantidade} onChange={e => atualizarQuantidade(item.id, Number(e.target.value.replace(/\D/g, ''))||1)} className="w-full h-full text-center font-semibold text-slate-800 text-xs outline-none" />
                          <button onClick={() => atualizarQuantidade(item.id, item.quantidade + 1)} className="w-7 h-full flex items-center justify-center text-slate-500 hover:bg-slate-50"><Plus size={12}/></button>
                       </div>
                       <div className="relative flex-1">
                          <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-semibold">R$</span>
                          <Input type="number" value={item.preco} onChange={e => atualizarPrecoManual(item.id, Number(e.target.value))} className="h-9 md:h-8 pl-7 text-xs font-semibold bg-white rounded-md" />
                       </div>
                    </div>
                  </div>
                ))}
                {itens.length === 0 && <p className="text-[10px] font-medium text-slate-400 uppercase text-center py-3">Nenhum item adicionado</p>}
              </div>
            </div>

            <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm space-y-3">
              <h3 className="text-xs font-semibold uppercase text-slate-700 tracking-widest border-b border-slate-100 pb-2.5 flex items-center gap-1.5"><FileText size={14} className="text-amber-500"/> Condições</h3>
              <div className="grid grid-cols-2 gap-3 pt-1">
                <div className="space-y-1"><label className="text-[10px] font-semibold uppercase text-slate-500">Validade (Dias)</label><Input type="number" value={termo.validade} onChange={e => setTermo({...termo, validade: Number(e.target.value)})} className="h-10 md:h-9 font-medium bg-slate-50 rounded-md" /></div>
                <div className="space-y-1"><label className="text-[10px] font-semibold uppercase text-slate-500">Sinal (%)</label><div className="relative"><Input type="number" value={termo.entrada_percentual} onChange={e => setTermo({...termo, entrada_percentual: Number(e.target.value)})} className="h-10 md:h-9 font-medium bg-emerald-50 text-emerald-700 border-emerald-200 pl-7 rounded-md" /><span className="absolute left-3 top-1/2 -translate-y-1/2 text-emerald-500 font-semibold text-xs">%</span></div></div>
                <div className="space-y-1 col-span-2"><label className="text-[10px] font-semibold uppercase text-slate-500">Prazo de Produção</label><Input value={termo.prazo} onChange={e => setTermo({...termo, prazo: e.target.value})} placeholder="Ex: 5 a 7 dias úteis" className="h-10 md:h-9 font-medium bg-slate-50 rounded-md" /></div>
                
                <div className="space-y-1 col-span-2 md:col-span-1">
                  <label className="text-[10px] font-semibold uppercase text-slate-500">Desconto (R$)</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-red-500 font-semibold text-xs">R$</span>
                    <Input type="number" value={termo.desconto || ''} onChange={e => setTermo({...termo, desconto: Number(e.target.value)})} className="h-10 md:h-9 font-medium bg-red-50 text-red-600 border-red-200 pl-8 rounded-md" placeholder="0.00" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ========================================== */}
          {/* COLUNA DIREITA: PDF (OCULTO NO TELEMÓVEL)  */}
          {/* ========================================== */}
          <div className="fixed -left-[9999px] xl:static w-full xl:w-[55%] z-10">
             <div className="sticky top-24 space-y-3">
                
                <div className="flex items-center justify-between mb-1">
                  <h3 className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">Visualização Real do PDF</h3>
                </div>

                <div className="w-full bg-slate-200/50 p-4 md:p-6 rounded-xl border border-slate-200 flex justify-center overflow-hidden">
                  
                  {/* --- A FOLHA A4 STRICT LIMPA --- */}
                  <div 
                    ref={printRef} 
                    className="bg-white shadow-lg flex flex-col shrink-0 relative mx-auto"
                    style={{ 
                      width: '210mm', 
                      minHeight: '295mm', 
                      maxHeight: '296mm', 
                      overflow: 'hidden', 
                      padding: '15mm', 
                      boxSizing: 'border-box' 
                    }}
                  >
                     
                     <div className="flex justify-between items-center border-b-2 pb-6 mb-8" style={{ borderColor: corBase }}>
                        <div className="flex gap-5 items-center">
                           {config?.logo_url && <img src={config.logo_url} className="h-16 w-16 object-contain rounded-md border border-slate-100" alt="Logo" />}
                           <div>
                              <h1 className="text-2xl font-bold uppercase tracking-tight leading-none" style={{ color: corNomeEmpresa }}>{config?.nome_loja || 'MINHA EMPRESA'}</h1>
                              {config?.cnpj && <p className="text-[10px] font-medium text-slate-500 uppercase mt-1">CNPJ: {config.cnpj}</p>}
                           </div>
                        </div>
                        <div className="text-right">
                           <h2 className="text-3xl font-bold uppercase tracking-tight" style={{ color: corBase }}>ORÇAMENTO</h2>
                           <div className="flex flex-col items-end gap-1 mt-2">
                             <span className="text-[10px] font-medium text-slate-600 bg-slate-100 px-2 py-1 rounded">Data: {new Date().toLocaleDateString('pt-BR')}</span>
                             <span className="text-[10px] font-medium text-slate-600 bg-slate-100 px-2 py-1 rounded">Validade: {termo.validade} dias</span>
                           </div>
                        </div>
                     </div>

                     <div className="mb-8">
                        <h3 className="text-[11px] font-semibold uppercase tracking-widest mb-2" style={{ color: corBase }}>Informações do Cliente</h3>
                        <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 flex justify-between items-center">
                           <div>
                              <p className="text-[9px] font-medium uppercase text-slate-400 mb-0.5">Nome / Razão Social</p>
                              <p className="text-sm font-semibold uppercase text-slate-800">{clienteAtual.nome || 'NÃO INFORMADO'}</p>
                           </div>
                           <div className="text-right">
                              <p className="text-[9px] font-medium uppercase text-slate-400 mb-0.5">Telefone / WhatsApp</p>
                              <p className="text-sm font-semibold uppercase text-slate-800">{clienteAtual.telefone || '--'}</p>
                           </div>
                        </div>
                     </div>

                     <div className="mb-10 flex-1">
                        <table className="w-full text-left border-collapse rounded-lg overflow-hidden shadow-sm border border-slate-200">
                           <thead>
                              <tr style={{ backgroundColor: corBase }}>
                                 <th className="py-2.5 px-3 text-[10px] font-semibold uppercase text-white">Descrição do Item</th>
                                 <th className="py-2.5 px-3 text-[10px] font-semibold uppercase text-white text-center w-16">Qtd</th>
                                 <th className="py-2.5 px-3 text-[10px] font-semibold uppercase text-white text-right w-28">V. Unitário</th>
                                 <th className="py-2.5 px-3 text-[10px] font-semibold uppercase text-white text-right w-32">Total</th>
                              </tr>
                           </thead>
                           <tbody className="bg-white">
                              {itens.map((item, i) => (
                                 <tr key={i} className="border-b border-slate-100 last:border-0">
                                    <td className="py-2.5 px-3 text-xs font-medium text-slate-800">{item.nome}</td>
                                    <td className="py-2.5 px-3 text-xs font-medium text-slate-800 text-center bg-slate-50">{item.quantidade}</td>
                                    <td className="py-2.5 px-3 text-xs font-medium text-slate-600 text-right">R$ {Number(item.preco).toFixed(2)}</td>
                                    <td className="py-2.5 px-3 text-xs font-semibold text-slate-900 text-right bg-slate-50">R$ {(item.preco * item.quantidade).toFixed(2)}</td>
                                 </tr>
                              ))}
                              {itens.length === 0 && (
                                <tr><td colSpan="4" className="py-6 text-center text-[10px] font-medium uppercase text-slate-400 bg-slate-50">Adicione itens ao orçamento para preencher a tabela</td></tr>
                              )}
                           </tbody>
                        </table>
                     </div>

                     <div className="flex gap-6 mt-auto pt-5 border-t-2" style={{ borderColor: corBase }}>
                        
                        <div className="flex-1 space-y-4">
                           <div>
                              <p className="text-[10px] font-semibold uppercase text-slate-400 mb-1">Prazo de Produção</p>
                              <p className="text-xs font-medium text-slate-800">{termo.prazo}</p>
                           </div>
                           <div>
                              <p className="text-[10px] font-semibold uppercase text-slate-400 mb-1">Pagamento PIX</p>
                              <p className="text-xs font-mono font-medium text-slate-800 break-all">{config?.chave_pix || 'A combinar'}</p>
                           </div>
                        </div>

                        <div className="w-64 bg-slate-50 rounded-lg p-4 border border-slate-200">
                           <div className="flex justify-between text-[11px] text-slate-600 font-medium mb-1.5">
                              <span>Subtotal</span>
                              <span>R$ {subtotal.toFixed(2)}</span>
                           </div>
                           {descontoReal > 0 && (
                             <div className="flex justify-between text-[11px] text-red-500 font-semibold mb-1.5">
                                <span>Desconto</span>
                                <span>- R$ {descontoReal.toFixed(2)}</span>
                             </div>
                           )}
                           <div className="flex justify-between text-[11px] font-semibold mb-1.5" style={{ color: corBase }}>
                              <span>Sinal ({termo.entrada_percentual}%)</span>
                              <span>R$ {valorEntrada.toFixed(2)}</span>
                           </div>
                           <div className="flex justify-between text-[11px] font-medium text-slate-500 pb-3 border-b border-slate-200">
                              <span>Restante</span>
                              <span>R$ {valorRestante.toFixed(2)}</span>
                           </div>
                           <div className="flex justify-between items-end pt-2.5">
                              <span className="text-[10px] font-semibold uppercase tracking-widest text-slate-500">Total Final</span>
                              <span className="text-lg font-bold tracking-tight" style={{ color: corBase }}>R$ {totalOrcamento.toFixed(2)}</span>
                           </div>
                        </div>
                     </div>

                     <div className="mt-6 text-center pt-3 border-t border-slate-100">
                        <p className="text-[10px] font-medium text-slate-500">
                          {config?.whatsapp && `WhatsApp: ${config.whatsapp}`}
                          {config?.whatsapp && config?.instagram && '   |   '}
                          {config?.instagram && `Instagram: ${config.instagram}`}
                        </p>
                     </div>

                  </div>
                </div>
             </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 pb-32">
      <div className="max-w-6xl mx-auto space-y-6 px-4 sm:px-6 pt-6 md:pt-8 animate-in fade-in">
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
             <h1 className="text-xl md:text-2xl font-bold md:font-semibold uppercase text-slate-800 tracking-tight">Orçamentos</h1>
             <p className="text-[10px] md:text-xs font-medium text-slate-500 uppercase tracking-widest mt-1">Gerencie propostas e pedidos</p>
          </div>
          <div className="flex flex-wrap gap-2 md:gap-3">
            <Button variant="outline" onClick={() => setView('config')} className="flex-1 md:flex-none h-11 md:h-10 border-slate-200 text-slate-600 rounded-md px-4 shadow-sm hover:bg-slate-50 font-semibold uppercase text-[10px] md:text-xs gap-2">
              <Settings size={14} /> <span className="hidden sm:inline">Configurar Empresa</span><span className="sm:hidden">Empresa</span>
            </Button>
            <Button onClick={() => setView('novo')} className="flex-1 md:flex-none h-11 md:h-10 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-semibold uppercase text-[10px] md:text-xs gap-2 px-5 shadow-sm transition-all active:scale-95">
              <Plus size={14} /> Novo Orçamento
            </Button>
          </div>
        </div>

        {orcamentos.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-xl border border-slate-200 shadow-sm mt-6 md:mt-8">
            <History size={40} className="mx-auto text-slate-300 mb-3" />
            <h3 className="text-base font-semibold text-slate-800 uppercase mb-1.5">Nenhum orçamento</h3>
            <p className="text-[10px] font-medium uppercase text-slate-400 tracking-widest">Crie sua primeira proposta comercial.</p>
          </div>
        ) : (
          <div className="bg-transparent md:bg-white md:rounded-xl md:border md:border-slate-200 md:shadow-sm mt-6 md:mt-8">
            
            <div className="hidden md:block overflow-x-auto pb-2">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/50">
                    <th className="p-4 text-[10px] font-semibold uppercase text-slate-500 tracking-widest">Nº / Data</th>
                    <th className="p-4 text-[10px] font-semibold uppercase text-slate-500 tracking-widest">Cliente</th>
                    <th className="p-4 text-[10px] font-semibold uppercase text-slate-500 tracking-widest">Itens</th>
                    <th className="p-4 text-[10px] font-semibold uppercase text-slate-500 tracking-widest text-right">Total</th>
                    <th className="p-4 text-[10px] font-semibold uppercase text-slate-500 tracking-widest text-center">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {orcamentos.map((orc) => (
                    <tr key={orc.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="p-4">
                        <p className="text-sm font-semibold text-slate-800">#{String(orc.numero || 1).padStart(4, '0')}</p>
                        <p className="text-[10px] font-medium uppercase text-slate-500 mt-0.5">{new Date(orc.created_at).toLocaleDateString('pt-BR')}</p>
                      </td>
                      <td className="p-4">
                        <p className="text-sm font-medium text-slate-800 uppercase">{orc.cliente_nome}</p>
                        <p className="text-[10px] font-medium uppercase text-slate-500 mt-0.5">{orc.cliente_telefone || 'Sem contato'}</p>
                      </td>
                      <td className="p-4 text-sm font-medium text-slate-600">
                        {orc.itens.length} {orc.itens.length === 1 ? 'item' : 'itens'}
                      </td>
                      <td className="p-4 text-right text-sm font-semibold text-slate-900">
                        R$ {Number(orc.total).toFixed(2)}
                      </td>
                      <td className="p-4 text-center flex justify-center gap-1.5">
                         <Button variant="ghost" onClick={() => handleAprovarOrcamento(orc)} className="h-8 px-2.5 rounded-md bg-emerald-50 text-emerald-600 hover:bg-emerald-100 font-semibold text-[10px] uppercase">
                           Aprovar
                         </Button>
                         <Button variant="ghost" onClick={() => {
                           setClienteAtual({ nome: orc.cliente_nome, telefone: orc.cliente_telefone });
                           setItens(orc.itens);
                           setTermo({ validade: orc.validade_dias, prazo: orc.prazo_producao, entrada_percentual: Math.round((orc.entrada_valor / orc.total) * 100), desconto: orc.total < (orc.itens.reduce((a,b)=>a+(b.preco*b.quantidade),0)) ? (orc.itens.reduce((a,b)=>a+(b.preco*b.quantidade),0) - orc.total) : 0 });
                           setView('novo');
                         }} className="h-8 px-3 rounded-md bg-blue-50 text-blue-600 hover:bg-blue-100 font-semibold text-[10px] uppercase">
                           Visualizar
                         </Button>
                         <Button variant="ghost" onClick={async () => {
                           if(confirm("Excluir este orçamento?")) {
                             await supabase.from('orcamentos').delete().eq('id', orc.id);
                             fetchData();
                           }
                         }} className="h-8 px-2.5 rounded-md bg-red-50 text-red-500 hover:bg-red-100 font-semibold text-[10px] uppercase">
                           <Trash2 size={14}/>
                         </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="md:hidden flex flex-col gap-3">
               {orcamentos.map((orc) => (
                  <div key={orc.id} className="bg-white border border-slate-200 rounded-lg p-4 shadow-sm flex flex-col gap-3">
                    <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                      <div>
                        <p className="text-xs font-semibold text-slate-800">#{String(orc.numero || 1).padStart(4, '0')}</p>
                        <p className="text-[10px] font-medium uppercase text-slate-500 mt-0.5">{new Date(orc.created_at).toLocaleDateString('pt-BR')}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold text-slate-900">R$ {Number(orc.total).toFixed(2)}</p>
                        <p className="text-[10px] font-medium text-slate-500 uppercase">{orc.itens.length} {orc.itens.length === 1 ? 'item' : 'itens'}</p>
                      </div>
                    </div>
                    <div className="flex justify-between items-end">
                      <div>
                        <p className="text-[9px] font-semibold text-slate-400 uppercase mb-0.5">Cliente</p>
                        <p className="text-xs font-medium text-slate-800 uppercase">{orc.cliente_nome}</p>
                        <p className="text-[10px] font-medium uppercase text-slate-500">{orc.cliente_telefone || 'Sem contato'}</p>
                      </div>
                      <div className="flex gap-1.5">
                         <Button variant="ghost" onClick={() => handleAprovarOrcamento(orc)} className="h-8 px-3 rounded-md bg-emerald-50 text-emerald-600 font-semibold text-[10px] uppercase">
                           Aprovar
                         </Button>
                         <Button variant="ghost" onClick={() => {
                           setClienteAtual({ nome: orc.cliente_nome, telefone: orc.cliente_telefone });
                           setItens(orc.itens);
                           setTermo({ validade: orc.validade_dias, prazo: orc.prazo_producao, entrada_percentual: Math.round((orc.entrada_valor / orc.total) * 100), desconto: orc.total < (orc.itens.reduce((a,b)=>a+(b.preco*b.quantidade),0)) ? (orc.itens.reduce((a,b)=>a+(b.preco*b.quantidade),0) - orc.total) : 0 });
                           setView('novo');
                         }} className="h-8 px-3 rounded-md bg-blue-50 text-blue-600 font-semibold text-[10px] uppercase">
                           Ver
                         </Button>
                         <Button variant="ghost" onClick={async () => {
                           if(confirm("Excluir este orçamento?")) {
                             await supabase.from('orcamentos').delete().eq('id', orc.id);
                             fetchData();
                           }
                         }} className="h-8 px-2.5 rounded-md bg-red-50 text-red-500 font-semibold text-[10px] uppercase">
                           <Trash2 size={14}/>
                         </Button>
                      </div>
                    </div>
                  </div>
               ))}
            </div>

          </div>
        )}
      </div>

      {/* MODAL DE EDIÇÃO DE PEDIDO AO APROVAR ORÇAMENTO */}
      {orcamentoAprovado && (
        <EditTaskModal 
          task={orcamentoAprovado} 
          onClose={handleCloseModal} 
          onSave={handleSavePedido} 
        />
      )}

    </div>
  );
}