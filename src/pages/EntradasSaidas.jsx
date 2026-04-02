import React, { useState } from "react";
import { supabase } from "../lib/supabase"; 
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ArrowUpCircle, ArrowDownCircle, DollarSign, Loader2, 
  Search, Plus, X, CalendarDays, Download, Wallet, CheckCircle2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const formatCurrency = (value) => 
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0);

const formatDate = (dateString) => {
  if (!dateString) return 'Data não informada';
  const date = new Date(dateString);
  return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
};

export default function EntradasSaidas() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Estados para nova transação avulsa
  const [tipoTransacao, setTipoTransacao] = useState('entrada');
  const [descricao, setDescricao] = useState('');
  const [valor, setValor] = useState('');

  // 1. Buscar Pedidos (Entradas)
  const { data: pedidos = [], isLoading: loadingPedidos } = useQuery({
    queryKey: ["fluxo-pedidos"],
    queryFn: async () => {
      const { data, error } = await supabase.from("pedidos").select("*");
      if (error) throw error;
      return data || [];
    },
  });

  // 2. Buscar Despesas (Saídas)
  const { data: despesas = [], isLoading: loadingDespesas } = useQuery({
    queryKey: ["fluxo-despesas"],
    queryFn: async () => {
      const { data, error } = await supabase.from("despesas").select("*");
      if (error) throw error;
      return data || [];
    },
  });

  // 3. Mutação para adicionar transação avulsa
  const addTransactionMutation = useMutation({
    mutationFn: async () => {
      const valorNum = parseFloat(valor) || 0;
      if (tipoTransacao === 'entrada') {
        const { error } = await supabase.from('pedidos').insert([{
          title: `Entrada Avulsa: ${descricao}`,
          service_value: valorNum,
          valor_pago: valorNum,
          status: 'concluida',
          payment_status: 'pago',
          category: 'Avulso',
          completed_date: new Date().toISOString()
        }]);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('despesas').insert([{
          descricao: `Saída Avulsa: ${descricao}`,
          valor: valorNum,
          valor_pago: valorNum,
          status: 'pago',
          vencimento: new Date().toISOString().split('T')[0],
          categoria: 'Avulso'
        }]);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["fluxo-pedidos"] });
      queryClient.invalidateQueries({ queryKey: ["fluxo-despesas"] });
      queryClient.invalidateQueries({ queryKey: ["art-tasks"] });
      setIsModalOpen(false);
      setDescricao('');
      setValor('');
    }
  });

  // --- PROCESSAMENTO DO FLUXO DE CAIXA ---
  const transacoes = [];
  let totalEntradas = 0;
  let totalSaidas = 0;

  // Processar Entradas (Pedidos Pagos ou com Pagamento Parcial)
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
        tipo: 'entrada',
        descricao: p.title,
        valor: valorRealEntrado,
        dataOriginal: p.completed_date || p.created_at,
        cliente: p.cliente_nome,
        status: 'Recebido'
      });
    }
  });

  // Processar Saídas (Despesas Pagas)
  despesas.forEach(d => {
    const valorPago = Number(d.valor_pago) || 0;
    if (valorPago > 0) {
      totalSaidas += valorPago;
      transacoes.push({
        id: `d_${d.id}`,
        tipo: 'saida',
        descricao: d.descricao,
        valor: valorPago,
        dataOriginal: d.vencimento || d.created_at,
        cliente: null,
        status: 'Pago'
      });
    }
  });

  // Ordenar por data mais recente
  transacoes.sort((a, b) => new Date(b.dataOriginal) - new Date(a.dataOriginal));

  // Filtro de Busca
  const filteredTransacoes = transacoes.filter(t => 
    t.descricao.toLowerCase().includes(searchTerm.toLowerCase()) || 
    (t.cliente && t.cliente.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const saldoLiquido = totalEntradas - totalSaidas;
  const isLoading = loadingPedidos || loadingDespesas;

  const handleExport = () => {
    let csv = 'Data,Tipo,Descricao,Cliente,Valor\n';
    filteredTransacoes.forEach(t => {
      csv += `${formatDate(t.dataOriginal)},${t.tipo.toUpperCase()},"${t.descricao}","${t.cliente || ''}",${t.valor}\n`;
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

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      <div className="bg-white border-b border-slate-100 sticky top-0 z-20 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4 md:py-5">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-xl md:text-2xl font-bold md:font-semibold text-slate-800 flex items-center gap-2 uppercase tracking-tight">
                <Wallet className="w-5 h-5 md:w-6 md:h-6 text-blue-600" /> Fluxo de Caixa
              </h1>
              <p className="text-[10px] md:text-xs font-medium text-slate-500 uppercase tracking-widest mt-1">
                Entradas e Saídas do Sistema
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto items-center">
              <div className="relative w-full md:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input 
                  placeholder="Procurar transação..." 
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="h-10 md:h-9 pl-9 border-slate-200 bg-slate-50/50 rounded-md font-medium text-xs w-full"
                />
              </div>
              <Button onClick={handleExport} variant="outline" className="w-full sm:w-auto h-10 md:h-9 px-4 border-slate-200 text-slate-600 hover:bg-slate-50 font-bold text-[10px] uppercase tracking-widest gap-2 shadow-sm">
                <Download size={14} /> CSV
              </Button>
              <Button onClick={() => setIsModalOpen(true)} className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white rounded-md h-10 md:h-9 px-5 shadow-sm flex gap-2 font-bold text-[10px] uppercase tracking-widest">
                <Plus size={14} /> Nova Transação
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 mt-6 md:mt-8 space-y-6">
        
        {/* KPI CARDS */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
           <div className="bg-emerald-600 rounded-xl p-5 shadow-sm relative overflow-hidden flex flex-col justify-between border border-emerald-700">
             <div className="absolute top-0 right-0 p-4 opacity-10"><ArrowUpCircle size={80} /></div>
             <p className="text-[10px] font-bold text-emerald-100 uppercase tracking-widest mb-2 relative z-10">Total Entradas</p>
             <h3 className="text-2xl md:text-3xl font-black text-white tracking-tighter relative z-10">{formatCurrency(totalEntradas)}</h3>
           </div>

           <div className="bg-rose-600 rounded-xl p-5 shadow-sm relative overflow-hidden flex flex-col justify-between border border-rose-700">
             <div className="absolute top-0 right-0 p-4 opacity-10"><ArrowDownCircle size={80} /></div>
             <p className="text-[10px] font-bold text-rose-100 uppercase tracking-widest mb-2 relative z-10">Total Saídas</p>
             <h3 className="text-2xl md:text-3xl font-black text-white tracking-tighter relative z-10">{formatCurrency(totalSaidas)}</h3>
           </div>

           <div className="bg-white rounded-xl p-5 shadow-sm relative overflow-hidden flex flex-col justify-between border border-slate-200">
             <div className="absolute top-0 right-0 p-4 opacity-5"><DollarSign size={80} className="text-slate-900" /></div>
             <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 relative z-10">Saldo Líquido</p>
             <h3 className={`text-2xl md:text-3xl font-black tracking-tighter relative z-10 ${saldoLiquido >= 0 ? 'text-slate-800' : 'text-rose-600'}`}>
               {formatCurrency(saldoLiquido)}
             </h3>
           </div>
        </div>

        {/* LISTA DE TRANSAÇÕES */}
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
             <h3 className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Histórico de Movimentações</h3>
             <span className="text-[10px] font-bold bg-slate-200 text-slate-600 px-2 py-0.5 rounded-full">{filteredTransacoes.length} registros</span>
          </div>

          {isLoading ? (
             <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-blue-600" /></div>
          ) : filteredTransacoes.length === 0 ? (
             <div className="text-center py-16">
               <DollarSign className="w-12 h-12 text-slate-200 mx-auto mb-3" />
               <p className="text-[11px] font-bold uppercase text-slate-400 tracking-widest">Nenhuma transação encontrada</p>
             </div>
          ) : (
             <div className="divide-y divide-slate-100">
               {filteredTransacoes.map((t) => (
                 <div key={t.id} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors group">
                    <div className="flex items-center gap-3 md:gap-4 overflow-hidden pr-4">
                       <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${t.tipo === 'entrada' ? 'bg-emerald-50 text-emerald-500' : 'bg-rose-50 text-rose-500'}`}>
                         {t.tipo === 'entrada' ? <ArrowUpCircle size={20} /> : <ArrowDownCircle size={20} />}
                       </div>
                       <div className="overflow-hidden">
                          <p className="text-xs md:text-sm font-bold text-slate-800 truncate mb-0.5">{t.descricao}</p>
                          <div className="flex items-center gap-2 text-[10px] font-medium text-slate-500">
                             <span className="flex items-center gap-1"><CalendarDays size={10}/> {formatDate(t.dataOriginal)}</span>
                             {t.cliente && (
                               <>
                                 <span className="opacity-50">•</span>
                                 <span className="truncate max-w-[100px] md:max-w-xs">{t.cliente}</span>
                               </>
                             )}
                          </div>
                       </div>
                    </div>
                    <div className="text-right shrink-0">
                       <p className={`text-sm md:text-base font-black ${t.tipo === 'entrada' ? 'text-emerald-600' : 'text-rose-600'}`}>
                         {t.tipo === 'entrada' ? '+' : '-'}{formatCurrency(t.valor)}
                       </p>
                       <span className={`text-[8px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded mt-1 inline-block ${t.tipo === 'entrada' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                         {t.status}
                       </span>
                    </div>
                 </div>
               ))}
             </div>
          )}
        </div>
      </div>

      {/* MODAL DE NOVA TRANSAÇÃO AVULSA */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsModalOpen(false)} className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" />
            <motion.div initial={{ scale: 0.95, opacity: 0, y: 10 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 10 }} className="bg-white w-full max-w-sm rounded-xl p-6 shadow-2xl relative z-[110]">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-lg font-semibold text-slate-800 uppercase tracking-tight flex items-center gap-2">
                  <Wallet className="text-blue-600 w-5 h-5" /> Registo Avulso
                </h2>
                <button onClick={() => setIsModalOpen(false)} className="p-1.5 hover:bg-slate-100 text-slate-500 rounded-md transition-colors"><X className="w-5 h-5" /></button>
              </div>
              
              <div className="space-y-4">
                <div className="flex bg-slate-100 p-1 rounded-lg">
                  <button onClick={() => setTipoTransacao('entrada')} className={`flex-1 py-2 text-[10px] font-bold uppercase tracking-widest rounded-md transition-all flex items-center justify-center gap-1.5 ${tipoTransacao === 'entrada' ? 'bg-white shadow-sm text-emerald-600' : 'text-slate-400 hover:text-slate-600'}`}>
                    <ArrowUpCircle size={14} /> Entrada
                  </button>
                  <button onClick={() => setTipoTransacao('saida')} className={`flex-1 py-2 text-[10px] font-bold uppercase tracking-widest rounded-md transition-all flex items-center justify-center gap-1.5 ${tipoTransacao === 'saida' ? 'bg-white shadow-sm text-rose-600' : 'text-slate-400 hover:text-slate-600'}`}>
                    <ArrowDownCircle size={14} /> Saída
                  </button>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase text-slate-500 tracking-widest ml-1">Descrição</label>
                  <Input value={descricao} onChange={e => setDescricao(e.target.value)} placeholder="Ex: Venda balcão, Material de limpeza..." className="h-11 border-slate-200 text-sm font-medium" autoFocus />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase text-slate-500 tracking-widest ml-1">Valor (R$)</label>
                  <Input type="number" value={valor} onChange={e => setValor(e.target.value)} placeholder="0.00" className="h-11 border-slate-200 text-sm font-bold" />
                </div>

                <Button 
                  onClick={() => {
                    if (!descricao.trim() || !valor) return alert("Preencha a descrição e o valor.");
                    addTransactionMutation.mutate();
                  }} 
                  disabled={addTransactionMutation.isPending}
                  className={`w-full h-12 mt-4 text-white font-bold uppercase tracking-widest text-[10px] md:text-xs shadow-md transition-all ${tipoTransacao === 'entrada' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-rose-600 hover:bg-rose-700'}`}
                >
                  {addTransactionMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : (
                    <><CheckCircle2 className="w-4 h-4 mr-2" /> Salvar {tipoTransacao}</>
                  )}
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}