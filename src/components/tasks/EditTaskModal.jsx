import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

import { X, Save, DollarSign, TrendingUp, PercentCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

import ChecklistEditor from "./ChecklistEditor";
import SeletorData from "@/components/SeletorData"; 
import SeletorCategoria from "@/components/SeletorCategoria";

const fmt = (v) =>
  (v || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export default function EditTaskModal({ task, onClose, onSave }) {
  const [form, setForm] = useState({ 
    ...task, 
    checklist: task.checklist || [],
    valor_pago: task.valor_pago || 0 
  });

  useEffect(() => {
    setForm({ 
      ...task, 
      checklist: task.checklist || [],
      valor_pago: task.valor_pago || 0 
    });
  }, [task]);

  const checklistTotal = (form.checklist || []).reduce((s, i) => s + (parseFloat(i.value) || 0), 0);
  const hasChecklist = form.checklist && form.checklist.length > 0;
  const displayValue = hasChecklist ? checklistTotal : (parseFloat(form.service_value) || 0);

  const handleSave = () => {
    let finalStatus = form.payment_status;
    let finalValorPago = Number(form.valor_pago) || 0;

    if (finalStatus === 'pago') finalValorPago = displayValue;
    if (finalStatus === 'em_aberto') finalValorPago = 0;
    
    if (finalStatus === 'parcial' && finalValorPago >= displayValue && displayValue > 0) {
      finalStatus = 'pago';
    }

    onSave(task.id, {
      ...form, 
      service_value: displayValue, // Salva o valor somado da checklist
      checklist: form.checklist,
      payment_status: finalStatus,
      valor_pago: finalValorPago
    });
    onClose();
  };

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <motion.div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose} />

        <motion.div
          className="relative w-full max-w-lg bg-white border border-slate-200 rounded-t-2xl sm:rounded-2xl shadow-2xl max-h-[90vh] overflow-y-auto flex flex-col"
          initial={{ y: 40, opacity: 0, scale: 0.95 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          exit={{ y: 40, opacity: 0, scale: 0.95 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 md:p-5 border-b border-slate-100 sticky top-0 bg-white z-20">
            <h2 className="text-base font-bold text-slate-800 uppercase tracking-tight">Editar Pedido</h2>
            <button className="h-8 w-8 bg-slate-50 hover:bg-slate-100 flex items-center justify-center rounded-md transition-colors text-slate-500" onClick={onClose}>
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="p-4 md:p-5 space-y-5">
            
            <div className="space-y-4 bg-slate-50 p-4 rounded-xl border border-slate-100">
              <div>
                <label className="text-[10px] font-bold text-slate-500 mb-1.5 block uppercase tracking-widest ml-1">Título do Pedido</label>
                <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="bg-white border-slate-200 text-sm font-bold text-slate-800" />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-500 mb-1.5 block uppercase tracking-widest ml-1">Descrição</label>
                <Textarea placeholder="Opcional..." value={form.description || ""} onChange={(e) => setForm({ ...form, description: e.target.value })} className="bg-white border-slate-200 text-sm font-medium text-slate-700 min-h-[70px]" />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                
                {/* MÓDULO CENTRAL DE DATA */}
                <SeletorData 
                  label="Data de Entrega" 
                  value={form.delivery_date} 
                  onChange={(val) => setForm({ ...form, delivery_date: val })} 
                  className="w-full"
                />

                <div className="space-y-1.5 w-full">
                  <label className="text-[9px] font-semibold uppercase text-slate-500 tracking-widest ml-1">Prioridade</label>
                  <Select value={form.priority} onValueChange={(v) => setForm({ ...form, priority: v })}>
                    <SelectTrigger className="h-10 text-[10px] font-semibold uppercase tracking-widest bg-slate-50 border-slate-200 rounded-md text-slate-700 focus:bg-white focus:ring-0">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="baixa">Baixa</SelectItem>
                      <SelectItem value="media">Média</SelectItem>
                      <SelectItem value="alta">Alta</SelectItem>
                      <SelectItem value="urgente">Urgente</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                {/* MÓDULO CENTRAL DE CATEGORIA */}
                <div className="space-y-1.5 w-full">
                  <label className="text-[9px] font-semibold uppercase text-slate-500 tracking-widest ml-1">Categoria</label>
                  <SeletorCategoria 
                    contexto="pedido" 
                    value={form.category} 
                    onChange={(val) => setForm({ ...form, category: val })} 
                  />
                </div>
              </div>
            </div>

            {/* CHECKLIST E VALOR */}
            <div className="space-y-4">
              <div>
                <label className="text-[10px] font-bold text-slate-500 mb-1.5 block uppercase tracking-widest ml-1">Valor Final do Serviço (R$)</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-400">R$</span>
                  {/* CAMPO BLOQUEADO (Apenas leitura do total) */}
                  <Input 
                    type="number" 
                    value={displayValue || ""} 
                    readOnly
                    disabled
                    className="bg-slate-100 border-slate-200 text-sm font-black text-slate-500 pl-9 h-11 cursor-not-allowed shadow-inner" 
                  />
                </div>
                <p className="text-[9px] text-slate-400 mt-1.5 font-bold uppercase tracking-widest px-1">Valor calculado automaticamente pela soma dos serviços abaixo.</p>
              </div>

              <div>
                <ChecklistEditor checklist={form.checklist} onChange={(c) => setForm({ ...form, checklist: c })} />
              </div>
            </div>

            {/* STATUS FINANCEIRO */}
            {displayValue > 0 && (
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                <label className="text-[10px] font-bold text-slate-500 mb-2.5 block uppercase tracking-widest ml-1 text-center">Como está o pagamento deste pedido?</label>
                
                <div className="grid grid-cols-3 gap-2">
                  <button type="button" onClick={() => setForm({ ...form, payment_status: "em_aberto" })} className={`flex flex-col items-center justify-center gap-1.5 py-3 px-1 rounded-lg border-2 text-[10px] font-black uppercase tracking-widest transition-all ${form.payment_status === "em_aberto" || !form.payment_status ? "border-rose-500 bg-rose-50 text-rose-600 shadow-sm" : "border-slate-200 bg-white text-slate-400 hover:border-rose-300"}`}>
                    <TrendingUp className="w-4 h-4" /> Pendente
                  </button>
                  <button type="button" onClick={() => setForm({ ...form, payment_status: "parcial" })} className={`flex flex-col items-center justify-center gap-1.5 py-3 px-1 rounded-lg border-2 text-[10px] font-black uppercase tracking-widest transition-all ${form.payment_status === "parcial" ? "border-blue-500 bg-blue-50 text-blue-600 shadow-sm" : "border-slate-200 bg-white text-slate-400 hover:border-blue-300"}`}>
                    <PercentCircle className="w-4 h-4" /> Sinal / Parcial
                  </button>
                  <button type="button" onClick={() => setForm({ ...form, payment_status: "pago" })} className={`flex flex-col items-center justify-center gap-1.5 py-3 px-1 rounded-lg border-2 text-[10px] font-black uppercase tracking-widest transition-all ${form.payment_status === "pago" ? "border-emerald-500 bg-emerald-50 text-emerald-600 shadow-sm" : "border-slate-200 bg-white text-slate-400 hover:border-emerald-300"}`}>
                    <DollarSign className="w-4 h-4" /> Todo Pago
                  </button>
                </div>

                <AnimatePresence>
                  {form.payment_status === "parcial" && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden mt-4 pt-4 border-t border-slate-200">
                       <div className="flex items-center gap-3">
                          <div className="flex-1">
                             <label className="text-[9px] font-bold text-blue-600 mb-1 block uppercase tracking-widest">Quanto o cliente já pagou? (Sinal)</label>
                             <div className="relative">
                               <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-blue-400">R$</span>
                               <Input type="number" value={form.valor_pago || ""} onChange={(e) => setForm({ ...form, valor_pago: Number(e.target.value) })} className="bg-white border-blue-200 text-sm font-black text-blue-700 pl-8 h-10 focus:border-blue-400 shadow-sm" />
                             </div>
                          </div>
                          <div className="w-24 text-right">
                             <span className="text-[9px] font-bold text-slate-400 block uppercase tracking-widest mb-1">Falta Pagar</span>
                             <span className="text-sm font-black text-rose-500">{fmt(displayValue - (Number(form.valor_pago) || 0))}</span>
                          </div>
                       </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}
          </div>

          <div className="flex gap-3 p-4 md:p-5 border-t border-slate-100 sticky bottom-0 bg-white z-10">
            <Button variant="outline" className="flex-1 h-11 text-xs font-bold uppercase tracking-widest border-slate-200 text-slate-500 hover:bg-slate-50" onClick={onClose}>Cancelar</Button>
            <Button className="flex-1 h-11 text-xs font-black uppercase tracking-widest bg-blue-600 hover:bg-blue-700 text-white shadow-sm" onClick={handleSave} disabled={!form.title?.trim()}>
              <Save className="w-4 h-4 mr-2" /> Salvar Edição
            </Button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}