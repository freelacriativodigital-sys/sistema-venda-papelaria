import React from 'react';
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";

export default function SeletorData({ 
  label, 
  value, 
  onChange, 
  className = ""
}) {
  // Converte a string 'YYYY-MM-DD' que vem do banco para uma Data real do React
  const dataFormatada = value ? parseISO(value) : undefined;

  const handleSelect = (date) => {
    if (date) {
      onChange(format(date, 'yyyy-MM-dd')); // Devolve pro formulário no formato do Banco
    } else {
      onChange('');
    }
  };

  return (
    <div className={`space-y-1.5 w-full flex flex-col ${className}`}>
      {label && (
        <label className="text-[9px] font-bold uppercase text-slate-500 tracking-widest ml-1">
          {label}
        </label>
      )}
      {/* A MÁGICA ESTÁ AQUI: modal={true} impede que ele voe pela tela */}
      <Popover modal={true}>
        <PopoverTrigger asChild>
          <Button
            variant={"outline"}
            type="button"
            className={`h-10 w-full justify-between rounded-md border border-slate-200 bg-white px-3 text-xs font-bold uppercase transition-colors hover:bg-slate-50 focus:ring-2 focus:ring-slate-400 focus:border-transparent ${!dataFormatada ? "text-slate-400" : "text-slate-600"}`}
          >
            {dataFormatada ? format(dataFormatada, "dd/MM/yyyy", { locale: ptBR }) : "Selecionar Data"}
            <CalendarDays className="h-4 w-4 text-slate-400 shrink-0" />
          </Button>
        </PopoverTrigger>
        
        {/* sideOffset e align travam ele grudado no botão */}
        <PopoverContent 
          className="w-auto p-0 rounded-xl border border-slate-200 shadow-2xl" 
          align="start" 
          side="bottom"
          sideOffset={4}
          style={{ zIndex: 99999 }}
        >
          <Calendar
            mode="single"
            selected={dataFormatada}
            onSelect={handleSelect}
            locale={ptBR}
            initialFocus
            className="p-3 bg-white rounded-xl"
            classNames={{
              head_cell: "text-slate-500 rounded-md w-9 font-normal text-[11px] uppercase tracking-wider",
              cell: "h-9 w-9 text-center text-sm p-0 relative [&:has([aria-selected].day-range-end)]:rounded-r-md [&:has([aria-selected].day-outside)]:bg-slate-100/50 [&:has([aria-selected])]:bg-slate-100 first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
              day: "h-9 w-9 p-0 font-medium aria-selected:opacity-100 hover:bg-slate-100 rounded-md transition-colors",
              day_selected: "bg-blue-600 text-white hover:bg-blue-700 hover:text-white focus:bg-blue-600 focus:text-white rounded-md font-bold shadow-md",
              day_today: "bg-slate-100 text-slate-900 rounded-md font-bold",
              day_outside: "day-outside text-slate-400 opacity-50 aria-selected:bg-slate-100/50 aria-selected:text-slate-400 aria-selected:opacity-30",
              day_disabled: "text-slate-400 opacity-50",
              nav_button: "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100 border border-slate-200 rounded-md text-slate-600 flex items-center justify-center",
              nav_button_previous: "absolute left-1",
              nav_button_next: "absolute right-1",
              caption: "flex justify-center pt-1 relative items-center text-sm font-bold text-slate-800 uppercase tracking-tight mb-2",
            }}
            components={{
              IconLeft: ({ ...props }) => <ChevronLeft className="h-4 w-4" />,
              IconRight: ({ ...props }) => <ChevronRight className="h-4 w-4" />,
            }}
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}