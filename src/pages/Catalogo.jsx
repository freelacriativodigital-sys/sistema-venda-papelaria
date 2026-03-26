import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { 
  ShoppingBag, Search, ChevronLeft, MessageCircle, 
  Plus, Minus, Instagram, Mail, ArrowRight, 
  Loader2, Sparkles, Layers, Tag, Box, Package,
  Truck, ShieldCheck, CreditCard, Star,
  Save, Palette, Globe, Type, Image as ImageIcon, 
  Upload, Check, Trash2, Copy, Link as LinkIcon, MapPin, Tags, X, Eye, FileText, ChevronDown, ChevronUp
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "../lib/supabase";

// --- CARROSSEL DE BANNERS ---
const BannerCarousel = ({ banners }) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (!banners || banners.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % banners.length);
    }, 5000); 
    return () => clearInterval(interval);
  }, [banners]);

  const goToPrevious = (e) => {
     e.stopPropagation(); 
     setCurrentIndex((prev) => (prev === 0 ? banners.length - 1 : prev - 1));
  };
  const goToNext = (e) => {
     e.stopPropagation();
     setCurrentIndex((prev) => (prev + 1) % banners.length);
  };

  if (!banners || banners.length === 0) return null;

  return (
     <div className="relative h-[160px] sm:h-[220px] md:h-[350px] rounded-2xl md:rounded-[2rem] overflow-hidden bg-slate-900 shadow-sm border border-slate-200 group">
        <div className="flex w-full h-full transition-transform duration-700 ease-out" style={{ transform: `translateX(-${currentIndex * 100}%)` }}>
           {banners.map((b, i) => (
              <div key={b.id || i} className="w-full h-full shrink-0 relative cursor-pointer" onClick={() => b.link && window.open(b.link, '_blank')}>
                 <img src={b.imagem} className="w-full h-full object-cover" alt="Banner" />
              </div>
           ))}
        </div>
        {banners.length > 1 && (
          <>
            <button onClick={goToPrevious} className="absolute left-3 md:left-6 top-1/2 -translate-y-1/2 w-8 h-8 md:w-10 md:h-10 flex items-center justify-center rounded-full bg-white/80 text-slate-800 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white shadow-md z-10">
              <ChevronLeft size={20}/>
            </button>
            <button onClick={goToNext} className="absolute right-3 md:right-6 top-1/2 -translate-y-1/2 w-8 h-8 md:w-10 md:h-10 flex items-center justify-center rounded-full bg-white/80 text-slate-800 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white shadow-md z-10">
              <ChevronLeft size={20} className="rotate-180"/>
            </button>
            <div className="absolute bottom-3 md:bottom-5 left-1/2 -translate-x-1/2 flex gap-1.5 md:gap-2 z-10">
               {banners.map((_, i) => (
                  <button key={i} onClick={(e) => { e.stopPropagation(); setCurrentIndex(i); }} className={`h-1.5 md:h-2 rounded-full transition-all ${i === currentIndex ? 'bg-white w-4 md:w-6 shadow-sm' : 'bg-white/50 w-1.5 md:w-2 hover:bg-white/80'}`} />
               ))}
            </div>
          </>
        )}
     </div>
  )
};

