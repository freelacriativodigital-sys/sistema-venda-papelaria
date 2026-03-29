import React, { useState } from 'react';
import { Search, Menu, X, Share2, ChevronDown, Instagram, Facebook, Mail } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export const HeaderSite = ({ st, searchTerm, setSearchTerm, selectedCategory, changeCategory, categorias, isPublic, goHome, view }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: st?.nome_loja || 'Catálogo',
        url: window.location.href
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert('Link do site copiado para a área de transferência!');
    }
  };

  const selectCat = (cat) => {
    changeCategory(cat);
    setIsMobileMenuOpen(false);
  };

  // Ícone do TikTok (SVG Personalizado, pois não tem no Lucide)
  const TikTokIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5"/>
    </svg>
  );

  // Fallbacks de cores caso o usuário ainda não tenha escolhido no painel
  const corFundo = st?.cor_fundo_topo || '#ffffff';
  const corTexto = st?.cor_texto_topo || '#0f172a';
  const corAcento = st?.cor_principal || '#f472b6';

  return (
    <>
      {/* ========================================= */}
      {/* 1. BARRA DE NAVEGAÇÃO SUPERIOR (NAVBAR)   */}
      {/* ========================================= */}
      <header className="w-full relative z-50 transition-colors duration-500" style={{ backgroundColor: corFundo }}>
        <div className="h-1.5 w-full" style={{ backgroundColor: corAcento }} />
        
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-4 flex items-center justify-between">
          
          {/* --- COLUNA 1: LOGO --- */}
          <div className="w-1/2 md:w-1/3 flex justify-start items-center cursor-pointer" onClick={goHome}>
            {st?.logo_url ? (
              <img src={st.logo_url} className="h-12 md:h-16 object-contain transition-transform hover:opacity-90" alt="Logo" />
            ) : (
              <h2 className="text-xl md:text-2xl font-bold tracking-tight hover:opacity-80 transition-opacity" style={{ color: corTexto }}>
                {st?.nome_loja || 'MINHA LOJA'}
              </h2>
            )}
          </div>

          {/* --- COLUNA 2: MENU CATEGORIAS (DESKTOP) --- */}
          <nav className="hidden md:flex w-auto justify-center items-center gap-6 lg:gap-10">
            <button 
              onClick={() => changeCategory('Todas')} 
              className={`relative flex items-center gap-1 text-[12px] font-semibold tracking-wide uppercase transition-all px-1 py-2 ${selectedCategory === 'Todas' ? 'opacity-100' : 'opacity-70 hover:opacity-100'}`}
              style={{ color: corTexto }}
            >
              INÍCIO
              {selectedCategory === 'Todas' && <span className="absolute bottom-0 left-0 w-full h-[2px] rounded-full" style={{ backgroundColor: corTexto }}></span>}
            </button>
            
            {categorias?.filter(c => c !== 'Sem Categoria').slice(0, 5).map(cat => {
              const isSelected = selectedCategory === cat;
              const hasSubcategories = false; 

              return (
                <div key={cat} className="relative group cursor-pointer">
                  <button 
                    onClick={() => changeCategory(cat)}
                    className={`relative flex items-center gap-1.5 text-[12px] font-semibold tracking-wide uppercase transition-all px-1 py-2 ${isSelected ? 'opacity-100' : 'opacity-70 hover:opacity-100'}`}
                    style={{ color: corTexto }}
                  >
                    {cat} 
                    {hasSubcategories && <ChevronDown size={14} className="opacity-40 group-hover:rotate-180 transition-transform" />}
                    {isSelected && <span className="absolute bottom-0 left-0 w-full h-[2px] rounded-full" style={{ backgroundColor: corTexto }}></span>}
                  </button>
                  
                  {hasSubcategories && (
                    <div className="absolute top-full left-1/2 -translate-x-1/2 pt-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 w-48 z-50">
                       <div className="bg-white border border-slate-100 shadow-xl rounded-xl p-3">
                          <div className="text-[11px] text-slate-400 font-medium text-center py-2">Subcategorias em breve</div>
                       </div>
                    </div>
                  )}
                </div>
              )
            })}
          </nav>

          {/* --- COLUNA 3: ÍCONES SOCIAIS E COMPARTILHAR (DESKTOP) --- */}
          <div className="hidden md:flex w-1/3 justify-end items-center gap-4" style={{ color: corTexto }}>
            {st?.link_instagram && (
              <a href={st.link_instagram} target="_blank" rel="noreferrer" className="hover:opacity-70 transition-opacity flex items-center justify-center hover:scale-110">
                <Instagram size={20} />
              </a>
            )}
            {st?.link_tiktok && (
              <a href={st.link_tiktok} target="_blank" rel="noreferrer" className="hover:opacity-70 transition-opacity flex items-center justify-center hover:scale-110">
                <TikTokIcon />
              </a>
            )}
            {st?.link_facebook && (
              <a href={st.link_facebook} target="_blank" rel="noreferrer" className="hover:opacity-70 transition-opacity flex items-center justify-center hover:scale-110">
                <Facebook size={20} />
              </a>
            )}
            <div className="w-[1px] h-5 mx-2" style={{ backgroundColor: corTexto, opacity: 0.2 }}></div>
            <button onClick={handleShare} className="w-9 h-9 rounded-full flex items-center justify-center hover:scale-105 transition-all shadow-sm" style={{ backgroundColor: corTexto, color: corFundo }}>
              {st?.icone_compartilhar ? <img src={st.icone_compartilhar} className="w-4 h-4 object-contain invert" style={{ filter: corTexto === '#ffffff' ? 'invert(0)' : 'invert(1)' }} /> : <Share2 size={16} />}
            </button>
          </div>

          {/* --- MENU HAMBÚRGUER (MOBILE APENAS) --- */}
          <div className="md:hidden flex w-1/2 justify-end items-center gap-4" style={{ color: corTexto }}>
            <button onClick={handleShare} className="hover:opacity-70 transition-opacity flex items-center justify-center hover:scale-105 active:scale-95 p-1">
              {st?.icone_compartilhar ? <img src={st.icone_compartilhar} className="w-5 h-5 object-contain" /> : <Share2 size={20} />}
            </button>
            <button onClick={() => setIsMobileMenuOpen(true)} className="active:scale-95 transition-transform">
              <Menu size={28} strokeWidth={2.5} />
            </button>
          </div>
        </div>
      </header>

      {/* ========================================= */}
      {/* 2. GAVETA LATERAL DO MOBILE (SLIDE MENU)  */}
      {/* ========================================= */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsMobileMenuOpen(false)} className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[200] md:hidden" />
            <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: "spring", bounce: 0, duration: 0.4 }} className="fixed top-0 right-0 h-full w-[85%] max-w-sm bg-white shadow-2xl z-[210] flex flex-col md:hidden">
               
               <div className="p-6 flex justify-between items-center border-b border-slate-100">
                  {st?.logo_url ? <img src={st.logo_url} className="h-8 object-contain" /> : <span className="font-bold text-lg text-slate-800">Menu</span>}
                  <button onClick={() => setIsMobileMenuOpen(false)} className="p-2 bg-slate-50 hover:bg-slate-100 rounded-full text-slate-500 transition-colors"><X size={20} /></button>
               </div>
               
               <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-2">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Categorias</span>
                  <button onClick={() => selectCat('Todas')} className={`px-5 py-3.5 text-left rounded-xl font-bold text-[13px] uppercase tracking-wide transition-colors flex items-center justify-between ${selectedCategory === 'Todas' ? 'bg-slate-50 text-slate-900' : 'bg-transparent text-slate-500 active:bg-slate-50'}`}>
                    INÍCIO {selectedCategory === 'Todas' && <div className="w-2 h-2 rounded-full" style={{ backgroundColor: corAcento }}/>}
                  </button>
                  {categorias?.filter(c => c !== 'Sem Categoria').map(cat => (
                    <button key={cat} onClick={() => selectCat(cat)} className={`px-5 py-3.5 text-left rounded-xl font-bold text-[13px] uppercase tracking-wide transition-colors flex items-center justify-between ${selectedCategory === cat ? 'bg-slate-50 text-slate-900' : 'bg-transparent text-slate-500 active:bg-slate-50'}`}>
                      {cat} {selectedCategory === cat && <div className="w-2 h-2 rounded-full" style={{ backgroundColor: corAcento }}/>}
                    </button>
                  ))}
               </div>
               
               <div className="p-6 border-t border-slate-100 bg-slate-50 flex gap-4 justify-center">
                 {st?.link_instagram && (
                    <a href={st.link_instagram} target="_blank" rel="noreferrer" className="w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center border border-slate-200 active:scale-95 transition-transform text-pink-600">
                       <Instagram size={18} />
                    </a>
                 )}
                 {st?.link_tiktok && (
                    <a href={st.link_tiktok} target="_blank" rel="noreferrer" className="w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center border border-slate-200 active:scale-95 transition-transform text-slate-900">
                       <TikTokIcon />
                    </a>
                 )}
                 {st?.link_facebook && (
                    <a href={st.link_facebook} target="_blank" rel="noreferrer" className="w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center border border-slate-200 active:scale-95 transition-transform text-blue-600">
                       <Facebook size={18} />
                    </a>
                 )}
                 {st?.link_email && (
                    <a href={`mailto:${st.link_email}`} className="w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center border border-slate-200 active:scale-95 transition-transform text-slate-600">
                       <Mail size={18} />
                    </a>
                 )}
               </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ========================================= */}
      {/* 3. BARRA DE PESQUISA MINIMALISTA          */}
      {/* ========================================= */}
      {view !== 'detalhe' && (
        <div className="w-full bg-white pt-4 pb-6 px-4 md:px-8">
           <div className="max-w-2xl mx-auto relative group">
              <input 
                id="search-bar"
                type="text" 
                placeholder="O que você está procurando hoje?" 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full h-10 bg-transparent border-b-[1.5px] border-slate-200 focus:border-slate-500 transition-colors outline-none px-2 pl-10 text-sm font-medium text-slate-700 placeholder:text-slate-300"
              />
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-slate-500 transition-colors" size={18} strokeWidth={2.5} />
           </div>
        </div>
      )}

      {/* ========================================= */}
      {/* 4. ÁREA DE BANNERS (DESKTOP E MOBILE)     */}
      {/* ========================================= */}
      {view === 'grid' && !searchTerm && (
        <div className="w-full mb-10 border-t border-slate-50">
           
           {/* BANNER DESKTOP */}
           {st?.banner_url && (
             <div className="hidden md:block w-full max-w-6xl mx-auto px-8 mt-10">
                <div className="w-full rounded-3xl overflow-hidden relative group shadow-[0_10px_40px_-15px_rgba(0,0,0,0.1)]">
                   <img src={st.banner_url} alt="Banner Principal" className="w-full h-auto object-cover object-center group-hover:scale-[1.01] transition-transform duration-700" />
                </div>
             </div>
           )}
           
           {/* BANNER MOBILE */}
           {(st?.banner_mobile_url || st?.banner_url) && (
             <div className="block md:hidden w-full px-4 mt-6">
                <div className="w-full rounded-2xl overflow-hidden shadow-md relative">
                   <img src={st.banner_mobile_url || st.banner_url} alt="Banner Mobile" className="w-full h-auto object-cover object-center" />
                </div>
             </div>
           )}
        </div>
      )}
    </>
  );
};