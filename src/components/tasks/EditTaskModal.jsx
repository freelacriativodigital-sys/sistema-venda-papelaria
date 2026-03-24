import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

import { X, Save, DollarSign, TrendingUp, Settings2, PercentCircle, CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { base44 as db } from "../../api"; 

import ChecklistEditor from "./ChecklistEditor";
import CategoryManager from "./CategoryManager";

const DEFAULT_CATEGORIES = [];

const fmt = (v) =>
  (v || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export default function EditTaskModal({ task, onClose, onSave }) {
  const [form, setForm] = useState({ 
    ...task, 
    checklist: task.checklist || [],
    valor_pago: task.valor_pago || 0 
  });
  const [managingCats, setManagingCats] = useState(false);

  // Inicia com a data correta baseada no banco
  const [selectedDate, setSelectedDate] = useState(task.delivery_date ? parseISO(task.delivery_date) : undefined);

  useEffect(() => {
    setForm({ 
      ...task, 
      checklist: task.checklist || [],
      valor_pago: task.valor_pago || 0 
    });
    setSelectedDate(task.delivery_date ? parseISO(task.delivery_date) : undefined);
  }, [task]);

  const { data: customCats = [] } = useQuery({
    queryKey: ["categories"],
    queryFn: () => db.get("Category"),
  });

  const allCategories = [
    ...DEFAULT_CATEGORIES,
    ...customCats.map((c) => ({ name: c.name, slug: c.slug })),
  ];

  const checklistTotal = (form.checklist || []).reduce((s, i) => s + (parseFloat(i.value) || 0), 0);
  const hasChecklist = form.checklist && form.checklist.length > 0;
  const displayValue = hasChecklist ? checklistTotal : (parseFloat(form.service_value) || 0);

  // AQUI FOI A CORREÇÃO: Usando prevForm para garantir que a memória nunca fique antiga
  const handleDateSelect = (date) => {
    setSelectedDate(date);
    setForm((prevForm) => {
      if (date) {
        return { ...prevForm, delivery_date: format(date, 'yyyy-MM-dd') };
      } else {
        return { ...prevForm, delivery_date: '' };
      }
    });
  };

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
      title: form.title,
      description: form.description,
      priority: form.priority,
      category: form.category,
      delivery_date: form.delivery_date, 
      service_value: hasChecklist ? undefined : (parseFloat(form.service_value) || 0),
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
                
                {/* === SELETOR DE DATA CUSTOMIZADO E LIMPO === */}
                <div className="flex flex-col">
                  <label className="text-[10px] font-bold text-slate-500 mb-1.5 block uppercase tracking-widest ml-1">Data de Entrega</label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant={"outline"}
                        type="button"
                        className={`h-10 w-full justify-between rounded-md border border-slate-200 bg-white px-3 text-xs font-bold uppercase transition-colors hover:bg-slate-50 focus:ring-2 focus:ring-slate-400 focus:border-transparent ${!selectedDate ? "text-slate-400" : "text-slate-600"}`}
                      >
                        {selectedDate ? format(selectedDate, "dd/MM", { locale: ptBR }) : <span className="opacity-0">Blank</span>}
                        <CalendarDays className="h-4 w-4 text-slate-400" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0 rounded-lg border border-slate-200 shadow-xl" align="start">
                      <Calendar
                        mode="single"
                        selected={selectedDate}
                        onSelect={handleDateSelect}
                        locale={ptBR}
                        initialFocus
                        className="p-3"
                        classNames={{
                          head_cell: "text-slate-500 rounded-md w-9 font-normal text-[11px] uppercase tracking-wider",
                          cell: "h-9 w-9 text-center text-sm p-0 relative [&:has([aria-selected].day-range-end)]:rounded-r-md [&:has([aria-selected].day-outside)]:bg-slate-100/50 [&:has([aria-selected])]:bg-slate-100 first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
                          day: "h-9 w-9 p-0 font-normal aria-selected:opacity-100 hover:bg-slate-100 rounded-md",
                          day_selected: "bg-blue-600 text-white hover:bg-blue-700 hover:text-white focus:bg-blue-600 focus:text-white rounded-md",
                          day_today: "bg-slate-100 text-slate-900 rounded-md font-bold",
                          day_outside: "day-outside text-slate-400 opacity-50 aria-selected:bg-slate-100/50 aria-selected:text-slate-400 aria-selected:opacity-30",
                          day_disabled: "text-slate-400 opacity-50",
                          nav_button: "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100 border border-slate-200 rounded-md text-slate-600",
                          nav_button_previous: "absolute left-1",
                          nav_button_next: "absolute right-1",
                          caption: "flex justify-center pt-1 relative items-center text-sm font-semibold text-slate-800 uppercase tracking-tight",
                        }}
                        components={{
                          IconLeft: ({ ...props }) => <ChevronLeft className="h-4 w-4" />,
                          IconRight: ({ ...props }) => <ChevronRight className="h-4 w-4" />,
                        }}
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-500 mb-1.5 block uppercase tracking-widest ml-1">Prioridade</label>
                  <Select value={form.priority} onValueChange={(v) => setForm({ ...form, priority: v })}>
                    <SelectTrigger className="h-10 text-xs font-bold uppercase bg-white border-slate-200 rounded-md data-[placeholder]:text-slate-400">
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
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Categoria</label>
                    <button type="button" onClick={() => setManagingCats(!managingCats)} className="text-[9px] text-blue-600 flex items-center gap-0.5 hover:underline font-bold uppercase tracking-widest">
                      <Settings2 className="w-3 h-3" /> Gerenciar
                    </button>
                  </div>
                  <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                    <SelectTrigger className="h-10 text-xs font-bold uppercase bg-white border-slate-200 rounded-md data-[placeholder]:text-slate-400">
                      <SelectValue placeholder={allCategories.length > 0 ? "Selecione..." : "Crie uma categoria"} />
                    </SelectTrigger>
                    <SelectContent>
                      {allCategories.map((cat) => (
                        <SelectItem key={cat.slug} value={cat.slug}>{cat.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <AnimatePresence>
                {managingCats && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                    <div className="bg-white rounded-lg p-3 border border-slate-200 mt-2 shadow-sm">
                      <CategoryManager onClose={() => setManagingCats(false)} />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* CHECKLIST E VALOR */}
            <div className="space-y-4">
              <div>
                <label className="text-[10px] font-bold text-slate-500 mb-1.5 block uppercase tracking-widest ml-1">Valor Final do Serviço (R$)</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-400">R$</span>
                  <Input type="number" value={form.service_value || ""} onChange={(e) => setForm({ ...form, service_value: e.target.value })} className="bg-slate-50 border-slate-200 text-sm font-black text-slate-800 pl-9 h-11" disabled={hasChecklist} />
                </div>
                {hasChecklist && <p className="text-[9px] text-slate-400 mt-1.5 font-bold uppercase tracking-widest px-1">Valor bloqueado porque você está usando o Checklist (Soma Automática).</p>}
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

          {/* Footer */}
          <div className="flex gap-3 p-4 md:p-5 border-t border-slate-100 sticky bottom-0 bg-white">
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