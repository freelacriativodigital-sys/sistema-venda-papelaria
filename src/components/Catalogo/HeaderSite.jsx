import React from 'react';
import { ShoppingBag, Search, Layers } from "lucide-react";

export const HeaderSite = ({ st, searchTerm, setSearchTerm, selectedCategory, changeCategory, categorias, isPublic, goHome, view }) => {
  const whatsappLink = st?.whatsapp ? `https://wa.me/${st.whatsapp.replace(/\D/g, '')}` : '#';

  return (
    <div className="w-full bg-white relative md:sticky top-0 z-40 shadow-sm border-b border-slate-100 flex flex-col">
      
      {/* BARRA SUPERIOR */}
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-3 md:py-4 w-full flex items-center justify-between gap-4">
        <div onClick={goHome} className="flex items-center shrink-0 cursor-pointer group">
          <div className="h-10 md:h-14 flex items-center justify-center transition-transform group-hover:scale-105">
            {st?.logo_url ? (
              <img src={st.logo_url} className="h-full w-auto object-contain" alt="Logo" />
            ) : (
              <h2 className="text-xl md:text-2xl font-black tracking-tighter" style={{ color: st?.cor_principal || '#f472b6' }}>
                {st?.nome_loja || 'MINHA LOJA'}
              </h2>
            )}
          </div>
        </div>

        <div className="flex items-center gap-4 flex-1 justify-end">
          <div className="hidden md:block relative max-w-md w-full">
            <input 
              type="text" 
              placeholder="Buscar produtos..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full h-11 bg-slate-50 rounded-full px-5 pl-12 border border-slate-200 focus:bg-white focus:border-slate-300 transition-all outline-none text-sm text-slate-700 shadow-sm"
            />
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          </div>
          
          <button onClick={() => window.open(whatsappLink, '_blank')} className="hidden sm:flex h-11 px-6 rounded-full text-white font-bold text-[11px] uppercase tracking-widest items-center gap-2 shadow-md hover:scale-105 transition-transform" style={{ backgroundColor: st?.cor_principal || '#f472b6' }}>
             WhatsApp
          </button>
        </div>
      </div>

      <div className="md:hidden px-4 pb-4 w-full">
        <div className="relative w-full">
          <input 
            type="text" 
            placeholder="Buscar produtos..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full h-11 bg-slate-50 rounded-full px-5 pl-12 border border-slate-200 focus:bg-white outline-none text-sm text-slate-700 shadow-sm"
          />
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
        </div>
      </div>

      {/* BANNER SPLIT TIPO LANDING PAGE */}
      {view === 'grid' && st?.banner_url && (
        <div className="w-full flex flex-col md:flex-row border-t border-slate-100 overflow-hidden">
          <div className="w-full md:w-1/2 flex flex-col justify-center px-6 py-12 md:p-12 lg:p-20 text-center md:text-left bg-white order-2 md:order-1">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-slate-900 mb-4 tracking-tight leading-[1.1]">
              {st?.nome_loja || 'Sua Loja Aqui'}
            </h1>
            <p className="text-sm md:text-base text-slate-500 mb-8 max-w-md mx-auto md:mx-0 leading-relaxed font-medium">
              {st?.texto_sobre || 'Transformando ideias em momentos inesquecíveis. Qualidade, personalização e carinho em cada detalhe.'}
            </p>
            <div className="flex flex-col sm:flex-row items-center gap-3 justify-center md:justify-start">
              <button onClick={() => window.open(whatsappLink, '_blank')} className="w-full sm:w-auto h-12 px-8 rounded-full text-white font-bold text-[11px] md:text-xs uppercase tracking-widest shadow-md hover:scale-105 transition-transform" style={{ backgroundColor: st?.cor_principal || '#f472b6' }}>
                Fale Conosco
              </button>
              <button onClick={() => { document.getElementById('categorias-bar')?.scrollIntoView({ behavior: 'smooth' }); }} className="w-full sm:w-auto h-12 px-8 rounded-full border-2 border-slate-200 text-slate-700 font-bold text-[11px] md:text-xs uppercase tracking-widest hover:bg-slate-50 transition-colors">
                Ver Produtos
              </button>
            </div>
          </div>

          <div className="w-full md:w-1/2 min-h-[250px] md:min-h-0 relative order-1 md:order-2 flex items-center justify-center p-4 md:p-10" style={{ backgroundColor: `${st?.cor_principal}15` || '#fdf2f8' }}>
             <img 
               src={st.banner_url} 
               alt="Banner Principal" 
               className="w-full h-full object-cover md:object-contain rounded-2xl md:rounded-3xl shadow-lg mix-blend-multiply" 
               style={{ maxHeight: '400px' }}
             />
          </div>
        </div>
      )}

      {/* MENU DE CATEGORIAS */}
      {view !== 'detalhe' && (
        <div id="categorias-bar" className="border-t border-slate-100 bg-slate-50/80 backdrop-blur-sm">
          <div className="max-w-7xl mx-auto px-4 md:px-8 py-3 flex items-center gap-2.5 overflow-x-auto no-scrollbar">
            <button 
              onClick={() => changeCategory('Todas')}
              className={`text-[11px] md:text-xs font-bold whitespace-nowrap transition-all px-5 py-2.5 rounded-full border flex items-center gap-2 ${selectedCategory === 'Todas' ? 'shadow-md text-white' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}
              style={selectedCategory === 'Todas' ? { backgroundColor: st?.cor_principal || '#f472b6', borderColor: st?.cor_principal || '#f472b6' } : {}}
            >
              <Layers size={14} className={selectedCategory === 'Todas' ? "text-white/90" : "text-slate-400"} />
              Todas as Categorias
            </button>
            {categorias?.filter(c => c !== 'Sem Categoria').map(cat => {
              const isSelected = selectedCategory.toLowerCase().trim() === cat.toLowerCase().trim();
              return (
                <button 
                  key={cat}
                  onClick={() => changeCategory(cat)}
                  className={`text-[11px] md:text-xs font-bold whitespace-nowrap transition-all px-5 py-2.5 rounded-full border ${isSelected ? 'shadow-md text-white' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                  style={isSelected ? { backgroundColor: st?.cor_principal || '#f472b6', borderColor: st?.cor_principal || '#f472b6' } : {}}
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
};