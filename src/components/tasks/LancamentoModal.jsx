import React, { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Wallet, X, ArrowUpCircle, ArrowDownCircle, Loader2, CheckCircle2 } from "lucide-react";

export default function LancamentoModal({ isOpen, onClose, tipoInicial = 'entrada' }) {
  const queryClient = useQueryClient();
  const [tipoTransacao, setTipoTransacao] = useState(tipoInicial);
  const [descricao, setDescricao] = useState('');
  const [valor, setValor] = useState('');
  const [dataTransacao, setDataTransacao] = useState('');

  // Ao abrir o modal, reseta os dados e coloca a data de hoje
  useEffect(() => {
    if (isOpen) {
      const hoje = new Date();
      const hojeString = `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, '0')}-${String(hoje.getDate()).padStart(2, '0')}`;
      setDataTransacao(hojeString);
      setTipoTransacao(tipoInicial);
      setDescricao('');
      setValor('');
    }
  }, [isOpen, tipoInicial]);

  const addTransactionMutation = useMutation({
    mutationFn: async () => {
      const valorNum = parseFloat(valor) || 0;
      const dataISO = new Date(`${dataTransacao}T12:00:00`).toISOString();

      if (tipoTransacao === 'entrada') {
        const { error } = await supabase.from('pedidos').insert([{
          title: `Entrada Avulsa: ${descricao}`,
          service_value: valorNum,
          valor_pago: valorNum,
          status: 'concluida',
          payment_status: 'pago',
          category: 'Avulso',
          completed_date: dataISO
        }]);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('despesas').insert([{
          descricao: `Saída Avulsa: ${descricao}`,
          valor: valorNum,
          valor_pago: valorNum,
          status: 'pago',
          vencimento: dataTransacao,
          categoria: 'Avulso'
        }]);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["fluxo-pedidos"] });
      queryClient.invalidateQueries({ queryKey: ["fluxo-despesas"] });
      queryClient.invalidateQueries({ queryKey: ["art-tasks"] });
      onClose(); // Fecha o modal automaticamente
    }
  });

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" />
          <motion.div initial={{ scale: 0.95, opacity: 0, y: 10 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 10 }} className="bg-white w-full max-w-sm rounded-xl p-5 shadow-2xl relative z-[210]">
            <div className="flex justify-between items-center mb-5">
              <h2 className="text-sm font-semibold text-slate-800 uppercase tracking-tight flex items-center gap-2">
                <Wallet className="text-blue-600" size={16} /> Lançamento
              </h2>
              <button onClick={onClose} className="p-1 hover:bg-slate-100 text-slate-500 rounded-md transition-colors"><X size={16} /></button>
            </div>
            
            <div className="space-y-4">
              <div className="flex bg-slate-100 p-1 rounded-md">
                <button onClick={() => setTipoTransacao('entrada')} className={`flex-1 py-1.5 text-[9px] font-semibold uppercase tracking-widest rounded transition-all flex items-center justify-center gap-1.5 ${tipoTransacao === 'entrada' ? 'bg-white shadow-sm text-emerald-600' : 'text-slate-400 hover:text-slate-600'}`}>
                  <ArrowUpCircle size={12} /> Entrada
                </button>
                <button onClick={() => setTipoTransacao('saida')} className={`flex-1 py-1.5 text-[9px] font-semibold uppercase tracking-widest rounded transition-all flex items-center justify-center gap-1.5 ${tipoTransacao === 'saida' ? 'bg-white shadow-sm text-rose-600' : 'text-slate-400 hover:text-slate-600'}`}>
                  <ArrowDownCircle size={12} /> Saída
                </button>
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-semibold uppercase text-slate-500 tracking-widest ml-0.5">Descrição</label>
                <Input value={descricao} onChange={e => setDescricao(e.target.value)} placeholder="Ex: Venda balcão..." className="h-9 border-slate-200 text-xs font-medium" autoFocus />
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
                  addTransactionMutation.mutate();
                }} 
                disabled={addTransactionMutation.isPending}
                className={`w-full h-10 mt-2 text-white font-semibold uppercase tracking-widest text-[10px] shadow-sm transition-all ${tipoTransacao === 'entrada' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-rose-600 hover:bg-rose-700'}`}
              >
                {addTransactionMutation.isPending ? <Loader2 size={14} className="animate-spin" /> : (
                  <><CheckCircle2 size={14} className="mr-1.5" /> Salvar {tipoTransacao}</>
                )}
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}