import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Palette, Image as ImageIcon, Upload, Check, Trash2, 
  Copy, Loader2, Save, X, Link as LinkIcon, Plus, Globe, LayoutTemplate, Star, ShoppingBag, ChevronDown, ArrowLeft
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "../lib/supabase";

// --- COMPRESSOR DE IMAGENS (800px / 80% WebP) ---
const compressImageToBlob = (file) => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new window.Image(); 
      img.src = event.target.result;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 800; 
        const MAX_HEIGHT = 800;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) { height *= MAX_WIDTH / width; width = MAX_WIDTH; }
        } else {
          if (height > MAX_HEIGHT) { width *= MAX_HEIGHT / height; height = MAX_HEIGHT; }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        
        canvas.toBlob((blob) => resolve(blob), 'image/webp', 0.8);
      };
    };
  });
};

// --- COMPONENTE DE SANFONA PARA O EDITOR ---
const AccordionItem = ({ title, icon: Icon, isOpen, onClick, children }) => (
  <div className="border-b border-slate-700/50">
    <button onClick={onClick} className="w-full flex items-center justify-between p-3.5 hover:bg-slate-800 transition-colors">
      <div className="flex items-center gap-2.5 text-[10px] font-bold text-slate-300 uppercase tracking-widest">
        <Icon size={14} className="text-slate-400" /> {title}
      </div>
      <ChevronDown size={14} className={`text-slate-400 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
    </button>
    <div className={`overflow-hidden transition-all duration-300 ${isOpen ? 'max-h-[1000px] opacity-100' : 'max-h-0 opacity-0'}`}>
      <div className="p-4 pt-0 bg-slate-900/50 space-y-4">
        {children}
      </div>
    </div>
  </div>
);

export default function LinkBio({ isPublic = false }) {
  const navigate = useNavigate();
  const [config, setConfig] = useState({
    capa_url: '',
    cor_capa: '#cbd5e1', 
    titulo: 'Portal Criarte',
    descricao: 'Tudo feito com muito carinho.',
    cor_fundo: '#f8fafc',
    cor_botoes: '#f472b6',
    cor_texto_botoes: '#ffffff',
    cor_texto: '#1e293b',
    links: [],
    banners: []
  });

  const [logoLoja, setLogoLoja] = useState('');
  const [produtosDestaque, setProdutosDestaque] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState(false);
  const [isUploadingGlobal, setIsUploadingGlobal] = useState(false);
  const [openSection, setOpenSection] = useState('textos');

  useEffect(() => {
    async function loadData() {
      const { data: configData } = await supabase.from('bio_config').select('*').eq('id', 1).single();
      if (configData) {
        setConfig({
          ...configData,
          cor_capa: configData.cor_capa || '#cbd5e1',
          links: configData.links || [],
          banners: configData.banners || [] 
        });
      }

      const { data: configLoja } = await supabase.from('configuracoes').select('logo_url').eq('id', 1).single();
      if (configLoja) setLogoLoja(configLoja.logo_url);

      const { data: prods } = await supabase.from('produtos').select('id, nome, preco, preco_promocional, imagens, imagem_url').eq('status_online', true).eq('destaque', true).limit(3);
      if (prods) setProdutosDestaque(prods);

      setLoading(false);
    }
    loadData();
  }, []);

  const handleSave = async () => {
    const { error } = await supabase.from('bio_config').update(config).eq('id', 1);
    if (!error) {
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } else {
      alert("Erro ao salvar: " + error.message);
    }
  };

  const copyBioLink = () => {
    const url = window.location.origin + "/bio";
    navigator.clipboard.writeText(url);
    alert("Link da Bio copiado!");
  };

  const uploadToSupabase = async (file, prefix) => {
    const blob = await compressImageToBlob(file);
    const fileName = `bio-${prefix}-${Date.now()}-${Math.random().toString(36).substring(7)}.webp`;
    const { error } = await supabase.storage.from('produtos').upload(fileName, blob, { contentType: 'image/webp', upsert: true });
    if (error) throw error;
    const { data } = supabase.storage.from('produtos').getPublicUrl(fileName);
    return data.publicUrl;
  };

  const handleImageUpload = async (e, field) => {
    const file = e.target.files[0];
    if (file) {
      setIsUploadingGlobal(true);
      try {
        const url = await uploadToSupabase(file, 'capa');
        setConfig({ ...config, [field]: url });
      } catch (err) { alert("Erro no upload: " + err.message); } 
      finally { setIsUploadingGlobal(false); }
    }
  };

  // --- GERENCIAMENTO DE LINKS ---
  const addLink = () => setConfig({ ...config, links: [...(config.links || []), { id: Date.now(), titulo: '', url: '', imagem_icone: '', cor_fundo: '', cor_texto: '', ativo: true }] });
  const updateLink = (id, field, value) => setConfig({ ...config, links: config.links.map(l => l.id === id ? { ...l, [field]: value } : l) });
  const removeLink = (id) => setConfig({ ...config, links: config.links.filter(l => l.id !== id) });
  
  const handleLinkIconUpload = async (e, id) => {
    const file = e.target.files[0];
    if (file) {
      setIsUploadingGlobal(true);
      try {
        const url = await uploadToSupabase(file, 'icone');
        updateLink(id, 'imagem_icone', url);
      } catch (err) { alert("Erro no upload: " + err.message); } 
      finally { setIsUploadingGlobal(false); }
    }
  };

  // --- GERENCIAMENTO DE BANNERS ---
  const addBanner = () => setConfig({ ...config, banners: [...(config.banners || []), { id: Date.now(), imagem_url: '', link: '', descricao: '', botao_texto: 'Acessar' }] });
  const updateBanner = (id, field, value) => setConfig({ ...config, banners: config.banners.map(b => b.id === id ? { ...b, [field]: value } : b) });
  const removeBanner = (id) => setConfig({ ...config, banners: config.banners.filter(b => b.id !== id) });

  const handleBannerUpload = async (e, id) => {
    const file = e.target.files[0];
    if (file) {
      setIsUploadingGlobal(true);
      try {
        const url = await uploadToSupabase(file, 'banner');
        updateBanner(id, 'imagem_url', url);
      } catch (err) { alert("Erro no upload: " + err.message); } 
      finally { setIsUploadingGlobal(false); }
    }
  };

  // --- VISUAL AO VIVO ---
  const LivePreview = () => (
    <div className="min-h-screen w-full flex flex-col items-center justify-start pb-20 transition-colors duration-500 overflow-x-hidden" style={{ backgroundColor: config.cor_fundo }}>
      <div className="w-full max-w-md flex flex-col items-center animate-in fade-in zoom-in-95 duration-500 relative">
        <div className="w-full h-32 md:h-40 overflow-hidden shadow-sm relative shrink-0 transition-colors" style={{ backgroundColor: config.cor_capa || '#cbd5e1' }}>
           {config.capa_url && <><img src={config.capa_url} className="w-full h-full object-cover" /><div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent"></div></>}
        </div>
        <div className="w-24 h-24 rounded-full overflow-hidden border-[4px] shadow-lg relative z-10 shrink-0 -mt-12 bg-white" style={{ borderColor: config.cor_fundo }}>
          {logoLoja ? <img src={logoLoja} className="w-full h-full object-cover" alt={config.titulo} /> : <div className="w-full h-full bg-slate-200"></div>}
        </div>
        <div className="px-4 mt-3 flex flex-col items-center w-full">
           <h1 className="text-xl md:text-2xl font-black text-center mb-2" style={{ color: config.cor_texto }}>{config.titulo}</h1>
           {config.descricao && <p className="text-center text-sm font-medium mb-6 opacity-80 leading-relaxed" style={{ color: config.cor_texto }}>{config.descricao}</p>}

           {config.banners?.length > 0 && (
             <div className="w-full flex flex-col gap-6 mb-6">
               {config.banners.map(banner => {
                 if (!banner.imagem_url) return null;
                 return (
                 <div key={banner.id} className="w-full rounded-2xl overflow-hidden shadow-lg flex flex-col bg-white/5 border border-black/5" style={{ borderColor: `${config.cor_texto}20`}}>
                   <img src={banner.imagem_url} className="w-full object-cover aspect-video" alt="Banner Promo" />
                   {(banner.descricao || banner.link) && (
                      <div className="p-5 flex flex-col gap-4 items-center" style={{ backgroundColor: `${config.cor_botoes}15` }}>
                        {banner.descricao && <p className="text-[13px] font-medium text-center leading-relaxed" style={{ color: config.cor_texto }}>{banner.descricao}</p>}
                        {banner.link && (
                           <a href={banner.link} target="_blank" className="w-full py-3 rounded-xl text-center font-bold text-[11px] uppercase tracking-widest shadow-md hover:scale-[1.02] active:scale-95 transition-transform" style={{ backgroundColor: config.cor_botoes, color: config.cor_texto_botoes }}>
                              {banner.botao_texto || 'Acessar Link'}
                           </a>
                        )}
                      </div>
                   )}
                 </div>
               )})}
             </div>
           )}

           <div className="w-full flex flex-col gap-4">
             {config.links?.map((link, i) => (
               <a key={link.id || i} href={link.url} target="_blank" rel="noreferrer" className="w-full py-4 px-6 rounded-2xl font-bold shadow-md hover:scale-[1.02] active:scale-[0.98] transition-all relative overflow-hidden group flex justify-between items-center" style={{ backgroundColor: link.cor_fundo || config.cor_botoes, color: link.cor_texto || config.cor_texto_botoes }}>
                 {link.imagem_icone ? <img src={link.imagem_icone} className="w-10 h-10 object-contain" alt="" /> : <div className="w-10 h-10" /> }
                 <span className="flex-1 text-center text-[13px] uppercase tracking-wide">{link.titulo}</span>
                 <div className="w-10 h-10" /> 
               </a>
             ))}
           </div>
        </div>

        {produtosDestaque.length > 0 && (
          <div className="w-full mt-10 mb-2 flex flex-col items-center px-4">
            <h3 className="text-xs font-black uppercase tracking-widest mb-4 opacity-80 flex items-center gap-2" style={{ color: config.cor_texto }}>
              <Star size={14}/> Destaques da Loja
            </h3>
            <a href="/vitrine" onClick={(e) => { e.preventDefault(); window.location.href = "/vitrine"; }} className="w-full mb-6 py-4 px-4 rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl flex items-center justify-center gap-2 transition-transform hover:scale-[1.02] active:scale-[0.98] border border-white/20" style={{ backgroundColor: config.cor_botoes, color: config.cor_texto_botoes }}>
              <ShoppingBag size={18}/> Acessar o Catálogo
            </a>
            <div className="grid grid-cols-2 gap-3 w-full">
              {produtosDestaque.slice(0, 3).map((prod, index) => {
                 const imgUrl = prod.imagens?.[0] || prod.imagem_url;
                 return (
                   <a href={`/vitrine?produto=${prod.id}`} onClick={(e) => { e.preventDefault(); window.location.href = `/vitrine?produto=${prod.id}`; }} key={prod.id} className={`bg-white rounded-xl overflow-hidden shadow-md flex flex-col hover:scale-[1.02] transition-transform text-left ${index === 0 ? 'col-span-2' : 'col-span-1'}`}>
                     <div className="w-full bg-slate-50 overflow-hidden aspect-[4/3]">
                       <img src={imgUrl || `https://placehold.co/400?text=Produto`} className="w-full h-full object-cover" />
                     </div>
                     <div className="p-3 flex flex-col flex-1 bg-white">
                       <p className="text-[10px] font-bold text-slate-800 line-clamp-2 mb-1.5 leading-tight">{prod.nome}</p>
                       <p className="text-xs font-black text-slate-900 mt-auto">R$ {Number(prod.preco_promocional > 0 ? prod.preco_promocional : prod.preco).toFixed(2)}</p>
                     </div>
                   </a>
                 )
              })}
            </div>
          </div>
        )}
        <div className="mt-14 opacity-40 flex items-center justify-center gap-1.5 pb-6" style={{ color: config.cor_texto }}>
           <Globe size={12} />
           <span className="text-[9px] font-bold uppercase tracking-widest">{config.titulo || 'Portal Criarte'}</span>
        </div>
      </div>
    </div>
  );

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-slate-50"><Loader2 className="animate-spin text-slate-300 w-10 h-10" /></div>;

  if (isPublic) return <LivePreview />;

  // --- VISÃO ADMINISTRATIVA: MODO EDITOR FULLSCREEN ---
  return (
    <div className="fixed inset-0 z-[120] flex bg-slate-100 overflow-hidden animate-in fade-in zoom-in-95 duration-300">
      
      {/* SIDEBAR DO EDITOR */}
      <div className="w-[320px] shrink-0 bg-slate-900 border-r border-slate-800 flex flex-col h-full shadow-2xl z-20">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950">
          <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-slate-400 hover:text-white transition-colors">
            <ArrowLeft size={14} /> Sair
          </button>
          <Button onClick={handleSave} className="h-8 px-4 bg-emerald-500 hover:bg-emerald-600 text-white rounded text-[10px] font-bold uppercase tracking-widest transition-all">
            {saved ? <Check size={14} /> : "Salvar"}
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto no-scrollbar pb-10">
           <AccordionItem title="Capa e Textos" icon={LayoutTemplate} isOpen={openSection === 'textos'} onClick={() => setOpenSection(openSection === 'textos' ? '' : 'textos')}>
              <div className="space-y-4">
                <div className="space-y-2 border-b border-slate-700/50 pb-4">
                   <label className="text-[10px] font-bold uppercase text-slate-500 tracking-widest">Fundo da Capa</label>
                   <div className="flex gap-2">
                      <div className="relative w-8 h-8 rounded border border-slate-700 shrink-0" style={{ backgroundColor: config.cor_capa || '#cbd5e1' }}>
                        <input type="color" value={config.cor_capa || '#cbd5e1'} onChange={(e) => setConfig({...config, cor_capa: e.target.value})} className="absolute -inset-2 w-12 h-12 opacity-0 cursor-pointer" />
                      </div>
                      <div className="relative flex-1">
                        <input type="file" accept="image/*" onChange={(e) => handleImageUpload(e, 'capa_url')} className="absolute inset-0 opacity-0 cursor-pointer z-10" />
                        <Button variant="outline" className="w-full h-8 rounded border-dashed border-slate-600 bg-slate-800 text-slate-300 font-bold uppercase text-[9px] hover:bg-slate-700">
                           <Upload size={12} className="mr-1.5"/> Imagem
                        </Button>
                      </div>
                      {config.capa_url && <button onClick={() => setConfig({...config, capa_url: ''})} className="bg-red-500 text-white p-1.5 rounded"><Trash2 size={12}/></button>}
                   </div>
                </div>

                <div className="space-y-1.5 pt-2">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Título Principal</label>
                  <Input value={config.titulo || ''} onChange={(e) => setConfig({...config, titulo: e.target.value})} className="h-8 text-xs bg-slate-800 border-slate-700 text-white focus:border-slate-500" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase text-slate-500 tracking-widest">Descrição (Bio)</label>
                  <textarea value={config.descricao || ''} onChange={(e) => setConfig({...config, descricao: e.target.value})} className="w-full h-20 p-2 bg-slate-800 border border-slate-700 rounded text-[10px] text-white resize-none outline-none focus:border-slate-500" />
                </div>
              </div>
           </AccordionItem>

           <AccordionItem title="Cores Globais" icon={Palette} isOpen={openSection === 'cores'} onClick={() => setOpenSection(openSection === 'cores' ? '' : 'cores')}>
              <div className="grid grid-cols-1 gap-3">
                {[
                  { label: 'Cor do Fundo', field: 'cor_fundo', def: '#f8fafc' },
                  { label: 'Texto Principal', field: 'cor_texto', def: '#1e293b' },
                  { label: 'Fundo dos Botões', field: 'cor_botoes', def: '#f472b6' },
                  { label: 'Texto dos Botões', field: 'cor_texto_botoes', def: '#ffffff' }
                ].map(item => (
                  <div key={item.field} className="space-y-1">
                    <label className="text-[9px] font-bold uppercase text-slate-500">{item.label}</label>
                    <div className="flex gap-2 items-center">
                      <div className="relative w-7 h-7 rounded border border-slate-700 shrink-0" style={{ backgroundColor: config?.[item.field] || item.def }}>
                        <input type="color" value={config?.[item.field] || item.def} onChange={(e) => setConfig({...config, [item.field]: e.target.value})} className="absolute -inset-2 w-12 h-12 opacity-0 cursor-pointer" />
                      </div>
                      <Input value={config?.[item.field] || ''} onChange={(e) => setConfig({...config, [item.field]: e.target.value})} className="h-7 font-mono text-[9px] uppercase bg-slate-800 border-slate-700 text-white" />
                    </div>
                  </div>
                ))}
              </div>
           </AccordionItem>

           <AccordionItem title="Botões de Link" icon={LinkIcon} isOpen={openSection === 'links'} onClick={() => setOpenSection(openSection === 'links' ? '' : 'links')}>
              <div className="space-y-4">
                 {config.links?.map((link, index) => (
                   <div key={link.id} className="bg-slate-800 p-3 rounded border border-slate-700 space-y-3 relative group">
                     <button onClick={() => removeLink(link.id)} className="absolute -top-2 -right-2 bg-red-500 text-white p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 size={10}/></button>
                     
                     <div className="flex gap-2">
                       <div className="w-8 h-8 rounded bg-slate-900 border border-slate-700 flex items-center justify-center relative overflow-hidden shrink-0">
                         {link.imagem_icone ? <img src={link.imagem_icone} className="w-5 h-5 object-contain"/> : <ImageIcon size={14} className="text-slate-500"/>}
                         <input type="file" accept="image/*" onChange={(e) => handleLinkIconUpload(e, link.id)} className="absolute inset-0 opacity-0 cursor-pointer" />
                       </div>
                       <Input value={link.titulo} onChange={e => updateLink(link.id, 'titulo', e.target.value)} placeholder="Título" className="h-8 text-[10px] bg-slate-900 border-slate-700 text-white flex-1" />
                     </div>
                     <Input value={link.url} onChange={e => updateLink(link.id, 'url', e.target.value)} placeholder="https://..." className="h-7 text-[9px] bg-slate-900 border-slate-700 text-slate-400" />
                     
                     <div className="flex gap-2 pt-2 border-t border-slate-700/50">
                        <div className="relative w-6 h-6 rounded border border-slate-600 shrink-0" style={{ backgroundColor: link.cor_fundo || config.cor_botoes }}>
                           <input type="color" value={link.cor_fundo || config.cor_botoes} onChange={e => updateLink(link.id, 'cor_fundo', e.target.value)} className="absolute inset-0 opacity-0 cursor-pointer w-full h-full" />
                        </div>
                        <div className="relative w-6 h-6 rounded border border-slate-600 shrink-0" style={{ backgroundColor: link.cor_texto || config.cor_texto_botoes }}>
                           <input type="color" value={link.cor_texto || config.cor_texto_botoes} onChange={e => updateLink(link.id, 'cor_texto', e.target.value)} className="absolute inset-0 opacity-0 cursor-pointer w-full h-full" />
                        </div>
                     </div>
                   </div>
                 ))}
                 <Button onClick={addLink} variant="outline" className="w-full h-8 border-dashed border-slate-600 font-bold uppercase text-[9px] bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800 hover:border-slate-500">
                   <Plus size={12} className="mr-1.5"/> Add Link
                 </Button>
              </div>
           </AccordionItem>

           <AccordionItem title="Banners Promocionais" icon={ImageIcon} isOpen={openSection === 'banners'} onClick={() => setOpenSection(openSection === 'banners' ? '' : 'banners')}>
              <div className="space-y-4">
                 {config.banners?.map((banner) => (
                   <div key={banner.id} className="bg-slate-800 p-3 rounded border border-slate-700 space-y-3 relative group">
                     <button onClick={() => removeBanner(banner.id)} className="absolute -top-2 -right-2 bg-red-500 text-white p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 size={10}/></button>

                     <div className="flex gap-2">
                       <div className="relative flex-1">
                         <input type="file" accept="image/*" onChange={(e) => handleBannerUpload(e, banner.id)} className="absolute inset-0 opacity-0 cursor-pointer z-10" />
                         <Button variant="outline" className="w-full h-8 rounded border-dashed border-slate-600 bg-slate-900 text-slate-400 font-bold uppercase text-[9px] hover:bg-slate-800">
                           <Upload size={12} className="mr-1.5"/> {banner.imagem_url ? "Trocar Banner" : "Subir Imagem"}
                         </Button>
                       </div>
                     </div>
                     {banner.imagem_url && (
                       <div className="aspect-square rounded overflow-hidden border border-slate-700 relative bg-slate-950">
                         <img src={banner.imagem_url} className="w-full h-full object-cover" />
                       </div>
                     )}
                     
                     <div className="space-y-2 pt-2 border-t border-slate-700/50">
                        <textarea value={banner.descricao || ''} onChange={e => updateBanner(banner.id, 'descricao', e.target.value)} placeholder="Descrição (Opcional)" className="w-full h-12 p-2 bg-slate-900 border border-slate-700 rounded text-[9px] text-white resize-none outline-none" />
                        <Input value={banner.link || ''} onChange={(e) => updateBanner(banner.id, 'link', e.target.value)} placeholder="Link (https://...)" className="h-7 text-[9px] bg-slate-900 border-slate-700 text-slate-400" />
                        {banner.link && (
                           <Input value={banner.botao_texto || ''} onChange={(e) => updateBanner(banner.id, 'botao_texto', e.target.value)} placeholder="Texto do Botão (Ex: Acessar)" className="h-7 text-[9px] font-bold bg-slate-900 border-slate-700 text-white" />
                        )}
                     </div>
                   </div>
                 ))}
                 <Button onClick={addBanner} variant="outline" className="w-full h-8 border-dashed border-slate-600 font-bold uppercase text-[9px] bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800 hover:border-slate-500">
                   <Plus size={12} className="mr-1.5"/> Add Banner
                 </Button>
              </div>
           </AccordionItem>
        </div>

        <div className="p-4 border-t border-slate-800 bg-slate-950">
           <Button onClick={copyBioLink} variant="outline" className="w-full h-8 bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700 font-bold uppercase text-[9px] tracking-widest gap-2">
             <Copy size={12} /> Copiar Link da Bio
           </Button>
        </div>
      </div>

      {/* ÁREA DE PREVIEW (LIVE) */}
      <div className="flex-1 h-full overflow-y-auto relative bg-[#f8fafc]">
        <LivePreview />
      </div>

      {/* OVERLAY DE CARREGAMENTO */}
      {isUploadingGlobal && (
        <div className="fixed inset-0 z-[999] bg-slate-900/60 backdrop-blur-sm flex flex-col items-center justify-center">
          <Loader2 className="animate-spin text-white w-10 h-10 mb-3" />
          <p className="text-white font-bold uppercase tracking-widest text-[10px] animate-pulse">Enviando Imagem...</p>
        </div>
      )}
    </div>
  );
}