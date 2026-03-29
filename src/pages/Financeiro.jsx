import React, { useState, useMemo } from 'react';
import { supabase } from "../lib/supabase";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  Search, Plus, Trash2, Edit3, CheckCircle2, 
  AlertCircle, X, Calendar, Loader2, ArrowUpCircle, 
  ArrowDownCircle, MoreVertical, CreditCard, Filter
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AnimatePresence, motion } from "framer-motion";

export default function Despesas() {
  const queryClient = useQueryClient();

  // --- ESTADOS DE FILTROS ---
  const [searchTerm, setSearchTerm] = useState('');
  const [contaFilter, setContaFilter] = useState('Todas');
  const [tabAtual, setTabAtual] = useState('Todos'); // 'Todos', 'Receber', 'Pagar'
  
  // Datas para filtro (Padrão: Mês atual)
  const hoje = new Date();
  const primeiroDiaMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1).toISOString().split('T')[0];
  const ultimoDiaMes = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0).toISOString().split('T')[0];
  const [dataInicio, setDataInicio] = useState(primeiroDiaMes);
  const [dataFim, setDataFim] = useState(ultimoDiaMes);

  // --- ESTADOS DE MODAIS ---
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingLancamento, setEditingLancamento] = useState(null);
  
  const [isPayModalOpen, setIsPayModalOpen] = useState(false);
  const [payData, setPayData] = useState({ id: null, descricao: '', valorTotal: 0, valorJaPago: 0, valorPagamentoAgora: 0, tipo: 'saida' });

  const [menuAbertoId, setMenuAbertoId] = useState(null);

  // --- 1. LER LANÇAMENTOS (Antiga Despesas) ---
  const { data: lancamentos = [], isLoading } = useQuery({
    queryKey: ["sistema-lancamentos", dataInicio, dataFim],
    queryFn: async () => {
      let query = supabase.from("despesas").select("*").order("vencimento", { ascending: true });
      if (dataInicio) query = query.gte('vencimento', dataInicio);
      if (dataFim) query = query.lte('vencimento', dataFim);
      
      const { data, error } = await query;
      if (error && error.code === '42P01') return []; 
      if (error) throw error;
      return data || [];
    },
  });

  // --- 2. CRIAR/EDITAR LANÇAMENTO ---
  const saveMutation = useMutation({
    mutationFn: async (data) => {
      const valor = Number(data.valor || 0);
      const valorPago = Number(data.valor_pago || 0);
      
      let status = 'pendente';
      if (valorPago >= valor) status = 'pago';
      else if (valorPago > 0) status = 'parcial';

      const payload = {
        tipo: data.tipo || 'saida',
        descricao: data.descricao,
        pessoa: data.pessoa || '',
        conta_bancaria: data.conta_bancaria || 'Principal',
        valor: valor,
        valor_pago: valorPago,
        vencimento: data.vencimento,
        categoria: data.categoria || 'Geral',
        status: status
      };

      if (data.id) {
        const { error } = await supabase.from("despesas").update(payload).eq("id", data.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("despesas").insert([payload]);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sistema-lancamentos"] });
      setIsModalOpen(false);
      setEditingLancamento(null);
    },
  });

  // --- 3. APAGAR ---
  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      const { error } = await supabase.from("despesas").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["sistema-lancamentos"] }),
  });

  // --- 4. REGISTRAR PAGAMENTO/RECEBIMENTO ---
  const registerPaymentMutation = useMutation({
    mutationFn: async ({ id, valorJaPago, valorPagamentoAgora, valorTotal }) => {
      const novoValorPago = Number(valorJaPago) + Number(valorPagamentoAgora);
      let novoStatus = 'pendente';
      
      if (novoValorPago >= valorTotal) novoStatus = 'pago';
      else if (novoValorPago > 0) novoStatus = 'parcial';

      const { error } = await supabase.from("despesas").update({ valor_pago: novoValorPago, status: novoStatus }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sistema-lancamentos"] });
      setIsPayModalOpen(false);
      setMenuAbertoId(null);
    },
  });

  const handleSave = () => {
    if (!editingLancamento.descricao || !editingLancamento.valor || !editingLancamento.vencimento) {
      return alert("Preencha descrição, valor e vencimento.");
    }
    saveMutation.mutate(editingLancamento);
  };

  const handleNew = (tipoPadrao = 'entrada') => {
    setEditingLancamento({
      tipo: tipoPadrao,
      descricao: '',
      pessoa: '',
      conta_bancaria: 'Principal',
      valor: '',
      valor_pago: 0,
      vencimento: new Date().toISOString().split('T')[0],
      categoria: 'Geral',
      status: 'pendente'
    });
    setIsModalOpen(true);
  };

  const openPayModal = (lancamento) => {
    const restante = Number(lancamento.valor) - Number(lancamento.valor_pago || 0);
    setPayData({
      id: lancamento.id,
      descricao: lancamento.descricao,
      tipo: lancamento.tipo || 'saida',
      valorTotal: Number(lancamento.valor),
      valorJaPago: Number(lancamento.valor_pago || 0),
      valorPagamentoAgora: restante > 0 ? restante : 0
    });
    setIsPayModalOpen(true);
    setMenuAbertoId(null);
  };

  // --- LÓGICA DE FILTROS E RESUMO ---
  const filtrados = useMemo(() => {
    return lancamentos.filter(l => {
      const matchSearch = l.descricao.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          (l.pessoa && l.pessoa.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchConta = contaFilter === 'Todas' || l.conta_bancaria === contaFilter;
      const matchTab = tabAtual === 'Todos' || 
                       (tabAtual === 'Receber' && l.tipo === 'entrada') || 
                       (tabAtual === 'Pagar' && (!l.tipo || l.tipo === 'saida'));
      return matchSearch && matchConta && matchTab;
    });
  }, [lancamentos, searchTerm, contaFilter, tabAtual]);

  const entradas = filtrados.filter(l => l.tipo === 'entrada');
  const saidas = filtrados.filter(l => !l.tipo || l.tipo === 'saida');

  // Cálculos do Resumo (Soma os valores esperados no período)
  const totalRecebido = entradas.reduce((acc, l) => acc + Number(l.valor), 0);
  const totalSaidas = saidas.reduce((acc, l) => acc + Number(l.valor), 0);
  const resultado = totalRecebido - totalSaidas;

  const contasDisponiveis = ['Todas', ...new Set(lancamentos.map(l => l.conta_bancaria || 'Principal'))];

  // --- LÓGICA DE DATAS E AVISOS ---
  const formatarData = (dataString) => {
    if (!dataString) return '--';
    const [ano, mes, dia] = dataString.split('-');
    return `${dia}/${mes}/${ano.substring(2)}`;
  };

  const analisarStatus = (vencimentoStr, status) => {
    if (status === 'pago') return { tag: 'Liquidado', color: 'text-emerald-600 bg-emerald-50 border-emerald-200', info: '' };
    
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    const vencimento = new Date(`${vencimentoStr}T00:00:00`);
    const diffTime = vencimento.getTime() - hoje.getTime();
    const diffDias = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDias < 0) return { tag: 'Atrasado', color: 'text-red-600 bg-red-50 border-red-200', info: `${diffDias}d` };
    if (diffDias === 0) return { tag: 'Pendente', color: 'text-amber-600 bg-amber-50 border-amber-200', info: 'Hoje' };
    return { tag: 'Pendente', color: 'text-slate-500 bg-slate-50 border-slate-200', info: `em ${diffDias}d` };
  };

  // --- COMPONENTE DE LINHA (Item da Lista) ---
  const LancamentoItem = ({ item }) => {
    const isEntrada = item.tipo === 'entrada';
    const { tag, color, info } = analisarStatus(item.vencimento, item.status);
    const isMenuOpen = menuAbertoId === item.id;

    return (
      <div className="flex items-center justify-between p-3.5 hover:bg-slate-50/50 border-b border-slate-100 last:border-0 transition-colors group relative">
        <div className="flex items-center gap-4 flex-1 min-w-0">
           
           {/* Bloco 1: Data e Status */}
           <div className="flex flex-col items-center justify-center w-[85px] shrink-0">
             <div className={`text-[9px] font-bold px-1.5 py-0.5 rounded-sm border uppercase flex items-center gap-1 mb-1 ${color}`}>
               {tag === 'Atrasado' && <AlertCircle size={8}/>} {tag}
             </div>
             <div className="text-[10px] font-semibold text-slate-600 flex items-center gap-1">
               {formatarData(item.vencimento)}
               {info && <span className={`text-[9px] font-bold ${tag === 'Atrasado' ? 'text-red-500' : tag === 'Pendente' && info==='Hoje' ? 'text-amber-500' : 'text-slate-400'}`}>{info}</span>}
             </div>
           </div>

           {/* Bloco 2: Descrição e Pessoa */}
           <div className="flex flex-col flex-1 min-w-0 px-2">
             <p className={`text-sm font-semibold truncate ${item.status === 'pago' ? 'text-slate-400 line-through decoration-slate-300' : 'text-slate-800'}`}>
               {item.descricao}
             </p>
             {item.pessoa && <p className="text-[10px] font-medium text-slate-400 truncate mt-0.5 flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-slate-100 flex items-center justify-center"><Calendar size={8}/></span> {item.pessoa}</p>}
           </div>
        </div>

        {/* Bloco 3: Valores e Ações */}
        <div className="flex items-center gap-4 shrink-0">
           <div className="flex flex-col items-end">
             <p className={`text-sm font-bold ${isEntrada ? 'text-emerald-600' : 'text-red-600'}`}>
               {isEntrada ? '+ ' : '- '}R$ {Number(item.valor).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
             </p>
             <p className="text-[9px] font-medium text-slate-400 uppercase tracking-widest mt-0.5">{item.conta_bancaria || 'Principal'}</p>
           </div>
           
           <div className="relative">
             <button onClick={() => setMenuAbertoId(isMenuOpen ? null : item.id)} className="p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 rounded-md transition-colors">
               <MoreVertical size={16} />
             </button>
             
             {isMenuOpen && (
               <>
                 <div className="fixed inset-0 z-40" onClick={() => setMenuAbertoId(null)}></div>
                 <div className="absolute right-0 top-8 w-36 bg-white border border-slate-200 shadow-xl rounded-lg py-1 z-50 flex flex-col">
                   <button onClick={() => openPayModal(item)} className="px-4 py-2 text-[11px] font-semibold text-slate-700 hover:bg-slate-50 hover:text-blue-600 text-left flex items-center gap-2"><CheckCircle2 size={14}/> Baixar (Pagar)</button>
                   <button onClick={() => { setEditingLancamento(item); setIsModalOpen(true); setMenuAbertoId(null); }} className="px-4 py-2 text-[11px] font-semibold text-slate-700 hover:bg-slate-50 hover:text-amber-600 text-left flex items-center gap-2"><Edit3 size={14}/> Editar</button>
                   <button onClick={() => { if(window.confirm('Excluir lançamento?')) deleteMutation.mutate(item.id); setMenuAbertoId(null); }} className="px-4 py-2 text-[11px] font-semibold text-red-600 hover:bg-red-50 text-left flex items-center gap-2 border-t border-slate-50"><Trash2 size={14}/> Excluir</button>
                 </div>
               </>
             )}
           </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-20 text-slate-900 font-sans">
      
      {/* HEADER TIPO DASHBOARD */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 md:py-8 flex flex-col md:flex-row justify-between gap-6">
          
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-slate-900 text-white rounded-xl flex items-center justify-center shadow-md">
              <ArrowUpCircle size={20} className="absolute -translate-x-1.5 -translate-y-1.5 text-emerald-400" />
              <ArrowDownCircle size={20} className="absolute translate-x-1.5 translate-y-1.5 text-red-400" />
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight">Lançamentos Financeiros</h1>
              <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-widest mt-0.5">Contas a Pagar e Contas a Receber</p>
            </div>
          </div>

          <div className="flex gap-3 items-center">
            <Button onClick={() => handleNew('saida')} variant="outline" className="h-10 text-red-600 border-red-200 hover:bg-red-50 hover:border-red-300 font-bold uppercase text-[10px] md:text-xs shadow-sm">
              + Nova Saída
            </Button>
            <Button onClick={() => handleNew('entrada')} className="h-10 bg-slate-900 hover:bg-slate-800 text-white font-bold uppercase text-[10px] md:text-xs shadow-sm">
              + Nova Entrada
            </Button>
          </div>

        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 mt-8 space-y-8">
        
        {/* SESSÃO 1: RESUMO DO PERÍODO */}
        <div className="flex flex-col lg:flex-row gap-6">
           <div className="w-full lg:w-1/3 space-y-4">
             <h3 className="text-[10px] font-bold uppercase text-slate-400 tracking-widest ml-1">Resumo do Período</h3>
             <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden divide-y divide-slate-100">
                <div className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-2.5"><div className="w-2 h-2 rounded-full bg-emerald-500"></div><span className="text-xs font-semibold text-slate-600">Total Recebido</span></div>
                  <span className="font-bold text-emerald-600 text-sm">+ R$ {totalRecebido.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-2.5"><div className="w-2 h-2 rounded-full bg-red-500"></div><span className="text-xs font-semibold text-slate-600">Total Saídas</span></div>
                  <span className="font-bold text-red-600 text-sm">- R$ {totalSaidas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                </div>
                <div className={`p-4 flex items-center justify-between ${resultado >= 0 ? 'bg-emerald-50/50' : 'bg-amber-50/50'}`}>
                  <div className="flex items-center gap-2.5"><div className={`w-2 h-2 rounded-full ${resultado >= 0 ? 'bg-emerald-600' : 'bg-amber-500'}`}></div><span className="text-xs font-bold text-slate-800">Resultado</span></div>
                  <span className={`font-black text-base ${resultado >= 0 ? 'text-emerald-700' : 'text-amber-700'}`}>
                    {resultado >= 0 ? '+' : '-'} R$ {Math.abs(resultado).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </span>
                </div>
             </div>
           </div>

           {/* FILTROS AVANÇADOS */}
           <div className="w-full lg:w-2/3 flex flex-col justify-end space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                 <div className="md:col-span-2 space-y-1.5">
                   <label className="text-[10px] font-semibold uppercase text-slate-500 ml-1">Buscar</label>
                   <div className="relative">
                     <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                     <input type="text" placeholder="Descrição ou cliente..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full h-10 pl-8 pr-3 bg-white outline-none text-xs font-medium border border-slate-200 rounded-lg focus:border-blue-400 transition-colors shadow-sm" />
                   </div>
                 </div>
                 <div className="space-y-1.5">
                   <label className="text-[10px] font-semibold uppercase text-slate-500 ml-1">Data Início</label>
                   <div className="relative">
                     <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                     <input type="date" value={dataInicio} onChange={(e) => setDataInicio(e.target.value)} className="w-full h-10 pl-8 pr-2 bg-white outline-none text-[11px] font-semibold text-slate-700 border border-slate-200 rounded-lg focus:border-blue-400 transition-colors shadow-sm" />
                   </div>
                 </div>
                 <div className="space-y-1.5">
                   <label className="text-[10px] font-semibold uppercase text-slate-500 ml-1">Data Fim</label>
                   <div className="relative">
                     <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                     <input type="date" value={dataFim} onChange={(e) => setDataFim(e.target.value)} className="w-full h-10 pl-8 pr-2 bg-white outline-none text-[11px] font-semibold text-slate-700 border border-slate-200 rounded-lg focus:border-blue-400 transition-colors shadow-sm" />
                   </div>
                 </div>
              </div>
              <div className="flex items-center gap-4 border-b border-slate-200 pb-0">
                 <div className="flex gap-6">
                   {[
                     { id: 'Todos', label: 'Todos', count: filtrados.length },
                     { id: 'Receber', label: 'A Receber', count: entradas.length },
                     { id: 'Pagar', label: 'A Pagar', count: saidas.length }
                   ].map(tab => (
                     <button key={tab.id} onClick={() => setTabAtual(tab.id)} className={`pb-3 text-xs font-bold uppercase tracking-widest relative transition-colors flex items-center gap-1.5 ${tabAtual === tab.id ? 'text-slate-900' : 'text-slate-400 hover:text-slate-600'}`}>
                       {tab.label} <span className={`px-1.5 py-0.5 rounded-full text-[9px] ${tabAtual === tab.id ? 'bg-slate-200 text-slate-700' : 'bg-slate-100 text-slate-400'}`}>{tab.count}</span>
                       {tabAtual === tab.id && <motion.div layoutId="activeTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-slate-900 rounded-t-full" />}
                     </button>
                   ))}
                 </div>
                 <div className="ml-auto pb-3 flex items-center gap-2">
                    <Filter size={12} className="text-slate-400"/>
                    <select value={contaFilter} onChange={(e) => setContaFilter(e.target.value)} className="text-[10px] font-bold text-slate-600 uppercase bg-transparent outline-none cursor-pointer">
                      {contasDisponiveis.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                 </div>
              </div>
           </div>
        </div>

        {/* SESSÃO 2: COLUNAS DE LISTAGEM */}
        {isLoading ? (
          <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-slate-400" /></div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pb-10">
            
            {/* COLUNA: ENTRADAS */}
            {(tabAtual === 'Todos' || tabAtual === 'Receber') && (
              <div className="bg-white border border-slate-200 rounded-xl shadow-sm flex flex-col h-fit">
                 <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50 rounded-t-xl">
                   <div className="flex items-center gap-2">
                     <div className="w-1 h-4 bg-emerald-500 rounded-full"></div>
                     <h3 className="font-bold text-xs uppercase tracking-widest text-slate-800">Entradas</h3>
                     <span className="text-[10px] font-medium text-slate-400">{entradas.length} itens</span>
                   </div>
                   <button onClick={() => handleNew('entrada')} className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-md text-[9px] font-bold uppercase tracking-widest transition-colors flex items-center gap-1 shadow-sm">
                     <Plus size={12}/> Entrada
                   </button>
                 </div>
                 <div className="flex flex-col max-h-[600px] overflow-y-auto no-scrollbar">
                   {entradas.length === 0 ? (
                     <div className="p-10 text-center text-[10px] font-bold uppercase text-slate-400 tracking-widest">Nenhuma entrada no período</div>
                   ) : (
                     entradas.map(item => <LancamentoItem key={item.id} item={item} />)
                   )}
                 </div>
              </div>
            )}

            {/* COLUNA: SAÍDAS */}
            {(tabAtual === 'Todos' || tabAtual === 'Pagar') && (
              <div className="bg-white border border-slate-200 rounded-xl shadow-sm flex flex-col h-fit">
                 <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50 rounded-t-xl">
                   <div className="flex items-center gap-2">
                     <div className="w-1 h-4 bg-red-500 rounded-full"></div>
                     <h3 className="font-bold text-xs uppercase tracking-widest text-slate-800">Saídas</h3>
                     <span className="text-[10px] font-medium text-slate-400">{saidas.length} itens</span>
                   </div>
                   <button onClick={() => handleNew('saida')} className="bg-red-50 hover:bg-red-100 text-red-600 px-3 py-1.5 rounded-md text-[9px] font-bold uppercase tracking-widest transition-colors flex items-center gap-1 shadow-sm border border-red-200">
                     <Plus size={12}/> Saída
                   </button>
                 </div>
                 <div className="flex flex-col max-h-[600px] overflow-y-auto no-scrollbar">
                   {saidas.length === 0 ? (
                     <div className="p-10 text-center text-[10px] font-bold uppercase text-slate-400 tracking-widest">Nenhuma saída no período</div>
                   ) : (
                     saidas.map(item => <LancamentoItem key={item.id} item={item} />)
                   )}
                 </div>
              </div>
            )}

          </div>
        )}
      </div>

      {/* --- MODAIS MANTIDOS E ATUALIZADOS PARA O NOVO VISUAL --- */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsModalOpen(false)} className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" />
            <motion.div initial={{ scale: 0.95, opacity: 0, y: 10 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 10 }} className="bg-white w-full max-w-lg rounded-2xl p-6 shadow-2xl relative z-10 overflow-hidden">
              
              <div className="flex justify-between items-center mb-6 border-b border-slate-100 pb-4">
                <h2 className="text-lg font-black text-slate-800 uppercase tracking-tight">
                  {editingLancamento?.id ? 'Editar Lançamento' : 'Novo Lançamento'}
                </h2>
                <button onClick={() => setIsModalOpen(false)} className="p-1.5 hover:bg-slate-100 text-slate-500 rounded-md transition-colors"><X className="w-5 h-5" /></button>
              </div>
              
              <div className="space-y-4">
                <div className="flex bg-slate-100 p-1 rounded-lg">
                  <button onClick={() => setEditingLancamento({...editingLancamento, tipo: 'entrada'})} className={`flex-1 py-2 text-[10px] font-bold uppercase rounded-md transition-colors ${editingLancamento.tipo === 'entrada' ? 'bg-emerald-500 text-white shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>Entrada (Receita)</button>
                  <button onClick={() => setEditingLancamento({...editingLancamento, tipo: 'saida'})} className={`flex-1 py-2 text-[10px] font-bold uppercase rounded-md transition-colors ${editingLancamento.tipo === 'saida' ? 'bg-red-500 text-white shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>Saída (Despesa)</button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5 md:col-span-2">
                    <label className="text-[10px] font-bold uppercase text-slate-500 tracking-widest ml-1">Descrição</label>
                    <Input placeholder="Ex: Venda Pedido #20, Conta de Luz..." value={editingLancamento.descricao} onChange={e => setEditingLancamento({...editingLancamento, descricao: e.target.value})} className="h-10 border-slate-200 bg-slate-50 font-semibold text-sm" />
                  </div>
                  
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold uppercase text-slate-500 tracking-widest ml-1">{editingLancamento.tipo === 'entrada' ? 'Cliente' : 'Fornecedor'} (Opcional)</label>
                    <Input placeholder="Ex: Ana Maria" value={editingLancamento.pessoa || ''} onChange={e => setEditingLancamento({...editingLancamento, pessoa: e.target.value})} className="h-10 border-slate-200 bg-slate-50 font-semibold text-sm" />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold uppercase text-slate-500 tracking-widest ml-1">Conta Bancária</label>
                    <Input placeholder="Ex: Inter, Caixa, Espécie..." value={editingLancamento.conta_bancaria || ''} onChange={e => setEditingLancamento({...editingLancamento, conta_bancaria: e.target.value})} className="h-10 border-slate-200 bg-slate-50 font-semibold text-sm" />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold uppercase text-slate-500 tracking-widest ml-1">Valor Total (R$)</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-semibold text-sm">R$</span>
                      <Input type="number" value={editingLancamento.valor} onChange={e => setEditingLancamento({...editingLancamento, valor: e.target.value})} className="h-10 pl-9 border-slate-200 bg-slate-50 font-bold text-slate-800 text-sm" />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold uppercase text-slate-500 tracking-widest ml-1">Vencimento / Data</label>
                    <Input type="date" value={editingLancamento.vencimento} onChange={e => setEditingLancamento({...editingLancamento, vencimento: e.target.value})} className="h-10 border-slate-200 bg-slate-50 font-semibold text-slate-800 text-sm" />
                  </div>
                </div>

                <div className="pt-4 mt-2 border-t border-slate-100">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold uppercase text-blue-500 tracking-widest ml-1">Valor Já Recebido/Pago (R$)</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-blue-400 font-semibold text-sm">R$</span>
                      <Input type="number" value={editingLancamento.valor_pago || 0} onChange={e => setEditingLancamento({...editingLancamento, valor_pago: e.target.value})} className="h-10 pl-9 border-blue-200 bg-blue-50 font-bold text-blue-700 text-sm" />
                    </div>
                  </div>
                </div>

                <Button onClick={handleSave} disabled={saveMutation.isPending} className="w-full h-11 bg-slate-900 hover:bg-slate-800 text-white rounded-md font-bold uppercase text-xs mt-4 shadow-sm">
                  {saveMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Salvar Lançamento"}
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isPayModalOpen && (
          <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsPayModalOpen(false)} className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" />
            <motion.div initial={{ scale: 0.95, opacity: 0, y: 10 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 10 }} className="bg-white w-full max-w-sm rounded-2xl p-6 shadow-xl relative z-10 overflow-hidden">
              
              <div className="flex justify-between items-center mb-5 border-b border-slate-100 pb-4">
                <div className="flex items-center gap-2.5">
                  <div className={`w-8 h-8 rounded-md flex items-center justify-center border ${payData.tipo === 'entrada' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-red-50 text-red-500 border-red-100'}`}><CreditCard size={16}/></div>
                  <h2 className="text-lg font-black text-slate-800 uppercase tracking-tight leading-none">{payData.tipo === 'entrada' ? 'Receber' : 'Pagar'}</h2>
                </div>
                <button onClick={() => setIsPayModalOpen(false)} className="p-1.5 hover:bg-slate-100 text-slate-500 rounded-md"><X className="w-5 h-5" /></button>
              </div>

              <div className="space-y-4">
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-center">
                  <p className="text-[10px] font-semibold uppercase text-slate-500 mb-1">{payData.tipo === 'entrada' ? 'Recebendo' : 'Pagando'}</p>
                  <p className="text-sm font-bold text-slate-800 line-clamp-1">{payData.descricao}</p>
                </div>

                <div className="flex justify-between items-center text-xs font-semibold px-1">
                  <span className="text-slate-500 uppercase">Valor Total:</span>
                  <span className="text-slate-800">R$ {payData.valorTotal.toFixed(2)}</span>
                </div>
                
                <div className="flex justify-between items-center text-xs font-semibold px-1">
                  <span className={`${payData.tipo === 'entrada' ? 'text-emerald-600' : 'text-blue-600'} uppercase`}>Já Baixado:</span>
                  <span className={`${payData.tipo === 'entrada' ? 'text-emerald-700' : 'text-blue-700'}`}>R$ {payData.valorJaPago.toFixed(2)}</span>
                </div>

                <div className="space-y-1.5 pt-3 border-t border-slate-100">
                  <label className="text-[10px] font-bold uppercase text-slate-500 ml-1">Valor do Lançamento de Hoje</label>
                  <div className="relative">
                    <span className={`absolute left-3 top-1/2 -translate-y-1/2 font-semibold text-lg ${payData.tipo === 'entrada' ? 'text-emerald-400' : 'text-blue-400'}`}>R$</span>
                    <Input 
                      type="number" 
                      value={payData.valorPagamentoAgora} 
                      onChange={e => setPayData({...payData, valorPagamentoAgora: e.target.value})} 
                      className={`h-14 pl-10 focus:bg-white rounded-lg font-black text-lg text-right pr-4 ${payData.tipo === 'entrada' ? 'border-emerald-200 bg-emerald-50/50 text-emerald-700' : 'border-blue-200 bg-blue-50/50 text-blue-700'}`} 
                    />
                  </div>
                </div>

                <Button 
                  onClick={() => registerPaymentMutation.mutate(payData)} 
                  disabled={registerPaymentMutation.isPending}
                  className={`w-full h-12 text-white rounded-md font-bold uppercase text-xs mt-4 shadow-sm ${payData.tipo === 'entrada' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-slate-900 hover:bg-slate-800'}`}
                >
                  {registerPaymentMutation.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : "Confirmar Baixa"}
                </Button>
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}