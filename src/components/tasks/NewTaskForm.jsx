import React, { useState, useEffect } from "react";
import { base44 as db } from "../../api";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, X, ChevronDown, ChevronUp, UserSquare2, Loader2, CalendarDays, ChevronLeft, ChevronRight, UserPlus } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

import ChecklistEditor from "./ChecklistEditor";
import { supabase } from "../../lib/supabase";

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

export default function NewTaskForm({ onSubmit }) {
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);
  const { data: customCats = [] } = useQuery({
    queryKey: ["categories"],
    queryFn: () => db.get("Category"),
  });
  const allCategories = [
    ...DEFAULT_CATEGORIES,
    ...customCats.map((c) => ({ name: c.name, slug: c.slug })),
  ];
  const [showDetails, setShowDetails] = useState(false);
  
  const [clientes, setClientes] = useState([]);
  const [mostrarDropdownCliente, setMostrarDropdownCliente] = useState(false);
  const [carregandoClientes, setCarregandoClientes] = useState(false);
  const [clienteId, setClienteId] = useState(null);

  const [selectedDate, setSelectedDate] = useState(undefined);

  const [isClientModalOpen, setIsClientModalOpen] = useState(false);
  const [newClientData, setNewClientData] = useState({ nome: '', whatsapp: '', aniversario: '', pendente: 0, pago: 0 });

  const [task, setTask] = useState({
    title: "", 
    description: "",
    priority: "media",
    category: "ilustracao",
    service_value: "",
    delivery_date: "", 
    checklist: [],
  });

  useEffect(() => {
    if (isOpen) {
      async function buscarClientes() {
        setCarregandoClientes(true);
        try {
          const { data, error } = await supabase.from('clientes').select('id, nome, whatsapp').order('nome');
          if (data) setClientes(data);
        } catch (err) {
          console.error("Erro ao buscar clientes:", err);
        } finally {
          setCarregandoClientes(false);
        }
      }
      buscarClientes();
    }
  }, [isOpen]);

  const saveClientMutation = useMutation({
    mutationFn: async (clientData) => {
      const { data, error } = await supabase.from("clientes").insert([clientData]).select();
      if (error) throw error;
      return data[0]; 
    },
    onSuccess: (newClient) => {
      queryClient.invalidateQueries({ queryKey: ["sistema-clientes"] });
      setIsClientModalOpen(false);
      setClienteId(newClient.id);
      setTask({ ...task, title: String(newClient.nome || '') });
      // Usar String() no localeCompare para evitar erro com números
      setClientes(prev => [...prev, newClient].sort((a,b) => String(a.nome || '').localeCompare(String(b.nome || ''))));
    },
  });

  const handleDateSelect = (date) => {
    setSelectedDate(date);
    if (date) {
      setTask({ ...task, delivery_date: format(date, 'yyyy-MM-dd') });
    } else {
      setTask({ ...task, delivery_date: '' });
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!String(task.title || '').trim()) return;
    
    const clienteSelecionado = clientes.find(c => c.id === clienteId);

    onSubmit({
      ...task,
      status: "pendente",
      payment_status: "em_aberto",
      service_value: task.service_value ? parseFloat(task.service_value) : undefined,
      cliente_id: clienteId, 
      cliente_nome: clienteSelecionado ? clienteSelecionado.nome : task.title 
    });
    
    setTask({ title: "", description: "", priority: "media", category: "ilustracao", service_value: "", delivery_date: "", checklist: [] });
    setSelectedDate(undefined);
    setClienteId(null);
    setShowDetails(false);
    setIsOpen(false);
  };

  const selecionarCliente = (cli) => {
    setTask({ ...task, title: String(cli.nome || '') });
    setClienteId(cli.id);
    setMostrarDropdownCliente(false);
  };

  // --- BLINDAGEM DA BUSCA AQUI TAMBÉM ---
  const searchStr = String(task.title || '').toLowerCase().trim();
  const filteredClientes = clientes.filter(c => {
    const nomeMatch = String(c.nome || '').toLowerCase().includes(searchStr);
    const zapMatch = String(c.whatsapp || '').toLowerCase().includes(searchStr);
    return nomeMatch || zapMatch;
  });
  
  const isExactMatch = filteredClientes.some(c => String(c.nome || '').toLowerCase().trim() === searchStr);

  return (
    <div>
      <AnimatePresence>
        {!isOpen ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <Button
              onClick={() => setIsOpen(true)}
              className="w-full h-12 rounded-xl border-2 border-dashed border-primary/30 bg-primary/5 text-primary hover:bg-primary/10 hover:border-primary/50 transition-all"
              variant="ghost"
            >
              <Plus className="w-4 h-4 mr-2" />
              Nova pendência
            </Button>
          </motion.div>
        ) : (
          <motion.form
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            onSubmit={handleSubmit}
            className="bg-card border border-border rounded-xl p-4 space-y-3 shadow-sm overflow-visible relative"
          >
            <div className="relative z-50">
               <UserSquare2 className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/60 w-4 h-4" />
               <Input
                 placeholder="Busque o cliente ou digite o que precisa..."
                 value={task.title}
                 onChange={(e) => {
                   setTask({ ...task, title: String(e.target.value) });
                   setClienteId(null);
                   setMostrarDropdownCliente(true);
                 }}
                 onFocus={() => setMostrarDropdownCliente(true)}
                 onBlur={() => setTimeout(() => setMostrarDropdownCliente(false), 250)}
                 className="border-0 bg-secondary/50 h-11 text-sm pl-9 placeholder:text-muted-foreground/60"
                 autoFocus
               />
               {carregandoClientes && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground/60 w-4 h-4 animate-spin" />}
               
               {mostrarDropdownCliente && searchStr.length > 0 && !clienteId && (
                 <div className="absolute top-12 left-0 right-0 bg-card border border-border rounded-lg shadow-lg max-h-56 overflow-y-auto p-1.5 space-y-0.5 z-[100]">
                   {filteredClientes.map(cli => (
                     <div 
                       key={cli.id} 
                       onMouseDown={(e) => { e.preventDefault(); selecionarCliente(cli); }} 
                       className="flex flex-col p-2.5 hover:bg-secondary/80 rounded-md cursor-pointer transition-colors"
                     >
                       <span className="text-xs font-semibold text-foreground uppercase">{cli.nome}</span>
                     </div>
                   ))}
                   
                   {!isExactMatch && (
                     <div className="pt-1 mt-1 border-t border-border">
                       <button 
                         type="button"
                         className="w-full text-left px-2 py-2.5 text-xs text-emerald-600 hover:bg-emerald-50 bg-emerald-50/50 font-bold flex items-center gap-2 transition-colors rounded-md"
                         onMouseDown={(e) => {
                           e.preventDefault(); 
                           setNewClientData({ nome: task.title, whatsapp: '', aniversario: '', pendente: 0, pago: 0 });
                           setIsClientModalOpen(true);
                           setMostrarDropdownCliente(false);
                         }}
                       >
                         <UserPlus size={14} /> Cadastrar "{task.title}"
                       </button>
                     </div>
                   )}
                 </div>
               )}
            </div>

            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">R$</span>
              <Input
                type="number"
                placeholder="Valor do serviço (opcional)"
                value={task.service_value}
                onChange={(e) => setTask({ ...task, service_value: e.target.value })}
                className="border-0 bg-secondary/50 h-9 text-sm pl-9 placeholder:text-muted-foreground/60"
              />
            </div>

            <ChecklistEditor checklist={task.checklist} onChange={(c) => setTask({ ...task, checklist: c })} />

            <button type="button" onClick={() => setShowDetails(!showDetails)} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors">
              {showDetails ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              {showDetails ? "Menos detalhes" : "Mais detalhes"}
            </button>

            <AnimatePresence>
              {showDetails && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden space-y-3">
                  <Textarea placeholder="Descrição (opcional)" value={task.description} onChange={(e) => setTask({ ...task, description: e.target.value })} className="border-0 bg-secondary/50 text-sm min-h-[70px] placeholder:text-muted-foreground/60" />
                  
                  <div className="flex flex-wrap gap-2 md:gap-3">
                    <div className="flex-1 min-w-[130px] relative">
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant={"outline"} type="button" className={`h-10 w-full justify-between rounded-md border border-slate-200 bg-white px-3 text-xs font-bold uppercase transition-colors hover:bg-slate-50 focus:ring-2 focus:ring-slate-400 focus:border-transparent ${!selectedDate ? "text-slate-400" : "text-slate-600"}`}>
                            {selectedDate ? format(selectedDate, "dd/MM", { locale: ptBR }) : <span className="opacity-0">Data</span>}
                            <CalendarDays className="h-4 w-4 text-slate-400" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0 rounded-lg border border-slate-200 shadow-xl z-[100]" align="start">
                          <Calendar
                            mode="single" selected={selectedDate} onSelect={handleDateSelect} locale={ptBR} initialFocus className="p-3 bg-white"
                            classNames={{
                              head_cell: "text-slate-500 rounded-md w-9 font-normal text-[11px] uppercase tracking-wider",
                              cell: "h-9 w-9 text-center text-sm p-0 relative [&:has([aria-selected].day-range-end)]:rounded-r-md [&:has([aria-selected].day-outside)]:bg-slate-100/50 [&:has([aria-selected])]:bg-slate-100",
                              day: "h-9 w-9 p-0 font-normal aria-selected:opacity-100 hover:bg-slate-100 rounded-md text-slate-900",
                              day_selected: "bg-blue-600 text-white hover:bg-blue-700 hover:text-white focus:bg-blue-600 focus:text-white rounded-md",
                              day_today: "bg-slate-100 text-slate-900 rounded-md font-bold",
                              day_outside: "day-outside text-slate-400 opacity-50",
                              nav_button: "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100 border border-slate-200 rounded-md text-slate-600",
                              nav_button_previous: "absolute left-1",
                              nav_button_next: "absolute right-1",
                              caption: "flex justify-center pt-1 relative items-center text-sm font-semibold text-slate-800 uppercase tracking-tight",
                            }}
                            components={{ IconLeft: () => <ChevronLeft className="h-4 w-4" />, IconRight: () => <ChevronRight className="h-4 w-4" /> }}
                          />
                        </PopoverContent>
                      </Popover>
                    </div>

                    <div className="flex-1 min-w-[100px]">
                      <Select value={task.priority} onValueChange={(v) => setTask({ ...task, priority: v })}>
                        <SelectTrigger className="h-10 text-xs font-bold uppercase tracking-widest bg-white border border-slate-200 text-slate-600 rounded-md data-[placeholder]:text-slate-400">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="baixa">Baixa</SelectItem><SelectItem value="media">Média</SelectItem><SelectItem value="alta">Alta</SelectItem><SelectItem value="urgente">Urgente</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex-1 min-w-[100px]">
                      <Select value={task.category} onValueChange={(v) => setTask({ ...task, category: v })}>
                        <SelectTrigger className="h-10 text-xs font-bold uppercase tracking-widest bg-white border border-slate-200 text-slate-600 rounded-md data-[placeholder]:text-slate-400">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {allCategories.map((cat) => (
                            <SelectItem key={cat.slug} value={cat.slug}>{cat.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="flex justify-end gap-2 pt-1">
              <Button type="button" variant="ghost" size="sm" onClick={() => { setIsOpen(false); setShowDetails(false); setClienteId(null); setSelectedDate(undefined); }} className="text-xs h-8">
                <X className="w-3 h-3 mr-1" /> Cancelar
              </Button>
              <Button type="submit" size="sm" disabled={!String(task.title || '').trim()} className="text-xs h-8 bg-primary hover:bg-primary/90">
                <Plus className="w-3 h-3 mr-1" /> Adicionar
              </Button>
            </div>
          </motion.form>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isClientModalOpen && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 sm:p-6">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsClientModalOpen(false)} className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" />
            <motion.div initial={{ scale: 0.95, opacity: 0, y: 10 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 10 }} className="bg-white w-full max-w-md rounded-2xl md:rounded-xl p-6 shadow-2xl relative z-[210] overflow-hidden border border-slate-100">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="text-lg md:text-xl font-black text-slate-800 uppercase tracking-tight flex items-center gap-2">
                    <UserPlus className="text-blue-500" size={20} /> Novo Cliente
                  </h2>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mt-1">Cadastro Rápido</p>
                </div>
                <button type="button" onClick={() => setIsClientModalOpen(false)} className="p-1.5 hover:bg-slate-100 text-slate-500 rounded-md transition-colors"><X className="w-5 h-5" /></button>
              </div>
              
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] md:text-xs font-bold uppercase text-slate-600 tracking-widest ml-1">Nome Completo</label>
                  <Input value={newClientData.nome} onChange={e => setNewClientData({...newClientData, nome: String(e.target.value)})} className="h-11 md:h-12 border-slate-300 bg-white rounded-lg font-semibold text-sm" autoFocus />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-[10px] md:text-xs font-bold uppercase text-slate-600 tracking-widest ml-1">WhatsApp</label>
                    <Input value={newClientData.whatsapp} onChange={e => setNewClientData({...newClientData, whatsapp: String(e.target.value)})} className="h-11 md:h-12 border-slate-300 bg-white rounded-lg font-semibold text-sm" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] md:text-xs font-bold uppercase text-slate-600 tracking-widest ml-1">Aniversário</label>
                    <Input type="date" value={newClientData.aniversario || ''} onChange={e => setNewClientData({...newClientData, aniversario: e.target.value})} className="h-11 md:h-12 border-slate-300 bg-white rounded-lg font-semibold text-sm text-slate-600" />
                  </div>
                </div>

                <Button type="button" onClick={() => {
                  if (!newClientData.nome) return alert("O nome é obrigatório!");
                  saveClientMutation.mutate(newClientData);
                }} className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold uppercase tracking-widest text-xs mt-4 shadow-md transition-transform active:scale-95">
                  {saveClientMutation.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : "Salvar Cliente"}
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}