import React from "react";
import { ShoppingBag, CheckCheck, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AnimatePresence, motion } from "framer-motion";

export default function LojaSite({ solicitacoes, handleUpdate, handleDelete }) {
  return (
    <div className="space-y-4">
      <div className="bg-blue-50 border border-blue-200 p-3 rounded-lg text-blue-800">
         <h2 className="font-semibold uppercase tracking-widest text-[10px] flex items-center gap-1.5">
           <ShoppingBag size={14}/> Novas Solicitações
         </h2>
         <p className="text-[9px] mt-1 font-medium">Pedidos iniciados pelos clientes através do seu Catálogo ou Link da Bio. Aceite para iniciar a produção.</p>
      </div>
      
      {solicitacoes.length === 0 ? (
         <div className="text-center py-16 bg-white rounded-xl border border-slate-200 shadow-sm">
           <ShoppingBag className="w-10 h-10 text-slate-300 mx-auto mb-2" />
           <p className="text-slate-500 font-semibold uppercase tracking-widest text-[10px]">Nenhum pedido novo</p>
         </div>
      ) : (
         <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
           <AnimatePresence>
             {solicitacoes.map(t => (
               <motion.div key={t.id} layout initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-white border border-blue-200 shadow-sm rounded-xl p-3 flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-start gap-2 mb-2">
                       <h3 className="font-semibold text-slate-800 text-xs leading-tight uppercase">{t.title}</h3>
                       <span className="font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full text-[9px] shrink-0 border border-emerald-100">
                         {(t.service_value || 0).toLocaleString('pt-BR', {style: 'currency', currency: 'BRL'})}
                       </span>
                    </div>
                    <div className="bg-slate-50 p-2.5 rounded-md border border-slate-100 text-[10px] text-slate-600 whitespace-pre-wrap mb-3 font-medium">
                       {t.description}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 mt-auto">
                     <Button onClick={() => handleUpdate(t.id, { status: 'pendente' })} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white h-8 text-[9px] uppercase font-semibold tracking-widest rounded-md">
                       <CheckCheck size={12} className="mr-1.5"/> Aceitar Pedido
                     </Button>
                     <Button onClick={() => handleDelete(t)} variant="outline" className="h-8 px-2.5 rounded-md border-red-200 text-red-500 hover:bg-red-50">
                       <Trash2 size={14} />
                     </Button>
                  </div>
               </motion.div>
             ))}
           </AnimatePresence>
         </div>
      )}
    </div>
  );
}