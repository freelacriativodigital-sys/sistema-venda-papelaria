import React, { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Wallet, X, ArrowUpCircle, ArrowDownCircle, Loader2, CheckCircle2, Tags, Pencil, Trash2, Plus, Save } from "lucide-react";

export default function LancamentoModal({ isOpen, onClose, tipoInicial = 'entrada', editingData = null }) {
  const queryClient = useQueryClient();
  const [tipoTransacao, setTipoTransacao] = useState(tipoInicial);
  const [descricao, setDescricao] = useState('');
  const [valor, setValor] = useState('');
  const [dataTransacao, setDataTransacao] = useState('');
  const [categoriaSelecionada, setCategoriaSelecionada] = useState('Outros');

  // Gestão de Categorias
  const [isManagingCats, setIsManagingCats] = useState(false);
  const [novaCategoria, setNovaCategoria] = useState('');
  const [categorias, setCategorias] = useState({ entradas: [], saidas: [] });
  const [catEditando, setCatEditando] = useState(null);
  const [catTextoEditado, setCatTextoEditado] = useState('');

  // Busca as categorias do banco de dados
  const { data: configData } = useQuery({
    queryKey: ["categorias_financeiro"],
    queryFn: async () => {
      const { data, error } = await supabase.from('configuracoes').select('categorias_financeiro').eq('id', 1).single();
      if (!error && data?.categorias_financeiro) return data.categorias_financeiro;
      return { entradas: ["Venda", "Serviço", "Outros"], saidas: ["Material", "Fixo", "Outros"] };
    },
    enabled: isOpen
  });

  useEffect(() => {
    if (configData) setCategorias(configData);
  }, [configData]);

  // Preenche os dados se for Edição ou reseta se for Novo
  useEffect(() => {
    if (isOpen) {
      if (editingData) {
        setTipoTransacao(editingData.tipo);
        setDescricao(editingData.descricao);
        setValor(editingData.valor);
        setDataTransacao(editingData.dataOriginal ? editingData.dataOriginal.split('T')[0] : '');
        setCategoriaSelecionada(editingData.categoria || 'Outros');
      } else {
        const hoje = new Date();
        const hojeStr = `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, '0')}-${String(hoje.getDate()).padStart(2, '0')}`;
        setDataTransacao(hojeStr);
        setTipoTransacao(tipoInicial);
        setDescricao('');
        setValor('');
        setCategoriaSelecionada('Outros');
      }
      setIsManagingCats(false);
    }
  }, [isOpen, tipoInicial, editingData]);

  // Salvar alterações das categorias no banco
  const updateCategoriasMutation = useMutation({
    mutationFn: async (novasCategorias) => {
      const { error } = await supabase.from('configuracoes').update({ categorias_financeiro: novasCategorias }).eq('id', 1);
      if (error) throw error;
      return novasCategorias;
    },
    onSuccess: (novas) => {
      setCategorias(novas);
      queryClient.invalidateQueries({ queryKey: ["categorias_financeiro"] });
    }
  });

  const handleAddCategoria = () => {
    if (!novaCategoria.trim()) return;
    const lista = tipoTransacao === 'entrada' ? [...categorias.entradas] : [...categorias.saidas];
    if (!lista.includes(novaCategoria.trim())) {
      lista.push(novaCategoria.trim());
      const novas = { ...categorias, [tipoTransacao === 'entrada' ? 'entradas' : 'saidas']: lista };
      updateCategoriasMutation.mutate(novas);
    }
    setNovaCategoria('');
  };

  const handleEditCategoria = (catAntiga) => {
    if (!catTextoEditado.trim()) return;
    const lista = tipoTransacao === 'entrada' ? [...categorias.entradas] : [...categorias.saidas];
    const index = lista.indexOf(catAntiga);
    if (index > -1) {
      lista[index] = catTextoEditado.trim();
      const novas = { ...categorias, [tipoTransacao === 'entrada' ? 'entradas' : 'saidas']: lista };
      updateCategoriasMutation.mutate(novas);
    }
    setCatEditando(null);
  };

  const handleDeleteCategoria = (catParaExcluir) => {
    const lista = tipoTransacao === 'entrada' ? categorias.entradas.filter(c => c !== catParaExcluir) : categorias.saidas.filter(c => c !== catParaExcluir);
    const novas = { ...categorias, [tipoTransacao === 'entrada' ? 'entradas' : 'saidas']: lista };
    updateCategoriasMutation.mutate(novas);
  };

  // Salvar a Transação (Novo ou Edição)
  const saveTransactionMutation = useMutation({
    mutationFn: async () => {
      const valorNum = parseFloat(valor) || 0;
      const dataISO = new Date(`${dataTransacao}T12:00:00`).toISOString();

      if (editingData) {
        // MODO EDIÇÃO
        if (editingData.tipo === 'entrada') {
          const { error } = await supabase.from('pedidos').update({
            title: descricao,
            service_value: valorNum,
            valor_pago: valorNum,
            category: categoriaSelecionada,
            completed_date: dataISO
          }).eq('id', editingData.idOriginal);
          if (error) throw error;
        } else {
          const { error } = await supabase.from('despesas').update({
            descricao: descricao,
            valor: valorNum,
            valor_pago: valorNum,
            categoria: categoriaSelecionada,
            vencimento: dataTransacao
          }).eq('id', editingData.idOriginal);
          if (error) throw error;
        }
      } else {
        // MODO CRIAÇÃO
        if (tipoTransacao === 'entrada') {
          const { error } = await supabase.from('pedidos').insert([{
            title: descricao,
            service_value: valorNum,
            valor_pago: valorNum,
            status: 'concluida',
            payment_status: 'pago',
            category: categoriaSelecionada,
            completed_date: dataISO
          }]);
          if (error) throw error;
        } else {
          const { error } = await supabase.from('despesas').insert([{
            descricao: descricao,
            valor: valorNum,
            valor_pago: valorNum,
            status: 'pago',
            vencimento: dataTransacao,
            categoria: categoriaSelecionada
          }]);
          if (error) throw error;
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["fluxo-pedidos"] });
      queryClient.invalidateQueries({ queryKey: ["fluxo-despesas"] });
      queryClient.invalidateQueries({ queryKey: ["art-tasks"] });
      onClose(); 
    }
  });

  const listaCategoriasAtuais = tipoTransacao === 'entrada' ? categorias.entradas : categorias.saidas;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" />
          <motion.div initial={{ scale: 0.95, opacity: 0, y: 10 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 10 }} className="bg-white w-full max-w-sm rounded-xl p-5 shadow-2xl relative z-[210] overflow-hidden">
            
            <div className="flex justify-between items-center mb-5">
              <h2 className="text-sm font-semibold text-slate-800 uppercase tracking-tight flex items-center gap-2">
                <Wallet className="text-blue-600" size={16} /> 
                {editingData ? 'Editar Transação' : 'Lançamento'}
              </h2>
              <button onClick={onClose} className="p-1 hover:bg-slate-100 text-slate-500 rounded-md transition-colors"><X size={16} /></button>
            </div>
            
            <div className="relative">
              <AnimatePresence mode="wait">
                
                {/* TELA 2: GERENCIADOR DE CATEGORIAS */}
                {isManagingCats ? (
                  <motion.div key="cats" initial={{ x: 50, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -50, opacity: 0 }} className="space-y-4">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-[10px] font-semibold uppercase tracking-widest text-slate-500 flex items-center gap-1.5"><Tags size={12}/> Categorias de {tipoTransacao}</h3>
                      <button onClick={() => setIsManagingCats(false)} className="text-[9px] font-bold text-blue-600 uppercase tracking-widest hover:underline">Voltar</button>
                    </div>

                    <div className="flex gap-2">
                      <Input value={novaCategoria} onChange={e => setNovaCategoria(e.target.value)} placeholder="Nova categoria..." className="h-8 text-xs" />
                      <Button onClick={handleAddCategoria} disabled={updateCategoriasMutation.isPending} className="h-8 px-3 bg-slate-800 text-white"><Plus size={14}/></Button>
                    </div>

                    <div className="max-h-[200px] overflow-y-auto space-y-1.5 pr-1">
                      {listaCategoriasAtuais.map(cat => (
                        <div key={cat} className="flex items-center justify-between bg-slate-50 border border-slate-100 p-2 rounded-md group">
                          {catEditando === cat ? (
                            <div className="flex items-center gap-2 w-full">
                               <Input value={catTextoEditado} onChange={e => setCatTextoEditado(e.target.value)} className="h-7 text-[10px] px-2" autoFocus />
                               <button onClick={() => handleEditCategoria(cat)} className="text-emerald-600 p-1"><Save size={14}/></button>
                               <button onClick={() => setCatEditando(null)} className="text-slate-400 p-1"><X size={14}/></button>
                            </div>
                          ) : (
                            <>
                              <span className="text-xs font-semibold text-slate-700">{cat}</span>
                              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button onClick={() => { setCatEditando(cat); setCatTextoEditado(cat); }} className="p-1 text-slate-400 hover:text-blue-600"><Pencil size={12}/></button>
                                <button onClick={() => handleDeleteCategoria(cat)} className="p-1 text-slate-400 hover:text-rose-600"><Trash2 size={12}/></button>
                              </div>
                            </>
                          )}
                        </div>
                      ))}
                    </div>
                  </motion.div>

                ) : (
                  
                  /* TELA 1: FORMULÁRIO DE TRANSAÇÃO */
                  <motion.div key="form" initial={{ x: -50, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: 50, opacity: 0 }} className="space-y-4">
                    
                    {!editingData && (
                      <div className="flex bg-slate-100 p-1 rounded-md">
                        <button onClick={() => { setTipoTransacao('entrada'); setCategoriaSelecionada('Outros'); }} className={`flex-1 py-1.5 text-[9px] font-semibold uppercase tracking-widest rounded transition-all flex items-center justify-center gap-1.5 ${tipoTransacao === 'entrada' ? 'bg-white shadow-sm text-emerald-600' : 'text-slate-400 hover:text-slate-600'}`}>
                          <ArrowUpCircle size={12} /> Entrada
                        </button>
                        <button onClick={() => { setTipoTransacao('saida'); setCategoriaSelecionada('Outros'); }} className={`flex-1 py-1.5 text-[9px] font-semibold uppercase tracking-widest rounded transition-all flex items-center justify-center gap-1.5 ${tipoTransacao === 'saida' ? 'bg-white shadow-sm text-rose-600' : 'text-slate-400 hover:text-slate-600'}`}>
                          <ArrowDownCircle size={12} /> Saída
                        </button>
                      </div>
                    )}

                    <div className="space-y-1">
                      <label className="text-[9px] font-semibold uppercase text-slate-500 tracking-widest ml-0.5">Descrição</label>
                      <Input value={descricao} onChange={e => setDescricao(e.target.value)} placeholder="Ex: Venda balcão..." className="h-9 border-slate-200 text-xs font-medium" autoFocus />
                    </div>

                    <div className="space-y-1">
                       <div className="flex justify-between items-end">
                         <label className="text-[9px] font-semibold uppercase text-slate-500 tracking-widest ml-0.5">Categoria</label>
                         <button onClick={() => setIsManagingCats(true)} className="text-[8px] text-blue-600 font-bold uppercase tracking-widest hover:underline flex items-center gap-1"><Pencil size={10}/> Editar Categorias</button>
                       </div>
                       <Select value={categoriaSelecionada} onValueChange={setCategoriaSelecionada}>
                          <SelectTrigger className="h-9 border-slate-200 text-xs font-semibold text-slate-700">
                             <SelectValue placeholder="Selecione a categoria" />
                          </SelectTrigger>
                          <SelectContent>
                             {listaCategoriasAtuais?.map(cat => (
                               <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                             ))}
                          </SelectContent>
                       </Select>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-[9px] font-semibold uppercase text-slate-500 tracking-widest ml-0.5">Valor (R$)</label>
                        <Input type="number" value={valor} onChange={e => setValor(e.target.value)} placeholder="0.00" className="h-9 border-slate-200 text-xs font-semibold" />
                      </div>
                      
                      <div className="space-y-1">
                        <label className="text-[9px] font-semibold uppercase text-slate-500 tracking-widest ml-0.5">Data</label>
                        <Input type="date" value={dataTransacao} onChange={e => setDataTransacao(e.target.value)} className="h-9 border-slate-200 text-xs font-semibold text-slate-600" />
                      </div>
                    </div>

                    <Button 
                      onClick={() => {
                        if (!descricao.trim() || !valor) return alert("Preencha a descrição e o valor.");
                        if (!dataTransacao) return alert("A data é obrigatória.");
                        saveTransactionMutation.mutate();
                      }} 
                      disabled={saveTransactionMutation.isPending}
                      className={`w-full h-10 mt-2 text-white font-semibold uppercase tracking-widest text-[10px] shadow-sm transition-all ${tipoTransacao === 'entrada' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-rose-600 hover:bg-rose-700'}`}
                    >
                      {saveTransactionMutation.isPending ? <Loader2 size={14} className="animate-spin" /> : (
                        <><CheckCircle2 size={14} className="mr-1.5" /> {editingData ? 'Salvar Edição' : `Salvar ${tipoTransacao}`}</>
                      )}
                    </Button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}