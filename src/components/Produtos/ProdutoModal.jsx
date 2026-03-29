import React, { useState, useRef, useEffect } from 'react';
import { 
  ShoppingBag, Save, Trash2, Plus, X, Layers, Box, FileText, Image, GripVertical, Loader2, Star 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { motion } from "framer-motion";
import { supabase } from "../../lib/supabase";
import { compressImageToBlob } from './produtosUtils';

// Função auxiliar para formatação
const fmt = (v) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

const calcularDescontoAtacado = (precoAtacado, precoBase) => {
  if (!precoBase || precoBase <= 0 || !precoAtacado || precoAtacado <= 0) return 0;
  const desconto = ((precoBase - precoAtacado) / precoBase) * 100;
  return desconto.toFixed(0);
};

export default function ProdutoModal({
  isModalOpen,
  setIsModalOpen,
  editingProduct,
  setEditingProduct,
  handleSave,
  categorias,
  setIsCategoryModalOpen,
  promoType,
  setPromoType,
  promoPercent,
  setPromoPercent
}) {
  const [drawerTab, setDrawerTab] = useState('dados');
  const [novoAtributoNome, setNovoAtributoNome] = useState('');
  const [isUploadingImages, setIsUploadingImages] = useState(false);
  const [uploadTarget, setUploadTarget] = useState(null);
  
  const fileInputRef = useRef(null);
  const opcaoImgRef = useRef(null);

  // Cálculos de Lucro e Margem
  const precoBaseCalculo = editingProduct?.preco_promocional > 0 ? editingProduct.preco_promocional : (editingProduct?.preco || 0);
  const lucro = precoBaseCalculo - (editingProduct?.custo || 0);
  const margem = precoBaseCalculo > 0 ? ((lucro / precoBaseCalculo) * 100).toFixed(1) : 0;

  // Funções de Variações
  const adicionarAtributo = () => {
    if (!novoAtributoNome) return;
    const novoAtributo = { id: Date.now(), nome: novoAtributoNome, obrigatorio: true, opcoes: [{ id: Date.now() + 1, nome: 'Opção 1', preco: 0, custo: 0, imagem: null }] };
    setEditingProduct(prev => ({ ...prev, variacoes: { ...prev.variacoes, atributos: [...(prev.variacoes.atributos || []), novoAtributo] } }));
    setNovoAtributoNome('');
  };

  const adicionarOpcao = (atribId) => {
    setEditingProduct(prev => ({
      ...prev, variacoes: { ...prev.variacoes, atributos: prev.variacoes.atributos.map(atrib => atrib.id === atribId ? { ...atrib, opcoes: [...atrib.opcoes, { id: Date.now(), nome: `Nova Opção`, preco: 0, custo: 0, imagem: null }] } : atrib) }
    }));
  };

  const removerOpcao = (atribId, opcaoId) => {
    setEditingProduct(prev => ({
      ...prev, variacoes: { ...prev.variacoes, atributos: prev.variacoes.atributos.map(atrib => atrib.id === atribId ? { ...atrib, opcoes: atrib.opcoes.filter(o => o.id !== opcaoId) } : atrib) }
    }));
  };

  const updateOpcao = (atribId, opcaoId, field, value) => {
    setEditingProduct(prev => ({
      ...prev, variacoes: { ...prev.variacoes, atributos: prev.variacoes.atributos.map(atrib => atrib.id === atribId ? { ...atrib, opcoes: atrib.opcoes.map(o => o.id === opcaoId ? { ...o, [field]: value } : o) } : atrib) }
    }));
  };

  const triggerOpcaoUpload = (atribId, opcaoId) => {
    setUploadTarget({ atribId, opcaoId });
    if (opcaoImgRef.current) opcaoImgRef.current.click();
  };

  const handleOpcaoImgChange = async (e) => {
    if (e.target.files && e.target.files[0] && uploadTarget) {
      const file = e.target.files[0];
      const blob = await compressImageToBlob(file); 
      const fileName = `variacao-${Date.now()}-${Math.random().toString(36).substring(7)}.webp`;
      
      const { data, error } = await supabase.storage.from('produtos').upload(fileName, blob, { contentType: 'image/webp', upsert: true });
      if (error) {
        alert("Erro ao subir foto da variação: " + error.message);
        return;
      }
      const { data: publicUrlData } = supabase.storage.from('produtos').getPublicUrl(fileName);
      updateOpcao(uploadTarget.atribId, uploadTarget.opcaoId, 'imagem', publicUrlData.publicUrl);
    }
  };

  // Funções de Atacado
  const adicionarRegraAtacado = () => {
    setEditingProduct(prev => ({ ...prev, atacado: { ...prev.atacado, regras: [...(prev.atacado?.regras || []), { min: 1, max: null, preco: 0 }] } }));
  };

  const updateRegraAtacado = (index, field, value) => {
    setEditingProduct(prev => {
      const novasRegras = [...(prev.atacado?.regras || [])];
      novasRegras[index] = { ...novasRegras[index], [field]: value };
      return { ...prev, atacado: { ...prev.atacado, regras: novasRegras } };
    });
  };

  const removerRegraAtacado = (index) => {
    setEditingProduct(prev => {
      const novasRegras = prev.atacado.regras.filter((_, i) => i !== index);
      return { ...prev, atacado: { ...prev.atacado, regras: novasRegras } };
    });
  };

  // Funções de Personalização
  const adicionarCampoPersonalizado = () => {
    setEditingProduct(prev => ({ ...prev, campos_personalizados: [...(prev.campos_personalizados || []), { id: Date.now(), titulo: '', tipo: 'texto_curto', obrigatorio: true }] }));
  };

  const updateCampoPersonalizado = (id, field, value) => {
    setEditingProduct(prev => ({ ...prev, campos_personalizados: prev.campos_personalizados.map(c => c.id === id ? { ...c, [field]: value } : c) }));
  };

  const removerCampoPersonalizado = (id) => {
    setEditingProduct(prev => ({ ...prev, campos_personalizados: prev.campos_personalizados.filter(c => c.id !== id) }));
  };

  const InfoReferencia = () => (
    <div className="grid grid-cols-3 gap-4 mb-6 p-4 bg-slate-50 border border-slate-200 rounded-lg shadow-sm">
      <div className="flex flex-col">
        <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Preço de Venda Base</span>
        <span className="text-sm font-bold text-slate-800">{fmt(editingProduct?.preco || 0)}</span>
      </div>
      <div className="flex flex-col">
        <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Preço Promocional</span>
        <span className="text-sm font-bold text-purple-600">{editingProduct?.preco_promocional > 0 ? fmt(editingProduct.preco_promocional) : 'Não possui'}</span>
      </div>
      <div className="flex flex-col">
        <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Qtd Mínima Venda</span>
        <span className="text-sm font-bold text-slate-800">{editingProduct?.qtd_minima || 1} un.</span>
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 sm:p-6">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsModalOpen(false)} className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" />
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="relative w-full max-w-5xl bg-[#f8fafc] rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* HEADER MODAL */}
        <div className="bg-white border-b border-slate-200 p-4 md:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-slate-50 flex items-center justify-center border border-slate-100"><ShoppingBag className="text-blue-600 w-5 h-5" /></div>
            <div>
              <h2 className="text-base md:text-lg font-semibold text-slate-800 uppercase leading-none">Configurar Produto</h2>
              <p className="text-[9px] md:text-[10px] text-slate-400 font-semibold uppercase mt-1 italic">{editingProduct?.nome || 'Novo Cadastro'}</p>
            </div>
          </div>
          <div className="flex gap-2 w-full sm:w-auto">
            <Button variant="ghost" onClick={() => setIsModalOpen(false)} className="flex-1 sm:flex-none rounded-md font-semibold text-[10px] md:text-xs uppercase text-slate-500 h-10 md:h-9 border border-slate-200 hover:bg-slate-50">Cancelar</Button>
            <Button onClick={handleSave} className="flex-1 sm:flex-none bg-blue-600 hover:bg-blue-700 text-white h-10 md:h-9 px-6 rounded-md font-semibold uppercase text-[10px] md:text-xs shadow-sm transition-colors"><Save size={14} className="mr-1.5 hidden sm:inline-block"/> Salvar</Button>
          </div>
        </div>

        {/* CORPO MODAL */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6">
          <div className="flex flex-wrap gap-1 bg-white p-1 rounded-lg border border-slate-200 w-fit mb-6 shadow-sm">
            {['dados', 'variacoes', 'atacado', 'personalizacao'].map((tab) => ( 
              <button key={tab} onClick={() => setDrawerTab(tab)} className={`px-4 md:px-5 py-2 rounded-md text-[9px] md:text-[10px] font-semibold uppercase transition-all ${drawerTab === tab ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'}`}>
                {tab === 'dados' ? 'Dados Gerais' : tab === 'variacoes' ? 'Variações' : tab === 'atacado' ? 'Regras de Atacado' : 'Personalização'}
              </button>
            ))}
          </div>

          {/* TAB: DADOS GERAIS */}
          {drawerTab === 'dados' && (
            <div className="space-y-4 md:space-y-5 animate-in fade-in duration-300">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-5">
                
                <div className="lg:col-span-2 space-y-4 md:space-y-5">
                   <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm space-y-4 md:space-y-5">
                      <h3 className="text-xs font-semibold uppercase text-slate-700 border-b border-slate-100 pb-2.5">Informações Gerais</h3>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-semibold uppercase text-slate-500 ml-0.5">Nome do Produto *</label>
                        <Input value={editingProduct?.nome || ''} onChange={(e) => setEditingProduct({...editingProduct, nome: e.target.value})} className="h-11 md:h-10 bg-slate-50 border-slate-200 rounded-md font-medium text-slate-800 text-sm focus:bg-white" />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-semibold uppercase text-slate-500 ml-0.5">Descrição Detalhada</label>
                        <textarea value={editingProduct?.descricao || ''} onChange={(e) => setEditingProduct({...editingProduct, descricao: e.target.value})} placeholder="Escreva os detalhes e diferenciais do seu produto..." className="w-full min-h-[120px] p-3 md:p-4 bg-slate-50 border border-slate-200 rounded-md text-xs md:text-sm font-medium text-slate-700 outline-none focus:border-blue-400 focus:bg-white transition-all resize-none leading-relaxed" />
                      </div>
                   </div>

                   <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm space-y-4 md:space-y-5">
                      <h3 className="text-xs font-semibold uppercase text-slate-700 border-b border-slate-100 pb-2.5">Precificação e Regras</h3>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 md:gap-5">
                        <div className="space-y-1.5">
                          <label className="text-[9px] md:text-[10px] font-semibold uppercase text-slate-500 tracking-widest ml-0.5">Custo Un.</label>
                          <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-semibold text-sm">R$</span>
                            <input type="number" value={editingProduct?.custo || ''} onChange={(e) => setEditingProduct({...editingProduct, custo: Number(e.target.value)})} className="bg-slate-50 border border-slate-200 w-full h-11 md:h-10 rounded-md outline-none font-semibold text-sm md:text-base text-slate-800 focus:border-blue-400 focus:bg-white pl-9 transition-all" />
                          </div>
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-[9px] md:text-[10px] font-semibold uppercase text-slate-500 tracking-widest ml-0.5">Venda</label>
                          <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600 font-semibold text-sm">R$</span>
                            <input type="number" value={editingProduct?.preco || ''} onChange={(e) => setEditingProduct({...editingProduct, preco: Number(e.target.value)})} className="bg-slate-50 border border-slate-300 w-full h-11 md:h-10 rounded-md outline-none font-semibold text-sm md:text-base text-slate-800 focus:border-slate-500 focus:bg-white pl-9 transition-all" />
                          </div>
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-[9px] md:text-[10px] font-semibold uppercase text-purple-600 tracking-widest flex items-center gap-1 ml-0.5">Promoção</label>
                          <div className="relative flex">
                             <select value={promoType} onChange={(e) => { setPromoType(e.target.value); setPromoPercent(''); }} className="h-11 md:h-10 bg-purple-100 border border-purple-200 text-purple-700 font-semibold text-xs rounded-l-md px-2 outline-none">
                               <option value="value">R$</option>
                               <option value="percent">%</option>
                             </select>
                             <input type="number" placeholder="Opcional" value={promoType === 'percent' ? promoPercent : (editingProduct?.preco_promocional || '')} onChange={(e) => { if (promoType === 'percent') { setPromoPercent(e.target.value); } else { setEditingProduct({...editingProduct, preco_promocional: Number(e.target.value)}); } }} className="bg-purple-50/50 border border-purple-200 border-l-0 w-full h-11 md:h-10 rounded-r-md outline-none font-semibold text-sm md:text-base text-purple-700 focus:border-purple-400 focus:bg-white pl-3 transition-all" />
                          </div>
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-[9px] md:text-[10px] font-semibold uppercase text-slate-500 tracking-widest ml-0.5">Qtd. Mínima</label>
                          <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-semibold text-xs uppercase">Un</span>
                            <input type="number" min="1" value={editingProduct?.qtd_minima || 1} onChange={(e) => setEditingProduct({...editingProduct, qtd_minima: Number(e.target.value)})} className="bg-slate-50 border border-slate-200 w-full h-11 md:h-10 rounded-md outline-none font-semibold text-sm md:text-base text-slate-800 focus:border-blue-400 focus:bg-white pl-9 transition-all" />
                          </div>
                        </div>
                      </div>
                      <div className="bg-slate-50 p-3 rounded-md border border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 mt-1">
                         <span className="text-[10px] md:text-[11px] font-semibold uppercase text-slate-500">Estimativa de Lucro Líquido por Unidade:</span>
                         <div className="flex items-center gap-2.5">
                           <span className="text-lg md:text-xl font-bold text-emerald-600">R$ {lucro.toFixed(2)}</span>
                           <span className="text-[9px] md:text-[10px] font-semibold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded border border-emerald-200">{margem}% de margem</span>
                         </div>
                      </div>
                   </div>
                </div>

                <div className="space-y-4 md:space-y-5">
                   <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm space-y-4 md:space-y-5">
                      <h3 className="text-xs font-semibold uppercase text-slate-700 border-b border-slate-100 pb-2.5">Organização</h3>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between bg-slate-50 p-3 rounded-md border border-slate-100">
                          <div>
                             <p className="text-[10px] md:text-[11px] font-semibold uppercase text-slate-800 mb-0.5">Visível no Site</p>
                             <p className="text-[8px] md:text-[9px] text-slate-500 font-medium uppercase">Exibir na vitrine pública</p>
                          </div>
                          <button onClick={() => setEditingProduct({...editingProduct, statusOnline: !editingProduct.statusOnline})} className={`w-10 h-5 rounded-full p-0.5 transition-all shadow-inner ${editingProduct?.statusOnline ? 'bg-emerald-500' : 'bg-slate-300'}`}>
                            <div className={`w-4 h-4 bg-white rounded-full transition-transform shadow-sm ${editingProduct?.statusOnline ? 'translate-x-5' : 'translate-x-0'}`} />
                          </button>
                        </div>
                        <div className="flex items-center justify-between bg-amber-50/50 p-3 rounded-md border border-amber-100">
                          <div>
                             <p className="text-[10px] md:text-[11px] font-semibold uppercase text-slate-800 mb-0.5 flex items-center gap-1.5"><Star size={10} className="text-amber-500" fill="currentColor"/> Destaque</p>
                             <p className="text-[8px] md:text-[9px] text-slate-500 font-medium uppercase">Fixar no topo do catálogo</p>
                          </div>
                          <button onClick={() => setEditingProduct({...editingProduct, destaque: !editingProduct.destaque})} className={`w-10 h-5 rounded-full p-0.5 transition-all shadow-inner ${editingProduct?.destaque ? 'bg-amber-400' : 'bg-slate-300'}`}>
                            <div className={`w-4 h-4 bg-white rounded-full transition-transform shadow-sm ${editingProduct?.destaque ? 'translate-x-5' : 'translate-x-0'}`} />
                          </button>
                        </div>
                        <div className="space-y-1.5 text-left">
                          <div className="flex justify-between items-center px-0.5">
                            <label className="text-[9px] md:text-[10px] font-semibold uppercase text-slate-500 tracking-widest">Categoria</label>
                            <button onClick={() => setIsCategoryModalOpen(true)} className="text-[8px] md:text-[9px] font-semibold text-blue-600 uppercase hover:underline">Gerenciar</button>
                          </div>
                          <select value={editingProduct?.categoria || ''} onChange={(e) => setEditingProduct({...editingProduct, categoria: e.target.value})} className="w-full h-11 md:h-10 bg-slate-50 border border-slate-200 rounded-md px-3 text-[10px] md:text-xs font-semibold uppercase outline-none focus:ring-1 focus:ring-blue-400">
                            {categorias.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                          </select>
                        </div>
                        <div className="space-y-1.5 text-left">
                          <label className="text-[9px] md:text-[10px] font-semibold uppercase text-slate-500 ml-0.5 tracking-widest">Código SKU</label>
                          <Input value={editingProduct?.sku || ''} onChange={(e) => setEditingProduct({...editingProduct, sku: e.target.value})} placeholder="Ex: PROD-01" className="h-11 md:h-10 border-slate-200 bg-slate-50 rounded-md font-medium uppercase text-xs md:text-sm" />
                        </div>
                      </div>
                   </div>

                   <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm space-y-4 md:space-y-5">
                      <h3 className="text-xs font-semibold uppercase text-slate-700 border-b border-slate-100 pb-2.5">Imagens do Produto</h3>
                      <div className="grid grid-cols-2 gap-2.5">
                        {editingProduct?.imagens?.map((img, index) => (
                          <div key={index} className="relative aspect-square rounded-md overflow-hidden border border-slate-200 group shadow-sm">
                            <img src={img} className="w-full h-full object-cover" />
                            <button onClick={() => setEditingProduct(prev => ({...prev, imagens: prev.imagens.filter((_, i) => i !== index)}))} className="absolute top-1.5 right-1.5 bg-red-500 text-white p-1 rounded-md opacity-0 group-hover:opacity-100 transition-all shadow-sm"><X size={12} /></button>
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
                            } catch (err) {
                              alert("Erro ao subir imagem: " + err.message);
                            }
                          }
                          setIsUploadingImages(false);
                        }} className="hidden" multiple accept="image/*" />
                        
                        <button disabled={isUploadingImages} onClick={() => fileInputRef.current.click()} className="aspect-square rounded-md border-2 border-dashed border-slate-300 flex flex-col items-center justify-center gap-1.5 text-blue-500 hover:bg-blue-50 hover:border-blue-300 transition-all bg-slate-50">
                          {isUploadingImages ? (
                            <><Loader2 size={20} className="animate-spin text-blue-500" /><span className="text-[8px] md:text-[9px] font-semibold uppercase text-slate-400">Enviando...</span></>
                          ) : (
                            <><Plus size={20} /><span className="text-[8px] md:text-[9px] font-semibold uppercase text-slate-400">Add Foto</span></>
                          )}
                        </button>
                      </div>
                   </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB: PERSONALIZAÇÃO */}
          {drawerTab === 'personalizacao' && (
            <div className="space-y-6 md:space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <InfoReferencia />
              <div className="bg-white p-5 md:p-6 rounded-lg border border-slate-200 shadow-sm">
                 <div className="flex items-center justify-between mb-6 pb-4 md:pb-5 border-b border-slate-100">
                    <div className="flex items-center gap-2 md:gap-3">
                      <FileText className="text-emerald-600 w-4 h-4 md:w-5 md:h-5" />
                      <div>
                        <h3 className="font-semibold text-[10px] md:text-xs uppercase tracking-widest text-slate-700">Campos Personalizados</h3>
                        <p className="text-[9px] text-slate-500 font-medium uppercase mt-0.5">O que o cliente deve preencher na compra?</p>
                      </div>
                    </div>
                 </div>

                 <div className="space-y-4">
                   {editingProduct?.campos_personalizados?.map((campo) => (
                      <div key={campo.id} className="bg-slate-50 p-4 rounded-lg border border-slate-200 relative group">
                         <button onClick={() => removerCampoPersonalizado(campo.id)} className="absolute -top-2 -right-2 p-1.5 bg-red-500 text-white rounded-md shadow-sm hover:bg-red-600 transition-transform"><Trash2 size={12}/></button>
                         <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                           <div className="md:col-span-6 space-y-1.5">
                             <label className="text-[9px] font-semibold text-slate-500 uppercase ml-0.5">Título da Pergunta/Campo</label>
                             <Input value={campo.titulo} onChange={(e) => updateCampoPersonalizado(campo.id, 'titulo', e.target.value)} placeholder="Ex: Qual nome colocar na capa?" className="h-10 bg-white border-slate-200 text-xs font-semibold text-slate-800" />
                           </div>
                           <div className="md:col-span-4 space-y-1.5">
                             <label className="text-[9px] font-semibold text-slate-500 uppercase ml-0.5">Tipo de Resposta</label>
                             <select value={campo.tipo} onChange={(e) => updateCampoPersonalizado(campo.id, 'tipo', e.target.value)} className="w-full h-10 border border-slate-200 rounded-md text-xs font-semibold text-slate-700 px-3 bg-white outline-none focus:border-emerald-400">
                                <option value="texto_curto">Texto Curto (Nome, etc)</option>
                                <option value="texto_longo">Texto Longo (Mensagem)</option>
                                <option value="upload">Upload de Arte/Foto</option>
                                <option value="data">Data (Evento)</option>
                                <option value="hora">Hora</option>
                             </select>
                           </div>
                           <div className="md:col-span-2 space-y-1.5 flex flex-col justify-center items-start md:items-center pt-1 md:pt-5">
                             <label className="text-[9px] font-semibold text-slate-500 uppercase cursor-pointer flex items-center gap-2 hover:text-slate-800 transition-colors">
                               <input type="checkbox" checked={campo.obrigatorio} onChange={(e) => updateCampoPersonalizado(campo.id, 'obrigatorio', e.target.checked)} className="w-4 h-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer" />
                               Obrigatório
                             </label>
                           </div>
                         </div>
                      </div>
                   ))}
                   {(!editingProduct?.campos_personalizados || editingProduct.campos_personalizados.length === 0) && (
                     <p className="text-[10px] text-slate-400 font-semibold uppercase text-center py-4">Nenhum campo personalizado cadastrado.</p>
                   )}
                   <Button onClick={adicionarCampoPersonalizado} variant="outline" className="w-full h-11 border-dashed border-2 border-slate-200 text-slate-500 hover:bg-emerald-50 hover:text-emerald-600 hover:border-emerald-200 font-semibold text-[10px] md:text-[11px] uppercase gap-1.5 rounded-md mt-2 bg-white shadow-sm transition-all">
                     <Plus size={16}/> Adicionar Novo Campo
                   </Button>
                 </div>
              </div>
            </div>
          )}

          {/* TAB: VARIAÇÕES */}
          {drawerTab === 'variacoes' && (
            <div className="space-y-6 md:space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <InfoReferencia />
              <div className="bg-white p-5 md:p-6 rounded-lg border border-slate-200 shadow-sm">
                 <div className="flex items-center justify-between mb-6 pb-4 md:pb-5 border-b border-slate-100">
                    <div className="flex items-center gap-2 md:gap-3">
                      <Layers className="text-blue-600 w-4 h-4 md:w-5 md:h-5" />
                      <span className="font-semibold text-[10px] md:text-xs uppercase tracking-widest text-slate-700">Variações do Produto</span>
                    </div>
                    <button onClick={() => setEditingProduct({...editingProduct, variacoes: {...editingProduct.variacoes, ativa: !editingProduct.variacoes?.ativa}})} className={`w-12 h-6 rounded-full p-0.5 transition-all shadow-inner ${editingProduct?.variacoes?.ativa ? 'bg-blue-600' : 'bg-slate-200'}`}>
                      <div className={`w-5 h-5 bg-white rounded-full shadow-sm transition-transform ${editingProduct?.variacoes?.ativa ? 'translate-x-6' : 'translate-x-0'}`} />
                    </button>
                 </div>
                 
                 {editingProduct?.variacoes?.ativa && (
                   <div className="space-y-6">
                     <input type="file" ref={opcaoImgRef} className="hidden" accept="image/*" onChange={handleOpcaoImgChange} />
                     {editingProduct.variacoes.atributos?.map((atrib) => (
                       <div key={atrib.id} className="bg-slate-50 p-4 md:p-6 rounded-lg border border-slate-200 space-y-4 md:space-y-5 shadow-sm">
                         <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-200 pb-4">
                           <div className="flex items-center gap-3 w-full sm:w-auto flex-1">
                             <GripVertical size={16} className="text-slate-300 cursor-grab shrink-0 hidden sm:block" />
                             <div className="w-full">
                               <p className="text-[9px] md:text-[10px] font-semibold uppercase text-slate-500 mb-1 ml-0.5">Nome do Atributo</p>
                               <Input value={atrib.nome} onChange={(e) => setEditingProduct(prev => ({...prev, variacoes: {...prev.variacoes, atributos: prev.variacoes.atributos.map(a => a.id === atrib.id ? {...a, nome: e.target.value} : a)}}))} className="h-10 md:h-9 bg-white border-slate-200 text-xs md:text-sm font-semibold uppercase text-slate-800 rounded-md w-full sm:max-w-xs shadow-sm" />
                             </div>
                           </div>
                           <Button variant="destructive" onClick={() => setEditingProduct(prev => ({...prev, variacoes: {...prev.variacoes, atributos: prev.variacoes.atributos.filter(a => a.id !== atrib.id)}}))} className="h-10 md:h-9 rounded-md bg-red-50 text-red-600 hover:bg-red-500 hover:text-white font-semibold uppercase text-[9px] md:text-[10px] gap-1.5 shadow-none border border-red-100 w-full sm:w-auto mt-2 sm:mt-0 transition-colors">
                             <Trash2 size={14} /> Excluir Atributo
                           </Button>
                         </div>

                         <div className="grid grid-cols-1 gap-4">
                           {atrib.opcoes.map((opcao) => (
                             <div key={opcao.id} className="bg-white border border-slate-200 rounded-lg p-3 md:p-4 shadow-sm relative flex flex-col sm:flex-row items-center gap-4 group hover:border-blue-300 transition-colors">
                               <div onClick={() => triggerOpcaoUpload(atrib.id, opcao.id)} className="w-16 h-16 md:w-20 md:h-20 rounded-md bg-slate-50 border-2 border-dashed border-slate-200 flex flex-col items-center justify-center text-slate-400 cursor-pointer overflow-hidden transition-all hover:bg-blue-50 hover:border-blue-300 hover:text-blue-500 shrink-0">
                                 {opcao.imagem ? <img src={opcao.imagem} className="w-full h-full object-cover" /> : <><Image size={18} className="mb-0.5"/><span className="text-[7px] font-semibold uppercase">Foto</span></>}
                               </div>

                               <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-3 w-full">
                                 <div className="space-y-1">
                                   <p className="text-[9px] font-semibold text-slate-500 uppercase tracking-widest ml-0.5">Nome da Opção</p>
                                   <Input value={opcao.nome} onChange={(e) => updateOpcao(atrib.id, opcao.id, 'nome', e.target.value)} className="h-10 md:h-9 text-xs md:text-sm font-medium text-slate-800 rounded-md bg-slate-50 focus:bg-white border-slate-200" />
                                 </div>
                                 <div className="space-y-1">
                                   <p className="text-[9px] font-semibold text-slate-500 uppercase tracking-widest ml-0.5">Custo R$</p>
                                   <div className="relative">
                                     <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 font-semibold text-xs">R$</span>
                                     <Input type="number" value={opcao.custo || ''} onChange={(e) => updateOpcao(atrib.id, opcao.id, 'custo', Number(e.target.value))} className="pl-8 h-10 md:h-9 text-xs md:text-sm font-semibold text-slate-800 rounded-md bg-slate-50 border-slate-200 focus:border-slate-300 focus:bg-white" />
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
                                     <span className="absolute left-3 top-1/2 -translate-y-1/2 text-blue-500 font-semibold text-xs">R$</span>
                                     <Input type="number" value={opcao.preco || ''} onChange={(e) => updateOpcao(atrib.id, opcao.id, 'preco', Number(e.target.value))} className="pl-8 h-10 md:h-9 text-xs md:text-sm font-semibold text-blue-700 rounded-md bg-blue-50/50 border-blue-100 focus:border-blue-300 focus:bg-white" />
                                   </div>
                                 </div>
                               </div>
                               <button onClick={() => removerOpcao(atrib.id, opcao.id)} className="absolute -top-2 -right-2 p-1.5 bg-red-500 text-white rounded-md shadow-sm transition-transform active:scale-90 hover:bg-red-600"><X size={12} /></button>
                             </div>
                           ))}
                           <Button onClick={() => adicionarOpcao(atrib.id)} variant="outline" className="w-full h-11 md:h-10 border-dashed border-2 border-slate-200 rounded-md flex items-center justify-center gap-1.5 text-slate-500 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-300 transition-all font-semibold text-[10px] uppercase mt-1 bg-white">
                             <Plus size={16} /> Adicionar Nova Opção
                           </Button>
                         </div>
                       </div>
                     ))}
                     <div className="flex flex-col gap-3 pt-5 border-t border-slate-100">
                       <p className="text-[10px] font-semibold uppercase text-slate-500 ml-0.5">Criar Novo Grupo de Variação</p>
                       <div className="flex flex-col sm:flex-row gap-3">
                         <Input placeholder="Ex: Tamanho da Camiseta" value={novoAtributoNome} onChange={(e) => setNovoAtributoNome(e.target.value)} className="h-11 md:h-10 border-slate-200 bg-white rounded-md font-medium w-full text-sm shadow-sm" />
                         <Button onClick={adicionarAtributo} className="h-11 md:h-10 bg-slate-800 hover:bg-slate-900 text-white rounded-md font-semibold uppercase text-[10px] md:text-xs px-6 gap-1.5 w-full sm:w-auto shadow-sm">
                           <Plus size={16} /> Adicionar Grupo
                         </Button>
                       </div>
                     </div>
                   </div>
                 )}
              </div>
            </div>
          )}
          
          {/* TAB: ATACADO */}
          {drawerTab === 'atacado' && (
            <div className="space-y-6 md:space-y-8 animate-in fade-in duration-300">
              <InfoReferencia />
              <div className="bg-white border border-slate-200 rounded-lg p-5 md:p-6 shadow-sm">
                <div className="flex items-center justify-between border-b border-slate-100 pb-5 mb-6">
                  <div className="flex items-center gap-2.5 text-slate-800">
                    <Box size={20} className="text-amber-500" />
                    <div>
                      <h3 className="font-semibold text-xs uppercase text-slate-800">Preços de Atacado</h3>
                      <p className="text-[9px] text-slate-500 font-medium uppercase mt-0.5">Descontos automáticos por quantidade</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <span className={`text-[9px] font-semibold uppercase ${editingProduct?.atacado?.ativa ? 'text-amber-600' : 'text-slate-400'}`}>{editingProduct?.atacado?.ativa ? 'Regras Ativas' : 'Desativado'}</span>
                    <button onClick={() => setEditingProduct(prev => ({...prev, atacado: {...prev.atacado, ativa: !prev.atacado?.ativa}}))} className={`w-12 h-6 rounded-full p-0.5 transition-all shadow-inner ${editingProduct?.atacado?.ativa ? 'bg-amber-500' : 'bg-slate-200'}`}>
                      <div className={`w-5 h-5 bg-white rounded-full shadow-sm transition-transform ${editingProduct?.atacado?.ativa ? 'translate-x-6' : 'translate-x-0'}`} />
                    </button>
                  </div>
                </div>

                {editingProduct?.atacado?.ativa && (
                  <div className="space-y-4">
                     {editingProduct.atacado.regras?.map((regra, idx) => (
                        <div key={idx} className="flex flex-col sm:flex-row items-center gap-4 bg-white p-4 rounded-lg border border-slate-200 shadow-sm relative group hover:border-amber-200 transition-colors">
                           <div className="flex items-center gap-2 w-full sm:w-auto bg-slate-50 p-1.5 rounded-md border border-slate-100">
                              <span className="text-[9px] font-semibold text-slate-500 uppercase tracking-widest w-6 text-center">De</span>
                              <Input type="number" value={regra.min || ''} onChange={(e) => updateRegraAtacado(idx, 'min', Number(e.target.value))} className="w-16 text-center h-10 font-medium rounded-md bg-white border-slate-200" />
                              <span className="text-[9px] font-semibold text-slate-500 uppercase tracking-widest w-6 text-center">Até</span>
                              <Input type="number" placeholder="∞" value={regra.max || ''} onChange={(e) => updateRegraAtacado(idx, 'max', e.target.value ? Number(e.target.value) : null)} className="w-16 text-center h-10 font-medium rounded-md bg-white border-slate-200" />
                           </div>
                           
                           <div className="flex items-center gap-3 w-full sm:w-auto flex-1 mt-1 sm:mt-0 pt-3 sm:pt-0 border-t sm:border-t-0 border-slate-100 sm:pl-3">
                              <span className="text-[9px] font-semibold text-slate-500 uppercase tracking-widest flex flex-col">
                                 <span>Preço Un.</span>
                                 {regra.preco > 0 && editingProduct?.preco > 0 && (
                                   <span className="text-amber-500 lowercase mt-0.5">(-{calcularDescontoAtacado(regra.preco, editingProduct.preco)}%)</span>
                                 )}
                              </span>
                              <div className="relative w-full sm:max-w-[140px]">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-emerald-600 font-semibold text-xs">R$</span>
                                <Input type="number" value={regra.preco || ''} onChange={(e) => updateRegraAtacado(idx, 'preco', Number(e.target.value))} className="pl-8 h-10 font-semibold text-emerald-700 text-sm rounded-md bg-emerald-50/50 border-emerald-100 focus:border-emerald-300" />
                              </div>
                           </div>
                           <button onClick={() => removerRegraAtacado(idx)} className="absolute -top-2.5 -right-2.5 sm:relative sm:top-0 sm:right-0 p-1.5 bg-red-500 sm:bg-red-50 text-white sm:text-red-500 rounded-md hover:bg-red-600 sm:hover:bg-red-500 sm:hover:text-white transition-colors shadow-sm sm:shadow-none"><Trash2 size={14}/></button>
                        </div>
                     ))}
                     <Button onClick={adicionarRegraAtacado} variant="outline" className="w-full h-11 border-dashed border-2 border-slate-200 text-slate-500 hover:bg-amber-50 hover:text-amber-600 hover:border-amber-200 font-semibold text-[10px] md:text-[11px] uppercase gap-1.5 rounded-md mt-2 bg-slate-50 shadow-sm transition-all">
                       <Plus size={16}/> Adicionar Regra de Desconto
                     </Button>
                  </div>
                )}
              </div>
            </div>
          )}

        </div>
      </motion.div>
    </div>
  );
}