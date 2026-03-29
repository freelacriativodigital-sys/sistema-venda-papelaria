import React from 'react';
import { Wallet, Banknote } from "lucide-react";
import { Input } from "@/components/ui/input";

export default function TabOperacao({ st, setSt }) {
  return (
    <div className="space-y-10 animate-in fade-in duration-500">
      
      <section>
        <div className="flex items-center gap-2 mb-4">
          <Wallet size={18} className="text-slate-400" />
          <h2 className="text-lg font-bold text-slate-800">Regras de Venda e Operação</h2>
        </div>
        
        <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 flex flex-col gap-6">
          
          <div className="flex flex-col gap-2">
            <label className="text-[11px] font-bold text-emerald-600 uppercase tracking-widest flex items-center gap-1.5">
              <Banknote size={14} /> Chave PIX (Recebimentos)
            </label>
            <p className="text-[10px] text-slate-500 font-medium mb-1">
              Sua chave PIX para facilitar os pagamentos. Ela será exibida no checkout e nos orçamentos.
            </p>
            <Input 
              value={st?.chave_pix || ''} 
              onChange={(e) => setSt({...st, chave_pix: e.target.value})} 
              placeholder="Ex: contato@suamarca.com.br ou 85999999999" 
              className="h-12 max-w-md bg-white border-slate-200 text-slate-800 font-medium text-sm rounded-xl" 
            />
          </div>

        </div>
      </section>

    </div>
  );
}