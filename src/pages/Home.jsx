import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useQuery, useQueryClient } from "@tanstack/react-query"; 
import { Button } from "@/components/ui/button";
import { 
  Users, ArrowUpRight, ArrowDownRight, Activity, Loader2,
  Printer, Target, Sparkles, AlertCircle, ShoppingCart, CheckCircle, TrendingUp, Palette, ShieldCheck,
  ArrowUpCircle, ArrowDownCircle
} from 'lucide-react';
import { Link } from 'react-router-dom';
import LancamentoModal from '@/components/tasks/LancamentoModal'; 

export default function Home() {
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(true);
  const [alertasDespesas, setAlertasDespesas] = useState([]);
  const [depreciacaoTotal, setDepreciacaoTotal] = useState(0);
  const [isAdjusting, setIsAdjusting] = useState(false);

  // Estados para controlar o Modal de Lançamento na Home
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalTipo, setModalTipo] = useState('entrada');

  const handleOpenModal = (tipo) => {
    setModalTipo(tipo);
    setIsModalOpen(true);
  };

  // --- ESTADOS DO SALDO BANCÁRIO ---
  const [saldoBancario, setSaldoBancario] = useState(() => {
    const saved = localStorage.getItem('@sistema_saldo');
    return saved ? saved : '';
  });

  const handleSaldoChange = (e) => {
    const val = e.target.value;
    setSaldoBancario(val);
    localStorage.setItem('@sistema_saldo', val);
  };

  const [data, setData] = useState({
    orcamentos: { total: 0, count: 0 },
    clientes: { pago: 0, pendente: 0, count: 0 },
    despesas: { pagas: 0, pendentes: 0, count: 0 }
  });

  const { data: tasks = [], isLoading: isLoadingTasks } = useQuery({
    queryKey: ["art-tasks"],
    queryFn: async () => {
      const { data, error } = await supabase.from("pedidos").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  useEffect(() => {
    async function fetchDashboardData() {
      try {
        const { data: orcData } = await supabase.from('orcamentos').select('total');
        const orcTotal = orcData?.reduce((acc, curr) => acc + (Number(curr.total) || 0), 0) || 0;

        const { data: cliData } = await supabase.from('clientes').select('id, nome, pago, pendente');
        const cliPago = cliData?.reduce((acc, curr) => acc + (Number(curr.pago) || 0), 0) || 0;
        const cliPendente = cliData?.reduce((acc, curr) => acc + (Number(curr.pendente) || 0), 0) || 0;

        const { data: despData } = await supabase.from('despesas').select('id, descricao, valor, valor_pago, status, vencimento');
        
        let despPagasTotal = 0;
        let despPendentesTotal = 0;
        let alertasTemp = [];

        const hoje = new Date();
        hoje.setHours(0, 0, 0, 0);
        const mesAtual = hoje.getMonth();
        const anoAtual = hoje.getFullYear();

        despData?.forEach(d => {
           let isMesFuturo = false;

           if (d.vencimento) {
               const vencimento = new Date(`${d.vencimento}T00:00:00`);
               if (!isNaN(vencimento.getTime())) {
                   const mesVencimento = vencimento.getMonth();
                   const anoVencimento = vencimento.getFullYear();
                   if (anoVencimento > anoAtual || (anoVencimento === anoAtual && mesVencimento > mesAtual)) {
                       isMesFuturo = true;
                   }
               }
           }

           if (!isMesFuturo) {
               const jaPago = Number(d.valor_pago) || 0;
               const valorTotal = Number(d.valor) || 0;
               despPagasTotal += jaPago; 
               despPendentesTotal += (valorTotal - jaPago); 
           }

           if (d.status !== 'pago' && d.vencimento) {
               const vencimento = new Date(`${d.vencimento}T00:00:00`);
               if (!isNaN(vencimento.getTime())) {
                 const diffTime = vencimento.getTime() - hoje.getTime();
                 const diffDias = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                 if (diffDias <= 3) alertasTemp.push({ ...d, diffDias });
               }
           }
        });

        alertasTemp.sort((a, b) => a.diffDias - b.diffDias);
        setAlertasDespesas(alertasTemp);

        setData({
          orcamentos: { total: orcTotal, count: orcData?.length || 0 },
          clientes: { pago: cliPago, pendente: cliPendente, count: cliData?.length || 0 },
          despesas: { pagas: despPagasTotal, pendentes: despPendentesTotal, count: despData?.length || 0 }
        });

        const { data: equipData } = await supabase.from('equipamentos').select('depreciacao_mensal');
        const depreciacaoCalculada = equipData?.reduce((acc, curr) => acc + (Number(curr.depreciacao_mensal) || 0), 0) || 0;
        setDepreciacaoTotal(depreciacaoCalculada);

      } catch (error) {
        console.error("Erro ao carregar dashboard:", error);
      } finally {
        setLoading(false);
      }
    }

    if (!isLoadingTasks) fetchDashboardData();
  }, [isLoadingTasks, tasks]);

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0);
  };

  const getTaskValue = (task) => {
    const checklistTotal = (task.checklist || []).reduce((s, i) => s + (Number(i.value) || 0), 0);
    if (checklistTotal > 0) return checklistTotal;
    let baseValue = 0;
    if (task.service_value !== undefined && task.service_value !== null && task.service_value !== "") {
       baseValue = Number(task.service_value);
    } else if (task.price) {
       const priceStr = typeof task.price === 'string' ? task.price.replace(/[^0-9.,]/g, '').replace(',', '.') : String(task.price);
       baseValue = (parseFloat(priceStr) || 0) * (Number(task.quantity) || 1);
    }
    return baseValue;
  };

  const uniqueTasks = Array.from(new Map(tasks.map(t => [t.id, t])).values());
  let pedidosGanhosReal = 0;
  let pedidosPendentesValor = 0;

  uniqueTasks.forEach(task => {
    const totalValue = getTaskValue(task);
    const statusLower = String(task.status || '').toLowerCase().trim();
    const paymentLower = String(task.payment_status || '').toLowerCase().trim();
    
    const isPaid = paymentLower === 'pago' || statusLower === 'concluida' || statusLower === 'concluido';
    const isPartial = paymentLower === 'parcial';
    const valorAdiantado = Number(task.valor_pago || 0);

    if (isPaid) {
      pedidosGanhosReal += totalValue;
    } else if (isPartial || valorAdiantado > 0) {
      pedidosGanhosReal += valorAdiantado;
      pedidosPendentesValor += (totalValue - valorAdiantado);
    } else {
      pedidosPendentesValor += totalValue;
    }
  });

  const faturamentoRealEntrado = data.clientes.pago + pedidosGanhosReal;
  const caixaRealLimpo = faturamentoRealEntrado - data.despesas.pagas;
  const faturamentoPendenteTotal = data.clientes.pendente + pedidosPendentesValor;
  const contasAPagar = data.despesas.pendentes;
  const diferencaBanco = saldoBancario !== '' ? Number(saldoBancario) - caixaRealLimpo : 0;

  const handleRegistrarAjuste = async () => {
    if (diferencaBanco === 0) return;
    const absDiff = Math.abs(diferencaBanco);
    const isPositive = diferencaBanco > 0;
    const msg = isPositive 
      ? `Deseja registrar uma ENTRADA de ${formatCurrency(absDiff)} em Pedidos para igualar ao banco?`
      : `Deseja registrar uma SAÍDA (Valor Negativo) de ${formatCurrency(absDiff)} em Pedidos para igualar ao banco?`;

    if (window.confirm(msg)) {
      setIsAdjusting(true);
      try {
        const payload = {
          title: `Ajuste de Caixa (${isPositive ? 'Entrada' : 'Saída'})`,
          service_value: isPositive ? absDiff : -absDiff, 
          priority: 'media',
          status: 'concluida', 
          payment_status: 'pago', 
          description: `Ajuste automático para coincidir com saldo bancário de ${formatCurrency(Number(saldoBancario))}. Caixa do sistema era ${formatCurrency(caixaRealLimpo)}.`
        };
        const { error } = await supabase.from('pedidos').insert([payload]);
        if (error) throw error;
        
        alert("Ajuste de caixa registrado com sucesso em Pedidos!");
        queryClient.invalidateQueries(["art-tasks"]);
      } catch (error) {
        alert("Erro ao registrar ajuste: " + error.message);
      } finally {
        setIsAdjusting(false);
      }
    }
  };

  let dicaAcao = "";
  let corDica = "";

  if (contasAPagar > 0) {
    if (faturamentoPendenteTotal >= contasAPagar) {
      const sobra = faturamentoPendenteTotal - contasAPagar;
      dicaAcao = `A receber: ${formatCurrency(faturamentoPendenteTotal)} | Contas: ${formatCurrency(contasAPagar)} | Sobra Prevista: ${formatCurrency(sobra)}`;
      corDica = "text-emerald-200";
    } else if (faturamentoPendenteTotal > 0) {
      const falta = contasAPagar - faturamentoPendenteTotal;
      dicaAcao = `A receber: ${formatCurrency(faturamentoPendenteTotal)} | Contas: ${formatCurrency(contasAPagar)} | Déficit: ${formatCurrency(falta)}`;
      corDica = "text-amber-200";
    } else {
      dicaAcao = `Alerta: ${formatCurrency(contasAPagar)} em contas pendentes e nenhum recebimento projetado.`;
      corDica = "text-rose-200";
    }
  } else {
    if (faturamentoPendenteTotal > 0) {
      dicaAcao = `Contas quitadas. ${formatCurrency(faturamentoPendenteTotal)} de recebimentos projetados como lucro.`;
      corDica = "text-emerald-200";
    } else {
      dicaAcao = `Sem contas e sem recebimentos projetados no momento.`;
      corDica = "text-blue-200";
    }
  }

  if (loading || isLoadingTasks) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
        <p className="text-[9px] font-medium text-slate-400 uppercase tracking-widest">Carregando...</p>
      </div>
    );
  }

  return (
    // Padding bottom aumentado no mobile (pb-[100px]) para não ficar por baixo da barra fixa
    <div className="max-w-5xl mx-auto space-y-4 animate-in fade-in duration-500 pb-[100px] md:pb-20 pt-4 md:pt-5 px-4 md:px-0 relative">
      
      {/* HEADER DA PÁGINA COM BOTÕES NO DESKTOP */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-3 mb-3">
        <div>
          <h1 className="text-lg md:text-xl font-semibold uppercase text-slate-800 tracking-tight flex items-center gap-2">
            <Activity className="text-blue-600" size={20} /> Visão Geral
          </h1>
          <p className="text-[9px] font-medium text-slate-400 uppercase tracking-widest mt-0.5">Resumo financeiro e métricas</p>
        </div>
        
        {/* BOTÕES ESCONDIDOS NO MOBILE (Aparecem só no Desktop) */}
        <div className="hidden md:flex gap-2 w-auto mt-2 md:mt-0">
          <Button onClick={() => handleOpenModal('entrada')} className="h-8 bg-emerald-600 hover:bg-emerald-700 text-white px-4 font-semibold text-[9px] uppercase tracking-widest flex items-center justify-center gap-1.5 shadow-sm rounded-md transition-all">
            <ArrowUpCircle size={14} /> Entrada
          </Button>
          <Button onClick={() => handleOpenModal('saida')} className="h-8 bg-rose-600 hover:bg-rose-700 text-white px-4 font-semibold text-[9px] uppercase tracking-widest flex items-center justify-center gap-1.5 shadow-sm rounded-md transition-all">
            <ArrowDownCircle size={14} /> Saída
          </Button>
        </div>
      </div>

      {/* NOTIFICAÇÕES DE CONTAS */}
      {alertasDespesas.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {alertasDespesas.map(alerta => {
            const isAtrasada = alerta.diffDias < 0;
            const msg = isAtrasada ? `Atrasada ${Math.abs(alerta.diffDias)}d` : alerta.diffDias === 0 ? 'Vence Hoje' : `Vence em ${alerta.diffDias}d`;

            return (
              <Link key={alerta.id} to="/despesas" className={`flex items-center gap-1.5 px-3 py-1 rounded-full border shadow-inner transition-all hover:scale-105 active:scale-95 ${isAtrasada ? 'bg-rose-50/70 border-rose-200 text-rose-700' : 'bg-amber-50/70 border-amber-200 text-amber-700'}`}>
                <AlertCircle size={12} className={isAtrasada ? "text-rose-500" : "text-amber-500"} />
                <span className="text-[9px] font-semibold uppercase tracking-tight truncate max-w-[150px]">
                  {alerta.descricao}
                </span>
                <span className="text-[8px] font-medium opacity-70 ml-0.5 whitespace-nowrap">
                   • {msg} • {formatCurrency(Number(alerta.valor) - Number(alerta.valor_pago || 0))}
                </span>
              </Link>
            )
          })}
        </div>
      )}

      {/* CAMADA 1: CARTÕES PRINCIPAIS COLORIDOS COMPACTOS */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
         <div className="bg-emerald-600 rounded-xl p-3 md:p-4 border border-emerald-700 shadow-md flex flex-col justify-between group overflow-hidden relative min-h-[90px]">
           <div className="absolute -top-2 -right-2 p-2 opacity-10 group-hover:scale-110 transition-transform"><CheckCircle size={70}/></div>
           <div className="flex items-center justify-between mb-1.5 relative z-10">
             <span className="text-[9px] font-semibold uppercase tracking-widest text-emerald-100/90">Dinheiro Real</span>
             <TrendingUp size={14} className="text-emerald-100" />
           </div>
           <div className="relative z-10">
             <p className="text-[8px] font-medium text-emerald-100/80 uppercase tracking-widest mb-0.5">Faturamento Real Entrado</p>
             <h3 className="text-xl md:text-2xl font-semibold text-white tracking-tight">{formatCurrency(faturamentoRealEntrado)}</h3>
           </div>
         </div>

         <div className="bg-rose-600 rounded-xl p-3 md:p-4 border border-rose-700 shadow-md flex flex-col justify-between group overflow-hidden relative min-h-[90px]">
           <div className="absolute -top-2 -right-2 p-2 opacity-10 group-hover:scale-110 transition-transform"><ShoppingCart size={70}/></div>
           <div className="flex items-center justify-between mb-1.5 relative z-10">
             <span className="text-[9px] font-semibold uppercase tracking-widest text-rose-100/90">Contas Pagas</span>
             <ArrowDownRight size={14} className="text-rose-100" />
           </div>
           <div className="relative z-10">
             <p className="text-[8px] font-medium text-rose-100/80 uppercase tracking-widest mb-0.5">Total das Despesas Pagas</p>
             <h3 className="text-xl md:text-2xl font-semibold text-white tracking-tight">{formatCurrency(data.despesas.pagas)}</h3>
           </div>
         </div>

         <Link to="/pedidos" className="bg-blue-600 rounded-xl p-3 md:p-4 border border-blue-700 shadow-md hover:shadow-lg transition-all flex flex-col justify-between group overflow-hidden relative cursor-pointer min-h-[90px]">
           <div className="absolute -top-2 -right-2 p-2 opacity-10 group-hover:scale-110 transition-transform"><Palette size={70}/></div>
           <div className="flex items-center justify-between mb-1.5 relative z-10">
             <span className="text-[9px] font-semibold uppercase tracking-widest text-blue-100/90">Pedidos Pendentes</span>
             <Users size={14} className="text-blue-100" />
           </div>
           <div className="relative z-10">
             <p className="text-[8px] font-medium text-blue-100/80 uppercase tracking-widest mb-0.5">A Receber (Trabalhos)</p>
             <h3 className="text-xl md:text-2xl font-semibold text-white tracking-tight">{formatCurrency(pedidosPendentesValor)}</h3>
           </div>
         </Link>
      </div>

      {/* CAMADA 2: ANÁLISE DE FLUXO DE CAIXA E PROJEÇÕES COMPACTAS */}
      <div className="bg-slate-900 rounded-xl p-4 md:p-5 shadow-lg relative overflow-hidden flex flex-col border border-slate-800">
        <div className="absolute top-0 right-0 p-4 opacity-[0.02]"><Target size={120} /></div>
        
        <div className="relative z-10 mb-4 flex items-center gap-2 border-b border-slate-800 pb-3">
           <div className="w-6 h-6 rounded-full bg-indigo-500/90 text-white flex items-center justify-center shadow-sm"><Sparkles size={12} /></div>
           <div>
              <h2 className="text-xs md:text-sm font-semibold text-white uppercase tracking-tight">Fluxo de Caixa</h2>
              <p className="text-[8px] font-medium uppercase tracking-widest text-slate-400">Consultor automático</p>
           </div>
        </div>

        <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
           
           {/* Saldo e Ajuste de Banco */}
           <div className={`p-4 rounded-xl border shadow-sm flex flex-col justify-between relative overflow-hidden transition-all ${caixaRealLimpo >= 0 ? 'bg-emerald-950/20 border-emerald-800/40' : 'bg-rose-950/20 border-rose-800/40'}`}>
              <div>
                 <h3 className="text-[9px] font-semibold uppercase tracking-widest text-slate-400 mb-1">Caixa Livre (Sistema)</h3>
                 <p className={`text-2xl md:text-3xl font-semibold tracking-tight ${caixaRealLimpo >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                   {formatCurrency(caixaRealLimpo)}
                 </p>
                 
                 <div className="mt-4 pt-4 border-t border-slate-800/50 space-y-2.5">
                   <div className="flex items-center justify-between gap-2">
                     <label className="text-[9px] font-semibold uppercase tracking-widest text-slate-500 flex items-center gap-1 whitespace-nowrap"><Target size={10}/> Banco Real</label>
                     <div className="relative flex-1 max-w-[140px]">
                       <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500 font-semibold text-[10px]">R$</span>
                       <input 
                         type="number" 
                         placeholder="0.00" 
                         value={saldoBancario} 
                         onChange={handleSaldoChange}
                         className="w-full h-8 pl-8 pr-2 text-xs font-semibold text-white bg-slate-900 border border-slate-700 rounded-md outline-none focus:border-indigo-500 transition-all shadow-inner placeholder:text-slate-600 [&::-webkit-inner-spin-button]:appearance-none"
                       />
                     </div>
                   </div>

                   {saldoBancario !== '' && diferencaBanco !== 0 && (
                      <div className="mt-2 flex items-center justify-between text-[9px] font-semibold uppercase tracking-widest bg-black/10 p-1.5 rounded-md border border-slate-700/50">
                         <span className="text-slate-500">Diferença:</span>
                         <div className="flex items-center gap-2">
                           <span className={`text-[10px] font-semibold ${diferencaBanco >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                             {diferencaBanco >= 0 ? '+' : ''}{formatCurrency(diferencaBanco)}
                           </span>
                           <button 
                             onClick={handleRegistrarAjuste} 
                             disabled={isAdjusting}
                             className={`px-2 py-1 text-[8px] font-semibold uppercase tracking-widest text-white rounded transition-colors shadow-sm cursor-pointer disabled:opacity-50 ${
                               isAdjusting ? 'bg-slate-700' : 'bg-indigo-600 hover:bg-indigo-500 active:scale-95'
                             }`}
                            >
                             {isAdjusting ? <Loader2 size={10} className="animate-spin" /> : "(ajuste)"}
                           </button>
                         </div>
                      </div>
                   )}
                 </div>
              </div>
           </div>

           {/* Reserva e Ação */}
           <div className="flex flex-col gap-3">
             <div className="bg-slate-800/40 p-4 rounded-xl border border-slate-700/50 flex flex-col justify-center">
                <div className="flex items-center justify-between mb-0.5">
                  <h3 className="text-[9px] font-semibold uppercase tracking-widest text-amber-500/80 flex items-center gap-1.5"><Printer size={12}/> Fundo Reserva</h3>
                </div>
                <p className="text-lg font-semibold text-amber-400/90">{formatCurrency(depreciacaoTotal)}</p>
             </div>

             <div className="bg-slate-800/40 p-4 rounded-xl border border-slate-700/50 flex-1">
               <h3 className="text-[9px] font-semibold uppercase tracking-widest text-slate-400 mb-2.5 flex items-center gap-1.5"><ShieldCheck size={12} className="text-blue-400"/> Projeção do Mês</h3>
               <div className="flex flex-col gap-1.5">
                 <div className="flex justify-between items-center text-[10px]">
                   <span className="text-emerald-400/90 font-medium uppercase text-[9px] tracking-widest">+ A Receber:</span>
                   <span className="font-medium text-slate-300">{formatCurrency(faturamentoPendenteTotal)}</span>
                 </div>
                 <div className="flex justify-between items-center text-[10px]">
                   <span className="text-rose-400/90 font-medium uppercase text-[9px] tracking-widest">- Contas:</span>
                   <span className="font-medium text-slate-300">{formatCurrency(contasAPagar)}</span>
                 </div>
               </div>
             </div>
           </div>

           {/* Dica de Ação Compacta */}
           <div className={`md:col-span-2 text-[9px] md:text-[10px] font-medium leading-relaxed p-3 rounded-lg bg-slate-950/40 border border-slate-800/60 shadow-inner ${corDica}`}>
             <span className="font-semibold uppercase tracking-widest opacity-70 block mb-0.5 text-[8px]">💡 Resumo:</span>
             {dicaAcao}
           </div>

        </div>
      </div>

      {/* --- BARRA FIXA MOBILE (Apenas no celular, colada na base da tela: bottom-0) --- */}
      <div className="md:hidden fixed bottom-0 inset-x-0 bg-white p-4 pb-6 border-t border-slate-200 shadow-[0_-15px_30px_-5px_rgba(0,0,0,0.1)] z-[40]">
         <div className="flex gap-3 max-w-md mx-auto">
           <Button onClick={() => handleOpenModal('entrada')} className="flex-1 h-11 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 shadow-sm rounded-lg transition-all">
             <ArrowUpCircle size={16} /> Entrada
           </Button>
           <Button onClick={() => handleOpenModal('saida')} className="flex-1 h-11 bg-rose-600 hover:bg-rose-700 text-white font-semibold text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 shadow-sm rounded-lg transition-all">
             <ArrowDownCircle size={16} /> Saída
           </Button>
         </div>
      </div>

      {/* MODAL GLOBAL DE LANÇAMENTO (Componente Reutilizável) */}
      <LancamentoModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        tipoInicial={modalTipo} 
      />

    </div>
  );
}