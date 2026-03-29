import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"; 
import { 
  Users, Wallet, ArrowUpRight, ArrowDownRight, Activity, Loader2,
  Printer, Target, Sparkles, AlertCircle, ShoppingCart, CheckCircle, TrendingUp
} from 'lucide-react';
import { Link } from 'react-router-dom';

// Importa a inteligência do arquivo homeUtils
import { processFinancialData, formatCurrency, createCashAdjustment } from '../components/Home/homeUtils';

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
    orcamentos: { total: 0, count: 0 },
    clientes: { pago: 0, pendente: 0, count: 0 },
    despesas: { pagas: 0, pendentes: 0, count: 0 }
  });

  // Query para buscar pedidos (usada para calcular finanças e invalidar na mutação)
  const { data: tasks = [], isLoading: isLoadingTasks } = useQuery({
    queryKey: ["art-tasks"],
    queryFn: async () => {
      const { data, error } = await supabase.from("pedidos").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  // --- MUTAÇÃO DO TANSTACK QUERY PARA AJUSTE DE CAIXA ---
  const adjustmentMutation = useMutation({
    mutationFn: createCashAdjustment, // Usa a lógica definida no homeUtils
    onSuccess: () => {
      // Recarrega os pedidos instantaneamente para atualizar os números na tela
      queryClient.invalidateQueries(["art-tasks"]);
      alert("Ajuste de caixa registrado com sucesso em Pedidos!");
    },
    onError: (error) => {
      alert("Erro ao registrar ajuste: " + error.message);
    }
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

    if (!isLoadingTasks) {
      fetchDashboardData();
    }
  }, [isLoadingTasks, tasks]);


  if (loading || isLoadingTasks) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest">Carregando Dashboard...</p>
      </div>
    );
  }

  // --- CÁLCULOS FINANCEIROS ATUALIZADOS PELO CÉREBRO ---
  const { pedidosGanhosReal, pedidosPendentesValor } = processFinancialData(tasks);

  const faturamentoRealEntrado = data.clientes.pago + pedidosGanhosReal;
  const caixaRealLimpo = faturamentoRealEntrado - data.despesas.pagas;
  const faturamentoPendenteTotal = data.clientes.pendente + pedidosPendentesValor;
  const contasAPagar = data.despesas.pendentes;

  // Cálculo da diferença do banco (usado na mutação)
  const diferencaBanco = Number(saldoBancario || 0) - caixaRealLimpo;

  // Lógica do botão (Ajuste de Caixa)
  const handleRegistrarAjuste = () => {
    if (diferencaBanco === 0) return;
    
    const absDiff = Math.abs(diferencaBanco);
    const msg = diferencaBanco > 0 
      ? `Deseja registrar uma ENTRADA de ${formatCurrency(absDiff)} em Pedidos para igualar ao banco?`
      : `Deseja registrar uma SAÍDA (Valor Negativo) de ${formatCurrency(absDiff)} em Pedidos para igualar ao banco?`;

    if (window.confirm(msg)) {
      // Dispara a mutação do Tanstack Query
      adjustmentMutation.mutate({ difference: diferencaBanco, saldoBancario, caixaRealLimpo });
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-in fade-in duration-500 pb-20 pt-4 md:pt-6 px-4 md:px-0">
      
      {/* HEADER DA PÁGINA */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-3 mb-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold md:font-semibold uppercase text-slate-800 tracking-tight flex items-center gap-2.5">
            <Activity className="text-blue-600" size={24} /> Visão Geral
          </h1>
          <p className="text-[10px] font-medium text-slate-500 uppercase tracking-widest mt-1">Resumo financeiro e métricas</p>
        </div>
        <div className="bg-white px-3 py-1.5 rounded-full border border-slate-200 shadow-sm flex items-center gap-2">
           <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
           <span className="text-[9px] font-medium text-slate-500 uppercase tracking-widest">Sistema Online</span>
        </div>
      </div>

      {/* NOTIFICAÇÕES DE CONTAS (Estilo Tag compacta "Atacado" - Ref. imagem 3) */}
      {alertasDespesas.length > 0 && (
        <div className="flex flex-wrap gap-2.5 mb-6">
          {alertasDespesas.map(alerta => {
            const isAtrasada = alerta.diffDias < 0;
            const msg = isAtrasada 
              ? `Atrasada ${Math.abs(alerta.diffDias)} d` 
              : alerta.diffDias === 0 
                ? 'Vence Hoje' 
                : `Vence em ${alerta.diffDias} d`;

            return (
              <Link 
                key={alerta.id} 
                to="/despesas" 
                // Estilo Tag compacta e totalmente arredondada
                className={`tag-notificacao flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border shadow-inner transition-all hover:scale-105 active:scale-95 ${
                  isAtrasada 
                    ? 'bg-rose-50/70 border-rose-200 text-rose-700' 
                    : 'bg-amber-50/70 border-amber-200 text-amber-700'
                }`}
              >
                <AlertCircle size={14} className={isAtrasada ? "text-rose-500" : "text-amber-500"} />
                <span className="text-[11px] font-bold uppercase tracking-tight truncate max-w-[200px] md:max-w-[250px]">
                  {alerta.descricao}
                </span>
                <span className="text-[9px] font-semibold opacity-70 ml-0.5 whitespace-nowrap">
                   • {msg} • {formatCurrency(Number(alerta.valor) - Number(alerta.valor_pago || 0))}
                </span>
              </Link>
            )
          })}
        </div>
      )}

      {/* CAMADA 1: CARTÕES PRINCIPAIS (KPIs COLORIDOS LADO A LADO - Ref. imagem 4) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4 mb-6">
         {/* Cartão 1: Total Entrou - VERDE */}
         <div className="bg-emerald-600 rounded-2xl p-4 md:p-5 border border-emerald-700 shadow-xl flex flex-col justify-between group overflow-hidden relative">
           <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:scale-110 transition-transform"><CheckCircle size={100}/></div>
           <div className="flex items-center justify-between mb-3 relative z-10">
             <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-100/90">Dinheiro Real</span>
             <TrendingUp size={16} className="text-emerald-100" />
           </div>
           <div className="relative z-10">
             <p className="text-[10px] font-black text-emerald-100/80 uppercase tracking-widest mb-1.5">Faturamento Real Entrado</p>
             <h3 className="text-2xl md:text-3xl font-black text-white tracking-tight">{formatCurrency(faturamentoRealEntrado)}</h3>
           </div>
         </div>

         {/* Cartão 2: Total Saiu - VERMELHO */}
         <div className="bg-rose-600 rounded-2xl p-4 md:p-5 border border-rose-700 shadow-xl flex flex-col justify-between group overflow-hidden relative">
           <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:scale-110 transition-transform"><ShoppingCart size={100}/></div>
           <div className="flex items-center justify-between mb-3 relative z-10">
             <span className="text-[10px] font-bold uppercase tracking-widest text-rose-100/90">Contas Pagas</span>
             <ArrowDownRight size={16} className="text-rose-100" />
           </div>
           <div className="relative z-10">
             <p className="text-[10px] font-black text-rose-100/80 uppercase tracking-widest mb-1.5">Total das Despesas Pagas</p>
             <h3 className="text-2xl md:text-3xl font-black text-white tracking-tight">{formatCurrency(data.despesas.pagas)}</h3>
           </div>
         </div>

         {/* Cartão 3: A Receber (Pedidos) - AZUL */}
         <Link to="/pedidos" className="bg-blue-600 rounded-2xl p-4 md:p-5 border border-blue-700 shadow-xl hover:shadow-2xl transition-all flex flex-col justify-between group overflow-hidden relative cursor-pointer">
           <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:scale-110 transition-transform"><Palette size={100}/></div>
           <div className="flex items-center justify-between mb-3 relative z-10">
             <span className="text-[10px] font-bold uppercase tracking-widest text-blue-100/90">Pedidos Pendentes</span>
             <Users size={16} className="text-blue-100" />
           </div>
           <div className="relative z-10">
             <p className="text-[10px] font-black text-blue-100/80 uppercase tracking-widest mb-1.5">A Receber (Trabalhos)</p>
             <h3 className="text-2xl md:text-3xl font-black text-white tracking-tight">{formatCurrency(pedidosPendentesValor)}</h3>
           </div>
         </Link>
      </div>

      {/* CAMADA 2: ANÁLISE DE FLUXO DE CAIXA E PROJEÇÕES (Dark Mode) */}
      <div className="bg-slate-900 rounded-2xl p-6 md:p-8 shadow-lg relative overflow-hidden flex flex-col border border-slate-800">
        <div className="absolute top-0 right-0 p-8 opacity-[0.02]"><Target size={180} /></div>
        
        <div className="relative z-10 mb-6 flex items-center gap-3 border-b border-slate-800 pb-4">
           <div className="w-8 h-8 rounded-full bg-indigo-500/90 text-white flex items-center justify-center shadow-sm"><Sparkles size={16} /></div>
           <div>
              <h2 className="text-sm md:text-base font-black text-white uppercase tracking-tight">Fluxo de Caixa</h2>
              <p className="text-[9px] font-medium uppercase tracking-widest text-slate-400">Consultor financeiro automático</p>
           </div>
        </div>

        <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
           
           {/* Saldo e Ajuste de Banco */}
           <div className={`p-5 md:p-6 rounded-xl border shadow-sm flex flex-col justify-between relative overflow-hidden transition-all ${caixaRealLimpo >= 0 ? 'bg-emerald-950/20 border-emerald-800/40' : 'bg-rose-950/20 border-rose-800/40'}`}>
              <div>
                 <h3 className="text-[11px] font-black uppercase tracking-widest text-slate-400 mb-1.5">Caixa Livre (Sistema)</h3>
                 <p className={`text-3xl md:text-4xl font-black tracking-tight ${caixaRealLimpo >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                   {formatCurrency(caixaRealLimpo)}
                 </p>
                 
                 <div className="mt-6 pt-5 border-t border-slate-800/50 space-y-3">
                   <div className="flex items-center justify-between gap-3">
                     <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 flex items-center gap-1.5 whitespace-nowrap"><Target size={12}/> Banco Real</label>
                     <div className="relative flex-1">
                       <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 font-bold text-[11px]">R$</span>
                       <input 
                         type="number" 
                         placeholder="0.00" 
                         value={saldoBancario} 
                         onChange={handleSaldoChange}
                         className="w-full h-9 pl-9 pr-3 text-sm font-bold text-white bg-slate-900 border border-slate-700 rounded-lg outline-none focus:border-indigo-500 transition-all shadow-inner placeholder:text-slate-600"
                       />
                     </div>
                   </div>

                   {saldoBancario !== '' && diferencaBanco !== 0 && (
                      <div className="mt-3 flex items-center justify-between text-[11px] font-black uppercase tracking-widest bg-black/10 p-2 rounded-lg border border-slate-700">
                         <span className="text-slate-500">Diferença:</span>
                         <div className="flex items-center gap-3">
                           <span className={`text-[11px] font-black ${diferencaBanco >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                             {diferencaBanco >= 0 ? '+' : ''}{formatCurrency(diferencaBanco)}
                           </span>
                           {/* NOVO BOTÃO INTEGRADO AO TANSTACK QUERY (Ajuste de Caixa) */}
                           <button 
                             onClick={handleRegistrarAjuste} 
                             disabled={adjustmentMutation.isPending}
                             className={`px-3 py-1 text-[8px] font-black uppercase tracking-widest text-white rounded transition-colors shadow-sm cursor-pointer disabled:opacity-50 ${
                               adjustmentMutation.isPending ? 'bg-slate-700' : 'bg-indigo-600 hover:bg-indigo-500 active:scale-95'
                             }`}
                            >
                             {adjustmentMutation.isPending ? <Loader2 size={10} className="animate-spin" /> : "(ajuste de caixa)"}
                           </button>
                         </div>
                      </div>
                   )}
                 </div>
              </div>
           </div>

           {/* Reserva e Ação */}
           <div className="flex flex-col gap-4">
             <div className="bg-slate-800/40 p-5 rounded-xl border border-slate-700/50 flex flex-col justify-center">
                <div className="flex items-center justify-between mb-1">
                  <h3 className="text-[11px] font-black uppercase tracking-widest text-amber-500/80 flex items-center gap-1.5"><Printer size={14}/> Fundo Reserva</h3>
                </div>
                <p className="text-2xl font-black text-amber-400/90">{formatCurrency(depreciacaoTotal)}</p>
             </div>

             <div className="bg-slate-800/40 p-5 rounded-xl border border-slate-700/50 flex-1">
               <h3 className="text-[11px] font-black uppercase tracking-widest text-slate-400 mb-3.5 flex items-center gap-1.5"><ShieldCheck size={14} className="text-blue-400"/> Projeção Mês</h3>
               <div className="flex flex-col gap-2.5">
                 <div className="flex justify-between items-center text-xs">
                   <span className="text-emerald-400/90 font-black uppercase text-[10px] tracking-widest">+ A Receber:</span>
                   <span className="font-semibold text-slate-300">{formatCurrency(faturamentoPendenteTotal)}</span>
                 </div>
                 <div className="flex justify-between items-center text-xs">
                   <span className="text-rose-400/90 font-black uppercase text-[10px] tracking-widest">- Contas:</span>
                   <span className="font-semibold text-slate-300">{formatCurrency(contasAPagar)}</span>
                 </div>
               </div>
             </div>
           </div>

           {/* Dica de Ação */}
           <div className={`md:col-span-2 text-xs font-medium leading-relaxed p-4 rounded-xl bg-slate-950/40 border border-slate-800/60 shadow-inner ${corDica}`}>
             <span className="font-black uppercase tracking-widest opacity-70 block mb-1 text-[10px]">💡 Dica do Sistema:</span>
             {dicaAcao}
           </div>

        </div>
      </div>

    </div>
  );
}