import React, { useState } from 'react';
import { supabase } from "../lib/supabase";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  Search, Plus, Trash2, Edit3, CheckCircle2, 
  AlertCircle, X, Save, TrendingDown, Calendar, 
  Tag, Loader2, Wallet, Clock, CreditCard, PieChart,
  ArrowLeft, ArrowDownRight
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
  const [payData, setPayData] = useState({ id: null, descricao: '', valorTotal: 0, valorJaPago: 0, valorPagamentoAgora: 0 });

  const queryClient = useQueryClient();

  // --- 1. LER DESPESAS DA NUVEM ---
  const { data: despesas = [], isLoading } = useQuery({
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

  // --- 2. CRIAR/EDITAR DESPESA ---
  const saveMutation = useMutation({
    mutationFn: async (expenseData) => {
      const valor = Number(expenseData.valor || 0);
      const valorPago = Number(expenseData.valor_pago || 0);
      
      let status = 'pendente';
      if (valorPago >= valor) status = 'pago';
      else if (valorPago > 0) status = 'parcial';

      const payload = {
        descricao: expenseData.descricao,
        valor: valor,
        valor_pago: valorPago,
        vencimento: expenseData.vencimento,
        categoria: expenseData.categoria || 'Geral',
        status: status
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

  // --- 3. APAGAR DESPESA ---
  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      const { error } = await supabase.from("despesas").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["sistema-despesas"] }),
  });

  // --- 4. REGISTRAR PAGAMENTO (PARCIAL OU TOTAL) ---
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
      return alert("Preencha descrição, valor e vencimento.");
    }
    saveMutation.mutate(editingExpense);
  };

  const handleNew = () => {
    setEditingExpense({
      descricao: '',
      valor: '',
      valor_pago: 0,
      vencimento: new Date().toISOString().split('T')[0],
      categoria: 'Insumos',
      status: 'pendente'
    });
    setIsFormOpen(true);
  };

  const handleDelete = (id) => {
    if (window.confirm("Deseja realmente excluir esta despesa?")) {
      deleteMutation.mutate(id);
    }
  };

  const openPayPage = (despesa) => {
    const restante = Number(despesa.valor) - Number(despesa.valor_pago || 0);
    setPayData({
      id: despesa.id,
      descricao: despesa.descricao,
      valorTotal: Number(despesa.valor),
      valorJaPago: Number(despesa.valor_pago || 0),
      valorPagamentoAgora: restante > 0 ? restante : 0
    });
    setIsPayOpen(true);
  };

  const confirmPayment = () => {
    if (payData.valorPagamentoAgora <= 0) return alert("Informe um valor maior que zero.");
    registerPaymentMutation.mutate(payData);
  };

  // --- CÁLCULOS DO RESUMO ---
  const totalGeral = despesas.reduce((acc, d) => acc + Number(d.valor), 0);
  const totalPago = despesas.reduce((acc, d) => acc + Number(d.valor_pago || 0), 0);
  const totalRestante = despesas.filter(d => d.status !== 'pago').reduce((acc, d) => acc + (Number(d.valor) - Number(d.valor_pago || 0)), 0);

  // --- FILTROS ---
  const filteredDespesas = despesas.filter(d => {
    const matchSearch = d.descricao.toLowerCase().includes(searchTerm.toLowerCase()) || d.categoria.toLowerCase().includes(searchTerm.toLowerCase());
    let matchStatus = true;
    if (statusFilter === 'pendentes') matchStatus = d.status === 'pendente' || d.status === 'parcial';
    if (statusFilter === 'pagas') matchStatus = d.status === 'pago';
    return matchSearch && matchStatus;
  });

  // --- LÓGICA DE DATAS E AVISOS ---
  const formatarData = (dataString) => {
    if (!dataString) return '--';
    const [ano, mes, dia] = dataString.split('-');
    return `${dia}/${mes}/${ano}`;
  };

  const analisarVencimento = (dataString, status) => {
    if (status === 'pago') return { texto: 'Pago', cor: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-200', iconCor: 'text-emerald-500' };
    
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    const vencimento = new Date(`${dataString}T00:00:00`);
    const diffTime = vencimento.getTime() - hoje.getTime();
    const diffDias = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDias < 0) return { texto: `Atrasada ${Math.abs(diffDias)}d`, cor: 'text-rose-700', bg: 'bg-rose-50', border: 'border-rose-200', iconCor: 'text-rose-500' };
    if (diffDias === 0) return { texto: 'Vence Hoje', cor: 'text-amber-700', bg: 'bg-amber-50', border: 'border-amber-200', iconCor: 'text-amber-500' };
    if (diffDias <= 3) return { texto: `Vence em ${diffDias}d`, cor: 'text-amber-700', bg: 'bg-amber-50', border: 'border-amber-200', iconCor: 'text-amber-500' };
    
    return { texto: `Para ${formatarData(dataString)}`, cor: 'text-slate-600', bg: 'bg-slate-50', border: 'border-slate-200', iconCor: 'text-slate-400' };
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] pb-20 text-slate-900">
      
      {/* HEADER DA PÁGINA */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-6 md:pt-8 mb-6">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-xl md:text-2xl font-semibold uppercase text-slate-800 tracking-tight flex items-center gap-2.5">
              <TrendingDown className="text-rose-600" size={24} /> Despesas
            </h1>
            <p className="text-[10px] font-medium text-slate-500 uppercase tracking-widest mt-1">Controle Financeiro de Contas</p>
          </div>
          <Button onClick={handleNew} className="h-10 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold uppercase tracking-widest text-[10px] shadow-sm transition-all w-full md:w-auto px-6">
            <Plus className="w-4 h-4 mr-2" /> Nova Despesa
          </Button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 space-y-6 animate-in fade-in">
        
        {/* CARDS DE RESUMO (KPIs COLORIDOS PADRÃO) */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4">
           {/* Total */}
           <div className="bg-slate-800 rounded-xl p-4 border border-slate-700 shadow-md flex flex-col justify-between group overflow-hidden relative min-h-[90px]">
             <div className="absolute -top-2 -right-2 p-2 opacity-10 group-hover:scale-110 transition-transform"><Wallet size={70}/></div>
             <div className="flex items-center justify-between mb-1.5 relative z-10">
               <span className="text-[9px] font-semibold uppercase tracking-widest text-slate-300">Total Lançado</span>
             </div>
             <div className="relative z-10">
               <h3 className="text-xl md:text-2xl font-semibold text-white tracking-tight">R$ {totalGeral.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</h3>
             </div>
           </div>
           
           {/* Pago */}
           <div className="bg-emerald-600 rounded-xl p-4 border border-emerald-700 shadow-md flex flex-col justify-between group overflow-hidden relative min-h-[90px]">
             <div className="absolute -top-2 -right-2 p-2 opacity-10 group-hover:scale-110 transition-transform"><CheckCircle2 size={70}/></div>
             <div className="flex items-center justify-between mb-1.5 relative z-10">
               <span className="text-[9px] font-semibold uppercase tracking-widest text-emerald-100/90">Total Já Pago</span>
             </div>
             <div className="relative z-10">
               <h3 className="text-xl md:text-2xl font-semibold text-white tracking-tight">R$ {totalPago.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</h3>
             </div>
           </div>

           {/* Restante */}
           <div className="bg-rose-600 rounded-xl p-4 border border-rose-700 shadow-md flex flex-col justify-between group overflow-hidden relative min-h-[90px]">
             <div className="absolute -top-2 -right-2 p-2 opacity-10 group-hover:scale-110 transition-transform"><AlertCircle size={70}/></div>
             <div className="flex items-center justify-between mb-1.5 relative z-10">
               <span className="text-[9px] font-semibold uppercase tracking-widest text-rose-100/90">Falta Pagar</span>
             </div>
             <div className="relative z-10">
               <h3 className="text-xl md:text-2xl font-semibold text-white tracking-tight">R$ {totalRestante.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</h3>
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
              Pagas
            </button>
            <button onClick={() => setStatusFilter('todas')} className={`flex-1 md:px-5 py-2 rounded-md text-[9px] md:text-[10px] font-semibold uppercase tracking-widest transition-all ${statusFilter === 'todas' ? 'bg-white shadow-sm text-slate-800 border border-slate-200' : 'text-slate-500 hover:text-slate-700'}`}>
              Todas
            </button>
          </div>

          <div className="relative w-full md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
            <input 
              type="text" 
              placeholder="Buscar despesa..." 
              value={searchTerm} 
              onChange={(e) => setSearchTerm(e.target.value)} 
              className="w-full h-9 pl-9 pr-3 bg-slate-50 outline-none text-xs font-medium border border-slate-200 rounded-lg focus:border-blue-300 focus:bg-white transition-all placeholder:text-slate-400" 
            />
          </div>
        </div>

        {/* LISTAGEM DE DESPESAS */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
            <p className="text-[9px] font-medium text-slate-400 uppercase tracking-widest">Carregando...</p>
          </div>
        ) : filteredDespesas.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-xl border border-slate-200 shadow-sm">
            <CheckCircle2 size={32} className="mx-auto text-emerald-400 mb-3" />
            <h3 className="text-sm font-semibold text-slate-800 uppercase tracking-tight mb-1">Tudo limpo!</h3>
            <p className="text-[9px] font-medium uppercase text-slate-400 tracking-widest">Nenhuma despesa encontrada.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <AnimatePresence mode="popLayout">
              {filteredDespesas.map((despesa) => {
                const isPago = despesa.status === 'pago';
                const isParcial = despesa.status === 'parcial';
                const alerta = analisarVencimento(despesa.vencimento, despesa.status);
                
                const valorTotal = Number(despesa.valor);
                const valorPagoItem = Number(despesa.valor_pago || 0);
                const valorRestanteItem = valorTotal - valorPagoItem;
                const percentualPago = Math.min(100, Math.round((valorPagoItem / valorTotal) * 100)) || 0;

                return (
                  <motion.div
                    key={despesa.id}
                    layout
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className={`bg-white p-4 rounded-xl border shadow-sm flex flex-col relative transition-all duration-300 ${isPago ? 'border-emerald-200 bg-emerald-50/10 opacity-70' : 'border-slate-200 hover:border-blue-200'}`}
                  >
                    
                    {/* AÇÕES TOPO */}
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <p className="text-[8px] font-semibold text-slate-400 uppercase tracking-widest mb-1 flex items-center gap-1"><Tag size={10}/> {despesa.categoria}</p>
                        <h3 className={`font-semibold text-sm leading-tight line-clamp-2 ${isPago ? 'text-slate-500 line-through' : 'text-slate-800'}`}>{despesa.descricao}</h3>
                      </div>
                      <div className="flex gap-1 bg-slate-50 rounded-md border border-slate-100 shrink-0">
                        <button onClick={() => { setEditingExpense(despesa); setIsFormOpen(true); }} className="p-1.5 text-slate-400 hover:text-blue-600 transition-colors rounded-l-md"><Edit3 size={12} /></button>
                        <div className="w-px bg-slate-200"></div>
                        <button onClick={() => handleDelete(despesa.id)} className="p-1.5 text-slate-400 hover:text-rose-500 transition-colors rounded-r-md"><Trash2 size={12} /></button>
                      </div>
                    </div>

                    {/* ALERTA VENCIMENTO (ESTILO PÍLULA/TAG) */}
                    <div className="mb-3">
                       <span className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[9px] font-semibold uppercase tracking-widest w-fit border ${alerta.bg} ${alerta.border} ${alerta.cor}`}>
                         <Clock size={10} className={alerta.iconCor}/> {alerta.texto}
                       </span>
                    </div>

                    {/* PROGRESSO FINO */}
                    <div className="space-y-1.5 mb-4">
                      <div className="flex justify-between text-[9px] font-semibold uppercase tracking-widest text-slate-500">
                        <span>Progresso</span>
                        <span className={percentualPago === 100 ? 'text-emerald-600' : 'text-blue-600'}>{percentualPago}% Pago</span>
                      </div>
                      <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                        <div className={`h-full transition-all duration-500 ${isPago ? 'bg-emerald-500' : isParcial ? 'bg-blue-500' : 'bg-slate-300'}`} style={{ width: `${percentualPago}%` }} />
                      </div>
                    </div>

                    {/* VALORES E BOTÃO */}
                    <div className="mt-auto pt-3 border-t border-slate-100">
                      <div className="flex justify-between items-end mb-3">
                        <div>
                           <p className="text-[8px] font-semibold text-slate-400 uppercase tracking-widest mb-0.5">Total</p>
                           <p className="text-xs font-semibold text-slate-600">R$ {valorTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                        </div>
                        <div className="text-right">
                           <p className={`text-[8px] font-semibold uppercase tracking-widest mb-0.5 ${isPago ? 'text-emerald-500' : 'text-rose-400'}`}>
                             {isPago ? 'Pago' : 'Falta Pagar'}
                           </p>
                           <p className={`text-lg font-semibold tracking-tight leading-none ${isPago ? 'text-emerald-600' : 'text-rose-600'}`}>
                             R$ {(isPago ? valorTotal : valorRestanteItem).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                           </p>
                        </div>
                      </div>
                      
                      {!isPago ? (
                        <button 
                          onClick={() => openPayPage(despesa)}
                          className="w-full h-9 rounded-md text-[9px] font-bold uppercase tracking-widest transition-all shadow-sm bg-emerald-600 text-white hover:bg-emerald-700 flex items-center justify-center gap-1.5"
                        >
                          <CreditCard size={14}/> Registrar Pagto
                        </button>
                      ) : (
                        <button 
                          onClick={() => openPayPage(despesa)} 
                          className="w-full h-9 rounded-md text-[9px] font-bold uppercase tracking-widest transition-all border bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100 flex items-center justify-center gap-1.5"
                        >
                          <Edit3 size={14}/> Ajustar
                        </button>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </div>

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
            {/* Header Estilo Página */}
            <div className="bg-white border-b border-slate-200 sticky top-0 z-50 shadow-sm">
              <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <button onClick={() => setIsFormOpen(false)} className="w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-500 transition-colors">
                    <ArrowLeft size={18} />
                  </button>
                  <div className="w-8 h-8 rounded-lg bg-rose-50 flex items-center justify-center border border-rose-100">
                     <TrendingDown className="text-rose-500 w-4 h-4" />
                  </div>
                  <h2 className="text-sm md:text-base font-semibold text-slate-800 uppercase tracking-tight">
                    {editingExpense?.id ? 'Editar Despesa' : 'Nova Despesa'}
                  </h2>
                </div>
                <Button 
                  onClick={handleSave} 
                  disabled={saveMutation.isPending}
                  className="bg-blue-600 hover:bg-blue-700 text-white h-9 px-5 rounded-md font-semibold uppercase text-[9px] tracking-widest shadow-sm transition-colors"
                >
                  {saveMutation.isPending ? <Loader2 className="w-3 h-3 animate-spin mr-2" /> : <Save size={14} className="mr-2"/>}
                  Salvar
                </Button>
              </div>
            </div>

            {/* Corpo do Formulário */}
            <div className="flex-1 w-full max-w-3xl mx-auto p-4 md:p-6">
              <div className="bg-white p-5 md:p-6 rounded-xl border border-slate-200 shadow-sm space-y-5">
                
                <div className="space-y-1.5">
                  <label className="text-[9px] font-semibold uppercase text-slate-500 tracking-widest ml-1">Descrição</label>
                  <Input 
                    placeholder="Ex: Conta de Luz, Fornecedor X..."
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
                    <label className="text-[9px] font-semibold uppercase text-slate-500 tracking-widest ml-1">Vencimento</label>
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
                      value={editingExpense?.categoria || 'Insumos'} 
                      onChange={e => setEditingExpense({...editingExpense, categoria: e.target.value})}
                      className="w-full h-10 border border-slate-200 rounded-md px-3 text-[10px] font-semibold uppercase tracking-widest outline-none bg-slate-50 focus:bg-white text-slate-700"
                    >
                      <option value="Fornecedores">Fornecedores</option>
                      <option value="Insumos">Insumos</option>
                      <option value="Aluguel">Aluguel / Fixo</option>
                      <option value="Impostos">Impostos</option>
                      <option value="Marketing">Marketing</option>
                      <option value="Ferramentas">Sistemas / Ferramentas</option>
                      <option value="Outros">Outros</option>
                    </select>
                  </div>
                  
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-semibold uppercase text-emerald-600 tracking-widest ml-1">Valor Já Pago (R$)</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-emerald-500 font-semibold text-xs">R$</span>
                      <Input 
                        type="number" 
                        value={editingExpense?.valor_pago || 0} 
                        onChange={e => setEditingExpense({...editingExpense, valor_pago: e.target.value})} 
                        className="h-10 pl-8 border-emerald-200 bg-emerald-50/50 focus:bg-white rounded-md font-semibold text-emerald-700 text-sm" 
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
      {/* TELA SOBREPOSTA: REGISTRAR PAGAMENTO (ESTILO PÁGINA) */}
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
                  <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center border border-emerald-100">
                     <CreditCard className="text-emerald-600 w-4 h-4" />
                  </div>
                  <h2 className="text-sm md:text-base font-semibold text-slate-800 uppercase tracking-tight">
                    Pagamento
                  </h2>
                </div>
                <Button 
                  onClick={confirmPayment} 
                  disabled={registerPaymentMutation.isPending}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white h-9 px-5 rounded-md font-semibold uppercase text-[9px] tracking-widest shadow-sm transition-colors"
                >
                  {registerPaymentMutation.isPending ? <Loader2 className="w-3 h-3 animate-spin mr-2" /> : <CheckCircle2 size={14} className="mr-2"/>}
                  Confirmar
                </Button>
              </div>
            </div>

            <div className="flex-1 w-full max-w-2xl mx-auto p-4 md:p-6">
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-6">
                
                <div className="bg-slate-50 p-4 rounded-lg border border-slate-100 text-center">
                  <p className="text-[9px] font-semibold uppercase tracking-widest text-slate-500 mb-1">Registrando pagamento para</p>
                  <p className="text-sm font-semibold text-slate-800 truncate">{payData.descricao}</p>
                </div>

                <div className="flex justify-between items-center px-2">
                  <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest">Valor Total:</span>
                  <span className="text-sm font-semibold text-slate-800">R$ {payData.valorTotal.toFixed(2)}</span>
                </div>
                
                <div className="flex justify-between items-center px-2">
                  <span className="text-[10px] font-semibold text-emerald-600 uppercase tracking-widest">Já Pago:</span>
                  <span className="text-sm font-semibold text-emerald-700">R$ {payData.valorJaPago.toFixed(2)}</span>
                </div>

                <div className="pt-5 border-t border-slate-100">
                  <label className="text-[10px] font-semibold uppercase tracking-widest text-slate-500 ml-1 mb-2 block">
                    Valor do Pagamento de Hoje (R$)
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
                  <p className="text-[8px] font-medium text-slate-400 uppercase tracking-widest mt-2 ml-1">
                    *Para estornar um pagamento, digite um valor com sinal negativo (ex: -50).
                  </p>
                </div>

              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}