import React from 'react';
import { Input } from "@/components/ui/input";
import { Globe, Target } from "lucide-react";

export default function TabMarketing({ st, setSt }) {
  if (!st) return null;

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
       
       <div>
         <h2 className="text-sm font-semibold text-slate-800 uppercase tracking-tight flex items-center gap-2 mb-1">
           <Globe size={16} className="text-blue-600" /> Indexação Google (SEO)
         </h2>
         <p className="text-[10px] text-slate-500 font-medium uppercase tracking-widest mb-4">
           Permitir que o seu Catálogo de Produtos apareça nas buscas do Google. (O sistema interno continuará sempre oculto e seguro).
         </p>
         
         <label className="flex items-center gap-3 p-3 border border-slate-200 rounded-lg cursor-pointer hover:bg-slate-50 transition-colors w-full">
            <input 
              type="checkbox" 
              checked={st.indexar_google ?? true}
              onChange={(e) => setSt({ ...st, indexar_google: e.target.checked })}
              className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500 transition-all"
            />
            <div className="flex flex-col">
              <span className="text-xs font-semibold text-slate-800 uppercase tracking-tight">Indexar Catálogo Publicamente</span>
              <span className="text-[9px] font-medium text-slate-500 uppercase tracking-widest mt-0.5">Recomendado para atrair mais clientes</span>
            </div>
         </label>
       </div>

       <div className="pt-4 border-t border-slate-100">
         <h2 className="text-sm font-semibold text-slate-800 uppercase tracking-tight flex items-center gap-2 mb-1">
           <Target size={16} className="text-blue-600" /> Meta Pixel
         </h2>
         <p className="text-[10px] text-slate-500 font-medium uppercase tracking-widest mb-4">
           Rastreie eventos e conversões dos visitantes no seu Catálogo (Vitrine).
         </p>
         <div className="space-y-1.5 max-w-sm">
            <label className="text-[9px] font-semibold uppercase text-slate-500 tracking-widest ml-1">ID do Pixel (Apenas números)</label>
            <Input
              placeholder="Ex: 123456789012345"
              value={st.meta_pixel_id || ''}
              onChange={(e) => setSt({ ...st, meta_pixel_id: e.target.value.replace(/\D/g, '') })}
              className="h-10 text-xs font-semibold bg-slate-50 border-slate-200 focus:bg-white"
            />
         </div>
       </div>

    </div>
  );
}