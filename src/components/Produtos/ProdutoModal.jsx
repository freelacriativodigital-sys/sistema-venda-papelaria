import React, { useState, useRef, useEffect, useMemo } from 'react';
import { 
  ShoppingBag, Save, Trash2, Plus, X, Layers, Box, FileText, Image, 
  GripVertical, Loader2, Star, Calculator, DollarSign, Clock, ArrowLeft,
  ChevronLeft, ChevronRight, ChevronUp, ChevronDown
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "../../lib/supabase";
import { compressImageToBlob, deletarImagemUnica } from './produtosUtils';
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
  setPromoType, promoPercent, setPromoPercent, bloquearOnline
}) {
  const [drawerTab, setDrawerTab] = useState('dados');
  const [novoAtributoNome, setNovoAtributoNome] = useState('');
  const [isUploadingImages, setIsUploadingImages] = useState(false);
  const fileInputRef = useRef(null);
  
  const [imageSelectorTarget, setImageSelectorTarget] = useState(null);

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

  const makeMainImage = (index) => {
    if (index === 0) return;
    setEditingProduct(prev => {
      const novasImagens = [...(prev.imagens || [])];
      const [selected] = novasImagens.splice(index, 1);
      novasImagens.unshift(selected);
      return { ...prev, imagens: novasImagens };
    });
  };

  // --- NOVAS FUNÇÕES: EXCLUSÃO E ORDENAÇÃO ---
  const handleRemoveImage = async (index, imgUrl) => {
    setEditingProduct(prev => ({...prev, imagens: prev.imagens.filter((_, i) => i !== index)}));
    if (imgUrl) {
      try {
        await deletarImagemUnica(imgUrl);
      } catch (err) {
        console.error("Erro ao limpar imagem do storage:", err);
      }
    }
  };

  const moveImage = (index, direction) => {
    setEditingProduct(prev => {
      const novasImagens = [...(prev.imagens || [])];
      if (direction === 'left' && index > 0) {
        [novasImagens[index - 1], novasImagens[index]] = [novasImagens[index], novasImagens[index - 1]];
      } else if (direction === 'right' && index < novasImagens.length - 1) {
        [novasImagens[index], novasImagens[index + 1]] = [novasImagens[index + 1], novasImagens[index]];
      }
      return { ...prev, imagens: novasImagens };
    });
  };

  const moverOpcao = (atribId, index, direction) => {
    setEditingProduct(prev => ({
      ...prev,
      variacoes: {
        ...prev.variacoes,
        atributos: prev.variacoes.atributos.map(atrib => {
          if (atrib.id === atribId) {
            const novasOpcoes = [...atrib.opcoes];
            if (direction === 'up' && index > 0) {
              [novasOpcoes[index - 1], novasOpcoes[index]] = [novasOpcoes[index], novasOpcoes[index - 1]];
            } else if (direction === 'down' && index < novasOpcoes.length - 1) {
              [novasOpcoes[index], novasOpcoes[index + 1]] = [novasOpcoes[index + 1], novasOpcoes[index]];
            }
            return { ...atrib, opcoes: novasOpcoes };
          }
          return atrib;
        })
      }
    }));
  };

  const adicionarAtributo = () => { if (!novoAtributoNome) return; const novoAtributo = { id: Date.now(), nome: novoAtributoNome, obrigatorio: true, opcoes: [{ id: Date.now() + 1, nome: 'Opção 1', preco: 0, custo: 0, imagem: null }] }; setEditingProduct(prev => ({ ...prev, variacoes: { ...prev.variacoes, atributos: [...(prev.variacoes.atributos || []), novoAtributo] } })); setNovoAtributoNome(''); };
  const adicionarOpcao = (atribId) => { setEditingProduct(prev => ({ ...prev, variacoes: { ...prev.variacoes, atributos: prev.variacoes.atributos.map(atrib => atrib.id === atribId ? { ...atrib, opcoes: [...atrib.opcoes, { id: Date.now(), nome: `Nova Opção`, preco: 0, custo: 0, imagem: null }] } : atrib) } })); };
  const removerOpcao = (atribId, opcaoId) => { setEditingProduct(prev => ({ ...prev, variacoes: { ...prev.variacoes, atributos: prev.variacoes.atributos.map(atrib => atrib.id === atribId ? { ...atrib, opcoes: atrib.opcoes.filter(o => o.id !== opcaoId) } : atrib) } })); };
  const updateOpcao = (atribId, opcaoId, field, value) => { setEditingProduct(prev => ({ ...prev, variacoes: { ...prev.variacoes, atributos: prev.variacoes.atributos.map(atrib => atrib.id === atribId ? { ...atrib, opcoes: atrib.opcoes.map(o => o.id === opcaoId ? { ...o, [field]: value } : o) } : atrib) } })); };
  
  const adicionarRegraAtacado = () => { setEditingProduct(prev => ({ ...prev, atacado: { ...prev.atacado, regras: [...(prev.atacado?.regras || []), { min: 1, max: null, preco: 0 }] } })); };
  const updateRegraAtacado = (index, field, value) => { setEditingProduct(prev => { const novasRegras = [...(prev.atacado?.regras || [])]; novasRegras[index] = { ...novasRegras[index], [field]: value }; return { ...prev, atacado: { ...prev.atacado, regras: novasRegras } }; }); };
  const removerRegraAtacado = (index) => { setEditingProduct(prev => { const novasRegras = prev.atacado.regras.filter((_, i) => i !== index); return { ...prev, atacado: { ...prev.atacado, regras: novasRegras } }; }); };
  const adicionarCampoPersonalizado = () => { setEditingProduct(prev => ({ ...prev, campos_personalizados: [...(prev.campos_personalizados || []), { id: Date.now(), titulo: '', tipo: 'texto_curto', obrigatorio: true }] })); };
  const updateCampoPersonalizado = (id, field, value) => { setEditingProduct(prev => ({ ...prev, campos_personalizados: prev.campos_personalizados.map(c => c.id === id ? { ...c, [field]: value } : c) })); };
  const removerCampoPersonalizado = (id) => { setEditingProduct(prev => ({ ...prev, campos_personalizados: prev.campos_personalizados.filter(c => c.id !== id) })); };

  const totalVariaoes = editingProduct?.variacoes?.atributos?.reduce((acc, atrib) => acc + atrib.opcoes.length, 0) || 0;
  const blockVariationPhotos = totalVariaoes > 5;
  const limiteFotosAtingido = (editingProduct?.imagens?.length || 0) >= 5;

  const renderInfoReferencia = () => (
    <div className="grid grid-cols-3 gap-3 mb-4 p-3 bg-slate-50 border border-slate-200 rounded-lg shadow-sm">
      <div className="flex flex-col">
        <span className="text-[8px] font-semibold text-slate-500 uppercase tracking-widest">Preço Base</span>
        <span className="text-xs font-semibold text-slate-800">{fmt(editingProduct?.preco || 0)}</span>
      </div>
      <div className="flex flex-col">
        <span className="text-[8px] font-semibold text-slate-500 uppercase tracking-widest">Promocional</span>
        <span className="text-xs font-semibold text-purple-600">{editingProduct?.preco_promocional > 0 ? fmt(editingProduct.preco_promocional) : 'Não'}</span>
      </div>
      <div className="flex flex-col">
        <span className="text-[8px] font-semibold text-slate-500 uppercase tracking-widest">Qtd Mín.</span>
        <span className="text-xs font-semibold text-slate-800">{editingProduct?.qtd_minima || 1} un.</span>
      </div>
    </div>
  );

  const renderBlocoPrecificacao = () => (
    <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-4">
      <div className="border-b border-slate-100 pb-2">
        <h3 className="text-[11px] font-semibold uppercase text-slate-800 flex items-center gap-1.5"><DollarSign size={14} className="text-emerald-500"/> Precificação & Valores</h3>
        <p className="text-[8px] font-medium text-slate-500 uppercase tracking-widest mt-0.5">Calcule o custo e defina o preço final</p>
      </div>

      <div className="bg-indigo-50/40 border border-indigo-100 p-3 md:p-4 rounded-xl space-y-3 shadow-inner">
        <div className="flex justify-between items-center mb-1">
          <h4 className="text-[9px] font-semibold text-indigo-700 uppercase tracking-widest flex items-center gap-1.5"><Calculator size={12}/> Simulador de Custo</h4>
        </div>
        
        <div className="space-y-2">
          <div className="flex gap-2">
            <select value={insumoSelecionado} onChange={(e) => setInsumoSelecionado(e.target.value)} className="flex-1 h-9 border border-white rounded-md px-2 text-[9px] font-medium bg-white text-slate-700 outline-none shadow-sm">
              <option value="">+ Adicionar Insumo</option>
              {insumos.map(i => <option key={i.id} value={i.id}>{i.nome} ({fmt(i.custo_unitario)})</option>)}
            </select>
            <Input type="text" inputMode="decimal" placeholder="Qtd" value={qtdInsumo} onChange={(e) => setQtdInsumo(e.target.value.replace(',', '.'))} className="w-14 h-9 bg-white border-white text-center text-[10px] font-semibold shadow-sm" />
            <Button onClick={addInsumoReceita} className="h-9 w-9 p-0 bg-indigo-600 hover:bg-indigo-700 shadow-sm shrink-0 rounded-md"><Plus size={14}/></Button>
          </div>
          {receita.insumos.length > 0 && (
            <div className="bg-white/60 rounded-md p-2 space-y-1.5 border border-indigo-100/50 max-h-[120px] overflow-y-auto no-scrollbar">
              {receita.insumos.map(item => (
                <div key={item.id} className="flex justify-between items-center text-[9px] p-1 rounded hover:bg-white transition-colors">
                  <span className="font-medium text-slate-700 truncate max-w-[150px]">{item.quantidade}x {item.nome}</span>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="font-semibold text-indigo-900">{fmt(item.custo_unitario * item.quantidade)}</span>
                    <button onClick={() => removeInsumoReceita(item.id)} className="text-slate-400 hover:text-red-500"><X size={10}/></button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="grid grid-cols-3 gap-2">
          <div className="space-y-1">
            <label className="text-[8px] font-semibold uppercase text-indigo-600 tracking-widest ml-0.5">Tempo (Min)</label>
            <Input type="text" inputMode="decimal" value={receita.tempo_minutos ?? ''} onChange={e => setReceita({...receita, tempo_minutos: e.target.value.replace(',', '.')})} className="h-9 bg-white border-white shadow-sm font-semibold text-center text-[10px] text-indigo-900" />
          </div>
          <div className="space-y-1">
            <label className="text-[8px] font-semibold uppercase text-emerald-600 tracking-widest ml-0.5">Margem %</label>
            <Input type="text" inputMode="decimal" value={receita.margem ?? ''} onChange={e => setReceita({...receita, margem: e.target.value.replace(',', '.')})} className="h-9 bg-white border-white shadow-sm font-semibold text-center text-[10px] text-emerald-600" />
          </div>
          <div className="space-y-1">
            <label className="text-[8px] font-semibold uppercase text-rose-500 tracking-widest ml-0.5">Taxas %</label>
            <Input type="text" inputMode="decimal" value={receita.taxa ?? ''} onChange={e => setReceita({...receita, taxa: e.target.value.replace(',', '.')})} className="h-9 bg-white border-white shadow-sm font-semibold text-center text-[10px] text-rose-600" />
          </div>
        </div>

        <div className="pt-3 border-t border-indigo-100/50 flex items-center justify-between">
          <div>
            <p className="text-[8px] font-semibold uppercase text-indigo-500 tracking-widest mb-0.5">Preço Sugerido</p>
            <p className="text-base font-semibold text-emerald-600 leading-none">{fmt(precoSugerido)}</p>
          </div>
          <div className="flex flex-col gap-1.5">
             <button onClick={() => { aplicarCustoCalculado(); aplicarPrecoSugerido(); }} className="bg-indigo-600 text-white px-3 py-1.5 rounded-md text-[8px] font-semibold uppercase hover:bg-indigo-700 transition-colors shadow-sm">
               Aplicar Valores
             </button>
          </div>
        </div>
      </div>

      <div className="space-y-3 pt-1">
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <div className="flex justify-between items-end ml-0.5 w-full">
              <label className="text-[9px] font-semibold uppercase text-slate-500 tracking-widest">Custo Real Un.</label>
              {custoTotalCalculado > 0 && (
                <button onClick={aplicarCustoCalculado} className="text-[7px] font-semibold text-rose-500 uppercase bg-rose-50 px-1 py-0.5 rounded border border-rose-100 hover:bg-rose-100 transition-colors shrink-0">
                  Usar {fmt(custoTotalCalculado)}
                </button>
              )}
            </div>
            <div className="relative">
              <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 font-semibold text-[10px]">R$</span>
              <Input 
                type="text" 
                inputMode="decimal" 
                value={editingProduct?.custo ?? ''} 
                onChange={(e) => setEditingProduct({...editingProduct, custo: e.target.value.replace(',', '.')})} 
                className="h-9 pl-7 bg-slate-50 border-slate-200 font-semibold text-xs" 
              />
            </div>
          </div>
          
          <div className="space-y-1">
            <div className="flex justify-between items-end ml-0.5 w-full">
              <label className="text-[9px] font-semibold uppercase text-slate-800 tracking-widest">Venda (Site)</label>
              {precoSugerido > 0 && (
                <button onClick={aplicarPrecoSugerido} className="text-[7px] font-semibold text-emerald-600 uppercase bg-emerald-50 px-1 py-0.5 rounded border border-emerald-100 hover:bg-emerald-100 transition-colors shrink-0">
                  Usar {fmt(precoSugerido)}
                </button>
              )}
            </div>
            <div className="relative">
              <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-emerald-500 font-semibold text-[10px]">R$</span>
              <Input 
                type="text" 
                inputMode="decimal" 
                value={editingProduct?.preco ?? ''} 
                onChange={(e) => setEditingProduct({...editingProduct, preco: e.target.value.replace(',', '.')})} 
                className="h-9 pl-7 bg-emerald-50/50 border-emerald-200 font-semibold text-emerald-700 text-sm shadow-inner focus:border-emerald-400" 
              />
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-100">
          <div className="space-y-1">
            <label className="text-[9px] font-semibold uppercase text-purple-600 tracking-widest ml-0.5">Promoção</label>
            <div className="flex h-9">
               <select value={promoType} onChange={(e) => { setPromoType(e.target.value); setPromoPercent(''); }} className="bg-purple-100/50 border border-purple-200 border-r-0 text-purple-700 font-semibold text-[9px] rounded-l-md px-1.5 outline-none cursor-pointer">
                 <option value="value">R$</option>
                 <option value="percent">%</option>
               </select>
               <input 
                 type="text" 
                 inputMode="decimal" 
                 placeholder="Opcional" 
                 value={promoType === 'percent' ? promoPercent : (editingProduct?.preco_promocional ?? '')} 
                 onChange={(e) => { 
                   if (promoType === 'percent') { 
                     setPromoPercent(e.target.value.replace(',', '.')); 
                   } else { 
                     setEditingProduct({...editingProduct, preco_promocional: e.target.value.replace(',', '.')}); 
                   } 
                 }} 
                 className="w-full bg-purple-50/50 border border-purple-200 rounded-r-md outline-none font-semibold text-xs text-purple-700 focus:border-purple-400 pl-2 transition-all" 
               />
            </div>
          </div>
          
          <div className="space-y-1">
            <label className="text-[9px] font-semibold uppercase text-slate-500 tracking-widest ml-0.5">Qtd Mínima</label>
            <div className="relative">
              <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 font-semibold text-[9px] uppercase">Un</span>
              <Input 
                type="number" 
                min="1" 
                value={editingProduct?.qtd_minima ?? ''} 
                onChange={(e) => setEditingProduct({...editingProduct, qtd_minima: e.target.value})} 
                className="h-9 pl-8 bg-slate-50 border-slate-200 font-semibold text-slate-800 text-xs" 
              />
            </div>
          </div>
        </div>

        <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 flex items-center justify-between mt-2">
           <span className="text-[9px] font-semibold uppercase tracking-widest text-slate-500">Lucro Estimado:</span>
           <div className="flex items-center gap-2">
             <span className={`text-sm font-semibold ${lucroReal > 0 ? 'text-emerald-500' : 'text-red-500'}`}>{fmt(lucroReal)}</span>
             <span className={`text-[8px] font-semibold px-1.5 py-0.5 rounded-full uppercase ${lucroReal > 0 ? 'bg-emerald-100 text-emerald-600 border border-emerald-200' : 'bg-red-100 text-red-600 border border-red-200'}`}>{margemReal}%</span>
           </div>
        </div>
      </div>
    </div>
  );

  return (
    <motion.div 
      initial={{ opacity: 0, x: '10%' }} 
      animate={{ opacity: 1, x: 0 }} 
      exit={{ opacity: 0, x: '10%' }} 
      transition={{ type: "spring", bounce: 0, duration: 0.4 }}
      className="fixed inset-0 z-[200] bg-[#f8fafc] overflow-y-auto flex flex-col"
    >
      
      <div className="bg-white border-b border-slate-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button onClick={() => setIsModalOpen(false)} className="w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-500 transition-colors">
              <ArrowLeft size={16} />
            </button>
            <div className="w-8 h-8 rounded-lg bg-blue-50 hidden sm:flex items-center justify-center border border-blue-100">
               <ShoppingBag className="text-blue-600 w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm md:text-base font-semibold text-slate-800 uppercase tracking-tight leading-none">Produto</h2>
              <p className="text-[9px] text-slate-500 font-semibold uppercase mt-0.5 tracking-widest line-clamp-1">{editingProduct?.nome || 'Novo Cadastro'}</p>
            </div>
          </div>
          <Button onClick={handleSave} className="bg-blue-600 hover:bg-blue-700 text-white h-9 px-6 rounded-md font-semibold uppercase text-[10px] shadow-sm transition-colors">
            <Save size={14} className="mr-1.5"/> Salvar
          </Button>
        </div>

        <div className="hidden md:flex max-w-6xl mx-auto px-4 gap-2 overflow-x-auto no-scrollbar whitespace-nowrap pt-1">
           {[
             { id: 'dados', label: 'Dados Básicos' }, 
             { id: 'variacoes', label: 'Variações' }, 
             { id: 'atacado', label: 'Atacado' }, 
             { id: 'personalizacao', label: 'Personalização' }
           ].map((tab) => ( 
             <button key={tab.id} onClick={() => setDrawerTab(tab.id)} className={`px-4 py-2.5 rounded-t-lg text-[9px] md:text-[10px] font-semibold uppercase tracking-widest transition-all shrink-0 border border-b-0 ${drawerTab === tab.id ? 'bg-slate-800 text-white border-slate-800' : 'bg-transparent text-slate-500 border-transparent hover:text-slate-800 hover:bg-slate-100'}`}>
               {tab.label}
             </button>
           ))}
        </div>
      </div>

      <div className="flex-1 w-full max-w-6xl mx-auto p-4 pb-[80px] md:pb-24">

        {drawerTab === 'dados' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 md:gap-5 animate-in fade-in duration-300">
            
            <div className="lg:col-span-7 flex flex-col gap-4">
               
               <div className="bg-white p-4 md:p-5 rounded-xl border border-slate-200 shadow-sm space-y-3">
                  <h3 className="text-[11px] font-semibold uppercase text-slate-800 border-b border-slate-100 pb-2">1. Informações Essenciais</h3>
                  <div className="space-y-1">
                    <label className="text-[9px] font-semibold uppercase text-slate-500 ml-0.5 tracking-widest">Nome do Produto *</label>
                    <Input value={editingProduct?.nome || ''} onChange={(e) => setEditingProduct({...editingProduct, nome: e.target.value})} className="h-9 bg-slate-50 border-slate-200 rounded-md font-medium text-slate-800 text-xs focus:bg-white" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-semibold uppercase text-slate-500 ml-0.5 tracking-widest">Descrição Detalhada</label>
                    <textarea value={editingProduct?.descricao || ''} onChange={(e) => setEditingProduct({...editingProduct, descricao: e.target.value})} placeholder="Escreva os detalhes e diferenciais do seu produto..." className="w-full min-h-[100px] p-3 bg-slate-50 border border-slate-200 rounded-md text-[11px] md:text-xs font-medium text-slate-700 outline-none focus:border-blue-400 focus:bg-white transition-all resize-none leading-relaxed" />
                  </div>
               </div>

               <div className="block lg:hidden">
                  {renderBlocoPrecificacao()}
               </div>

               <div className="bg-white p-4 md:p-5 rounded-xl border border-slate-200 shadow-sm space-y-3">
                  <h3 className="text-[11px] font-semibold uppercase text-slate-800 border-b border-slate-100 pb-2 flex items-center justify-between">
                    <span>2. Galeria de Fotos</span>
                    <span className="text-[9px] font-medium text-slate-500">{editingProduct?.imagens?.length || 0}/5</span>
                  </h3>
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                    {editingProduct?.imagens?.map((img, index) => (
                      <div key={index} className="relative aspect-square rounded-md overflow-hidden border border-slate-200 group shadow-sm">
                        <img src={img} className="w-full h-full object-cover" />
                        
                        <button onClick={() => handleRemoveImage(index, img)} className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded opacity-0 group-hover:opacity-100 transition-all shadow-md hover:scale-105 z-10"><X size={10} /></button>
                        
                        {/* SETAS DE ORDENAÇÃO */}
                        <div className="absolute top-1 left-1 flex gap-1 opacity-0 group-hover:opacity-100 transition-all z-10">
                          {index > 0 && (
                            <button onClick={() => moveImage(index, 'left')} className="bg-slate-900/70 text-white p-1 rounded hover:bg-blue-600 shadow-md">
                              <ChevronLeft size={10} />
                            </button>
                          )}
                          {index < (editingProduct?.imagens?.length || 0) - 1 && (
                            <button onClick={() => moveImage(index, 'right')} className="bg-slate-900/70 text-white p-1 rounded hover:bg-blue-600 shadow-md">
                              <ChevronRight size={10} />
                            </button>
                          )}
                        </div>
                        
                        {index === 0 ? (
                           <span className="absolute bottom-1 left-1 bg-blue-600 text-white text-[7px] px-1.5 py-0.5 rounded font-bold uppercase tracking-widest shadow-sm">Principal</span>
                        ) : (
                           <button onClick={() => makeMainImage(index)} className="absolute bottom-1 left-1 bg-slate-900/70 hover:bg-blue-600 text-white text-[7px] px-1.5 py-0.5 rounded font-bold uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-all shadow-sm">
                             Definir Principal
                           </button>
                        )}
                      </div>
                    ))}
                    
                    <input type="file" ref={fileInputRef} onChange={async (e) => {
                      const files = Array.from(e.target.files);
                      const currentCount = editingProduct?.imagens?.length || 0;
                      const available = 5 - currentCount;
                      
                      if (available <= 0) return alert("Limite máximo de 5 fotos atingido.");
                      const filesToUpload = files.slice(0, available);
                      
                      setIsUploadingImages(true);
                      for (const file of filesToUpload) {
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
                    
                    <button disabled={isUploadingImages || limiteFotosAtingido} onClick={() => { if(!limiteFotosAtingido) fileInputRef.current.click() }} className={`aspect-square rounded-md border border-dashed border-slate-300 flex flex-col items-center justify-center gap-1 transition-all bg-slate-50 ${limiteFotosAtingido ? 'opacity-50 cursor-not-allowed text-slate-400' : 'text-blue-500 hover:bg-blue-50 hover:border-blue-300'}`}>
                      {isUploadingImages ? (
                        <><Loader2 size={16} className="animate-spin text-blue-500" /><span className="text-[7px] font-semibold uppercase tracking-widest text-slate-400">Enviando</span></>
                      ) : (
                        <><Plus size={20} /><span className="text-[7px] font-semibold uppercase tracking-widest text-center leading-tight">{limiteFotosAtingido ? 'Limite\nAtingido' : 'Add Foto'}</span></>
                      )}
                    </button>
                  </div>
               </div>
               
               <div className="bg-white p-4 md:p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
                  <h3 className="text-[11px] font-semibold uppercase text-slate-800 border-b border-slate-100 pb-2">3. Organização e Visibilidade</h3>
                  <div className="flex items-center justify-between bg-slate-50 p-3 rounded-lg border border-slate-100">
                    <div>
                       <p className="text-[10px] font-semibold uppercase text-slate-800 mb-0.5">Visível no Site</p>
                       <p className="text-[8px] text-slate-500 font-medium uppercase tracking-widest">Exibir na vitrine pública</p>
                    </div>
                    <button onClick={() => {
                        if (!editingProduct.statusOnline && bloquearOnline) {
                           return alert("Limite de 80 produtos online atingido! Desative algum na vitrine primeiro.");
                        }
                        setEditingProduct({...editingProduct, statusOnline: !editingProduct.statusOnline})
                    }} className={`w-10 h-5 rounded-full p-0.5 transition-all shadow-inner ${editingProduct?.statusOnline ? 'bg-emerald-500' : 'bg-slate-300'}`}>
                      <div className={`w-4 h-4 bg-white rounded-full transition-transform shadow-sm ${editingProduct?.statusOnline ? 'translate-x-5' : 'translate-x-0'}`} />
                    </button>
                  </div>
                  <div className="flex items-center justify-between bg-amber-50 p-3 rounded-lg border border-amber-100">
                    <div>
                       <p className="text-[10px] font-semibold uppercase text-amber-900 mb-0.5 flex items-center gap-1.5"><Star size={10} className="text-amber-500" fill="currentColor"/> Destaque</p>
                       <p className="text-[8px] text-amber-700/70 font-medium uppercase tracking-widest">Fixar no topo do catálogo</p>
                    </div>
                    <button onClick={() => setEditingProduct({...editingProduct, destaque: !editingProduct.destaque})} className={`w-10 h-5 rounded-full p-0.5 transition-all shadow-inner ${editingProduct?.destaque ? 'bg-amber-400' : 'bg-amber-200/50'}`}>
                      <div className={`w-4 h-4 bg-white rounded-full transition-transform shadow-sm ${editingProduct?.destaque ? 'translate-x-5' : 'translate-x-0'}`} />
                    </button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1 text-left">
                      <div className="flex justify-between items-end h-4 ml-0.5">
                        <label className="text-[9px] font-semibold uppercase text-slate-500 tracking-widest">Categoria</label>
                        <button onClick={() => setIsCategoryModalOpen(true)} className="text-[8px] font-semibold text-blue-600 hover:underline uppercase tracking-widest">Gerenciar</button>
                      </div>
                      <select value={editingProduct?.categoria || ''} onChange={(e) => setEditingProduct({...editingProduct, categoria: e.target.value})} className="w-full h-9 bg-slate-50 border border-slate-200 rounded-md px-2 text-[9px] font-semibold uppercase outline-none focus:border-blue-400 text-slate-700">
                        {categorias.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                      </select>
                    </div>
                    <div className="space-y-1 text-left">
                      <div className="flex items-end h-4 ml-0.5">
                        <label className="text-[9px] font-semibold uppercase text-slate-500 tracking-widest">Código SKU</label>
                      </div>
                      <Input value={editingProduct?.sku || ''} onChange={(e) => setEditingProduct({...editingProduct, sku: e.target.value})} placeholder="Ex: PROD-01" className="h-9 border-slate-200 bg-slate-50 rounded-md font-semibold uppercase text-[10px]" />
                    </div>
                  </div>
               </div>
            </div>

            <div className="hidden lg:flex lg:col-span-5 flex-col">
               <div className="sticky top-24">
                 {renderBlocoPrecificacao()}
               </div>
            </div>

          </div>
        )}

        {drawerTab === 'variacoes' && (
          <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
            {renderInfoReferencia()}
            <div className="bg-white p-4 md:p-5 rounded-xl border border-slate-200 shadow-sm">
               <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <div className="bg-blue-50 p-1.5 rounded-lg"><Layers className="text-blue-600 w-4 h-4" /></div>
                    <span className="font-semibold text-xs uppercase tracking-widest text-slate-800">Variações do Produto</span>
                  </div>
                  <button onClick={() => setEditingProduct({...editingProduct, variacoes: {...editingProduct.variacoes, ativa: !editingProduct.variacoes?.ativa}})} className={`w-10 h-5 rounded-full p-0.5 transition-all shadow-inner ${editingProduct?.variacoes?.ativa ? 'bg-blue-600' : 'bg-slate-200'}`}>
                    <div className={`w-4 h-4 bg-white rounded-full shadow-sm transition-transform ${editingProduct?.variacoes?.ativa ? 'translate-x-5' : 'translate-x-0'}`} />
                  </button>
               </div>
               
               {editingProduct?.variacoes?.ativa && (
                 <div className="space-y-4">
                   
                   {blockVariationPhotos && (
                      <div className="bg-amber-50 border border-amber-200 p-3 rounded-lg mb-4 flex items-start gap-2">
                        <Star size={16} className="text-amber-500 shrink-0 mt-0.5" />
                        <p className="text-[10px] text-amber-800 font-medium">Você tem mais de 5 variações cadastradas. Para economizar tráfego, a troca de fotos individuais foi desativada.</p>
                      </div>
                   )}

                   {editingProduct.variacoes.atributos?.map((atrib) => (
                     <div key={atrib.id} className="bg-slate-50 p-3 md:p-4 rounded-xl border border-slate-200 space-y-3 shadow-sm">
                       <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-200 pb-3">
                         <div className="flex items-center gap-2 w-full sm:w-auto flex-1">
                           <GripVertical size={14} className="text-slate-300 cursor-grab shrink-0 hidden sm:block" />
                           <div className="w-full sm:max-w-xs">
                             <p className="text-[9px] font-semibold uppercase text-slate-500 mb-1 tracking-widest ml-0.5">Nome do Atributo</p>
                             <Input 
                               value={atrib.nome} 
                               onChange={(e) => setEditingProduct(prev => ({
                                 ...prev, 
                                 variacoes: {
                                   ...prev.variacoes, 
                                  atributos: prev.variacoes.atributos.map(a => a.id === atrib.id ? {...a, nome: e.target.value} : a)
                                 }
                               }))} 
                               className="h-9 bg-white border-slate-200 text-[10px] font-semibold uppercase text-slate-800 rounded-md w-full shadow-sm"
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
                           className="h-9 rounded-md bg-red-50 text-red-600 hover:bg-red-500 hover:text-white font-semibold uppercase text-[9px] gap-1 shadow-none border border-red-100 w-full sm:w-auto transition-colors"
                         >
                           <Trash2 size={12} /> Excluir Atributo
                         </Button>
                       </div>

                       <div className="grid grid-cols-1 gap-3">
                         {atrib.opcoes.map((opcao, idx) => (
                           <div key={opcao.id} className="bg-white border border-slate-200 rounded-xl p-3 shadow-sm relative flex flex-col sm:flex-row items-center gap-4 group hover:border-blue-300 transition-colors">
                             
                             {/* CONTROLES DE ORDENAÇÃO E EXCLUSÃO (TOPO DIREITO) */}
                             <div className="absolute -top-2 -right-2 flex items-center gap-1 z-10">
                               {idx > 0 && (
                                 <button onClick={() => moverOpcao(atrib.id, idx, 'up')} className="p-1 bg-slate-200 text-slate-600 rounded-md shadow-sm transition-transform active:scale-90 hover:bg-slate-300">
                                   <ChevronUp size={10} />
                                 </button>
                               )}
                               {idx < atrib.opcoes.length - 1 && (
                                 <button onClick={() => moverOpcao(atrib.id, idx, 'down')} className="p-1 bg-slate-200 text-slate-600 rounded-md shadow-sm transition-transform active:scale-90 hover:bg-slate-300">
                                   <ChevronDown size={10} />
                                 </button>
                               )}
                               <button onClick={() => removerOpcao(atrib.id, opcao.id)} className="p-1 bg-red-500 text-white rounded-md shadow-sm transition-transform active:scale-90 hover:bg-red-600">
                                 <X size={10} />
                               </button>
                             </div>

                             {blockVariationPhotos ? (
                                <div title="Bloqueado: Máximo de 5 variações para usar fotos" className="w-14 h-14 md:w-16 md:h-16 rounded-md bg-slate-100 border border-dashed border-slate-300 flex flex-col items-center justify-center text-slate-400 opacity-50 cursor-not-allowed shrink-0">
                                   <Image size={14} className="mb-0.5"/>
                                   <span className="text-[7px] font-semibold uppercase tracking-widest text-center leading-tight">Foto<br/>Bloqueada</span>
                                </div>
                             ) : (
                                <div onClick={() => setImageSelectorTarget({ atribId: atrib.id, opcaoId: opcao.id })} className="w-14 h-14 md:w-16 md:h-16 rounded-md bg-slate-50 border border-dashed border-slate-200 flex flex-col items-center justify-center text-slate-400 cursor-pointer overflow-hidden transition-all hover:bg-blue-50 hover:border-blue-300 hover:text-blue-500 shrink-0">
                                  {opcao.imagem ? <img src={opcao.imagem} className="w-full h-full object-cover" /> : <><Image size={14} className="mb-0.5"/><span className="text-[7px] font-semibold uppercase tracking-widest text-center leading-tight">Escolher<br/>Foto</span></>}
                                </div>
                             )}

                             <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-3 w-full mt-2 sm:mt-0">
                               <div className="space-y-1">
                                 <p className="text-[9px] font-semibold text-slate-500 uppercase tracking-widest ml-0.5">Nome da Opção</p>
                                 <Input 
                                   value={opcao.nome} 
                                   onChange={(e) => updateOpcao(atrib.id, opcao.id, 'nome', e.target.value)} 
                                   className="h-9 text-[10px] font-semibold text-slate-800 rounded-md bg-slate-50 focus:bg-white border-slate-200" 
                                 />
                               </div>
                               <div className="space-y-1">
                                 <p className="text-[9px] font-semibold text-slate-500 uppercase tracking-widest ml-0.5">Custo R$</p>
                                 <div className="relative">
                                   <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500 font-medium text-[10px]">R$</span>
                                   <Input 
                                     type="text" 
                                     inputMode="decimal"
                                     value={opcao.custo ?? ''} 
                                     onChange={(e) => updateOpcao(atrib.id, opcao.id, 'custo', e.target.value.replace(',', '.'))} 
                                     className="pl-7 h-9 text-[10px] font-semibold text-slate-800 rounded-md bg-slate-50 border-slate-200 focus:border-slate-300 focus:bg-white" 
                                   />
                                 </div>
                               </div>
                               <div className="space-y-1">
                                 <p className="text-[9px] font-semibold text-slate-500 uppercase tracking-widest ml-0.5 flex justify-between">
                                    <span>Preço Ajustado R$</span>
                                    {opcao.preco > 0 && editingProduct?.preco > 0 && (
                                      <span className="text-amber-500">-{calcularDescontoAtacado(opcao.preco, editingProduct.preco)}%</span>
                                    )}
                                 </p>
                                 <div className="relative">
                                   <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-blue-500 font-medium text-[10px]">R$</span>
                                   <Input 
                                     type="text" 
                                     inputMode="decimal"
                                     value={opcao.preco ?? ''} 
                                     onChange={(e) => updateOpcao(atrib.id, opcao.id, 'preco', e.target.value.replace(',', '.'))} 
                                     className="pl-7 h-9 text-[10px] font-semibold text-blue-700 rounded-md bg-blue-50/50 border-blue-100 focus:border-blue-300 focus:bg-white" 
                                   />
                                 </div>
                               </div>
                             </div>

                           </div>
                         ))}
                         
                         <Button 
                           onClick={() => adicionarOpcao(atrib.id)} 
                           variant="outline" 
                           className="w-full h-9 border-dashed border border-slate-200 rounded-lg flex items-center justify-center gap-1.5 text-slate-500 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-300 transition-all font-semibold text-[9px] uppercase mt-1 bg-white"
                         >
                           <Plus size={12} /> Nova Opção
                         </Button>
                       </div>
                     </div>
                   ))}

                   <div className="flex flex-col gap-2 pt-4 border-t border-slate-200">
                     <p className="text-[9px] font-semibold uppercase text-slate-500 tracking-widest ml-0.5">Criar Novo Grupo de Variação</p>
                     <div className="flex flex-col sm:flex-row gap-2">
                       <Input 
                         placeholder="Ex: Tamanho da Camiseta" 
                         value={novoAtributoNome} 
                         onChange={(e) => setNovoAtributoNome(e.target.value)} 
                         className="h-9 border-slate-200 bg-white rounded-md font-semibold w-full text-xs shadow-sm" 
                       />
                       <Button 
                         onClick={adicionarAtributo} 
                         className="h-9 bg-slate-900 hover:bg-slate-800 text-white rounded-md font-semibold uppercase text-[9px] px-6 gap-1 w-full sm:w-auto shadow-sm"
                       >
                         <Plus size={14} /> Add Grupo
                       </Button>
                     </div>
                   </div>
                 </div>
               )}
            </div>
          </div>
        )}

        {drawerTab === 'atacado' && (
          <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
            {renderInfoReferencia()}
            <div className="bg-white border border-slate-200 rounded-xl p-4 md:p-5 shadow-sm">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
                <div className="flex items-center gap-2.5 text-slate-800">
                  <div className="bg-amber-50 p-1.5 rounded-lg"><Box size={16} className="text-amber-500" /></div>
                  <div>
                    <h3 className="font-semibold text-xs uppercase text-slate-800 tracking-widest">Preços de Atacado</h3>
                    <p className="text-[8px] text-slate-500 font-medium uppercase tracking-widest mt-0.5">Descontos automáticos por quantidade</p>
                  </div>
                </div>
                <button onClick={() => setEditingProduct(prev => ({...prev, atacado: {...prev.atacado, ativa: !prev.atacado?.ativa}}))} className={`w-10 h-5 rounded-full p-0.5 transition-all shadow-inner ${editingProduct?.atacado?.ativa ? 'bg-amber-500' : 'bg-slate-200'}`}>
                  <div className={`w-4 h-4 bg-white rounded-full shadow-sm transition-transform ${editingProduct?.atacado?.ativa ? 'translate-x-5' : 'translate-x-0'}`} />
                </button>
              </div>

              {editingProduct?.atacado?.ativa && (
                <div className="space-y-3">
                   {editingProduct.atacado.regras?.map((regra, idx) => (
                      <div key={idx} className="flex flex-col sm:flex-row items-center gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-sm relative group hover:border-amber-300 transition-colors">
                         <div className="flex items-center gap-2 w-full sm:w-auto bg-slate-50 p-1.5 rounded-md border border-slate-100">
                            <span className="text-[9px] font-semibold text-slate-500 uppercase tracking-widest w-6 text-center">De</span>
                            <Input type="number" value={regra.min ?? ''} onChange={(e) => updateRegraAtacado(idx, 'min', e.target.value)} className="w-16 text-center h-9 font-semibold rounded bg-white border-slate-200 text-[10px]" />
                            <span className="text-[9px] font-semibold text-slate-500 uppercase tracking-widest w-6 text-center">Até</span>
                            <Input type="number" placeholder="∞" value={regra.max ?? ''} onChange={(e) => updateRegraAtacado(idx, 'max', e.target.value ? e.target.value : null)} className="w-16 text-center h-9 font-semibold rounded bg-white border-slate-200 text-[10px]" />
                         </div>
                         
                         <div className="flex items-center gap-2 w-full sm:w-auto flex-1 mt-1 sm:mt-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100 sm:pl-3">
                            <span className="text-[9px] font-semibold text-slate-500 uppercase tracking-widest flex flex-col">
                               <span>Preço Un.</span>
                               {regra.preco > 0 && editingProduct?.preco > 0 && (
                                 <span className="text-amber-500 lowercase mt-0.5">(-{calcularDescontoAtacado(regra.preco, editingProduct.preco)}%)</span>
                               )}
                            </span>
                            <div className="relative w-full sm:max-w-[140px]">
                              <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-emerald-500 font-semibold text-[10px]">R$</span>
                              <Input 
                                type="text" 
                                inputMode="decimal"
                                value={regra.preco ?? ''} 
                                onChange={(e) => updateRegraAtacado(idx, 'preco', e.target.value.replace(',', '.'))} 
                                className="pl-7 h-9 font-semibold text-emerald-600 text-[11px] rounded-md bg-emerald-50/50 border-emerald-200 focus:border-emerald-400" 
                              />
                            </div>
                         </div>
                         <button onClick={() => removerRegraAtacado(idx)} className="absolute -top-2 -right-2 sm:relative sm:top-0 sm:right-0 p-1.5 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors shadow-sm sm:shadow-none"><Trash2 size={12}/></button>
                      </div>
                   ))}
                   <Button onClick={adicionarRegraAtacado} variant="outline" className="w-full h-9 border-dashed border border-slate-200 text-slate-500 hover:bg-amber-50 hover:text-amber-700 hover:border-amber-300 font-semibold text-[9px] uppercase gap-1.5 rounded-lg mt-2 bg-white shadow-sm transition-all">
                     <Plus size={14}/> Adicionar Regra de Desconto
                   </Button>
                </div>
              )}
            </div>
          </div>
        )}

        {drawerTab === 'personalizacao' && (
          <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="bg-white p-4 md:p-5 rounded-xl border border-slate-200 shadow-sm">
               <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <div className="bg-emerald-50 p-1.5 rounded-lg"><FileText className="text-emerald-600 w-4 h-4" /></div>
                    <div>
                      <h3 className="font-semibold text-xs uppercase tracking-widest text-slate-800">Campos Personalizados</h3>
                      <p className="text-[8px] text-slate-500 font-medium uppercase mt-0.5 tracking-widest">O que preencher na compra?</p>
                    </div>
                  </div>
               </div>

               <div className="space-y-4">
                 {editingProduct?.campos_personalizados?.map((campo) => (
                    <div key={campo.id} className="bg-slate-50 p-4 rounded-xl border border-slate-200 relative group">
                       <button onClick={() => removerCampoPersonalizado(campo.id)} className="absolute -top-2 -right-2 p-1.5 bg-red-500 text-white rounded-md shadow-sm hover:bg-red-600 transition-transform"><Trash2 size={12}/></button>
                       <div className="grid grid-cols-1 md:grid-cols-12 gap-3 md:gap-4">
                         <div className="md:col-span-6 space-y-1">
                           <label className="text-[9px] font-semibold text-slate-500 uppercase tracking-widest ml-0.5">Título da Pergunta/Campo</label>
                           <Input value={campo.titulo} onChange={(e) => updateCampoPersonalizado(campo.id, 'titulo', e.target.value)} placeholder="Ex: Nome na capa?" className="h-9 bg-white border-slate-200 text-[10px] font-semibold text-slate-800 rounded-md" />
                         </div>
                         <div className="md:col-span-4 space-y-1">
                           <label className="text-[9px] font-semibold text-slate-500 uppercase tracking-widest ml-0.5">Tipo de Resposta</label>
                           <select value={campo.tipo} onChange={(e) => updateCampoPersonalizado(campo.id, 'tipo', e.target.value)} className="w-full h-9 border border-slate-200 rounded-md text-[10px] font-semibold text-slate-700 px-2 bg-white outline-none focus:border-emerald-400">
                              <option value="texto_curto">Texto Curto (Nome, etc)</option>
                              <option value="texto_longo">Texto Longo (Mensagem)</option>
                              <option value="data">Data (Evento)</option>
                              <option value="hora">Hora</option>
                           </select>
                         </div>
                         <div className="md:col-span-2 space-y-1 flex flex-col justify-center items-start md:items-center pt-1 md:pt-4">
                           <label className="text-[9px] font-semibold text-slate-600 uppercase tracking-widest cursor-pointer flex items-center gap-1.5 hover:text-slate-900 transition-colors">
                             <input type="checkbox" checked={campo.obrigatorio} onChange={(e) => updateCampoPersonalizado(campo.id, 'obrigatorio', e.target.checked)} className="w-3.5 h-3.5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer" />
                             Obrigatório
                           </label>
                         </div>
                       </div>
                    </div>
                 ))}
                 {(!editingProduct?.campos_personalizados || editingProduct.campos_personalizados.length === 0) && (
                   <p className="text-[9px] text-slate-400 font-semibold uppercase tracking-widest text-center py-4 bg-slate-50 rounded-lg border border-dashed border-slate-200">Nenhum campo personalizado cadastrado.</p>
                 )}
                 <Button onClick={adicionarCampoPersonalizado} variant="outline" className="w-full h-9 border-dashed border border-slate-200 text-slate-500 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-300 font-semibold text-[9px] uppercase tracking-widest gap-1.5 rounded-lg mt-2 bg-white shadow-sm transition-all">
                   <Plus size={14}/> Novo Campo
                 </Button>
               </div>
            </div>
          </div>
        )}

      </div>

      <div className="md:hidden fixed bottom-0 inset-x-0 h-[64px] bg-white border-t border-slate-200 flex items-center justify-around z-[100] pb-safe shadow-[0_-5px_15px_rgba(0,0,0,0.03)]">
        {[
          { id: 'dados', icon: ShoppingBag, label: 'Dados' },
          { id: 'variacoes', icon: Layers, label: 'Variações' },
          { id: 'atacado', icon: Box, label: 'Atacado' },
          { id: 'personalizacao', icon: FileText, label: 'Campos' }
        ].map(tab => (
          <button 
            key={tab.id} 
            onClick={() => setDrawerTab(tab.id)} 
            className={`flex flex-col items-center justify-center flex-1 h-full gap-1 transition-colors ${drawerTab === tab.id ? 'text-blue-600' : 'text-slate-400 hover:text-slate-600'}`}
          >
             <tab.icon size={18} className={drawerTab === tab.id ? 'animate-pulse' : ''} />
             <span className="text-[8px] font-semibold uppercase tracking-wider">{tab.label}</span>
          </button>
        ))}
      </div>

      <AnimatePresence>
        {imageSelectorTarget && (
           <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setImageSelectorTarget(null)} className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" />
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="relative w-full max-w-md bg-white rounded-xl shadow-xl overflow-hidden p-5">
                 <div className="flex justify-between items-center mb-4">
                   <h3 className="font-semibold text-sm uppercase tracking-tight text-slate-800">Escolha a Foto da Variação</h3>
                   <button onClick={() => setImageSelectorTarget(null)} className="bg-slate-50 p-1.5 rounded-md hover:bg-slate-100 transition-colors"><X size={14} className="text-slate-500" /></button>
                 </div>
                 {editingProduct?.imagens?.length > 0 ? (
                   <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                     {editingProduct.imagens.map((img, i) => (
                        <div key={i} onClick={() => {
                           updateOpcao(imageSelectorTarget.atribId, imageSelectorTarget.opcaoId, 'imagem', img);
                           setImageSelectorTarget(null);
                        }} className="aspect-square rounded-md overflow-hidden border-2 border-transparent hover:border-blue-500 cursor-pointer shadow-sm transition-all hover:scale-105 relative">
                           <img src={img} className="w-full h-full object-cover" />
                        </div>
                     ))}
                   </div>
                 ) : (
                   <p className="text-[10px] font-semibold text-slate-400 text-center uppercase tracking-widest py-8 border border-dashed border-slate-200 rounded-lg">Nenhuma foto na galeria.<br/>Faça o upload na aba "Dados Básicos" primeiro.</p>
                 )}
                 <div className="mt-5 pt-3 border-t border-slate-100 text-center">
                    <button onClick={() => { updateOpcao(imageSelectorTarget.atribId, imageSelectorTarget.opcaoId, 'imagem', null); setImageSelectorTarget(null); }} className="text-[9px] font-bold uppercase tracking-widest text-slate-400 hover:text-red-500 transition-colors">
                      Limpar Foto Desta Variação
                    </button>
                 </div>
              </motion.div>
           </div>
        )}
      </AnimatePresence>

    </motion.div>
  );
}