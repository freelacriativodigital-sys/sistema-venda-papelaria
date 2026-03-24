import React, { useState, useEffect } from "react";
import { base44 as db } from "../../api";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, X, ChevronDown, ChevronUp, UserSquare2, Loader2, CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

// Importações do calendário
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

  // Estado para a data visual do calendário
  const [selectedDate, setSelectedDate] = useState(undefined);

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
          const { data, error } = await supabase.from('clientes').select('id, nome').order('nome');
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
    if (!task.title.trim()) return;
    
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
    setTask({ ...task, title: cli.nome });
    setClienteId(cli.id);
    setMostrarDropdownCliente(false);
  };

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
            className="bg-card border border-border rounded-xl p-4 space-y-3 shadow-sm overflow-visible"
          >
            <div className="relative">
               <UserSquare2 className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/60 w-4 h-4" />
               <Input
                 placeholder="Cliente ou O que precisa fazer?"
                 value={task.title}
                 onChange={(e) => {
                   setTask({ ...task, title: e.target.value });
                   setClienteId(null);
                   setMostrarDropdownCliente(true);
                 }}
                 onFocus={() => setMostrarDropdownCliente(true)}
                 onBlur={() => setTimeout(() => setMostrarDropdownCliente(false), 200)}
                 className="border-0 bg-secondary/50 h-11 text-sm pl-9 placeholder:text-muted-foreground/60"
                 autoFocus
               />
               {carregandoClientes && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground/60 w-4 h-4 animate-spin" />}
               
               {mostrarDropdownCliente && task.title.length > 0 && !clienteId && (
                 <div className="absolute top-12 left-0 right-0 bg-card border border-border rounded-lg shadow-lg max-h-40 overflow-y-auto p-1.5 space-y-0.5 z-50">
                   {clientes.filter(c => c.nome.toLowerCase().includes(task.title.toLowerCase())).length > 0 ? (
                     clientes.filter(c => c.nome.toLowerCase().includes(task.title.toLowerCase())).map(cli => (
                       <div 
                         key={cli.id} 
                         onMouseDown={() => selecionarCliente(cli)} 
                         className="flex flex-col p-2.5 hover:bg-secondary/80 rounded-md cursor-pointer transition-colors"
                       >
                         <span className="text-xs font-semibold text-foreground uppercase">{cli.nome}</span>
                       </div>
                     ))
                   ) : (
                     <div className="p-3 text-center">
                       <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">Nenhum cliente encontrado</span>
                       <p className="text-[9px] text-muted-foreground/70 mt-0.5">Será salvo como texto livre.</p>
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

            <ChecklistEditor
              checklist={task.checklist}
              onChange={(c) => setTask({ ...task, checklist: c })}
            />

            <button
              type="button"
              onClick={() => setShowDetails(!showDetails)}
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              {showDetails ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              {showDetails ? "Menos detalhes" : "Mais detalhes"}
            </button>

            <AnimatePresence>
              {showDetails && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden space-y-3"
                >
                  <Textarea
                    placeholder="Descrição (opcional)"
                    value={task.description}
                    onChange={(e) => setTask({ ...task, description: e.target.value })}
                    className="border-0 bg-secondary/50 text-sm min-h-[70px] placeholder:text-muted-foreground/60"
                  />
                  
                  <div className="flex flex-wrap gap-2 md:gap-3">
                    
                    {/* CALENDÁRIO PADRONIZADO (Estilo Branco/Borda idêntico ao Editar) */}
                    <div className="flex-1 min-w-[130px] relative">
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant={"outline"}
                            type="button"
                            className={`h-10 w-full justify-between rounded-md border border-slate-200 bg-white px-3 text-xs font-bold uppercase transition-colors hover:bg-slate-50 focus:ring-2 focus:ring-slate-400 focus:border-transparent ${!selectedDate ? "text-slate-400" : "text-slate-600"}`}
                          >
                            {selectedDate ? format(selectedDate, "dd/MM", { locale: ptBR }) : <span className="opacity-0">Data</span>}
                            <CalendarDays className="h-4 w-4 text-slate-400" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0 rounded-lg border border-slate-200 shadow-xl z-[100]" align="start">
                          <Calendar
                            mode="single"
                            selected={selectedDate}
                            onSelect={handleDateSelect}
                            locale={ptBR}
                            initialFocus
                            className="p-3 bg-white"
                            classNames={{
                              head_cell: "text-slate-500 rounded-md w-9 font-normal text-[11px] uppercase tracking-wider",
                              cell: "h-9 w-9 text-center text-sm p-0 relative [&:has([aria-selected].day-range-end)]:rounded-r-md [&:has([aria-selected].day-outside)]:bg-slate-100/50 [&:has([aria-selected])]:bg-slate-100 first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
                              day: "h-9 w-9 p-0 font-normal aria-selected:opacity-100 hover:bg-slate-100 rounded-md text-slate-900",
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

                    {/* PRIORIDADE E CATEGORIA (Também com estilo branco pra combinar) */}
                    <div className="flex-1 min-w-[100px]">
                      <Select value={task.priority} onValueChange={(v) => setTask({ ...task, priority: v })}>
                        <SelectTrigger className="h-10 text-xs font-bold uppercase tracking-widest bg-white border border-slate-200 text-slate-600 rounded-md data-[placeholder]:text-slate-400">
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
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => { setIsOpen(false); setShowDetails(false); setClienteId(null); setSelectedDate(undefined); }}
                className="text-xs h-8"
              >
                <X className="w-3 h-3 mr-1" />
                Cancelar
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={!task.title.trim()}
                className="text-xs h-8 bg-primary hover:bg-primary/90"
              >
                <Plus className="w-3 h-3 mr-1" />
                Adicionar
              </Button>
            </div>
          </motion.form>
        )}
      </AnimatePresence>
    </div>
  );
}