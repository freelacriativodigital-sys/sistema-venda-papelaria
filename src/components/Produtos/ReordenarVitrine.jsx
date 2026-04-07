import React, { useState, useEffect } from 'react';
import { X, ArrowUp, ArrowDown, Save, Loader2, Star, Package, LayoutGrid } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from "@/lib/supabase";
import { motion, AnimatePresence } from 'framer-motion';

export default function ReordenarVitrine({ isOpen, onClose }) {
  const [tab, setTab] = useState('destaques');
  const [produtosDestaque, setProdutosDestaque] = useState([]);
  const [produtosGeral, setProdutosGeral] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchProdutos();
    }
  }, [isOpen]);

  const fetchProdutos = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('produtos')
        .select('id, nome, imagem_url, imagens, destaque, ordem')
        .eq('status_online', true)
        .order('ordem', { ascending: true })
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (data) {
        setProdutosDestaque(data.filter(p => p.destaque));
        setProdutosGeral(data.filter(p => !p.destaque));
      }
    } catch (err) {
      alert("Erro ao buscar produtos: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const moverCima = (index, isDestaque) => {
    if (index === 0) return;
    const lista = isDestaque ? [...produtosDestaque] : [...produtosGeral];
    // Troca de posição
    [lista[index - 1], lista[index]] = [lista[index], lista[index - 1]];
    
    if (isDestaque) setProdutosDestaque(lista);
    else setProdutosGeral(lista);
  };

  const moverBaixo = (index, isDestaque) => {
    const lista = isDestaque ? [...produtosDestaque] : [...produtosGeral];
    if (index === lista.length - 1) return;
    // Troca de posição
    [lista[index + 1], lista[index]] = [lista[index], lista[index + 1]];
    
    if (isDestaque) setProdutosDestaque(lista);
    else setProdutosGeral(lista);
  };

  const getImagem = (prod) => {
    if (prod.imagem_url) return prod.imagem_url;
    if (prod.imagens && prod.imagens.length > 0) return prod.imagens[0];
    return 'https://placehold.co/100';
  };

  const salvarOrdem = async () => {
    setSaving(true);
    try {
      // Prepara a atualização em lote definindo a nova ordem baseada na posição da lista
      const updatesDestaque = produtosDestaque.map((p, index) => ({ id: p.id, ordem: index + 1 }));
      const updatesGeral = produtosGeral.map((p, index) => ({ id: p.id, ordem: index + 1 }));
      
      const todosUpdates = [...updatesDestaque, ...updatesGeral];

      // Como o Supabase não tem update em lote nativo simples, fazemos um loop rápido
      for (const item of todosUpdates) {
        await supabase.from('produtos').update({ ordem: item.ordem }).eq('id', item.id);
      }

      alert("Ordem da vitrine atualizada com sucesso!");
      onClose();
    } catch (error) {
      alert("Erro ao salvar ordem: " + error.message);
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  const listaAtual = tab === 'destaques' ? produtosDestaque : produtosGeral;

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }} 
        animate={{ opacity: 1, scale: 1 }} 
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden"
      >
        {/* HEADER */}
        <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-slate-50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center shadow-sm">
              <LayoutGrid size={16} />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-slate-800 uppercase tracking-tight leading-none">Organizar Vitrine</h2>
              <p className="text-[9px] text-slate-500 font-medium uppercase tracking-widest mt-0.5">Escolha a ordem dos produtos no site</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-md transition-colors">
            <X size={16} />
          </button>
        </div>

        {/* ABAS */}
        <div className="flex bg-slate-100 p-1.5 mx-4 mt-4 rounded-lg">
          <button 
            onClick={() => setTab('destaques')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-md text-[10px] font-semibold uppercase tracking-widest transition-all ${tab === 'destaques' ? 'bg-white text-amber-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            <Star size={14} className={tab === 'destaques' ? 'fill-amber-500' : ''} /> Produtos Destaque
          </button>
          <button 
            onClick={() => setTab('geral')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-md text-[10px] font-semibold uppercase tracking-widest transition-all ${tab === 'geral' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            <Package size={14} /> Todos os Produtos
          </button>
        </div>

        {/* LISTA */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2 bg-slate-50/50 mt-2">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 text-slate-400">
              <Loader2 size={32} className="animate-spin mb-3" />
              <span className="text-[10px] font-semibold uppercase tracking-widest">Carregando catálogo...</span>
            </div>
          ) : listaAtual.length === 0 ? (
            <div className="text-center py-16 bg-white border border-slate-200 rounded-xl shadow-sm">
              <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest">Nenhum produto nesta lista.</p>
            </div>
          ) : (
            <AnimatePresence mode="popLayout">
              {listaAtual.map((prod, index) => (
                <motion.div 
                  key={prod.id} 
                  layout
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex items-center gap-3 bg-white p-2.5 rounded-lg border border-slate-200 shadow-sm group hover:border-blue-300 transition-colors"
                >
                  <span className="text-[10px] font-bold text-slate-400 w-5 text-center">{index + 1}º</span>
                  
                  <div className="w-10 h-10 rounded-md overflow-hidden bg-slate-100 shrink-0 border border-slate-100">
                    <img src={getImagem(prod)} className="w-full h-full object-cover" />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-slate-800 truncate">{prod.nome}</p>
                    {prod.destaque && <span className="text-[8px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full uppercase font-bold tracking-widest">Destaque</span>}
                  </div>

                  <div className="flex flex-col gap-1 shrink-0">
                    <button 
                      onClick={() => moverCima(index, tab === 'destaques')}
                      disabled={index === 0}
                      className="w-7 h-6 flex items-center justify-center bg-slate-50 border border-slate-200 rounded text-slate-500 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    >
                      <ArrowUp size={14} />
                    </button>
                    <button 
                      onClick={() => moverBaixo(index, tab === 'destaques')}
                      disabled={index === listaAtual.length - 1}
                      className="w-7 h-6 flex items-center justify-center bg-slate-50 border border-slate-200 rounded text-slate-500 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    >
                      <ArrowDown size={14} />
                    </button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          )}
        </div>

        {/* FOOTER */}
        <div className="p-4 border-t border-slate-100 bg-white flex justify-end gap-3">
          <Button variant="outline" onClick={onClose} className="h-9 px-4 text-[10px] font-semibold uppercase tracking-widest rounded-md">
            Cancelar
          </Button>
          <Button onClick={salvarOrdem} disabled={loading || saving} className="h-9 px-6 bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-semibold uppercase tracking-widest rounded-md shadow-sm gap-2">
            {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
            {saving ? 'Salvando...' : 'Salvar Ordem'}
          </Button>
        </div>
      </motion.div>
    </div>
  );
}