import React, { useState, useEffect } from 'react';
import { format, parseISO, isValid } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CalendarDays, ChevronLeft, ChevronRight, X } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";

export default function SeletorData({ value, onChange }) {
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState('');

  // Sincroniza o valor que vem do banco de dados (YYYY-MM-DD) com o campo de texto (DD/MM/YYYY)
  useEffect(() => {
    if (value) {
      const [year, month, day] = value.split('-');
      if (year && month && day) {
        setInputValue(`${day}/${month}/${year}`);
      }
    } else {
      setInputValue('');
    }
  }, [value]);

  // Máscara Inteligente para digitar a data
  const handleInputChange = (e) => {
    let val = e.target.value.replace(/\D/g, '');
    if (val.length > 8) val = val.slice(0, 8);

    let masked = val;
    if (val.length >= 3 && val.length <= 4) {
      masked = `${val.slice(0, 2)}/${val.slice(2)}`;
    } else if (val.length >= 5) {
      masked = `${val.slice(0, 2)}/${val.slice(2, 4)}/${val.slice(4)}`;
    }

    setInputValue(masked);

    // Quando terminar de digitar (10 caracteres), valida e salva
    if (masked.length === 10) {
      const [d, m, y] = masked.split('/');
      const day = parseInt(d, 10);
      const month = parseInt(m, 10);
      const year = parseInt(y, 10);

      // Validação básica para evitar datas loucas tipo 35/14/1990
      if (day > 0 && day <= 31 && month > 0 && month <= 12 && year > 1900 && year < 2100) {
        onChange(`${year}-${m}-${d}`);
      }
    } else if (masked.length === 0) {
      onChange(''); // Se apagar tudo, limpa a data
    }
  };

  const handleSelect = (date) => {
    if (date) {
      onChange(format(date, 'yyyy-MM-dd')); 
      setInputValue(format(date, 'dd/MM/yyyy'));
      setIsOpen(false);
    } else {
      onChange('');
      setInputValue('');
    }
  };

  const dataFormatada = value ? parseISO(value) : undefined;

  return (
    <div className="relative w-full">
      <Input
        type="text"
        placeholder="DD/MM/AAAA"
        value={inputValue}
        onChange={handleInputChange}
        maxLength={10}
        className={`h-9 w-full rounded-md border border-slate-200 bg-white px-3 pr-10 text-xs font-semibold transition-colors hover:bg-slate-50 focus:bg-white focus:border-blue-400 focus:ring-0 shadow-sm ${!inputValue ? "text-slate-400" : "text-slate-700"}`}
      />
      
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <button
            type="button"
            className="absolute right-0 top-0 h-9 w-9 flex items-center justify-center text-slate-400 hover:text-blue-600 transition-colors rounded-r-md"
          >
            <CalendarDays className="h-4 w-4 shrink-0" />
          </button>
        </PopoverTrigger>
        
        <PopoverContent 
          className="w-auto p-0 rounded-xl border border-slate-200 shadow-xl z-[99999]" 
          align="start" 
          sideOffset={4}
          onOpenAutoFocus={(e) => e.preventDefault()}
        >
          <div className="flex justify-between items-center p-2 border-b border-slate-100 bg-slate-50/50 rounded-t-xl">
            <span className="text-[9px] font-bold uppercase tracking-widest text-slate-500 ml-2">Calendário</span>
            <button onClick={() => setIsOpen(false)} className="p-1 hover:bg-slate-200 rounded text-slate-400 transition-colors"><X size={14}/></button>
          </div>

          <Calendar
            mode="single"
            selected={isValid(dataFormatada) ? dataFormatada : undefined}
            onSelect={handleSelect}
            locale={ptBR}
            initialFocus
            defaultMonth={isValid(dataFormatada) ? dataFormatada : new Date()}
            className="p-2 bg-white rounded-b-xl"
            classNames={{
              head_cell: "text-slate-500 rounded-md w-8 font-normal text-[10px] uppercase tracking-wider",
              cell: "h-8 w-8 text-center text-xs p-0 relative [&:has([aria-selected].day-range-end)]:rounded-r-md [&:has([aria-selected].day-outside)]:bg-slate-100/50 [&:has([aria-selected])]:bg-slate-100 first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
              day: "h-8 w-8 p-0 font-medium aria-selected:opacity-100 hover:bg-slate-100 rounded-md transition-colors",
              day_selected: "bg-blue-600 text-white hover:bg-blue-700 hover:text-white focus:bg-blue-600 focus:text-white rounded-md font-bold shadow-md",
              day_today: "bg-slate-100 text-slate-900 rounded-md font-bold",
              day_outside: "day-outside text-slate-400 opacity-50 aria-selected:bg-slate-100/50 aria-selected:text-slate-400 aria-selected:opacity-30",
              day_disabled: "text-slate-400 opacity-50",
              nav_button: "h-6 w-6 bg-transparent p-0 opacity-50 hover:opacity-100 border border-slate-200 rounded-md text-slate-600 flex items-center justify-center",
              nav_button_previous: "absolute left-1",
              nav_button_next: "absolute right-1",
              caption: "flex justify-center pt-1 relative items-center text-xs font-bold text-slate-800 uppercase tracking-tight mb-2",
            }}
            components={{
              IconLeft: ({ ...props }) => <ChevronLeft className="h-3.5 w-3.5" />,
              IconRight: ({ ...props }) => <ChevronRight className="h-3.5 w-3.5" />,
            }}
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}