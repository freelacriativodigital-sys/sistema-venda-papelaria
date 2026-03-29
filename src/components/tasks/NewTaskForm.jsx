import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

import { 
  X, Save, DollarSign, TrendingUp, PercentCircle, CalendarDays, 
  ChevronLeft, ChevronRight, UserSquare2, Loader2, UserPlus, ArrowLeft, Palette 
} from "lucide-react";
import { supabase } from "../../lib/supabase"; 

import ChecklistEditor from "./ChecklistEditor";

const DEFAULT_CATEGORIES = [
  { name: "Ilustração", slug: "ilustracao" },
  { name: "Pintura Digital", slug: "pintura_digital" },
  { name: "Concept Art", slug: "concept_art" },
  { name: "Design Gráfico", slug: "design_grafico" },
  { name: "Modelagem 3D", slug: "modelagem_3d" },
  { name: "Animação", slug: "animacao" },
  { name: "Edição de Foto", slug: "edição_foto" },
  { name: "Outro", slug: "outro" },
];

export default function NewTaskForm({ isOpen, onClose, taskToEdit, onSubmit }) {
  const [form, setForm] = useState({ 
    title: "", description: "", priority: "media", category: "ilustracao", 
    service_value: "", delivery_date: "", checklist: [], payment_status: "em_aberto", valor_pago: 0 
  });
  
  const [selectedDate, setSelectedDate] = useState(undefined);
  
  // Estados de Cliente
  const [clientes, setClientes] = useState([]);
  const [mostrarDropdownCliente, setMostrarDropdownCliente] = useState(false);
  const [carregandoClientes, setCarregandoClientes] = useState(false);
  const [clienteId, setClienteId] = useState(null);

  useEffect(() => {
    if (isOpen) {
      // Carrega clientes
      async function buscarClientes() {
        setCarregandoClientes(true);
        const { data } = await supabase.from('clientes').select('id, nome, whatsapp').order('nome');
        if (data) setClientes(data);
        setCarregandoClientes(false);
      }
      buscarClientes();

      // Preenche dados se for edição
      if (taskToEdit) {
        setForm({ ...taskToEdit, checklist: taskToEdit.checklist || [], valor_pago: taskToEdit.valor_pago || 0 });
        setSelectedDate(taskToEdit.delivery_date ? parseISO(taskToEdit.delivery_date) : undefined);
        setClienteId(taskToEdit.cliente_id || null);
      } else {
        setForm({ title: "", description: "", priority: "media", category: "ilustracao", service_value: "", delivery_date: "", checklist: [], payment_status: "em_aberto", valor_pago: 0 });
        setSelectedDate(undefined);
        setClienteId(null);
      }
    }
  }, [isOpen, taskToEdit]);

  const handleDateSelect = (date) => {
    setSelectedDate(date);
    setForm(prev => ({ ...prev, delivery_date: date ? format(date, 'yyyy-MM-dd') : '' }));
  };

  const selecionarCliente = (cli) => {
    setForm({ ...form, title: cli.nome });
    setClienteId(cli.id);
    setMostrarDropdownCliente(false);
  };

  const handleSave = () => {
    if (!form.title.trim()) return alert("O título/cliente é obrigatório.");

    const checklistTotal = (form.checklist || []).reduce((s, i) => s + (parseFloat(i.value) || 0), 0);
    const hasChecklist = form.checklist && form.checklist.length > 0;
    const displayValue = hasChecklist ? checklistTotal : (parseFloat(form.service_value) || 0);

    let finalStatus = form.payment_status || "em_aberto";
    let finalValorPago = Number(form.valor_pago) || 0;

    if (finalStatus === 'pago') finalValorPago = displayValue;
    if (finalStatus === 'em_aberto') finalValorPago = 0;
    if (finalStatus === 'parcial' && finalValorPago >= displayValue && displayValue > 0) finalStatus = 'pago';

    const clienteSelecionado = clientes.find(c => c.id === clienteId);

    onSubmit({
      ...form,
      service_value: hasChecklist ? undefined : (parseFloat(form.service_value) || 0),
      payment_status: finalStatus,
      valor_pago: finalValorPago,
      cliente_id: clienteId,
      cliente_nome: clienteSelecionado ? clienteSelecionado.nome : form.title
    });
  };

  const searchStr = String(form.title || '').toLowerCase().trim();
  const filteredClientes = clientes.filter(c => String(c.nome || '').toLowerCase().includes(searchStr));

  if (!isOpen) return null;

  const hasChecklist = form.checklist && form.checklist.length > 0;
  const displayValue = hasChecklist ? (form.checklist || []).reduce((s, i) => s + (parseFloat(i.value) || 0), 0) : (parseFloat(form.service_value) || 0);

  return (
    <motion.div 
      initial={{ opacity: 0, x: '10%' }} 
      animate={{ opacity: 1, x: 0 }} 
      exit={{ opacity: 0, x: '10%' }} 
      transition={{ type: "spring", bounce: 0, duration: 0.4 }}
      className="fixed inset-0 z-[200] bg-[#f8fafc] overflow-y-auto flex flex-col"
    >
      {/* HEADER DA PÁGINA */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button onClick={onClose} className="w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-500 transition-colors">
              <ArrowLeft size={18} />
            </button>
            <div className="w-8 h-8 rounded-lg bg-blue-50 hidden sm:flex items-center justify-center border border-blue-100">
               <Palette className="text-blue-600 w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm md:text-base font-semibold text-slate-800 uppercase tracking-tight leading-none">
                {taskToEdit ? 'Editar Pedido' : 'Novo Pedido'}
              </h2>
            </div>
          </div>
          <Button onClick={handleSave} className="bg-blue-600 hover:bg-blue-700 text-white h-9 px-6 rounded-md font-semibold uppercase text-[10px] tracking-widest shadow-sm transition-colors">
            <Save size={14} className="mr-2"/> Salvar
          </Button>
        </div>
      </div>

      {/* CORPO DO FORMULÁRIO */}
      <div className="flex-1 w-full max-w-4xl mx-auto p-4 md:p-6 pb-24">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-6">
          
          <div className="space-y-1.5 relative">
            <label className="text-[10px] font-semibold uppercase text-slate-500 tracking-widest ml-1">Cliente / Título</label>
            <div className="relative z-40">
               <UserSquare2 className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
               <Input
                 placeholder="Busque o cliente ou digite o título do pedido..."
                 value={form.title}
                 onChange={(e) => { setForm({ ...form, title: e.target.value }); setClienteId(null); setMostrarDropdownCliente(true); }}
                 onFocus={() => setMostrarDropdownCliente(true)}
                 onBlur={() => setTimeout(() => setMostrarDropdownCliente(false), 250)}
                 className="bg-slate-50 border-slate-200 h-11 text-sm font-medium pl-9 focus:bg-white"
                 autoFocus={!taskToEdit}
               />
               {carregandoClientes && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4 animate-spin" />}
               
               {mostrarDropdownCliente && searchStr.length > 0 && !clienteId && (
                 <div className="absolute top-12 left-0 right-0 bg-white border border-slate-200 rounded-lg shadow-lg max-h-56 overflow-y-auto p-1.5 space-y-0.5 z-50">
                   {filteredClientes.map(cli => (
                     <div key={cli.id} onMouseDown={(e) => { e.preventDefault(); selecionarCliente(cli); }} className="flex flex-col p-2.5 hover:bg-slate-50 rounded-md cursor-pointer transition-colors">
                       <span className="text-xs font-semibold text-slate-800 uppercase">{cli.nome}</span>
                     </div>
                   ))}
                   {filteredClientes.length === 0 && <div className="p-3 text-xs text-slate-500 text-center">Nenhum cliente encontrado.</div>}
                 </div>
               )}
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-semibold uppercase text-slate-500 tracking-widest ml-1">Descrição</label>
            <Textarea placeholder="Detalhes do pedido, referências, tamanhos..." value={form.description || ""} onChange={(e) => setForm({ ...form, description: e.target.value })} className="bg-slate-50 border-slate-200 text-sm font-medium text-slate-700 min-h-[90px] focus:bg-white" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-semibold uppercase text-slate-500 tracking-widest ml-1">Data de Entrega</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className={`h-11 w-full justify-between rounded-md border border-slate-200 bg-slate-50 px-3 text-xs font-semibold uppercase transition-colors hover:bg-white ${!selectedDate ? "text-slate-400" : "text-slate-700"}`}>
                    {selectedDate ? format(selectedDate, "dd/MM/yyyy", { locale: ptBR }) : "Selecionar"}
                    <CalendarDays className="h-4 w-4 text-slate-400" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 rounded-xl border border-slate-200 shadow-xl" align="start">
                  <Calendar mode="single" selected={selectedDate} onSelect={handleDateSelect} locale={ptBR} initialFocus className="p-3 bg-white" />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-semibold uppercase text-slate-500 tracking-widest ml-1">Prioridade</label>
              <Select value={form.priority} onValueChange={(v) => setForm({ ...form, priority: v })}>
                <SelectTrigger className="h-11 text-xs font-semibold uppercase tracking-widest bg-slate-50 border-slate-200 rounded-md text-slate-700 focus:bg-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="baixa">Baixa</SelectItem><SelectItem value="media">Média</SelectItem><SelectItem value="alta">Alta</SelectItem><SelectItem value="urgente">Urgente</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-semibold uppercase text-slate-500 tracking-widest ml-1">Categoria</label>
              <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                <SelectTrigger className="h-11 text-xs font-semibold uppercase tracking-widest bg-slate-50 border-slate-200 rounded-md text-slate-700 focus:bg-white">
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  {DEFAULT_CATEGORIES.map((cat) => (
                     <SelectItem key={cat.slug} value={cat.slug}>{cat.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 space-y-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-semibold uppercase text-slate-500 tracking-widest ml-1">Valor do Serviço (R$)</label>
              <div className="relative max-w-sm">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-slate-400">R$</span>
                <Input type="number" value={form.service_value || ""} onChange={(e) => setForm({ ...form, service_value: e.target.value })} className="bg-slate-50 border-slate-200 text-sm font-semibold text-slate-800 pl-9 h-11 focus:bg-white" disabled={hasChecklist} />
              </div>
              {hasChecklist && <p className="text-[9px] text-slate-400 mt-1 font-medium uppercase tracking-widest px-1">Valor automático pelo Checklist abaixo.</p>}
            </div>

            <div>
              <ChecklistEditor checklist={form.checklist} onChange={(c) => setForm({ ...form, checklist: c })} />
            </div>
          </div>

          {/* STATUS FINANCEIRO */}
          {displayValue > 0 && (
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 mt-4">
              <label className="text-[10px] font-semibold text-slate-500 mb-3 block uppercase tracking-widest text-center">Status do Pagamento</label>
              
              <div className="grid grid-cols-3 gap-2">
                <button type="button" onClick={() => setForm({ ...form, payment_status: "em_aberto" })} className={`flex flex-col items-center justify-center gap-1.5 py-2.5 px-1 rounded-lg border-2 text-[9px] font-semibold uppercase tracking-widest transition-all ${form.payment_status === "em_aberto" || !form.payment_status ? "border-rose-500 bg-rose-50 text-rose-600 shadow-sm" : "border-slate-200 bg-white text-slate-400 hover:border-rose-200"}`}>
                  <TrendingUp className="w-4 h-4" /> Pendente
                </button>
                <button type="button" onClick={() => setForm({ ...form, payment_status: "parcial" })} className={`flex flex-col items-center justify-center gap-1.5 py-2.5 px-1 rounded-lg border-2 text-[9px] font-semibold uppercase tracking-widest transition-all ${form.payment_status === "parcial" ? "border-blue-500 bg-blue-50 text-blue-600 shadow-sm" : "border-slate-200 bg-white text-slate-400 hover:border-blue-200"}`}>
                  <PercentCircle className="w-4 h-4" /> Sinal
                </button>
                <button type="button" onClick={() => setForm({ ...form, payment_status: "pago" })} className={`flex flex-col items-center justify-center gap-1.5 py-2.5 px-1 rounded-lg border-2 text-[9px] font-semibold uppercase tracking-widest transition-all ${form.payment_status === "pago" ? "border-emerald-500 bg-emerald-50 text-emerald-600 shadow-sm" : "border-slate-200 bg-white text-slate-400 hover:border-emerald-200"}`}>
                  <DollarSign className="w-4 h-4" /> Pago
                </button>
              </div>

              <AnimatePresence>
                {form.payment_status === "parcial" && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden mt-4 pt-4 border-t border-slate-200">
                     <div className="flex items-center gap-3">
                        <div className="flex-1">
                           <label className="text-[9px] font-semibold text-blue-600 mb-1 block uppercase tracking-widest">Valor do Sinal Pago (R$)</label>
                           <div className="relative">
                             <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-blue-400">R$</span>
                             <Input type="number" value={form.valor_pago || ""} onChange={(e) => setForm({ ...form, valor_pago: Number(e.target.value) })} className="bg-white border-blue-200 text-sm font-semibold text-blue-700 pl-8 h-10 focus:border-blue-400 shadow-sm" />
                           </div>
                        </div>
                        <div className="w-24 text-right">
                           <span className="text-[9px] font-semibold text-slate-400 block uppercase tracking-widest mb-1">Falta Pagar</span>
                           <span className="text-sm font-semibold text-rose-500">
                             {(displayValue - (Number(form.valor_pago) || 0)).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                           </span>
                        </div>
                     </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}