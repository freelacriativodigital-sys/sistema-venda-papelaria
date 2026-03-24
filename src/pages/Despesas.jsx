import React, { useState } from 'react';
import { supabase } from "../lib/supabase";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  Search, Plus, Trash2, Edit3, CheckCircle2, 
  AlertCircle, X, Save, TrendingDown, Calendar, 
  Tag, Loader2, Wallet, Clock, CreditCard, PieChart,
  ArrowRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AnimatePresence, motion } from "framer-motion";

export default function Despesas() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('pendentes'); // 'todas', 'pendentes', 'pagas'
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);
  
  // Modal de Pagamento Rápido
  const [isPayModalOpen, setIsPayModalOpen] = useState(false);
  const [payData, setPayData] = useState({ id: null, descricao: '', valorTotal: 0, valorJaPago: 0, valorPagamentoAgora: 0 });

  const queryClient = useQueryClient();

  // --- 1. LER DESPESAS DA NUVEM ---
  const { data: despesas = [], isLoading } = useQuery({
    queryKey: ["criarte-despesas"],
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
      
      // Auto-calcula o status baseado no valor pago
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
      queryClient.invalidateQueries({ queryKey: ["criarte-despesas"] });
      setIsModalOpen(false);
      setEditingExpense(null);
    },
  });

  // --- 3. APAGAR DESPESA ---
  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      const { error } = await supabase.from("despesas").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["criarte-despesas"] }),
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
      queryClient.invalidateQueries({ queryKey: ["criarte-despesas"] });
      setIsPayModalOpen(false);
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
    setIsModalOpen(true);
  };

  const handleDelete = (id) => {
    if (window.confirm("Deseja realmente excluir esta despesa?")) {
      deleteMutation.mutate(id);
    }
  };

  const openPayModal = (despesa) => {
    const restante = Number(despesa.valor) - Number(despesa.valor_pago || 0);
    setPayData({
      id: despesa.id,
      descricao: despesa.descricao,
      valorTotal: Number(despesa.valor),
      valorJaPago: Number(despesa.valor_pago || 0),
      valorPagamentoAgora: restante > 0 ? restante : 0
    });
    setIsPayModalOpen(true);
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
    if (status === 'pago') return { texto: 'Pago', cor: 'text-emerald-500', bg: 'bg-emerald-50', border: 'border-emerald-200' };
    
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    const vencimento = new Date(`${dataString}T00:00:00`);
    const diffTime = vencimento.getTime() - hoje.getTime();
    const diffDias = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDias < 0) return { texto: `Atrasada há ${Math.abs(diffDias)} dias`, cor: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200', iconCor: 'text-red-500' };
    if (diffDias === 0) return { texto: 'Vence HOJE!', cor: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-200', iconCor: 'text-amber-500' };
    if (diffDias <= 3) return { texto: `Vence em ${diffDias} dias`, cor: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-200', iconCor: 'text-amber-500' };
    
    return { texto: `Vence em ${diffDias} dias`, cor: 'text-slate-600', bg: 'bg-slate-50', border: 'border-slate-200', iconCor: 'text-slate-400' };
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-20 text-slate-900">
      
      {/* HEADER FIXO */}
      <div className="bg-white border-b border-slate-100 sticky top-0 z-20 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 md:py-5">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            
            <div>
              <h1 className="text-xl md:text-2xl font-bold md:font-semibold text-slate-800 flex items-center gap-2 uppercase tracking-tight">
                <TrendingDown className="w-5 h-5 md:w-6 md:h-6 text-rose-500" /> Despesas
              </h1>
              <p className="text-[10px] md:text-xs font-medium text-slate-500 uppercase tracking-widest mt-1">Controle Financeiro de Contas</p>
            </div>

            <Button 
              onClick={handleNew}
              className="w-full md:w-auto bg-blue-600 hover:bg-blue-700 text-white rounded-md h-11 md:h-10 px-6 shadow-sm flex gap-2 font-semibold text-xs uppercase transition-all"
            >
              <Plus className="w-4 h-4" /> Nova Despesa
            </Button>

          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 mt-6 md:mt-8 space-y-6 md:space-y-8 animate-in fade-in">
        
        {/* CARDS DE RESUMO */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-5">
           <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-500 shrink-0"><Wallet size={24}/></div>
              <div>
                 <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest mb-0.5">Total das Contas</p>
                 <p className="text-xl font-bold text-slate-800 tracking-tight">R$ {totalGeral.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
              </div>
           </div>
           <div className="bg-white p-5 rounded-xl border border-emerald-100 shadow-sm flex items-center gap-4 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-2 h-full bg-emerald-500" />
              <div className="w-12 h-12 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-500 shrink-0"><CheckCircle2 size={24}/></div>
              <div>
                 <p className="text-[10px] font-semibold text-emerald-600 uppercase tracking-widest mb-0.5">Total Já Pago</p>
                 <p className="text-xl font-bold text-emerald-700 tracking-tight">R$ {totalPago.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
              </div>
           </div>
           <div className="bg-white p-5 rounded-xl border border-red-100 shadow-sm flex items-center gap-4 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-2 h-full bg-red-500" />
              <div className="w-12 h-12 rounded-lg bg-red-50 border border-red-100 flex items-center justify-center text-red-500 shrink-0"><AlertCircle size={24}/></div>
              <div>
                 <p className="text-[10px] font-semibold text-red-500 uppercase tracking-widest mb-0.5">Falta Pagar (Restante)</p>
                 <p className="text-xl font-bold text-red-600 tracking-tight">R$ {totalRestante.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
              </div>
           </div>
        </div>

        {/* BARRA DE FILTROS E ABAS */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-white p-2 rounded-xl border border-slate-200 shadow-sm">
          
          <div className="flex w-full md:w-auto bg-slate-50 p-1 rounded-lg border border-slate-100">
            <button onClick={() => setStatusFilter('pendentes')} className={`flex-1 md:px-6 py-2 md:py-2.5 rounded-md text-[10px] md:text-xs font-bold uppercase transition-all ${statusFilter === 'pendentes' ? 'bg-white shadow-sm text-blue-600 border border-slate-200' : 'text-slate-500 hover:text-slate-700'}`}>
              Pendentes
            </button>
            <button onClick={() => setStatusFilter('pagas')} className={`flex-1 md:px-6 py-2 md:py-2.5 rounded-md text-[10px] md:text-xs font-bold uppercase transition-all ${statusFilter === 'pagas' ? 'bg-white shadow-sm text-emerald-600 border border-slate-200' : 'text-slate-500 hover:text-slate-700'}`}>
              Pagas
            </button>
            <button onClick={() => setStatusFilter('todas')} className={`flex-1 md:px-6 py-2 md:py-2.5 rounded-md text-[10px] md:text-xs font-bold uppercase transition-all ${statusFilter === 'todas' ? 'bg-white shadow-sm text-slate-800 border border-slate-200' : 'text-slate-500 hover:text-slate-700'}`}>
              Todas
            </button>
          </div>

          <div className="relative w-full md:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input 
              type="text" 
              placeholder="Buscar despesa..." 
              value={searchTerm} 
              onChange={(e) => setSearchTerm(e.target.value)} 
              className="w-full h-10 pl-9 pr-4 bg-slate-50 outline-none text-xs font-medium border border-slate-200 rounded-lg focus:border-blue-300 focus:bg-white transition-all" 
            />
          </div>
        </div>

        {/* LISTAGEM DE DESPESAS */}
        {isLoading ? (
          <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-blue-600" /></div>
        ) : filteredDespesas.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-xl border border-slate-200 shadow-sm">
            <CheckCircle2 size={48} className="mx-auto text-emerald-400 mb-4" />
            <h3 className="text-base font-semibold text-slate-800 uppercase mb-1.5">Tudo limpo por aqui!</h3>
            <p className="text-[10px] font-medium uppercase text-slate-400 tracking-widest">Nenhuma despesa encontrada para este filtro.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-5">
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
                    className={`bg-white p-4 md:p-5 rounded-xl border shadow-sm flex flex-col relative transition-all duration-300 ${isPago ? 'border-emerald-200 bg-emerald-50/20' : 'border-slate-200 hover:border-blue-300'}`}
                  >
                    
                    {/* AÇÕES TOPO */}
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <p className="text-[9px] font-semibold text-slate-400 uppercase tracking-widest mb-1 flex items-center gap-1"><Tag size={10}/> {despesa.categoria}</p>
                        <h3 className={`font-semibold text-sm leading-tight line-clamp-2 ${isPago ? 'text-slate-500 line-through decoration-slate-300' : 'text-slate-800'}`}>{despesa.descricao}</h3>
                      </div>
                      <div className="flex gap-1 bg-slate-50 rounded-md shadow-sm border border-slate-100 shrink-0">
                        <button onClick={() => { setEditingExpense(despesa); setIsModalOpen(true); }} className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-100 transition-colors rounded-l-md"><Edit3 size={14} /></button>
                        <div className="w-px bg-slate-200"></div>
                        <button onClick={() => handleDelete(despesa.id)} className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-100 transition-colors rounded-r-md"><Trash2 size={14} /></button>
                      </div>
                    </div>

                    {/* AVISO DE VENCIMENTO */}
                    {!isPago && (
                      <div className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border ${alerta.bg} ${alerta.border} mb-4`}>
                        <Clock size={12} className={alerta.iconCor}/>
                        <span className={`text-[10px] font-bold uppercase tracking-wide ${alerta.cor}`}>
                          {alerta.texto} ({formatarData(despesa.vencimento)})
                        </span>
                      </div>
                    )}

                    {/* PROGRESSO DE PAGAMENTO */}
                    <div className="space-y-1.5 mb-4">
                      <div className="flex justify-between text-[9px] font-semibold uppercase text-slate-500">
                        <span>Progresso</span>
                        <span className={percentualPago === 100 ? 'text-emerald-600' : 'text-blue-600'}>{percentualPago}% Pago</span>
                      </div>
                      <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                        <div className={`h-full transition-all duration-500 ${isPago ? 'bg-emerald-500' : isParcial ? 'bg-blue-500' : 'bg-slate-300'}`} style={{ width: `${percentualPago}%` }} />
                      </div>
                    </div>

                    {/* VALORES E BOTÃO DE PAGAR */}
                    <div className="mt-auto pt-4 border-t border-slate-100">
                      
                      <div className="flex justify-between items-end mb-4">
                        <div>
                           <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Total</p>
                           <p className="text-xs font-semibold text-slate-600">R$ {valorTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                        </div>
                        <div className="text-right">
                           <p className={`text-[9px] font-bold uppercase tracking-widest mb-0.5 ${isPago ? 'text-emerald-500' : 'text-red-400'}`}>
                             {isPago ? 'Pago' : 'Falta Pagar'}
                           </p>
                           <p className={`text-lg font-black tracking-tight leading-none ${isPago ? 'text-emerald-600' : 'text-red-600'}`}>
                             R$ {(isPago ? valorTotal : valorRestanteItem).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                           </p>
                        </div>
                      </div>
                      
                      {!isPago ? (
                        <button 
                          onClick={() => openPayModal(despesa)}
                          className="w-full h-10 rounded-md text-[10px] md:text-xs font-bold uppercase transition-all shadow-sm border bg-emerald-600 border-emerald-600 text-white hover:bg-emerald-700 flex items-center justify-center gap-1.5"
                        >
                          <CreditCard size={16}/> Registrar Pagamento
                        </button>
                      ) : (
                        <button 
                          onClick={() => openPayModal(despesa)} // Abre o mesmo modal para poder estornar
                          className="w-full h-10 rounded-md text-[10px] md:text-xs font-bold uppercase transition-all border bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100 flex items-center justify-center gap-1.5"
                        >
                          <Edit3 size={16}/> Ajustar Pagamento
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

      {/* --- MODAL PARA REGISTRAR PAGAMENTO --- */}
      <AnimatePresence>
        {isPayModalOpen && (
          <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsPayModalOpen(false)} className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" />
            <motion.div initial={{ scale: 0.95, opacity: 0, y: 10 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 10 }} className="bg-white w-full max-w-sm rounded-2xl p-6 shadow-xl relative z-10 overflow-hidden">
              
              <div className="flex justify-between items-center mb-5 border-b border-slate-100 pb-4">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-md bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100"><CreditCard size={16}/></div>
                  <h2 className="text-lg font-bold text-slate-800 uppercase tracking-tight leading-none">Pagamento</h2>
                </div>
                <button onClick={() => setIsPayModalOpen(false)} className="p-1.5 hover:bg-slate-100 text-slate-500 rounded-md transition-colors"><X className="w-5 h-5" /></button>
              </div>

              <div className="space-y-4">
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-center">
                  <p className="text-[10px] font-semibold uppercase text-slate-500 mb-1">Pagando</p>
                  <p className="text-sm font-bold text-slate-800 line-clamp-1">{payData.descricao}</p>
                </div>

                <div className="flex justify-between items-center text-xs font-semibold px-1">
                  <span className="text-slate-500 uppercase">Valor Total:</span>
                  <span className="text-slate-800">R$ {payData.valorTotal.toFixed(2)}</span>
                </div>
                
                <div className="flex justify-between items-center text-xs font-semibold px-1">
                  <span className="text-emerald-600 uppercase">Já Pago:</span>
                  <span className="text-emerald-700">R$ {payData.valorJaPago.toFixed(2)}</span>
                </div>

                <div className="space-y-1.5 pt-3 border-t border-slate-100">
                  <label className="text-[10px] font-bold uppercase text-slate-500 ml-1">Valor do Pagamento de Hoje</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-semibold text-lg">R$</span>
                    <Input 
                      type="number" 
                      value={payData.valorPagamentoAgora} 
                      onChange={e => setPayData({...payData, valorPagamentoAgora: e.target.value})} 
                      className="h-14 pl-10 border-blue-200 bg-blue-50/50 focus:bg-white rounded-lg font-black text-blue-700 text-lg text-right pr-4" 
                    />
                  </div>
                  <p className="text-[9px] font-medium text-slate-400 uppercase text-right pt-1">
                    *Dica: Pode ser o valor total ou parcial. Use números negativos para estornar.
                  </p>
                </div>

                <Button 
                  onClick={confirmPayment} 
                  disabled={registerPaymentMutation.isPending}
                  className="w-full h-12 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md font-bold uppercase text-xs mt-4 shadow-sm transition-all"
                >
                  {registerPaymentMutation.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : "Confirmar Pagamento"}
                </Button>
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* --- MODAL PARA CRIAR/EDITAR DESPESA (COMPLETO) --- */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsModalOpen(false)} className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" />
            <motion.div initial={{ scale: 0.95, opacity: 0, y: 10 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 10 }} className="bg-white w-full max-w-md rounded-2xl md:rounded-xl p-6 shadow-xl relative z-10 overflow-hidden">
              
              <div className="flex justify-between items-center mb-6 border-b border-slate-100 pb-4">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-md bg-rose-50 text-rose-500 flex items-center justify-center border border-rose-100"><TrendingDown size={16}/></div>
                  <h2 className="text-lg md:text-xl font-bold text-slate-800 uppercase tracking-tight leading-none">
                    {editingExpense?.id ? 'Editar Despesa' : 'Nova Despesa'}
                  </h2>
                </div>
                <button onClick={() => setIsModalOpen(false)} className="p-1.5 hover:bg-slate-100 text-slate-500 rounded-md transition-colors"><X className="w-5 h-5" /></button>
              </div>
              
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] md:text-xs font-semibold uppercase text-slate-500 tracking-widest ml-1">Descrição</label>
                  <Input 
                    placeholder="Ex: Conta de Luz, Fornecedor X..."
                    value={editingExpense.descricao} 
                    onChange={e => setEditingExpense({...editingExpense, descricao: e.target.value})} 
                    className="h-11 md:h-10 border-slate-200 bg-slate-50 focus:bg-white rounded-md font-medium text-sm text-slate-800" 
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-[10px] md:text-xs font-semibold uppercase text-slate-500 tracking-widest ml-1">Valor Total (R$)</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-semibold text-sm">R$</span>
                      <Input 
                        type="number" 
                        value={editingExpense.valor} 
                        onChange={e => setEditingExpense({...editingExpense, valor: e.target.value})} 
                        className="h-11 md:h-10 pl-9 border-slate-200 bg-slate-50 focus:bg-white rounded-md font-bold text-slate-800 text-sm" 
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] md:text-xs font-semibold uppercase text-slate-500 tracking-widest ml-1">Vencimento</label>
                    <Input 
                      type="date" 
                      value={editingExpense.vencimento} 
                      onChange={e => setEditingExpense({...editingExpense, vencimento: e.target.value})} 
                      className="h-11 md:h-10 border-slate-200 bg-slate-50 focus:bg-white rounded-md font-semibold text-slate-800 text-sm" 
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-1 border-b border-slate-100 pb-5">
                  <div className="space-y-1.5">
                    <label className="text-[10px] md:text-xs font-semibold uppercase text-slate-500 tracking-widest ml-1">Categoria</label>
                    <select 
                      value={editingExpense.categoria} 
                      onChange={e => setEditingExpense({...editingExpense, categoria: e.target.value})}
                      className="w-full h-11 md:h-10 border border-slate-200 rounded-md px-3 text-[11px] md:text-xs font-semibold uppercase outline-none bg-slate-50 focus:bg-white text-slate-700"
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
                  
                  {/* AJUSTE MANUAL DO VALOR PAGO (Apenas em Edição) */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] md:text-xs font-semibold uppercase text-emerald-600 tracking-widest ml-1">Valor Já Pago (R$)</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-emerald-500 font-semibold text-sm">R$</span>
                      <Input 
                        type="number" 
                        value={editingExpense.valor_pago || 0} 
                        onChange={e => setEditingExpense({...editingExpense, valor_pago: e.target.value})} 
                        className="h-11 md:h-10 pl-9 border-emerald-200 bg-emerald-50 focus:bg-white rounded-md font-bold text-emerald-700 text-sm" 
                      />
                    </div>
                  </div>
                </div>

                <Button 
                  onClick={handleSave} 
                  disabled={saveMutation.isPending}
                  className="w-full h-12 md:h-11 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-bold uppercase text-[11px] md:text-xs mt-2 shadow-sm transition-all"
                >
                  {saveMutation.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : "Salvar Despesa"}
                </Button>
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}