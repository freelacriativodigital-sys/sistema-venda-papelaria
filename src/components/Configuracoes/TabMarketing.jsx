import React from 'react';
import { Megaphone, Search, Globe, Facebook, CheckCircle2, AlertCircle } from "lucide-react";
import { Input } from "@/components/ui/input";

export default function TabMarketing({ st, setSt }) {
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
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Globe size={16} className="text-slate-400" />
              <div>
                <p className="text-[10px] font-bold text-slate-800 uppercase tracking-tight">Indexação no Google</p>
                <p className="text-[8px] text-slate-500 font-medium uppercase">Permitir que o robô do Google leia sua loja</p>
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

        {/* FACEBOOK PIXEL */}
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3 shadow-sm">
          <div className="flex items-center gap-2">
            <Facebook size={16} className="text-blue-600" />
            <div>
              <p className="text-[10px] font-bold text-slate-800 uppercase tracking-tight">Meta Pixel ID</p>
              <p className="text-[8px] text-slate-500 font-medium uppercase">Rastreie conversões de anúncios</p>
            </div>
          </div>
          <Input 
            value={st.meta_pixel_id || ''} 
            onChange={(e) => setSt({ ...st, meta_pixel_id: e.target.value })}
            placeholder="Ex: 123456789012345"
            className="h-9 bg-white border-slate-200 text-xs font-semibold text-slate-700 focus:border-blue-400"
          />
        </div>
      </div>

      {/* VALIDADOR DE INDEXAÇÃO */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 md:p-5">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <h4 className="text-xs font-bold text-blue-800 uppercase tracking-widest flex items-center gap-1.5 mb-1">
              <Search size={14} /> Validador de Indexação
            </h4>
            <p className="text-[10px] text-blue-600/80 font-medium leading-relaxed max-w-lg uppercase">
              Confirme se o Google já consegue ler seu catálogo. O robô do Google pode levar alguns dias para processar a página após a liberação.
            </p>
          </div>
          <div className="w-full md:w-auto flex shrink-0">
            <a 
              href="https://search.google.com/test/rich-results?url=https://www.criartepapelaria.com.br" 
              target="_blank" 
              rel="noopener noreferrer"
              className="w-full md:w-auto h-9 px-4 bg-white text-blue-600 hover:bg-blue-600 hover:text-white border border-blue-200 hover:border-blue-600 rounded-md font-bold uppercase tracking-widest text-[9px] flex items-center justify-center transition-all shadow-sm"
            >
              Fazer Teste no Google
            </a>
          </div>
        </div>
        
        <div className="mt-4 pt-3 border-t border-blue-100/50 flex flex-col gap-1.5">
          <p className="text-[9px] font-bold text-blue-800 uppercase tracking-widest">Dicas para sumir com o Erro 404 (Páginas antigas):</p>
          <p className="text-[9px] font-medium text-blue-700 uppercase">1. Acesse o <a href="https://search.google.com/search-console" target="_blank" className="underline font-bold">Google Search Console</a>.</p>
          <p className="text-[9px] font-medium text-blue-700 uppercase">2. Vá em "Remoções" e adicione os links antigos que estão quebrados.</p>
          <p className="text-[9px] font-medium text-blue-700 uppercase">3. Aguarde o Google atualizar o banco de dados dele (pode levar semanas).</p>
        </div>
      </div>

    </div>
  );
}