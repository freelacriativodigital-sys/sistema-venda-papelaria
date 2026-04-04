import React, { useState } from 'react';
import { supabase } from "../lib/supabase";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  Search, Trash2, Edit3, CheckCircle2, 
  AlertCircle, X, Save, TrendingDown, TrendingUp, 
  Tag, Loader2, Wallet, Clock, CreditCard,
  ArrowLeft, Receipt, FileText, Download
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AnimatePresence, motion } from "framer-motion";

export default function Despesas() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('pendentes'); // 'todas', 'pendentes', 'pagas'
  
  // Telas Sobrepostas (Overlays)
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);
  
  const [isPayOpen, setIsPayOpen] = useState(false);
  const [payData, setPayData] = useState({ id: null, descricao: '', valorTotal: 0, valorJaPago: 0, valorPagamentoAgora: 0, tipo: 'despesa' });

  // Modal do Demonstrativo
  const [isDemoModalOpen, setIsDemoModalOpen] = useState(false);
  const [demoConfig, setDemoConfig] = useState({ periodo: 'mensal', ano: new Date().getFullYear().toString() });

  const queryClient = useQueryClient();

  const { data: lancamentos = [], isLoading } = useQuery({
    queryKey: ["sistema-despesas"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("despesas")
        .select("*")
        .order("vencimento", { ascending: true });
      
      if (error && error.code === '42P01') return []; 
      if (error) throw error;
      return data || [];
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (expenseData) => {
      const valor = Number(expenseData.valor || 0);
      const valorPago = Number(expenseData.valor_pago || 0);
      const tipo = expenseData.tipo || 'despesa';
      
      let status = 'pendente';
      if (valorPago >= valor) status = 'pago';
      else if (valorPago > 0) status = 'parcial';

      const payload = {
        descricao: expenseData.descricao,
        valor: valor,
        valor_pago: valorPago,
        vencimento: expenseData.vencimento,
        categoria: expenseData.categoria || 'Geral',
        status: status,
        tipo: tipo
      };

      if (expenseData.id) {
        const { error } = await supabase.from("despesas").update(payload).eq("id", expenseData.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("despesas").insert([payload]);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sistema-despesas"] });
      setIsFormOpen(false);
      setEditingExpense(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      const { error } = await supabase.from("despesas").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["sistema-despesas"] }),
  });

  const registerPaymentMutation = useMutation({
    mutationFn: async ({ id, valorJaPago, valorPagamentoAgora, valorTotal }) => {
      const novoValorPago = Number(valorJaPago) + Number(valorPagamentoAgora);
      let novoStatus = 'pendente';
      
      if (novoValorPago >= valorTotal) novoStatus = 'pago';
      else if (novoValorPago > 0) novoStatus = 'parcial';

      const { error } = await supabase.from("despesas").update({ 
        valor_pago: novoValorPago, 
        status: novoStatus 
      }).eq("id", id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sistema-despesas"] });
      setIsPayOpen(false);
    },
  });

  const handleSave = () => {
    if (!editingExpense.descricao || !editingExpense.valor || !editingExpense.vencimento) {
      return alert("Preencha descrição, valor e data.");
    }
    saveMutation.mutate(editingExpense);
  };

  const handleNew = (tipoLancamento) => {
    setEditingExpense({
      descricao: '',
      valor: '',
      valor_pago: 0,
      vencimento: new Date().toISOString().split('T')[0],
      categoria: tipoLancamento === 'receita' ? 'Serviços' : 'Insumos',
      status: 'pendente',
      tipo: tipoLancamento
    });
    setIsFormOpen(true);
  };

  const handleDelete = (id) => {
    if (window.confirm("Deseja realmente excluir este lançamento?")) {
      deleteMutation.mutate(id);
    }
  };

  const openPayPage = (lancamento) => {
    const restante = Number(lancamento.valor) - Number(lancamento.valor_pago || 0);
    setPayData({
      id: lancamento.id,
      descricao: lancamento.descricao,
      valorTotal: Number(lancamento.valor),
      valorJaPago: Number(lancamento.valor_pago || 0),
      valorPagamentoAgora: restante > 0 ? restante : 0,
      tipo: lancamento.tipo || 'despesa'
    });
    setIsPayOpen(true);
  };

  const confirmPayment = () => {
    if (payData.valorPagamentoAgora <= 0) return alert("Informe um valor maior que zero.");
    registerPaymentMutation.mutate(payData);
  };

  const handleGenerateDemonstrativo = () => {
    // Aqui conectaremos com o Módulo de PDF no próximo passo!
    alert(`Módulo PDF em construção! Configuração salva:\nPeríodo: ${demoConfig.periodo}\nAno: ${demoConfig.ano}`);
    setIsDemoModalOpen(false);
  };

  // --- CÁLCULOS DO RESUMO ---
  const totalEntradas = lancamentos.filter(d => d.tipo === 'receita').reduce((acc, d) => acc + Number(d.valor_pago || 0), 0);
  const totalSaidas = lancamentos.filter(d => d.tipo === 'despesa' || !d.tipo).reduce((acc, d) => acc + Number(d.valor_pago || 0), 0);
  const saldoAtual = totalEntradas - totalSaidas;

  // --- FILTROS ---
  const filteredLancamentos = lancamentos.filter(d => {
    const matchSearch = d.descricao.toLowerCase().includes(searchTerm.toLowerCase()) || d.categoria.toLowerCase().includes(searchTerm.toLowerCase());
    let matchStatus = true;
    if (statusFilter === 'pendentes') matchStatus = d.status === 'pendente' || d.status === 'parcial';
    if (statusFilter === 'pagas') matchStatus = d.status === 'pago';
    return matchSearch && matchStatus;
  });

  const formatarData = (dataString) => {
    if (!dataString) return '--';
    const [ano, mes, dia] = dataString.split('-');
    return `${dia}/${mes}/${ano}`;
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0);
  };

  const analisarVencimento = (dataString, status, tipo) => {
    const isReceita = tipo === 'receita';
    const termPago = isReceita ? 'Recebido' : 'Pago';
    const termAtraso = isReceita ? 'Atrasado' : 'Atrasada';

    if (status === 'pago') return { texto: termPago, cor: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-200', iconCor: 'text-emerald-500' };
    
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    const vencimento = new Date(`${dataString}T00:00:00`);
    const diffTime = vencimento.getTime() - hoje.getTime();
    const diffDias = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDias < 0) return { texto: `${termAtraso} ${Math.abs(diffDias)}d`, cor: 'text-rose-700', bg: 'bg-rose-50', border: 'border-rose-200', iconCor: 'text-rose-500' };
    if (diffDias === 0) return { texto: 'Hoje', cor: 'text-amber-700', bg: 'bg-amber-50', border: 'border-amber-200', iconCor: 'text-amber-500' };
    if (diffDias <= 3) return { texto: `Em ${diffDias}d`, cor: 'text-amber-700', bg: 'bg-amber-50', border: 'border-amber-200', iconCor: 'text-amber-500' };
    
    return { texto: `Para ${formatarData(dataString)}`, cor: 'text-slate-600', bg: 'bg-slate-50', border: 'border-slate-200', iconCor: 'text-slate-400' };
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] pb-28 md:pb-20 text-slate-900">
      
      {/* HEADER DA PÁGINA (Desktop) */}
      <div className="border-b border-slate-200 bg-white/90 backdrop-blur-md sticky top-0 z-10 shadow-sm mb-6">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <h1 className="text-lg md:text-xl font-semibold text-slate-800 uppercase leading-none tracking-tight flex items-center gap-2">
              <Wallet className="w-5 h-5 text-blue-600" /> Fluxo de Caixa
            </h1>
            <div className="h-6 w-px bg-slate-200 hidden md:block"></div>
            <p className="text-[9px] md:text-[10px] text-slate-500 font-medium uppercase tracking-widest hidden md:block mt-0.5">
              Gestão Financeira
            </p>
          </div>

          {/* Botões Desktop */}
          <div className="hidden md:flex items-center gap-2">
            <Button onClick={() => setIsDemoModalOpen(true)} variant="outline" className="h-9 px-3 text-[10px] font-bold uppercase tracking-widest text-slate-500 hover:text-blue-600 hover:bg-blue-50 border-slate-200 gap-1.5">
              <FileText size={14}/> Demonstrativo
            </Button>
            <Button variant="outline" className="h-9 w-9 p-0 text-slate-500 border-slate-200 hover:bg-slate-50 flex items-center justify-center">
              <Download size={14}/>
            </Button>
            <div className="w-px h-5 bg-slate-200 mx-1"></div>
            <Button onClick={() => handleNew('receita')} className="h-9 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md font-bold uppercase text-[10px] tracking-widest shadow-sm flex items-center gap-1.5">
              <TrendingUp size={14} /> Entrada
            </Button>
            <Button onClick={() => handleNew('despesa')} className="h-9 px-4 bg-rose-600 hover:bg-rose-700 text-white rounded-md font-bold uppercase text-[10px] tracking-widest shadow-sm flex items-center gap-1.5">
              <TrendingDown size={14} /> Saída
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 space-y-6 animate-in fade-in">
        
        {/* CARDS DE RESUMO (KPIs) */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4">
           <div className="bg-emerald-600 rounded-xl p-3 md:p-4 border border-emerald-700 shadow-md flex flex-col justify-between group overflow-hidden relative min-h-[90px]">
             <div className="absolute -top-2 -right-2 p-2 opacity-10 group-hover:scale-110 transition-transform"><TrendingUp size={70}/></div>
             <div className="flex items-center justify-between mb-1.5 relative z-10">
               <span className="text-[9px] font-semibold uppercase tracking-widest text-emerald-100/90">Entradas (Recebidas)</span>
             </div>
             <div className="relative z-10">
               <h3 className="text-xl md:text-2xl font-semibold text-white tracking-tight">{formatCurrency(totalEntradas)}</h3>
             </div>
           </div>
           
           <div className="bg-rose-600 rounded-xl p-3 md:p-4 border border-rose-700 shadow-md flex flex-col justify-between group overflow-hidden relative min-h-[90px]">
             <div className="absolute -top-2 -right-2 p-2 opacity-10 group-hover:scale-110 transition-transform"><TrendingDown size={70}/></div>
             <div className="flex items-center justify-between mb-1.5 relative z-10">
               <span className="text-[9px] font-semibold uppercase tracking-widest text-rose-100/90">Saídas (Pagas)</span>
             </div>
             <div className="relative z-10">
               <h3 className="text-xl md:text-2xl font-semibold text-white tracking-tight">{formatCurrency(totalSaidas)}</h3>
             </div>
           </div>

           <div className={`${saldoAtual >= 0 ? 'bg-blue-600 border-blue-700' : 'bg-orange-600 border-orange-700'} rounded-xl p-3 md:p-4 border shadow-md flex flex-col justify-between group overflow-hidden relative min-h-[90px] transition-colors`}>
             <div className="absolute -top-2 -right-2 p-2 opacity-10 group-hover:scale-110 transition-transform"><Wallet size={70}/></div>
             <div className="flex items-center justify-between mb-1.5 relative z-10">
               <span className="text-[9px] font-semibold uppercase tracking-widest text-white/90">Saldo Atual</span>
             </div>
             <div className="relative z-10">
               <h3 className="text-xl md:text-2xl font-semibold text-white tracking-tight">{formatCurrency(saldoAtual)}</h3>
             </div>
           </div>
        </div>

        {/* BARRA DE FILTROS E PESQUISA */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-3 bg-white p-2 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex w-full md:w-auto bg-slate-50 p-1 rounded-lg border border-slate-100">
            <button onClick={() => setStatusFilter('pendentes')} className={`flex-1 md:px-5 py-2 rounded-md text-[9px] md:text-[10px] font-semibold uppercase tracking-widest transition-all ${statusFilter === 'pendentes' ? 'bg-white shadow-sm text-blue-600 border border-slate-200' : 'text-slate-500 hover:text-slate-700'}`}>
              Pendentes
            </button>
            <button onClick={() => setStatusFilter('pagas')} className={`flex-1 md:px-5 py-2 rounded-md text-[9px] md:text-[10px] font-semibold uppercase tracking-widest transition-all ${statusFilter === 'pagas' ? 'bg-white shadow-sm text-emerald-600 border border-slate-200' : 'text-slate-500 hover:text-slate-700'}`}>
              Concluídas
            </button>
            <button onClick={() => setStatusFilter('todas')} className={`flex-1 md:px-5 py-2 rounded-md text-[9px] md:text-[10px] font-semibold uppercase tracking-widest transition-all ${statusFilter === 'todas' ? 'bg-white shadow-sm text-slate-800 border border-slate-200' : 'text-slate-500 hover:text-slate-700'}`}>
              Todas
            </button>
          </div>

          <div className="relative w-full md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
            <input 
              type="text" 
              placeholder="Buscar lançamento..." 
              value={searchTerm} 
              onChange={(e) => setSearchTerm(e.target.value)} 
              className="w-full h-9 pl-9 pr-3 bg-slate-50 outline-none text-xs font-medium border border-slate-200 rounded-lg focus:border-blue-300 focus:bg-white transition-all placeholder:text-slate-400" 
            />
          </div>
        </div>

        {/* LISTAGEM EM LINHAS */}
        {isLoading ? (
          <div className="flex justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-blue-500" /></div>
        ) : filteredLancamentos.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-xl border border-slate-200 shadow-sm">
            <CheckCircle2 size={32} className="mx-auto text-emerald-400 mb-3" />
            <p className="text-[9px] font-medium uppercase text-slate-400 tracking-widest">Nenhum lançamento encontrado.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-2.5">
            <AnimatePresence mode="popLayout">
              {filteredLancamentos.map((lanc) => {
                const isReceita = lanc.tipo === 'receita';
                const isPago = lanc.status === 'pago';
                const isParcial = lanc.status === 'parcial';
                const alerta = analisarVencimento(lanc.vencimento, lanc.status, lanc.tipo);
                
                const valorTotal = Number(lanc.valor);
                const valorPagoItem = Number(lanc.valor_pago || 0);
                const valorRestanteItem = valorTotal - valorPagoItem;
                const percentualPago = Math.min(100, Math.round((valorPagoItem / valorTotal) * 100)) || 0;

                return (
                  <motion.div
                    key={lanc.id}
                    layout
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className={`bg-white p-3 rounded-xl border shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-3 transition-colors duration-300 ${isPago ? 'border-emerald-100 bg-slate-50/50 opacity-80' : 'border-slate-200 hover:border-blue-200'}`}
                  >
                    
                    <div className="flex flex-col w-full md:w-[35%] gap-2">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 border rounded-lg flex items-center justify-center shrink-0 shadow-sm ${isReceita ? 'bg-emerald-50 border-emerald-100 text-emerald-500' : 'bg-rose-50 border-rose-100 text-rose-500'}`}>
                           {isReceita ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                        </div>
                        <div className="overflow-hidden w-full">
                          <h3 className={`font-semibold text-xs uppercase truncate leading-tight ${isPago ? 'text-slate-400 line-through' : 'text-slate-800'}`}>
                            {lanc.descricao}
                          </h3>
                          <div className="flex items-center gap-1.5 mt-1">
                            <span className="text-[8px] font-semibold text-slate-400 uppercase tracking-widest">{lanc.categoria}</span>
                            <span className="text-slate-300">•</span>
                            <span className={`text-[8px] font-semibold uppercase tracking-widest ${percentualPago === 100 ? 'text-emerald-600' : isReceita ? 'text-emerald-500' : 'text-rose-500'}`}>
                              {percentualPago}% {isReceita ? 'Recebido' : 'Pago'}
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="w-full pl-13 md:pl-0 pr-1">
                        <div className="w-full bg-slate-100 h-1 rounded-full overflow-hidden">
                          <div className={`h-full transition-all duration-500 ${isPago ? 'bg-emerald-500' : isParcial ? (isReceita ? 'bg-emerald-400' : 'bg-blue-500') : 'bg-slate-300'}`} style={{ width: `${percentualPago}%` }} />
                        </div>
                      </div>
                    </div>

                    <div className="w-full md:w-auto flex shrink-0 justify-start md:justify-center pl-13 md:pl-0">
                       <span className={`flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[8px] font-semibold uppercase tracking-widest border ${alerta.bg} ${alerta.border} ${alerta.cor}`}>
                         <Clock size={10} className={alerta.iconCor}/> {alerta.texto}
                       </span>
                    </div>

                    <div className="flex items-center justify-between sm:justify-start gap-2 w-full md:w-auto shrink-0 mt-2 md:mt-0 pl-13 md:pl-0">
                      <div className="flex items-center gap-1.5 shrink-0">
                        <div className="flex flex-col bg-slate-50 px-2 py-0.5 rounded border border-slate-100 min-w-[60px] md:min-w-[80px] text-center md:text-left md:items-center md:justify-center">
                          <span className="text-[7px] md:text-[8px] font-semibold uppercase text-slate-400 tracking-widest">Total</span>
                          <span className="font-bold text-slate-600 text-[10px] md:text-xs">{formatCurrency(valorTotal)}</span>
                        </div>
                        <div className={`flex flex-col px-2 py-0.5 rounded border min-w-[60px] md:min-w-[80px] text-center md:text-left md:items-center md:justify-center ${isPago ? 'bg-emerald-50 border-emerald-100' : isReceita ? 'bg-emerald-50/50 border-emerald-100/50' : 'bg-rose-50 border-rose-100'}`}>
                          <span className={`text-[7px] md:text-[8px] font-semibold uppercase tracking-widest ${isPago ? 'text-emerald-500' : isReceita ? 'text-emerald-400' : 'text-rose-400'}`}>
                            {isPago ? (isReceita ? 'Recebido' : 'Pago') : (isReceita ? 'A Receber' : 'Falta Pagar')}
                          </span>
                          <span className={`font-bold text-[10px] md:text-xs ${isPago || isReceita ? 'text-emerald-600' : 'text-rose-600'}`}>
                            {formatCurrency(isPago ? valorTotal : valorRestanteItem)}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 shrink-0 justify-end ml-auto sm:ml-2">
                        {!isPago ? (
                          <Button onClick={() => openPayPage(lanc)} className={`h-7 md:h-8 px-2 md:px-3 rounded-md text-[8px] md:text-[9px] font-bold uppercase tracking-widest shadow-sm flex items-center gap-1 text-white ${isReceita ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-rose-600 hover:bg-rose-700'}`}>
                            <CreditCard size={12}/> {isReceita ? 'Receber' : 'Pagar'}
                          </Button>
                        ) : (
                          <Button onClick={() => openPayPage(lanc)} variant="outline" className="h-7 md:h-8 px-2 md:px-3 rounded-md text-[8px] md:text-[9px] font-bold uppercase tracking-widest text-slate-500 flex items-center gap-1 border-slate-200 hover:bg-slate-50">
                            <Edit3 size={12}/> Ajustar
                          </Button>
                        )}
                        <div className="h-4 w-px bg-slate-200 mx-0.5 hidden sm:block"></div>
                        
                        {/* ÍCONES SEMPRE VISÍVEIS E DESTACADOS */}
                        <div className="flex gap-1 bg-slate-50 border border-slate-200/60 rounded-md p-0.5 shadow-sm">
                           <button onClick={() => { setEditingExpense(lanc); setIsFormOpen(true); }} className="p-1.5 text-blue-500 bg-blue-50 hover:bg-blue-100 hover:text-blue-700 rounded transition-colors" title="Editar"><Edit3 size={13} /></button>
                           <button onClick={() => handleDelete(lanc.id)} className="p-1.5 text-rose-500 bg-rose-50 hover:bg-rose-100 hover:text-rose-700 rounded transition-colors" title="Excluir"><Trash2 size={13} /></button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* BOTÕES FIXOS NA BASE PARA MOBILE */}
      <div className="md:hidden fixed bottom-0 left-0 w-full p-2 bg-white border-t border-slate-200 z-[90] shadow-[0_-4px_15px_rgba(0,0,0,0.05)] pb-safe">
        <div className="flex gap-1.5 w-full">
          <Button onClick={() => setIsDemoModalOpen(true)} variant="outline" className="flex-1 h-12 flex-col gap-1 text-[8px] font-bold uppercase tracking-widest text-slate-500 border-slate-200 hover:bg-slate-50 shadow-sm">
            <FileText size={14} className="text-blue-500"/> Demonstrativo
          </Button>
          <Button variant="outline" className="w-12 shrink-0 h-12 flex flex-col items-center justify-center gap-1 text-[8px] font-bold uppercase tracking-widest text-slate-500 border-slate-200 hover:bg-slate-50 shadow-sm">
            <Download size={14} className="text-slate-500"/>
          </Button>
          <Button onClick={() => handleNew('receita')} className="flex-1 h-12 flex-col gap-1 text-[8px] font-bold uppercase tracking-widest bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm border-0">
            <TrendingUp size={14}/> Entrada
          </Button>
          <Button onClick={() => handleNew('despesa')} className="flex-1 h-12 flex-col gap-1 text-[8px] font-bold uppercase tracking-widest bg-rose-600 hover:bg-rose-700 text-white shadow-sm border-0">
            <TrendingDown size={14}/> Saída
          </Button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MODAL: DEMONSTRATIVO (OPÇÕES) */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {isDemoModalOpen && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsDemoModalOpen(false)} className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" />
            <motion.div initial={{ scale: 0.95, opacity: 0, y: 10 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 10 }} className="bg-white w-full max-w-sm rounded-xl p-5 shadow-xl relative z-10 border border-slate-100">
              
              <div className="flex justify-between items-center mb-4 pb-3 border-b border-slate-100">
                <h2 className="text-sm font-semibold text-slate-800 uppercase tracking-tight flex items-center gap-2">
                   <FileText size={16} className="text-blue-600"/> Demonstrativo PDF
                </h2>
                <button onClick={() => setIsDemoModalOpen(false)} className="p-1 hover:bg-slate-100 text-slate-500 rounded transition-colors"><X size={16} /></button>
              </div>
              
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[9px] font-semibold uppercase text-slate-500 tracking-widest ml-1">Selecione o Período</label>
                  <select 
                    value={demoConfig.periodo} 
                    onChange={e => setDemoConfig({...demoConfig, periodo: e.target.value})}
                    className="w-full h-10 border border-slate-200 rounded-md px-3 text-[10px] font-semibold uppercase tracking-widest outline-none bg-slate-50 focus:bg-white text-slate-700"
                  >
                    <option value="mensal">Mensal</option>
                    <option value="trimestral">Trimestral</option>
                    <option value="semestral">Semestral</option>
                    <option value="anual">Anual</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[9px] font-semibold uppercase text-slate-500 tracking-widest ml-1">Selecione o Ano</label>
                  <select 
                    value={demoConfig.ano} 
                    onChange={e => setDemoConfig({...demoConfig, ano: e.target.value})}
                    className="w-full h-10 border border-slate-200 rounded-md px-3 text-[10px] font-semibold uppercase tracking-widest outline-none bg-slate-50 focus:bg-white text-slate-700"
                  >
                    <option value="2024">2024</option>
                    <option value="2025">2025</option>
                    <option value="2026">2026</option>
                  </select>
                </div>

                <Button onClick={handleGenerateDemonstrativo} className="w-full h-10 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-bold uppercase text-[10px] tracking-widest mt-2 shadow-sm">
                  <Download size={14} className="mr-1.5"/> Gerar e Baixar PDF
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ========================================================================= */}
      {/* TELA SOBREPOSTA: NOVA / EDITAR DESPESA (ESTILO PÁGINA) */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {isFormOpen && (
          <motion.div 
            initial={{ opacity: 0, x: '10%' }} 
            animate={{ opacity: 1, x: 0 }} 
            exit={{ opacity: 0, x: '10%' }} 
            transition={{ type: "spring", bounce: 0, duration: 0.4 }}
            className="fixed inset-0 z-[200] bg-[#f8fafc] overflow-y-auto flex flex-col"
          >
            <div className="bg-white border-b border-slate-200 sticky top-0 z-50 shadow-sm">
              <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <button onClick={() => setIsFormOpen(false)} className="w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-500 transition-colors">
                    <ArrowLeft size={18} />
                  </button>
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center border ${editingExpense?.tipo === 'receita' ? 'bg-emerald-50 border-emerald-100' : 'bg-rose-50 border-rose-100'}`}>
                     {editingExpense?.tipo === 'receita' ? <TrendingUp className="text-emerald-500 w-4 h-4" /> : <TrendingDown className="text-rose-500 w-4 h-4" />}
                  </div>
                  <h2 className="text-sm md:text-base font-semibold text-slate-800 uppercase tracking-tight">
                    {editingExpense?.id ? 'Editar Lançamento' : editingExpense?.tipo === 'receita' ? 'Nova Entrada' : 'Nova Saída'}
                  </h2>
                </div>
                <Button onClick={handleSave} disabled={saveMutation.isPending} className="bg-blue-600 hover:bg-blue-700 text-white h-9 px-5 rounded-md font-semibold uppercase text-[9px] tracking-widest shadow-sm transition-colors">
                  {saveMutation.isPending ? <Loader2 className="w-3 h-3 animate-spin mr-2" /> : <Save size={14} className="mr-2"/>} Salvar
                </Button>
              </div>
            </div>

            <div className="flex-1 w-full max-w-3xl mx-auto p-4 md:p-6">
              <div className="bg-white p-5 md:p-6 rounded-xl border border-slate-200 shadow-sm space-y-5">
                
                <div className="space-y-1.5">
                  <label className="text-[9px] font-semibold uppercase text-slate-500 tracking-widest ml-1">Descrição</label>
                  <Input 
                    placeholder={editingExpense?.tipo === 'receita' ? "Ex: Pagamento Cliente X, Sinal Projeto..." : "Ex: Conta de Luz, Fornecedor X..."}
                    value={editingExpense?.descricao || ''} 
                    onChange={e => setEditingExpense({...editingExpense, descricao: e.target.value})} 
                    className="h-10 border-slate-200 bg-slate-50 focus:bg-white rounded-md font-medium text-sm text-slate-800" 
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-semibold uppercase text-slate-500 tracking-widest ml-1">Valor Total (R$)</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-semibold text-xs">R$</span>
                      <Input 
                        type="number" 
                        value={editingExpense?.valor || ''} 
                        onChange={e => setEditingExpense({...editingExpense, valor: e.target.value})} 
                        className="h-10 pl-8 border-slate-200 bg-slate-50 focus:bg-white rounded-md font-semibold text-slate-800 text-sm" 
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-semibold uppercase text-slate-500 tracking-widest ml-1">{editingExpense?.tipo === 'receita' ? 'Data do Recebimento' : 'Vencimento'}</label>
                    <Input 
                      type="date" 
                      value={editingExpense?.vencimento || ''} 
                      onChange={e => setEditingExpense({...editingExpense, vencimento: e.target.value})} 
                      className="h-10 border-slate-200 bg-slate-50 focus:bg-white rounded-md font-medium text-slate-800 text-sm" 
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-100">
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-semibold uppercase text-slate-500 tracking-widest ml-1">Categoria</label>
                    <select 
                      value={editingExpense?.categoria || 'Outros'} 
                      onChange={e => setEditingExpense({...editingExpense, categoria: e.target.value})}
                      className="w-full h-10 border border-slate-200 rounded-md px-3 text-[10px] font-semibold uppercase tracking-widest outline-none bg-slate-50 focus:bg-white text-slate-700"
                    >
                      {editingExpense?.tipo === 'receita' ? (
                        <>
                          <option value="Serviços">Serviços / Produtos</option>
                          <option value="Sinal">Sinal / Adiantamento</option>
                          <option value="Reembolso">Reembolso</option>
                          <option value="Outros">Outros</option>
                        </>
                      ) : (
                        <>
                          <option value="Fornecedores">Fornecedores</option>
                          <option value="Insumos">Insumos</option>
                          <option value="Aluguel">Aluguel / Fixo</option>
                          <option value="Impostos">Impostos</option>
                          <option value="Marketing">Marketing</option>
                          <option value="Ferramentas">Sistemas / Ferramentas</option>
                          <option value="Outros">Outros</option>
                        </>
                      )}
                    </select>
                  </div>
                  
                  <div className="space-y-1.5">
                    <label className={`text-[9px] font-semibold uppercase tracking-widest ml-1 ${editingExpense?.tipo === 'receita' ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {editingExpense?.tipo === 'receita' ? 'Valor Já Recebido (R$)' : 'Valor Já Pago (R$)'}
                    </label>
                    <div className="relative">
                      <span className={`absolute left-3 top-1/2 -translate-y-1/2 font-semibold text-xs ${editingExpense?.tipo === 'receita' ? 'text-emerald-500' : 'text-rose-500'}`}>R$</span>
                      <Input 
                        type="number" 
                        value={editingExpense?.valor_pago || 0} 
                        onChange={e => setEditingExpense({...editingExpense, valor_pago: e.target.value})} 
                        className={`h-10 pl-8 focus:bg-white rounded-md font-semibold text-sm ${editingExpense?.tipo === 'receita' ? 'border-emerald-200 bg-emerald-50/50 text-emerald-700' : 'border-rose-200 bg-rose-50/50 text-rose-700'}`} 
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ========================================================================= */}
      {/* TELA SOBREPOSTA: REGISTRAR PAGAMENTO/RECEBIMENTO */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {isPayOpen && (
          <motion.div 
            initial={{ opacity: 0, x: '10%' }} 
            animate={{ opacity: 1, x: 0 }} 
            exit={{ opacity: 0, x: '10%' }} 
            transition={{ type: "spring", bounce: 0, duration: 0.4 }}
            className="fixed inset-0 z-[200] bg-[#f8fafc] overflow-y-auto flex flex-col"
          >
            <div className="bg-white border-b border-slate-200 sticky top-0 z-50 shadow-sm">
              <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <button onClick={() => setIsPayOpen(false)} className="w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-500 transition-colors">
                    <ArrowLeft size={18} />
                  </button>
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center border ${payData.tipo === 'receita' ? 'bg-emerald-50 border-emerald-100' : 'bg-rose-50 border-rose-100'}`}>
                     <CreditCard className={`${payData.tipo === 'receita' ? 'text-emerald-600' : 'text-rose-600'} w-4 h-4`} />
                  </div>
                  <h2 className="text-sm md:text-base font-semibold text-slate-800 uppercase tracking-tight">
                    {payData.tipo === 'receita' ? 'Confirmar Recebimento' : 'Confirmar Pagamento'}
                  </h2>
                </div>
                <Button onClick={confirmPayment} disabled={registerPaymentMutation.isPending} className={`${payData.tipo === 'receita' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-rose-600 hover:bg-rose-700'} text-white h-9 px-5 rounded-md font-semibold uppercase text-[9px] tracking-widest shadow-sm transition-colors`}>
                  {registerPaymentMutation.isPending ? <Loader2 className="w-3 h-3 animate-spin mr-2" /> : <CheckCircle2 size={14} className="mr-2"/>} Confirmar
                </Button>
              </div>
            </div>

            <div className="flex-1 w-full max-w-2xl mx-auto p-4 md:p-6">
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-6">
                
                <div className="bg-slate-50 p-4 rounded-lg border border-slate-100 text-center">
                  <p className="text-[9px] font-semibold uppercase tracking-widest text-slate-500 mb-1">
                    {payData.tipo === 'receita' ? 'Registrando entrada para' : 'Registrando saída para'}
                  </p>
                  <p className="text-sm font-semibold text-slate-800 truncate">{payData.descricao}</p>
                </div>

                <div className="flex justify-between items-center px-2">
                  <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest">Valor Total:</span>
                  <span className="text-sm font-semibold text-slate-800">R$ {payData.valorTotal.toFixed(2)}</span>
                </div>
                
                <div className="flex justify-between items-center px-2">
                  <span className={`text-[10px] font-semibold uppercase tracking-widest ${payData.tipo === 'receita' ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {payData.tipo === 'receita' ? 'Já Recebido:' : 'Já Pago:'}
                  </span>
                  <span className={`text-sm font-semibold ${payData.tipo === 'receita' ? 'text-emerald-700' : 'text-rose-700'}`}>
                    R$ {payData.valorJaPago.toFixed(2)}
                  </span>
                </div>

                <div className="pt-5 border-t border-slate-100">
                  <label className="text-[10px] font-semibold uppercase tracking-widest text-slate-500 ml-1 mb-2 block">
                    {payData.tipo === 'receita' ? 'Valor Entrando Agora (R$)' : 'Valor Saindo Agora (R$)'}
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-semibold text-sm">R$</span>
                    <Input 
                      type="number" 
                      value={payData.valorPagamentoAgora} 
                      onChange={e => setPayData({...payData, valorPagamentoAgora: e.target.value})} 
                      className="h-12 pl-10 border-blue-200 bg-blue-50/30 focus:bg-white rounded-lg font-semibold text-blue-700 text-lg shadow-inner transition-all" 
                    />
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}