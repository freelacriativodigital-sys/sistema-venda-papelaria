import React from 'react';
import { ShoppingBag, Search, Layers } from "lucide-react";

// Este é o módulo do Topo do Site (Header).
// Ele recebe algumas "props" (variáveis) do arquivo principal para funcionar.
export default function HeaderSite({ st, searchTerm, setSearchTerm, selectedCategory, changeCategory, categorias, isPublic, goHome, view }) {
  return (
    <div className="w-full bg-white relative md:sticky top-0 z-40 shadow-sm border-b border-slate-100">
      {/* Linha colorida no topo baseada na cor principal escolhida no admin */}
      <div className="h-1.5 w-full transition-colors duration-300" style={{ backgroundColor: st?.cor_principal || '#f472b6' }} />

      {/* ========================================== */}
      {/* 📱 1. VERSÃO EXCLUSIVA PARA CELULAR (MOBILE) */}
      {/* A classe "block md:hidden" faz com que isso só apareça em telas pequenas */}
      {/* ========================================== */}
      <div className="block md:hidden px-4 py-4 space-y-4">
        
        {/* Logo (Celular) */}
        <div onClick={goHome} className="flex justify-center cursor-pointer">
          <div className="h-14 flex items-center justify-center">
            {st?.logo_url ? (
              <img src={st.logo_url} className="h-full w-auto object-contain" alt="Logo" />
            ) : (
              <ShoppingBag size={32} style={{ color: st?.cor_principal }} />
            )}
          </div>
        </div>

        {/* Barra de Busca (Celular) */}
        <div className="w-full relative group">
          <input 
            type="text" 
            placeholder="O que você procura hoje?" 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full h-11 bg-slate-50 rounded-full px-6 pl-14 border border-slate-200 focus:bg-white focus:border-slate-300 transition-all outline-none text-sm text-slate-700"
          />
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
        </div>
      </div>


      {/* ========================================== */}
      {/* 💻 2. VERSÃO EXCLUSIVA PARA COMPUTADOR (DESKTOP) */}
      {/* A classe "hidden md:flex" faz com que isso só apareça em telas grandes */}
      {/* ========================================== */}
      <div className="hidden md:flex max-w-7xl mx-auto px-8 py-6 items-center gap-12">
        
        {/* Logo (Computador) */}
        <div onClick={goHome} className="flex items-center shrink-0 cursor-pointer group hover:scale-105 transition-transform">
          <div className="h-16 flex items-center justify-center">
            {st?.logo_url ? (
              <img src={st.logo_url} className="h-full w-auto object-contain" alt="Logo" />
            ) : (
              <ShoppingBag size={32} style={{ color: st?.cor_principal }} />
            )}
          </div>
        </div>

        {/* Barra de Busca (Computador) */}
        <div className="flex-1 w-full max-w-4xl relative group">
          <input 
            type="text" 
            placeholder="O que você procura hoje?" 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full h-14 bg-slate-50 hover:bg-slate-50 rounded-full px-6 pl-14 border border-slate-200 focus:bg-white focus:border-slate-300 focus:ring-4 focus:ring-slate-100/50 transition-all outline-none text-base text-slate-700 shadow-sm"
          />
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 transition-colors" size={20} />
        </div>
      </div>

      {/* ========================================== */}
      {/* 🏷️ 3. BARRA DE CATEGORIAS (Aparece em ambos, mas se adapta) */}
      {/* ========================================== */}
      {view !== 'detalhe' && (
        <div className="border-t border-slate-100 bg-slate-50/50">
          <div className="max-w-7xl mx-auto px-4 md:px-8 py-3 flex items-center gap-2.5 overflow-x-auto no-scrollbar">
            
            <button 
              onClick={() => changeCategory('Todas')}
              className={`text-[11px] md:text-xs font-bold whitespace-nowrap transition-all px-4 py-2 md:py-2.5 rounded-full border flex items-center gap-2 ${selectedCategory === 'Todas' ? 'shadow-sm text-white' : 'bg-white border-slate-200 text-slate-600'}`}
              style={selectedCategory === 'Todas' ? { backgroundColor: st?.cor_principal, borderColor: st?.cor_principal } : {}}
            >
              <Layers size={14} className={selectedCategory === 'Todas' ? "text-white/80" : "text-slate-400"} />
              Todas as Categorias
            </button>

            {categorias?.filter(c => c !== 'Sem Categoria').map(cat => {
              const isSelected = selectedCategory.toLowerCase().trim() === cat.toLowerCase().trim();
              return (
                <button 
                  key={cat}
                  onClick={() => changeCategory(cat)}
                  className={`text-[11px] md:text-xs font-bold whitespace-nowrap transition-all px-4 py-2 md:py-2.5 rounded-full border ${isSelected ? 'shadow-sm text-white' : 'bg-white border-slate-200 text-slate-600'}`}
                  style={isSelected ? { backgroundColor: st?.cor_principal, borderColor: st?.cor_principal } : {}}
                >
                  {cat}
                </button>
              )
            })}

          </div>
        </div>
      )}
    </div>
  );
}