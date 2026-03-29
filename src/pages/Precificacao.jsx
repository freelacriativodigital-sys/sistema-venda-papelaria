import React, { useState, useMemo, useEffect } from 'react';
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

  // Busca configurações (para puxar horas e dias de trabalho)
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
  // Calcula horas mensais: (Horas/Dia * Dias/Semana) * 4 Semanas no mês
  const horasMensais = useMemo(() => {
    const hd = Number(config.horas_por_dia) || 8;
    const ds = Number(config.dias_por_semana) || 5;
    return (hd * ds) * 4; // Aproximação padrão de mercado (4 semanas)
  }, [config]);
  
  const totalCustosMensais = useMemo(() => {
    const somaFixos = custos.reduce((acc, curr) => acc + Number(curr.valor_considerado || 0), 0);
    const somaEquip = equipamentos.reduce((acc, curr) => acc + Number(curr.depreciacao_mensal || 0), 0);
    return somaFixos + somaEquip;
  }, [custos, equipamentos]);

  // Se não houver horas definidas, evita divisão por zero
  const valorHora = horasMensais > 0 ? totalCustosMensais / horasMensais : 0;
  const valorMinuto = valorHora / 60;

  const isLoading = loadInsumos || loadCustos || loadEquip || loadConfig;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-20">
      {/* HEADER DA PÁGINA */}
      <div className="bg-white border-b border-slate-100 sticky top-0 z-20 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 md:py-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl md:text-2xl font-bold md:font-semibold text-slate-800 flex items-center gap-2 uppercase tracking-tight">
              <Calculator className="w-5 h-5 md:w-6 md:h-6 text-indigo-500" /> Precificação Exata
            </h1>
            <p className="text-[10px] md:text-xs font-medium text-slate-500 uppercase tracking-widest mt-1">Descubra o custo real e defina seu lucro</p>
          </div>
          
          <div className="flex gap-2 bg-slate-100 p-1.5 rounded-lg border border-slate-200 overflow-x-auto no-scrollbar">
            {[
              { id: 'calculadora', icon: Calculator, label: 'Calculadora' },
              { id: 'insumos', icon: PackageOpen, label: 'Insumos' },
              { id: 'custos', icon: Home, label: 'Custos Fixos' },
              { id: 'equipamentos', icon: Printer, label: 'Equipamentos' },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 px-3 md:px-4 py-2 rounded-md text-[10px] md:text-xs font-bold uppercase transition-all whitespace-nowrap ${
                  activeTab === tab.id ? 'bg-white shadow-sm text-indigo-600 border border-slate-200' : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                <tab.icon size={14} /> {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 mt-6 md:mt-8">
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
    </div>
  );
}

// ==========================================
// ABA 1: CALCULADORA MÁGICA + SIMULADOR + JORNADA
// ==========================================
function TabCalculadora({ insumos, valorMinuto, valorHora, configJornada, updateJornada, horasMensais }) {
  const [tipoPrecificacao, setTipoPrecificacao] = useState('fisico'); // NOVO: Controle de Produto vs Serviço
  const [selecionados, setSelecionados] = useState([]);
  const [insumoSelecionado, setInsumoSelecionado] = useState('');
  const [quantidadeDesejada, setQuantidadeDesejada] = useState(1);
  const [tempoMinutos, setTempoMinutos] = useState(30);
  const [margemLucro, setMargemLucro] = useState(30);
  const [taxaCartao, setTaxaCartao] = useState(5);
  const [precoSimulado, setPrecoSimulado] = useState('');

  // Estados locais para a jornada antes de salvar
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

  // Matemática da Precificação
  // Se for serviço, zera os materiais e calcula só o tempo
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

  // --- LÓGICA DO SIMULADOR ---
  const valorPrecoSimulado = Number(precoSimulado) || 0;
  const taxasSimuladas = valorPrecoSimulado * (Number(taxaCartao) / 100);
  const lucroLimpoSimulado = valorPrecoSimulado - custoTotal - taxasSimuladas;
  const margemRealSimulada = valorPrecoSimulado > 0 ? (lucroLimpoSimulado / valorPrecoSimulado) * 100 : 0;

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      
      {/* LADO ESQUERDO */}
      <div className="lg:col-span-2 space-y-6">
        
        {/* --- SELEÇÃO: FÍSICO OU SERVIÇO --- */}
        <div className="flex bg-slate-200/50 p-1.5 rounded-xl border border-slate-200">
          <button 
            onClick={() => setTipoPrecificacao('fisico')}
            className={`flex-1 flex justify-center items-center gap-2 py-2.5 rounded-lg text-[11px] font-bold uppercase transition-all ${tipoPrecificacao === 'fisico' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}
          >
            <PackageOpen size={16} /> Produto Físico
          </button>
          <button 
            onClick={() => setTipoPrecificacao('servico')}
            className={`flex-1 flex justify-center items-center gap-2 py-2.5 rounded-lg text-[11px] font-bold uppercase transition-all ${tipoPrecificacao === 'servico' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}
          >
            <Palette size={16} /> Serviço / Arte Digital
          </button>
        </div>

        {/* --- PAINEL DE JORNADA DE TRABALHO --- */}
        <div className="bg-indigo-50 border border-indigo-100 p-5 rounded-xl flex flex-col md:flex-row gap-5 items-center justify-between shadow-sm">
          <div className="flex items-center gap-3">
             <div className="bg-indigo-100 p-2.5 rounded-lg text-indigo-600"><Calendar size={20} /></div>
             <div>
               <h3 className="text-xs font-black uppercase text-indigo-800 tracking-widest leading-tight">Sua Jornada de Trabalho</h3>
               <p className="text-[10px] font-medium text-indigo-600 mt-0.5">Você trabalha aprox. <span className="font-bold">{horasMensais}h por mês</span>.</p>
             </div>
          </div>
          <div className="flex items-end gap-3 w-full md:w-auto">
             <div className="space-y-1 flex-1 md:w-28">
               <label className="text-[9px] font-bold uppercase text-indigo-500 ml-0.5">Horas por Dia</label>
               <Input type="number" min="1" max="24" value={jornada.horas_por_dia} onChange={e => setJornada({...jornada, horas_por_dia: e.target.value})} className="h-10 bg-white border-indigo-200 text-xs font-bold text-center" />
             </div>
             <div className="space-y-1 flex-1 md:w-28">
               <label className="text-[9px] font-bold uppercase text-indigo-500 ml-0.5">Dias na Semana</label>
               <Input type="number" min="1" max="7" value={jornada.dias_por_semana} onChange={e => setJornada({...jornada, dias_por_semana: e.target.value})} className="h-10 bg-white border-indigo-200 text-xs font-bold text-center" />
             </div>
             <Button onClick={salvarJornada} disabled={updateJornada.isPending} className="h-10 w-10 p-0 bg-indigo-600 hover:bg-indigo-700 shadow-sm shrink-0">
               {updateJornada.isPending ? <Loader2 size={14} className="animate-spin"/> : <Save size={14}/>}
             </Button>
          </div>
        </div>

        {/* --- MATERIAIS UTILIZADOS (SÓ APARECE PARA PRODUTOS FÍSICOS) --- */}
        {tipoPrecificacao === 'fisico' && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="bg-white p-5 md:p-6 rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <h2 className="text-sm font-bold text-slate-800 uppercase tracking-widest mb-4 flex items-center gap-2">
              <PackageOpen size={16} className="text-indigo-500" /> Materiais Utilizados
            </h2>
            
            <div className="flex flex-col sm:flex-row gap-3 mb-4">
              <select 
                value={insumoSelecionado} 
                onChange={(e) => setInsumoSelecionado(e.target.value)}
                className="flex-1 h-11 border border-slate-200 rounded-md px-3 text-xs font-semibold bg-slate-50 focus:bg-white text-slate-700 outline-none"
              >
                <option value="">Selecione um Insumo...</option>
                {insumos.map(i => (
                  <option key={i.id} value={i.id}>{i.nome} ({fmt(i.custo_unitario)} / {i.unidade_medida})</option>
                ))}
              </select>
              
              <div className="flex gap-3">
                <Input 
                  type="number" 
                  min="0.01" 
                  step="0.01"
                  value={quantidadeDesejada} 
                  onChange={(e) => setQuantidadeDesejada(e.target.value)}
                  className="w-24 h-11 border-slate-200 bg-slate-50 font-bold text-center"
                />
                <Button onClick={adicionarInsumo} className="h-11 bg-indigo-600 hover:bg-indigo-700 text-white px-4 shrink-0 shadow-sm">
                  <Plus size={16} />
                </Button>
              </div>
            </div>

            <div className="bg-slate-50 rounded-lg border border-slate-100 min-h-[100px]">
              {selecionados.length === 0 ? (
                <div className="flex items-center justify-center h-full py-8 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                  Nenhum material adicionado
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {selecionados.map(item => (
                    <div key={item.id} className="flex items-center justify-between p-3 hover:bg-slate-100/50 transition-colors">
                      <div>
                        <p className="text-xs font-bold text-slate-700">{item.nome}</p>
                        <p className="text-[10px] text-slate-500 font-medium uppercase tracking-widest mt-0.5">
                          {item.quantidade} {item.unidade_medida} x {fmt(item.custo_unitario)}
                        </p>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="text-xs font-black text-slate-800">{fmt(item.custo_unitario * item.quantidade)}</span>
                        <button onClick={() => removerInsumo(item.id)} className="text-slate-400 hover:text-red-500"><Trash2 size={14} /></button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* Parâmetros de Custo e a Nova Simulação */}
        <div className="bg-white p-5 md:p-6 rounded-xl border border-slate-200 shadow-sm space-y-8">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div>
              <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1.5 flex items-center gap-1.5">
                <Clock size={12}/> Tempo {tipoPrecificacao === 'servico' ? 'do Serviço' : 'de Produção'}
              </label>
              <div className="relative">
                <Input type="number" value={tempoMinutos} onChange={(e) => setTempoMinutos(e.target.value)} className="h-11 border-slate-200 bg-slate-50 pr-12 font-bold text-slate-800 text-lg" />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold uppercase text-slate-400">Min</span>
              </div>
              <p className="text-[9px] text-slate-400 mt-1 font-medium">Sua hora custa {fmt(valorHora)}</p>
            </div>

            <div>
              <label className="text-[10px] font-bold uppercase tracking-widest text-emerald-600 mb-1.5 flex items-center gap-1.5"><DollarSign size={12}/> Margem Desejada</label>
              <div className="relative">
                <Input type="number" value={margemLucro} onChange={(e) => setMargemLucro(e.target.value)} className="h-11 border-emerald-200 bg-emerald-50 pr-8 font-black text-emerald-700 text-lg" />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm font-black text-emerald-500">%</span>
              </div>
              <p className="text-[9px] text-slate-400 mt-1 font-medium">Lucro alvo para a empresa</p>
            </div>

            <div>
              <label className="text-[10px] font-bold uppercase tracking-widest text-rose-500 mb-1.5 flex items-center gap-1.5"><AlertCircle size={12}/> Taxa (Cartão/Site)</label>
              <div className="relative">
                <Input type="number" value={taxaCartao} onChange={(e) => setTaxaCartao(e.target.value)} className="h-11 border-rose-200 bg-rose-50 pr-8 font-black text-rose-700 text-lg" />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm font-black text-rose-400">%</span>
              </div>
              <p className="text-[9px] text-slate-400 mt-1 font-medium">Descontos financeiros</p>
            </div>
          </div>

          <div className="pt-6 border-t border-slate-100">
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp className="text-blue-500 w-4 h-4" />
              <h3 className="text-xs font-black uppercase text-blue-600 tracking-widest">Simular Preço de Mercado</h3>
            </div>
            <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100 flex flex-col md:flex-row gap-4 items-center">
              <div className="w-full md:w-64">
                <label className="text-[10px] font-bold uppercase text-blue-500 ml-1 mb-1 block">Quanto você quer cobrar?</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-blue-500 font-bold text-sm">R$</span>
                  <Input 
                    type="number" 
                    placeholder="0.00"
                    value={precoSimulado} 
                    onChange={(e) => setPrecoSimulado(e.target.value)} 
                    className="h-11 bg-white border-blue-200 pl-9 font-black text-lg text-blue-800" 
                  />
                </div>
              </div>
              <div className="flex-1 text-[11px] text-blue-700 font-medium leading-relaxed">
                Use este campo para testar se um preço que você viu na concorrência ou uma oferta que deseja fazer é viável para o seu negócio sem sacrificar o seu salário.
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* LADO DIREITO: RESUMO FINANCEIRO + RESULTADO SIMULADO */}
      <div className="relative">
        <div className="bg-slate-800 rounded-2xl p-6 shadow-xl text-white sticky top-28">
          <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-6 border-b border-slate-700 pb-3">Resumo da Precificação</h3>
          
          <div className="space-y-4 mb-6">
            {tipoPrecificacao === 'fisico' && (
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-300">Custo dos Materiais</span>
                <span className="font-bold">{fmt(custoMateriais)}</span>
              </div>
            )}
            <div className="flex justify-between items-center text-sm">
              <span className="text-slate-300">Custo do Seu Tempo</span>
              <span className="font-bold">{fmt(custoMaoDeObra)}</span>
            </div>
            <div className="flex justify-between items-center text-sm pt-3 border-t border-slate-700">
              <span className="text-rose-300 font-semibold uppercase text-[10px] tracking-widest">Custo Total (Base)</span>
              <span className="font-black text-rose-400 text-lg">{fmt(custoTotal)}</span>
            </div>
          </div>

          <div className="bg-slate-900 rounded-xl p-5 mb-6 border border-slate-700">
            <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-400 mb-1">
              Preço Sugerido para {tipoPrecificacao === 'fisico' ? 'Venda' : 'o Serviço'}
            </p>
            <p className="text-4xl font-black tracking-tighter text-white">{fmt(precoSugerido)}</p>
          </div>

          <AnimatePresence>
            {valorPrecoSimulado > 0 && (
              <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="mt-4 pt-4 border-t border-slate-700 space-y-4">
                <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest text-center">Se você cobrar {fmt(valorPrecoSimulado)}:</p>
                
                <div className={`p-4 rounded-xl border flex flex-col items-center gap-1 ${lucroLimpoSimulado > 0 ? 'bg-emerald-900/30 border-emerald-500/30' : 'bg-red-900/40 border-red-500/40'}`}>
                  <span className="text-[9px] font-bold uppercase text-slate-300">Lucro Real (Livre)</span>
                  <span className={`text-2xl font-black ${lucroLimpoSimulado > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                    {lucroLimpoSimulado > 0 ? '+' : ''} {fmt(lucroLimpoSimulado)}
                  </span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${lucroLimpoSimulado > 0 ? 'bg-emerald-500 text-white' : 'bg-red-500 text-white'}`}>
                    {margemRealSimulada.toFixed(1)}% de margem
                  </span>
                </div>

                <div className="text-center">
                  {valorPrecoSimulado < precoSugerido ? (
                    <span className="text-[9px] font-bold text-amber-400 uppercase flex items-center justify-center gap-1.5">
                      <AlertCircle size={12}/> {fmt(precoSugerido - valorPrecoSimulado)} abaixo do ideal
                    </span>
                  ) : (
                    <span className="text-[9px] font-bold text-emerald-400 uppercase flex items-center justify-center gap-1.5">
                      <CheckCircle2 size={12}/> Acima da margem mínima
                    </span>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {!valorPrecoSimulado && (
            <div className="space-y-3 pt-4">
              <div className="flex justify-between items-center bg-slate-700/50 p-3 rounded-lg">
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-300">Taxas no sugerido</span>
                <span className="text-xs font-bold text-rose-300">- {fmt(valorTaxaSugerida)}</span>
              </div>
              <div className="flex justify-between items-center bg-emerald-900/30 border border-emerald-800/50 p-3 rounded-lg">
                <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-400">Lucro no sugerido</span>
                <span className="text-sm font-black text-emerald-400">+ {fmt(lucroLimpoSugerido)}</span>
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
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-6">
      <div className={`bg-white p-5 md:p-6 rounded-xl border shadow-sm transition-colors ${editingId ? 'border-blue-300 bg-blue-50/10' : 'border-slate-200'}`}>
        <div className="flex items-center justify-between mb-4">
          <h2 className={`text-sm font-bold uppercase tracking-widest flex items-center gap-2 ${editingId ? 'text-blue-600' : 'text-slate-800'}`}>
            {editingId ? <Edit3 size={16} /> : <Plus size={16} className="text-indigo-500" />} 
            {editingId ? 'Editando Insumo' : 'Cadastrar Novo Insumo'}
          </h2>
          {editingId && (
            <button onClick={cancelEdit} className="text-slate-400 hover:text-slate-600 flex items-center gap-1 text-[10px] font-bold uppercase">
              <X size={14} /> Cancelar
            </button>
          )}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-6 gap-4 items-end">
          <div className="md:col-span-2 space-y-1.5">
            <label className="text-[10px] font-bold uppercase text-slate-500 ml-1">Nome do Material</label>
            <Input placeholder="Ex: Resma Fotográfico 180g" value={novo.nome} onChange={e => setNovo({...novo, nome: e.target.value})} className="h-10 text-xs font-semibold bg-slate-50" />
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold uppercase text-slate-500 ml-1">Unidade</label>
            <select value={novo.unidade_medida} onChange={e => setNovo({...novo, unidade_medida: e.target.value})} className="w-full h-10 border border-slate-200 rounded-md px-2 text-xs font-semibold bg-slate-50 outline-none">
              <option value="unidade">Unidade</option><option value="folha">Folha</option>
              <option value="metro">Metro</option><option value="cm">Centímetro</option>
              <option value="ml">ML (Tinta)</option><option value="grama">Grama</option>
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold uppercase text-slate-500 ml-1">Qtd Pacote</label>
            <Input type="number" placeholder="Ex: 100" value={novo.quantidade_pacote} onChange={e => setNovo({...novo, quantidade_pacote: e.target.value})} className="h-10 text-xs font-semibold bg-slate-50" />
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold uppercase text-slate-500 ml-1">Custo (R$)</label>
            <Input type="number" placeholder="45.00" value={novo.custo_pacote} onChange={e => setNovo({...novo, custo_pacote: e.target.value})} className="h-10 text-xs font-semibold bg-slate-50" />
          </div>
          <div className="space-y-1.5 flex gap-2 items-end">
            <div className="flex-1">
              <label className="text-[10px] font-bold uppercase text-slate-500 ml-1">Frete (R$)</label>
              <Input type="number" placeholder="15.00" value={novo.frete} onChange={e => setNovo({...novo, frete: e.target.value})} className="h-10 text-xs font-semibold bg-slate-50" />
            </div>
            <Button onClick={handleSave} disabled={saveMutation.isPending} className={`h-10 w-10 px-0 shadow-sm ${editingId ? 'bg-blue-600 hover:bg-blue-700' : 'bg-indigo-600 hover:bg-indigo-700'}`}>
              <Save size={16} />
            </Button>
          </div>
        </div>
      </div>
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="p-4 text-[10px] font-bold uppercase tracking-widest text-slate-500">Material</th>
                <th className="p-4 text-[10px] font-bold uppercase tracking-widest text-slate-500 text-center">Pacote</th>
                <th className="p-4 text-[10px] font-bold uppercase tracking-widest text-slate-500 text-center">Valor Pago</th>
                <th className="p-4 text-[10px] font-black uppercase tracking-widest text-indigo-600 text-right">Custo Unitário</th>
                <th className="p-4"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {insumos.map(item => (
                <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="p-4 text-xs font-bold text-slate-700">{item.nome}</td>
                  <td className="p-4 text-[11px] font-semibold text-slate-500 text-center">{item.quantidade_pacote} {item.unidade_medida}s</td>
                  <td className="p-4 text-[11px] font-semibold text-slate-500 text-center">{fmt(item.custo_pacote)} {item.frete > 0 && <span className="text-[9px] text-slate-400 block">+ {fmt(item.frete)} frete</span>}</td>
                  <td className="p-4 text-sm font-black text-slate-800 text-right">{fmt(item.custo_unitario)} <span className="text-[9px] font-bold text-slate-400 uppercase">/ {item.unidade_medida}</span></td>
                  <td className="p-4 text-right whitespace-nowrap">
                    <button onClick={() => handleEdit(item)} className="text-slate-400 hover:text-blue-500 p-2 transition-colors"><Edit3 size={16}/></button>
                    <button onClick={() => { if(window.confirm('Excluir?')) onDelete(item.id); }} className="text-slate-400 hover:text-red-500 p-2 transition-colors"><Trash2 size={16}/></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {insumos.length === 0 && <div className="text-center py-10 text-xs font-bold text-slate-400 uppercase tracking-widest">Nenhum insumo cadastrado.</div>}
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
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-6">
      <div className="bg-blue-50 border border-blue-200 p-4 rounded-xl flex gap-3 text-blue-800">
        <Info size={20} className="shrink-0 mt-0.5 text-blue-500" />
        <p className="text-xs font-medium leading-relaxed">
          <strong>Trabalha de casa?</strong> Cadastre o valor total e coloque que a empresa usa uma fatia (ex: 30%). Adicione seu Pró-labore como 100% para cobrir seu salário!
        </p>
      </div>
      <div className={`bg-white p-5 md:p-6 rounded-xl border shadow-sm transition-colors ${editingId ? 'border-blue-300 bg-blue-50/10' : 'border-slate-200'}`}>
        <div className="flex items-center justify-between mb-4">
          <h2 className={`text-sm font-bold uppercase tracking-widest flex items-center gap-2 ${editingId ? 'text-blue-600' : 'text-slate-800'}`}>
            {editingId ? <Edit3 size={16} /> : <Plus size={16} className="text-indigo-500" />} 
            {editingId ? 'Editando Despesa' : 'Cadastrar Despesa Fixa'}
          </h2>
          {editingId && <button onClick={cancelEdit} className="text-slate-400 hover:text-slate-600 text-[10px] font-bold uppercase">Cancelar</button>}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold uppercase text-slate-500 ml-1">Conta / Despesa</label>
            <Input placeholder="Ex: Energia, Aluguel..." value={novo.nome} onChange={e => setNovo({...novo, nome: e.target.value})} className="h-10 text-xs font-semibold bg-slate-50" />
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold uppercase text-slate-500 ml-1">Valor Total (R$)</label>
            <Input type="number" placeholder="0.00" value={novo.valor_mensal} onChange={e => setNovo({...novo, valor_mensal: e.target.value})} className="h-10 text-xs font-semibold bg-slate-50" />
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold uppercase text-slate-500 ml-1">% Fatia Empresa</label>
            <Input type="number" min="1" max="100" value={novo.porcentagem_empresa} onChange={e => setNovo({...novo, porcentagem_empresa: e.target.value})} className="h-10 text-xs font-semibold bg-slate-50" />
          </div>
          <Button onClick={handleSave} disabled={saveMutation.isPending} className="h-10 bg-indigo-600 hover:bg-indigo-700 text-xs font-bold uppercase">Salvar</Button>
        </div>
      </div>
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="p-4 text-[10px] font-bold uppercase text-slate-500">Despesa</th>
              <th className="p-4 text-[10px] font-bold uppercase text-slate-500 text-center">Fatia Empresa</th>
              <th className="p-4 text-[10px] font-black uppercase text-rose-600 text-right">Custo Real</th>
              <th className="p-4"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {custos.map(item => (
              <tr key={item.id}>
                <td className="p-4 text-xs font-bold text-slate-700">{item.nome}</td>
                <td className="p-4 text-[11px] font-semibold text-slate-500 text-center">{item.porcentagem_empresa}%</td>
                <td className="p-4 text-sm font-black text-rose-600 text-right">{fmt(item.valor_considerado)}</td>
                <td className="p-4 text-right">
                  <button onClick={() => handleEdit(item)} className="text-slate-400 hover:text-blue-500 p-2"><Edit3 size={16}/></button>
                  <button onClick={() => onDelete(item.id)} className="text-slate-400 hover:text-red-500 p-2"><Trash2 size={16}/></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
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
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-6">
      <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl flex gap-3 text-amber-800 text-xs">
        <Info size={20} className="shrink-0 text-amber-600" />
        Guarde um pouco por mês para que, quando sua máquina pifar, a empresa já tenha o dinheiro para a nova!
      </div>
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
          <div className="space-y-1.5"><label className="text-[10px] font-bold uppercase text-slate-500 ml-1">Máquina</label><Input value={novo.nome} onChange={e => setNovo({...novo, nome: e.target.value})} className="h-10 text-xs font-semibold bg-slate-50" /></div>
          <div className="space-y-1.5"><label className="text-[10px] font-bold uppercase text-slate-500 ml-1">Valor Compra</label><Input type="number" value={novo.valor_compra} onChange={e => setNovo({...novo, valor_compra: e.target.value})} className="h-10 text-xs font-semibold bg-slate-50" /></div>
          <div className="space-y-1.5"><label className="text-[10px] font-bold uppercase text-slate-500 ml-1">Vida Útil (Meses)</label><Input type="number" value={novo.vida_util_meses} onChange={e => setNovo({...novo, vida_util_meses: e.target.value})} className="h-10 text-xs font-semibold bg-slate-50" /></div>
          <Button onClick={handleSave} className="h-10 bg-indigo-600 font-bold uppercase text-xs">Salvar</Button>
        </div>
      </div>
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="p-4 text-[10px] font-bold uppercase text-slate-500">Máquina</th>
              <th className="p-4 text-[10px] font-bold uppercase text-slate-500 text-center">Durabilidade</th>
              <th className="p-4 text-[10px] font-black uppercase text-rose-600 text-right">Desgaste Mensal</th>
              <th className="p-4"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {equipamentos.map(item => (
              <tr key={item.id}>
                <td className="p-4 text-xs font-bold text-slate-700">{item.nome}</td>
                <td className="p-4 text-xs text-slate-500 text-center">{item.vida_util_meses} meses</td>
                <td className="p-4 text-sm font-black text-rose-600 text-right">{fmt(item.depreciacao_mensal)}</td>
                <td className="p-4 text-right">
                  <button onClick={() => handleEdit(item)} className="text-slate-400 hover:text-blue-500 p-2"><Edit3 size={16}/></button>
                  <button onClick={() => onDelete(item.id)} className="text-slate-400 hover:text-red-500 p-2"><Trash2 size={16}/></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </motion.div>
  );
}