// --- HEADER ESTILO E-COMMERCE PREMIUM (Ajustado) ---
const HeaderSite = ({ st, searchTerm, setSearchTerm, selectedCategory, changeCategory, categorias, isPublic, goHome, view }) => {
  // Ajuste do tamanho da logo focado apenas na altura para respeitar logos retangulares
  const logoSizes = {
    pequena: "h-8 md:h-10",
    media: "h-12 md:h-16",
    grande: "h-16 md:h-24"
  };
  const currentLogoHeight = logoSizes[st?.tamanho_logo] || logoSizes.media;

  return (
    // Removido o md:sticky e ajustado o z-index
    <div className="w-full relative z-30 shadow-sm border-b border-slate-100 transition-colors duration-300" style={{ backgroundColor: st?.cor_topo || '#ffffff' }}>
      {!isPublic && (
        <div className="bg-amber-500 text-white text-[10px] font-black text-center py-1 uppercase tracking-widest">
          Painel Administrativo • Modo de Visualização (Live Preview)
        </div>
      )}
      
      <div className="h-1.5 w-full transition-colors duration-300" style={{ backgroundColor: st?.cor_principal || '#f472b6' }} />
      
      {/* Container com paddings menores e organização mais equilibrada */}
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-3 md:py-4 flex flex-col md:flex-row items-center justify-between gap-3 md:gap-8">
        
        {/* Logo mais livre, sendo o destaque */}
        <div 
          onClick={goHome}
          className="flex items-center shrink-0 cursor-pointer group justify-center md:justify-start"
        >
          {st?.logo_url ? (
             <img src={st.logo_url} className={`object-contain transition-transform group-hover:scale-105 ${currentLogoHeight}`} alt="Logo" />
          ) : (
             <ShoppingBag size={36} style={{ color: st?.cor_principal }} className="transition-transform group-hover:scale-105" />
          )}
        </div>

        {/* Barra de pesquisa menor e mais discreta */}
        <div className="w-full md:w-96 lg:w-[450px] relative group shrink-0">
          <input 
            type="text" 
            placeholder="O que você procura hoje?" 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full h-10 md:h-11 bg-slate-50/50 hover:bg-slate-50 rounded-full px-5 pl-12 border border-slate-200 focus:bg-white focus:border-slate-300 focus:ring-4 focus:ring-slate-100/50 transition-all outline-none font-medium text-sm text-slate-700 placeholder:text-slate-400 shadow-sm focus:shadow-md"
          />
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-slate-500 transition-colors" size={18} />
        </div>
      </div>

      {/* MENU DE CATEGORIAS */}
      {view !== 'detalhe' && (
        <div className="border-t border-slate-100 bg-slate-50/50">
          <div className="max-w-7xl mx-auto px-4 md:px-8 py-3 md:py-4 flex items-center gap-2.5 overflow-x-auto no-scrollbar">
            <button 
              onClick={() => changeCategory('Todas')}
              className={`text-[11px] md:text-xs font-bold whitespace-nowrap transition-all px-4 md:px-5 py-2 md:py-2.5 rounded-full border flex items-center gap-2 ${selectedCategory === 'Todas' ? 'shadow-sm text-white' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-slate-300'}`}
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
                  className={`text-[11px] md:text-xs font-bold whitespace-nowrap transition-all px-4 md:px-5 py-2 md:py-2.5 rounded-full border ${isSelected ? 'shadow-sm text-white' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-slate-300'}`}
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
};

// --- FAIXA DE BENEFÍCIOS ---
const BenefitsBar = ({ st }) => {
  if (!st?.mostrar_beneficios) return null;
  return (
    <div className="bg-white border-b border-slate-100 hidden md:block transition-all duration-300">
      <div className="max-w-7xl mx-auto px-8 py-4 flex items-center justify-between gap-4">
        {[1, 2, 3].map(num => (
           <div key={num} className="flex items-center gap-3 text-slate-600">
              <div className="bg-slate-50 p-2 rounded-full border border-slate-100">
                {st[`beneficio_${num}_icone`] ? (
                   <img src={st[`beneficio_${num}_icone`]} className="w-5 h-5 object-contain" alt="" />
                ) : (
                   num === 1 ? <Truck size={18} className="text-rose-500" /> : 
                   num === 2 ? <CreditCard size={18} className="text-blue-500" /> : 
                   <ShieldCheck size={18} className="text-emerald-500" />
                )}
              </div>
              <div>
                <p className="text-[11px] font-bold text-slate-800 leading-none mb-1">{st[`beneficio_${num}_titulo`]}</p>
                <p className="text-[9px] font-medium text-slate-500">{st[`beneficio_${num}_desc`]}</p>
              </div>
           </div>
        ))}
      </div>
    </div>
  );
};

// --- RODAPÉ ---
const FooterSite = ({ st }) => (
  <footer className="bg-slate-950 text-slate-400 pt-12 pb-32 md:pb-8 border-t-[6px] mt-16 transition-colors duration-300" style={{ borderColor: st?.cor_principal || '#f472b6' }}>
    <div className="max-w-7xl mx-auto px-4 md:px-8">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-10 mb-12">
        <div className="space-y-3 text-center md:text-left">
          <h2 className="text-xl font-black uppercase tracking-tighter text-white italic transition-colors duration-300" style={{ color: st?.cor_principal }}>{st?.nome_loja}</h2>
          <p className="text-[11px] font-medium leading-relaxed max-w-sm mx-auto md:mx-0 text-slate-500">
            {st?.texto_sobre}
          </p>
        </div>
        
        <div className="space-y-4 text-center md:text-left flex flex-col items-center md:items-start">
          <h3 className="text-white font-bold uppercase tracking-widest text-[10px]">Canais de Atendimento</h3>
          <div className="flex flex-col gap-3">
            {st?.whatsapp && (
              <button onClick={() => window.open(`https://wa.me/${st.whatsapp.replace(/\D/g, '')}`, '_blank')} className="flex items-center gap-2 hover:text-white transition-colors text-[11px] font-bold uppercase tracking-wide">
                <MessageCircle size={16} className="text-[#25D366]" fill="currentColor" /> WhatsApp Oficial
              </button>
            )}
            {st?.instagram && (
              <button onClick={() => window.open(st.instagram.includes('http') ? st.instagram : `https://instagram.com/${st.instagram}`, '_blank')} className="flex items-center gap-2 hover:text-white transition-colors text-[11px] font-bold uppercase tracking-wide">
                <Instagram size={16} className="text-pink-500" /> Instagram
              </button>
            )}
            {st?.email && (
              <button onClick={() => window.open(`mailto:${st.email}`, '_blank')} className="flex items-center gap-2 hover:text-white transition-colors text-[11px] font-bold uppercase tracking-wide">
                <Mail size={16} className="text-blue-400" /> E-mail
              </button>
            )}
            {st?.endereco && (
              <p className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wide text-slate-500 mt-2">
                <MapPin size={16} /> {st.endereco}
              </p>
            )}
          </div>
        </div>

        <div className="space-y-3 text-center md:text-left">
          <h3 className="text-white font-bold uppercase tracking-widest text-[10px] mb-1">Compra 100% Segura</h3>
          <p className="text-[11px] font-medium leading-relaxed text-slate-500">
            Seu pedido é fechado diretamente via WhatsApp com nosso time. Atendimento humano, rápido e sem complicações.
          </p>
        </div>
      </div>
      
      <div className="pt-6 border-t border-white/10 flex flex-col md:flex-row justify-between items-center gap-4">
        <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-slate-600 text-center md:text-left">{st?.copyright}</p>
      </div>
    </div>
  </footer>
);

// --- COMPONENTE DE UPLOAD ALTAMENTE COMPRIMIDO ---
const FileUploadField = ({ campo, value, onChange, st }) => {
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsUploading(true);

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;
      
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 1200; 
        const MAX_HEIGHT = 1200;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        
        const compressedBase64 = canvas.toDataURL('image/webp', 0.7);
        
        onChange(compressedBase64);
        setIsUploading(false);
      };

      img.onerror = () => {
         if(file.size > 2 * 1024 * 1024) {
            alert("Para arquivos não-imagem (como PDF), o limite é de 2MB.");
            setIsUploading(false);
            return;
         }
         onChange(event.target.result);
         setIsUploading(false);
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="w-full">
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleFileChange} 
        className="hidden" 
        accept="image/*,application/pdf" 
      />
      
      {value ? (
        <div className="flex items-center justify-between p-3 rounded-md bg-emerald-50 border border-emerald-200">
           <div className="flex items-center gap-2 text-emerald-700">
             <Check size={16} />
             <span className="text-[10px] font-bold uppercase tracking-widest">Arquivo Anexado</span>
           </div>
           <button 
             onClick={() => onChange('')} 
             className="text-[10px] font-bold text-rose-500 uppercase hover:underline"
           >
             Remover
           </button>
        </div>
      ) : (
        <Button 
          onClick={() => fileInputRef.current.click()} 
          disabled={isUploading}
          variant="outline"
          className="w-full h-11 border-dashed border-2 border-slate-300 text-slate-600 hover:bg-slate-50 font-bold uppercase text-[10px] tracking-widest flex items-center gap-2"
        >
          {isUploading ? (
            <><Loader2 size={16} className="animate-spin text-blue-500" /> Processando...</>
          ) : (
            <><Upload size={16} /> Selecionar Arquivo</>
          )}
        </Button>
      )}
    </div>
  );
};

// --- PAINEL LATERAL DE CONFIGURAÇÕES (MODO ADMIN) ---
const ConfigSidebar = ({ st, setSt, handleSave, saved, handleImageUpload, copyVitrineLink, setIsSidebarOpen, categorias }) => {
  if (!st) return null;

  const moveCategory = (index, direction) => {
    const reorderable = categorias.filter(c => c !== 'Sem Categoria');
    let currentOrder = [...reorderable];
    
    if (direction === 'up' && index > 0) {
      [currentOrder[index - 1], currentOrder[index]] = [currentOrder[index], currentOrder[index - 1]];
    } else if (direction === 'down' && index < currentOrder.length - 1) {
      [currentOrder[index + 1], currentOrder[index]] = [currentOrder[index], currentOrder[index + 1]];
    }
    
    setSt({...st, ordem_categorias: currentOrder});
  };

  const handleAddBanner = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;
      
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 1200; 
        const MAX_HEIGHT = 1200;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        
        const compressedBase64 = canvas.toDataURL('image/webp', 0.7);
        
        const currentBanners = Array.isArray(st.banners) ? st.banners : [];
        setSt({ 
          ...st, 
          banners: [...currentBanners, { id: Date.now().toString(), imagem: compressedBase64, link: '' }] 
        });
      };
    };
    reader.readAsDataURL(file);
    e.target.value = ''; 
  };

  return (
    <div className="space-y-6 pb-40 p-4 md:p-6 animate-in fade-in duration-700 w-full">
      <div className="flex flex-col gap-4 bg-white p-5 rounded-lg border border-slate-100 shadow-sm sticky top-0 z-40">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-xl font-bold text-slate-800 uppercase tracking-tight leading-none">Edição Visual</h1>
            <p className="text-[10px] font-medium text-slate-500 uppercase tracking-widest mt-1.5">Veja as mudanças ao vivo</p>
          </div>
          <button 
            onClick={() => setIsSidebarOpen(false)} 
            className="text-slate-400 hover:text-slate-700 bg-slate-50 hover:bg-slate-100 p-1.5 rounded-md transition-all shrink-0 border border-slate-200" 
            title="Ocultar Painel"
          >
            <X size={16} />
          </button>
        </div>

        <div className="flex items-center justify-between bg-blue-50 border border-blue-100 rounded-lg p-3 my-1">
           <div className="flex items-center gap-2">
             <div className="bg-blue-100 p-1.5 rounded-md text-blue-600"><Eye size={16}/></div>
             <span className="text-[10px] font-bold uppercase text-blue-800 tracking-widest">Acessos à Loja</span>
           </div>
           <span className="text-lg font-black text-blue-700">{st.acessos_catalogo || 0}</span>
        </div>

        <div className="flex flex-col gap-2">
          <Button onClick={copyVitrineLink} variant="outline" className="w-full h-10 font-semibold uppercase text-[10px] gap-2 border">
            <Copy size={14} /> Link da Loja
          </Button>
          <Button onClick={handleSave} className="w-full bg-blue-600 hover:bg-blue-700 text-white h-10 font-semibold uppercase text-[10px] gap-2 shadow-sm transition-all">
            {saved ? <Check size={14} className="text-emerald-300" /> : <Save size={14} />}
            {saved ? "Salvo com sucesso!" : "Salvar Alterações"}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        <div className="bg-white p-5 rounded-lg border border-slate-100 shadow-sm space-y-5">
          <h3 className="text-xs font-semibold uppercase text-slate-700 tracking-widest flex items-center gap-2 border-b border-slate-100 pb-3">
            <Palette size={16} className="text-blue-500" /> Identidade Visual
          </h3>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest">Nome da Loja</label>
              <Input value={st.nome_loja || ''} onChange={(e) => setSt({...st, nome_loja: e.target.value})} className="h-9 text-xs" />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] font-semibold uppercase text-slate-500 tracking-widest block">Logo</label>
                <div className="relative group w-16 h-16">
                  <div className="w-full h-full rounded-full border-2 border-dashed border-slate-300 bg-slate-50 flex items-center justify-center overflow-hidden transition-all group-hover:border-blue-400">
                    {st.logo_url ? <img src={st.logo_url} className="w-full h-full object-contain p-1" /> : <ImageIcon size={20} className="text-slate-300" />}
                  </div>
                  <input type="file" accept="image/*" onChange={(e) => handleImageUpload(e, 'logo_url')} className="absolute inset-0 opacity-0 cursor-pointer z-10" />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-semibold uppercase text-slate-500 tracking-widest block">Tamanho da Logo</label>
                <select 
                  value={st.tamanho_logo || 'media'} 
                  onChange={(e) => setSt({...st, tamanho_logo: e.target.value})}
                  className="w-full h-9 border border-slate-200 rounded-md text-xs font-medium bg-slate-50 text-slate-700 px-2 outline-none focus:border-blue-500"
                >
                  <option value="pequena">Pequena</option>
                  <option value="media">Média</option>
                  <option value="grande">Grande</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-2 border-t border-slate-100">
              <div className="space-y-1.5">
                <label className="text-[10px] font-semibold uppercase text-slate-500 tracking-widest block">Cor Principal</label>
                <div className="flex gap-2 items-center">
                  <div className="relative w-9 h-9 rounded-md overflow-hidden shadow-sm border border-slate-200 shrink-0">
                    <Input type="color" value={st.cor_principal || '#000000'} onChange={(e) => setSt({...st, cor_principal: e.target.value})} className="absolute -inset-2 w-14 h-14 cursor-pointer appearance-none border-none p-0 bg-transparent" />
                  </div>
                  <Input value={st.cor_principal || ''} onChange={(e) => setSt({...st, cor_principal: e.target.value})} className="h-9 font-mono text-[10px] uppercase w-full" />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-semibold uppercase text-slate-500 tracking-widest block">Cor do Topo</label>
                <div className="flex gap-2 items-center">
                  <div className="relative w-9 h-9 rounded-md overflow-hidden shadow-sm border border-slate-200 shrink-0">
                    <Input type="color" value={st.cor_topo || '#ffffff'} onChange={(e) => setSt({...st, cor_topo: e.target.value})} className="absolute -inset-2 w-14 h-14 cursor-pointer appearance-none border-none p-0 bg-transparent" />
                  </div>
                  <Input value={st.cor_topo || '#ffffff'} onChange={(e) => setSt({...st, cor_topo: e.target.value})} className="h-9 font-mono text-[10px] uppercase w-full" />
                </div>
              </div>
            </div>

          </div>
        </div>

        <div className="bg-white p-5 rounded-lg border border-slate-100 shadow-sm space-y-5">
          <h3 className="text-xs font-semibold uppercase text-slate-700 tracking-widest flex items-center gap-2 border-b border-slate-100 pb-3">
            <Layers size={16} className="text-orange-500" /> Ordem do Menu
          </h3>
          <div className="space-y-2">
            <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest mb-3">Defina a ordem das categorias na vitrine</p>
            <div className="flex flex-col gap-2">
              {categorias.filter(c => c !== 'Sem Categoria').map((cat, index) => (
                <div key={cat} className="flex items-center justify-between p-2.5 bg-slate-50 border border-slate-200 rounded-md">
                  <span className="text-[10px] font-bold text-slate-700 uppercase">{cat}</span>
                  <div className="flex gap-1.5">
                    <button 
                      onClick={() => moveCategory(index, 'up')}
                      disabled={index === 0}
                      className="p-1 text-slate-400 hover:text-slate-800 disabled:opacity-30 disabled:hover:text-slate-400 transition-colors bg-white border border-slate-200 rounded shadow-sm"
                    >
                      <ChevronUp size={14} />
                    </button>
                    <button 
                      onClick={() => moveCategory(index, 'down')}
                      disabled={index === categorias.filter(c => c !== 'Sem Categoria').length - 1}
                      className="p-1 text-slate-400 hover:text-slate-800 disabled:opacity-30 disabled:hover:text-slate-400 transition-colors bg-white border border-slate-200 rounded shadow-sm"
                    >
                      <ChevronDown size={14} />
                    </button>
                  </div>
                </div>
              ))}
              {categorias.length <= 1 && (
                <p className="text-[10px] text-slate-400 font-medium italic">Você precisa ter produtos em pelo menos 2 categorias diferentes para organizá-las.</p>
              )}
            </div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-lg border border-slate-100 shadow-sm space-y-5">
          <h3 className="text-xs font-semibold uppercase text-slate-700 tracking-widest flex items-center gap-2 border-b border-slate-100 pb-3">
            <Tags size={16} className="text-pink-500" /> Cores das Etiquetas
          </h3>
          <div className="grid grid-cols-1 gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-semibold uppercase text-slate-500">Etiqueta: Destaque</label>
              <div className="flex gap-2 items-center">
                <div className="relative w-9 h-9 rounded-md overflow-hidden shadow-sm border border-slate-200 shrink-0">
                  <Input type="color" value={st.cor_etiqueta_destaque || '#fbbf24'} onChange={(e) => setSt({...st, cor_etiqueta_destaque: e.target.value})} className="absolute -inset-2 w-14 h-14 cursor-pointer appearance-none border-none p-0 bg-transparent" />
                </div>
                <Input value={st.cor_etiqueta_destaque || ''} onChange={(e) => setSt({...st, cor_etiqueta_destaque: e.target.value})} className="h-9 font-mono text-[10px] uppercase" />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-semibold uppercase text-slate-500">Etiqueta: Promoção</label>
              <div className="flex gap-2 items-center">
                <div className="relative w-9 h-9 rounded-md overflow-hidden shadow-sm border border-slate-200 shrink-0">
                  <Input type="color" value={st.cor_etiqueta_promo || '#f43f5e'} onChange={(e) => setSt({...st, cor_etiqueta_promo: e.target.value})} className="absolute -inset-2 w-14 h-14 cursor-pointer appearance-none border-none p-0 bg-transparent" />
                </div>
                <Input value={st.cor_etiqueta_promo || ''} onChange={(e) => setSt({...st, cor_etiqueta_promo: e.target.value})} className="h-9 font-mono text-[10px] uppercase" />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-semibold uppercase text-slate-500">Etiqueta: Atacado</label>
              <div className="flex gap-2 items-center">
                <div className="relative w-9 h-9 rounded-md overflow-hidden shadow-sm border border-slate-200 shrink-0">
                  <Input type="color" value={st.cor_etiqueta_atacado || '#fb923c'} onChange={(e) => setSt({...st, cor_etiqueta_atacado: e.target.value})} className="absolute -inset-2 w-14 h-14 cursor-pointer appearance-none border-none p-0 bg-transparent" />
                </div>
                <Input value={st.cor_etiqueta_atacado || ''} onChange={(e) => setSt({...st, cor_etiqueta_atacado: e.target.value})} className="h-9 font-mono text-[10px] uppercase" />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-semibold uppercase text-slate-500">Etiqueta: Variações</label>
              <div className="flex gap-2 items-center">
                <div className="relative w-9 h-9 rounded-md overflow-hidden shadow-sm border border-slate-200 shrink-0">
                  <Input type="color" value={st.cor_etiqueta_variacao || '#60a5fa'} onChange={(e) => setSt({...st, cor_etiqueta_variacao: e.target.value})} className="absolute -inset-2 w-14 h-14 cursor-pointer appearance-none border-none p-0 bg-transparent" />
                </div>
                <Input value={st.cor_etiqueta_variacao || ''} onChange={(e) => setSt({...st, cor_etiqueta_variacao: e.target.value})} className="h-9 font-mono text-[10px] uppercase" />
              </div>
            </div>
            <div className="space-y-1.5 pt-2 border-t border-slate-100">
              <label className="text-[10px] font-semibold uppercase text-slate-500">Caixa: Desconto Ativo</label>
              <div className="flex gap-2 items-center">
                <div className="relative w-9 h-9 rounded-md overflow-hidden shadow-sm border border-slate-200 shrink-0">
                  <Input type="color" value={st.cor_desconto_ativo || '#fbbf24'} onChange={(e) => setSt({...st, cor_desconto_ativo: e.target.value})} className="absolute -inset-2 w-14 h-14 cursor-pointer appearance-none border-none p-0 bg-transparent" />
                </div>
                <Input value={st.cor_desconto_ativo || ''} onChange={(e) => setSt({...st, cor_desconto_ativo: e.target.value})} className="h-9 font-mono text-[10px] uppercase" />
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-lg border border-slate-100 shadow-sm space-y-5">
          <h3 className="text-xs font-semibold uppercase text-slate-700 tracking-widest flex items-center gap-2 border-b border-slate-100 pb-3">
            <ImageIcon size={16} className="text-purple-500" /> Banners (Carrossel)
          </h3>
          <div className="space-y-4">
            
            <p className="text-[10px] text-slate-600 font-medium bg-blue-50 p-3 rounded-md border border-blue-100 flex items-start gap-2">
              <span className="text-blue-500 shrink-0 text-sm">💡</span>
              <span>Para um visual perfeito e sem cortes na loja, recomendamos que suas imagens tenham o tamanho de <strong className="text-blue-700">1200 x 400 pixels</strong>.</span>
            </p>

            {(st.banners || []).map((banner, index) => (
              <div key={banner.id || index} className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-3 relative group/banner">
                 <button onClick={() => {
                    const newBanners = [...st.banners];
                    newBanners.splice(index, 1);
                    setSt({...st, banners: newBanners});
                 }} className="absolute top-2 right-2 p-1.5 bg-white text-rose-500 border border-slate-200 rounded-md hover:bg-rose-50 hover:border-rose-200 transition-all shadow-sm z-10">
                    <Trash2 size={14} />
                 </button>
                 <div className="aspect-[21/9] rounded-md overflow-hidden bg-slate-200 border border-slate-300 relative w-full flex items-center justify-center">
                    <img src={banner.imagem} className="w-full h-full object-cover" />
                 </div>
                 <div className="space-y-1.5">
                    <label className="text-[10px] font-semibold uppercase text-slate-500 tracking-widest flex items-center gap-1.5"><LinkIcon size={12}/> Link do Banner</label>
                    <Input value={banner.link || ''} onChange={(e) => {
                       const newBanners = [...st.banners];
                       newBanners[index].link = e.target.value;
                       setSt({...st, banners: newBanners});
                    }} placeholder="Ex: https://wa.me/5511999999999" className="h-9 text-xs bg-white" />
                 </div>
              </div>
            ))}
            <div className="relative">
               <input type="file" accept="image/*" onChange={handleAddBanner} className="absolute inset-0 opacity-0 cursor-pointer z-10" />
               <Button variant="outline" className="w-full h-10 rounded-md border-dashed border-2 border-slate-300 font-semibold uppercase text-[10px] gap-2 hover:bg-slate-50 text-slate-600">
                 <Plus size={16}/> Adicionar Novo Banner
               </Button>
            </div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-lg border border-slate-100 shadow-sm space-y-5">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-xs font-semibold uppercase text-slate-700 tracking-widest flex items-center gap-2">
              <Check size={16} className="text-emerald-500" /> Barra de Benefícios
            </h3>
            <button onClick={() => setSt({...st, mostrar_beneficios: !st.mostrar_beneficios})} className={`w-10 h-5 rounded-full p-0.5 transition-all shadow-inner ${st.mostrar_beneficios ? 'bg-emerald-500' : 'bg-slate-300'}`}>
              <div className={`w-4 h-4 bg-white rounded-full transition-transform shadow-sm ${st.mostrar_beneficios ? 'translate-x-5' : 'translate-x-0'}`} />
            </button>
          </div>
          
          {st.mostrar_beneficios && (
            <div className="space-y-3">
              {[1, 2, 3].map(num => (
                <div key={num} className="bg-slate-50 p-3 rounded-md border border-slate-100 flex gap-3 items-start">
                  <div className="relative group w-9 h-9 shrink-0">
                    <div className="w-full h-full rounded-md bg-slate-200 text-slate-500 flex items-center justify-center overflow-hidden border border-transparent group-hover:border-slate-400 transition-colors">
                      {st[`beneficio_${num}_icone`] ? <img src={st[`beneficio_${num}_icone`]} className="w-full h-full object-contain"/> : <Package size={16}/>}
                    </div>
                    <input type="file" accept="image/*" onChange={(e) => handleImageUpload(e, `beneficio_${num}_icone`)} className="absolute inset-0 opacity-0 cursor-pointer z-10" />
                  </div>
                  <div className="flex-1 space-y-1.5">
                    <Input value={st[`beneficio_${num}_titulo`] || ''} onChange={(e) => setSt({...st, [`beneficio_${num}_titulo`]: e.target.value})} className="h-7 text-[10px] font-medium bg-white" />
                    <Input value={st[`beneficio_${num}_desc`] || ''} onChange={(e) => setSt({...st, [`beneficio_${num}_desc`]: e.target.value})} className="h-6 text-[9px] bg-white text-slate-500 font-medium" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white p-5 rounded-lg border border-slate-100 shadow-sm space-y-5">
          <h3 className="text-xs font-semibold uppercase text-slate-700 tracking-widest flex items-center gap-2 border-b border-slate-100 pb-3">
            <Globe size={16} className="text-blue-600" /> Redes e Textos
          </h3>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest">Sobre a Loja</label>
              <textarea value={st.texto_sobre || ''} onChange={(e) => setSt({...st, texto_sobre: e.target.value})} className="w-full min-h-[80px] p-2.5 bg-slate-50 border border-slate-200 rounded-md text-[11px] font-medium outline-none resize-none" />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest flex items-center gap-1.5"><MessageCircle size={12} className="text-emerald-500"/> WhatsApp</label>
              <Input value={st.whatsapp || ''} onChange={(e) => setSt({...st, whatsapp: e.target.value})} className="h-9 text-xs" />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest flex items-center gap-1.5"><Instagram size={12} className="text-pink-500"/> Instagram</label>
              <Input value={st.instagram || ''} onChange={(e) => setSt({...st, instagram: e.target.value})} className="h-9 text-xs" />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest flex items-center gap-1.5"><MapPin size={12}/> Endereço Físico</label>
              <Input value={st.endereco || ''} onChange={(e) => setSt({...st, endereco: e.target.value})} className="h-9 text-xs" />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest">Copyright</label>
              <Input value={st.copyright || ''} onChange={(e) => setSt({...st, copyright: e.target.value})} className="h-9 text-[10px]" />
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default function Catalogo({ isPublic = false }) {
  const [searchParams, setSearchParams] = useSearchParams();

  const [view, setView] = useState('grid');
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('Todas');
  const [searchTerm, setSearchTerm] = useState('');
  
  const [quantidade, setQuantidade] = useState(1);
  const [selecoes, setSelecoes] = useState({});
  const [respostasPersonalizadas, setRespostasPersonalizadas] = useState({});

  const [activeImage, setActiveImage] = useState('');
  const [galleryImages, setGalleryImages] = useState([]);
  
  const [st, setSt] = useState(null);
  const [produtos, setProdutos] = useState([]);
  const [categoriasRaw, setCategoriasRaw] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState(false);

  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  
  const imageRef = useRef(null);

  useEffect(() => {
    async function registrarAcesso() {
      if (isPublic && !sessionStorage.getItem('visitou_catalogo')) {
        try {
          const { data } = await supabase.from('configuracoes').select('acessos_catalogo').eq('id', 1).single();
          const acessosAtuais = data ? Number(data.acessos_catalogo) || 0 : 0;
          await supabase.from('configuracoes').update({ acessos_catalogo: acessosAtuais + 1 }).eq('id', 1);
          sessionStorage.setItem('visitou_catalogo', 'true');
        } catch (error) {
          console.error("Erro ao registrar acesso:", error);
        }
      }
    }
    registrarAcesso();
  }, [isPublic]);

  useEffect(() => {
    async function fetchData() {
      try {
        const { data: configData } = await supabase.from('configuracoes').select('*').eq('id', 1).single();
        if (configData) {
          if (!configData.banners || configData.banners.length === 0) {
            if (configData.banner_url) {
              configData.banners = [{ id: 'legacy', imagem: configData.banner_url, link: configData.banner_link || '' }];
            } else {
              configData.banners = [];
            }
          }
          setSt(configData);
        }

        const { data: prodData } = await supabase.from('produtos').select('*').eq('status_online', true).order('created_at', { ascending: false });
        if (prodData) {
          setProdutos(prodData);
          const uniqueCats = [...new Set(prodData.map(p => p.categoria))];
          setCategoriasRaw(uniqueCats);
        }
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    }
    fetchData();
  }, []);

  const displayCategories = useMemo(() => {
    if (categoriasRaw.length === 0) return [];
    let orderedCats = [...categoriasRaw];
    
    if (st?.ordem_categorias && st.ordem_categorias.length > 0) {
      orderedCats.sort((a, b) => {
        const idxA = st.ordem_categorias.indexOf(a);
        const idxB = st.ordem_categorias.indexOf(b);
        if (idxA !== -1 && idxB !== -1) return idxA - idxB;
        if (idxA !== -1) return -1;
        if (idxB !== -1) return 1;
        return 0;
      });
    }
    return orderedCats;
  }, [categoriasRaw, st?.ordem_categorias]);

  useEffect(() => {
    if (produtos.length === 0) return;

    const urlCategoria = searchParams.get('categoria') || 'Todas';
    const urlProduto = searchParams.get('produto');

    setSelectedCategory(urlCategoria);

    if (urlProduto) {
      const prod = produtos.find(p => String(p.id) === String(urlProduto));
      if (prod) {
        if (view !== 'detalhe' || selectedProduct?.id !== prod.id) {
          setupDetalheProduto(prod);
        }
      } else {
        setView('grid');
        setSelectedProduct(null);
      }
    } else {
      setView('grid');
      setSelectedProduct(null);
    }
  }, [searchParams, produtos]);

  const changeCategory = (cat) => {
    setSearchParams({ categoria: cat });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const goHome = () => {
    setSearchParams({});
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const abrirDetalhe = (prod) => {
    const params = new URLSearchParams(searchParams);
    params.set('produto', prod.id);
    setSearchParams(params);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const voltarParaGrid = () => {
    const params = new URLSearchParams(searchParams);
    params.delete('produto');
    setSearchParams(params);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const setupDetalheProduto = (prod) => {
    const iniciais = {};
    if (prod.variacoes?.ativa && prod.variacoes.atributos) {
      prod.variacoes.atributos.forEach(atrib => {
        if (atrib.opcoes?.length > 0) iniciais[atrib.nome] = atrib.opcoes[0];
      });
    }
    
    const imgSet = new Set();
    if (prod.imagem_url) imgSet.add(prod.imagem_url);
    if (prod.imagens && Array.isArray(prod.imagens)) prod.imagens.forEach(img => imgSet.add(img));
    if (prod.variacoes?.ativa && prod.variacoes.atributos) {
      prod.variacoes.atributos.forEach(attr => attr.opcoes?.forEach(op => { if (op.imagem) imgSet.add(op.imagem); }));
    }
    
    const finalGallery = Array.from(imgSet);
    setGalleryImages(finalGallery);
    setActiveImage(finalGallery[0] || `https://placehold.co/600x600?text=${encodeURIComponent(prod.nome)}`);
    setSelecoes(iniciais);
    setRespostasPersonalizadas({}); 
    
    setQuantidade(prod.qtd_minima || 1);
    setSelectedProduct(prod);
    setView('detalhe');
  };

  const handleSave = async () => {
    const { error } = await supabase.from('configuracoes').update(st).eq('id', 1);
    if (!error) {
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } else {
      alert("Erro ao salvar: " + error.message);
    }
  };

  const copyVitrineLink = () => {
    const url = window.location.origin + "/vitrine";
    navigator.clipboard.writeText(url);
    alert("Link copiado!");
  };

  const handleImageUpload = (e, field) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;
      
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 1200; 
        const MAX_HEIGHT = 1200;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        
        const compressedBase64 = canvas.toDataURL('image/webp', 0.7);
        setSt({ ...st, [field]: compressedBase64 });
      };
    };
    reader.readAsDataURL(file);
  };

  const filtered = produtos
    .filter(p => {
      const matchSearch = p.nome?.toLowerCase().includes(searchTerm.toLowerCase());
      const pCat = String(p.categoria || "").toLowerCase().trim();
      const sCat = String(selectedCategory || "").toLowerCase().trim();
      const matchCategory = selectedCategory === 'Todas' || pCat === sCat;
      return matchSearch && matchCategory;
    })
    .sort((a, b) => {
      if (a.destaque && !b.destaque) return -1;
      if (!a.destaque && b.destaque) return 1;
      return 0;
    });

  const calcularDesconto = (preco, promo) => {
    if (!promo || promo >= preco || preco === 0) return 0;
    return Math.round(((preco - promo) / preco) * 100);
  };

  const selecionarOpcao = (nomeAtributo, opcao) => {
    setSelecoes(prev => ({ ...prev, [nomeAtributo]: opcao }));
    if (opcao.imagem) {
      setActiveImage(opcao.imagem);
      
      if (window.innerWidth < 768 && imageRef.current) {
        const rect = imageRef.current.getBoundingClientRect();
        if (rect.top < 60) {
          window.scrollBy({ top: rect.top - 80, behavior: 'smooth' });
        }
      }
    }
  };

  const lidarRespostaPersonalizada = (id, valor) => {
    setRespostasPersonalizadas(prev => ({ ...prev, [id]: valor }));
  };

  const handleQuantidadeChange = (e) => {
    const val = e.target.value.replace(/\D/g, '');
    const minQtd = selectedProduct?.qtd_minima || 1;
    if (val === '') {
      setQuantidade('');
    } else {
      setQuantidade(parseInt(val));
    }
  };

  const handleQuantidadeBlur = () => {
    const minQtd = selectedProduct?.qtd_minima || 1;
    if (!quantidade || quantidade < minQtd) {
      setQuantidade(minQtd);
    }
  };

  const decrementarQuantidade = () => {
     const minQtd = selectedProduct?.qtd_minima || 1;
     setQuantidade(prev => Math.max(minQtd, prev - 1));
  };

  const renderCatalog = () => {
    if (view === 'detalhe' && selectedProduct) {
      let baseProductPrice = selectedProduct.preco_promocional > 0 ? selectedProduct.preco_promocional : selectedProduct.preco;
      let currentPrice = baseProductPrice;
      let hasVariationPrice = false;
      let variationPriceSum = 0;

      Object.values(selecoes).forEach(opcao => { 
        if (opcao && Number(opcao.preco) > 0) {
          variationPriceSum += Number(opcao.preco);
          hasVariationPrice = true;
        } 
      });

      if (hasVariationPrice) {
        currentPrice = variationPriceSum;
      }

      const getWholesalePrice = (rulePrice) => {
        if (hasVariationPrice && baseProductPrice > 0) {
          const absoluteDiscount = baseProductPrice - rulePrice;
          return Math.max(0, currentPrice - absoluteDiscount);
        }
        return rulePrice;
      };

      let unitPriceFinal = currentPrice;
      let wholesaleApplied = false;
      const minQtd = selectedProduct.qtd_minima || 1;
      const qtdSafe = Math.max(quantidade || minQtd, minQtd);

      if (selectedProduct.atacado?.ativa && selectedProduct.atacado?.regras?.length > 0) {
        const validRules = selectedProduct.atacado.regras
          .filter(r => qtdSafe >= r.min && (!r.max || qtdSafe <= r.max))
          .sort((a, b) => b.min - a.min);
        
        if (validRules.length > 0) {
          unitPriceFinal = getWholesalePrice(validRules[0].preco);
          wholesaleApplied = true;
        }
      }

      let atacadoData = null;
      if (selectedProduct.atacado?.ativa && selectedProduct.atacado?.regras?.length > 0) {
        const sortedRules = [...selectedProduct.atacado.regras].sort((a, b) => a.min - b.min);
        const nextRule = sortedRules.find(r => r.min > qtdSafe);
        const activeRule = [...sortedRules].reverse().find(r => qtdSafe >= r.min);
        
        let progress = 100;
        if (nextRule) {
           progress = (qtdSafe / nextRule.min) * 100;
        }
        
        atacadoData = { rules: sortedRules, nextRule, activeRule, progress };
      }

      const precoTotal = unitPriceFinal * qtdSafe;
      const descontoPercent = calcularDesconto(selectedProduct.preco, selectedProduct.preco_promocional);
      const relacionados = produtos.filter(p => p.categoria === selectedProduct.categoria && p.id !== selectedProduct.id).slice(0, 4);

      const enviarZap = () => {
        if (selectedProduct.campos_personalizados?.length > 0) {
          const camposFaltando = selectedProduct.campos_personalizados.filter(
            campo => campo.obrigatorio && (!respostasPersonalizadas[campo.id] || respostasPersonalizadas[campo.id].trim() === '')
          );

          if (camposFaltando.length > 0) {
            alert(`Por favor, preencha o campo obrigatório: ${camposFaltando[0].titulo}`);
            return;
          }
        }

        const num = st?.whatsapp?.replace(/\D/g, '');
        const textoVars = Object.entries(selecoes).map(([k, v]) => `▪️ *${k}:* ${v.nome}`).join('\n');
        
        let textoPersonalizado = '';
        if (selectedProduct.campos_personalizados?.length > 0) {
          textoPersonalizado = '\n\n*📝 Personalização:*\n' + selectedProduct.campos_personalizados.map(campo => {
            const resposta = respostasPersonalizadas[campo.id] || 'Não preenchido';
            return `▪️ *${campo.titulo}:* ${resposta}`;
          }).join('\n');
        }

        const msg = `Olá! Gostaria de encomendar este produto:\n\n🛍️ *${selectedProduct.nome}*\n${textoVars}${textoPersonalizado}\n\n*Quantidade:* ${qtdSafe} un.\n*Valor Unitário:* R$ ${unitPriceFinal.toFixed(2)} ${wholesaleApplied ? '(Atacado)' : ''}\n*Total:* R$ ${precoTotal.toFixed(2)}`;
        window.open(`https://wa.me/${num}?text=${encodeURIComponent(msg)}`, '_blank');
      };

      const variacoesJSX = selectedProduct.variacoes?.ativa && selectedProduct.variacoes?.atributos ? (
        <div className="space-y-4 md:space-y-5 mb-4 md:mb-6 md:border-b border-slate-100 md:pb-6">
          {selectedProduct.variacoes.atributos.map(atrib => (
            <div key={atrib.id}>
              <h3 className="text-[11px] md:text-xs font-bold text-slate-700 mb-2">{atrib.nome}:</h3>
              <div className="flex flex-wrap gap-2 md:gap-2.5">
                {atrib.opcoes.map(opcao => {
                  const isSelected = selecoes[atrib.nome]?.id === opcao.id;
                  return (
                    <button
                      key={opcao.id}
                      onClick={() => selecionarOpcao(atrib.nome, opcao)}
                      className={`px-3 py-1.5 md:px-4 md:py-2 rounded-lg text-[10px] md:text-xs font-bold transition-all border flex items-center gap-2.5 ${isSelected ? 'border-slate-800 bg-slate-900 text-white' : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50'}`}
                    >
                      {opcao.imagem && <div className="w-7 h-7 md:w-5 md:h-5 rounded-full overflow-hidden shrink-0 bg-white"><img src={opcao.imagem} className="w-full h-full object-cover"/></div>}
                      {opcao.nome}
                    </button>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      ) : null;

      return (
        <div className="min-h-screen bg-white flex flex-col">
          <HeaderSite st={st} searchTerm={searchTerm} setSearchTerm={setSearchTerm} selectedCategory={selectedCategory} changeCategory={changeCategory} categorias={displayCategories} isPublic={isPublic} goHome={goHome} view={view} />
          <BenefitsBar st={st} />

          <div className="max-w-6xl mx-auto px-4 md:px-8 pt-6 md:pt-10 flex-1 w-full animate-in fade-in duration-500 pb-40 md:pb-10">
            <button onClick={voltarParaGrid} className="flex items-center gap-1.5 text-slate-500 font-bold text-xs hover:text-slate-900 transition-all mb-6">
              <ChevronLeft size={16} /> Voltar para loja
            </button>
            
            <div className="flex flex-col md:flex-row gap-8 lg:gap-12" ref={imageRef}>
              
              {/* LADO ESQUERDO (Imagens e Descrição no Desktop) */}
              <div className="w-full md:w-[45%] flex flex-col gap-4">
                 <div className="aspect-square rounded-2xl overflow-hidden bg-slate-50 border border-slate-100 shadow-sm relative group p-2 flex items-center justify-center">
                   {selectedProduct.destaque && (
                      <div className="absolute top-4 left-4 z-10 text-white text-[10px] font-black px-3 py-1.5 rounded-lg shadow-sm flex items-center gap-1 uppercase" style={{ backgroundColor: st?.cor_etiqueta_destaque || '#fbbf24' }}>
                        <Star size={12} fill="currentColor" /> Destaque
                      </div>
                   )}
                   <img key={activeImage} src={activeImage} className="w-full h-full object-contain animate-in fade-in duration-300" alt={selectedProduct.nome} />
                 </div>
                 
                 {galleryImages.length > 1 && (
                   <div className="flex gap-2.5 overflow-x-auto pb-2 no-scrollbar">
                     {galleryImages.map((img, idx) => (
                       <button key={idx} onClick={() => setActiveImage(img)} className={`w-16 h-16 shrink-0 rounded-lg overflow-hidden border-2 p-1 transition-all flex items-center justify-center ${activeImage === img ? 'border-slate-800 bg-white' : 'border-transparent opacity-70 hover:opacity-100 bg-slate-50'}`}>
                         <img src={img} className="w-full h-full object-contain rounded-md" />
                       </button>
                     ))}
                   </div>
                 )}

                 <div className="block md:hidden mt-2">
                    {variacoesJSX}
                 </div>

                 {/* DESCRIÇÃO NO DESKTOP (Abaixo das imagens) */}
                 {selectedProduct.descricao && (
                    <div className="hidden md:block mt-8 pt-8 border-t border-slate-100">
                      <h3 className="text-xs font-bold text-slate-800 uppercase tracking-widest mb-4">Descrição do Produto</h3>
                      <div className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap">
                        {selectedProduct.descricao}
                      </div>
                    </div>
                 )}
              </div>

              {/* LADO DIREITO (Ações e Compra) */}
              <div className="w-full md:w-[55%] flex flex-col">
                <div className="flex flex-wrap gap-2 mb-3">
                  {descontoPercent > 0 && !wholesaleApplied && !hasVariationPrice && (
                    <span className="text-white text-[10px] font-bold px-2 py-1 rounded uppercase shadow-sm" style={{ backgroundColor: st?.cor_etiqueta_promo || '#f43f5e' }}>
                      -{descontoPercent}% OFF
                    </span>
                  )}
                  {selectedProduct.qtd_minima > 1 && (
                    <span className="bg-slate-800 text-white text-[10px] font-bold px-2 py-1 rounded uppercase shadow-sm">
                      Pedido Mín. {selectedProduct.qtd_minima} un.
                    </span>
                  )}
                  <span className="bg-slate-100 text-slate-600 border border-slate-200 text-[10px] font-bold px-2 py-1 rounded uppercase shadow-sm flex items-center gap-1">
                    <Package size={12}/> {selectedProduct.categoria}
                  </span>
                </div>

                <h1 className="text-2xl md:text-3xl font-black text-slate-900 mb-4 leading-tight">{selectedProduct.nome}</h1>
                
                <div className="mb-6 pb-6 border-b border-slate-100">
                   <div className="flex items-end gap-3 mb-1">
                     <span className="text-3xl md:text-4xl font-black transition-colors duration-300" style={{ color: st?.cor_principal }}>R$ {unitPriceFinal.toFixed(2)}</span>
                     {selectedProduct.preco_promocional > 0 && !wholesaleApplied && !hasVariationPrice && (
                       <span className="text-sm text-slate-400 line-through font-bold mb-1.5">R$ {selectedProduct.preco.toFixed(2)}</span>
                     )}
                   </div>
                   {wholesaleApplied && (
                      <span className="font-bold text-[10px] uppercase flex items-center gap-1 mt-1" style={{ color: st?.cor_etiqueta_atacado || '#fb923c' }}>
                        <Box size={12}/> Preço de Atacado Aplicado
                      </span>
                   )}
                </div>

                <div className="hidden md:block">
                  {variacoesJSX}
                </div>

                {atacadoData && (
                  <div className="mb-6 bg-slate-50 border border-slate-200 rounded-xl p-4 md:p-5">
                    <h3 className="text-[11px] font-bold text-slate-600 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                      <Box size={14}/> Descontos por Quantidade
                    </h3>
                    
                    {atacadoData.nextRule ? (
                      <div className="mb-4 bg-white p-3 rounded-lg border border-slate-100 shadow-sm">
                         <p className="text-[11px] font-semibold text-slate-600 mb-2">
                           🔥 Adicione mais <span className="font-black text-emerald-600">{atacadoData.nextRule.min - qtdSafe} un.</span> e o valor cai para <span className="font-black text-emerald-600">R$ {getWholesalePrice(atacadoData.nextRule.preco).toFixed(2)}/un</span>
                         </p>
                         <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden mb-1">
                            <div className="bg-emerald-500 h-2 rounded-full transition-all duration-500" style={{ width: `${atacadoData.progress}%` }}></div>
                         </div>
                         <div className="flex justify-between items-center text-[9px] font-bold text-slate-400">
                           <span>{qtdSafe} un.</span>
                           <span>Meta: {atacadoData.nextRule.min} un.</span>
                         </div>
                      </div>
                    ) : (
                      <div className="mb-4 bg-amber-50 border border-amber-200 p-3 rounded-lg flex items-center gap-2 text-amber-700">
                        <Sparkles size={16} className="text-amber-500" />
                        <span className="text-[11px] font-black uppercase tracking-widest">Desconto Máximo Atingido! 🎉</span>
                      </div>
                    )}

                    <div className="flex flex-col gap-1.5">
                      {atacadoData.rules.map((r, i) => {
                         const isCurrent = atacadoData.activeRule?.min === r.min;
                         const price = getWholesalePrice(r.preco);
                         return (
                           <div key={i} className={`flex justify-between items-center text-[10px] px-3 py-2 rounded-md border ${isCurrent ? 'bg-amber-100/50 border-amber-200 text-amber-900 font-bold shadow-sm' : 'bg-white border-slate-100 text-slate-500'}`}>
                             <span>Acima de {r.min} un.</span>
                             <span className={isCurrent ? 'font-black' : 'font-semibold'}>R$ {price.toFixed(2)} /un</span>
                           </div>
                         )
                      })}
                    </div>
                  </div>
                )}

                {selectedProduct.campos_personalizados && selectedProduct.campos_personalizados.length > 0 && (
                  <div className="space-y-5 mb-6 border-b border-slate-100 pb-6">
                    <h3 className="text-xs font-bold text-emerald-700 uppercase tracking-widest mb-4 flex items-center gap-2">
                      <FileText size={16} /> Personalize seu Produto
                    </h3>
                    
                    {selectedProduct.campos_personalizados.map(campo => (
                      <div key={campo.id} className="space-y-2">
                        <label className="text-[11px] font-bold text-slate-700 uppercase tracking-widest flex items-center gap-1.5">
                          {campo.titulo}
                          {campo.obrigatorio && <span className="text-rose-500 text-[10px]">* Obrigatório</span>}
                        </label>
                        
                        {campo.tipo === 'texto_curto' && (
                          <Input 
                            value={respostasPersonalizadas[campo.id] || ''}
                            onChange={(e) => lidarRespostaPersonalizada(campo.id, e.target.value)}
                            placeholder="Digite sua resposta..."
                            className="h-11 bg-slate-50 focus:bg-white text-sm"
                          />
                        )}

                        {campo.tipo === 'texto_longo' && (
                          <textarea 
                            value={respostasPersonalizadas[campo.id] || ''}
                            onChange={(e) => lidarRespostaPersonalizada(campo.id, e.target.value)}
                            placeholder="Descreva os detalhes aqui..."
                            className="w-full min-h-[80px] p-3 rounded-md border border-slate-200 bg-slate-50 focus:bg-white text-sm outline-none focus:ring-2 focus:ring-slate-100 resize-none"
                          />
                        )}

                        {campo.tipo === 'data' && (
                          <Input 
                            type="date"
                            value={respostasPersonalizadas[campo.id] || ''}
                            onChange={(e) => lidarRespostaPersonalizada(campo.id, e.target.value)}
                            className="h-11 bg-slate-50 focus:bg-white text-sm cursor-pointer"
                          />
                        )}

                        {campo.tipo === 'hora' && (
                          <Input 
                            type="time"
                            value={respostasPersonalizadas[campo.id] || ''}
                            onChange={(e) => lidarRespostaPersonalizada(campo.id, e.target.value)}
                            className="h-11 bg-slate-50 focus:bg-white text-sm cursor-pointer"
                          />
                        )}

                        {campo.tipo === 'upload' && (
                          <FileUploadField 
                            campo={campo}
                            st={st}
                            value={respostasPersonalizadas[campo.id] || ''}
                            onChange={(valor) => lidarRespostaPersonalizada(campo.id, valor)}
                          />
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* DESCRIÇÃO NO MOBILE (Antes do botão de compra) */}
                {selectedProduct.descricao && (
                  <div className="mb-6 border-b border-slate-100 pb-6 block md:hidden">
                    <h3 className="text-xs font-bold text-slate-800 uppercase tracking-widest mb-2">Descrição do Produto</h3>
                    <div className="text-xs text-slate-600 leading-relaxed whitespace-pre-wrap">
                      {selectedProduct.descricao}
                    </div>
                  </div>
                )}

                {/* --- NOVA BARRA DE COMPRA (Horizontal no Desktop, Fixa no Mobile) --- */}
                <div className="fixed inset-x-0 bottom-0 bg-white p-4 pb-6 border-t border-slate-200 shadow-[0_-10px_20px_rgba(0,0,0,0.05)] z-50 md:static md:bg-transparent md:p-0 md:pb-0 md:shadow-none md:border-none md:mt-2">
                   <div className="flex flex-col max-w-6xl mx-auto">
                     
                      {atacadoData && atacadoData.nextRule && (
                        <div className="md:hidden flex flex-col gap-1 mb-2 px-1">
                           <p className="text-[9px] font-black text-emerald-600 uppercase tracking-widest text-center">
                             🔥 Faltam só {atacadoData.nextRule.min - qtdSafe} un. para pagar R$ {getWholesalePrice(atacadoData.nextRule.preco).toFixed(2)}/un
                           </p>
                           <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                              <div className="bg-emerald-500 h-1.5 rounded-full transition-all duration-500" style={{ width: `${atacadoData.progress}%` }}></div>
                           </div>
                        </div>
                      )}

                      <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3 md:gap-4 w-full">
                        <div className="flex items-center justify-between bg-slate-50 p-3 md:p-3.5 rounded-xl border border-slate-200 w-full md:w-auto shrink-0 md:pr-6">
                          <div className="flex items-center border border-slate-300 rounded-lg h-10 md:h-12 bg-white overflow-hidden shadow-sm mr-4">
                            <button onClick={decrementarQuantidade} className="w-10 md:w-12 h-full flex items-center justify-center text-slate-500 hover:bg-slate-50 transition-colors" disabled={quantidade <= minQtd}><Minus size={16} className={quantidade <= minQtd ? "opacity-30" : ""}/></button>
                            <input 
                              type="text" 
                              inputMode="numeric"
                              pattern="[0-9]*"
                              value={quantidade} 
                              onChange={handleQuantidadeChange} 
                              onBlur={handleQuantidadeBlur}
                              className="w-10 md:w-12 h-full text-center font-black text-slate-800 text-sm border-x border-slate-200 outline-none"
                            />
                            <button onClick={() => setQuantidade(qtdSafe + 1)} className="w-10 md:w-12 h-full flex items-center justify-center text-slate-500 hover:bg-slate-50 transition-colors"><Plus size={16}/></button>
                          </div>
                          <div className="text-right">
                            <p className="text-[9px] md:text-[10px] font-bold uppercase text-slate-400 tracking-widest mb-0.5">Total a Pagar</p>
                            <p className="text-xl md:text-2xl font-black text-slate-900 tracking-tighter leading-none">R$ {precoTotal.toFixed(2)}</p>
                          </div>
                        </div>

                        <Button onClick={enviarZap} className="w-full md:flex-1 h-12 md:h-14 bg-[#25D366] hover:bg-[#20bd5a] text-white rounded-xl font-bold uppercase text-[11px] md:text-xs gap-2 shadow-md transition-all border-none active:scale-[0.98]">
                          <MessageCircle size={20} fill="currentColor" /> Encomendar pelo WhatsApp
                        </Button>
                      </div>
                   </div>
                </div>

              </div>
            </div>

            {/* SEÇÃO VEJA TAMBÉM */}
            {relacionados.length > 0 && (
              <div className="mt-16 md:mt-24 mb-10">
                <h3 className="text-xl md:text-2xl font-black text-slate-900 mb-6 flex items-center gap-2">
                  Veja também
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 md:gap-6">
                  {relacionados.map(prod => (
                    <div key={prod.id} onClick={() => abrirDetalhe(prod)} className="group cursor-pointer flex flex-col h-full bg-white rounded-xl md:rounded-2xl border border-slate-200 overflow-hidden hover:shadow-md hover:border-slate-300 transition-all duration-300">
                      <div className="aspect-square bg-slate-50 border-b border-slate-100 overflow-hidden relative flex items-center justify-center p-2">
                        {prod.destaque && (
                          <div className="absolute top-2 left-2 z-10 text-white text-[9px] font-bold px-1.5 py-0.5 rounded flex items-center gap-0.5 shadow-sm" style={{ backgroundColor: st?.cor_etiqueta_destaque || '#fbbf24' }}>
                            <Star size={10} fill="currentColor" /> Destaque
                          </div>
                        )}
                        <img src={prod.imagem_url || `https://placehold.co/400`} className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-700" />
                      </div>
                      
                      <div className="flex flex-col flex-1 p-3 md:p-4">
                        <h3 className="text-xs font-bold text-slate-800 line-clamp-2 leading-tight mb-2">{prod.nome}</h3>
                        
                        <div className="flex flex-col mb-3">
                          <span className="text-sm font-black text-slate-900 leading-none">R$ {Number(prod.preco_promocional > 0 ? prod.preco_promocional : prod.preco).toFixed(2)}</span>
                        </div>

                        <div className="mt-auto pt-2">
                          <button className="w-full py-2 rounded-lg text-white text-[10px] font-bold uppercase transition-colors duration-300" style={{ backgroundColor: st?.cor_principal }}>Ver Detalhes</button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          
          <FooterSite st={st} />
        </div>
      );
    }

    return (
      <div className="min-h-screen bg-[#f8fafc] flex flex-col">
        <HeaderSite st={st} searchTerm={searchTerm} setSearchTerm={setSearchTerm} selectedCategory={selectedCategory} changeCategory={changeCategory} categorias={displayCategories} isPublic={isPublic} goHome={goHome} view={view} />
        <BenefitsBar st={st} />

        <main className="max-w-7xl mx-auto px-4 md:px-8 py-8 md:py-12 flex-1 w-full space-y-10 md:space-y-14">
          
          <BannerCarousel banners={st?.banners} />

          {filtered.length === 0 ? (
             <div className="text-center py-20 bg-white rounded-2xl border border-slate-200 shadow-sm">
               <ShoppingBag size={40} className="mx-auto text-slate-200 mb-4" />
               <p className="text-slate-500 font-bold uppercase text-xs tracking-widest">Nenhum produto encontrado.</p>
             </div>
          ) : (
            <div className="space-y-6">
              <h2 className="text-xl md:text-2xl font-black text-slate-900 border-b border-slate-200 pb-3">
                Todos os Produtos
              </h2>

              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-5">
                {filtered.map(prod => {
                  const descontoPercent = calcularDesconto(prod.preco, prod.preco_promocional);
                  
                  return (
                  <div key={prod.id} className="group bg-white rounded-xl md:rounded-2xl border border-slate-200 overflow-hidden hover:shadow-md hover:border-slate-300 transition-all duration-300 flex flex-col h-full cursor-pointer animate-in fade-in" onClick={() => abrirDetalhe(prod)}>
                    
                    <div className="aspect-square bg-slate-50 border-b border-slate-100 overflow-hidden relative flex items-center justify-center p-2">
                      {prod.destaque && (
                         <span className="absolute top-3 left-3 z-10 text-white text-[9px] font-black px-2 py-1 rounded shadow-sm flex items-center gap-1 uppercase" style={{ backgroundColor: st?.cor_etiqueta_destaque || '#fbbf24' }}>
                           <Star size={10} fill="currentColor" /> Destaque
                         </span>
                      )}
                      <img src={prod.imagem_url || `https://placehold.co/400`} className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-700" alt={prod.nome} />
                    </div>
                    
                    <div className="flex flex-col flex-1 p-3 md:p-4">
                      <div className="flex flex-wrap items-center gap-1.5 mb-2">
                        {descontoPercent > 0 && (
                          <span className="text-white text-[9px] font-bold px-1.5 py-0.5 rounded uppercase" style={{ backgroundColor: st?.cor_etiqueta_promo || '#f43f5e' }}>
                            -{descontoPercent}% OFF
                          </span>
                        )}
                        {prod.atacado?.ativa && (
                          <span className="text-white text-[9px] font-bold px-1.5 py-0.5 rounded uppercase flex items-center gap-0.5" style={{ backgroundColor: st?.cor_etiqueta_atacado || '#fb923c' }}>
                            <Box size={10} /> Atacado
                          </span>
                        )}
                        {prod.variacoes?.ativa && (
                          <span className="text-white text-[9px] font-bold px-1.5 py-0.5 rounded uppercase flex items-center gap-0.5" style={{ backgroundColor: st?.cor_etiqueta_variacao || '#60a5fa' }}>
                            <Layers size={10} /> Variações
                          </span>
                        )}
                        {!descontoPercent && !prod.atacado?.ativa && !prod.variacoes?.ativa && (
                           <span className="bg-slate-100 text-slate-500 text-[9px] font-bold px-1.5 py-0.5 rounded uppercase flex items-center gap-0.5">
                            <Package size={10} /> {prod.categoria}
                          </span>
                        )}
                      </div>
                      
                      <h3 className="text-xs md:text-sm font-bold text-slate-800 line-clamp-2 leading-tight mb-2">{prod.nome}</h3>
                      
                      <div className="flex flex-col mb-3">
                        {prod.preco_promocional > 0 ? (
                          <>
                            <span className="text-[10px] text-slate-400 line-through font-bold leading-none">R$ {Number(prod.preco).toFixed(2)}</span>
                            <span className="text-base md:text-lg font-black text-slate-900 leading-none mt-1">R$ {Number(prod.preco_promocional).toFixed(2)}</span>
                          </>
                        ) : (
                          <span className="text-base md:text-lg font-black text-slate-900 leading-none">R$ {Number(prod.preco).toFixed(2)}</span>
                        )}
                      </div>
                        
                      <div className="mt-auto pt-2">
                        <button className="w-full h-9 md:h-10 rounded-lg text-white text-[11px] font-bold uppercase transition-colors duration-300 shadow-sm group-hover:opacity-90 flex items-center justify-center gap-1.5" style={{ backgroundColor: st?.cor_principal }}>
                           Ver Detalhes
                        </button>
                      </div>

                    </div>
                  </div>
                )})}
              </div>
            </div>
          )}
        </main>
        
        <FooterSite st={st} />
      </div>
    );
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-slate-50"><Loader2 className="animate-spin text-slate-300" size={48} /></div>;

  if (isPublic) {
    return renderCatalog();
  }

  return (
    <div className="flex flex-col lg:flex-row min-h-screen bg-[#f8fafc] relative overflow-hidden">
      
      {!isSidebarOpen && !isPublic && (
        <button 
          onClick={() => setIsSidebarOpen(true)}
          className="fixed bottom-6 lg:bottom-10 left-4 lg:left-10 z-50 bg-slate-900 text-white p-3 lg:px-5 lg:py-3 rounded-full shadow-xl hover:scale-105 transition-all flex items-center gap-2 border border-slate-700 animate-in slide-in-from-left-8 fade-in"
        >
          <Palette size={20} />
          <span className="text-[11px] font-bold uppercase tracking-widest hidden lg:block">Mostrar Edição</span>
        </button>
      )}

      {/* PAINEL LATERAL DE CONFIGURAÇÕES */}
      <div className={`transition-all duration-300 ease-in-out border-b lg:border-b-0 lg:border-r border-slate-200 bg-slate-50 lg:h-screen lg:sticky lg:top-0 overflow-hidden shadow-sm z-50 shrink-0 ${isSidebarOpen ? 'w-full lg:w-[400px] xl:w-[450px] opacity-100' : 'w-0 h-0 opacity-0 border-none'}`}>
        <div className="w-full lg:w-[400px] xl:w-[450px] h-full overflow-y-auto no-scrollbar">
          <ConfigSidebar 
            st={st} 
            setSt={setSt} 
            handleSave={handleSave} 
            saved={saved} 
            handleImageUpload={handleImageUpload} 
            copyVitrineLink={copyVitrineLink} 
            setIsSidebarOpen={setIsSidebarOpen}
            categorias={displayCategories}
          />
        </div>
      </div>

      {/* ÁREA DE PREVIEW (CATÁLOGO AO VIVO) */}
      <div className="flex-1 w-full bg-[#f8fafc] overflow-x-hidden relative transition-all duration-300">
        {renderCatalog()}
      </div>

    </div>
  );
}