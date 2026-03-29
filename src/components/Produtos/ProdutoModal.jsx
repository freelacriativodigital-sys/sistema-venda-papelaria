import React, { useState, useRef, useEffect, useMemo } from 'react';
import { 
  ShoppingBag, Save, Trash2, Plus, X, Layers, Box, FileText, Image, GripVertical, Loader2, Star, Calculator, DollarSign, Clock
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { motion } from "framer-motion";
import { supabase } from "../../lib/supabase";
import { compressImageToBlob } from './produtosUtils';
import { useQuery } from "@tanstack/react-query";

const fmt = (v) => Number(v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

const calcularDescontoAtacado = (precoAtacado, precoBase) => {
  if (!precoBase || precoBase <= 0 || !precoAtacado || precoAtacado <= 0) return 0;
  const desconto = ((precoBase - precoAtacado) / precoBase) * 100;
  return desconto.toFixed(0);
};

export default function ProdutoModal({
  isModalOpen, setIsModalOpen, editingProduct, setEditingProduct,
  handleSave, categorias, setIsCategoryModalOpen, promoType,
  setPromoType, promoPercent, setPromoPercent
}) {
  const [drawerTab, setDrawerTab] = useState('dados');
  const [novoAtributoNome, setNovoAtributoNome] = useState('');
  const [isUploadingImages, setIsUploadingImages] = useState(false);
  const [uploadTarget, setUploadTarget] = useState(null);
  const fileInputRef = useRef(null);
  const opcaoImgRef = useRef(null);

  const { data: insumos = [] } = useQuery({ queryKey: ["insumos"], queryFn: async () => { const { data } = await supabase.from("insumos").select("*").order("nome"); return data || []; }});
  const { data: custos = [] } = useQuery({ queryKey: ["custos_fixos"], queryFn: async () => { const { data } = await supabase.from("custos_fixos").select("*"); return data || []; }});
  const { data: equipamentos = [] } = useQuery({ queryKey: ["equipamentos"], queryFn: async () => { const { data } = await supabase.from("equipamentos").select("*"); return data || []; }});
  const { data: configJornada = {} } = useQuery({ queryKey: ["configuracoes_jornada"], queryFn: async () => { const { data } = await supabase.from("configuracoes").select("horas_por_dia, dias_por_semana").eq("id", 1).single(); return data || {}; }});

  const valorMinuto = useMemo(() => {
    const horasMensais = (configJornada.horas_por_dia || 8) * (configJornada.dias_por_semana || 5) * 4;
    const somaFixos = custos.reduce((acc, curr) => acc + Number(curr.valor_considerado || 0), 0);
    const somaEquip = equipamentos.reduce((acc, curr) => acc + Number(curr.depreciacao_mensal || 0), 0);
    return horasMensais > 0 ? ((somaFixos + somaEquip) / horasMensais) / 60 : 0;
  }, [custos, equipamentos, configJornada]);

  const [receita, setReceita] = useState(editingProduct?.receita || { insumos: [], tempo_minutos: 0, margem: 30, taxa: 5 });
  const [insumoSelecionado, setInsumoSelecionado] = useState('');
  const [qtdInsumo, setQtdInsumo] = useState(1);

  useEffect(() => {
    setEditingProduct(prev => ({ ...prev, receita }));
  }, [receita]);

  const addInsumoReceita = () => {
    if (!insumoSelecionado) return;
    const item = insumos.find(i => i.id === insumoSelecionado);
    if (!item) return;
    const novoItem = { id: item.id + Date.now(), nome: item.nome, unidade_medida: item.unidade_medida, custo_unitario: Number(item.custo_unitario), quantidade: Number(qtdInsumo) };
    setReceita(prev => ({ ...prev, insumos: [...prev.insumos, novoItem] }));
    setInsumoSelecionado(''); setQtdInsumo(1);
  };

  const removeInsumoReceita = (id) => setReceita(prev => ({ ...prev, insumos: prev.insumos.filter(i => i.id !== id) }));

  const custoMateriais = receita.insumos.reduce((acc, curr) => acc + (curr.custo_unitario * curr.quantidade), 0);
  const custoMaoDeObra = receita.tempo_minutos * valorMinuto;
  const custoTotalCalculado = custoMateriais + custoMaoDeObra;

  const somaPorcentagens = (Number(receita.margem) + Number(receita.taxa)) / 100;
  const divisor = somaPorcentagens >= 1 ? 0.01 : (1 - somaPorcentagens);
  const precoSugerido = custoTotalCalculado > 0 ? custoTotalCalculado / divisor : 0;

  const aplicarCustoCalculado = () => setEditingProduct(prev => ({ ...prev, custo: Number(custoTotalCalculado.toFixed(2)) }));
  const aplicarPrecoSugerido = () => setEditingProduct(prev => ({ ...prev, preco: Number(precoSugerido.toFixed(2)) }));

  const precoBaseCalculo = editingProduct?.preco_promocional > 0 ? editingProduct.preco_promocional : (editingProduct?.preco || 0);
  const lucroReal = precoBaseCalculo - (editingProduct?.custo || 0);
  const margemReal = precoBaseCalculo > 0 ? ((lucroReal / precoBaseCalculo) * 100).toFixed(1) : 0;

  const adicionarAtributo = () => { if (!novoAtributoNome) return; const novoAtributo = { id: Date.now(), nome: novoAtributoNome, obrigatorio: true, opcoes: [{ id: Date.now() + 1, nome: 'Opção 1', preco: 0, custo: 0, imagem: null }] }; setEditingProduct(prev => ({ ...prev, variacoes: { ...prev.variacoes, atributos: [...(prev.variacoes.atributos || []), novoAtributo] } })); setNovoAtributoNome(''); };
  const adicionarOpcao = (atribId) => { setEditingProduct(prev => ({ ...prev, variacoes: { ...prev.variacoes, atributos: prev.variacoes.atributos.map(atrib => atrib.id === atribId ? { ...atrib, opcoes: [...atrib.opcoes, { id: Date.now(), nome: `Nova Opção`, preco: 0, custo: 0, imagem: null }] } : atrib) } })); };
  const removerOpcao = (atribId, opcaoId) => { setEditingProduct(prev => ({ ...prev, variacoes: { ...prev.variacoes, atributos: prev.variacoes.atributos.map(atrib => atrib.id === atribId ? { ...atrib, opcoes: atrib.opcoes.filter(o => o.id !== opcaoId) } : atrib) } })); };
  const updateOpcao = (atribId, opcaoId, field, value) => { setEditingProduct(prev => ({ ...prev, variacoes: { ...prev.variacoes, atributos: prev.variacoes.atributos.map(atrib => atrib.id === atribId ? { ...atrib, opcoes: atrib.opcoes.map(o => o.id === opcaoId ? { ...o, [field]: value } : o) } : atrib) } })); };
  const triggerOpcaoUpload = (atribId, opcaoId) => { setUploadTarget({ atribId, opcaoId }); if (opcaoImgRef.current) opcaoImgRef.current.click(); };
  const handleOpcaoImgChange = async (e) => { if (e.target.files && e.target.files[0] && uploadTarget) { const file = e.target.files[0]; const blob = await compressImageToBlob(file); const fileName = `variacao-${Date.now()}-${Math.random().toString(36).substring(7)}.webp`; const { data, error } = await supabase.storage.from('produtos').upload(fileName, blob, { contentType: 'image/webp', upsert: true }); if (error) { alert("Erro ao subir foto: " + error.message); return; } const { data: publicUrlData } = supabase.storage.from('produtos').getPublicUrl(fileName); updateOpcao(uploadTarget.atribId, uploadTarget.opcaoId, 'imagem', publicUrlData.publicUrl); } };
  const adicionarRegraAtacado = () => { setEditingProduct(prev => ({ ...prev, atacado: { ...prev.atacado, regras: [...(prev.atacado?.regras || []), { min: 1, max: null, preco: 0 }] } })); };
  const updateRegraAtacado = (index, field, value) => { setEditingProduct(prev => { const novasRegras = [...(prev.atacado?.regras || [])]; novasRegras[index] = { ...novasRegras[index], [field]: value }; return { ...prev, atacado: { ...prev.atacado, regras: novasRegras } }; }); };
  const removerRegraAtacado = (index) => { setEditingProduct(prev => { const novasRegras = prev.atacado.regras.filter((_, i) => i !== index); return { ...prev, atacado: { ...prev.atacado, regras: novasRegras } }; }); };
  const adicionarCampoPersonalizado = () => { setEditingProduct(prev => ({ ...prev, campos_personalizados: [...(prev.campos_personalizados || []), { id: Date.now(), titulo: '', tipo: 'texto_curto', obrigatorio: true }] })); };
  const updateCampoPersonalizado = (id, field, value) => { setEditingProduct(prev => ({ ...prev, campos_personalizados: prev.campos_personalizados.map(c => c.id === id ? { ...c, [field]: value } : c) })); };
  const removerCampoPersonalizado = (id) => { setEditingProduct(prev => ({ ...prev, campos_personalizados: prev.campos_personalizados.filter(c => c.id !== id) })); };

  const InfoReferencia = () => (
    <div className="grid grid-cols-3 gap-4 mb-6 p-4 bg-slate-50 border border-slate-200 rounded-lg shadow-sm">
      <div className="flex flex-col">
        <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Preço Base</span>
        <span className="text-sm font-bold text-slate-800">{fmt(editingProduct?.preco || 0)}</span>
      </div>
      <div className="flex flex-col">
        <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Promocional</span>
        <span className="text-sm font-bold text-purple-600">{editingProduct?.preco_promocional > 0 ? fmt(editingProduct.preco_promocional) : 'Não'}</span>
      </div>
      <div className="flex flex-col">
        <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Qtd Mín.</span>
        <span className="text-sm font-bold text-slate-800">{editingProduct?.qtd_minima || 1} un.</span>
      </div>
    </div>
  );

  const BlocoPrecificacao = () => (
    <div className="bg-white p-5 md:p-6 rounded-xl border border-slate-200 shadow-sm space-y-6">
      <div className="border-b border-slate-100 pb-3">
        <h3 className="text-xs font-black uppercase text-slate-800 flex items-center gap-2"><DollarSign size={16} className="text-emerald-500"/> Precificação & Valores</h3>
        <p className="text-[9px] font-medium text-slate-500 uppercase tracking-widest mt-1">Calcule o custo e defina o preço final</p>
      </div>

      <div className="bg-indigo-50/40 border border-indigo-100 p-4 md:p-5 rounded-xl space-y-4 shadow-inner">
        <div className="flex justify-between items-center mb-1">
          <h4 className="text-[10px] font-bold text-indigo-700 uppercase tracking-widest flex items-center gap-1.5"><Calculator size={14}/> Simulador de Custo</h4>
        </div>
        
        <div className="space-y-2">
          <div className="flex gap-2">
            <select value={insumoSelecionado} onChange={(e) => setInsumoSelecionado(e.target.value)} className="flex-1 h-10 border border-white rounded-md px-2 text-[10px] md:text-xs font-semibold bg-white text-slate-700 outline-none shadow-sm">
              <option value="">+ Adicionar Insumo</option>
              {insumos.map(i => <option key={i.id} value={i.id}>{i.nome} ({fmt(i.custo_unitario)})</option>)}
            </select>
            <Input type="number" min="0.01" placeholder="Qtd" value={qtdInsumo} onChange={(e) => setQtdInsumo(e.target.value)} className="w-16 h-10 bg-white border-white text-center text-xs font-bold shadow-sm" />
            <Button onClick={addInsumoReceita} className="h-10 w-10 p-0 bg-indigo-600 hover:bg-indigo-700 shadow-sm shrink-0"><Plus size={14}/></Button>
          </div>
          {receita.insumos.length > 0 && (
            <div className="bg-white/60 rounded-md p-2 space-y-1.5 border border-indigo-100/50 max-h-[120px] overflow-y-auto no-scrollbar">
              {receita.insumos.map(item => (
                <div key={item.id} className="flex justify-between items-center text-[10px] md:text-xs p-1 rounded hover:bg-white transition-colors">
                  <span className="font-semibold text-slate-700 truncate max-w-[150px] md:max-w-[200px]">{item.quantidade}x {item.nome}</span>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="font-black text-indigo-900">{fmt(item.custo_unitario * item.quantidade)}</span>
                    <button onClick={() => removeInsumoReceita(item.id)} className="text-slate-400 hover:text-red-500"><X size={12}/></button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="grid grid-cols-3 gap-2 md:gap-3">
          <div className="space-y-1.5">
            <div className="flex items-end h-4 ml-0.5">
              <label className="text-[9px] font-bold uppercase text-indigo-600 tracking-widest">Tempo (Min)</label>
            </div>
            <Input type="number" value={receita.tempo_minutos} onChange={e => setReceita({...receita, tempo_minutos: Number(e.target.value)})} className="h-9 bg-white border-white shadow-sm font-bold text-center text-xs text-indigo-900" />
          </div>
          <div className="space-y-1.5">
            <div className="flex items-end h-4 ml-0.5">
              <label className="text-[9px] font-bold uppercase text-emerald-600 tracking-widest">Margem %</label>
            </div>
            <Input type="number" value={receita.margem} onChange={e => setReceita({...receita, margem: Number(e.target.value)})} className="h-9 bg-white border-white shadow-sm font-bold text-center text-xs text-emerald-600" />
          </div>
          <div className="space-y-1.5">
            <div className="flex items-end h-4 ml-0.5">
              <label className="text-[9px] font-bold uppercase text-rose-500 tracking-widest">Taxas %</label>
            </div>
            <Input type="number" value={receita.taxa} onChange={e => setReceita({...receita, taxa: Number(e.target.value)})} className="h-9 bg-white border-white shadow-sm font-bold text-center text-xs text-rose-600" />
          </div>
        </div>

        <div className="pt-4 mt-2 border-t border-indigo-100/50 flex items-center justify-between">
          <div>
            <p className="text-[9px] font-bold uppercase text-indigo-500 tracking-widest mb-0.5">Preço Sugerido</p>
            <p className="text-lg md:text-xl font-black text-emerald-600 leading-none">{fmt(precoSugerido)}</p>
          </div>
          <div className="flex flex-col gap-1.5">
             <button onClick={() => { aplicarCustoCalculado(); aplicarPrecoSugerido(); }} className="bg-indigo-600 text-white px-3 py-2 rounded-md text-[9px] md:text-[10px] font-bold uppercase hover:bg-indigo-700 transition-colors shadow-sm">
               Aplicar Valores
             </button>
          </div>
        </div>
      </div>

      {/* VALORES REAIS NA LOJA (AGORA COM ALINHAMENTO MILIMÉTRICO) */}
      <div className="space-y-4 pt-2">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <div className="flex justify-between items-end h-5 ml-0.5 w-full">
              <label className="text-[10px] font-bold uppercase text-slate-500 tracking-widest">Custo Real Un.</label>
              {custoTotalCalculado > 0 && (
                <button onClick={aplicarCustoCalculado} className="text-[8px] font-bold text-rose-500 uppercase bg-rose-50 px-1.5 py-0.5 rounded border border-rose-100 hover:bg-rose-100 transition-colors shrink-0">
                  Usar {fmt(custoTotalCalculado)}
                </button>
              )}
            </div>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-semibold text-sm">R$</span>
              <Input type="number" value={editingProduct?.custo || ''} onChange={(e) => setEditingProduct({...editingProduct, custo: Number(e.target.value)})} className="h-11 pl-9 bg-slate-50 border-slate-200 font-bold text-sm" />
            </div>
          </div>
          
          <div className="space-y-1.5">
            <div className="flex justify-between items-end h-5 ml-0.5 w-full">
              <label className="text-[10px] font-bold uppercase text-slate-800 tracking-widest">Venda (Site)</label>
              {precoSugerido > 0 && (
                <button onClick={aplicarPrecoSugerido} className="text-[8px] font-bold text-emerald-600 uppercase bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-100 hover:bg-emerald-100 transition-colors shrink-0">
                  Usar {fmt(precoSugerido)}
                </button>
              )}
            </div>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-emerald-500 font-semibold text-sm">R$</span>
              <Input type="number" value={editingProduct?.preco || ''} onChange={(e) => setEditingProduct({...editingProduct, preco: Number(e.target.value)})} className="h-11 pl-9 bg-emerald-50/50 border-emerald-200 font-black text-emerald-700 text-lg shadow-inner focus:border-emerald-400" />
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-4 pt-2 border-t border-slate-100">
          <div className="space-y-1.5">
            <div className="flex items-end h-4 ml-0.5">
              <label className="text-[10px] font-bold uppercase text-purple-600 tracking-widest">Promoção</label>
            </div>
            <div className="flex h-11">
               <select value={promoType} onChange={(e) => { setPromoType(e.target.value); setPromoPercent(''); }} className="bg-purple-100/50 border border-purple-200 border-r-0 text-purple-700 font-bold text-[10px] rounded-l-lg px-2 outline-none cursor-pointer">
                 <option value="value">R$</option>
                 <option value="percent">%</option>
               </select>
               <input type="number" placeholder="Opcional" value={promoType === 'percent' ? promoPercent : (editingProduct?.preco_promocional || '')} onChange={(e) => { if (promoType === 'percent') { setPromoPercent(e.target.value); } else { setEditingProduct({...editingProduct, preco_promocional: Number(e.target.value)}); } }} className="w-full bg-purple-50/50 border border-purple-200 rounded-r-lg outline-none font-bold text-sm text-purple-700 focus:border-purple-400 pl-3 transition-all" />
            </div>
          </div>
          
          <div className="space-y-1.5">
            <div className="flex items-end h-4 ml-0.5">
              <label className="text-[10px] font-bold uppercase text-slate-500 tracking-widest">Qtd Mínima</label>
            </div>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-semibold text-[10px] uppercase">Un</span>
              <Input type="number" min="1" value={editingProduct?.qtd_minima || 1} onChange={(e) => setEditingProduct({...editingProduct, qtd_minima: Number(e.target.value)})} className="h-11 pl-9 bg-slate-50 border-slate-200 font-bold text-slate-800 text-sm" />
            </div>
          </div>
        </div>

        {/* Lucro Final */}
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex items-center justify-between mt-2">
           <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Lucro Estimado:</span>
           <div className="flex items-center gap-2.5">
             <span className={`text-lg font-black ${lucroReal > 0 ? 'text-emerald-500' : 'text-red-500'}`}>{fmt(lucroReal)}</span>
             <span className={`text-[9px] font-bold px-2 py-0.5 rounded uppercase ${lucroReal > 0 ? 'bg-emerald-100 text-emerald-600 border border-emerald-200' : 'bg-red-100 text-red-600 border border-red-200'}`}>{margemReal}%</span>
           </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-0 md:p-6">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsModalOpen(false)} className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" />
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="relative w-full h-full md:h-auto md:max-w-5xl bg-[#f8fafc] md:rounded-2xl shadow-2xl overflow-hidden flex flex-col md:max-h-[90vh]">
        
        {/* HEADER MODAL */}
        <div className="bg-white border-b border-slate-200 p-4 md:p-5 flex items-center justify-between gap-4 shrink-0 shadow-sm z-10 relative">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center border border-blue-100"><ShoppingBag className="text-blue-600 w-5 h-5" /></div>
            <div>
              <h2 className="text-base md:text-lg font-black text-slate-800 uppercase tracking-tight leading-none">Produto</h2>
              <p className="text-[10px] text-slate-500 font-semibold uppercase mt-1 line-clamp-1">{editingProduct?.nome || 'Novo Cadastro'}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="ghost" onClick={() => setIsModalOpen(false)} className="rounded-lg font-bold text-[10px] md:text-xs uppercase text-slate-500 h-10 md:h-11 border border-slate-200 hover:bg-slate-50 hidden sm:flex">Cancelar</Button>
            <Button onClick={handleSave} className="bg-blue-600 hover:bg-blue-700 text-white h-10 md:h-11 px-6 rounded-lg font-bold uppercase text-[10px] md:text-xs shadow-md transition-colors"><Save size={16} className="mr-1.5"/> Salvar</Button>
          </div>
        </div>

        {/* NAVEGAÇÃO DE ABAS */}
        <div className="bg-white border-b border-slate-200 px-4 py-3 shrink-0 relative z-0">
           <div className="flex gap-2 overflow-x-auto no-scrollbar whitespace-nowrap snap-x">
             {[
               { id: 'dados', label: 'Dados Básicos' }, 
               { id: 'variacoes', label: 'Variações' }, 
               { id: 'atacado', label: 'Atacado' }, 
               { id: 'personalizacao', label: 'Personalização' }
             ].map((tab) => ( 
               <button key={tab.id} onClick={() => setDrawerTab(tab.id)} className={`px-4 py-2 md:py-2.5 rounded-lg text-[10px] md:text-[11px] font-bold uppercase tracking-widest transition-all snap-start shrink-0 ${drawerTab === tab.id ? 'bg-slate-900 text-white shadow-md' : 'bg-slate-50 text-slate-500 hover:text-slate-800 hover:bg-slate-100 border border-slate-200'}`}>
                 {tab.label}
               </button>
             ))}
           </div>
        </div>

        {/* CORPO DO MODAL */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 pb-20 md:pb-6">

          {/* TAB 1: DADOS BÁSICOS (COM PRECIFICAÇÃO INTEGRADA) */}
          {drawerTab === 'dados' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 md:gap-6 animate-in fade-in duration-300">
              
              {/* LADO ESQUERDO: Dados Essenciais + Galeria + Organização */}
              <div className="lg:col-span-7 flex flex-col gap-5 md:gap-6">
                 
                 <div className="bg-white p-5 md:p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
                    <h3 className="text-xs font-black uppercase text-slate-800 border-b border-slate-100 pb-3">1. Informações Essenciais</h3>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold uppercase text-slate-500 ml-0.5 tracking-widest">Nome do Produto *</label>
                      <Input value={editingProduct?.nome || ''} onChange={(e) => setEditingProduct({...editingProduct, nome: e.target.value})} className="h-11 bg-slate-50 border-slate-200 rounded-lg font-semibold text-slate-800 text-sm focus:bg-white" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold uppercase text-slate-500 ml-0.5 tracking-widest">Descrição Detalhada</label>
                      <textarea value={editingProduct?.descricao || ''} onChange={(e) => setEditingProduct({...editingProduct, descricao: e.target.value})} placeholder="Escreva os detalhes e diferenciais do seu produto..." className="w-full min-h-[140px] p-4 bg-slate-50 border border-slate-200 rounded-lg text-xs md:text-sm font-medium text-slate-700 outline-none focus:border-blue-400 focus:bg-white transition-all resize-none leading-relaxed" />
                    </div>
                 </div>

                 {/* No Mobile, a precificação aparece aqui no meio para fluidez lógica */}
                 <div className="block lg:hidden">
                    <BlocoPrecificacao />
                 </div>

                 <div className="bg-white p-5 md:p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
                    <h3 className="text-xs font-black uppercase text-slate-800 border-b border-slate-100 pb-3">2. Galeria de Fotos</h3>
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                      {editingProduct?.imagens?.map((img, index) => (
                        <div key={index} className="relative aspect-square rounded-lg overflow-hidden border border-slate-200 group shadow-sm">
                          <img src={img} className="w-full h-full object-cover" />
                          <button onClick={() => setEditingProduct(prev => ({...prev, imagens: prev.imagens.filter((_, i) => i !== index)}))} className="absolute top-1.5 right-1.5 bg-red-500 text-white p-1.5 rounded-md opacity-0 group-hover:opacity-100 transition-all shadow-md hover:scale-105"><X size={12} /></button>
                        </div>
                      ))}
                      
                      <input type="file" ref={fileInputRef} onChange={async (e) => {
                        const files = Array.from(e.target.files);
                        setIsUploadingImages(true);
                        for (const file of files) {
                          try {
                            const blob = await compressImageToBlob(file); 
                            const fileName = `produto-${Date.now()}-${Math.random().toString(36).substring(7)}.webp`;
                            const { data, error } = await supabase.storage.from('produtos').upload(fileName, blob, { contentType: 'image/webp', upsert: true });
                            if (error) throw error;
                            const { data: publicUrlData } = supabase.storage.from('produtos').getPublicUrl(fileName);
                            setEditingProduct(prev => ({ ...prev, imagens: [...(prev.imagens || []), publicUrlData.publicUrl] }));
                          } catch (err) { alert("Erro ao subir imagem: " + err.message); }
                        }
                        setIsUploadingImages(false);
                      }} className="hidden" multiple accept="image/*" />
                      
                      <button disabled={isUploadingImages} onClick={() => fileInputRef.current.click()} className="aspect-square rounded-lg border-2 border-dashed border-slate-300 flex flex-col items-center justify-center gap-1.5 text-blue-500 hover:bg-blue-50 hover:border-blue-300 transition-all bg-slate-50">
                        {isUploadingImages ? (
                          <><Loader2 size={20} className="animate-spin text-blue-500" /><span className="text-[8px] font-bold uppercase tracking-widest text-slate-400">Enviando</span></>
                        ) : (
                          <><Plus size={24} /><span className="text-[8px] font-bold uppercase tracking-widest text-slate-400">Add Foto</span></>
                        )}
                      </button>
                    </div>
                 </div>
                 
                 <div className="bg-white p-5 md:p-6 rounded-xl border border-slate-200 shadow-sm space-y-5">
                    <h3 className="text-xs font-black uppercase text-slate-800 border-b border-slate-100 pb-3">3. Organização e Visibilidade</h3>
                    <div className="flex items-center justify-between bg-slate-50 p-4 rounded-xl border border-slate-100">
                      <div>
                         <p className="text-[11px] font-bold uppercase text-slate-800 mb-0.5">Visível no Site</p>
                         <p className="text-[9px] text-slate-500 font-medium uppercase tracking-widest">Exibir na vitrine pública</p>
                      </div>
                      <button onClick={() => setEditingProduct({...editingProduct, statusOnline: !editingProduct.statusOnline})} className={`w-12 h-6 rounded-full p-0.5 transition-all shadow-inner ${editingProduct?.statusOnline ? 'bg-emerald-500' : 'bg-slate-300'}`}>
                        <div className={`w-5 h-5 bg-white rounded-full transition-transform shadow-sm ${editingProduct?.statusOnline ? 'translate-x-6' : 'translate-x-0'}`} />
                      </button>
                    </div>
                    <div className="flex items-center justify-between bg-amber-50 p-4 rounded-xl border border-amber-100">
                      <div>
                         <p className="text-[11px] font-bold uppercase text-amber-900 mb-0.5 flex items-center gap-1.5"><Star size={12} className="text-amber-500" fill="currentColor"/> Destaque</p>
                         <p className="text-[9px] text-amber-700/70 font-medium uppercase tracking-widest">Fixar no topo do catálogo</p>
                      </div>
                      <button onClick={() => setEditingProduct({...editingProduct, destaque: !editingProduct.destaque})} className={`w-12 h-6 rounded-full p-0.5 transition-all shadow-inner ${editingProduct?.destaque ? 'bg-amber-400' : 'bg-amber-200/50'}`}>
                        <div className={`w-5 h-5 bg-white rounded-full transition-transform shadow-sm ${editingProduct?.destaque ? 'translate-x-6' : 'translate-x-0'}`} />
                      </button>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5 text-left">
                        <div className="flex justify-between items-end h-4 ml-0.5">
                          <label className="text-[10px] font-bold uppercase text-slate-500 tracking-widest">Categoria</label>
                          <button onClick={() => setIsCategoryModalOpen(true)} className="text-[9px] font-bold text-blue-600 hover:underline uppercase">Gerenciar</button>
                        </div>
                        <select value={editingProduct?.categoria || ''} onChange={(e) => setEditingProduct({...editingProduct, categoria: e.target.value})} className="w-full h-11 bg-slate-50 border border-slate-200 rounded-lg px-3 text-[10px] font-bold uppercase outline-none focus:ring-1 focus:ring-blue-400 text-slate-700">
                          {categorias.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                        </select>
                      </div>
                      <div className="space-y-1.5 text-left">
                        <div className="flex items-end h-4 ml-0.5">
                          <label className="text-[10px] font-bold uppercase text-slate-500 tracking-widest">Código SKU</label>
                        </div>
                        <Input value={editingProduct?.sku || ''} onChange={(e) => setEditingProduct({...editingProduct, sku: e.target.value})} placeholder="Ex: PROD-01" className="h-11 border-slate-200 bg-slate-50 rounded-lg font-bold uppercase text-xs" />
                      </div>
                    </div>
                 </div>
              </div>

              {/* LADO DIREITO: Precificação (Desktop Fixo) */}
              <div className="hidden lg:flex lg:col-span-5 flex-col">
                 <div className="sticky top-0">
                   <BlocoPrecificacao />
                 </div>
              </div>

            </div>
          )}

          {/* TAB 3: VARIAÇÕES */}
          {drawerTab === 'variacoes' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
              <InfoReferencia />
              <div className="bg-white p-5 md:p-6 rounded-xl border border-slate-200 shadow-sm">
                 <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100">
                    <div className="flex items-center gap-3">
                      <div className="bg-blue-50 p-2 rounded-lg"><Layers className="text-blue-600 w-5 h-5" /></div>
                      <span className="font-black text-sm uppercase tracking-widest text-slate-800">Variações do Produto</span>
                    </div>
                    <button onClick={() => setEditingProduct({...editingProduct, variacoes: {...editingProduct.variacoes, ativa: !editingProduct.variacoes?.ativa}})} className={`w-14 h-7 rounded-full p-1 transition-all shadow-inner ${editingProduct?.variacoes?.ativa ? 'bg-blue-600' : 'bg-slate-200'}`}>
                      <div className={`w-5 h-5 bg-white rounded-full shadow-sm transition-transform ${editingProduct?.variacoes?.ativa ? 'translate-x-7' : 'translate-x-0'}`} />
                    </button>
                 </div>
                 
                 {editingProduct?.variacoes?.ativa && (
                   <div className="space-y-6">
                     <input type="file" ref={opcaoImgRef} className="hidden" accept="image/*" onChange={handleOpcaoImgChange} />
                     {editingProduct.variacoes.atributos?.map((atrib) => (
                       <div key={atrib.id} className="bg-slate-50 p-4 md:p-6 rounded-xl border border-slate-200 space-y-4 md:space-y-5 shadow-sm">
                         <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
                           <div className="flex items-center gap-3 w-full sm:w-auto flex-1">
                             <GripVertical size={16} className="text-slate-300 cursor-grab shrink-0 hidden sm:block" />
                             <div className="w-full sm:max-w-sm">
                               <p className="text-[10px] font-bold uppercase text-slate-500 mb-1.5 tracking-widest ml-0.5">Nome do Atributo</p>
                               <Input 
                                 value={atrib.nome} 
                                 onChange={(e) => setEditingProduct(prev => ({
                                   ...prev, 
                                   variacoes: {
                                     ...prev.variacoes, 
                                    atributos: prev.variacoes.atributos.map(a => a.id === atrib.id ? {...a, nome: e.target.value} : a)
                                   }
                                 }))} 
                                 className="h-11 bg-white border-slate-200 text-xs font-bold uppercase text-slate-800 rounded-lg w-full shadow-sm"
                               />
                             </div>
                           </div>
                           <Button 
                             variant="destructive"
                             onClick={() => setEditingProduct(prev => ({
                               ...prev, 
                               variacoes: {
                                 ...prev.variacoes, 
                                 atributos: prev.variacoes.atributos.filter(a => a.id !== atrib.id)
                               }
                             }))} 
                             className="h-11 rounded-lg bg-red-50 text-red-600 hover:bg-red-500 hover:text-white font-bold uppercase text-[10px] md:text-[11px] gap-1.5 shadow-none border border-red-100 w-full sm:w-auto transition-colors"
                           >
                             <Trash2 size={14} /> Excluir Atributo
                           </Button>
                         </div>

                         <div className="grid grid-cols-1 gap-4">
                           {atrib.opcoes.map((opcao) => (
                             <div key={opcao.id} className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm relative flex flex-col sm:flex-row items-center gap-5 group hover:border-blue-300 transition-colors">
                               <div 
                                 onClick={() => triggerOpcaoUpload(atrib.id, opcao.id)} 
                                 className="w-16 h-16 md:w-20 md:h-20 rounded-lg bg-slate-50 border-2 border-dashed border-slate-200 flex flex-col items-center justify-center text-slate-400 cursor-pointer overflow-hidden transition-all hover:bg-blue-50 hover:border-blue-300 hover:text-blue-500 shrink-0"
                               >
                                 {opcao.imagem ? <img src={opcao.imagem} className="w-full h-full object-cover" /> : <><Image size={18} className="mb-0.5"/><span className="text-[8px] font-bold uppercase tracking-widest">Foto</span></>}
                               </div>

                               <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-4 w-full">
                                 <div className="space-y-1.5">
                                   <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-0.5">Nome da Opção</p>
                                   <Input 
                                     value={opcao.nome} 
                                     onChange={(e) => updateOpcao(atrib.id, opcao.id, 'nome', e.target.value)} 
                                     className="h-11 text-xs font-bold text-slate-800 rounded-lg bg-slate-50 focus:bg-white border-slate-200" 
                                   />
                                 </div>
                                 <div className="space-y-1.5">
                                   <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-0.5">Custo R$</p>
                                   <div className="relative">
                                     <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 font-semibold text-xs">R$</span>
                                     <Input 
                                       type="number" 
                                       value={opcao.custo} 
                                       onChange={(e) => updateOpcao(atrib.id, opcao.id, 'custo', Number(e.target.value))} 
                                       className="pl-8 h-11 text-xs font-bold text-slate-800 rounded-lg bg-slate-50 border-slate-200 focus:border-slate-300 focus:bg-white" 
                                     />
                                   </div>
                                 </div>
                                 <div className="space-y-1.5">
                                   <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-0.5 flex justify-between">
                                      <span>Preço Ajustado R$</span>
                                      {opcao.preco > 0 && editingProduct?.preco > 0 && (
                                        <span className="text-amber-500">-{calcularDescontoAtacado(opcao.preco, editingProduct.preco)}%</span>
                                      )}
                                   </p>
                                   <div className="relative">
                                     <span className="absolute left-3 top-1/2 -translate-y-1/2 text-blue-500 font-semibold text-xs">R$</span>
                                     <Input 
                                       type="number" 
                                       value={opcao.preco} 
                                       onChange={(e) => updateOpcao(atrib.id, opcao.id, 'preco', Number(e.target.value))} 
                                       className="pl-8 h-11 text-xs font-black text-blue-700 rounded-lg bg-blue-50/50 border-blue-100 focus:border-blue-300 focus:bg-white" 
                                     />
                                   </div>
                                 </div>
                               </div>

                               <button 
                                 onClick={() => removerOpcao(atrib.id, opcao.id)} 
                                 className="absolute -top-2 -right-2 p-1.5 bg-red-500 text-white rounded-lg shadow-sm transition-transform active:scale-90 hover:bg-red-600"
                               >
                                 <X size={12} />
                               </button>
                             </div>
                           ))}
                           
                           <Button 
                             onClick={() => adicionarOpcao(atrib.id)} 
                             variant="outline" 
                             className="w-full h-11 border-dashed border-2 border-slate-200 rounded-xl flex items-center justify-center gap-1.5 text-slate-500 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-300 transition-all font-bold text-[10px] uppercase mt-1 bg-white"
                           >
                             <Plus size={16} /> Adicionar Nova Opção
                           </Button>
                         </div>
                       </div>
                     ))}

                     <div className="flex flex-col gap-3 pt-6 border-t border-slate-200">
                       <p className="text-[10px] font-bold uppercase text-slate-500 tracking-widest ml-0.5">Criar Novo Grupo de Variação</p>
                       <div className="flex flex-col sm:flex-row gap-3">
                         <Input 
                           placeholder="Ex: Tamanho da Camiseta" 
                           value={novoAtributoNome} 
                           onChange={(e) => setNovoAtributoNome(e.target.value)} 
                           className="h-12 border-slate-200 bg-white rounded-lg font-bold w-full text-sm shadow-sm" 
                         />
                         <Button 
                           onClick={adicionarAtributo} 
                           className="h-12 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-bold uppercase text-[10px] md:text-xs px-8 gap-1.5 w-full sm:w-auto shadow-sm"
                         >
                           <Plus size={16} /> Adicionar Grupo
                         </Button>
                       </div>
                     </div>
                   </div>
                 )}
              </div>
            </div>
          )}

          {/* TAB 4: ATACADO */}
          {drawerTab === 'atacado' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
              <InfoReferencia />
              <div className="bg-white border border-slate-200 rounded-lg p-5 md:p-6 shadow-sm">
                <div className="flex items-center justify-between border-b border-slate-100 pb-5 mb-6">
                  <div className="flex items-center gap-3 text-slate-800">
                    <div className="bg-amber-50 p-2 rounded-lg"><Box size={20} className="text-amber-500" /></div>
                    <div>
                      <h3 className="font-black text-sm uppercase text-slate-800 tracking-widest">Preços de Atacado</h3>
                      <p className="text-[9px] text-slate-500 font-medium uppercase tracking-widest mt-0.5">Descontos automáticos por quantidade</p>
                    </div>
                  </div>
                  <button onClick={() => setEditingProduct(prev => ({...prev, atacado: {...prev.atacado, ativa: !prev.atacado?.ativa}}))} className={`w-14 h-7 rounded-full p-1 transition-all shadow-inner ${editingProduct?.atacado?.ativa ? 'bg-amber-500' : 'bg-slate-200'}`}>
                    <div className={`w-5 h-5 bg-white rounded-full shadow-sm transition-transform ${editingProduct?.atacado?.ativa ? 'translate-x-7' : 'translate-x-0'}`} />
                  </button>
                </div>

                {editingProduct?.atacado?.ativa && (
                  <div className="space-y-4">
                     {editingProduct.atacado.regras?.map((regra, idx) => (
                        <div key={idx} className="flex flex-col sm:flex-row items-center gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-sm relative group hover:border-amber-300 transition-colors">
                           <div className="flex items-center gap-3 w-full sm:w-auto bg-slate-50 p-2 rounded-lg border border-slate-100">
                              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest w-8 text-center">De</span>
                              <Input type="number" value={regra.min || ''} onChange={(e) => updateRegraAtacado(idx, 'min', Number(e.target.value))} className="w-20 text-center h-11 font-bold rounded-md bg-white border-slate-200 text-sm" />
                              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest w-8 text-center">Até</span>
                              <Input type="number" placeholder="∞" value={regra.max || ''} onChange={(e) => updateRegraAtacado(idx, 'max', e.target.value ? Number(e.target.value) : null)} className="w-20 text-center h-11 font-bold rounded-md bg-white border-slate-200 text-sm" />
                           </div>
                           
                           <div className="flex items-center gap-3 w-full sm:w-auto flex-1 mt-1 sm:mt-0 pt-3 sm:pt-0 border-t sm:border-t-0 border-slate-100 sm:pl-4">
                              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex flex-col">
                                 <span>Preço Un.</span>
                                 {regra.preco > 0 && editingProduct?.preco > 0 && (
                                   <span className="text-amber-500 lowercase mt-0.5 font-black">(-{calcularDescontoAtacado(regra.preco, editingProduct.preco)}%)</span>
                                 )}
                              </span>
                              <div className="relative w-full sm:max-w-[160px]">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-emerald-500 font-bold text-sm">R$</span>
                                <Input type="number" value={regra.preco || ''} onChange={(e) => updateRegraAtacado(idx, 'preco', Number(e.target.value))} className="pl-9 h-11 font-black text-emerald-600 text-base rounded-md bg-emerald-50/50 border-emerald-200 focus:border-emerald-400" />
                              </div>
                           </div>
                           <button onClick={() => removerRegraAtacado(idx)} className="absolute -top-3 -right-3 sm:relative sm:top-0 sm:right-0 p-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors shadow-md sm:shadow-none"><Trash2 size={16}/></button>
                        </div>
                     ))}
                     <Button onClick={adicionarRegraAtacado} variant="outline" className="w-full h-12 border-dashed border-2 border-slate-200 text-slate-500 hover:bg-amber-50 hover:text-amber-700 hover:border-amber-300 font-bold text-[10px] md:text-xs uppercase gap-2 rounded-xl mt-4 bg-white shadow-sm transition-all">
                       <Plus size={18}/> Adicionar Regra de Desconto
                     </Button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 5: PERSONALIZAÇÃO */}
          {drawerTab === 'personalizacao' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
              <div className="bg-white p-5 md:p-6 rounded-xl border border-slate-200 shadow-sm">
                 <div className="flex items-center justify-between mb-6 pb-5 border-b border-slate-100">
                    <div className="flex items-center gap-3">
                      <div className="bg-emerald-50 p-2 rounded-lg"><FileText className="text-emerald-600 w-5 h-5" /></div>
                      <div>
                        <h3 className="font-black text-sm uppercase tracking-widest text-slate-800">Campos Personalizados</h3>
                        <p className="text-[9px] text-slate-500 font-medium uppercase mt-1 tracking-widest">O que o cliente deve preencher na compra?</p>
                      </div>
                    </div>
                 </div>

                 <div className="space-y-5">
                   {editingProduct?.campos_personalizados?.map((campo) => (
                      <div key={campo.id} className="bg-slate-50 p-5 rounded-xl border border-slate-200 relative group">
                         <button onClick={() => removerCampoPersonalizado(campo.id)} className="absolute -top-3 -right-3 p-2 bg-red-500 text-white rounded-lg shadow-md hover:bg-red-600 transition-transform"><Trash2 size={14}/></button>
                         <div className="grid grid-cols-1 md:grid-cols-12 gap-4 md:gap-5">
                           <div className="md:col-span-6 space-y-1.5">
                             <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-0.5">Título da Pergunta/Campo</label>
                             <Input value={campo.titulo} onChange={(e) => updateCampoPersonalizado(campo.id, 'titulo', e.target.value)} placeholder="Ex: Qual nome colocar na capa?" className="h-11 bg-white border-slate-200 text-xs font-bold text-slate-800 rounded-lg" />
                           </div>
                           <div className="md:col-span-4 space-y-1.5">
                             <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-0.5">Tipo de Resposta</label>
                             <select value={campo.tipo} onChange={(e) => updateCampoPersonalizado(campo.id, 'tipo', e.target.value)} className="w-full h-11 border border-slate-200 rounded-lg text-xs font-bold text-slate-700 px-3 bg-white outline-none focus:border-emerald-400">
                                <option value="texto_curto">Texto Curto (Nome, etc)</option>
                                <option value="texto_longo">Texto Longo (Mensagem)</option>
                                <option value="upload">Upload de Arte/Foto</option>
                                <option value="data">Data (Evento)</option>
                                <option value="hora">Hora</option>
                             </select>
                           </div>
                           <div className="md:col-span-2 space-y-1.5 flex flex-col justify-center items-start md:items-center pt-2 md:pt-6">
                             <label className="text-[10px] font-bold text-slate-600 uppercase tracking-widest cursor-pointer flex items-center gap-2 hover:text-slate-900 transition-colors">
                               <input type="checkbox" checked={campo.obrigatorio} onChange={(e) => updateCampoPersonalizado(campo.id, 'obrigatorio', e.target.checked)} className="w-4 h-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer" />
                               Obrigatório
                             </label>
                           </div>
                         </div>
                      </div>
                   ))}
                   {(!editingProduct?.campos_personalizados || editingProduct.campos_personalizados.length === 0) && (
                     <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest text-center py-6 bg-slate-50 rounded-xl border border-dashed border-slate-200">Nenhum campo personalizado cadastrado.</p>
                   )}
                   <Button onClick={adicionarCampoPersonalizado} variant="outline" className="w-full h-12 border-dashed border-2 border-slate-200 text-slate-500 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-300 font-bold text-[10px] md:text-xs uppercase tracking-widest gap-2 rounded-xl mt-4 bg-white shadow-sm transition-all">
                     <Plus size={18}/> Adicionar Novo Campo
                   </Button>
                 </div>
              </div>
            </div>
          )}

        </div>
      </motion.div>
    </div>
  );
}