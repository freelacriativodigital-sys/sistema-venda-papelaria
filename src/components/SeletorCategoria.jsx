import React, { useState } from 'react';
import { supabase } from "../lib/supabase";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Settings, Plus, Trash2, X, Loader2, Tag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AnimatePresence, motion } from "framer-motion";

export default function SeletorCategoria({ contexto, value, onChange }) {
  const [isManageOpen, setIsManageOpen] = useState(false);
  const [novaCategoria, setNovaCategoria] = useState('');
  const queryClient = useQueryClient();

  // Puxar as categorias dinamicamente de acordo com o contexto (pedido, despesa, receita, catalogo)
  const { data: categorias = [], isLoading } = useQuery({
    queryKey: ['sistema-categorias', contexto],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('categorias')
        .select('*')
        .eq('contexto', contexto)
        .order('nome', { ascending: true });
      
      if (error && error.code !== '42P01') throw error;
      return data || [];
    },
    // Refazer a query sempre que o contexto mudar
    enabled: !!contexto
  });

  const addMutation = useMutation({
    mutationFn: async (nome) => {
      const { error } = await supabase
        .from('categorias')
        .insert([{ nome: nome.trim(), contexto }]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sistema-categorias', contexto] });
      setNovaCategoria('');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      const { error } = await supabase.from('categorias').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sistema-categorias', contexto] });
    }
  });

  const handleAdd = () => {
    if (!novaCategoria.trim()) return;
    addMutation.mutate(novaCategoria);
  };

  return (
    <div className="flex gap-1.5 items-center w-full">
      {/* O Campo de Seleção Normal */}
      <div className="relative flex-1">
        {isLoading ? (
          <div className="h-10 border border-slate-200 bg-slate-50 rounded-md flex items-center px-3 text-[10px] font-medium text-slate-400">
            <Loader2 className="w-3.5 h-3.5 animate-spin mr-2" /> Carregando...
          </div>
        ) : (
          <select 
            value={value || ''} 
            onChange={e => onChange(e.target.value)}
            className="w-full h-10 border border-slate-200 rounded-md px-3 text-[10px] font-semibold uppercase tracking-widest outline-none bg-slate-50 focus:bg-white text-slate-700 appearance-none"
          >
            <option value="" disabled>Selecione...</option>
            {categorias.map(cat => (
              <option key={cat.id} value={cat.nome}>{cat.nome}</option>
            ))}
            {categorias.length === 0 && (
              <option value="" disabled>Nenhuma categoria criada</option>
            )}
          </select>
        )}
      </div>

      {/* O Botão de Engrenagem (Abre o Gestor) */}
      <Button 
        type="button"
        onClick={() => setIsManageOpen(true)}
        variant="outline" 
        className="h-10 w-10 shrink-0 border-slate-200 text-slate-400 hover:text-blue-600 hover:bg-blue-50 p-0"
        title="Gerir Categorias"
      >
        <Settings size={14} />
      </Button>

      {/* MODAL: GESTOR DE CATEGORIAS */}
      <AnimatePresence>
        {isManageOpen && (
          <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsManageOpen(false)} className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" />
            <motion.div initial={{ scale: 0.95, opacity: 0, y: 10 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 10 }} className="bg-white w-full max-w-sm rounded-xl p-5 shadow-xl relative z-10 border border-slate-100 flex flex-col max-h-[85vh]">
              
              <div className="flex justify-between items-center mb-4 pb-3 border-b border-slate-100">
                <h2 className="text-sm font-semibold text-slate-800 uppercase tracking-tight flex items-center gap-1.5">
                   <Tag size={16} className="text-blue-600"/> Categorias
                </h2>
                <button onClick={() => setIsManageOpen(false)} className="p-1 hover:bg-slate-100 text-slate-500 rounded transition-colors"><X size={16} /></button>
              </div>

              {/* Formulário de Adicionar Nova */}
              <div className="flex gap-2 mb-4 bg-slate-50 p-2 rounded-lg border border-slate-100">
                <Input 
                  placeholder="Nova categoria..." 
                  value={novaCategoria}
                  onChange={e => setNovaCategoria(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleAdd()}
                  className="h-8 bg-white border-slate-200 text-xs font-medium"
                />
                <Button 
                  onClick={handleAdd} 
                  disabled={addMutation.isPending || !novaCategoria.trim()}
                  className="h-8 px-3 bg-blue-600 hover:bg-blue-700 text-white text-[9px] uppercase font-bold tracking-widest shrink-0"
                >
                  {addMutation.isPending ? <Loader2 size={12} className="animate-spin" /> : <Plus size={14} />}
                </Button>
              </div>

              {/* Lista das Categorias Existentes */}
              <div className="flex-1 overflow-y-auto no-scrollbar space-y-1.5 pr-1">
                {categorias.length === 0 ? (
                  <p className="text-center text-[10px] font-medium uppercase tracking-widest text-slate-400 py-6">
                    Ainda não existem categorias neste contexto.
                  </p>
                ) : (
                  categorias.map(cat => (
                    <div key={cat.id} className="flex items-center justify-between p-2.5 bg-white border border-slate-100 rounded-md hover:border-slate-200 transition-colors group">
                      <span className="text-xs font-semibold text-slate-700 uppercase tracking-tight">{cat.nome}</span>
                      <button 
                        onClick={() => { if(window.confirm("Apagar esta categoria?")) deleteMutation.mutate(cat.id); }}
                        className="text-slate-300 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity p-1"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}