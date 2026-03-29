import React, { useState, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AnimatePresence, motion } from "framer-motion";
import { 
  Calculator, PackageOpen, Home, Printer, Plus, Trash2, Edit3, X,
  DollarSign, Clock, AlertCircle, Save, Loader2, Info, TrendingUp, CheckCircle2, Calendar, Palette
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const fmt = (v) => Number(v || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export default function Precificacao() {
  const [activeTab, setActiveTab] = useState("calculadora");
  const queryClient = useQueryClient();

  // --- BUSCAS NO BANCO (SUPABASE) ---
  const { data: insumos = [], isLoading: loadInsumos } = useQuery({
    queryKey: ["insumos"],
    queryFn: async () => {
      const { data, error } = await supabase.from("insumos").select("*").order("nome");
      if (error) throw error; return data || [];
    }
  });

  const { data: custos = [], isLoading: loadCustos } = useQuery({
    queryKey: ["custos_fixos"],
    queryFn: async () => {
      const { data, error } = await supabase.from("custos_fixos").select("*").order("nome");
      if (error) throw error; return data || [];
    }
  });

  const { data: equipamentos = [], isLoading: loadEquip } = useQuery({
    queryKey: ["equipamentos"],
    queryFn: async () => {
      const { data, error } = await supabase.from("equipamentos").select("*").order("nome");
      if (error) throw error; return data || [];
    }
  });

  const { data: config = {}, isLoading: loadConfig } = useQuery({
    queryKey: ["configuracoes_jornada"],
    queryFn: async () => {
      const { data, error } = await supabase.from("configuracoes").select("horas_por_dia, dias_por_semana").eq("id", 1).single();
      if (error) throw error; return data || { horas_por_dia: 8, dias_por_semana: 5 };
    }
  });

  // --- MUTAÇÕES ---
  const deleteInsumo = useMutation({
    mutationFn: async (id) => supabase.from("insumos").delete().eq("id", id),
    onSuccess: () => queryClient.invalidateQueries(["insumos"])
  });
  
  const deleteCusto = useMutation({
    mutationFn: async (id) => supabase.from("custos_fixos").delete().eq("id", id),
    onSuccess: () => queryClient.invalidateQueries(["custos_fixos"])
  });

  const deleteEquipamento = useMutation({
    mutationFn: async (id) => supabase.from("equipamentos").delete().eq("id", id),
    onSuccess: () => queryClient.invalidateQueries(["equipamentos"])
  });

  const updateJornada = useMutation({
    mutationFn: async (payload) => {
      const { error } = await supabase.from('configuracoes').update(payload).eq('id', 1);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries(["configuracoes_jornada"])
  });

  // --- CÁLCULOS BASE DA EMPRESA ---
  const horasMensais = useMemo(() => {
    const hd = Number(config.horas_por_dia) || 8;
    const ds = Number(config.dias_por_semana) || 5;
    return (hd * ds) * 4; 
  }, [config]);
  
  const totalCustosMensais = useMemo(() => {
    const somaFixos = custos.reduce((acc, curr) => acc + Number(curr.valor_considerado || 0), 0);
    const somaEquip = equipamentos.reduce((acc, curr) => acc + Number(curr.depreciacao_mensal || 0), 0);
    return somaFixos + somaEquip;
  }, [custos, equipamentos]);

  const valorHora = horasMensais > 0 ? totalCustosMensais / horasMensais : 0;
  const valorMinuto = valorHora / 60;

  const isLoading = loadInsumos || loadCustos || loadEquip || loadConfig;

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 pb-[80px] md:pb-12 relative">
      
      {/* HEADER DA PÁGINA */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-20 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
          <div>
            <h1 className="text-lg md:text-xl font-semibold text-slate-800 flex items-center gap-2 uppercase tracking-tight">
              <Calculator className="w-5 h-5 text-indigo-600" /> Precificação
            </h1>
            <p className="text-[9px] md:text-[10px] font-medium text-slate-500 uppercase tracking-widest mt-0.5">Custo real e lucro</p>
          </div>
          
          {/* TABS DESKTOP (Esconde no mobile) */}
          <div className="hidden md:flex gap-1.5 bg-slate-100 p-1 rounded-lg border border-slate-200">
            {[
              { id: 'calculadora', icon: Calculator, label: 'Calculadora' },
              { id: 'insumos', icon: PackageOpen, label: 'Insumos' },
              { id: 'custos', icon: Home, label: 'Custos Fixos' },
              { id: 'equipamentos', icon: Printer, label: 'Equipamentos' },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[9px] font-semibold uppercase transition-all whitespace-nowrap ${
                  activeTab === tab.id ? 'bg-white shadow-sm text-indigo-600 border border-slate-200' : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                <tab.icon size={14} /> {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 mt-4 md:mt-6">
        {isLoading ? (
          <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-indigo-600" /></div>
        ) : (
          <AnimatePresence mode="wait">
            {activeTab === 'calculadora' && (
              <TabCalculadora 
                key="calc" 
                insumos={insumos} 
                valorMinuto={valorMinuto} 
                valorHora={valorHora} 
                configJornada={config}
                updateJornada={updateJornada}
                horasMensais={horasMensais}
              />
            )}
            {activeTab === 'insumos' && <TabInsumos key="insumos" insumos={insumos} onDelete={(id) => deleteInsumo.mutate(id)} queryClient={queryClient} />}
            {activeTab === 'custos' && <TabCustosFixos key="custos" custos={custos} onDelete={(id) => deleteCusto.mutate(id)} queryClient={queryClient} />}
            {activeTab === 'equipamentos' && <TabEquipamentos key="equipamentos" equipamentos={equipamentos} onDelete={(id) => deleteEquipamento.mutate(id)} queryClient={queryClient} />}
          </AnimatePresence>
        )}
      </div>

      {/* --- MENU INFERIOR FIXO PARA MOBILE --- */}
      <div className="md:hidden fixed bottom-0 inset-x-0 h-[64px] bg-white border-t border-slate-200 flex items-center justify-around z-[100] pb-safe shadow-[0_-5px_15px_rgba(0,0,0,0.03)]">
        {[
          { id: 'calculadora', icon: Calculator, label: 'Calcular' },
          { id: 'insumos', icon: PackageOpen, label: 'Insumos' },
          { id: 'custos', icon: Home, label: 'Fixos' },
          { id: 'equipamentos', icon: Printer, label: 'Máquinas' },
        ].map(tab => (
          <button 
            key={tab.id} 
            onClick={() => setActiveTab(tab.id)} 
            className={`flex flex-col items-center justify-center flex-1 h-full gap-1 transition-colors ${activeTab === tab.id ? 'text-indigo-600' : 'text-slate-400 hover:text-slate-600'}`}
          >
             <tab.icon size={18} className={activeTab === tab.id ? 'animate-pulse' : ''} />
             <span className="text-[8px] font-semibold uppercase tracking-wider">{tab.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

// ==========================================
// ABA 1: CALCULADORA MÁGICA + SIMULADOR
// ==========================================
function TabCalculadora({ insumos, valorMinuto, valorHora, configJornada, updateJornada, horasMensais }) {
  const [tipoPrecificacao, setTipoPrecificacao] = useState('fisico');
  const [selecionados, setSelecionados] = useState([]);
  const [insumoSelecionado, setInsumoSelecionado] = useState('');
  const [quantidadeDesejada, setQuantidadeDesejada] = useState(1);
  const [tempoMinutos, setTempoMinutos] = useState(30);
  const [margemLucro, setMargemLucro] = useState(30);
  const [taxaCartao, setTaxaCartao] = useState(5);
  const [precoSimulado, setPrecoSimulado] = useState('');

  const [jornada, setJornada] = useState({
    horas_por_dia: configJornada.horas_por_dia || 8,
    dias_por_semana: configJornada.dias_por_semana || 5
  });

  const salvarJornada = () => {
    updateJornada.mutate({
      horas_por_dia: Number(jornada.horas_por_dia),
      dias_por_semana: Number(jornada.dias_por_semana)
    });
  };

  const adicionarInsumo = () => {
    if (!insumoSelecionado) return;
    const item = insumos.find(i => i.id === insumoSelecionado);
    if (!item) return;

    setSelecionados([...selecionados, { 
      id: item.id + Date.now(),
      nome: item.nome, 
      unidade_medida: item.unidade_medida,
      custo_unitario: Number(item.custo_unitario),
      quantidade: Number(quantidadeDesejada)
    }]);
    setInsumoSelecionado('');
    setQuantidadeDesejada(1);
  };

  const removerInsumo = (idList) => {
    setSelecionados(selecionados.filter(s => s.id !== idList));
  };

  const custoMateriais = tipoPrecificacao === 'fisico' 
    ? selecionados.reduce((acc, curr) => acc + (curr.custo_unitario * curr.quantidade), 0) 
    : 0;
    
  const custoMaoDeObra = Number(tempoMinutos) * valorMinuto;
  const custoTotal = custoMateriais + custoMaoDeObra;

  const somaPorcentagens = (Number(margemLucro) + Number(taxaCartao)) / 100;
  const divisor = somaPorcentagens >= 1 ? 0.01 : (1 - somaPorcentagens);
  const precoSugerido = custoTotal / divisor;

  const lucroLimpoSugerido = precoSugerido * (Number(margemLucro) / 100);
  const valorTaxaSugerida = precoSugerido * (Number(taxaCartao) / 100);

  const valorPrecoSimulado = Number(precoSimulado) || 0;
  const taxasSimuladas = valorPrecoSimulado * (Number(taxaCartao) / 100);
  const lucroLimpoSimulado = valorPrecoSimulado - custoTotal - taxasSimuladas;
  const margemRealSimulada = valorPrecoSimulado > 0 ? (lucroLimpoSimulado / valorPrecoSimulado) * 100 : 0;

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      
      {/* LADO ESQUERDO */}
      <div className="lg:col-span-2 space-y-4">
        
        {/* --- SELEÇÃO: FÍSICO OU SERVIÇO --- */}
        <div className="flex bg-slate-200/50 p-1 rounded-xl border border-slate-200">
          <button 
            onClick={() => setTipoPrecificacao('fisico')}
            className={`flex-1 flex justify-center items-center gap-1.5 py-2 rounded-lg text-[10px] font-semibold uppercase transition-all ${tipoPrecificacao === 'fisico' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}
          >
            <PackageOpen size={14} /> Produto Físico
          </button>
          <button 
            onClick={() => setTipoPrecificacao('servico')}
            className={`flex-1 flex justify-center items-center gap-1.5 py-2 rounded-lg text-[10px] font-semibold uppercase transition-all ${tipoPrecificacao === 'servico' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}
          >
            <Palette size={14} /> Serviço / Digital
          </button>
        </div>

        {/* --- JORNADA --- */}
        <div className="bg-indigo-50 border border-indigo-100 p-4 rounded-xl flex flex-col sm:flex-row gap-4 items-center justify-between shadow-sm">
          <div className="flex items-center gap-2.5 w-full sm:w-auto">
             <div className="bg-indigo-100 p-2 rounded-lg text-indigo-600 shrink-0"><Calendar size={16} /></div>
             <div>
               <h3 className="text-[11px] font-semibold uppercase text-indigo-800 tracking-widest leading-tight">Jornada Média</h3>
               <p className="text-[9px] font-medium text-indigo-600 mt-0.5">Trabalha <span className="font-semibold">{horasMensais}h/mês</span>.</p>
             </div>
          </div>
          <div className="flex items-end gap-2 w-full sm:w-auto shrink-0">
             <div className="space-y-1 flex-1 sm:w-20">
               <label className="text-[8px] font-semibold uppercase text-indigo-500 ml-0.5">Horas/Dia</label>
               <Input type="number" min="1" max="24" value={jornada.horas_por_dia} onChange={e => setJornada({...jornada, horas_por_dia: e.target.value})} className="h-9 bg-white border-indigo-200 text-[11px] font-semibold text-center" />
             </div>
             <div className="space-y-1 flex-1 sm:w-20">
               <label className="text-[8px] font-semibold uppercase text-indigo-500 ml-0.5">Dias/Semana</label>
               <Input type="number" min="1" max="7" value={jornada.dias_por_semana} onChange={e => setJornada({...jornada, dias_por_semana: e.target.value})} className="h-9 bg-white border-indigo-200 text-[11px] font-semibold text-center" />
             </div>
             <Button onClick={salvarJornada} disabled={updateJornada.isPending} className="h-9 w-9 p-0 bg-indigo-600 hover:bg-indigo-700 shadow-sm shrink-0 rounded-md">
               {updateJornada.isPending ? <Loader2 size={12} className="animate-spin"/> : <Save size={12}/>}
             </Button>
          </div>
        </div>

        {/* --- MATERIAIS UTILIZADOS --- */}
        {tipoPrecificacao === 'fisico' && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <h2 className="text-xs font-semibold text-slate-800 uppercase tracking-widest mb-3 flex items-center gap-1.5">
              <PackageOpen size={14} className="text-indigo-500" /> Materiais Usados
            </h2>
            
            <div className="flex flex-col sm:flex-row gap-2 mb-4">
              <select 
                value={insumoSelecionado} 
                onChange={(e) => setInsumoSelecionado(e.target.value)}
                className="flex-1 h-9 border border-slate-200 rounded-md px-2 text-[11px] font-medium bg-slate-50 focus:bg-white text-slate-700 outline-none"
              >
                <option value="">Selecione um Insumo...</option>
                {insumos.map(i => (
                  <option key={i.id} value={i.id}>{i.nome} ({fmt(i.custo_unitario)} / {i.unidade_medida})</option>
                ))}
              </select>
              
              <div className="flex gap-2">
                <Input 
                  type="number" 
                  min="0.01" 
                  step="0.01"
                  value={quantidadeDesejada} 
                  onChange={(e) => setQuantidadeDesejada(e.target.value)}
                  className="w-20 h-9 border-slate-200 bg-slate-50 font-semibold text-xs text-center"
                />
                <Button onClick={adicionarInsumo} className="h-9 w-10 p-0 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md shadow-sm">
                  <Plus size={14} />
                </Button>
              </div>
            </div>

            <div className="bg-slate-50 rounded-lg border border-slate-100 min-h-[80px]">
              {selecionados.length === 0 ? (
                <div className="flex items-center justify-center h-full py-6 text-[9px] font-semibold uppercase tracking-widest text-slate-400">
                  Nenhum material adicionado
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {selecionados.map(item => (
                    <div key={item.id} className="flex items-center justify-between p-2.5 hover:bg-slate-100/50 transition-colors">
                      <div>
                        <p className="text-[11px] font-semibold text-slate-700">{item.nome}</p>
                        <p className="text-[9px] text-slate-500 font-medium uppercase tracking-widest mt-0.5">
                          {item.quantidade} {item.unidade_medida} x {fmt(item.custo_unitario)}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-[11px] font-semibold text-slate-800">{fmt(item.custo_unitario * item.quantidade)}</span>
                        <button onClick={() => removerInsumo(item.id)} className="text-slate-400 hover:text-red-500"><Trash2 size={12} /></button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* --- TEMPO, MARGEM E SIMULADOR --- */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="text-[9px] font-semibold uppercase tracking-widest text-slate-500 mb-1.5 flex items-center gap-1.5">
                <Clock size={10}/> Tempo ({tipoPrecificacao === 'servico' ? 'Serviço' : 'Produção'})
              </label>
              <div className="relative">
                <Input type="number" value={tempoMinutos} onChange={(e) => setTempoMinutos(e.target.value)} className="h-9 border-slate-200 bg-slate-50 pr-10 font-semibold text-slate-800 text-sm" />
                <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[9px] font-semibold uppercase text-slate-400">Min</span>
              </div>
              <p className="text-[8px] text-slate-400 mt-1 font-medium">Sua hora: {fmt(valorHora)}</p>
            </div>

            <div>
              <label className="text-[9px] font-semibold uppercase tracking-widest text-emerald-600 mb-1.5 flex items-center gap-1.5"><DollarSign size={10}/> Margem de Lucro</label>
              <div className="relative">
                <Input type="number" value={margemLucro} onChange={(e) => setMargemLucro(e.target.value)} className="h-9 border-emerald-200 bg-emerald-50 pr-8 font-semibold text-emerald-700 text-sm" />
                <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs font-semibold text-emerald-500">%</span>
              </div>
            </div>

            <div>
              <label className="text-[9px] font-semibold uppercase tracking-widest text-rose-500 mb-1.5 flex items-center gap-1.5"><AlertCircle size={10}/> Taxa Cartão</label>
              <div className="relative">
                <Input type="number" value={taxaCartao} onChange={(e) => setTaxaCartao(e.target.value)} className="h-9 border-rose-200 bg-rose-50 pr-8 font-semibold text-rose-700 text-sm" />
                <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs font-semibold text-rose-400">%</span>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100">
            <div className="flex items-center gap-1.5 mb-2.5">
              <TrendingUp className="text-blue-500 w-3.5 h-3.5" />
              <h3 className="text-[10px] font-semibold uppercase text-blue-600 tracking-widest">Simular Preço de Mercado</h3>
            </div>
            <div className="bg-blue-50/50 p-3 rounded-lg border border-blue-100 flex flex-col sm:flex-row gap-3 items-center">
              <div className="w-full sm:w-48 shrink-0">
                <div className="relative">
                  <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-blue-500 font-semibold text-xs">R$</span>
                  <Input 
                    type="number" 
                    placeholder="0.00"
                    value={precoSimulado} 
                    onChange={(e) => setPrecoSimulado(e.target.value)} 
                    className="h-9 bg-white border-blue-200 pl-8 font-semibold text-sm text-blue-800" 
                  />
                </div>
              </div>
              <div className="flex-1 text-[9px] text-blue-700 font-medium leading-tight">
                Teste um preço concorrente para ver se ele cobre seus custos e quanto lucro limpo ele te deixará.
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* LADO DIREITO: RESUMO FINANCEIRO (Painel Escuro) */}
      <div className="relative">
        <div className="bg-slate-900 rounded-xl p-5 shadow-lg text-white sticky top-24">
          <h3 className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 mb-4 border-b border-slate-800 pb-2">Resumo da Precificação</h3>
          
          <div className="space-y-3 mb-5">
            {tipoPrecificacao === 'fisico' && (
              <div className="flex justify-between items-center text-[11px]">
                <span className="text-slate-400">Custo Materiais</span>
                <span className="font-semibold text-slate-200">{fmt(custoMateriais)}</span>
              </div>
            )}
            <div className="flex justify-between items-center text-[11px]">
              <span className="text-slate-400">Custo do Tempo</span>
              <span className="font-semibold text-slate-200">{fmt(custoMaoDeObra)}</span>
            </div>
            <div className="flex justify-between items-center pt-2.5 border-t border-slate-800">
              <span className="text-rose-400 font-semibold uppercase text-[9px] tracking-widest">Custo Base Total</span>
              <span className="font-semibold text-rose-300 text-sm">{fmt(custoTotal)}</span>
            </div>
          </div>

          <div className="bg-slate-950 rounded-lg p-4 mb-5 border border-slate-800">
            <p className="text-[9px] font-semibold uppercase tracking-widest text-emerald-400 mb-1">
              Preço Ideal Sugerido
            </p>
            <p className="text-2xl font-semibold tracking-tight text-white">{fmt(precoSugerido)}</p>
          </div>

          <AnimatePresence>
            {valorPrecoSimulado > 0 && (
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="mt-3 pt-3 border-t border-slate-800 space-y-3">
                <p className="text-[9px] font-semibold text-blue-400 uppercase tracking-widest text-center">Se cobrar {fmt(valorPrecoSimulado)}:</p>
                
                <div className={`p-3 rounded-lg border flex flex-col items-center gap-1 ${lucroLimpoSimulado > 0 ? 'bg-emerald-950/50 border-emerald-500/30' : 'bg-red-950/50 border-red-500/30'}`}>
                  <span className="text-[8px] font-semibold uppercase text-slate-400">Lucro Real Livre</span>
                  <span className={`text-xl font-semibold ${lucroLimpoSimulado > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                    {lucroLimpoSimulado > 0 ? '+' : ''} {fmt(lucroLimpoSimulado)}
                  </span>
                  <span className={`text-[8px] font-semibold px-2 py-[1px] rounded-full uppercase mt-0.5 ${lucroLimpoSimulado > 0 ? 'bg-emerald-500/20 text-emerald-300' : 'bg-red-500/20 text-red-300'}`}>
                    {margemRealSimulada.toFixed(1)}% Margem
                  </span>
                </div>

                <div className="text-center pt-1">
                  {valorPrecoSimulado < precoSugerido ? (
                    <span className="text-[8px] font-semibold text-amber-400 uppercase flex items-center justify-center gap-1">
                      <AlertCircle size={10}/> Abaixo do ideal ({fmt(precoSugerido - valorPrecoSimulado)})
                    </span>
                  ) : (
                    <span className="text-[8px] font-semibold text-emerald-400 uppercase flex items-center justify-center gap-1">
                      <CheckCircle2 size={10}/> Margem Segura
                    </span>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {!valorPrecoSimulado && (
            <div className="space-y-2 pt-2">
              <div className="flex justify-between items-center bg-slate-800/50 p-2.5 rounded-md">
                <span className="text-[9px] font-semibold uppercase tracking-widest text-slate-400">Taxas do Cartão</span>
                <span className="text-[11px] font-semibold text-rose-300">- {fmt(valorTaxaSugerida)}</span>
              </div>
              <div className="flex justify-between items-center bg-emerald-950/30 border border-emerald-900/50 p-2.5 rounded-md">
                <span className="text-[9px] font-semibold uppercase tracking-widest text-emerald-400">Lucro Livre</span>
                <span className="text-[11px] font-semibold text-emerald-400">+ {fmt(lucroLimpoSugerido)}</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

// ==========================================
// ABA 2: CADASTRO DE INSUMOS
// ==========================================
function TabInsumos({ insumos, onDelete, queryClient }) {
  const [novo, setNovo] = useState({ nome: '', categoria: 'Papelaria', unidade_medida: 'unidade', quantidade_pacote: '', custo_pacote: '', frete: '' });
  const [editingId, setEditingId] = useState(null);

  const saveMutation = useMutation({
    mutationFn: async (data) => {
      const payload = {
        nome: data.nome, 
        categoria: data.categoria || 'Papelaria', 
        unidade_medida: data.unidade_medida,
        quantidade_pacote: Number(data.quantidade_pacote), 
        custo_pacote: Number(data.custo_pacote), 
        frete: Number(data.frete || 0)
      };

      if (editingId) {
        const { error } = await supabase.from("insumos").update(payload).eq("id", editingId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("insumos").insert([payload]);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["insumos"]);
      cancelEdit();
    }
  });

  const handleSave = () => {
    if (!novo.nome || !novo.quantidade_pacote || !novo.custo_pacote) return alert("Preencha Nome, Quantidade e Custo.");
    saveMutation.mutate(novo);
  };

  const handleEdit = (item) => {
    setNovo({
      nome: item.nome,
      categoria: item.categoria || 'Papelaria',
      unidade_medida: item.unidade_medida,
      quantidade_pacote: item.quantidade_pacote,
      custo_pacote: item.custo_pacote,
      frete: item.frete || ''
    });
    setEditingId(item.id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const cancelEdit = () => {
    setNovo({ nome: '', categoria: 'Papelaria', unidade_medida: 'unidade', quantidade_pacote: '', custo_pacote: '', frete: '' });
    setEditingId(null);
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
      <div className={`bg-white p-4 rounded-xl border shadow-sm transition-colors ${editingId ? 'border-blue-300 bg-blue-50/20' : 'border-slate-200'}`}>
        <div className="flex items-center justify-between mb-3">
          <h2 className={`text-[11px] font-semibold uppercase tracking-widest flex items-center gap-1.5 ${editingId ? 'text-blue-600' : 'text-slate-800'}`}>
            {editingId ? <Edit3 size={14} /> : <Plus size={14} className="text-indigo-500" />} 
            {editingId ? 'Editando Insumo' : 'Novo Insumo'}
          </h2>
          {editingId && (
            <button onClick={cancelEdit} className="text-slate-400 hover:text-slate-600 flex items-center gap-1 text-[9px] font-semibold uppercase rounded-md bg-slate-50 px-2 py-1">
              <X size={12} /> Cancelar
            </button>
          )}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-6 gap-3 items-end">
          <div className="md:col-span-2 space-y-1">
            <label className="text-[9px] font-semibold uppercase text-slate-500 ml-1 tracking-widest">Nome do Material</label>
            <Input placeholder="Ex: Papel 180g" value={novo.nome} onChange={e => setNovo({...novo, nome: e.target.value})} className="h-9 text-xs font-medium bg-slate-50" />
          </div>
          <div className="space-y-1">
            <label className="text-[9px] font-semibold uppercase text-slate-500 ml-1 tracking-widest">Unidade</label>
            <select value={novo.unidade_medida} onChange={e => setNovo({...novo, unidade_medida: e.target.value})} className="w-full h-9 border border-slate-200 rounded-md px-2 text-[11px] font-medium bg-slate-50 outline-none text-slate-700">
              <option value="unidade">Unidade</option><option value="folha">Folha</option>
              <option value="metro">Metro</option><option value="cm">Centímetro</option>
              <option value="ml">ML (Tinta)</option><option value="grama">Grama</option>
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-[9px] font-semibold uppercase text-slate-500 ml-1 tracking-widest">Qtd Pacote</label>
            <Input type="number" placeholder="Ex: 100" value={novo.quantidade_pacote} onChange={e => setNovo({...novo, quantidade_pacote: e.target.value})} className="h-9 text-xs font-medium bg-slate-50" />
          </div>
          <div className="space-y-1">
            <label className="text-[9px] font-semibold uppercase text-slate-500 ml-1 tracking-widest">Custo (R$)</label>
            <Input type="number" placeholder="45.00" value={novo.custo_pacote} onChange={e => setNovo({...novo, custo_pacote: e.target.value})} className="h-9 text-xs font-medium bg-slate-50" />
          </div>
          <div className="space-y-1 flex gap-2 items-end">
            <div className="flex-1">
              <label className="text-[9px] font-semibold uppercase text-slate-500 ml-1 tracking-widest">Frete (R$)</label>
              <Input type="number" placeholder="15.00" value={novo.frete} onChange={e => setNovo({...novo, frete: e.target.value})} className="h-9 text-xs font-medium bg-slate-50" />
            </div>
            <Button onClick={handleSave} disabled={saveMutation.isPending} className={`h-9 w-9 p-0 rounded-md shadow-sm shrink-0 ${editingId ? 'bg-blue-600 hover:bg-blue-700' : 'bg-indigo-600 hover:bg-indigo-700'}`}>
              <Save size={14} />
            </Button>
          </div>
        </div>
      </div>
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="p-3 text-[9px] font-semibold uppercase tracking-widest text-slate-500">Material</th>
                <th className="p-3 text-[9px] font-semibold uppercase tracking-widest text-slate-500 text-center">Pacote</th>
                <th className="p-3 text-[9px] font-semibold uppercase tracking-widest text-slate-500 text-center">Valor Pago</th>
                <th className="p-3 text-[9px] font-semibold uppercase tracking-widest text-indigo-600 text-right">Custo Unit.</th>
                <th className="p-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {insumos.map(item => (
                <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="p-3 text-xs font-semibold text-slate-700">{item.nome}</td>
                  <td className="p-3 text-[10px] font-medium text-slate-500 text-center">{item.quantidade_pacote} {item.unidade_medida}s</td>
                  <td className="p-3 text-[10px] font-medium text-slate-500 text-center">{fmt(item.custo_pacote)} {item.frete > 0 && <span className="text-[8px] text-slate-400 block">+ {fmt(item.frete)} frete</span>}</td>
                  <td className="p-3 text-xs font-semibold text-slate-800 text-right">{fmt(item.custo_unitario)} <span className="text-[8px] font-medium text-slate-400 uppercase">/ {item.unidade_medida}</span></td>
                  <td className="p-3 text-right whitespace-nowrap">
                    <button onClick={() => handleEdit(item)} className="text-slate-400 hover:text-blue-500 p-1.5 transition-colors"><Edit3 size={14}/></button>
                    <button onClick={() => { if(window.confirm('Excluir?')) onDelete(item.id); }} className="text-slate-400 hover:text-red-500 p-1.5 transition-colors ml-1"><Trash2 size={14}/></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {insumos.length === 0 && <div className="text-center py-8 text-[10px] font-semibold text-slate-400 uppercase tracking-widest">Nenhum insumo cadastrado.</div>}
        </div>
      </div>
    </motion.div>
  );
}

// ==========================================
// ABA 3: CUSTOS FIXOS
// ==========================================
function TabCustosFixos({ custos, onDelete, queryClient }) {
  const [novo, setNovo] = useState({ nome: '', valor_mensal: '', porcentagem_empresa: 100 });
  const [editingId, setEditingId] = useState(null);

  const saveMutation = useMutation({
    mutationFn: async (data) => {
      const payload = {
        nome: data.nome, 
        valor_mensal: Number(data.valor_mensal), 
        porcentagem_empresa: Number(data.porcentagem_empresa)
      };
      if (editingId) {
        const { error } = await supabase.from("custos_fixos").update(payload).eq("id", editingId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("custos_fixos").insert([payload]);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["custos_fixos"]);
      cancelEdit();
    }
  });

  const handleSave = () => {
    if (!novo.nome || !novo.valor_mensal) return alert("Preencha Nome e Valor.");
    saveMutation.mutate(novo);
  };

  const handleEdit = (item) => {
    setNovo({ nome: item.nome, valor_mensal: item.valor_mensal, porcentagem_empresa: item.porcentagem_empresa });
    setEditingId(item.id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const cancelEdit = () => {
    setNovo({ nome: '', valor_mensal: '', porcentagem_empresa: 100 });
    setEditingId(null);
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
      <div className="bg-blue-50/50 border border-blue-100 p-3 rounded-xl flex gap-2 text-blue-800 shadow-sm">
        <Info size={16} className="shrink-0 mt-0.5 text-blue-500" />
        <p className="text-[10px] md:text-xs font-medium leading-relaxed">
          <strong>Trabalha de casa?</strong> Cadastre o valor total (ex: Luz R$200) e defina que a empresa gasta uma fatia (ex: 30%). O seu Pró-labore é 100%.
        </p>
      </div>
      <div className={`bg-white p-4 rounded-xl border shadow-sm transition-colors ${editingId ? 'border-blue-300 bg-blue-50/20' : 'border-slate-200'}`}>
        <div className="flex items-center justify-between mb-3">
          <h2 className={`text-[11px] font-semibold uppercase tracking-widest flex items-center gap-1.5 ${editingId ? 'text-blue-600' : 'text-slate-800'}`}>
            {editingId ? <Edit3 size={14} /> : <Plus size={14} className="text-indigo-500" />} 
            {editingId ? 'Editando Custo' : 'Novo Custo Fixo'}
          </h2>
          {editingId && (
            <button onClick={cancelEdit} className="text-slate-400 hover:text-slate-600 flex items-center gap-1 text-[9px] font-semibold uppercase rounded-md bg-slate-50 px-2 py-1">
              <X size={12} /> Cancelar
            </button>
          )}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
          <div className="space-y-1">
            <label className="text-[9px] font-semibold uppercase text-slate-500 ml-1 tracking-widest">Conta / Despesa</label>
            <Input placeholder="Ex: Internet, Aluguel..." value={novo.nome} onChange={e => setNovo({...novo, nome: e.target.value})} className="h-9 text-xs font-medium bg-slate-50" />
          </div>
          <div className="space-y-1">
            <label className="text-[9px] font-semibold uppercase text-slate-500 ml-1 tracking-widest">Valor Mensal (R$)</label>
            <Input type="number" placeholder="0.00" value={novo.valor_mensal} onChange={e => setNovo({...novo, valor_mensal: e.target.value})} className="h-9 text-xs font-medium bg-slate-50" />
          </div>
          <div className="space-y-1">
            <label className="text-[9px] font-semibold uppercase text-slate-500 ml-1 tracking-widest">% Fatia Empresa</label>
            <Input type="number" min="1" max="100" value={novo.porcentagem_empresa} onChange={e => setNovo({...novo, porcentagem_empresa: e.target.value})} className="h-9 text-xs font-medium bg-slate-50" />
          </div>
          <Button onClick={handleSave} disabled={saveMutation.isPending} className="h-9 bg-indigo-600 hover:bg-indigo-700 text-[10px] font-semibold uppercase tracking-widest rounded-md shadow-sm">
            Salvar
          </Button>
        </div>
      </div>
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                <th className="p-3 text-[9px] font-semibold uppercase tracking-widest text-slate-500">Despesa</th>
                <th className="p-3 text-[9px] font-semibold uppercase tracking-widest text-slate-500 text-center">Fatia Empresa</th>
                <th className="p-3 text-[9px] font-semibold uppercase tracking-widest text-rose-500 text-right">Custo Real</th>
                <th className="p-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {custos.map(item => (
                <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="p-3 text-xs font-semibold text-slate-700">{item.nome}</td>
                  <td className="p-3 text-[10px] font-medium text-slate-500 text-center">
                    <span className="bg-slate-100 px-1.5 py-0.5 rounded">{item.porcentagem_empresa}%</span>
                  </td>
                  <td className="p-3 text-[13px] font-semibold text-rose-600 text-right">{fmt(item.valor_considerado)}</td>
                  <td className="p-3 text-right whitespace-nowrap">
                    <button onClick={() => handleEdit(item)} className="text-slate-400 hover:text-blue-500 p-1.5 transition-colors"><Edit3 size={14}/></button>
                    <button onClick={() => { if(window.confirm('Excluir?')) onDelete(item.id); }} className="text-slate-400 hover:text-red-500 p-1.5 transition-colors ml-1"><Trash2 size={14}/></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {custos.length === 0 && <div className="text-center py-8 text-[10px] font-semibold text-slate-400 uppercase tracking-widest">Nenhum custo cadastrado.</div>}
        </div>
      </div>
    </motion.div>
  );
}

// ==========================================
// ABA 4: EQUIPAMENTOS
// ==========================================
function TabEquipamentos({ equipamentos, onDelete, queryClient }) {
  const [novo, setNovo] = useState({ nome: '', valor_compra: '', vida_util_meses: 36 });
  const [editingId, setEditingId] = useState(null);

  const saveMutation = useMutation({
    mutationFn: async (data) => {
      const payload = { nome: data.nome, valor_compra: Number(data.valor_compra), vida_util_meses: Number(data.vida_util_meses) };
      if (editingId) {
        const { error } = await supabase.from("equipamentos").update(payload).eq("id", editingId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("equipamentos").insert([payload]);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["equipamentos"]);
      cancelEdit();
    }
  });

  const handleSave = () => {
    if (!novo.nome || !novo.valor_compra) return alert("Preencha Nome e Valor.");
    saveMutation.mutate(novo);
  };

  const handleEdit = (item) => {
    setNovo({ nome: item.nome, valor_compra: item.valor_compra, vida_util_meses: item.vida_util_meses });
    setEditingId(item.id);
  };

  const cancelEdit = () => {
    setNovo({ nome: '', valor_compra: '', vida_util_meses: 36 });
    setEditingId(null);
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
      <div className="bg-amber-50/50 border border-amber-100 p-3 rounded-xl flex gap-2 text-amber-800 shadow-sm">
        <Info size={16} className="shrink-0 mt-0.5 text-amber-500" />
        <p className="text-[10px] md:text-xs font-medium leading-relaxed">
          O sistema separa um trocadinho mensal para que você tenha caixa para comprar uma máquina nova quando essa quebrar.
        </p>
      </div>
      <div className={`bg-white p-4 rounded-xl border shadow-sm transition-colors ${editingId ? 'border-blue-300 bg-blue-50/20' : 'border-slate-200'}`}>
        <div className="flex items-center justify-between mb-3">
          <h2 className={`text-[11px] font-semibold uppercase tracking-widest flex items-center gap-1.5 ${editingId ? 'text-blue-600' : 'text-slate-800'}`}>
            {editingId ? <Edit3 size={14} /> : <Plus size={14} className="text-indigo-500" />} 
            {editingId ? 'Editando Máquina' : 'Nova Máquina'}
          </h2>
          {editingId && (
            <button onClick={cancelEdit} className="text-slate-400 hover:text-slate-600 flex items-center gap-1 text-[9px] font-semibold uppercase rounded-md bg-slate-50 px-2 py-1">
              <X size={12} /> Cancelar
            </button>
          )}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
          <div className="space-y-1"><label className="text-[9px] font-semibold uppercase tracking-widest text-slate-500 ml-1">Máquina</label><Input value={novo.nome} onChange={e => setNovo({...novo, nome: e.target.value})} className="h-9 text-xs font-medium bg-slate-50" /></div>
          <div className="space-y-1"><label className="text-[9px] font-semibold uppercase tracking-widest text-slate-500 ml-1">Valor Compra</label><Input type="number" value={novo.valor_compra} onChange={e => setNovo({...novo, valor_compra: e.target.value})} className="h-9 text-xs font-medium bg-slate-50" /></div>
          <div className="space-y-1"><label className="text-[9px] font-semibold uppercase tracking-widest text-slate-500 ml-1">Vida Útil (Meses)</label><Input type="number" value={novo.vida_util_meses} onChange={e => setNovo({...novo, vida_util_meses: e.target.value})} className="h-9 text-xs font-medium bg-slate-50" /></div>
          <Button onClick={handleSave} className="h-9 bg-indigo-600 hover:bg-indigo-700 text-[10px] font-semibold uppercase tracking-widest rounded-md shadow-sm">Salvar</Button>
        </div>
      </div>
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                <th className="p-3 text-[9px] font-semibold uppercase tracking-widest text-slate-500">Máquina</th>
                <th className="p-3 text-[9px] font-semibold uppercase tracking-widest text-slate-500 text-center">Durabilidade</th>
                <th className="p-3 text-[9px] font-semibold uppercase tracking-widest text-rose-500 text-right">Desgaste Mensal</th>
                <th className="p-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {equipamentos.map(item => (
                <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="p-3 text-xs font-semibold text-slate-700">{item.nome}</td>
                  <td className="p-3 text-[10px] font-medium text-slate-500 text-center">{item.vida_util_meses} meses</td>
                  <td className="p-3 text-[13px] font-semibold text-rose-600 text-right">{fmt(item.depreciacao_mensal)}</td>
                  <td className="p-3 text-right whitespace-nowrap">
                    <button onClick={() => handleEdit(item)} className="text-slate-400 hover:text-blue-500 p-1.5 transition-colors"><Edit3 size={14}/></button>
                    <button onClick={() => { if(window.confirm('Excluir?')) onDelete(item.id); }} className="text-slate-400 hover:text-red-500 p-1.5 transition-colors ml-1"><Trash2 size={14}/></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {equipamentos.length === 0 && <div className="text-center py-8 text-[10px] font-semibold text-slate-400 uppercase tracking-widest">Nenhum equipamento cadastrado.</div>}
        </div>
      </div>
    </motion.div>
  );
}