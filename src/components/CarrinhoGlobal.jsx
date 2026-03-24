import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ShoppingCart, X, Plus, CheckSquare, Square, Trash2, Loader2 } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

export default function CarrinhoGlobal() {
  const [isOpen, setIsOpen] = useState(false);
  const [novoItemCompra, setNovoItemCompra] = useState('');
  const [prioridadeCompra, setPrioridadeCompra] = useState('normal');
  const queryClient = useQueryClient();

  const { data: listaCompras = [] } = useQuery({
    queryKey: ["lista_compras"],
    queryFn: async () => {
      const { data, error } = await supabase.from("lista_compras").select("*").order("concluido", { ascending: true }).order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: isOpen // Só faz a busca no banco se a gaveta estiver aberta para não gastar internet
  });

  const addCompraMutation = useMutation({
    mutationFn: async (novo) => {
      const { error } = await supabase.from("lista_compras").insert([novo]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["lista_compras"]);
      setNovoItemCompra('');
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
    addCompraMutation.mutate({ item: novoItemCompra, prioridade: prioridadeCompra, concluido: false });
  };

  const itensPendentes = listaCompras.filter(i => !i.concluido).length;

  return (
    <>
      {/* BOTÃO FLUTUANTE (Fica no canto inferior direito da tela inteira) */}
      <button 
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-40 w-14 h-14 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg shadow-blue-600/30 flex items-center justify-center transition-transform hover:scale-105 active:scale-95"
      >
        <ShoppingCart size={24} />
        {itensPendentes > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-rose-500 text-white text-[10px] font-black rounded-full flex items-center justify-center shadow-sm">
            {itensPendentes}
          </span>
        )}
      </button>

      {/* A GAVETA (SIDEBAR) */}
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50"
            />
            <motion.div 
              initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: "spring", bounce: 0, duration: 0.4 }}
              className="fixed top-0 right-0 h-full w-full max-w-sm bg-slate-50 shadow-2xl z-50 flex flex-col border-l border-slate-200"
            >
              {/* HEADER DA GAVETA */}
              <div className="p-5 bg-white border-b border-slate-200 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center"><ShoppingCart size={20}/></div>
                  <div>
                    <h2 className="text-base font-black text-slate-800 uppercase tracking-tight leading-none">Lista de Compras</h2>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Anotou, não esqueceu.</p>
                  </div>
                </div>
                <button onClick={() => setIsOpen(false)} className="p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 rounded-lg transition-colors">
                  <X size={20} />
                </button>
              </div>

              {/* ÁREA DE ADICIONAR ITEM */}
              <div className="p-5 bg-white border-b border-slate-200">
                <div className="space-y-3">
                  <input 
                    type="text" 
                    placeholder="Ex: Tinta Preta Epson..."
                    value={novoItemCompra}
                    onChange={e => setNovoItemCompra(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleAddCompra()}
                    className="w-full h-11 px-3 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-lg outline-none focus:bg-white focus:border-blue-400 transition-all"
                  />
                  <div className="flex gap-2">
                    <select 
                      value={prioridadeCompra}
                      onChange={e => setPrioridadeCompra(e.target.value)}
                      className="flex-1 h-11 px-3 text-[11px] font-bold uppercase bg-slate-50 border border-slate-200 rounded-lg outline-none focus:bg-white focus:border-blue-400"
                    >
                      <option value="alta">🔴 Urgente</option>
                      <option value="normal">🟡 Normal</option>
                      <option value="baixa">🟢 Baixa</option>
                    </select>
                    <button 
                      onClick={handleAddCompra}
                      disabled={addCompraMutation.isPending || !novoItemCompra.trim()}
                      className="h-11 px-5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center justify-center shadow-sm disabled:opacity-50 transition-all font-bold uppercase text-[10px] tracking-widest gap-2"
                    >
                      {addCompraMutation.isPending ? <Loader2 size={16} className="animate-spin" /> : <><Plus size={16} /> Add</>}
                    </button>
                  </div>
                </div>
              </div>

              {/* LISTA DE ITENS */}
              <div className="flex-1 overflow-y-auto p-5 space-y-2">
                {listaCompras.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-slate-300 opacity-70">
                    <CheckSquare size={48} className="mb-3"/>
                    <p className="text-xs font-bold uppercase tracking-widest">Nenhuma compra pendente!</p>
                  </div>
                ) : (
                  listaCompras.map(item => (
                    <div key={item.id} className={`flex items-center justify-between p-3.5 rounded-xl border transition-all ${item.concluido ? 'bg-transparent border-slate-200 opacity-50' : 'bg-white border-slate-200 shadow-sm'}`}>
                      <div className="flex items-center gap-3 overflow-hidden cursor-pointer" onClick={() => toggleCompraMutation.mutate({ id: item.id, concluido: item.concluido })}>
                        <button className={`shrink-0 ${item.concluido ? 'text-emerald-500' : 'text-slate-300'}`}>
                          {item.concluido ? <CheckSquare size={20}/> : <Square size={20}/>}
                        </button>
                        <div className="truncate">
                          <p className={`text-xs font-bold truncate ${item.concluido ? 'text-slate-500 line-through' : 'text-slate-700'}`}>{item.item}</p>
                          <span className={`text-[9px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded mt-1 inline-block ${
                            item.prioridade === 'alta' ? 'bg-rose-100 text-rose-600' : 
                            item.prioridade === 'normal' ? 'bg-amber-100 text-amber-600' : 'bg-emerald-100 text-emerald-600'
                          }`}>
                            {item.prioridade}
                          </span>
                        </div>
                      </div>
                      <button onClick={() => deleteCompraMutation.mutate(item.id)} className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-colors shrink-0">
                        <Trash2 size={16}/>
                      </button>
                    </div>
                  ))
                )}
              </div>

            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}