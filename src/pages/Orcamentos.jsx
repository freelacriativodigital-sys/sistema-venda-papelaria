import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FileText, Settings, Plus, Search, Trash2, Copy, 
  Download, ChevronLeft, Save, Loader2, Building2, 
  History, Package, X, Minus, UserSquare2, CheckCircle2,
  Layers, Palette
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
  
  // --- NOVO SISTEMA DE ABAS (OPÇÕES) ---
  const [opcoes, setOpcoes] = useState([{ id: '1', titulo: 'Opção 1', itens: [], desconto: 0 }]);
  const [abaAtiva, setAbaAtiva] = useState('1');
  
  const [termo, setTermo] = useState({ validade: 7, prazo: '5 a 7 dias úteis', entrada_percentual: 50 });
  const [buscaProduto, setBuscaProduto] = useState('');
  
  const [produtoSendoAdicionado, setProdutoSendoAdicionado] = useState(null);
  const [selecoesVariacao, setSelecoesVariacao] = useState({});

  const [orcamentoAprovado, setOrcamentoAprovado] = useState(null);
  const [modalAprovacaoMult, setModalAprovacaoMult] = useState(null); 
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

  const corBase = config?.cor_orcamento || '#0f172a';
  const corNomeEmpresa = config?.cor_nome_empresa || corBase;

  const opcaoAtual = opcoes.find(o => o.id === abaAtiva) || opcoes[0];

  const adicionarOpcao = () => {
    const newId = Date.now().toString();
    setOpcoes([...opcoes, { id: newId, titulo: `Opção ${opcoes.length + 1}`, itens: [], desconto: 0 }]);
    setAbaAtiva(newId);
  };

  const removerOpcao = (id) => {
    if (opcoes.length === 1) return alert("O orçamento precisa ter pelo menos uma opção.");
    const novasOpcoes = opcoes.filter(o => o.id !== id);
    setOpcoes(novasOpcoes);
    if (abaAtiva === id) setAbaAtiva(novasOpcoes[0].id);
  };

  const atualizarTituloOpcao = (id, novoTitulo) => {
    setOpcoes(opcoes.map(o => o.id === id ? { ...o, titulo: novoTitulo } : o));
  };

  const atualizarDescontoOpcao = (valor) => {
    setOpcoes(opcoes.map(o => o.id === abaAtiva ? { ...o, desconto: valor } : o));
  };

  const atualizarItensDaAba = (novosItens) => {
    setOpcoes(opcoes.map(o => o.id === abaAtiva ? { ...o, itens: novosItens } : o));
  };

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

    const itensAtuais = opcaoAtual.itens;
    const jaExiste = itensAtuais.find(i => i.produto_id === prod.id && JSON.stringify(i.selecoes) === JSON.stringify(selecoes));
    
    if (jaExiste) {
      atualizarQuantidade(jaExiste.id, jaExiste.quantidade + 1);
    } else {
      atualizarItensDaAba([...itensAtuais, { 
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
    atualizarItensDaAba([...opcaoAtual.itens, { id: Date.now().toString(), nome: 'Item Personalizado', preco: 0, quantidade: 1 }]);
    setBuscaProduto('');
  };

  const removerItem = (id) => atualizarItensDaAba(opcaoAtual.itens.filter(i => i.id !== id));

  const atualizarQuantidade = (id, novaQtd) => {
    atualizarItensDaAba(opcaoAtual.itens.map(item => {
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

  const atualizarPrecoManual = (id, novoPreco) => atualizarItensDaAba(opcaoAtual.itens.map(i => i.id === id ? { ...i, preco: novoPreco, produto_original: null } : i));
  const atualizarNomeManual = (id, novoNome) => atualizarItensDaAba(opcaoAtual.itens.map(i => i.id === id ? { ...i, nome: novoNome } : i));

  const salvarOrcamento = async () => {
    if (!clienteAtual.nome) return alert("Preencha o nome do cliente.");
    if (opcoes.some(op => op.itens.length === 0)) return alert("Todas as opções devem ter pelo menos um item.");
    
    const clienteExistente = clientes.find(c => c.nome.toLowerCase() === clienteAtual.nome.toLowerCase());
    if (!clienteExistente) {
      await supabase.from('clientes').insert([{ nome: clienteAtual.nome, whatsapp: clienteAtual.telefone }]);
    }

    const subtotalPrimeira = opcoes[0].itens.reduce((acc, item) => acc + (item.preco * item.quantidade), 0);
    const totalPrimeira = Math.max(0, subtotalPrimeira - (opcoes[0].desconto || 0));

    const novoOrcamento = {
      cliente_nome: clienteAtual.nome,
      cliente_telefone: clienteAtual.telefone,
      itens: opcoes[0].itens, 
      opcoes: opcoes, 
      total: totalPrimeira,
      entrada_valor: (totalPrimeira * termo.entrada_percentual) / 100,
      validade_dias: termo.validade,
      prazo_producao: termo.prazo
    };

    const { error } = await supabase.from('orcamentos').insert([novoOrcamento]).select().single();
    if (!error) {
      alert("Orçamento salvo com sucesso!");
      fetchData();
      setView('lista');
      setOpcoes([{ id: '1', titulo: 'Opção 1', itens: [], desconto: 0 }]);
      setAbaAtiva('1');
      setClienteAtual({ nome: '', telefone: '' });
    }
  };

  const gerarTextoWhatsApp = () => {
    const dataAtual = new Date().toLocaleDateString('pt-BR');
    let texto = `*ORÇAMENTO - ${config?.nome_loja}*\nData: ${dataAtual}\n\n👤 *Cliente:* ${clienteAtual.nome}\n`;
    
    opcoes.forEach((opcao, index) => {
      const subtotal = opcao.itens.reduce((acc, item) => acc + (item.preco * item.quantidade), 0);
      const desconto = opcao.desconto || 0;
      const totalOpt = Math.max(0, subtotal - desconto);
      
      texto += `\n${opcoes.length > 1 ? `🔹 *${opcao.titulo.toUpperCase()}*` : `🛍️ *ITENS:*`}\n`;
      opcao.itens.forEach(item => { 
        texto += `▪️ ${item.quantidade}x ${item.nome} - R$ ${(item.preco * item.quantidade).toFixed(2)}\n`; 
      });
      
      texto += `\n*Valor ${opcoes.length > 1 ? 'desta opção' : 'Final'}:* R$ ${totalOpt.toFixed(2)}\n`;
      if (desconto > 0) texto += `_(Desconto aplicado: -R$ ${desconto.toFixed(2)})_\n`;
      if (opcoes.length > 1 && index < opcoes.length - 1) texto += `---------------------\n`;
    });

    texto += `\n⏱️ *PRAZO DE PRODUÇÃO:* ${termo.prazo}\n💳 *PIX:* ${config?.chave_pix || 'A combinar'}\n\nQualquer dúvida sobre as opções, estou à disposição!`;
    
    navigator.clipboard.writeText(texto);
    alert("Texto copiado! É só colar no WhatsApp.");
  };

  const gerarPDF = () => {
    const element = printRef.current;
    const nomeDoCliente = clienteAtual.nome ? clienteAtual.nome.trim() : 'Novo_Cliente';
    const nomeArquivo = `${nomeDoCliente} - Orcamento.pdf`;
    const alturaTotalMm = element.scrollHeight * 0.264583;

    const opt = {
      margin:       0,
      filename:     nomeArquivo,
      image:        { type: 'jpeg', quality: 0.98 },
      html2canvas:  { scale: 2, useCORS: true, logging: false },
      jsPDF:        { unit: 'mm', format: [210, Math.max(297, alturaTotalMm + 5)], orientation: 'portrait' }
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

  const iniciarAprovacao = (orc) => {
    const orcOpcoes = orc.opcoes && orc.opcoes.length > 0 
      ? orc.opcoes 
      : [{ id: '1', titulo: 'Opção Única', itens: orc.itens, desconto: 0 }];
    
    if (orcOpcoes.length === 1) {
      efetivarAprovacao(orc, orcOpcoes[0]);
    } else {
      setModalAprovacaoMult({ orcamento: orc, opcoes: orcOpcoes });
    }
  };

  const efetivarAprovacao = async (orc, opcaoEscolhida) => {
    const subtotal = opcaoEscolhida.itens.reduce((acc, item) => acc + (item.preco * item.quantidade), 0);
    const totalFinal = Math.max(0, subtotal - (opcaoEscolhida.desconto || 0));

    const checklist = opcaoEscolhida.itens.map(item => ({
      name: `${item.quantidade}x ${item.nome}`,
      value: Number((item.preco * item.quantidade).toFixed(2)),
      done: false
    }));

    const novoPedido = {
      title: `Pedido de ${orc.cliente_nome}`,
      description: `Orçamento aprovado #${String(orc.numero || 1).padStart(4, '0')} (${opcaoEscolhida.titulo})\nPrazo: ${orc.prazo_producao || '--'}`,
      cliente_nome: orc.cliente_nome,
      service_value: totalFinal,
      valor_pago: 0,
      payment_status: "em_aberto",
      status: "pendente",
      priority: "media",
      category: "Produção",
      checklist: checklist
    };

    try {
      const { data, error } = await supabase.from('pedidos').insert([novoPedido]).select().single();
      if (error) throw error;
      setModalAprovacaoMult(null);
      setOrcamentoAprovado(data);
    } catch (err) {
      alert("Erro ao gerar o pedido.");
    }
  };

  const handleSavePedido = async (id, dataEditada) => {
    try { await supabase.from('pedidos').update(dataEditada).eq('id', id); } 
    catch (err) { console.error(err); }
  };

  const handleCloseModal = () => {
    setOrcamentoAprovado(null);
    navigate('/pedidos');
  };

  const abrirOrcamentoParaEdicao = (orc) => {
    setClienteAtual({ nome: orc.cliente_nome, telefone: orc.cliente_telefone });
    
    const orcOpcoes = orc.opcoes && orc.opcoes.length > 0 
      ? orc.opcoes 
      : [{ 
          id: '1', 
          titulo: 'Opção Única', 
          itens: orc.itens || [], 
          desconto: orc.total < (orc.itens.reduce((a,b)=>a+(b.preco*b.quantidade),0)) ? (orc.itens.reduce((a,b)=>a+(b.preco*b.quantidade),0) - orc.total) : 0 
        }];
        
    setOpcoes(orcOpcoes);
    setAbaAtiva(orcOpcoes[0].id);
    setTermo({ validade: orc.validade_dias, prazo: orc.prazo_producao, entrada_percentual: Math.round((orc.entrada_valor / orc.total) * 100) });
    setView('novo');
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-slate-50"><Loader2 className="animate-spin text-blue-600" size={32} /></div>;

  if (view === 'config') {
    return (
      <div className="max-w-2xl mx-auto p-4 animate-in fade-in">
        <button onClick={() => setView('lista')} className="flex items-center gap-1.5 text-slate-500 font-medium text-[10px] md:text-xs uppercase tracking-widest mb-4 hover:text-slate-800 transition-colors">
          <ChevronLeft size={14} /> Voltar
        </button>
        <div className="bg-white p-4 md:p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-3 mb-5 border-b border-slate-100 pb-4">
            <div className="w-8 h-8 bg-slate-900 text-white rounded-lg flex items-center justify-center"><Building2 size={16}/></div>
            <div>
              <h2 className="text-sm font-semibold text-slate-800 uppercase tracking-tight">Dados da Empresa</h2>
              <p className="text-[9px] font-medium text-slate-500 uppercase tracking-widest mt-0.5">Aparecem no topo do PDF</p>
            </div>
          </div>
          <form onSubmit={salvarConfig} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5"><label className="text-[9px] font-semibold uppercase text-slate-500 tracking-widest">Nome da Empresa</label><Input value={config?.nome_loja || ''} onChange={e => setConfig({...config, nome_loja: e.target.value})} className="h-9 text-xs font-medium bg-slate-50 rounded-md" /></div>
              <div className="space-y-1.5"><label className="text-[9px] font-semibold uppercase text-slate-500 tracking-widest">CNPJ (Opcional)</label><Input value={config?.cnpj || ''} onChange={e => setConfig({...config, cnpj: e.target.value})} placeholder="00.000.000/0001-00" className="h-9 text-xs font-medium bg-slate-50 rounded-md" /></div>
              <div className="space-y-1.5"><label className="text-[9px] font-semibold uppercase text-slate-500 tracking-widest">Chave Pix</label><Input value={config?.chave_pix || ''} onChange={e => setConfig({...config, chave_pix: e.target.value})} placeholder="CPF, CNPJ, Email" className="h-9 text-xs font-medium bg-emerald-50 border-emerald-200 text-emerald-800 rounded-md" /></div>
              
              <div className="space-y-1.5">
                <label className="text-[9px] font-semibold uppercase text-slate-500 tracking-widest">Cor do Layout</label>
                <div className="flex gap-2 items-center">
                  <div className="relative w-9 h-9 rounded-md overflow-hidden shadow-sm border border-slate-200 shrink-0">
                    <Input type="color" value={config?.cor_orcamento || '#000000'} onChange={e => setConfig({...config, cor_orcamento: e.target.value})} className="absolute -inset-2 w-12 h-12 cursor-pointer appearance-none border-none p-0 bg-transparent" />
                  </div>
                  <Input value={config?.cor_orcamento || ''} onChange={e => setConfig({...config, cor_orcamento: e.target.value})} className="h-9 text-xs font-mono uppercase bg-slate-50 rounded-md" />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-[9px] font-semibold uppercase text-slate-500 tracking-widest">Cor do Nome</label>
                <div className="flex gap-2 items-center">
                  <div className="relative w-9 h-9 rounded-md overflow-hidden shadow-sm border border-slate-200 shrink-0">
                    <Input type="color" value={config?.cor_nome_empresa || '#000000'} onChange={e => setConfig({...config, cor_nome_empresa: e.target.value})} className="absolute -inset-2 w-12 h-12 cursor-pointer appearance-none border-none p-0 bg-transparent" />
                  </div>
                  <Input value={config?.cor_nome_empresa || ''} onChange={e => setConfig({...config, cor_nome_empresa: e.target.value})} className="h-9 text-xs font-mono uppercase bg-slate-50 rounded-md" />
                </div>
              </div>
            </div>
            <Button type="submit" className="w-full h-9 bg-slate-800 hover:bg-slate-900 text-white rounded-md font-semibold uppercase tracking-widest text-[10px] shadow-sm mt-2">Salvar Dados da Empresa</Button>
          </form>
        </div>
      </div>
    );
  }

  if (view === 'novo') {
    return (
      <div className="max-w-[1200px] mx-auto p-4 md:p-5 animate-in fade-in pb-32 md:pb-8 relative overflow-x-hidden">
        
        {/* MODAL DE VARIAÇÕES */}
        {produtoSendoAdicionado && (
           <div className="fixed inset-0 z-[200] bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
              <div className="bg-white rounded-xl p-4 md:p-5 w-full max-w-sm shadow-xl animate-in fade-in zoom-in-95">
                 <h3 className="text-[9px] font-semibold uppercase tracking-widest text-slate-500 mb-1">Configurar Item</h3>
                 <p className="text-sm font-semibold text-slate-800 mb-4 leading-tight">{produtoSendoAdicionado.nome}</p>
                 <div className="space-y-3">
                    {produtoSendoAdicionado.variacoes.atributos.map(atrib => (
                       <div key={atrib.id}>
                          <label className="text-[9px] font-semibold uppercase text-slate-500 mb-1.5 block">{atrib.nome}</label>
                          <div className="flex flex-wrap gap-2">
                             {atrib.opcoes.map(op => {
                               const isSelected = selecoesVariacao[atrib.nome]?.id === op.id;
                               return (
                                 <button
                                    key={op.id}
                                    onClick={() => setSelecoesVariacao({...selecoesVariacao, [atrib.nome]: op})}
                                    className={`px-2.5 py-1 rounded-md text-[10px] font-medium transition-all border shadow-sm ${isSelected ? 'bg-slate-800 text-white border-slate-800' : 'bg-white text-slate-600 hover:border-slate-300'}`}
                                 >
                                    {op.nome}
                                 </button>
                               );
                             })}
                          </div>
                       </div>
                    ))}
                 </div>
                 <div className="flex gap-2 mt-5">
                    <Button variant="outline" onClick={() => setProdutoSendoAdicionado(null)} className="flex-1 h-9 rounded-md font-semibold uppercase text-[9px] tracking-widest">Cancelar</Button>
                    <Button onClick={() => adicionarItemOrçamento(produtoSendoAdicionado, selecoesVariacao)} className="flex-1 h-9 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-semibold uppercase text-[9px] tracking-widest shadow-sm">Adicionar</Button>
                 </div>
              </div>
           </div>
        )}

        {/* CABEÇALHO EDITOR */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between mb-5 gap-3">
          <button onClick={() => setView('lista')} className="flex items-center gap-1.5 text-slate-500 font-medium text-[10px] md:text-xs uppercase tracking-widest hover:text-slate-800 transition-colors">
            <ChevronLeft size={14} /> Voltar
          </button>
          
          <div className="grid grid-cols-2 md:flex md:flex-wrap gap-2 md:gap-3">
             <Button onClick={() => setView('config')} variant="ghost" className="h-9 rounded-md font-semibold uppercase tracking-widest text-[9px] gap-1.5 text-slate-600 hover:bg-slate-100 border border-slate-200">
               <Settings size={12}/> <span className="hidden sm:inline">Empresa</span>
             </Button>
             <Button onClick={gerarTextoWhatsApp} variant="outline" className="h-9 rounded-md font-semibold uppercase tracking-widest text-[9px] gap-1.5 border border-slate-200 text-slate-600 hover:bg-slate-50">
               <Copy size={12}/> Copiar
             </Button>
             <Button onClick={gerarPDF} className="h-9 bg-slate-800 hover:bg-slate-900 text-white rounded-md font-semibold uppercase tracking-widest text-[9px] gap-1.5 shadow-sm">
               <Download size={12}/> PDF
             </Button>
             <Button onClick={salvarOrcamento} className="h-9 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md font-semibold uppercase tracking-widest text-[9px] gap-1.5 shadow-sm">
               <Save size={12}/> Salvar
             </Button>
          </div>
        </div>

        <div className="flex flex-col xl:flex-row gap-4 lg:gap-5">
          
          {/* COLUNA ESQUERDA: EDITOR DE ORÇAMENTO */}
          <div className="w-full xl:w-[45%] space-y-3 md:space-y-4">
            
            {/* CLIENTE */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-3 relative z-20">
              <h3 className="text-[10px] font-semibold uppercase text-slate-700 tracking-widest border-b border-slate-100 pb-2 flex items-center gap-1.5"><Building2 size={12} className="text-blue-500"/> Cliente</h3>
              <div className="space-y-2.5 pt-1">
                <div className="space-y-1.5 relative">
                  <label className="text-[9px] font-semibold uppercase tracking-widest text-slate-500 ml-1">Nome do Cliente</label>
                  <div className="relative">
                    <UserSquare2 className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                    <Input 
                      value={clienteAtual.nome} 
                      onChange={e => { 
                        setClienteAtual({...clienteAtual, nome: e.target.value}); 
                        setMostrarDropdownCliente(true); 
                      }} 
                      onFocus={() => setMostrarDropdownCliente(true)}
                      onBlur={() => setTimeout(() => setMostrarDropdownCliente(false), 200)}
                      placeholder="Busque ou digite o nome..." 
                      className="h-9 pl-8 font-medium bg-slate-50 border-slate-200 focus:bg-white rounded-md text-xs" 
                    />
                    
                    {mostrarDropdownCliente && clienteAtual.nome.length > 0 && (
                      <div className="absolute top-10 left-0 right-0 bg-white border border-slate-200 rounded-md shadow-lg max-h-48 overflow-y-auto p-1.5 space-y-0.5 z-50">
                        {clientes.filter(c => c.nome.toLowerCase().includes(clienteAtual.nome.toLowerCase())).length > 0 ? (
                          clientes.filter(c => c.nome.toLowerCase().includes(clienteAtual.nome.toLowerCase())).map(cli => (
                            <div 
                              key={cli.id} 
                              onMouseDown={() => selecionarClienteExistente(cli)} 
                              className="flex flex-col p-2 hover:bg-slate-50 rounded-md cursor-pointer transition-colors"
                            >
                              <span className="text-[10px] font-semibold text-slate-800 uppercase">{cli.nome}</span>
                              <span className="text-[9px] font-medium text-slate-400">{cli.whatsapp || 'Sem WhatsApp'}</span>
                            </div>
                          ))
                        ) : (
                          <div className="p-2 text-center">
                            <span className="text-[9px] font-medium text-slate-500 uppercase tracking-widest">Novo cliente será salvo automaticamente</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[9px] font-semibold uppercase tracking-widest text-slate-500 ml-1">WhatsApp / Telefone</label>
                  <Input value={clienteAtual.telefone} onChange={e => setClienteAtual({...clienteAtual, telefone: e.target.value})} placeholder="(00) 00000-0000" className="h-9 font-medium bg-slate-50 border-slate-200 focus:bg-white rounded-md text-xs" />
                </div>
              </div>
            </div>

            {/* ITENS DO PEDIDO */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-3 relative z-10">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <h3 className="text-[10px] font-semibold uppercase text-slate-700 tracking-widest flex items-center gap-1.5"><Layers size={12} className="text-emerald-500"/> Itens do Pedido</h3>
              </div>
              
              {/* --- ABAS DE OPÇÕES --- */}
              <div className="flex gap-2 overflow-x-auto pb-1 pt-1 no-scrollbar">
                {opcoes.map(op => (
                  <div key={op.id} onClick={() => setAbaAtiva(op.id)} className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-full cursor-pointer border shadow-sm shrink-0 transition-colors ${abaAtiva === op.id ? 'bg-slate-800 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}>
                    <input
                      value={op.titulo}
                      onChange={(e) => atualizarTituloOpcao(op.id, e.target.value)}
                      className={`bg-transparent outline-none w-20 text-[9px] font-semibold uppercase tracking-widest ${abaAtiva === op.id ? 'text-white' : 'text-slate-700'}`}
                      onClick={(e) => e.stopPropagation()}
                    />
                    {opcoes.length > 1 && (
                      <button onClick={(e) => { e.stopPropagation(); removerOpcao(op.id); }} className={`p-0.5 rounded-full ${abaAtiva === op.id ? 'text-slate-300 hover:text-white hover:bg-slate-700' : 'text-slate-400 hover:text-rose-500 hover:bg-rose-50'}`}>
                        <X size={10} />
                      </button>
                    )}
                  </div>
                ))}
                <button onClick={adicionarOpcao} className="text-[9px] font-semibold uppercase tracking-widest text-slate-500 hover:text-slate-800 px-2.5 py-1.5 rounded-full border border-dashed border-slate-300 hover:border-slate-400 hover:bg-slate-50 flex items-center gap-1 shrink-0 transition-colors">
                  <Plus size={10}/> Nova Opção
                </button>
              </div>

              <div className="relative pt-2">
                <Search className="absolute left-3 top-[calc(50%+4px)] -translate-y-1/2 text-slate-400" size={14} />
                <Input value={buscaProduto} onChange={e => setBuscaProduto(e.target.value)} placeholder={`Buscar produto para a ${opcaoAtual.titulo}...`} className="h-9 pl-8 font-medium text-xs bg-slate-50 border-slate-200 focus:bg-white rounded-md" />
                {buscaProduto && (
                  <div className="absolute top-12 left-0 right-0 bg-white border border-slate-200 rounded-md shadow-lg max-h-48 overflow-y-auto z-50 p-1.5 space-y-0.5">
                    {produtos.filter(p => p.nome.toLowerCase().includes(buscaProduto.toLowerCase())).map(prod => (
                      <div key={prod.id} onClick={() => processarCliqueProduto(prod)} className="flex items-center justify-between p-2 hover:bg-slate-50 rounded-md cursor-pointer">
                        <div className="flex flex-col">
                           <span className="text-[10px] font-semibold text-slate-800 uppercase">{prod.nome}</span>
                           {prod.variacoes?.ativa && <span className="text-[8px] font-semibold uppercase tracking-widest text-blue-500 mt-0.5">Tem Opções</span>}
                        </div>
                        <span className="text-[10px] font-semibold text-emerald-600">R$ {Number(prod.preco_promocional > 0 ? prod.preco_promocional : prod.preco).toFixed(2)}</span>
                      </div>
                    ))}
                    <button onClick={adicionarItemAvulso} className="w-full p-2 text-center text-[9px] font-semibold tracking-widest uppercase text-blue-600 hover:bg-blue-50 rounded-md mt-1 border border-blue-100">+ Criar Item Avulso</button>
                  </div>
                )}
              </div>
              <div className="space-y-2 mt-2">
                {opcaoAtual.itens.map((item) => (
                  <div key={item.id} className="bg-slate-50 p-2.5 rounded-md border border-slate-200 flex flex-col gap-2 group relative">
                    <button onClick={() => removerItem(item.id)} className="absolute -top-1.5 -right-1.5 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"><X size={10}/></button>
                    
                    <Input value={item.nome} onChange={e => atualizarNomeManual(item.id, e.target.value)} placeholder="Nome do Item" className="h-8 text-[11px] font-medium bg-white rounded-md border-slate-200" />

                    <div className="flex gap-2 items-center">
                       <div className="flex items-center border border-slate-200 rounded-md h-8 bg-white overflow-hidden w-20 shrink-0">
                          <button onClick={() => atualizarQuantidade(item.id, Math.max(1, item.quantidade - 1))} className="w-6 h-full flex items-center justify-center text-slate-500 hover:bg-slate-50"><Minus size={10}/></button>
                          <input type="text" value={item.quantidade} onChange={e => atualizarQuantidade(item.id, Number(e.target.value.replace(/\D/g, ''))||1)} className="w-full h-full text-center font-semibold text-slate-800 text-[11px] outline-none" />
                          <button onClick={() => atualizarQuantidade(item.id, item.quantidade + 1)} className="w-6 h-full flex items-center justify-center text-slate-500 hover:bg-slate-50"><Plus size={10}/></button>
                       </div>
                       <div className="relative flex-1">
                          <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-[10px] font-semibold">R$</span>
                          <Input type="number" value={item.preco} onChange={e => atualizarPrecoManual(item.id, Number(e.target.value))} className="h-8 pl-7 text-[11px] font-medium bg-white rounded-md border-slate-200" />
                       </div>
                    </div>
                  </div>
                ))}
                {opcaoAtual.itens.length === 0 && <p className="text-[9px] font-medium text-slate-400 uppercase tracking-widest text-center py-3">Nenhum item adicionado na {opcaoAtual.titulo}</p>}
              </div>
            </div>

            {/* CONDIÇÕES E DESCONTOS */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-3">
              <h3 className="text-[10px] font-semibold uppercase text-slate-700 tracking-widest border-b border-slate-100 pb-2 flex items-center gap-1.5"><FileText size={12} className="text-amber-500"/> Condições</h3>
              <div className="grid grid-cols-2 gap-3 pt-1">
                <div className="space-y-1.5"><label className="text-[9px] font-semibold uppercase tracking-widest text-slate-500 ml-1">Validade (Dias)</label><Input type="number" value={termo.validade} onChange={e => setTermo({...termo, validade: Number(e.target.value)})} className="h-9 text-xs font-medium bg-slate-50 rounded-md border-slate-200" /></div>
                <div className="space-y-1.5"><label className="text-[9px] font-semibold uppercase tracking-widest text-slate-500 ml-1">Sinal (%)</label><div className="relative"><Input type="number" value={termo.entrada_percentual} onChange={e => setTermo({...termo, entrada_percentual: Number(e.target.value)})} className="h-9 text-xs font-medium bg-emerald-50 text-emerald-700 border-emerald-200 pl-6 rounded-md" /><span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-emerald-500 font-semibold text-[10px]">%</span></div></div>
                <div className="space-y-1.5 col-span-2"><label className="text-[9px] font-semibold uppercase tracking-widest text-slate-500 ml-1">Prazo de Produção</label><Input value={termo.prazo} onChange={e => setTermo({...termo, prazo: e.target.value})} placeholder="Ex: 5 a 7 dias úteis" className="h-9 text-xs font-medium bg-slate-50 rounded-md border-slate-200" /></div>
                
                <div className="space-y-1.5 col-span-2">
                  <label className="text-[9px] font-semibold uppercase text-rose-500 tracking-widest ml-1">Dar Desconto na "{opcaoAtual.titulo}" (R$)</label>
                  <div className="relative">
                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-rose-500 font-semibold text-[10px]">R$</span>
                    <Input type="number" value={opcaoAtual.desconto || ''} onChange={e => atualizarDescontoOpcao(Number(e.target.value))} className="h-9 text-xs font-semibold bg-rose-50 text-rose-600 border-rose-200 pl-7 rounded-md" placeholder="0.00" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ========================================== */}
          {/* COLUNA DIREITA: PDF (OCULTO NO TELEMÓVEL)  */}
          {/* ========================================== */}
          <div className="fixed -left-[9999px] xl:static w-full xl:w-[55%] z-10">
             <div className="sticky top-20 space-y-3">
                <div className="flex items-center justify-between mb-1">
                  <h3 className="text-[9px] font-semibold uppercase tracking-widest text-slate-400 pl-1">Visualização do PDF</h3>
                </div>

                <div className="w-full bg-slate-100/50 p-4 rounded-xl border border-slate-200 flex justify-center overflow-auto max-h-[85vh]">
                  
                  {/* --- A FOLHA DINÂMICA --- */}
                  <div 
                    ref={printRef} 
                    className="bg-white shadow-md flex flex-col shrink-0 relative mx-auto"
                    style={{ 
                      width: '210mm', 
                      minHeight: '297mm', // Altura mínima de uma folha A4
                      height: 'max-content', // A MÁGICA: Deixa a folha esticar o quanto precisar
                      padding: '22mm', 
                      boxSizing: 'border-box' 
                    }}
                  >
                     
                     <div className="flex justify-between items-center border-b-[1px] pb-5 mb-6" style={{ borderColor: corBase }}>
                        <div className="flex gap-4 items-center">
                           {config?.logo_url && <img src={config.logo_url} className="h-14 w-14 object-contain rounded border border-slate-100" alt="Logo" />}
                           <div>
                              <h1 className="text-xl font-semibold uppercase tracking-tight leading-none" style={{ color: corNomeEmpresa }}>{config?.nome_loja || 'MINHA EMPRESA'}</h1>
                              {config?.cnpj && <p className="text-[9px] font-medium text-slate-500 uppercase mt-1 tracking-widest">CNPJ: {config.cnpj}</p>}
                           </div>
                        </div>
                        <div className="text-right">
                           <h2 className="text-2xl font-semibold uppercase tracking-tight" style={{ color: corBase }}>ORÇAMENTO</h2>
                           <div className="flex flex-col items-end gap-1 mt-1.5">
                             <span className="text-[9px] font-medium uppercase tracking-widest text-slate-500 bg-slate-50 px-2 py-0.5 rounded">Data: {new Date().toLocaleDateString('pt-BR')}</span>
                             <span className="text-[9px] font-medium uppercase tracking-widest text-slate-500 bg-slate-50 px-2 py-0.5 rounded">Validade: {termo.validade} dias</span>
                           </div>
                        </div>
                     </div>

                     <div className="mb-6">
                        <h3 className="text-[10px] font-semibold uppercase tracking-widest mb-2" style={{ color: corBase }}>Informações do Cliente</h3>
                        <div className="bg-slate-50 p-3 rounded-md border border-slate-100 flex justify-between items-center">
                           <div>
                              <p className="text-[8px] font-medium uppercase tracking-widest text-slate-400 mb-0.5">Nome / Razão Social</p>
                              <p className="text-xs font-semibold uppercase text-slate-800">{clienteAtual.nome || 'NÃO INFORMADO'}</p>
                           </div>
                           <div className="text-right">
                              <p className="text-[8px] font-medium uppercase tracking-widest text-slate-400 mb-0.5">Telefone / WhatsApp</p>
                              <p className="text-xs font-semibold uppercase text-slate-800">{clienteAtual.telefone || '--'}</p>
                           </div>
                        </div>
                     </div>

                     {/* LOOP DAS OPÇÕES NO PDF */}
                     <div className="flex-1 space-y-8">
                       {opcoes.map((opcao, index) => {
                          const subtotal = opcao.itens.reduce((acc, item) => acc + (item.preco * item.quantidade), 0);
                          const descontoReal = opcao.desconto || 0;
                          const totalOpt = Math.max(0, subtotal - descontoReal);
                          const entOpt = (totalOpt * termo.entrada_percentual) / 100;
                          const restOpt = totalOpt - entOpt;

                          return (
                            <div key={opcao.id} className={index > 0 ? "pt-8 border-t border-dashed border-slate-200" : ""}>
                               {opcoes.length > 1 && (
                                 <h3 className="text-xs font-semibold uppercase tracking-widest mb-2.5 px-2.5 py-1 bg-slate-50 rounded inline-block" style={{ color: corBase }}>
                                   {opcao.titulo}
                                 </h3>
                               )}
                               <table className="w-full text-left border-collapse rounded-md overflow-hidden border border-slate-100 mb-3">
                                  <thead>
                                     <tr style={{ backgroundColor: corBase }}>
                                        <th className="py-2 px-3 text-[9px] font-semibold uppercase tracking-widest text-white">Descrição do Item</th>
                                        <th className="py-2 px-3 text-[9px] font-semibold uppercase tracking-widest text-white text-center w-12">Qtd</th>
                                        <th className="py-2 px-3 text-[9px] font-semibold uppercase tracking-widest text-white text-right w-24">V. Unitário</th>
                                        <th className="py-2 px-3 text-[9px] font-semibold uppercase tracking-widest text-white text-right w-24">Total</th>
                                     </tr>
                                  </thead>
                                  <tbody className="bg-white">
                                     {opcao.itens.map((item, i) => (
                                        <tr key={i} className="border-b border-slate-50 last:border-0">
                                           <td className="py-2 px-3 text-[11px] font-medium text-slate-700 uppercase">{item.nome}</td>
                                           <td className="py-2 px-3 text-[11px] font-medium text-slate-700 text-center bg-slate-50/50">{item.quantidade}</td>
                                           <td className="py-2 px-3 text-[11px] font-medium text-slate-500 text-right">R$ {Number(item.preco).toFixed(2)}</td>
                                           <td className="py-2 px-3 text-[11px] font-semibold text-slate-800 text-right bg-slate-50/50">R$ {(item.preco * item.quantidade).toFixed(2)}</td>
                                        </tr>
                                     ))}
                                     {opcao.itens.length === 0 && (
                                       <tr><td colSpan="4" className="py-3 text-center text-[9px] font-medium uppercase tracking-widest text-slate-400">Nenhum item nesta opção</td></tr>
                                     )}
                                  </tbody>
                               </table>

                               <div className="flex justify-end">
                                 <div className="w-56 bg-slate-50 rounded-md p-3 border border-slate-100">
                                    <div className="flex justify-between text-[10px] text-slate-500 font-medium uppercase tracking-widest mb-1.5">
                                       <span>Subtotal</span><span>R$ {subtotal.toFixed(2)}</span>
                                    </div>
                                    {descontoReal > 0 && (
                                      <div className="flex justify-between text-[10px] text-rose-500 font-semibold uppercase tracking-widest mb-1.5">
                                         <span>Desconto</span><span>- R$ {descontoReal.toFixed(2)}</span>
                                      </div>
                                    )}
                                    <div className="flex justify-between text-[10px] font-semibold uppercase tracking-widest mb-1.5" style={{ color: corBase }}>
                                       <span>Sinal ({termo.entrada_percentual}%)</span><span>R$ {entOpt.toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between text-[10px] font-medium uppercase tracking-widest text-slate-500 pb-2 border-b border-slate-200">
                                       <span>Restante</span><span>R$ {restOpt.toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between items-end pt-2">
                                       <span className="text-[9px] font-semibold uppercase tracking-widest text-slate-400">Valor {opcoes.length > 1 ? 'da Opção' : 'Final'}</span>
                                       <span className="text-base font-semibold tracking-tight" style={{ color: corBase }}>R$ {totalOpt.toFixed(2)}</span>
                                    </div>
                                 </div>
                               </div>
                            </div>
                          )
                       })}
                     </div>

                     <div className="flex gap-5 mt-8 pt-4 border-t-[1px]" style={{ borderColor: corBase }}>
                        <div className="flex-1 space-y-3">
                           <div>
                              <p className="text-[9px] font-semibold uppercase tracking-widest text-slate-400 mb-0.5">Prazo de Produção</p>
                              <p className="text-[11px] font-medium text-slate-700 uppercase">{termo.prazo}</p>
                           </div>
                           <div>
                              <p className="text-[9px] font-semibold uppercase tracking-widest text-slate-400 mb-0.5">Pagamento PIX</p>
                              <p className="text-[11px] font-mono font-medium text-slate-700 break-all">{config?.chave_pix || 'A combinar'}</p>
                           </div>
                        </div>
                     </div>

                     <div className="mt-6 text-center pt-2 border-t border-slate-100">
                        <p className="text-[9px] font-medium uppercase tracking-widest text-slate-400">
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
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 pb-24">
      
      {/* HEADER FIXO - ESTILO EXECUTIVO */}
      <div className="border-b border-slate-200 bg-white/90 backdrop-blur-md sticky top-0 z-10 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 py-3 flex flex-col md:flex-row md:items-center justify-between gap-3">
          
          <div className="flex items-center gap-3">
            <h1 className="text-lg md:text-xl font-semibold text-slate-800 uppercase leading-none tracking-tight flex items-center gap-2">
              <FileText className="w-5 h-5 text-amber-500" /> Orçamentos
            </h1>
            <div className="h-6 w-px bg-slate-200 hidden md:block"></div>
            <p className="text-[9px] md:text-[10px] text-slate-500 font-medium uppercase tracking-widest hidden md:block mt-0.5">
              Propostas e Pedidos
            </p>
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto">
            <Button variant="outline" onClick={() => setView('config')} className="flex-1 md:flex-none h-9 border-slate-200 text-slate-600 rounded-md px-3 shadow-sm hover:bg-slate-50 font-semibold uppercase text-[9px] tracking-widest gap-1.5 shrink-0">
              <Settings size={12} /> <span className="hidden sm:inline">Configurações</span>
            </Button>
            <Button onClick={() => setView('novo')} className="flex-1 md:flex-none h-9 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-semibold uppercase tracking-widest text-[9px] gap-1.5 px-4 shadow-sm shrink-0">
              <Plus size={12} /> Novo Orçamento
            </Button>
          </div>

        </div>
      </div>

      <div className="max-w-5xl mx-auto space-y-5 px-4 mt-6 animate-in fade-in">

        {orcamentos.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-xl border border-slate-200 shadow-sm">
            <History size={32} className="mx-auto text-slate-300 mb-2.5" />
            <h3 className="text-sm font-semibold text-slate-800 uppercase tracking-tight mb-1">Nenhum orçamento</h3>
            <p className="text-[9px] font-medium uppercase text-slate-400 tracking-widest">Crie sua primeira proposta comercial.</p>
          </div>
        ) : (
          <div className="bg-transparent md:bg-white md:rounded-xl md:border md:border-slate-200 md:shadow-sm">
            
            {/* VERSÃO DESKTOP (TABELA LIMPA) */}
            <div className="hidden md:block overflow-x-auto pb-1">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/80">
                    <th className="p-3 text-[9px] font-semibold uppercase text-slate-400 tracking-widest">Nº / Data</th>
                    <th className="p-3 text-[9px] font-semibold uppercase text-slate-400 tracking-widest">Cliente</th>
                    <th className="p-3 text-[9px] font-semibold uppercase text-slate-400 tracking-widest">Tipo</th>
                    <th className="p-3 text-[9px] font-semibold uppercase text-slate-400 tracking-widest text-right">A partir de</th>
                    <th className="p-3 text-[9px] font-semibold uppercase text-slate-400 tracking-widest text-center w-40">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {orcamentos.map((orc) => {
                    const temOpcoes = orc.opcoes && orc.opcoes.length > 1;
                    return (
                      <tr key={orc.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="p-3">
                          <p className="text-xs font-semibold text-slate-800">#{String(orc.numero || 1).padStart(4, '0')}</p>
                          <p className="text-[9px] font-medium uppercase tracking-widest text-slate-500 mt-0.5">{new Date(orc.created_at).toLocaleDateString('pt-BR')}</p>
                        </td>
                        <td className="p-3">
                          <p className="text-xs font-semibold text-slate-800 uppercase truncate max-w-[200px]">{orc.cliente_nome}</p>
                          <p className="text-[9px] font-medium uppercase tracking-widest text-slate-500 mt-0.5">{orc.cliente_telefone || 'Sem contato'}</p>
                        </td>
                        <td className="p-3">
                          {temOpcoes 
                            ? <span className="bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full border border-blue-100 text-[8px] font-semibold uppercase tracking-widest">{orc.opcoes.length} Opções</span> 
                            : <span className="text-[9px] font-medium text-slate-400 uppercase tracking-widest">Opção Única</span>}
                        </td>
                        <td className="p-3 text-right text-xs font-semibold text-slate-800">
                          R$ {Number(orc.total).toFixed(2)}
                        </td>
                        <td className="p-3">
                           <div className="flex justify-center gap-1">
                             <Button variant="ghost" onClick={() => iniciarAprovacao(orc)} className="h-7 px-2 rounded-md bg-emerald-50 text-emerald-600 hover:bg-emerald-100 font-semibold tracking-widest text-[8px] uppercase border border-emerald-100">
                               Aprovar
                             </Button>
                             <Button variant="ghost" onClick={() => abrirOrcamentoParaEdicao(orc)} className="h-7 px-2 rounded-md bg-blue-50 text-blue-600 hover:bg-blue-100 font-semibold tracking-widest text-[8px] uppercase border border-blue-100">
                               Ver
                             </Button>
                             <button onClick={async () => {
                               if(confirm("Excluir este orçamento?")) {
                                 await supabase.from('orcamentos').delete().eq('id', orc.id);
                                 fetchData();
                               }
                             }} className="h-7 w-7 flex items-center justify-center rounded-md bg-rose-50 text-rose-500 hover:bg-rose-100 border border-rose-100 transition-colors">
                               <Trash2 size={12}/>
                             </button>
                           </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {/* VERSÃO MOBILE (CARDS) */}
            <div className="md:hidden flex flex-col gap-3">
               {orcamentos.map((orc) => {
                  const temOpcoes = orc.opcoes && orc.opcoes.length > 1;
                  return (
                    <div key={orc.id} className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex flex-col gap-3">
                      <div className="flex justify-between items-center border-b border-slate-100 pb-2.5">
                        <div>
                          <p className="text-xs font-semibold text-slate-800">#{String(orc.numero || 1).padStart(4, '0')}</p>
                          <p className="text-[9px] font-medium uppercase tracking-widest text-slate-400 mt-0.5">{new Date(orc.created_at).toLocaleDateString('pt-BR')}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-[8px] font-medium text-slate-400 uppercase tracking-widest">A partir de</p>
                          <p className="text-sm font-semibold text-slate-800 leading-none mt-0.5">R$ {Number(orc.total).toFixed(2)}</p>
                        </div>
                      </div>
                      <div className="flex justify-between items-end">
                        <div className="overflow-hidden pr-2">
                          <p className="text-[8px] font-semibold text-slate-400 uppercase tracking-widest mb-0.5">Cliente</p>
                          <p className="text-xs font-semibold text-slate-800 uppercase truncate">{orc.cliente_nome}</p>
                          <div className="mt-1.5">
                             {temOpcoes ? <span className="bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full border border-blue-100 text-[8px] font-semibold uppercase tracking-widest">{orc.opcoes.length} Opções</span> : <span className="text-[8px] font-medium text-slate-400 uppercase tracking-widest border border-slate-100 px-2 py-0.5 rounded-full">Opção Única</span>}
                          </div>
                        </div>
                        <div className="flex flex-col gap-1.5 shrink-0">
                           <div className="flex gap-1.5 justify-end">
                             <Button variant="ghost" onClick={() => abrirOrcamentoParaEdicao(orc)} className="h-7 px-2.5 rounded-md bg-blue-50 text-blue-600 font-semibold tracking-widest text-[8px] uppercase border border-blue-100">
                               Visualizar
                             </Button>
                             <button onClick={async () => {
                               if(confirm("Excluir este orçamento?")) {
                                 await supabase.from('orcamentos').delete().eq('id', orc.id);
                                 fetchData();
                               }
                             }} className="h-7 w-7 flex items-center justify-center rounded-md bg-rose-50 text-rose-500 border border-rose-100">
                               <Trash2 size={12}/>
                             </button>
                           </div>
                           <Button variant="ghost" onClick={() => iniciarAprovacao(orc)} className="h-7 px-3 w-full rounded-md bg-emerald-50 text-emerald-600 font-semibold tracking-widest text-[8px] uppercase border border-emerald-100 flex items-center justify-center gap-1">
                             <CheckCircle2 size={10} /> Aprovar
                           </Button>
                        </div>
                      </div>
                    </div>
                  )
               })}
            </div>

          </div>
        )}
      </div>

      {/* MODAL DE SELEÇÃO DE OPÇÃO AO APROVAR (Quando há mais de 1 opção) */}
      {modalAprovacaoMult && (
         <div className="fixed inset-0 z-[300] bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-xl p-5 w-full max-w-sm shadow-xl animate-in fade-in zoom-in-95">
               <div className="flex justify-between items-center mb-4 border-b border-slate-100 pb-3">
                 <h3 className="text-sm font-semibold uppercase text-slate-800 tracking-tight">Qual opção o cliente aprovou?</h3>
                 <button onClick={() => setModalAprovacaoMult(null)} className="text-slate-400 hover:text-slate-700"><X size={16}/></button>
               </div>
               <div className="space-y-2.5">
                 {modalAprovacaoMult.opcoes.map(opcao => {
                    const subtotal = opcao.itens.reduce((acc, item) => acc + (item.preco * item.quantidade), 0);
                    const total = Math.max(0, subtotal - (opcao.desconto || 0));
                    return (
                      <button 
                         key={opcao.id} 
                         onClick={() => efetivarAprovacao(modalAprovacaoMult.orcamento, opcao)}
                         className="w-full text-left p-3 rounded-lg border border-slate-200 hover:border-emerald-300 hover:bg-emerald-50/50 transition-colors flex justify-between items-center group"
                      >
                         <div>
                            <p className="font-semibold text-slate-800 text-xs uppercase group-hover:text-emerald-700">{opcao.titulo}</p>
                            <p className="text-[9px] font-medium text-slate-500 uppercase tracking-widest mt-0.5">{opcao.itens.length} itens</p>
                         </div>
                         <div className="text-right">
                            <p className="text-sm font-semibold text-emerald-600">R$ {total.toFixed(2)}</p>
                         </div>
                      </button>
                    )
                 })}
               </div>
            </div>
         </div>
      )}

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