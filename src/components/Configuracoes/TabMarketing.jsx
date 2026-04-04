import React from 'react';
import { Input } from "@/components/ui/input";
import { Globe, Target, HelpCircle, ExternalLink, CheckCircle2 } from "lucide-react";

export default function TabMarketing({ st, setSt }) {
  if (!st) return null;

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
       
       {/* SEÇÃO SEO */}
       <div>
         <h2 className="text-sm font-semibold text-slate-800 uppercase tracking-tight flex items-center gap-2 mb-1">
           <Globe size={16} className="text-blue-600" /> Indexação Google (SEO)
         </h2>
         <p className="text-[10px] text-slate-500 font-medium uppercase tracking-widest mb-4">
           Permitir que o seu Catálogo de Produtos apareça nas buscas do Google. (O sistema interno continuará sempre oculto e seguro).
         </p>
         
         <label className="flex items-center gap-3 p-3 border border-slate-200 rounded-lg cursor-pointer hover:bg-slate-50 transition-colors w-full md:w-fit pr-6">
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

       {/* SEÇÃO META PIXEL */}
       <div className="pt-6 border-t border-slate-100">
         <h2 className="text-sm font-semibold text-slate-800 uppercase tracking-tight flex items-center gap-2 mb-1">
           <Target size={16} className="text-blue-600" /> Meta Pixel
         </h2>
         <p className="text-[10px] text-slate-500 font-medium uppercase tracking-widest mb-4">
           Rastreie eventos e conversões dos visitantes no seu Catálogo (Vitrine).
         </p>
         
         <div className="flex flex-col md:flex-row gap-6 items-start">
           
           {/* Input Box */}
           <div className="w-full md:w-[30%] space-y-1.5 shrink-0">
              <label className="text-[9px] font-semibold uppercase text-slate-500 tracking-widest ml-1">ID do Pixel</label>
              <Input
                placeholder="Ex: 123456789012345"
                value={st.meta_pixel_id || ''}
                onChange={(e) => setSt({ ...st, meta_pixel_id: e.target.value.replace(/\D/g, '') })}
                className="h-10 text-xs font-semibold bg-slate-50 border-slate-200 focus:bg-white focus:border-blue-400 shadow-sm"
              />
              {st.meta_pixel_id && (
                <div className="flex items-center gap-1 mt-2 text-[9px] font-semibold text-emerald-600 uppercase tracking-widest ml-1">
                  <CheckCircle2 size={12} /> Pixel Ativo no Catálogo
                </div>
              )}
           </div>

           {/* Guia de Ajuda Inteligente */}
           <div className="flex-1 w-full bg-blue-50/50 border border-blue-100 rounded-xl p-4 md:p-5 shadow-sm">
             <h3 className="text-[10px] font-bold uppercase tracking-widest text-blue-800 flex items-center gap-1.5 mb-3">
               <HelpCircle size={14} className="text-blue-600" /> Como encontrar o meu Pixel?
             </h3>
             
             <ol className="text-xs font-medium text-slate-600 space-y-3 list-decimal list-inside ml-1">
               <li>
                 Acesse o <a href="https://business.facebook.com/settings" target="_blank" rel="noreferrer" className="text-blue-600 hover:text-blue-700 font-semibold inline-flex items-center gap-1 transition-colors">Gerenciador de Negócios da Meta <ExternalLink size={12}/></a>.
               </li>
               <li>
                 No menu lateral esquerdo, clique em <strong className="text-slate-800">Fontes de Dados</strong> e depois em <strong className="text-slate-800">Conjuntos de Dados</strong> <span className="text-[10px] text-slate-400">(ou Pixels)</span>.
               </li>
               <li>
                 Selecione o seu Pixel na lista de conexões.
               </li>
               <li>
                 Clique em cima do número de identificação <strong className="text-slate-800">(ID)</strong> para copiá-lo. O formato é apenas numérico (Ex: <span className="font-mono bg-white border border-slate-200 px-1.5 py-0.5 rounded text-[10px] text-slate-800 shadow-sm">123456789012345</span>).
               </li>
               <li>
                 Cole esse número no campo ao lado e clique em Salvar no topo da tela.
               </li>
             </ol>

             <div className="mt-5 pt-4 border-t border-blue-100">
               <p className="text-[9px] text-blue-600 uppercase tracking-widest font-semibold leading-relaxed">
                 <strong className="font-bold">✨ Automação Pronta:</strong> O sistema já envia eventos <span className="bg-white px-1 py-0.5 rounded border border-blue-100">PageView</span>, <span className="bg-white px-1 py-0.5 rounded border border-blue-100">ViewContent</span>, <span className="bg-white px-1 py-0.5 rounded border border-blue-100">AddToCart</span> e <span className="bg-white px-1 py-0.5 rounded border border-blue-100">InitiateCheckout</span> automaticamente para a Meta!
               </p>
             </div>
           </div>

         </div>
       </div>

    </div>
  );
}