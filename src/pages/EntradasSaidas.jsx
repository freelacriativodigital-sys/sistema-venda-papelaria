import React, { useState, useMemo } from "react";
import { supabase } from "../lib/supabase"; 
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  ArrowUpCircle, ArrowDownCircle, DollarSign, Loader2, 
  Search, Plus, CalendarDays, Download, Wallet, TrendingUp, Pencil, Trash2,
  ChevronLeft, ChevronRight, BarChart3, PieChart
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import LancamentoModal from '@/components/tasks/LancamentoModal';

const formatCurrency = (value) => 
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0);

const formatDate = (dateString) => {
  if (!dateString) return '---';
  const date = new Date(`${dateString.includes('T') ? dateString : dateString + 'T12:00:00'}`);
  return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
};

// Formata o mês para exibir no topo (Ex: "Abril 2026")
const formatMonthYear = (date) => {
  const nomeMes = date.toLocaleDateString('pt-BR', { month: 'long' });
  return `${nomeMes.charAt(0).toUpperCase() + nomeMes.slice(1)} ${date.getFullYear()}`;
};

export default function EntradasSaidas() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalTipo, setModalTipo] = useState('entrada');
  const [editingTransaction, setEditingTransaction] = useState(null);

  // --- ESTADO DO SELETOR DE MÊS ---
  const [refDate, setRefDate] = useState(new Date());

  const handlePrevMonth = () => {
    setRefDate(prev => {
      const nova = new Date(prev);
      nova.setMonth(nova.getMonth() - 1);
      return nova;
    });
  };

  const handleNextMonth = () => {
    setRefDate(prev => {
      const nova = new Date(prev);
      nova.setMonth(nova.getMonth() + 1);
      return nova;
    });
  };

  const mesSelecionadoStr = refDate.toISOString().slice(0, 7); // Ex: "2026-04"

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

  // --- PROCESSAMENTO DOS DADOS ---
  const transacoesBrutas = [];

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
      transacoesBrutas.push({
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
      transacoesBrutas.push({
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

  // --- FILTROS POR MÊS E AGRUPAMENTOS PARA OS GRÁFICOS ---
  const { 
    transacoesDoMes, 
    totalEntradasMes, 
    totalSaidasMes, 
    catEntradas, 
    catSaidas 
  } = useMemo(() => {
    let tEntradas = 0;
    let tSaidas = 0;
    const cEntradas = {};
    const cSaidas = {};
    const filtradas = [];

    transacoesBrutas.forEach(t => {
      const dataTrans = t.dataOriginal ? String(t.dataOriginal).substring(0, 7) : '';
      if (dataTrans === mesSelecionadoStr) {
        filtradas.push(t);
        if (t.tipo === 'entrada') {
          tEntradas += t.valor;
          cEntradas[t.categoria] = (cEntradas[t.categoria] || 0) + t.valor;
        } else {
          tSaidas += t.valor;
          cSaidas[t.categoria] = (cSaidas[t.categoria] || 0) + t.valor;
        }
      }
    });

    filtradas.sort((a, b) => new Date(b.dataOriginal) - new Date(a.dataOriginal));

    // Transforma os objetos em arrays e ordena do maior pro menor
    const arrEntradas = Object.entries(cEntradas).map(([nome, valor]) => ({nome, valor})).sort((a,b) => b.valor - a.valor);
    const arrSaidas = Object.entries(cSaidas).map(([nome, valor]) => ({nome, valor})).sort((a,b) => b.valor - a.valor);

    return { 
      transacoesDoMes: filtradas, 
      totalEntradasMes: tEntradas, 
      totalSaidasMes: tSaidas, 
      catEntradas: arrEntradas, 
      catSaidas: arrSaidas 
    };
  }, [transacoesBrutas, mesSelecionadoStr]);

  const saldoLiquidoMes = totalEntradasMes - totalSaidasMes;
  const isLoading = loadingPedidos || loadingDespesas;

  // Filtro de Busca na lista
  const transacoesExibidas = transacoesDoMes.filter(t => 
    t.descricao.toLowerCase().includes(searchTerm.toLowerCase()) || 
    (t.cliente && t.cliente.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleExport = () => {
    let csv = 'Data,Tipo,Categoria,Descricao,Cliente,Valor\n';
    transacoesExibidas.forEach(t => {
      csv += `${formatDate(t.dataOriginal)},${t.tipo.toUpperCase()},"${t.categoria}","${t.descricao}","${t.cliente || ''}",${t.valor}\n`;
    });
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `fluxo_de_caixa_${mesSelecionadoStr}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-4 animate-in fade-in duration-500 pb-20 pt-4 md:pt-5 px-4 md:px-0">
      
      {/* HEADER DA PÁGINA COM SELETOR DE MÊS */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-3 mb-3 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-lg md:text-xl font-semibold uppercase text-slate-800 tracking-tight flex items-center gap-2">
            <Wallet className="text-blue-600" size={20} /> Fluxo de Caixa
          </h1>
          <p className="text-[9px] font-medium text-slate-400 uppercase tracking-widest mt-0.5">
            Entradas e Saídas do Sistema
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto items-center">
          
          {/* SELETOR DE MÊS */}
          <div className="flex items-center justify-between w-full sm:w-auto bg-white border border-slate-200 rounded-md h-9 px-1 shadow-sm">
             <button onClick={handlePrevMonth} className="p-1 text-slate-400 hover:text-slate-700 transition-colors rounded-sm hover:bg-slate-50"><ChevronLeft size={16}/></button>
             <span className="text-[10px] font-bold text-slate-700 uppercase tracking-widest min-w-[100px] text-center select-none">
               {formatMonthYear(refDate)}
             </span>
             <button onClick={handleNextMonth} className="p-1 text-slate-400 hover:text-slate-700 transition-colors rounded-sm hover:bg-slate-50"><ChevronRight size={16}/></button>
          </div>

          <div className="flex gap-2 w-full sm:w-auto">
            <Button onClick={handleExport} variant="outline" className="flex-1 sm:flex-none h-9 px-3 border-slate-200 text-slate-600 hover:bg-slate-50 font-semibold text-[9px] uppercase tracking-widest gap-1.5 shadow-sm">
              <Download size={12} /> CSV
            </Button>
            <Button onClick={() => handleOpenModalNova('entrada')} className="flex-1 sm:flex-none bg-blue-600 hover:bg-blue-700 text-white rounded-md h-9 px-4 shadow-sm flex gap-1.5 font-semibold text-[9px] uppercase tracking-widest">
              <Plus size={12} /> Lançamento
            </Button>
          </div>
        </div>
      </div>

      {/* KPI CARDS (DADOS DO MÊS) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
         <div className="bg-emerald-600 rounded-xl p-3 md:p-4 border border-emerald-700 shadow-md flex flex-col justify-between group overflow-hidden relative min-h-[90px]">
           <div className="absolute -top-2 -right-2 p-2 opacity-10 group-hover:scale-110 transition-transform"><TrendingUp size={70} /></div>
           <div className="flex items-center justify-between mb-1.5 relative z-10">
             <span className="text-[9px] font-semibold uppercase tracking-widest text-emerald-100/90">Entradas do Mês</span>
             <ArrowUpCircle size={14} className="text-emerald-100" />
           </div>
           <div className="relative z-10">
             <h3 className="text-xl md:text-2xl font-semibold text-white tracking-tight">{formatCurrency(totalEntradasMes)}</h3>
           </div>
         </div>

         <div className="bg-rose-600 rounded-xl p-3 md:p-4 border border-rose-700 shadow-md flex flex-col justify-between group overflow-hidden relative min-h-[90px]">
           <div className="absolute -top-2 -right-2 p-2 opacity-10 group-hover:scale-110 transition-transform"><ArrowDownCircle size={70} /></div>
           <div className="flex items-center justify-between mb-1.5 relative z-10">
             <span className="text-[9px] font-semibold uppercase tracking-widest text-rose-100/90">Saídas do Mês</span>
             <ArrowDownCircle size={14} className="text-rose-100" />
           </div>
           <div className="relative z-10">
             <h3 className="text-xl md:text-2xl font-semibold text-white tracking-tight">{formatCurrency(totalSaidasMes)}</h3>
           </div>
         </div>

         <div className="bg-slate-900 rounded-xl p-3 md:p-4 border border-slate-800 shadow-md flex flex-col justify-between group overflow-hidden relative min-h-[90px]">
           <div className="absolute -top-2 -right-2 p-2 opacity-5 group-hover:scale-110 transition-transform"><DollarSign size={70} className="text-white" /></div>
           <div className="flex items-center justify-between mb-1.5 relative z-10">
             <span className="text-[9px] font-semibold uppercase tracking-widest text-slate-400">Saldo Líquido do Mês</span>
             <Wallet size={14} className="text-slate-400" />
           </div>
           <div className="relative z-10">
             <h3 className={`text-xl md:text-2xl font-semibold tracking-tight ${saldoLiquidoMes >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
               {formatCurrency(saldoLiquidoMes)}
             </h3>
           </div>
         </div>
      </div>

      {/* GRÁFICOS: RESUMO POR CATEGORIA */}
      {!isLoading && (transacoesDoMes.length > 0) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6">
          
          {/* GRÁFICO ENTRADAS */}
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex flex-col">
            <h3 className="text-[10px] font-semibold text-slate-600 uppercase tracking-widest mb-4 flex items-center gap-1.5 border-b border-slate-100 pb-2">
              <PieChart size={12} className="text-emerald-500" /> Entradas por Categoria
            </h3>
            {catEntradas.length === 0 ? (
              <p className="text-[9px] text-slate-400 font-medium uppercase tracking-widest text-center py-4">Sem entradas neste mês</p>
            ) : (
              <div className="space-y-3">
                {catEntradas.map((cat, index) => {
                  const percent = Math.round((cat.valor / totalEntradasMes) * 100);
                  return (
                    <div key={index}>
                      <div className="flex justify-between items-end mb-1">
                        <span className="text-[9px] font-semibold text-slate-700 uppercase tracking-widest truncate pr-2">{cat.nome}</span>
                        <span className="text-[10px] font-bold text-slate-800">{formatCurrency(cat.valor)}</span>
                      </div>
                      <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden flex items-center">
                        <motion.div 
                          initial={{ width: 0 }} animate={{ width: `${percent}%` }} transition={{ duration: 0.8 }}
                          className="h-full bg-emerald-500 rounded-full" 
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* GRÁFICO SAÍDAS */}
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex flex-col">
            <h3 className="text-[10px] font-semibold text-slate-600 uppercase tracking-widest mb-4 flex items-center gap-1.5 border-b border-slate-100 pb-2">
              <BarChart3 size={12} className="text-rose-500" /> Saídas por Categoria
            </h3>
            {catSaidas.length === 0 ? (
              <p className="text-[9px] text-slate-400 font-medium uppercase tracking-widest text-center py-4">Sem saídas neste mês</p>
            ) : (
              <div className="space-y-3">
                {catSaidas.map((cat, index) => {
                  const percent = Math.round((cat.valor / totalSaidasMes) * 100);
                  return (
                    <div key={index}>
                      <div className="flex justify-between items-end mb-1">
                        <span className="text-[9px] font-semibold text-slate-700 uppercase tracking-widest truncate pr-2">{cat.nome}</span>
                        <span className="text-[10px] font-bold text-slate-800">{formatCurrency(cat.valor)}</span>
                      </div>
                      <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden flex items-center">
                        <motion.div 
                          initial={{ width: 0 }} animate={{ width: `${percent}%` }} transition={{ duration: 0.8 }}
                          className="h-full bg-rose-500 rounded-full" 
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </div>
      )}

      {/* LISTA DE TRANSAÇÕES DO MÊS */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        <div className="p-3 border-b border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
           <h3 className="text-[9px] font-semibold text-slate-500 uppercase tracking-widest">
             Movimentações de {formatMonthYear(refDate)}
           </h3>
           <div className="flex items-center gap-2">
              <div className="relative w-full sm:w-48">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" size={12} />
                <Input 
                  placeholder="Pesquisar..." 
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="h-7 pl-7 border-slate-200 bg-white rounded-md font-medium text-[9px] w-full"
                />
              </div>
              <span className="text-[8px] font-medium bg-slate-200 text-slate-600 px-2 py-1 rounded-full shrink-0">{transacoesExibidas.length} registros</span>
           </div>
        </div>

        {isLoading ? (
           <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-blue-600" /></div>
        ) : transacoesExibidas.length === 0 ? (
           <div className="text-center py-12">
             <DollarSign className="w-8 h-8 text-slate-200 mx-auto mb-2" />
             <p className="text-[10px] font-semibold uppercase text-slate-400 tracking-widest">Nenhuma transação neste mês</p>
           </div>
        ) : (
           <div className="divide-y divide-slate-100">
             {transacoesExibidas.map((t) => (
               <div key={t.id} className="p-3 flex items-center justify-between hover:bg-slate-50 transition-colors group">
                  <div className="flex items-center gap-3 overflow-hidden pr-3">
                     <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${t.tipo === 'entrada' ? 'bg-emerald-50 text-emerald-500' : 'bg-rose-50 text-rose-500'}`}>
                       {t.tipo === 'entrada' ? <ArrowUpCircle size={16} /> : <ArrowDownCircle size={16} />}
                     </div>
                     <div className="overflow-hidden">
                        <div className="flex items-center gap-2 mb-0.5">
                          <p className="text-xs font-semibold text-slate-800 truncate">{t.descricao}</p>
                          <span className="text-[8px] bg-slate-100 border border-slate-200 text-slate-500 px-1.5 py-0.5 rounded uppercase font-bold tracking-widest hidden md:inline-block">
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
                  
                  <div className="flex items-center gap-4">
                     <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity mr-2">
                       <button onClick={() => handleEdit(t)} className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"><Pencil size={14}/></button>
                       <button onClick={() => handleDelete(t)} disabled={deleteTransactionMutation.isPending} className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors"><Trash2 size={14}/></button>
                     </div>
                     <div className="text-right shrink-0">
                        <p className={`text-sm font-semibold ${t.tipo === 'entrada' ? 'text-emerald-600' : 'text-rose-600'}`}>
                          {t.tipo === 'entrada' ? '+' : '-'}{formatCurrency(t.valor)}
                        </p>
                        <span className={`text-[8px] font-semibold uppercase tracking-widest px-1.5 py-0.5 rounded mt-1 inline-block ${t.tipo === 'entrada' ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-500'}`}>
                          {t.status}
                        </span>
                     </div>
                  </div>
               </div>
             ))}
           </div>
        )}
      </div>

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