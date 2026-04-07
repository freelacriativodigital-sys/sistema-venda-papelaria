import React, { useState } from 'react';
import { Megaphone, Search, Globe, Facebook, CheckCircle2, AlertCircle, BarChart, ChevronDown } from "lucide-react";
import { Input } from "@/components/ui/input";

export default function TabMarketing({ st, setSt }) {
  const [showPixelHelp, setShowPixelHelp] = useState(false);
  const [showGaHelp, setShowGaHelp] = useState(false);

  if (!st) return null;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      
      {/* HEADER DA ABA */}
      <div className="border-b border-slate-100 pb-4">
        <h3 className="text-[11px] font-semibold uppercase text-slate-800 flex items-center gap-1.5">
          <Megaphone size={14} className="text-blue-600"/> SEO & Rastreamento
        </h3>
        <p className="text-[9px] font-medium text-slate-500 uppercase tracking-widest mt-0.5">
          Configure como sua loja aparece no Google e redes sociais
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        
        {/* CONFIGURAÇÃO DE INDEXAÇÃO */}
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-4 shadow-sm md:col-span-2 lg:col-span-1">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Globe size={16} className="text-slate-400" />
              <div>
                <p className="text-[10px] font-bold text-slate-800 uppercase tracking-tight">Indexação no Google</p>
                <p className="text-[8px] text-slate-500 font-medium uppercase tracking-widest">Permitir que o robô leia sua loja</p>
              </div>
            </div>
            <button 
              onClick={() => setSt({ ...st, indexar_google: !st.indexar_google })}
              className={`w-10 h-5 rounded-full p-0.5 transition-all shadow-inner ${st.indexar_google ? 'bg-emerald-500' : 'bg-slate-300'}`}
            >
              <div className={`w-4 h-4 bg-white rounded-full transition-transform shadow-sm ${st.indexar_google ? 'translate-x-5' : 'translate-x-0'}`} />
            </button>
          </div>

          {st.indexar_google ? (
            <div className="bg-emerald-50 border border-emerald-100 p-2.5 rounded-lg flex items-center gap-2">
              <CheckCircle2 size={12} className="text-emerald-500" />
              <span className="text-[9px] font-bold text-emerald-700 uppercase tracking-widest">Loja Aberta para Buscas</span>
            </div>
          ) : (
            <div className="bg-amber-50 border border-amber-100 p-2.5 rounded-lg flex items-center gap-2">
              <AlertCircle size={12} className="text-amber-500" />
              <span className="text-[9px] font-bold text-amber-700 uppercase tracking-widest">Loja Oculta (Privada)</span>
            </div>
          )}
        </div>

        {/* VALIDADOR DE INDEXAÇÃO (Movido para cima para ficar ao lado) */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 shadow-sm md:col-span-2 lg:col-span-1 flex flex-col justify-between">
          <div>
            <h4 className="text-[10px] font-bold text-blue-800 uppercase tracking-widest flex items-center gap-1.5 mb-1.5">
              <Search size={14} /> Validador de Indexação
            </h4>
            <p className="text-[9px] text-blue-600/80 font-medium leading-relaxed uppercase">
              Confirme se o Google já consegue ler seu catálogo.
            </p>
          </div>
          <a 
            href="https://search.google.com/test/rich-results?url=https://www.criartepapelaria.com.br" 
            target="_blank" 
            rel="noopener noreferrer"
            className="mt-3 w-full h-8 px-4 bg-white text-blue-600 hover:bg-blue-600 hover:text-white border border-blue-200 hover:border-blue-600 rounded-md font-bold uppercase tracking-widest text-[9px] flex items-center justify-center transition-all shadow-sm"
          >
            Fazer Teste no Google
          </a>
        </div>

        {/* FACEBOOK PIXEL */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col">
          <div className="flex items-center gap-2 mb-3">
            <Facebook size={16} className="text-blue-600" />
            <div>
              <p className="text-[10px] font-bold text-slate-800 uppercase tracking-tight">Meta Pixel ID</p>
              <p className="text-[8px] text-slate-500 font-medium uppercase tracking-widest">Rastreie anúncios no Instagram/FB</p>
            </div>
          </div>
          <Input 
            value={st.meta_pixel_id || ''} 
            onChange={(e) => setSt({ ...st, meta_pixel_id: e.target.value })}
            placeholder="Ex: 123456789012345"
            className="h-9 bg-slate-50 border-slate-200 text-xs font-semibold text-slate-700 focus:bg-white focus:border-blue-400 mb-3"
          />
          
          {/* SANFONA META PIXEL */}
          <div className="mt-auto border-t border-slate-100 pt-2">
            <button 
              onClick={() => setShowPixelHelp(!showPixelHelp)}
              className="flex items-center justify-between w-full text-left text-[9px] font-semibold text-blue-600 uppercase tracking-widest hover:text-blue-700 transition-colors"
            >
              Como encontrar meu ID?
              <ChevronDown size={14} className={`transition-transform duration-300 ${showPixelHelp ? 'rotate-180' : ''}`} />
            </button>
            <div className={`overflow-hidden transition-all duration-300 ${showPixelHelp ? 'max-h-40 mt-2 opacity-100' : 'max-h-0 opacity-0'}`}>
              <div className="bg-blue-50 p-3 rounded-lg border border-blue-100 space-y-1.5">
                <p className="text-[9px] font-medium text-slate-600">1. Acesse o <a href="https://business.facebook.com/events_manager2" target="_blank" className="font-bold text-blue-600 underline">Gerenciador de Eventos</a> da Meta.</p>
                <p className="text-[9px] font-medium text-slate-600">2. No menu esquerdo, clique em "Fontes de Dados".</p>
                <p className="text-[9px] font-medium text-slate-600">3. Selecione o seu Pixel. O número do ID (composto só por números) aparecerá no lado direito da tela.</p>
                <p className="text-[9px] font-medium text-slate-600">4. Copie e cole apenas os números aqui.</p>
              </div>
            </div>
          </div>
        </div>

        {/* GOOGLE ANALYTICS */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col">
          <div className="flex items-center gap-2 mb-3">
            <BarChart size={16} className="text-amber-500" />
            <div>
              <p className="text-[10px] font-bold text-slate-800 uppercase tracking-tight">Google Analytics 4</p>
              <p className="text-[8px] text-slate-500 font-medium uppercase tracking-widest">Métricas de visitas e origem</p>
            </div>
          </div>
          <Input 
            value={st.google_analytics_id || ''} 
            onChange={(e) => setSt({ ...st, google_analytics_id: e.target.value })}
            placeholder="Ex: G-XXXXXXXXXX"
            className="h-9 bg-slate-50 border-slate-200 text-xs font-semibold text-slate-700 focus:bg-white focus:border-amber-400 mb-3 uppercase"
          />
          
          {/* SANFONA GOOGLE ANALYTICS */}
          <div className="mt-auto border-t border-slate-100 pt-2">
            <button 
              onClick={() => setShowGaHelp(!showGaHelp)}
              className="flex items-center justify-between w-full text-left text-[9px] font-semibold text-amber-600 uppercase tracking-widest hover:text-amber-700 transition-colors"
            >
              Como encontrar meu ID (G-)?
              <ChevronDown size={14} className={`transition-transform duration-300 ${showGaHelp ? 'rotate-180' : ''}`} />
            </button>
            <div className={`overflow-hidden transition-all duration-300 ${showGaHelp ? 'max-h-40 mt-2 opacity-100' : 'max-h-0 opacity-0'}`}>
              <div className="bg-amber-50 p-3 rounded-lg border border-amber-100 space-y-1.5">
                <p className="text-[9px] font-medium text-slate-600">1. Acesse o <a href="https://analytics.google.com/" target="_blank" className="font-bold text-amber-600 underline">Google Analytics</a>.</p>
                <p className="text-[9px] font-medium text-slate-600">2. No canto inferior esquerdo, clique em "Administrador" (engrenagem).</p>
                <p className="text-[9px] font-medium text-slate-600">3. Na coluna da Propriedade, clique em "Fluxos de dados" e escolha seu site.</p>
                <p className="text-[9px] font-medium text-slate-600">4. Copie o "ID da métrica" (começa com G-).</p>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}