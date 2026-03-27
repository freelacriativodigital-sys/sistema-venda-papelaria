import React from 'react';
import { Truck, CreditCard, ShieldCheck } from "lucide-react";

export default function BenefitsBar({ st }) {
  if (!st?.mostrar_beneficios) return null;
  return (
    <div className="bg-white border-b border-slate-100 hidden md:block transition-all duration-300">
      <div className="max-w-7xl mx-auto px-8 py-4 flex items-center justify-between gap-4">
        {[1, 2, 3].map(num => (
           <div key={num} className="flex items-center gap-3 text-slate-600">
              <div className="bg-slate-50 p-2 rounded-full border border-slate-100">
                {st[`beneficio_${num}_icone`] ? (
                   <img src={st[`beneficio_${num}_icone`]} className="w-5 h-5 object-contain" alt="" />
                ) : (
                   num === 1 ? <Truck size={18} className="text-rose-500" /> : 
                   num === 2 ? <CreditCard size={18} className="text-blue-500" /> : 
                   <ShieldCheck size={18} className="text-emerald-500" />
                )}
              </div>
              <div>
                <p className="text-[11px] font-bold text-slate-800 leading-none mb-1">{st[`beneficio_${num}_titulo`]}</p>
                <p className="text-[9px] font-medium text-slate-500">{st[`beneficio_${num}_desc`]}</p>
              </div>
           </div>
        ))}
      </div>
    </div>
  );
}