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
  ChevronLeft, ChevronRight, UserSquare2, Loader2, UserPlus, ArrowLeft, Palette,
  Trash2, Plus, ChevronDown
} from "lucide-react";
import { supabase } from "../../lib/supabase"; 

import ChecklistEditor from "./ChecklistEditor";

const DEFAULT_CATEGORIES = [
  { name: "Ilustração", slug: "ilustracao" }
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

  // Estados de Categoria (Agora vem do Banco)
  const [categories, setCategories] = useState(DEFAULT_CATEGORIES);
  const [novaCategoria, setNovaCategoria] = useState("");
  const [showCatManager, setShowCatManager] = useState(false);

  useEffect(() => {
    if (isOpen) {
      async function fetchData() {
        setCarregandoClientes(true);
        
        // Busca Clientes e Categorias do Supabase ao mesmo tempo
        const [resClientes, resCategorias] = await Promise.all([
          supabase.from('clientes').select('id, nome, whatsapp').order('nome'),
          supabase.from('categorias').select('*').order('name')
        ]);

        if (resClientes.data) setClientes(resClientes.data);
        if (resCategorias.data && resCategorias.data.length > 0) {
          setCategories(resCategorias.data);
        }
        
        setCarregandoClientes(false);
      }
      fetchData();

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

  // --- FUNÇÕES DO CALENDÁRIO ---
  const handleDateSelect = (date) => {
    setSelectedDate(date);
    setForm(prev => ({ ...prev, delivery_date: date ? format(date, 'yyyy-MM-dd') : '' }));
  };

  // --- FUNÇÕES DE CLIENTE ---
  const selecionarCliente = (cli) => {
    setForm({ ...form, title: cli.nome });
    setClienteId(cli.id);
    setMostrarDropdownCliente(false);
  };

  const criarNovoCliente = async () => {
    setCarregandoClientes(true);
    const novoNome = form.title.trim();
    const { data, error } = await supabase.from('clientes').insert([{ nome: novoNome }]).select();
    
    if (!error && data && data.length > 0) {
       setClientes([...clientes, data[0]]);
       selecionarCliente(data[0]);
    } else {
       alert('Erro ao criar cliente. Verifique sua conexão.');
    }
    setCarregandoClientes(false);
  };

  // --- FUNÇÕES DE CATEGORIA (SUPABASE) ---
  const handleAddCategory = async () => {
    if(!novaCategoria.trim()) return;
    const slug = novaCategoria.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, '_');
    
    if (categories.find(c => c.slug === slug)) return setNovaCategoria("");

    const novaCat = { name: novaCategoria, slug };
    
    // Atualiza a tela instantaneamente
    setCategories([...categories, novaCat]);
    setForm({...form, category: slug});
    setNovaCategoria("");

    // Salva no Supabase
    const { error } = await supabase.from('categorias').insert([novaCat]);
    if (error) console.error("Erro ao salvar categoria no banco:", error);
  };

  const handleRemoveCategory = async (e, slug) => {
    e.stopPropagation(); 
    
    // Atualiza a tela instantaneamente
    setCategories(categories.filter(c => c.slug !== slug));
    if (form.category === slug) setForm({...form, category: ""});

    // Deleta no Supabase
    const { error } = await supabase.from('categorias').delete().eq('slug', slug);
    if (error) console.error("Erro ao deletar categoria do banco:", error);
  };

  // --- FUNÇÃO DE SALVAR PEDIDO ---
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
      <div className="bg-white border-b border-slate-200 sticky top-0 z-[250] shadow-sm">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <button onClick={onClose} className="w-7 h-7 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-500 transition-colors">
              <ArrowLeft size={16} />
            </button>
            <div className="w-7 h-7 rounded-md bg-blue-50 hidden sm:flex items-center justify-center border border-blue-100">
               <Palette className="text-blue-600 w-3.5 h-3.5" />
            </div>
            <div>
              <h2 className="text-xs md:text-sm font-semibold text-slate-800 uppercase tracking-tight leading-none">
                {taskToEdit ? 'Editar Pedido' : 'Novo Pedido'}
              </h2>
            </div>
          </div>
          <Button onClick={handleSave} className="bg-blue-600 hover:bg-blue-700 text-white h-8 px-5 rounded-md font-semibold uppercase text-[9px] tracking-widest shadow-sm transition-colors">
            <Save size={12} className="mr-1.5"/> Salvar
          </Button>
        </div>
      </div>

      <div className="flex-1 w-full max-w-3xl mx-auto p-3 md:p-4 pb-20">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-4">
          
          {/* CAMPO CLIENTE COM CADASTRO RÁPIDO */}
          <div className="space-y-1 relative">
            <label className="text-[9px] font-semibold uppercase text-slate-500 tracking-widest ml-1">Cliente / Título</label>
            <div className="relative z-40">
               <UserSquare2 className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 w-3.5 h-3.5" />
               <Input
                 placeholder="Busque o cliente ou digite..."
                 value={form.title}
                 onChange={(e) => { setForm({ ...form, title: e.target.value }); setClienteId(null); setMostrarDropdownCliente(true); }}
                 onFocus={() => setMostrarDropdownCliente(true)}
                 onBlur={() => setTimeout(() => setMostrarDropdownCliente(false), 250)}
                 className="bg-slate-50 border-slate-200 h-9 text-xs font-medium pl-8 focus:bg-white"
                 autoFocus={!taskToEdit}
               />
               {carregandoClientes && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 w-3.5 h-3.5 animate-spin" />}
               
               {mostrarDropdownCliente && searchStr.length > 0 && !clienteId && (
                 <div className="absolute top-10 left-0 right-0 bg-white border border-slate-200 rounded-md shadow-lg max-h-48 overflow-y-auto p-1 space-y-0.5 z-[300]">
                   {filteredClientes.map(cli => (
                     <div key={cli.id} onMouseDown={(e) => { e.preventDefault(); selecionarCliente(cli); }} className="flex flex-col p-2 hover:bg-slate-50 rounded cursor-pointer transition-colors">
                       <span className="text-[10px] font-semibold text-slate-800 uppercase">{cli.nome}</span>
                     </div>
                   ))}
                   
                   {/* BOTÃO CADASTRAR NOVO CLIENTE */}
                   {filteredClientes.length === 0 && (
                     <div 
                       onMouseDown={(e) => { e.preventDefault(); criarNovoCliente(); }}
                       className="p-2 flex items-center gap-2 text-[10px] font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded cursor-pointer transition-colors"
                     >
                       <UserPlus size={14} /> Cadastrar "{form.title}"
                     </div>
                   )}
                 </div>
               )}
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[9px] font-semibold uppercase text-slate-500 tracking-widest ml-1">Descrição</label>
            <Textarea placeholder="Detalhes do pedido, tamanhos..." value={form.description || ""} onChange={(e) => setForm({ ...form, description: e.target.value })} className="bg-slate-50 border-slate-200 text-xs font-medium text-slate-700 min-h-[60px] focus:bg-white" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            
            {/* CAMPO CALENDÁRIO */}
            <div className="space-y-1">
              <label className="text-[9px] font-semibold uppercase text-slate-500 tracking-widest ml-1">Entrega</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className={`h-9 w-full justify-between rounded-md border border-slate-200 bg-slate-50 px-3 text-[10px] font-semibold uppercase transition-colors hover:bg-white ${!selectedDate ? "text-slate-400" : "text-slate-700"}`}>
                    {selectedDate ? format(selectedDate, "dd/MM/yy", { locale: ptBR }) : "Selecionar"}
                    <CalendarDays className="h-3.5 w-3.5 text-slate-400" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 rounded-xl border border-slate-200 shadow-xl" style={{ zIndex: 9999 }} align="start">
                  <Calendar mode="single" selected={selectedDate} onSelect={handleDateSelect} locale={ptBR} initialFocus className="p-2 bg-white scale-90 origin-top-left" />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-1">
              <label className="text-[9px] font-semibold uppercase text-slate-500 tracking-widest ml-1">Prioridade</label>
              <Select value={form.priority} onValueChange={(v) => setForm({ ...form, priority: v })}>
                <SelectTrigger className="h-9 text-[10px] font-semibold uppercase tracking-widest bg-slate-50 border-slate-200 rounded-md text-slate-700 focus:bg-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent style={{ zIndex: 9999 }}>
                  <SelectItem value="baixa">Baixa</SelectItem><SelectItem value="media">Média</SelectItem><SelectItem value="alta">Alta</SelectItem><SelectItem value="urgente">Urgente</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* GERENCIADOR DE CATEGORIAS (VIA SUPABASE) */}
            <div className="space-y-1">
              <label className="text-[9px] font-semibold uppercase text-slate-500 tracking-widest ml-1">Categoria</label>
              <Popover open={showCatManager} onOpenChange={setShowCatManager}>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="h-9 w-full justify-between bg-slate-50 text-slate-700 text-[10px] uppercase font-semibold border-slate-200 rounded-md hover:bg-white">
                    {categories.find(c => c.slug === form.category)?.name || "Selecione"}
                    <ChevronDown className="h-3.5 w-3.5 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-56 p-2 bg-white rounded-xl shadow-xl border-slate-200" style={{ zIndex: 9999 }}>
                   <div className="max-h-48 overflow-y-auto space-y-1 mb-2">
                      {categories.map(cat => (
                         <div key={cat.slug} className="flex items-center justify-between group p-1.5 hover:bg-slate-50 rounded-md cursor-pointer transition-colors" onClick={() => { setForm({...form, category: cat.slug}); setShowCatManager(false); }}>
                            <span className="text-[10px] font-semibold text-slate-700 uppercase">{cat.name}</span>
                            <Trash2 className="w-3.5 h-3.5 text-slate-300 hover:text-red-500 hidden group-hover:block transition-colors" onClick={(e) => handleRemoveCategory(e, cat.slug)} />
                         </div>
                      ))}
                      {categories.length === 0 && <p className="text-[9px] text-slate-400 text-center p-2">Nenhuma categoria.</p>}
                   </div>
                   <div className="pt-2 border-t border-slate-100 flex items-center gap-1.5">
                      <Input 
                        value={novaCategoria} 
                        onChange={e => setNovaCategoria(e.target.value)} 
                        placeholder="Nova categoria..." 
                        className="h-7 text-[10px] bg-slate-50 focus:bg-white" 
                        onKeyDown={e => e.key === 'Enter' && handleAddCategory()}
                      />
                      <Button onClick={handleAddCategory} size="icon" className="h-7 w-7 bg-blue-600 hover:bg-blue-700 text-white shrink-0 rounded">
                        <Plus size={14}/>
                      </Button>
                   </div>
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 space-y-3">
            <div className="space-y-1">
              <label className="text-[9px] font-semibold uppercase text-slate-500 tracking-widest ml-1">Valor do Serviço (R$)</label>
              <div className="relative max-w-xs">
                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400">R$</span>
                <Input type="number" value={form.service_value || ""} onChange={(e) => setForm({ ...form, service_value: e.target.value })} className="bg-slate-50 border-slate-200 text-xs font-semibold text-slate-800 pl-7 h-9 focus:bg-white" disabled={hasChecklist} />
              </div>
              {hasChecklist && <p className="text-[8px] text-slate-400 mt-0.5 font-medium uppercase tracking-widest px-1">Valor automático pelo Checklist.</p>}
            </div>

            <div>
              <ChecklistEditor checklist={form.checklist} onChange={(c) => setForm({ ...form, checklist: c })} />
            </div>
          </div>

          {displayValue > 0 && (
            <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 mt-3">
              <label className="text-[9px] font-semibold text-slate-500 mb-2 block uppercase tracking-widest text-center">Status do Pagamento</label>
              
              <div className="grid grid-cols-3 gap-2">
                <button type="button" onClick={() => setForm({ ...form, payment_status: "em_aberto" })} className={`flex flex-col items-center justify-center gap-1 py-2 px-1 rounded-md border text-[8px] font-semibold uppercase tracking-widest transition-all ${form.payment_status === "em_aberto" || !form.payment_status ? "border-rose-500 bg-rose-50 text-rose-600 shadow-sm" : "border-slate-200 bg-white text-slate-400 hover:border-rose-200"}`}>
                  <TrendingUp className="w-3.5 h-3.5" /> Pendente
                </button>
                <button type="button" onClick={() => setForm({ ...form, payment_status: "parcial" })} className={`flex flex-col items-center justify-center gap-1 py-2 px-1 rounded-md border text-[8px] font-semibold uppercase tracking-widest transition-all ${form.payment_status === "parcial" ? "border-blue-500 bg-blue-50 text-blue-600 shadow-sm" : "border-slate-200 bg-white text-slate-400 hover:border-blue-200"}`}>
                  <PercentCircle className="w-3.5 h-3.5" /> Sinal
                </button>
                <button type="button" onClick={() => setForm({ ...form, payment_status: "pago" })} className={`flex flex-col items-center justify-center gap-1 py-2 px-1 rounded-md border text-[8px] font-semibold uppercase tracking-widest transition-all ${form.payment_status === "pago" ? "border-emerald-500 bg-emerald-50 text-emerald-600 shadow-sm" : "border-slate-200 bg-white text-slate-400 hover:border-emerald-200"}`}>
                  <DollarSign className="w-3.5 h-3.5" /> Pago
                </button>
              </div>

              <AnimatePresence>
                {form.payment_status === "parcial" && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden mt-3 pt-3 border-t border-slate-200">
                     <div className="flex items-center gap-3">
                        <div className="flex-1">
                           <label className="text-[8px] font-semibold text-blue-600 mb-1 block uppercase tracking-widest">Valor do Sinal (R$)</label>
                           <div className="relative">
                             <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[10px] font-semibold text-blue-400">R$</span>
                             <Input type="number" value={form.valor_pago || ""} onChange={(e) => setForm({ ...form, valor_pago: Number(e.target.value) })} className="bg-white border-blue-200 text-xs font-semibold text-blue-700 pl-7 h-8 focus:border-blue-400 shadow-sm" />
                           </div>
                        </div>
                        <div className="w-24 text-right">
                           <span className="text-[8px] font-semibold text-slate-400 block uppercase tracking-widest mb-0.5">Falta Pagar</span>
                           <span className="text-xs font-semibold text-rose-500">
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