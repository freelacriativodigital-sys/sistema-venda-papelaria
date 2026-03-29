import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"; 
import { 
  TrendingUp, Users, ShoppingBag, FileText, Wallet, 
  ArrowUpRight, ArrowDownRight, Activity, Loader2,
  Globe, Eye, Link as LinkIcon, Palette, Trophy, Medal,
  AlertCircle, Clock, Sparkles, ShieldCheck, 
  Printer, Target, ShoppingCart, Plus, CheckSquare, Square, Trash2, Edit3, X, Save
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';

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

  // --- ESTADOS DA LISTA DE COMPRAS ---
  const [novoItemCompra, setNovoItemCompra] = useState('');
  const [prioridadeCompra, setPrioridadeCompra] = useState('normal');
  const [valorCompra, setValorCompra] = useState('');
  const [editingCompra, setEditingCompra] = useState(null);
  
  // --- ESTADO DO CARRINHO FLUTUANTE (GAVETA) ---
  const [isCartOpen, setIsCartOpen] = useState(false);

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

  // --- QUERY E MUTAÇÕES DA LISTA DE COMPRAS ---
  const { data: listaCompras = [] } = useQuery({
    queryKey: ["lista_compras"],
    queryFn: async () => {
      const { data, error } = await supabase.from("lista_compras").select("*").order("concluido", { ascending: true }).order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  const addCompraMutation = useMutation({
    mutationFn: async (novo) => {
      const { error } = await supabase.from("lista_compras").insert([novo]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["lista_compras"]);
      setNovoItemCompra('');
      setValorCompra('');
    }
  });

  const editCompraMutation = useMutation({
    mutationFn: async (dataEdit) => {
      const { error } = await supabase.from("lista_compras").update({
        item: dataEdit.item,
        prioridade: dataEdit.prioridade,
        valor: Number(dataEdit.valor) || 0
      }).eq("id", dataEdit.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["lista_compras"]);
      setEditingCompra(null);
    }
  });

  const toggleCompraMutation = useMutation({
    mutationFn: async ({ id, concluido }) => {
      const { error } = await supabase.from("lista_compras").update({ concluido: !concluido }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries(["lista_compras"])
  });

  const deleteCompraMutation = useMutation({
    mutationFn: async (id) => {
      const { error } = await supabase.from("lista_compras").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries(["lista_compras"])
  });

  const handleAddCompra = () => {
    if (!novoItemCompra.trim()) return;
    addCompraMutation.mutate({ 
      item: novoItemCompra, 
      prioridade: prioridadeCompra, 
      valor: Number(valorCompra) || 0,
      concluido: false 
    });
  };

  const handleSaveEdit = () => {
    if (!editingCompra || !editingCompra.item.trim()) return;
    editCompraMutation.mutate(editingCompra);
  };

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

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0);
  };

  if (loading || isLoadingTasks) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center gap-4">
        <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Carregando Dashboard...</p>
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

  let dicaAcao = "";
  let corDica = "";

  if (contasAPagar > 0) {
    if (faturamentoPendenteTotal >= contasAPagar) {
      const sobra = faturamentoPendenteTotal - contasAPagar;
      dicaAcao = `Você tem ${formatCurrency(faturamentoPendenteTotal)} a receber. Direcione ${formatCurrency(contasAPagar)} para quitar as contas pendentes, e sobrarão ${formatCurrency(sobra)} limpos!`;
      corDica = "text-emerald-100";
    } else if (faturamentoPendenteTotal > 0) {
      const falta = contasAPagar - faturamentoPendenteTotal;
      dicaAcao = `Você tem ${formatCurrency(faturamentoPendenteTotal)} a receber, mas as contas somam ${formatCurrency(contasAPagar)}. Mesmo recebendo tudo, faltarão ${formatCurrency(falta)}. Foco em vendas!`;
      corDica = "text-amber-200";
    } else {
      dicaAcao = `Atenção: Você tem ${formatCurrency(contasAPagar)} em contas para pagar este mês, mas nada a receber. Hora de focar em prospecção!`;
      corDica = "text-rose-200";
    }
  } else {
    if (faturamentoPendenteTotal > 0) {
      dicaAcao = `Excelente! Contas em dia. Os ${formatCurrency(faturamentoPendenteTotal)} a receber entrarão 100% como caixa livre.`;
      corDica = "text-emerald-100";
    } else {
      dicaAcao = `Tudo tranquilo! Sem contas pendentes este mês. Que tal criar uma promoção para aquecer as vendas?`;
      corDica = "text-blue-100";
    }
  }

  const diferencaBanco = Number(saldoBancario || 0) - caixaRealLimpo;

  const handleRegistrarDiferenca = async () => {
    if (diferencaBanco >= 0) return; 
    const valorGasto = Math.abs(diferencaBanco);
    if (window.confirm(`Deseja lançar ${formatCurrency(valorGasto)} como "Gastos não registrados" para igualar o sistema ao banco?`)) {
      try {
        const payload = {
          descricao: 'Gastos não registrados (Ajuste de Caixa)',
          valor: valorGasto,
          valor_pago: valorGasto,
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

  const itensPendentesLista = listaCompras.filter(i => !i.concluido).length;

  return (
    <div className="max-w-6xl mx-auto space-y-6 md:space-y-8 animate-in fade-in duration-500 pb-20">
      
      {/* BOTÃO FLUTUANTE GLOBAL (CARRINHO) */}
      <button 
        onClick={() => setIsCartOpen(true)}
        className="fixed bottom-6 right-6 z-40 w-14 h-14 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg shadow-blue-600/30 flex items-center justify-center transition-transform hover:scale-105 active:scale-95"
      >
        <ShoppingCart size={24} />
        {itensPendentesLista > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-rose-500 text-white text-[10px] font-black rounded-full flex items-center justify-center shadow-sm">
            {itensPendentesLista}
          </span>
        )}
      </button>

      {/* HEADER DA PÁGINA */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-slate-800 uppercase tracking-tighter flex items-center gap-3">
            <Activity className="text-blue-600" size={28} /> Visão Geral
          </h1>
          <p className="text-[10px] md:text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Resumo financeiro do mês e métricas da loja</p>
        </div>
        <div className="bg-white px-4 py-2 rounded-lg border border-slate-200 shadow-sm flex items-center gap-3">
           <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
           <span className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">Sistema Online</span>
        </div>
      </div>

      {/* NOTIFICAÇÕES DE CONTAS (TOPO) */}
      {alertasDespesas.length > 0 && (
        <div className="flex flex-col gap-2">
          {alertasDespesas.map(alerta => {
            const isAtrasada = alerta.diffDias < 0;
            const isHoje = alerta.diffDias === 0;
            const valorRestante = Number(alerta.valor) - Number(alerta.valor_pago || 0);
            
            let bgColor = 'bg-amber-50/50';
            let borderColor = 'border-amber-200';
            let textColor = 'text-amber-800';
            let iconColor = 'text-amber-500';
            let badgeBg = 'bg-amber-100 text-amber-700';
            let msg = `Vence em ${alerta.diffDias} d`;

            if (isAtrasada) {
              bgColor = 'bg-rose-50/50'; borderColor = 'border-rose-200'; textColor = 'text-rose-800'; iconColor = 'text-rose-500'; badgeBg = 'bg-rose-100 text-rose-700';
              msg = `Atrasada ${Math.abs(alerta.diffDias)} d`;
            } else if (isHoje) {
               msg = 'Vence HOJE';
            }

            return (
              <div key={alerta.id} className={`flex items-center justify-between p-2.5 md:p-3 rounded-lg border ${bgColor} ${borderColor} animate-in slide-in-from-top-1 gap-2 shadow-sm`}>
                <div className="flex items-center gap-2.5 overflow-hidden">
                   <div className={`shrink-0 ${iconColor}`}><AlertCircle size={16} /></div>
                   <div className="flex items-center gap-2 truncate">
                     <p className={`text-xs font-bold truncate ${textColor}`}>{alerta.descricao}</p>
                     <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded text-center ${badgeBg} hidden sm:inline-block`}>{msg}</span>
                   </div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                   <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded text-center ${badgeBg} sm:hidden`}>{msg}</span>
                   <span className="text-[10px] md:text-sm font-black text-slate-700">{formatCurrency(valorRestante)}</span>
                   <Link to="/despesas" className="bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 text-[9px] md:text-[10px] font-bold uppercase px-3 py-1.5 rounded shadow-sm flex items-center justify-center transition-colors">Pagar</Link>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* CAMADA 1: CARTÕES PRINCIPAIS (KPIs) LADO A LADO */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
         {/* Cartão 1: Total Entrou */}
         <div className="bg-white rounded-2xl p-5 md:p-6 border border-slate-200 shadow-sm hover:shadow-md hover:border-emerald-300 transition-all flex flex-col justify-between">
           <div className="flex items-center justify-between mb-4">
             <div className="bg-emerald-50 p-2.5 rounded-xl text-emerald-600"><ArrowUpRight size={20} /></div>
             <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Dinheiro Real</span>
           </div>
           <div>
             <p className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest mb-1">Total que Entrou</p>
             <h3 className="text-3xl font-black text-slate-800 tracking-tighter">{formatCurrency(faturamentoRealEntrado)}</h3>
           </div>
         </div>

         {/* Cartão 2: Total Saiu */}
         <div className="bg-white rounded-2xl p-5 md:p-6 border border-slate-200 shadow-sm hover:shadow-md hover:border-rose-300 transition-all flex flex-col justify-between">
           <div className="flex items-center justify-between mb-4">
             <div className="bg-rose-50 p-2.5 rounded-xl text-rose-600"><ArrowDownRight size={20} /></div>
             <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Contas Pagas</span>
           </div>
           <div>
             <p className="text-[10px] font-bold text-rose-500 uppercase tracking-widest mb-1">Total que Saiu</p>
             <h3 className="text-3xl font-black text-slate-800 tracking-tighter">{formatCurrency(data.despesas.pagas)}</h3>
           </div>
         </div>

         {/* Cartão 3: A Receber (Pedidos) */}
         <Link to="/pedidos" className="bg-white rounded-2xl p-5 md:p-6 border border-slate-200 shadow-sm hover:shadow-md hover:border-blue-300 transition-all flex flex-col justify-between group cursor-pointer">
           <div className="flex items-center justify-between mb-4">
             <div className="bg-blue-50 p-2.5 rounded-xl text-blue-600 group-hover:scale-110 transition-transform"><Palette size={20} /></div>
             <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Pagamentos Pendentes</span>
           </div>
           <div>
             <p className="text-[10px] font-bold text-blue-500 uppercase tracking-widest mb-1">A Receber (Trabalhos)</p>
             <h3 className="text-3xl font-black text-slate-800 tracking-tighter">{formatCurrency(pedidosPendentesValor)}</h3>
           </div>
         </Link>
      </div>

      {/* CAMADA 2: OPERACIONAL (2 COLUNAS) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8 items-start">
        
        {/* COLUNA ESQUERDA: ANÁLISE DE FLUXO DE CAIXA (Ocupa 2/3 da tela) */}
        <div className="lg:col-span-2">
          <div className="bg-slate-900 rounded-3xl p-6 shadow-xl relative overflow-hidden flex flex-col h-full border border-slate-800">
            <div className="absolute top-0 right-0 p-6 opacity-[0.03]"><Target size={180} /></div>
            
            <div className="relative z-10 mb-6 flex items-center gap-3 border-b border-slate-800 pb-4">
               <div className="w-10 h-10 rounded-full bg-indigo-500 text-white flex items-center justify-center shadow-lg"><Sparkles size={20} /></div>
               <div>
                  <h2 className="text-lg font-black text-white uppercase tracking-tight">Análise de Fluxo de Caixa</h2>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Seu consultor financeiro automático</p>
               </div>
            </div>

            <div className="relative z-10 grid grid-cols-1 sm:grid-cols-2 gap-4">
               
               {/* Saldo e Ajuste de Banco */}
               <div className={`p-5 rounded-2xl border shadow-sm flex flex-col justify-between relative overflow-hidden ${caixaRealLimpo >= 0 ? 'bg-emerald-950/30 border-emerald-800/50' : 'bg-rose-950/30 border-rose-800/50'}`}>
                  <div className="mb-2">
                     <h3 className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">Caixa Livre (Sistema)</h3>
                     <p className={`text-4xl font-black tracking-tighter ${caixaRealLimpo >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>{formatCurrency(caixaRealLimpo)}</p>
                     
                     <div className="mt-5 pt-4 border-t border-slate-800">
                       <label className="text-[9px] font-bold uppercase tracking-widest text-slate-500 mb-1.5 block">Igualar ao Saldo do Banco Real</label>
                       <div className="relative">
                         <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 font-bold text-xs">R$</span>
                         <input 
                           type="number" placeholder="0.00" value={saldoBancario} onChange={handleSaldoChange}
                           className="w-full h-10 pl-9 pr-3 text-sm font-black text-white bg-slate-950/50 border border-slate-700 rounded-xl outline-none focus:border-indigo-500 transition-all shadow-inner placeholder:text-slate-700"
                         />
                       </div>
                       {saldoBancario !== '' && (
                          <div className="mt-3 flex items-center justify-between text-[10px] font-bold uppercase tracking-widest">
                             <span className="text-slate-500">Diferença/Furo:</span>
                             <div className="flex items-center gap-2">
                               <span className={diferencaBanco >= 0 ? "text-emerald-400" : "text-rose-400"}>{diferencaBanco >= 0 ? '+' : ''}{formatCurrency(diferencaBanco)}</span>
                               {diferencaBanco < 0 && (
                                 <button onClick={handleRegistrarDiferenca} className="bg-rose-500 hover:bg-rose-600 text-white px-2 py-1 rounded shadow-sm transition-colors cursor-pointer active:scale-95">Ajustar</button>
                               )}
                             </div>
                          </div>
                       )}
                     </div>
                  </div>
               </div>

               {/* Reserva e Ação */}
               <div className="flex flex-col gap-4">
                 
                 <div className="bg-slate-800/50 p-5 rounded-2xl border border-slate-700/50 flex flex-col justify-center">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="text-[10px] font-bold uppercase tracking-widest text-amber-500/80 flex items-center gap-1.5"><Printer size={12}/> Fundo de Reserva</h3>
                    </div>
                    <p className="text-2xl font-black text-amber-500">{formatCurrency(depreciacaoTotal)}</p>
                    <p className="text-[9px] font-medium text-slate-400 mt-1">Dinheiro retido para manutenção/troca de equipamentos.</p>
                 </div>

                 <div className="bg-slate-800/50 p-4 rounded-2xl border border-slate-700/50 flex-1">
                   <h3 className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-3 flex items-center gap-1.5"><ShieldCheck size={12} className="text-blue-400"/> Projeção do Mês</h3>
                   <div className="flex flex-col gap-2">
                     <div className="flex justify-between items-center text-xs">
                       <span className="text-emerald-400 font-semibold uppercase text-[10px] tracking-widest">+ A Receber:</span>
                       <span className="font-bold text-slate-200">{formatCurrency(pedidosPendentesValor)}</span>
                     </div>
                     <div className="flex justify-between items-center text-xs">
                       <span className="text-rose-400 font-semibold uppercase text-[10px] tracking-widest">- Contas Pendentes:</span>
                       <span className="font-bold text-slate-200">{formatCurrency(contasAPagar)}</span>
                     </div>
                   </div>
                 </div>

               </div>

               {/* Dica de Ação que ocupa as duas colunas internas */}
               <div className={`sm:col-span-2 text-[11px] font-medium leading-relaxed p-4 rounded-xl bg-slate-950/50 border border-slate-800 shadow-inner ${corDica}`}>
                 <span className="font-bold uppercase tracking-widest opacity-70 block mb-1">💡 Dica do Sistema:</span>
                 {dicaAcao}
               </div>

            </div>
          </div>
        </div>

        {/* COLUNA DIREITA: LISTA DE COMPRAS (Ocupa 1/3 da tela) */}
        <div className="lg:col-span-1">
          <div className="bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden flex flex-col h-full">
            
            <div className="bg-slate-50 p-5 border-b border-slate-200 flex flex-col justify-center relative overflow-hidden">
              <div className="absolute -right-4 top-4 opacity-5"><ShoppingCart size={100} /></div>
              <div className="relative z-10">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center shadow-sm"><ShoppingCart size={20}/></div>
                  <div>
                    <h2 className="text-base font-black text-slate-800 uppercase tracking-tight leading-none">Lista de Compras</h2>
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Insumos para repor</p>
                  </div>
                </div>

                <div className="space-y-3">
                  <input type="text" placeholder="Ex: Tinta Preta Epson..." value={novoItemCompra} onChange={e => setNovoItemCompra(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleAddCompra()} className="w-full h-10 px-3 text-xs font-semibold bg-white border border-slate-200 rounded-lg outline-none focus:border-blue-400 transition-all shadow-sm"/>
                  <div className="flex gap-2">
                    <div className="flex-1 relative">
                      <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-[10px]">R$</span>
                      <input type="number" placeholder="Valor" value={valorCompra} onChange={e => setValorCompra(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleAddCompra()} className="w-full h-10 pl-7 pr-2 text-xs font-semibold bg-white border border-slate-200 rounded-lg outline-none focus:border-blue-400 transition-all shadow-sm"/>
                    </div>
                    <select value={prioridadeCompra} onChange={e => setPrioridadeCompra(e.target.value)} className="w-20 h-10 px-1 text-[9px] font-bold uppercase bg-white border border-slate-200 rounded-lg outline-none focus:border-blue-400 shadow-sm">
                      <option value="alta">Alta</option>
                      <option value="normal">Normal</option>
                      <option value="baixa">Baixa</option>
                    </select>
                    <button onClick={handleAddCompra} disabled={addCompraMutation.isPending || !novoItemCompra.trim()} className="h-10 w-10 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center justify-center shadow-sm disabled:opacity-50 transition-all shrink-0">
                      {addCompraMutation.isPending ? <Loader2 size={16} className="animate-spin" /> : <Plus size={18} />}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-5 flex flex-col bg-white">
              <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100">
                <h3 className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Pendentes ({listaCompras.filter(i => !i.concluido).length})</h3>
                <span className="text-[9px] font-bold uppercase bg-slate-100 text-slate-500 px-2 py-1 rounded">
                  Total: {formatCurrency(listaCompras.filter(i => !i.concluido).reduce((acc, curr) => acc + Number(curr.valor || 0), 0))}
                </span>
              </div>
              
              <div className="flex-1 overflow-y-auto max-h-[350px] pr-2 space-y-2 no-scrollbar">
                {listaCompras.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-slate-300 py-10">
                    <CheckSquare size={32} className="mb-2 opacity-50"/>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Tudo comprado!</p>
                  </div>
                ) : (
                  listaCompras.map(item => (
                    <div key={item.id} className={`flex items-center justify-between p-3 rounded-xl border transition-all ${item.concluido ? 'bg-slate-50 border-slate-100 opacity-60' : 'bg-white border-slate-200 shadow-sm'}`}>
                      
                      {editingCompra?.id === item.id ? (
                        <div className="flex flex-col gap-2 w-full">
                          <input type="text" value={editingCompra.item} onChange={e => setEditingCompra({...editingCompra, item: e.target.value})} className="w-full h-8 px-2 text-xs font-semibold border border-blue-200 rounded outline-none" />
                          <div className="flex gap-2">
                             <div className="relative flex-1">
                               <span className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-[10px]">R$</span>
                               <input type="number" value={editingCompra.valor} onChange={e => setEditingCompra({...editingCompra, valor: e.target.value})} className="w-full h-8 pl-6 pr-2 text-xs font-semibold border border-blue-200 rounded outline-none" />
                             </div>
                             <div className="flex gap-1 shrink-0">
                               <button onClick={handleSaveEdit} className="h-8 px-2 bg-emerald-500 text-white text-[10px] font-bold uppercase rounded shadow-sm hover:bg-emerald-600"><Save size={12}/></button>
                               <button onClick={() => setEditingCompra(null)} className="h-8 w-8 flex items-center justify-center text-slate-400 hover:bg-slate-100 rounded border border-slate-200"><X size={14}/></button>
                             </div>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div className="flex items-center gap-3 overflow-hidden cursor-pointer flex-1" onClick={() => toggleCompraMutation.mutate({ id: item.id, concluido: item.concluido })}>
                            <button className={`shrink-0 ${item.concluido ? 'text-emerald-500' : 'text-slate-300 hover:text-blue-500'}`}>
                              {item.concluido ? <CheckSquare size={18}/> : <Square size={18}/>}
                            </button>
                            <div className="truncate flex-1">
                              <p className={`text-[11px] md:text-xs font-bold truncate ${item.concluido ? 'text-slate-400 line-through' : 'text-slate-700'}`}>{item.item}</p>
                              <div className="flex items-center gap-2 mt-0.5">
                                <span className={`text-[8px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded inline-block ${item.prioridade === 'alta' ? 'bg-rose-100 text-rose-600' : item.prioridade === 'normal' ? 'bg-amber-100 text-amber-600' : 'bg-emerald-100 text-emerald-600'}`}>
                                  {item.prioridade}
                                </span>
                                {Number(item.valor) > 0 && <span className="text-[9px] md:text-[10px] font-bold text-slate-500">{formatCurrency(item.valor)}</span>}
                              </div>
                            </div>
                          </div>
                          <div className="flex flex-col gap-1 shrink-0 ml-1">
                            <button onClick={() => setEditingCompra(item)} className="p-1.5 text-slate-300 hover:text-blue-500 hover:bg-blue-50 rounded-md transition-colors"><Edit3 size={12}/></button>
                            <button onClick={() => deleteCompraMutation.mutate(item.id)} className="p-1.5 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-md transition-colors"><Trash2 size={12}/></button>
                          </div>
                        </>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* --- A GAVETA LATERAL DO CARRINHO GLOBAL (ACESSÍVEL PELO BOTÃO FLUTUANTE) --- */}
      <AnimatePresence>
        {isCartOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsCartOpen(false)} className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50"/>
            <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: "spring", bounce: 0, duration: 0.4 }} className="fixed top-0 right-0 h-full w-full max-w-sm bg-slate-50 shadow-2xl z-50 flex flex-col border-l border-slate-200">
              <div className="p-5 bg-white border-b border-slate-200 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center"><ShoppingCart size={20}/></div>
                  <div>
                    <h2 className="text-base font-black text-slate-800 uppercase tracking-tight leading-none">Carrinho Rápido</h2>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Acesso em qualquer tela.</p>
                  </div>
                </div>
                <button onClick={() => setIsCartOpen(false)} className="p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 rounded-lg transition-colors"><X size={20} /></button>
              </div>

              <div className="p-5 bg-white border-b border-slate-200">
                <div className="space-y-3">
                  <input type="text" placeholder="Ex: Tinta Preta Epson..." value={novoItemCompra} onChange={e => setNovoItemCompra(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleAddCompra()} className="w-full h-11 px-3 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-lg outline-none focus:bg-white focus:border-blue-400 transition-all"/>
                  <div className="flex gap-2">
                    <div className="w-24 relative">
                      <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-[10px]">R$</span>
                      <input type="number" placeholder="Valor" value={valorCompra} onChange={e => setValorCompra(e.target.value)} className="w-full h-11 pl-7 pr-2 text-[11px] font-bold bg-slate-50 border border-slate-200 rounded-lg outline-none focus:bg-white focus:border-blue-400 transition-all"/>
                    </div>
                    <select value={prioridadeCompra} onChange={e => setPrioridadeCompra(e.target.value)} className="flex-1 h-11 px-2 text-[10px] font-bold uppercase bg-slate-50 border border-slate-200 rounded-lg outline-none focus:bg-white focus:border-blue-400">
                      <option value="alta">🔴 Urgente</option><option value="normal">🟡 Normal</option><option value="baixa">🟢 Baixa</option>
                    </select>
                    <button onClick={handleAddCompra} disabled={addCompraMutation.isPending || !novoItemCompra.trim()} className="h-11 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center justify-center shadow-sm disabled:opacity-50 transition-all font-bold uppercase text-[10px] tracking-widest">
                      {addCompraMutation.isPending ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-5 space-y-2">
                {listaCompras.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-slate-300 opacity-70">
                    <CheckSquare size={48} className="mb-3"/>
                    <p className="text-xs font-bold uppercase tracking-widest">Tudo limpo por aqui!</p>
                  </div>
                ) : (
                  listaCompras.map(item => (
                    <div key={item.id} className={`flex items-center justify-between p-3.5 rounded-xl border transition-all ${item.concluido ? 'bg-transparent border-slate-200 opacity-50' : 'bg-white border-slate-200 shadow-sm'}`}>
                      <div className="flex items-center gap-3 overflow-hidden cursor-pointer" onClick={() => toggleCompraMutation.mutate({ id: item.id, concluido: item.concluido })}>
                        <button className={`shrink-0 ${item.concluido ? 'text-emerald-500' : 'text-slate-300'}`}>{item.concluido ? <CheckSquare size={20}/> : <Square size={20}/>}</button>
                        <div className="truncate">
                          <p className={`text-xs font-bold truncate ${item.concluido ? 'text-slate-500 line-through' : 'text-slate-700'}`}>{item.item}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className={`text-[8px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded inline-block ${item.prioridade === 'alta' ? 'bg-rose-100 text-rose-600' : item.prioridade === 'normal' ? 'bg-amber-100 text-amber-600' : 'bg-emerald-100 text-emerald-600'}`}>
                              {item.prioridade}
                            </span>
                            {Number(item.valor) > 0 && <span className="text-[9px] font-bold text-slate-500">{formatCurrency(item.valor)}</span>}
                          </div>
                        </div>
                      </div>
                      <button onClick={() => deleteCompraMutation.mutate(item.id)} className="p-2 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-colors shrink-0"><Trash2 size={16}/></button>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

    </div>
  );
}