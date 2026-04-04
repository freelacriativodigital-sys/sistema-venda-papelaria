import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Save, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "../../lib/supabase";
import SeletorData from "@/components/SeletorData";

// --- MÁSCARA INTELIGENTE DO WHATSAPP ---
const formatWhatsApp = (val) => {
  if (!val) return '';

  let cleanVal = val.replace(/^\+?\s*55\s*/, '');
  let nums = cleanVal.replace(/\D/g, '');

  if (nums.length >= 12 && nums.startsWith('55')) {
    nums = nums.slice(2);
  }

  if (nums.length > 11) nums = nums.slice(0, 11);
  if (nums.length === 0) return '';

  let formatted = '+55 ';
  if (nums.length > 0) formatted += nums.slice(0, 2);
  if (nums.length > 2) formatted += ' ' + nums.slice(2, 7);
  if (nums.length > 7) formatted += '-' + nums.slice(7, 11);

  return formatted;
};

export default function ClienteModal({ isOpen, onClose, clienteInicial = "", onSuccess }) {
  const [nome, setNome] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [aniversario, setAniversario] = useState("");
  const [pendencia, setPendencia] = useState(0);
  const [pago, setPago] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setNome(clienteInicial);
      setWhatsapp("");
      setAniversario("");
      setPendencia(0);
      setPago(0);
    }
  }, [isOpen, clienteInicial]);

  const handleSalvar = async () => {
    if (!nome.trim()) return alert("O nome é obrigatório!");
    setLoading(true);

    const novoCliente = {
      nome: nome.trim(),
      whatsapp: whatsapp.trim(),
      aniversario: aniversario || null,
      valor_pendente: pendencia,
      valor_pago: pago
    };

    const { data, error } = await supabase.from('clientes').insert([novoCliente]).select();

    setLoading(false);

    if (error) {
      alert("Erro ao salvar cliente: " + error.message);
    } else if (data && data.length > 0) {
      if (onSuccess) onSuccess(data[0]); 
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }} 
          animate={{ opacity: 1, scale: 1 }} 
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-white rounded-xl shadow-2xl w-full max-w-md flex flex-col relative overflow-visible"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-slate-100">
            <h2 className="text-xs font-bold text-slate-800 uppercase tracking-widest">Novo Cliente</h2>
            <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
              <X size={16} />
            </button>
          </div>

          {/* Body */}
          <div className="p-5 space-y-4">
            <div className="space-y-1.5">
              <label className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Nome Completo</label>
              <Input value={nome} onChange={e => setNome(e.target.value)} className="h-9 text-xs font-medium" autoFocus />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">WhatsApp</label>
                <Input 
                  value={whatsapp} 
                  onChange={e => setWhatsapp(formatWhatsApp(e.target.value))} 
                  placeholder="+55 85 98765-4321"
                  className="h-9 text-xs font-medium" 
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Aniversário</label>
                <SeletorData 
                  value={aniversario} 
                  onChange={val => setAniversario(val)} 
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-2">
              <div className="space-y-1.5">
                <label className="text-[9px] font-bold text-rose-500 uppercase tracking-widest">Acrescer Pendência</label>
                <Input type="number" value={pendencia} onChange={e => setPendencia(Number(e.target.value))} className="h-9 text-xs font-bold text-rose-600 bg-rose-50 border-rose-100 focus:border-rose-300" />
              </div>
              <div className="space-y-1.5">
                <label className="text-[9px] font-bold text-emerald-500 uppercase tracking-widest">Acrescer Pago</label>
                <Input type="number" value={pago} onChange={e => setPago(Number(e.target.value))} className="h-9 text-xs font-bold text-emerald-600 bg-emerald-50 border-emerald-100 focus:border-emerald-300" />
              </div>
            </div>
            <p className="text-[8px] text-slate-400 uppercase tracking-widest font-medium mt-1">Os valores acima somam com os pedidos do sistema.</p>
          </div>

          {/* Footer */}
          <div className="p-4 bg-slate-50 border-t border-slate-100 rounded-b-xl">
            <Button onClick={handleSalvar} disabled={loading} className="w-full h-10 bg-blue-600 hover:bg-blue-700 text-white font-bold uppercase tracking-widest text-[10px]">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Save size={14} className="mr-2" /> Salvar Cliente</>}
            </Button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}