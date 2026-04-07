import React, { useState, useEffect } from 'react';
import { 
  Search, Tag, CheckSquare, Square, Eye, EyeOff, Edit3, 
  Star, Layers, FileText, Copy, Trash2, X, Lock, Plus, Loader2,
  ArrowUpDown // <-- Adicionado o ícone para o botão de organizar
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { AnimatePresence, motion } from "framer-motion";
import { supabase } from "@/lib/supabase";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

import { deletarImagensDoProduto } from '../components/Produtos/produtosUtils';
import CategoriaModal from '../components/Produtos/CategoriaModal';
import ProdutoModal from '../components/Produtos/ProdutoModal';
import ReordenarVitrine from '../components/Produtos/ReordenarVitrine'; // <-- Importando nosso novo módulo

const LIMITE_PRODUTOS = 50;

const fmt = (v) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

export default function Produtos() {
  const queryClient = useQueryClient();
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [isBulkCategoryModalOpen, setIsBulkCategoryModalOpen] = useState(false);
  const [isReorderModalOpen, setIsReorderModalOpen] = useState(false); // <-- Estado para o modal de reordenar

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Todas');
  const [selectedIds, setSelectedIds] = useState([]);
  const [editingProduct, setEditingProduct] = useState(null);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [bulkCategory, setBulkCategory] = useState('');
  
  const [promoType, setPromoType] = useState('value');
  const [promoPercent, setPromoPercent] = useState('');

  // ESTADO DE CATEGORIAS (LIMPO DE FÁBRICA)
  const [categorias, setCategorias] = useState(() => {
    const saved = localStorage.getItem("sistema_categorias");
    return saved ? JSON.parse(saved) : ['Sem Categoria'];
  });

  useEffect(() => {
    localStorage.setItem("sistema_categorias", JSON.stringify(categorias));
  }, [categorias]);

  // BUSCA OS PRODUTOS (Agora ordenando pela coluna Ordem também)
  const { data: produtos = [], isLoading } = useQuery({
    queryKey: ["sistema-produtos"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("produtos")
        .select("*")
        .neq('arquivado', true)
        .order("ordem", { ascending: true }) // Respeita a ordem manual
        .order("created_at", { ascending: false }); // Desempata pela data
      if (error) throw error;
      return data || [];
    },
  });

  // SINCRONIZA AS CATEGORIAS DO BANCO DE DADOS (RECUPERA AS ANTIGAS)
  useEffect(() => {
    if (produtos && produtos.length > 0) {
      const catBanco = produtos.map(p => p.categoria).filter(c => c && c !== 'Sem Categoria');
      setCategorias(prev => {
        const combinadas = [...new Set([...prev, ...catBanco])];
        if (combinadas.length !== prev.length) return combinadas;
        return prev;
      });
    }
  }, [produtos]);

  useEffect(() => {
    if (promoType === 'percent' && editingProduct?.preco > 0 && promoPercent !== '') {
      const novoPreco = editingProduct.preco * (1 - Number(promoPercent) / 100);
      setEditingProduct(prev => ({ ...prev, preco_promocional: Number(novoPreco.toFixed(2)) }));
    }
  }, [promoPercent, promoType, editingProduct?.preco]);

  const saveMutation = useMutation({
    mutationFn: async (prod) => {
      const payload = {
        nome: prod.nome,
        preco: Number(prod.preco || 0),
        preco_promocional: Number(prod.preco_promocional || 0),
        custo: Number(prod.custo || 0),
        qtd_minima: Number(prod.qtd_minima || 1), 
        sku: prod.sku || '',
        categoria: prod.categoria || 'Sem Categoria',
        descricao: prod.descricao || '',
        imagens: prod.imagens || [],
        imagem_url: prod.imagens?.[0] || '',
        status_online: prod.statusOnline ?? true,
        destaque: prod.destaque ?? false,
        ordem: prod.ordem ?? 999, // Mantém a ordem existente ou joga pro final
        variacoes: prod.variacoes || { ativa: false, atributos: [] },
        atacado: prod.atacado || { ativa: false, regras: [] },
        campos_personalizados: prod.campos_personalizados || [],
        receita: prod.receita || { insumos: [], tempo_minutos: 0, margem: 30, taxa: 5 }
      };

      if (prod.id && typeof prod.id === 'string' && prod.id.length > 20) {
        const { error } = await supabase.from("produtos").update(payload).eq("id", prod.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("produtos").insert([payload]);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sistema-produtos"] });
      setIsModalOpen(false);
      setEditingProduct(null);
    },
    onError: (err) => alert("Erro ao salvar: " + err.message)
  });

  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      const prod = produtos.find(p => p.id === id);
      if (prod) await deletarImagensDoProduto(prod); 
      
      const { error } = await supabase.from("produtos").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ["sistema-produtos"] });
      setSelectedIds(prev => prev.filter(selectedId => selectedId !== id));
    }
  });

  const bulkDeleteMutation = useMutation({
    mutationFn: async () => {
      const prodsToDelete = produtos.filter(p => selectedIds.includes(p.id));
      for (const prod of prodsToDelete) {
        await deletarImagensDoProduto(prod); 
      }
      const { error } = await supabase.from('produtos').delete().in('id', selectedIds);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sistema-produtos"] });
      setSelectedIds([]);
    }
  });

  const bulkStatusMutation = useMutation({
    mutationFn: async (status) => {
      const { error } = await supabase.from('produtos').update({ status_online: status }).in('id', selectedIds);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sistema-produtos"] });
      setSelectedIds([]);
    }
  });

  const bulkCategoryMutation = useMutation({
    mutationFn: async (category) => {
      const { error } = await supabase.from('produtos').update({ categoria: category }).in('id', selectedIds);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sistema-produtos"] });
      setSelectedIds([]);
      setIsBulkCategoryModalOpen(false);
    }
  });

  const toggleSelection = (id) => setSelectedIds(prev => prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]);
  
  const selectAll = () => {
    if (selectedIds.length === filteredProducts.length) setSelectedIds([]);
    else setSelectedIds(filteredProducts.map(p => p.id));
  };

  const handleBulkDelete = () => {
    if (window.confirm(`ATENÇÃO: Deseja excluir PERMANENTEMENTE os ${selectedIds.length} produtos e suas fotos? Essa ação não pode ser desfeita.`)) {
      bulkDeleteMutation.mutate();
    }
  };

  const handleAddCategory = () => {
    if (newCategoryName.trim() && !categorias.includes(newCategoryName.trim())) {
      setCategorias([...categorias, newCategoryName.trim()]);
      setNewCategoryName('');
    }
  };

  const handleRemoveCategory = (catToRemove) => {
    if (catToRemove === 'Sem Categoria') return;
    if (window.confirm(`Excluir a categoria "${catToRemove}"?`)) {
      setCategorias(categorias.filter(c => c !== catToRemove));
    }
  };

  const handleDelete = (id) => {
    if (window.confirm("ATENÇÃO: Deseja excluir este produto PERMANENTEMENTE e remover as fotos dele do servidor?")) {
      deleteMutation.mutate(id);
    }
  };

  const handleDuplicate = (prod) => {
    if (produtos.length >= LIMITE_PRODUTOS) return alert(`Limite de ${LIMITE_PRODUTOS} produtos atingido.`);
    const { id, created_at, ...rest } = prod;
    saveMutation.mutate({ ...rest, nome: `${prod.nome} (Cópia)`, sku: prod.sku ? `${prod.sku}-COPY` : '', ordem: 999 });
  };

  const handleNewProduct = () => {
    if (produtos.length >= LIMITE_PRODUTOS) return alert(`Limite de ${LIMITE_PRODUTOS} produtos atingido.`);
    setEditingProduct({
      nome: '', preco: 0, preco_promocional: 0, custo: 0, qtd_minima: 1, sku: '',
      imagens: [], categoria: 'Sem Categoria', statusOnline: true, destaque: false, ordem: 999,
      variacoes: { ativa: false, atributos: [] }, atacado: { ativa: false, regras: [] }, campos_personalizados: [],
      receita: { insumos: [], tempo_minutos: 0, margem: 30, taxa: 5 }
    });
    setPromoType('value'); setPromoPercent(''); setIsModalOpen(true);
  };

  const handleEdit = (prod) => {
    setEditingProduct({
      ...prod, statusOnline: prod.status_online ?? true, destaque: prod.destaque ?? false,
      preco_promocional: prod.preco_promocional || 0, qtd_minima: prod.qtd_minima || 1, 
      variacoes: prod.variacoes || { ativa: false, atributos: [] }, atacado: prod.atacado || { ativa: false, regras: [] },
      campos_personalizados: prod.campos_personalizados || [],
      receita: prod.receita || { insumos: [], tempo_minutos: 0, margem: 30, taxa: 5 }
    });
    setPromoType('value'); setPromoPercent(''); setIsModalOpen(true);
  };

  const handleSaveProduct = () => {
    if (!editingProduct.nome) return alert("Por favor, insira o nome do produto.");
    saveMutation.mutate(editingProduct);
  };

  const filteredProducts = produtos.filter(p => {
    const nomeSeguro = p.nome || '';
    const matchSearch = nomeSeguro.toLowerCase().includes(searchTerm.toLowerCase());
    const matchCategory = selectedCategory === 'Todas' || p.categoria === selectedCategory;
    return matchSearch && matchCategory;
  });

  if (isLoading) return <div className="min-h-screen flex items-center justify-center bg-slate-50"><Loader2 className="animate-spin text-slate-400" size={40} /></div>;

  const limiteAtingido = produtos.length >= LIMITE_PRODUTOS;

  return (
    <div className="min-h-screen bg-slate-50 relative text-slate-900 pb-32">
      <div className="max-w-7xl mx-auto space-y-5 md:space-y-6 px-4 sm:px-6">
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pt-6 md:pt-8 gap-4">
          <div>
             <h1 className="text-xl md:text-2xl font-semibold uppercase text-slate-800 tracking-tight">Gestão de Produtos</h1>
             <p className="text-[9px] md:text-[10px] font-medium text-slate-500 uppercase tracking-widest mt-1">
               Gerencie seu catálogo • <span className={limiteAtingido ? "text-red-500 font-semibold" : "text-blue-500 font-semibold"}>{produtos.length}/{LIMITE_PRODUTOS}</span>
             </p>
          </div>
          
          {/* --- BOTÕES DO TOPO --- */}
          <div className="flex flex-col sm:flex-row items-center gap-2 w-full sm:w-auto">
             <Button onClick={() => setIsReorderModalOpen(true)} variant="outline" className="h-9 border-slate-200 text-slate-700 hover:bg-slate-100 rounded-md font-semibold uppercase text-[10px] gap-1.5 px-4 transition-all w-full sm:w-auto shadow-sm">
               <ArrowUpDown size={14} /> Organizar Vitrine
             </Button>
             <Button onClick={handleNewProduct} disabled={limiteAtingido} className={`h-9 text-white rounded-md font-semibold uppercase text-[10px] gap-1.5 px-4 shadow-sm transition-all w-full sm:w-auto ${limiteAtingido ? 'bg-slate-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'}`}>
               {limiteAtingido ? <Lock size={14} /> : <Plus size={14} />} <span className="inline">{limiteAtingido ? 'Limite Atingido' : 'Novo Produto'}</span>
             </Button>
          </div>
        </div>

        <div className="bg-white p-3 md:p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex flex-col md:flex-row items-center gap-3">
            <div className="relative w-full md:flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input type="text" placeholder="Pesquisar produto pelo nome..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full h-9 pl-9 pr-4 bg-slate-50 outline-none text-xs font-medium border border-slate-200 rounded-md focus:border-blue-300 focus:bg-white transition-all" />
            </div>
            <div className="w-full md:w-auto flex items-center gap-2 md:gap-3">
              <select value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)} className="w-full md:w-48 h-9 border border-slate-200 rounded-md px-3 text-[10px] font-semibold uppercase outline-none bg-white text-slate-600 cursor-pointer">
                <option value="Todas">Todas as Categorias</option>
                {categorias.map(cat => <option key={cat} value={cat}>{cat}</option>)}
              </select>
              <Button variant="outline" onClick={() => setIsCategoryModalOpen(true)} className="h-9 border-slate-200 text-slate-600 rounded-md px-3 shrink-0 hover:bg-slate-50">
                 <Tag size={14} />
              </Button>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 px-1">
          <button onClick={selectAll} className="flex items-center gap-1.5 text-[10px] font-semibold text-slate-500 hover:text-slate-800 transition-colors uppercase tracking-widest">
            {selectedIds.length === filteredProducts.length && filteredProducts.length > 0 ? <CheckSquare size={14} className="text-blue-600" /> : <Square size={14} />}
            Selecionar Todos ({filteredProducts.length})
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-5">
          {filteredProducts.map((prod) => {
             const precoAtivo = prod.preco_promocional > 0 ? prod.preco_promocional : prod.preco;
             const lucroReal = precoAtivo - prod.custo;
             const isOnline = prod.status_online !== false;
             const isSelected = selectedIds.includes(prod.id);
            
             return (
              <div key={prod.id} className={`bg-white border rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col relative ${isSelected ? 'border-blue-500 ring-1 ring-blue-500/20' : 'border-slate-200'}`}>
                <button onClick={() => toggleSelection(prod.id)} className="absolute top-2 left-2 z-30 bg-white/90 backdrop-blur rounded-md p-1 shadow-sm hover:scale-105 transition-transform">
                  {isSelected ? <CheckSquare size={16} className="text-blue-600" /> : <Square size={16} className="text-slate-400" />}
                </button>
                <div className={`absolute top-2 right-2 z-20 text-white text-[8px] font-semibold px-2 py-0.5 rounded-full uppercase flex items-center gap-1 shadow-sm ${isOnline ? 'bg-emerald-500' : 'bg-slate-400'}`}>
                  {isOnline ? <Eye size={10} /> : <EyeOff size={10} />} {isOnline ? 'Online' : 'Offline'}
                </div>

                <div className="aspect-square bg-slate-50 relative overflow-hidden group cursor-pointer border-b border-slate-100" onClick={() => handleEdit(prod)}>
                  <div className="absolute inset-0 bg-slate-900/20 opacity-0 group-hover:opacity-100 transition-all duration-300 flex flex-col items-center justify-center gap-2 z-10">
                    <div className="bg-white text-slate-800 px-3 py-1.5 rounded-full font-semibold text-[10px] uppercase flex items-center gap-1.5 shadow-md"><Edit3 size={12} /> Editar</div>
                  </div>
                  <img src={prod.imagens?.[0] || `https://placehold.co/400x400/f8fafc/94a3b8?text=${(prod.nome || 'Produto').split(' ')[0]}`} alt={prod.nome || 'Produto'} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                </div>
                
                <div className="p-3 md:p-4 flex flex-col flex-1">
                  <div className="flex flex-wrap gap-1.5 mb-2.5">
                    {prod.destaque && <span className="bg-amber-50 text-amber-600 text-[8px] font-semibold px-1.5 py-0.5 rounded-full uppercase flex items-center gap-1 border border-amber-100"><Star size={8} fill="currentColor"/> Destaque</span>}
                    {prod.preco_promocional > 0 && <span className="bg-purple-50 text-purple-600 text-[8px] font-semibold px-1.5 py-0.5 rounded-full uppercase flex items-center gap-1 border border-purple-100"><Tag size={8}/> Promo</span>}
                    {prod.variacoes?.ativa && <span className="bg-blue-50 text-blue-600 text-[8px] font-semibold px-1.5 py-0.5 rounded-full uppercase flex items-center gap-1 border border-blue-100"><Layers size={8}/> Variações</span>}
                    {prod.campos_personalizados?.length > 0 && <span className="bg-emerald-50 text-emerald-600 text-[8px] font-semibold px-1.5 py-0.5 rounded-full uppercase flex items-center gap-1 border border-emerald-100"><FileText size={8}/> Pers.</span>}
                    {prod.qtd_minima > 1 && <span className="bg-slate-800 text-white text-[8px] font-semibold px-1.5 py-0.5 rounded-full uppercase flex items-center gap-1">Mín: {prod.qtd_minima} un.</span>}
                    <span className="bg-slate-50 text-slate-500 text-[8px] font-semibold px-1.5 py-0.5 rounded-full uppercase border border-slate-100">{prod.categoria}</span>
                  </div>

                  <h3 className="text-xs font-semibold text-slate-800 leading-snug line-clamp-2 h-8 mb-3">{prod.nome}</h3>
                  
                  <div className="mt-auto border-t border-slate-100 pt-3 flex items-end justify-between">
                    <div>
                      <p className="text-[8px] font-semibold text-slate-400 uppercase tracking-widest mb-0.5">Venda</p>
                      <div className="flex items-center gap-1">
                        <p className="text-sm font-semibold text-slate-800 leading-none">R$ {Number(precoAtivo).toFixed(2)}</p>
                      </div>
                    </div>
                    <div className="bg-emerald-50/50 text-emerald-600 px-2 py-1 rounded-md flex flex-col items-center border border-emerald-50">
                      <p className="text-[7px] font-semibold uppercase mb-0.5">Lucro</p>
                      <span className="text-[9px] font-semibold leading-none">+R$ {lucroReal.toFixed(2)}</span>
                    </div>
                  </div>
                  
                  <div className="flex gap-1.5 mt-3">
                    <button onClick={() => handleDuplicate(prod)} className="flex-1 h-8 bg-slate-50 hover:bg-slate-100 text-slate-500 rounded-md text-[9px] font-semibold uppercase flex items-center justify-center gap-1 transition-colors border border-slate-200"><Copy size={12}/> Duplicar</button>
                    <button onClick={() => handleDelete(prod.id)} className="flex-1 h-8 bg-red-50 hover:bg-red-100 text-red-500 rounded-md text-[9px] font-semibold uppercase flex items-center justify-center gap-1 transition-colors border border-red-100"><Trash2 size={12}/> Excluir</button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <AnimatePresence>
        {selectedIds.length > 0 && (
          <motion.div initial={{ y: 150, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 150, opacity: 0 }} className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[90%] max-w-2xl bg-slate-800 border border-slate-700 text-white p-3 rounded-2xl shadow-2xl z-50 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="bg-blue-600 text-white w-6 h-6 rounded-full flex items-center justify-center font-semibold text-[10px]">{selectedIds.length}</div>
              <span className="text-[9px] font-semibold uppercase tracking-widest text-slate-300">Selecionados</span>
            </div>
            
            <div className="flex flex-wrap items-center justify-center gap-2">
              <button onClick={() => bulkStatusMutation.mutate(true)} className="px-3 h-8 bg-slate-700 hover:bg-slate-600 rounded-full text-[9px] font-semibold uppercase flex items-center gap-1.5 transition-colors border border-slate-600"><Eye size={12} className="text-emerald-400" /> Online</button>
              <button onClick={() => bulkStatusMutation.mutate(false)} className="px-3 h-8 bg-slate-700 hover:bg-slate-600 rounded-full text-[9px] font-semibold uppercase flex items-center gap-1.5 transition-colors border border-slate-600"><EyeOff size={12} className="text-slate-400" /> Offline</button>
              <button onClick={() => setIsBulkCategoryModalOpen(true)} className="px-3 h-8 bg-slate-700 hover:bg-slate-600 rounded-full text-[9px] font-semibold uppercase flex items-center gap-1.5 transition-colors border border-slate-600"><Tag size={12} className="text-blue-400" /> Categoria</button>
              <button onClick={handleBulkDelete} className="px-3 h-8 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-full text-[9px] font-semibold uppercase flex items-center gap-1.5 transition-colors border border-red-500/20"><Trash2 size={12} /> Excluir</button>
              <button onClick={() => setSelectedIds([])} className="p-1.5 text-slate-400 hover:text-white transition-colors"><X size={16} /></button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isBulkCategoryModalOpen && (
          <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsBulkCategoryModalOpen(false)} className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="relative w-full max-w-sm bg-white rounded-xl shadow-xl overflow-hidden p-5">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-semibold text-sm uppercase tracking-tight text-slate-800">Alterar Categoria</h3>
                <button onClick={() => setIsBulkCategoryModalOpen(false)} className="bg-slate-50 p-1.5 rounded-md hover:bg-slate-100 transition-colors"><X size={14} className="text-slate-500" /></button>
              </div>
              <select value={bulkCategory} onChange={(e) => setBulkCategory(e.target.value)} className="w-full h-9 bg-slate-50 border border-slate-200 rounded-md px-3 text-[10px] font-semibold uppercase outline-none mb-4">
                <option value="" disabled>Escolha uma categoria...</option>
                {categorias.map(cat => <option key={cat} value={cat}>{cat}</option>)}
              </select>
              <Button onClick={() => bulkCategory && bulkCategoryMutation.mutate(bulkCategory)} disabled={!bulkCategory || bulkCategoryMutation.isPending} className="w-full h-9 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-semibold uppercase text-[10px]">
                {bulkCategoryMutation.isPending ? <Loader2 className="animate-spin w-4 h-4" /> : "Confirmar"}
              </Button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isCategoryModalOpen && (
          <CategoriaModal 
            setIsCategoryModalOpen={setIsCategoryModalOpen} 
            categorias={categorias} 
            handleRemoveCategory={handleRemoveCategory} 
            newCategoryName={newCategoryName} 
            setNewCategoryName={setNewCategoryName} 
            handleAddCategory={handleAddCategory} 
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isModalOpen && (
          <ProdutoModal 
            isModalOpen={isModalOpen}
            setIsModalOpen={setIsModalOpen}
            editingProduct={editingProduct}
            setEditingProduct={setEditingProduct}
            handleSave={handleSaveProduct}
            categorias={categorias}
            setIsCategoryModalOpen={setIsCategoryModalOpen}
            promoType={promoType}
            setPromoType={setPromoType}
            promoPercent={promoPercent}
            setPromoPercent={setPromoPercent}
          />
        )}
      </AnimatePresence>
      
      {/* RENDERIZANDO NOSSO NOVO MÓDULO DE REORDENAR */}
      <ReordenarVitrine 
         isOpen={isReorderModalOpen} 
         onClose={() => {
           setIsReorderModalOpen(false);
           // Atualiza os dados assim que o modal fecha para refletir a nova ordem
           queryClient.invalidateQueries({ queryKey: ["sistema-produtos"] }); 
         }} 
      />

    </div>
  );
}