import React, { useState } from 'react';
import { Search, Menu, X, Share2, ChevronDown, Instagram, MessageCircle } from "lucide-react";
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

  return (
    <>
      {/* ========================================= */}
      {/* 1. BARRA DE NAVEGAÇÃO SUPERIOR (NAVBAR)   */}
      {/* ========================================= */}
      <header className="w-full bg-white border-b border-slate-100 sticky top-0 z-50 shadow-sm">
        <div className="h-1.5 w-full" style={{ backgroundColor: st?.cor_principal || '#f472b6' }} />
        
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-3 md:py-5 flex items-center justify-between">
          
          {/* --- COLUNA 1: LOGO --- */}
          <div className="w-1/2 md:w-1/4 flex justify-start items-center cursor-pointer" onClick={goHome}>
            {st?.logo_url ? (
              <img src={st.logo_url} className="h-10 md:h-14 object-contain transition-transform hover:scale-105" alt="Logo" />
            ) : (
              <h2 className="text-xl md:text-2xl font-black tracking-tighter hover:opacity-80 transition-opacity" style={{ color: st?.cor_principal || '#f472b6' }}>
                {st?.nome_loja || 'MINHA LOJA'}
              </h2>
            )}
          </div>

          {/* --- COLUNA 2: MENU CATEGORIAS (DESKTOP APENAS) --- */}
          <nav className="hidden md:flex w-2/4 justify-center items-center gap-8">
            <button onClick={() => changeCategory('Todas')} className={`text-[13px] font-bold transition-colors border-b-2 pb-1 ${selectedCategory === 'Todas' ? 'text-slate-900 border-slate-900' : 'text-slate-500 hover:text-slate-800 border-transparent'}`}>
              Início
            </button>
            
            {/* Exibe até 4 categorias. Mostra como "Dropdown" para futuras subcategorias */}
            {categorias?.filter(c => c !== 'Sem Categoria').slice(0, 4).map(cat => (
              <div key={cat} className="relative group cursor-pointer">
                <button 
                  onClick={() => changeCategory(cat)}
                  className={`flex items-center gap-1 text-[13px] font-bold transition-colors pb-1 border-b-2 ${selectedCategory === cat ? 'text-slate-900 border-slate-900' : 'text-slate-500 hover:text-slate-800 border-transparent'}`}
                >
                  {cat} <ChevronDown size={14} className="opacity-50 group-hover:rotate-180 transition-transform duration-300" />
                </button>
                
                {/* CAIXA DE SUBCATEGORIA (Visual Pronto para o futuro) */}
                <div className="absolute top-full left-1/2 -translate-x-1/2 pt-4 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 w-48 z-50">
                   <div className="bg-white border border-slate-100 shadow-xl rounded-xl p-3 flex flex-col gap-1 relative before:absolute before:-top-1.5 before:left-1/2 before:-translate-x-1/2 before:w-3 before:h-3 before:bg-white before:rotate-45 before:border-l before:border-t before:border-slate-100">
                      <div className="text-[11px] text-slate-400 font-medium text-center relative z-10 py-2">Subcategorias em breve</div>
                   </div>
                </div>
              </div>
            ))}
          </nav>

          {/* --- COLUNA 3: ÍCONES SOCIAIS E COMPARTILHAR (DESKTOP) --- */}
          <div className="hidden md:flex w-1/4 justify-end items-center gap-3">
            {st?.link_social_1 && (
              <a href={st.link_social_1} target="_blank" rel="noreferrer" className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center hover:scale-105 hover:bg-slate-100 transition-all border border-slate-100">
                {st?.icone_social_1 ? <img src={st.icone_social_1} className="w-4 h-4 object-contain" /> : <Instagram size={18} className="text-slate-600"/>}
              </a>
            )}
            {st?.link_social_2 && (
              <a href={st.link_social_2} target="_blank" rel="noreferrer" className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center hover:scale-105 hover:bg-slate-100 transition-all border border-slate-100">
                {st?.icone_social_2 ? <img src={st.icone_social_2} className="w-4 h-4 object-contain" /> : <MessageCircle size={18} className="text-slate-600"/>}
              </a>
            )}
            <div className="w-[1px] h-6 bg-slate-200 mx-1"></div>
            <button onClick={handleShare} className="w-10 h-10 rounded-full bg-slate-900 text-white flex items-center justify-center hover:scale-105 hover:bg-slate-800 transition-all shadow-md">
              {st?.icone_compartilhar ? <img src={st.icone_compartilhar} className="w-4 h-4 object-contain invert" /> : <Share2 size={16} />}
            </button>
          </div>

          {/* --- MENU HAMBÚRGUER (MOBILE APENAS) --- */}
          <div className="md:hidden flex w-1/2 justify-end items-center gap-3">
            <button onClick={handleShare} className="w-9 h-9 rounded-full bg-slate-50 flex items-center justify-center border border-slate-100 text-slate-600 active:scale-95 transition-transform">
              {st?.icone_compartilhar ? <img src={st.icone_compartilhar} className="w-4 h-4 object-contain" /> : <Share2 size={16} />}
            </button>
            <button onClick={() => setIsMobileMenuOpen(true)} className="p-2 text-slate-800 active:scale-95 transition-transform">
              <Menu size={28} />
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
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsMobileMenuOpen(false)} className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[200] md:hidden" />
            <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: "spring", bounce: 0, duration: 0.4 }} className="fixed top-0 right-0 h-full w-[85%] max-w-sm bg-white shadow-2xl z-[210] flex flex-col md:hidden">
               
               <div className="p-6 flex justify-between items-center border-b border-slate-100">
                  <span className="font-black text-xl text-slate-800 tracking-tight">Menu</span>
                  <button onClick={() => setIsMobileMenuOpen(false)} className="p-2 bg-slate-50 hover:bg-slate-100 rounded-full text-slate-500 transition-colors"><X size={20} /></button>
               </div>
               
               <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-3">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Categorias</span>
                  <button onClick={() => selectCat('Todas')} className={`px-5 py-4 text-left rounded-2xl font-bold text-sm transition-colors flex items-center justify-between ${selectedCategory === 'Todas' ? 'bg-slate-900 text-white shadow-md' : 'bg-slate-50 text-slate-700 active:bg-slate-100'}`}>
                    Todas as Categorias {selectedCategory === 'Todas' && <div className="w-2 h-2 rounded-full bg-emerald-400"/>}
                  </button>
                  {categorias?.filter(c => c !== 'Sem Categoria').map(cat => (
                    <button key={cat} onClick={() => selectCat(cat)} className={`px-5 py-4 text-left rounded-2xl font-bold text-sm transition-colors flex items-center justify-between ${selectedCategory === cat ? 'bg-slate-900 text-white shadow-md' : 'bg-slate-50 text-slate-700 active:bg-slate-100'}`}>
                      {cat} {selectedCategory === cat && <div className="w-2 h-2 rounded-full bg-emerald-400"/>}
                    </button>
                  ))}
               </div>
               
               <div className="p-6 border-t border-slate-100 bg-slate-50 flex gap-4 justify-center">
                 {st?.link_social_1 && (
                    <a href={st.link_social_1} target="_blank" rel="noreferrer" className="w-12 h-12 rounded-full bg-white shadow-sm flex items-center justify-center border border-slate-200 active:scale-95 transition-transform">
                       {st?.icone_social_1 ? <img src={st.icone_social_1} className="w-5 h-5 object-contain" /> : <Instagram size={20} className="text-slate-600"/>}
                    </a>
                 )}
                 {st?.link_social_2 && (
                    <a href={st.link_social_2} target="_blank" rel="noreferrer" className="w-12 h-12 rounded-full bg-white shadow-sm flex items-center justify-center border border-slate-200 active:scale-95 transition-transform">
                       {st?.icone_social_2 ? <img src={st.icone_social_2} className="w-5 h-5 object-contain" /> : <MessageCircle size={20} className="text-slate-600"/>}
                    </a>
                 )}
               </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ========================================= */}
      {/* 3. BARRA DE PESQUISA ELEGANTE             */}
      {/* ========================================= */}
      {view !== 'detalhe' && (
        <div className="w-full bg-white pt-6 pb-2 px-4 md:px-8">
           <div className="max-w-3xl mx-auto relative group">
              <input 
                id="search-bar"
                type="text" 
                placeholder="O que você está procurando hoje?" 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full h-14 bg-transparent border-b-[2px] border-slate-200 focus:border-slate-900 transition-colors outline-none px-2 pl-12 text-lg md:text-xl font-medium text-slate-800 placeholder:text-slate-300"
              />
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-slate-800 transition-colors" size={24} />
           </div>
        </div>
      )}

      {/* ========================================= */}
      {/* 4. ÁREA DE BANNERS (DESKTOP E MOBILE)     */}
      {/* ========================================= */}
      {view === 'grid' && !searchTerm && (
        <div className="w-full mb-10">
           {/* BANNER DESKTOP (Largura completa do container, elegante) */}
           {st?.banner_url && (
             <div className="hidden md:block w-full max-w-7xl mx-auto px-8 mt-10">
                <div className="w-full rounded-[2rem] overflow-hidden shadow-lg relative group">
                   <img src={st.banner_url} alt="Banner Principal" className="w-full h-auto max-h-[350px] object-cover object-center group-hover:scale-[1.01] transition-transform duration-700" />
                </div>
             </div>
           )}
           
           {/* BANNER MOBILE (Não pega a tela toda, bordas arredondadas) */}
           {(st?.banner_mobile_url || st?.banner_url) && (
             <div className="block md:hidden w-full px-4 mt-6">
                <div className="w-full rounded-2xl overflow-hidden shadow-md relative">
                   <img src={st.banner_mobile_url || st.banner_url} alt="Banner Mobile" className="w-full h-auto max-h-[250px] object-cover object-center" />
                </div>
             </div>
           )}
        </div>
      )}
    </>
  );
};