import React from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Plus, Trash2, ListPlus, Calendar as CalendarIcon, ChevronLeft, ChevronRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// Importações do calendário Premium
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function ChecklistEditor({ checklist = [], onChange }) {
  
  // Função para adicionar item em uma posição específica
  const addItem = (index = null) => {
    const newItem = { id: window.crypto.randomUUID(), name: "", value: 0, due_date: "" };
    
    if (index === null) {
      // Adiciona no final da lista (botão principal)
      onChange([...checklist, newItem]);
    } else {
      // Insere exatamente abaixo do item clicado
      const newChecklist = [...checklist];
      newChecklist.splice(index + 1, 0, newItem);
      onChange(newChecklist);
    }
  };

  const updateItem = (idx, field, value) => {
    const updated = checklist.map((item, i) =>
      i === idx ? { ...item, [field]: value } : item
    );
    onChange(updated);
  };

  const removeItem = (idx) => {
    onChange(checklist.filter((_, i) => i !== idx));
  };

  const handleDateSelect = (idx, date) => {
    if (date) {
      updateItem(idx, "due_date", format(date, 'yyyy-MM-dd'));
    } else {
      updateItem(idx, "due_date", "");
    }
  };

  const total = checklist.reduce((s, i) => s + (parseFloat(i.value) || 0), 0);

  const formatDate = (dateStr) => {
    if (!dateStr) return "";
    const [year, month, day] = dateStr.split('-');
    return `${day}/${month}`;
  };

  return (
    <div className="space-y-3 mt-4 border-t pt-4 border-border/50">
      <div className="flex items-center justify-between px-1 mb-1">
        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
          Itens do Pedido
        </span>
        <Button 
          type="button" 
          variant="ghost" 
          size="sm" 
          onClick={() => addItem()} 
          className="h-7 text-[10px] px-3 bg-primary text-primary-foreground font-bold hover:bg-primary/90"
        >
          <Plus className="w-3.5 h-3.5 mr-1" /> NOVO ITEM NO FINAL
        </Button>
      </div>

      <div className="space-y-2">
        <AnimatePresence mode="popLayout">
          {checklist.map((item, idx) => {
            const selectedDate = item.due_date ? parseISO(item.due_date) : undefined;

            return (
              <motion.div
                key={item.id || idx}
                layout
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="group relative"
              >
                <div className="bg-secondary/30 rounded-xl p-1.5 flex items-center gap-2 border border-border/20 shadow-sm transition-all hover:border-primary/20">
                  
                  {/* === BOTÃO DE DATA PREMIUM E 100% CLICÁVEL === */}
                  <div className="flex-shrink-0">
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          type="button"
                          variant="outline"
                          className={`h-9 flex items-center justify-center rounded-md border border-slate-200 bg-white text-xs font-bold uppercase transition-colors hover:bg-slate-50 focus:ring-2 focus:ring-slate-400 focus:border-transparent ${!item.due_date ? "w-9 p-0 text-slate-400" : "px-2.5 text-slate-600 gap-1.5"}`}
                        >
                          <CalendarIcon className="w-4 h-4" />
                          {item.due_date && <span>{formatDate(item.due_date)}</span>}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0 rounded-lg border border-slate-200 shadow-xl z-[100]" align="start">
                        <Calendar
                          mode="single"
                          selected={selectedDate}
                          onSelect={(date) => handleDateSelect(idx, date)}
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

                  {/* NOME DO SERVIÇO */}
                  <input
                    placeholder="Nome do produto ou serviço..."
                    value={item.name}
                    onChange={(e) => updateItem(idx, "name", e.target.value)}
                    className="h-9 text-xs bg-background rounded-lg border-0 flex-1 min-w-0 px-3 outline-none focus:ring-2 focus:ring-primary/10 font-medium"
                  />

                  {/* VALOR */}
                  <div className="relative flex-shrink-0 flex items-center bg-background rounded-lg px-3 h-9 border border-border/10 w-[100px]">
                    <span className="text-[10px] text-muted-foreground mr-1 font-black">R$</span>
                    <input
                      type="number"
                      placeholder="0,00"
                      value={item.value || ""}
                      onChange={(e) => updateItem(idx, "value", parseFloat(e.target.value) || 0)}
                      className="bg-transparent border-0 text-xs outline-none text-right w-full pr-1 font-bold text-foreground"
                    />
                  </div>

                  {/* REMOVER */}
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9 text-muted-foreground/30 hover:text-destructive hover:bg-destructive/5 transition-colors"
                    onClick={() => removeItem(idx)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>

                {/* BOTÃO MÁGICO: INSERIR ABAIXO */}
                <div className="absolute -bottom-2.5 left-1/2 -translate-x-1/2 z-10 opacity-0 group-hover:opacity-100 transition-all duration-200">
                  <button
                    type="button"
                    onClick={() => addItem(idx)}
                    className="bg-primary text-white p-1 rounded-full shadow-lg border-2 border-background hover:scale-110 active:scale-95 transition-transform flex items-center gap-1 px-2"
                  >
                    <ListPlus className="w-3.5 h-3.5" />
                    <span className="text-[9px] font-black uppercase pr-1">Inserir aqui</span>
                  </button>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {checklist.length > 0 && (
        <div className="flex justify-end pt-2">
          <div className="bg-primary/10 border border-primary/20 px-4 py-2 rounded-xl">
            <span className="text-[10px] font-black text-primary uppercase tracking-tighter mr-2">Total do Pedido:</span>
            <span className="text-sm font-black text-primary">R$ {total.toFixed(2).replace('.', ',')}</span>
          </div>
        </div>
      )}
    </div>
  );
}