import React, { useState } from "react";
import { supabase } from "../lib/supabase"; 
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  ArrowUpCircle, ArrowDownCircle, DollarSign, Loader2, 
  Search, Plus, CalendarDays, Download, Wallet, TrendingUp, TrendingDown, Pencil, Trash2,
  FileText, X
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AnimatePresence, motion } from "framer-motion";
import LancamentoModal from '@/components/tasks/LancamentoModal';

// Importa o nosso super gerador de PDFs
import { gerarDemonstrativoPDF } from "../lib/gerarDemonstrativo";

const formatCurrency = (value) => 
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0);

const formatDate = (dateString) => {
  if (!dateString) return '---';
  const date = new Date(`${dateString.includes('T') ? dateString : dateString + 'T12:00:00'}`);
  return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
};

export default function EntradasSaidas() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalTipo, setModalTipo] = useState('entrada');
  const [editingTransaction, setEditingTransaction] = useState(null);

  // Modal do Demonstrativo
  const [isDemoModalOpen, setIsDemoModalOpen] = useState(false);
  const [demoConfig, setDemoConfig] = useState({ periodo: 'mensal', ano: new Date().getFullYear().toString() });

  const { data: pedidos = [], isLoading: loadingPedidos } = useQuery({
    queryKey: ["fluxo-pedidos"],
    queryFn: async () => {
      const { data, error } = await supabase.from("pedidos").select("*");
      if (error) throw error;
      return data || [];
    },
  });

  const { data: despesas = [], isLoading: loadingDespesas } = useQuery({
    queryKey: ["fluxo-despesas"],
    queryFn: async () => {
      const { data, error } = await supabase.from("despesas").select("*");
      if (error) throw error;
      return data || [];
    },
  });

  // Configurações da loja para enviar para a logo do PDF
  const { data: lojaConfig } = useQuery({
    queryKey: ["sistema-config"],
    queryFn: async () => {
      const { data, error } = await supabase.from("configuracoes").select("*").eq("id", 1).single();
      if (error) return {};
      return data || {};
    },
  });

  const deleteTransactionMutation = useMutation({
    mutationFn: async ({ idOriginal, tipo }) => {
      const tabela = tipo === 'entrada' ? 'pedidos' : 'despesas';
      const { error } = await supabase.from(tabela).delete().eq('id', idOriginal);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["fluxo-pedidos"] });
      queryClient.invalidateQueries({ queryKey: ["fluxo-despesas"] });
      queryClient.invalidateQueries({ queryKey: ["art-tasks"] });
    }
  });

  const handleDelete = (t) => {
    if (window.confirm(`Tem certeza que deseja excluir a transação "${t.descricao}"?`)) {
      deleteTransactionMutation.mutate({ idOriginal: t.idOriginal, tipo: t.tipo });
    }
  };

  const handleEdit = (t) => {
    setEditingTransaction(t);
    setModalTipo(t.tipo);
    setIsModalOpen(true);
  };

  const handleOpenModalNova = (tipo) => {
    setEditingTransaction(null);
    setModalTipo(tipo);
    setIsModalOpen(true);
  };

  const transacoes = [];
  let totalEntradas = 0;
  let totalSaidas = 0;

  pedidos.forEach(p => {
    const checklistTotal = (p.checklist || []).reduce((s, i) => s + (Number(i.value) || 0), 0);
    const baseValue = p.service_value !== undefined ? Number(p.service_value) : (Number(p.price) || 0);
    const displayValue = checklistTotal > 0 ? checklistTotal : baseValue;
    
    const valorAdiantado = Number(p.valor_pago || 0);
    const isPaid = String(p.payment_status || '').toLowerCase().trim() === 'pago' || String(p.status || '').toLowerCase().trim() === 'concluida';
    
    let valorRealEntrado = 0;
    if (isPaid || (valorAdiantado >= displayValue && displayValue > 0)) {
      valorRealEntrado = displayValue;
    } else if (valorAdiantado > 0) {
      valorRealEntrado = valorAdiantado;
    }

    if (valorRealEntrado > 0) {
      totalEntradas += valorRealEntrado;
      transacoes.push({
        id: `p_${p.id}`,
        idOriginal: p.id,
        tipo: 'entrada',
        descricao: p.title,
        valor: valorRealEntrado,
        dataOriginal: p.completed_date || p.created_at,
        cliente: p.cliente_nome,
        categoria: p.category || 'Outros',
        status: 'Recebido'
      });
    }
  });

  despesas.forEach(d => {
    const valorPago = Number(d.valor_pago) || 0;
    if (valorPago > 0) {
      totalSaidas += valorPago;
      transacoes.push({
        id: `d_${d.id}`,
        idOriginal: d.id,
        tipo: 'saida',
        descricao: d.descricao,
        valor: valorPago,
        dataOriginal: d.vencimento || d.created_at,
        cliente: null,
        categoria: d.categoria || 'Outros',
        status: 'Pago'
      });
    }
  });

  transacoes.sort((a, b) => new Date(b.dataOriginal) - new Date(a.dataOriginal));

  const filteredTransacoes = transacoes.filter(t => 
    t.descricao.toLowerCase().includes(searchTerm.toLowerCase()) || 
    (t.cliente && t.cliente.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const saldoLiquido = totalEntradas - totalSaidas;
  const isLoading = loadingPedidos || loadingDespesas;

  const handleExport = () => {
    let csv = 'Data,Tipo,Categoria,Descricao,Cliente,Valor\n';
    filteredTransacoes.forEach(t => {
      csv += `${formatDate(t.dataOriginal)},${t.tipo.toUpperCase()},"${t.categoria}","${t.descricao}","${t.cliente || ''}",${t.valor}\n`;
    });
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", "fluxo_de_caixa.csv");
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Chama o módulo gerador importado adaptando os dados da transação
  const handleGenerateDemonstrativo = () => {
    const payloadParaPDF = transacoes.map(t => ({
      vencimento: t.dataOriginal ? t.dataOriginal.split('T')[0] : new Date().toISOString().split('T')[0],
      status: 'pago',
      categoria: t.categoria,
      tipo: t.tipo === 'entrada' ? 'receita' : 'despesa',
      valor_pago: t.valor
    }));
    
    gerarDemonstrativoPDF(payloadParaPDF, demoConfig, lojaConfig);
    setIsDemoModalOpen(false);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-4 animate-in fade-in duration-500 pb-24 pt-4 md:pt-5 px-4 md:px-0">
      
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-3 mb-3">
        <div>
          <h1 className="text-lg md:text-xl font-semibold uppercase text-slate-800 tracking-tight flex items-center gap-2">
            <Wallet className="text-blue-600" size={20} /> Fluxo de Caixa
          </h1>
          <p className="text-[9px] font-medium text-slate-400 uppercase tracking-widest mt-0.5">
            Entradas e Saídas do Sistema
          </p>
        </div>

        {/* Botões do Desktop */}
        <div className="flex items-center gap-2 w-full md:w-auto">
          <div className="relative w-full md:w-64">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
            <Input 
              placeholder="Procurar transação..." 
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="h-9 pl-8 border-slate-200 bg-white rounded-md font-medium text-xs w-full"
            />
          </div>
          
          <div className="hidden md:flex items-center gap-2">
            <Button onClick={() => setIsDemoModalOpen(true)} variant="outline" className="h-9 px-3 border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-blue-600 font-bold text-[9px] uppercase tracking-widest gap-1.5 shadow-sm">
              <FileText size={12} /> Demonstrativo
            </Button>
            <Button onClick={handleExport} variant="outline" className="h-9 px-3 border-slate-200 text-slate-600 hover:bg-slate-50 font-bold text-[9px] uppercase tracking-widest gap-1.5 shadow-sm">
              <Download size={12} /> CSV
            </Button>
            <div className="w-px h-5 bg-slate-200 mx-1"></div>
            <Button onClick={() => handleOpenModalNova('entrada')} className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-md h-9 px-4 shadow-sm flex items-center gap-1.5 font-bold text-[10px] uppercase tracking-widest">
              <TrendingUp size={14} /> Entrada
            </Button>
            <Button onClick={() => handleOpenModalNova('saida')} className="bg-rose-600 hover:bg-rose-700 text-white rounded-md h-9 px-4 shadow-sm flex items-center gap-1.5 font-bold text-[10px] uppercase tracking-widest">
              <TrendingDown size={14} /> Saída
            </Button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
         <div className="bg-emerald-600 rounded-xl p-3 md:p-4 border border-emerald-700 shadow-md flex flex-col justify-between group overflow-hidden relative min-h-[90px]">
           <div className="absolute -top-2 -right-2 p-2 opacity-10 group-hover:scale-110 transition-transform"><TrendingUp size={70} /></div>
           <div className="flex items-center justify-between mb-1.5 relative z-10">
             <span className="text-[9px] font-semibold uppercase tracking-widest text-emerald-100/90">Total Entradas</span>
             <ArrowUpCircle size={14} className="text-emerald-100" />
           </div>
           <div className="relative z-10">
             <h3 className="text-xl md:text-2xl font-semibold text-white tracking-tight">{formatCurrency(totalEntradas)}</h3>
           </div>
         </div>

         <div className="bg-rose-600 rounded-xl p-3 md:p-4 border border-rose-700 shadow-md flex flex-col justify-between group overflow-hidden relative min-h-[90px]">
           <div className="absolute -top-2 -right-2 p-2 opacity-10 group-hover:scale-110 transition-transform"><ArrowDownCircle size={70} /></div>
           <div className="flex items-center justify-between mb-1.5 relative z-10">
             <span className="text-[9px] font-semibold uppercase tracking-widest text-rose-100/90">Total Saídas</span>
             <ArrowDownCircle size={14} className="text-rose-100" />
           </div>
           <div className="relative z-10">
             <h3 className="text-xl md:text-2xl font-semibold text-white tracking-tight">{formatCurrency(totalSaidas)}</h3>
           </div>
         </div>

         <div className="bg-slate-900 rounded-xl p-3 md:p-4 border border-slate-800 shadow-md flex flex-col justify-between group overflow-hidden relative min-h-[90px]">
           <div className="absolute -top-2 -right-2 p-2 opacity-5 group-hover:scale-110 transition-transform"><DollarSign size={70} className="text-white" /></div>
           <div className="flex items-center justify-between mb-1.5 relative z-10">
             <span className="text-[9px] font-semibold uppercase tracking-widest text-slate-400">Saldo Líquido</span>
             <Wallet size={14} className="text-slate-400" />
           </div>
           <div className="relative z-10">
             <h3 className={`text-xl md:text-2xl font-semibold tracking-tight ${saldoLiquido >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
               {formatCurrency(saldoLiquido)}
             </h3>
           </div>
         </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        <div className="p-3 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
           <h3 className="text-[9px] font-semibold text-slate-500 uppercase tracking-widest">Histórico de Movimentações</h3>
           <span className="text-[8px] font-medium bg-slate-200 text-slate-600 px-2 py-0.5 rounded-full">{filteredTransacoes.length} registros</span>
        </div>

        {isLoading ? (
           <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-blue-600" /></div>
        ) : filteredTransacoes.length === 0 ? (
           <div className="text-center py-12">
             <DollarSign className="w-8 h-8 text-slate-200 mx-auto mb-2" />
             <p className="text-[10px] font-semibold uppercase text-slate-400 tracking-widest">Nenhuma transação</p>
           </div>
        ) : (
           <div className="divide-y divide-slate-100">
             {filteredTransacoes.map((t) => (
               <div key={t.id} className="p-3 flex items-center justify-between hover:bg-slate-50 transition-colors group">
                  <div className="flex items-center gap-3 overflow-hidden pr-3 w-full md:w-[60%]">
                     <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${t.tipo === 'entrada' ? 'bg-emerald-50 text-emerald-500' : 'bg-rose-50 text-rose-500'}`}>
                       {t.tipo === 'entrada' ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                     </div>
                     <div className="overflow-hidden">
                        <div className="flex items-center gap-2 mb-0.5">
                          <p className="text-xs font-semibold text-slate-800 truncate">{t.descricao}</p>
                          <span className="text-[8px] bg-slate-100 border border-slate-200 text-slate-500 px-1.5 py-0.5 rounded uppercase font-bold tracking-widest hidden md:inline-block shrink-0">
                            {t.categoria}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 text-[9px] font-medium text-slate-500">
                           <span className="flex items-center gap-1"><CalendarDays size={10}/> {formatDate(t.dataOriginal)}</span>
                           {t.cliente && (
                             <>
                               <span className="opacity-50">•</span>
                               <span className="truncate max-w-[100px] md:max-w-[200px]">{t.cliente}</span>
                             </>
                           )}
                        </div>
                     </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                     {/* Ícones sempre visíveis e elegantes */}
                     <div className="flex items-center gap-1 bg-slate-50 border border-slate-200/60 rounded-md p-0.5 shadow-sm shrink-0">
                       <button onClick={() => handleEdit(t)} className="p-1.5 text-blue-500 hover:bg-blue-100 hover:text-blue-700 rounded transition-colors" title="Editar"><Pencil size={13}/></button>
                       <button onClick={() => handleDelete(t)} disabled={deleteTransactionMutation.isPending} className="p-1.5 text-rose-500 hover:bg-rose-100 hover:text-rose-700 rounded transition-colors" title="Excluir"><Trash2 size={13}/></button>
                     </div>
                     
                     <div className="text-right shrink-0 min-w-[70px]">
                        <p className={`text-sm font-semibold ${t.tipo === 'entrada' ? 'text-emerald-600' : 'text-rose-600'}`}>
                          {t.tipo === 'entrada' ? '+' : '-'}{formatCurrency(t.valor)}
                        </p>
                        <span className={`text-[8px] font-semibold uppercase tracking-widest px-1.5 py-0.5 rounded mt-1 inline-block ${t.tipo === 'entrada' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-slate-100 text-slate-500 border border-slate-200'}`}>
                          {t.status}
                        </span>
                     </div>
                  </div>
               </div>
             ))}
           </div>
        )}
      </div>

      {/* BOTÕES FIXOS NA BASE PARA MOBILE */}
      <div className="md:hidden fixed bottom-0 left-0 w-full p-2 bg-white border-t border-slate-200 z-[90] shadow-[0_-4px_15px_rgba(0,0,0,0.05)] pb-safe">
        <div className="flex gap-1.5 w-full">
          <Button onClick={() => setIsDemoModalOpen(true)} variant="outline" className="flex-1 h-12 flex-col gap-1 text-[8px] font-bold uppercase tracking-widest text-slate-500 border-slate-200 hover:bg-slate-50 shadow-sm">
            <FileText size={14} className="text-blue-500"/> Demo.
          </Button>
          <Button onClick={handleExport} variant="outline" className="flex-1 h-12 flex-col gap-1 text-[8px] font-bold uppercase tracking-widest text-slate-500 border-slate-200 hover:bg-slate-50 shadow-sm">
            <Download size={14} className="text-slate-500"/> CSV
          </Button>
          <Button onClick={() => handleOpenModalNova('entrada')} className="flex-1 h-12 flex-col gap-1 text-[8px] font-bold uppercase tracking-widest bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm border-0">
            <TrendingUp size={14}/> Entrada
          </Button>
          <Button onClick={() => handleOpenModalNova('saida')} className="flex-1 h-12 flex-col gap-1 text-[8px] font-bold uppercase tracking-widest bg-rose-600 hover:bg-rose-700 text-white shadow-sm border-0">
            <TrendingDown size={14}/> Saída
          </Button>
        </div>
      </div>

      {/* MODAL DO DEMONSTRATIVO PDF */}
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

      <LancamentoModal 
        isOpen={isModalOpen} 
        onClose={() => {
          setIsModalOpen(false);
          setEditingTransaction(null);
        }} 
        tipoInicial={modalTipo} 
        editingData={editingTransaction}
      />

    </div>
  );
}