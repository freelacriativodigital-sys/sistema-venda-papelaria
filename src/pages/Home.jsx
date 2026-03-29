import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useQuery, useQueryClient } from "@tanstack/react-query"; 
import { 
  ArrowUpRight, ArrowDownRight, Activity, Loader2,
  Palette, AlertCircle, Sparkles, ShieldCheck, 
  Printer, Target
} from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Home() {
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(true);
  const [alertasDespesas, setAlertasDespesas] = useState([]);
  const [depreciacaoTotal, setDepreciacaoTotal] = useState(0);

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

  if (loading || isLoadingTasks) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
        <p className="text-[10px] font-medium text-slate-400 uppercase tracking-widest">Carregando...</p>
      </div>
    );
  }

  // --- CÁLCULOS FINANCEIROS ---
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
  let pedidosGanhos = 0;
  let pedidosPendentesValor = 0;

  uniqueTasks.forEach(task => {
    const val = getTaskValue(task);
    const isPaid = String(task.payment_status || '').toLowerCase().trim() === 'pago' || String(task.status || '').toLowerCase().trim() === 'concluida';
    const valorAdiantado = Number(task.valor_pago || 0);

    if (isPaid) {
      pedidosGanhos += val;
    } else if (String(task.payment_status || '').toLowerCase().trim() === 'parcial' || valorAdiantado > 0) {
      pedidosGanhos += valorAdiantado;
      pedidosPendentesValor += (val - valorAdiantado);
    } else {
      pedidosPendentesValor += val;
    }
  });

  const faturamentoRealEntrado = data.clientes.pago + pedidosGanhos;
  const caixaRealLimpo = faturamentoRealEntrado - data.despesas.pagas;
  const faturamentoPendenteTotal = data.clientes.pendente + pedidosPendentesValor;
  const contasAPagar = data.despesas.pendentes;

  const diferencaBanco = saldoBancario !== '' ? Number(saldoBancario) - caixaRealLimpo : 0;

  // Lógica de Ajuste Dinâmica (Se sobrar cria Receita, se faltar cria Despesa)
  const handleRegistrarDiferenca = async () => {
    if (diferencaBanco === 0) return; 
    const valorAjuste = Math.abs(diferencaBanco);
    const tipoAjuste = diferencaBanco > 0 ? 'entrada' : 'saida';
    const tituloAjuste = diferencaBanco > 0 ? 'Ajuste Positivo de Caixa' : 'Ajuste Negativo de Caixa';

    if (window.confirm(`Deseja lançar um ajuste de ${formatCurrency(valorAjuste)} para igualar o sistema ao banco?`)) {
      try {
        const payload = {
          tipo: tipoAjuste,
          descricao: tituloAjuste,
          valor: valorAjuste,
          valor_pago: valorAjuste,
          vencimento: new Date().toISOString().split('T')[0],
          categoria: 'Outros',
          status: 'pago'
        };
        const { error } = await supabase.from('despesas').insert([payload]);
        if (error) throw error;
        alert("Ajuste registrado com sucesso!");
        window.location.reload(); 
      } catch (error) {
        alert("Erro ao registrar ajuste: " + error.message);
      }
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-in fade-in duration-500 pb-20">
      
      {/* HEADER DA PÁGINA (Clean e Compacto) */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-3 mb-6">
        <div>
          <h1 className="text-xl md:text-2xl font-medium text-slate-800 uppercase tracking-tight flex items-center gap-2">
            <Activity className="text-blue-500" size={24} strokeWidth={2} /> Visão Geral
          </h1>
          <p className="text-[10px] font-medium text-slate-400 uppercase tracking-widest mt-0.5">Resumo financeiro e métricas</p>
        </div>
        <div className="bg-white px-3 py-1.5 rounded-full border border-slate-200 shadow-sm flex items-center gap-2 h-fit">
           <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
           <span className="text-[9px] font-medium text-slate-500 uppercase tracking-widest">Sistema Online</span>
        </div>
      </div>

      {/* NOTIFICAÇÕES DE CONTAS (Compactas e Limitadas) */}
      {alertasDespesas.length > 0 && (
        <div className="flex flex-col gap-2 max-w-3xl mb-6">
          {alertasDespesas.map(alerta => {
            const isAtrasada = alerta.diffDias < 0;
            const isHoje = alerta.diffDias === 0;
            const valorRestante = Number(alerta.valor) - Number(alerta.valor_pago || 0);
            
            let borderColor = 'border-amber-200/50';
            let textColor = 'text-amber-700';
            let iconColor = 'text-amber-400';
            let badgeBg = 'bg-amber-50 text-amber-600';
            let msg = `Vence em ${alerta.diffDias} d`;

            if (isAtrasada) {
              borderColor = 'border-rose-200/60'; textColor = 'text-rose-700'; iconColor = 'text-rose-500'; badgeBg = 'bg-rose-50 text-rose-600';
              msg = `Atrasada ${Math.abs(alerta.diffDias)} d`;
            } else if (isHoje) {
               msg = 'Vence HOJE';
            }

            return (
              <div key={alerta.id} className={`flex items-center justify-between p-2.5 bg-white rounded-lg border ${borderColor} shadow-[0_1px_2px_rgba(0,0,0,0.02)] animate-in slide-in-from-top-1`}>
                <div className="flex items-center gap-2.5 overflow-hidden">
                   <div className={`shrink-0 ${iconColor}`}><AlertCircle size={14} strokeWidth={2.5}/></div>
                   <div className="flex items-center gap-2 truncate">
                     <p className={`text-[11px] font-medium uppercase truncate ${textColor}`}>{alerta.descricao}</p>
                     <span className={`text-[8px] font-medium uppercase tracking-widest px-1.5 py-0.5 rounded ${badgeBg} hidden sm:inline-block`}>{msg}</span>
                   </div>
                </div>
                <div className="flex items-center gap-4 shrink-0 pl-2">
                   <span className={`text-[8px] font-medium uppercase tracking-widest px-1.5 py-0.5 rounded ${badgeBg} sm:hidden`}>{msg}</span>
                   <span className="text-[11px] md:text-xs font-semibold text-slate-800">{formatCurrency(valorRestante)}</span>
                   <Link to="/despesas" className="bg-white border border-slate-200 text-slate-500 hover:text-slate-700 hover:bg-slate-50 text-[9px] font-medium uppercase px-3 py-1 rounded shadow-sm transition-colors">
                     Pagar
                   </Link>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* CAMADA 1: CARTÕES PRINCIPAIS (KPIs) LADO A LADO */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
         <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-[0_2px_10px_-3px_rgba(0,0,0,0.05)] flex flex-col justify-between">
           <div className="flex items-center justify-between mb-3">
             <div className="bg-emerald-50 w-7 h-7 rounded-md text-emerald-500 flex items-center justify-center"><ArrowUpRight size={16} /></div>
             <span className="text-[9px] font-medium uppercase tracking-widest text-slate-400">Dinheiro Real</span>
           </div>
           <div>
             <p className="text-[9px] font-medium text-emerald-500 uppercase tracking-widest mb-0.5">Total que Entrou</p>
             <h3 className="text-xl md:text-2xl font-semibold text-slate-800 tracking-tight">{formatCurrency(faturamentoRealEntrado)}</h3>
           </div>
         </div>

         <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-[0_2px_10px_-3px_rgba(0,0,0,0.05)] flex flex-col justify-between">
           <div className="flex items-center justify-between mb-3">
             <div className="bg-rose-50 w-7 h-7 rounded-md text-rose-500 flex items-center justify-center"><ArrowDownRight size={16} /></div>
             <span className="text-[9px] font-medium uppercase tracking-widest text-slate-400">Contas Pagas</span>
           </div>
           <div>
             <p className="text-[9px] font-medium text-rose-400 uppercase tracking-widest mb-0.5">Total que Saiu</p>
             <h3 className="text-xl md:text-2xl font-semibold text-slate-800 tracking-tight">{formatCurrency(data.despesas.pagas)}</h3>
           </div>
         </div>

         <Link to="/pedidos" className="bg-white rounded-xl p-4 border border-slate-200 shadow-[0_2px_10px_-3px_rgba(0,0,0,0.05)] hover:border-blue-200 transition-all flex flex-col justify-between group cursor-pointer">
           <div className="flex items-center justify-between mb-3">
             <div className="bg-blue-50 w-7 h-7 rounded-md text-blue-500 flex items-center justify-center group-hover:scale-105 transition-transform"><Palette size={14} /></div>
             <span className="text-[9px] font-medium uppercase tracking-widest text-slate-400">P. Pendentes</span>
           </div>
           <div>
             <p className="text-[9px] font-medium text-blue-500 uppercase tracking-widest mb-0.5">A Receber (Trabalhos)</p>
             <h3 className="text-xl md:text-2xl font-semibold text-slate-800 tracking-tight">{formatCurrency(pedidosPendentesValor)}</h3>
           </div>
         </Link>
      </div>

      {/* CAMADA 2: CAIXA LIVRE E PROJEÇÕES */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
        
        {/* CAIXA LIVRE (Dark Mode Exato) */}
        <div className="bg-[#0f172a] rounded-xl p-5 shadow-lg border border-slate-800 flex flex-col h-full relative overflow-hidden">
           <div className="absolute top-0 right-0 p-4 opacity-5"><Target size={120} /></div>
           <div className="relative z-10">
              <h3 className="text-[9px] font-medium uppercase tracking-widest text-slate-400 mb-1">Caixa Livre (Sistema)</h3>
              <p className={`text-2xl md:text-3xl font-semibold tracking-tight mb-4 ${caixaRealLimpo >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                 {formatCurrency(caixaRealLimpo)}
              </p>
              
              <div className="pt-4 border-t border-slate-800/80">
                 <label className="text-[8px] font-medium uppercase tracking-widest text-slate-500 mb-1.5 block">Igualar ao Saldo do Banco Real</label>
                 <div className="relative mb-3">
                   <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500 font-medium text-[10px]">R$</span>
                   <input 
                     type="number" placeholder="0.00" value={saldoBancario} onChange={handleSaldoChange}
                     className="w-full h-9 pl-8 pr-3 text-xs font-medium text-white bg-[#1e293b] border border-slate-700 rounded-lg outline-none focus:border-indigo-500 transition-all placeholder:text-slate-600"
                   />
                 </div>
                 
                 {saldoBancario !== '' && (
                    <div className="flex items-center justify-between">
                       <span className="text-[9px] font-medium uppercase tracking-widest text-slate-500">Diferença:</span>
                       <div className="flex items-center gap-2">
                         <span className={`text-[10px] font-semibold ${diferencaBanco >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                           {diferencaBanco > 0 ? '+' : ''}{formatCurrency(diferencaBanco)}
                         </span>
                         {diferencaBanco !== 0 && (
                           <button onClick={handleRegistrarDiferenca} className="bg-slate-700 hover:bg-slate-600 text-white px-2 py-1 rounded text-[8px] uppercase tracking-widest font-semibold transition-colors active:scale-95">
                             Ajustar
                           </button>
                         )}
                       </div>
                    </div>
                 )}
              </div>
           </div>
        </div>

        {/* RESERVA E PROJEÇÃO */}
        <div className="flex flex-col gap-4 h-full">
           <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-center">
              <h3 className="text-[9px] font-medium uppercase tracking-widest text-slate-400 mb-1.5 flex items-center gap-1.5">
                 <Printer size={12} className="text-amber-500"/> Fundo de Reserva
              </h3>
              <p className="text-lg md:text-xl font-semibold text-amber-500">{formatCurrency(depreciacaoTotal)}</p>
           </div>

           <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex-1 flex flex-col justify-center">
              <h3 className="text-[9px] font-medium uppercase tracking-widest text-slate-400 mb-3 flex items-center gap-1.5">
                 <ShieldCheck size={14} className="text-blue-500"/> Projeção do Mês
              </h3>
              <div className="flex flex-col gap-2">
                 <div className="flex justify-between items-center text-xs">
                   <span className="text-slate-500 font-medium text-[10px] uppercase tracking-widest">A Receber:</span>
                   <span className="font-semibold text-emerald-500">{formatCurrency(pedidosPendentesValor)}</span>
                 </div>
                 <div className="flex justify-between items-center text-xs">
                   <span className="text-slate-500 font-medium text-[10px] uppercase tracking-widest">Contas a Pagar:</span>
                   <span className="font-semibold text-rose-500">{formatCurrency(contasAPagar)}</span>
                 </div>
              </div>
           </div>
        </div>

      </div>

    </div>
  );
}