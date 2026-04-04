import React from 'react';
import { CalendarDays } from "lucide-react";
import { Input } from "@/components/ui/input";

export default function SeletorData({ 
  label, 
  value, 
  onChange, 
  min, 
  max, 
  iconColor = "text-slate-400",
  className = ""
}) {
  return (
    <div className={`space-y-1.5 w-full ${className}`}>
      {label && (
        <label className="text-[9px] font-semibold uppercase text-slate-500 tracking-widest ml-1">
          {label}
        </label>
      )}
      <div className="relative">
        {/* Ícone customizável (Premium) */}
        <CalendarDays className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none ${iconColor}`} />
        
        <Input 
          type="date" 
          value={value || ''} 
          onChange={e => onChange(e.target.value)} 
          min={min}
          max={max}
          /* O CSS abaixo é a mágica que esconde o ícone nativo feio do Windows/Android e deixa a área toda clicável */
          className="h-10 pl-9 border-slate-200 bg-slate-50 focus:bg-white rounded-md font-semibold text-xs text-slate-700 w-full relative transition-all shadow-sm
          [&::-webkit-calendar-picker-indicator]:absolute 
          [&::-webkit-calendar-picker-indicator]:right-0 
          [&::-webkit-calendar-picker-indicator]:w-full 
          [&::-webkit-calendar-picker-indicator]:h-full 
          [&::-webkit-calendar-picker-indicator]:opacity-0 
          [&::-webkit-calendar-picker-indicator]:cursor-pointer" 
        />
      </div>
    </div>
  );
}