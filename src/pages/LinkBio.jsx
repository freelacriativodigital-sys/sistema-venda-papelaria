import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Palette, Image as ImageIcon, Upload, Check, Trash2, 
  Copy, Loader2, Save, X, Link as LinkIcon, Plus, Globe, 
  LayoutTemplate, LayoutGrid, ChevronDown, ArrowLeft, Grid
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "../lib/supabase";

const compressImageToBlob = (file) => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new window.Image(); 
      img.src = event.target.result;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 1200; 
        const MAX_HEIGHT = 1200;
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

const EditorSection = ({ id, title, icon: Icon, openSection, setOpenSection, children }) => {
  const isOpen = openSection === id;
  return (
    <div className="lg:border-b lg:border-slate-700/50 pointer-events-auto">
      <button onClick={() => setOpenSection(isOpen ? '' : id)} className="hidden lg:flex w-full items-center justify-between p-3.5 hover:bg-slate-800 transition-colors">
        <div className="flex items-center gap-2.5 text-[10px] font-bold text-slate-300 uppercase tracking-widest">
          <Icon size={14} className="text-slate-400" /> {title}
        </div>
        <ChevronDown size={14} className={`text-slate-400 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      
      <div className={`
        ${isOpen ? 'fixed inset-x-0 bottom-[64px] bg-slate-900 z-[200] p-5 rounded-t-2xl shadow-[0_-20px_50px_rgba(0,0,0,0.7)] border-t border-slate-700 block' : 'hidden'}
        lg:static lg:inset-auto lg:bottom-auto lg:rounded-none lg:shadow-none lg:border-none lg:bg-transparent lg:z-auto lg:p-0
        lg:block ${isOpen ? 'lg:max-h-[1500px] lg:opacity-100 lg:p-4' : 'lg:max-h-0 lg:opacity-0 lg:overflow-hidden lg:p-0 lg:m-0'}
        transition-all duration-300 ease-in-out
      `}>
        <div className="flex lg:hidden items-center justify-between mb-5 border-b border-slate-800 pb-3 shrink-0">
           <div className="flex items-center gap-2 text-[11px] font-bold text-white uppercase tracking-widest">
             <Icon size={16} className="text-blue-400" /> {title}
           </div>
           <button onClick={() => setOpenSection('')} className="bg-slate-800 p-1.5 rounded-full text-slate-400 hover:text-white"><X size={14}/></button>
        </div>
        <div className="space-y-4 max-h-[60vh] overflow-y-auto lg:max-h-none lg:overflow-visible pb-6 lg:pb-0 no-scrollbar">
          {children}
        </div>
      </div>
    </div>
  );
};

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
    mostrar_loja: true,
    formato_imagens: 'quadrado',
    links: [],
    banners: []
  });

  const [logoLoja, setLogoLoja] = useState('');
  const [paletaCores, setPaletaCores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState(false);
  const [isUploadingGlobal, setIsUploadingGlobal] = useState(false);
  const [openSection, setOpenSection] = useState('');
  const [activeTab, setActiveTab] = useState('links'); // 'links' | 'catalogo'

  useEffect(() => {
    async function loadData() {
      const { data: configData } = await supabase.from('bio_config').select('*').eq('id', 1).single();
      if (configData) {
        setConfig({
          ...configData,
          cor_capa: configData.cor_capa || '#cbd5e1',
          mostrar_loja: configData.mostrar_loja ?? true,
          formato_imagens: configData.formato_imagens || 'quadrado',
          links: configData.links || [],
          banners: configData.banners || [] 
        });
      }

      const { data: configLoja } = await supabase.from('configuracoes').select('logo_url, paleta_cores').eq('id', 1).single();
      if (configLoja) {
        setLogoLoja(configLoja.logo_url);
        setPaletaCores(configLoja.paleta_cores || []);
      }

      setLoading(false);
    }
    loadData();
  }, []);

  const handleSave = async () => {
    const { error } = await supabase.from('bio_config').update(config).eq('id', 1);
    if (!error) {
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
      setOpenSection(''); 
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

  const PaletaSugestoes = ({ field, isLink = false, linkId = null }) => {
    if (!paletaCores || paletaCores.length === 0) return null;
    return (
      <div className="flex flex-wrap gap-1.5 mt-2">
        <span className="text-[7px] text-slate-500 font-bold uppercase w-full">Cores da sua Marca:</span>
        {paletaCores.map(cor => (
          <button
            key={cor}
            onClick={() => {
              if (isLink) updateLink(linkId, field, cor);
              else setConfig({...config, [field]: cor});
            }}
            className="w-4 h-4 rounded-full border border-slate-600 shadow-sm hover:scale-125 transition-transform"
            style={{ backgroundColor: cor }}
            title={cor}
          />
        ))}
      </div>
    );
  };

  const LivePreview = () => {
    const isCatalogo = activeTab === 'catalogo';

    return (
      <div className="min-h-screen w-full flex flex-col items-center justify-start transition-colors duration-500 overflow-x-hidden bg-slate-100 lg:py-10">
        
        <div className={`w-full lg:max-w-[420px] flex flex-col items-center animate-in fade-in zoom-in-95 duration-500 relative bg-white shadow-2xl min-h-screen lg:min-h-[800px] lg:rounded-[2.5rem] lg:border-[6px] lg:border-slate-800 overflow-hidden ${isCatalogo ? '' : 'pb-28 lg:pb-10'}`} style={{ backgroundColor: config.cor_fundo, borderColor: `${config.cor_texto}10` }}>
          
          {isCatalogo ? (
             // TELA CHEIA: CATÁLOGO INTEGRADO
             <>
               {/* Menu Flutuante Desktop (Apenas Visível no PC para voltar pros links) */}
               {config.mostrar_loja && (
                 <div className="hidden md:flex absolute top-6 inset-x-6 z-50 bg-black/50 backdrop-blur-md p-1.5 rounded-full items-center shadow-2xl border border-white/10">
                   <div className="absolute inset-y-1.5 w-[calc(50%-4px)] rounded-full transition-all duration-300 ease-out" 
                        style={{ backgroundColor: config.cor_botoes, left: 'calc(50% + 2px)' }} />
                   <button onClick={() => setActiveTab('links')} className="flex-1 py-2 text-[11px] font-bold uppercase tracking-widest relative z-10 transition-colors text-white hover:text-white/80">Links Rápidos</button>
                   <button onClick={() => setActiveTab('catalogo')} className="flex-1 py-2 text-[11px] font-bold uppercase tracking-widest relative z-10 transition-colors" style={{ color: config.cor_texto_botoes }}>Catálogo</button>
                 </div>
               )}

               <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none gap-3 z-0 bg-slate-50">
                  <Loader2 className="w-6 h-6 animate-spin text-slate-300" />
                  <span className="text-[9px] font-bold uppercase tracking-widest text-slate-400">Carregando Site...</span>
               </div>

               <iframe 
                 src="/vitrine" 
                 className="w-full h-full absolute inset-0 z-10 bg-transparent border-0"
                 title="Catálogo Integrado"
                 onLoad={(e) => {
                   try {
                     const iframeUrl = e.target.contentWindow.location.href;
                     // MÁGICA: Se o cliente clicou em um produto, a Bio desaparece e ele vai pra tela oficial de compra!
                     if (iframeUrl.includes('?produto=')) {
                       window.top.location.href = iframeUrl;
                     }
                   } catch (err) {}
                 }}
               />
             </>
          ) : (
             // TELA NORMAL: BIO E LINKS
             <>
                <div className={`w-full h-32 md:h-40 overflow-hidden shadow-sm relative shrink-0 transition-colors ${config.capa_url ? 'block lg:hidden' : 'block'}`} style={{ backgroundColor: config.cor_capa || '#cbd5e1' }}>
                   {config.capa_url && <><img src={config.capa_url} className="w-full h-full object-cover block lg:hidden" /><div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent block lg:hidden"></div></>}
                </div>
                
                <div className="w-24 h-24 md:w-28 md:h-28 rounded-full overflow-hidden border-[4px] shadow-lg relative z-10 shrink-0 -mt-12 md:-mt-14 bg-white flex items-center justify-center" style={{ borderColor: config.cor_fundo }}>
                  {logoLoja ? <img src={logoLoja} className="w-full h-full object-contain p-1 bg-white" alt={config.titulo} /> : <div className="w-full h-full bg-slate-200"></div>}
                </div>
                
                <div className="px-4 mt-3 md:mt-5 flex flex-col items-center w-full">
                   <h1 className="text-xl md:text-2xl font-black text-center mb-2" style={{ color: config.cor_texto }}>{config.titulo}</h1>
                   {config.descricao && <p className="text-center text-sm md:text-[15px] font-medium mb-6 md:mb-8 opacity-80 leading-relaxed max-w-sm" style={{ color: config.cor_texto }}>{config.descricao}</p>}

                   {config.mostrar_loja && (
                     <div className="hidden md:flex w-full max-w-[280px] bg-black/5 p-1.5 rounded-full items-center mb-6 relative border border-black/5" style={{ borderColor: `${config.cor_texto}15` }}>
                       <div className="absolute inset-y-1.5 w-[calc(50%-4px)] rounded-full transition-all duration-300 ease-out" 
                            style={{ backgroundColor: config.cor_botoes, left: '6px' }} />
                       <button onClick={() => setActiveTab('links')} className="flex-1 py-2.5 text-[11px] font-bold uppercase tracking-widest relative z-10 transition-colors" style={{ color: config.cor_texto_botoes }}>Links</button>
                       <button onClick={() => setActiveTab('catalogo')} className="flex-1 py-2.5 text-[11px] font-bold uppercase tracking-widest relative z-10 transition-colors" style={{ color: config.cor_texto }}>Catálogo</button>
                     </div>
                   )}

                   <div className="w-full max-w-sm animate-in fade-in duration-300">
                     {config.banners?.length > 0 && (
                       <div className="w-full flex flex-col gap-6 mb-6">
                         {config.banners.map(banner => {
                           if (!banner.imagem_url) return null;
                           return (
                           <div key={banner.id} className="w-full rounded-2xl overflow-hidden shadow-lg flex flex-col bg-white/5 border border-black/5" style={{ borderColor: `${config.cor_texto}20`}}>
                             <img src={banner.imagem_url} className="w-full object-cover" alt="Banner Promo" />
                             {(banner.descricao || banner.link) && (
                                <div className="p-5 flex flex-col gap-4 items-center" style={{ backgroundColor: `${config.cor_botoes}15` }}>
                                  {banner.descricao && <p className="text-[13px] md:text-sm font-medium text-center leading-relaxed" style={{ color: config.cor_texto }}>{banner.descricao}</p>}
                                  {banner.link && (
                                     <a href={banner.link} target="_blank" rel="noreferrer" className="w-full py-3 md:py-4 rounded-xl text-center font-bold text-[11px] md:text-xs uppercase tracking-widest shadow-md hover:scale-[1.02] active:scale-95 transition-transform" style={{ backgroundColor: config.cor_botoes, color: config.cor_texto_botoes }}>
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
                         <a key={link.id || i} href={link.url} target="_blank" rel="noreferrer" className="w-full py-4 px-6 rounded-2xl font-bold shadow-md hover:scale-[1.02] active:scale-[0.98] transition-all relative overflow-hidden group flex justify-between items-center border border-black/5" style={{ backgroundColor: link.cor_fundo || config.cor_botoes, color: link.cor_texto || config.cor_texto_botoes }}>
                           {link.imagem_icone ? <img src={link.imagem_icone} className="w-10 h-10 object-contain drop-shadow-sm" alt="" /> : <div className="w-10 h-10" /> }
                           <span className="flex-1 text-center text-[12px] md:text-[13px] uppercase tracking-wide drop-shadow-sm">{link.titulo}</span>
                           <div className="w-10 h-10" /> 
                         </a>
                       ))}
                     </div>
                   </div>
                </div>

                <div className="mt-auto opacity-40 flex items-center justify-center gap-1.5 pt-10" style={{ color: config.cor_texto }}>
                   <Globe size={12} />
                   <span className="text-[9px] font-bold uppercase tracking-widest">{config.titulo || 'Portal Criarte'}</span>
                </div>
             </>
          )}

          {/* NAVEGAÇÃO FIXA DE APP PREMIUM (MOBILE ONLY) SEMPRE VISÍVEL SOBRE O IFRAME */}
          {config.mostrar_loja && (
            <div 
              className="md:hidden fixed bottom-0 inset-x-0 z-[90] flex justify-around items-center px-4 py-2 backdrop-blur-xl shadow-[0_-10px_30px_rgba(0,0,0,0.06)] pb-safe" 
              style={{ backgroundColor: `${config.cor_fundo}E6`, borderTop: `1px solid ${config.cor_texto}15` }}
            >
              <button
                onClick={() => setActiveTab('links')}
                className="flex flex-col items-center justify-center gap-1 w-24 py-1 transition-all relative group"
                style={{ color: activeTab === 'links' ? config.cor_botoes : `${config.cor_texto}70` }}
              >
                {activeTab === 'links' && <div className="absolute -top-3 w-10 h-1 rounded-full animate-in fade-in" style={{ backgroundColor: config.cor_botoes }}></div>}
                <LinkIcon size={22} className={`transition-transform duration-300 ${activeTab === 'links' ? '-translate-y-1' : ''}`} />
                <span className={`text-[9px] uppercase tracking-widest ${activeTab === 'links' ? 'font-black' : 'font-semibold'}`}>
                  LINKS
                </span>
              </button>

              <button
                onClick={() => setActiveTab('catalogo')}
                className="flex flex-col items-center justify-center gap-1 w-24 py-1 transition-all relative group"
                style={{ color: activeTab === 'catalogo' ? config.cor_botoes : `${config.cor_texto}70` }}
              >
                {activeTab === 'catalogo' && <div className="absolute -top-3 w-10 h-1 rounded-full animate-in fade-in" style={{ backgroundColor: config.cor_botoes }}></div>}
                <LayoutGrid size={22} className={`transition-transform duration-300 ${activeTab === 'catalogo' ? '-translate-y-1' : ''}`} />
                <span className={`text-[9px] uppercase tracking-widest ${activeTab === 'catalogo' ? 'font-black' : 'font-semibold'}`}>
                  CATÁLOGO
                </span>
              </button>
            </div>
          )}

        </div>
      </div>
    );
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-slate-50"><Loader2 className="animate-spin text-slate-300 w-10 h-10" /></div>;

  if (isPublic) return <LivePreview />;

  return (
    <div className="fixed inset-0 z-[120] flex bg-slate-100 overflow-hidden animate-in fade-in zoom-in-95 duration-300">
      
      {/* CONTAINER DO EDITOR */}
      <div className="absolute inset-0 z-[140] pointer-events-none lg:static lg:w-[320px] lg:shrink-0 lg:bg-slate-900 lg:border-r lg:border-slate-800 lg:shadow-2xl lg:z-20 lg:pointer-events-auto flex flex-col h-full">
        
        <div className="hidden lg:flex p-4 border-b border-slate-800 items-center justify-between bg-slate-950 pointer-events-auto">
          <button onClick={() => navigate('/app')} className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-slate-400 hover:text-white transition-colors">
            <ArrowLeft size={14} /> Sair
          </button>
          <Button onClick={handleSave} className="h-8 px-4 bg-emerald-500 hover:bg-emerald-600 text-white rounded text-[10px] font-bold uppercase tracking-widest transition-all">
            {saved ? <Check size={14} /> : "Salvar"}
          </Button>
        </div>

        <div className="flex-1 lg:overflow-y-auto no-scrollbar lg:pb-10 pointer-events-none lg:pointer-events-auto">
           <EditorSection id="textos" title="Capa e Textos" icon={LayoutTemplate} openSection={openSection} setOpenSection={setOpenSection}>
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
                 <PaletaSugestoes field="cor_capa" />
                 <p className="text-[8px] text-slate-500 font-medium uppercase tracking-widest text-center mt-1">Medida: 800 x 300 px</p>
              </div>

              <div className="space-y-1.5 pt-2">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Título Principal</label>
                <Input value={config.titulo || ''} onChange={(e) => setConfig({...config, titulo: e.target.value})} className="h-8 text-xs bg-slate-800 border-slate-700 text-white focus:border-slate-500" />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase text-slate-500 tracking-widest">Descrição (Bio)</label>
                <textarea value={config.descricao || ''} onChange={(e) => setConfig({...config, descricao: e.target.value})} className="w-full h-20 p-2 bg-slate-800 border border-slate-700 rounded text-[10px] text-white resize-none outline-none focus:border-slate-500" />
              </div>
           </EditorSection>

           <EditorSection id="layout" title="Aba do Catálogo" icon={LayoutGrid} openSection={openSection} setOpenSection={setOpenSection}>
              <div className="space-y-4">
                 <div className="flex items-center justify-between bg-slate-800 p-2.5 rounded-md">
                   <span className="text-[10px] font-bold uppercase text-slate-300">Mostrar Aba Catálogo</span>
                   <button onClick={() => setConfig({...config, mostrar_loja: !config.mostrar_loja})} className={`w-8 h-4 rounded-full p-0.5 transition-all ${config.mostrar_loja ? 'bg-emerald-500' : 'bg-slate-600'}`}>
                     <div className={`w-3 h-3 bg-white rounded-full transition-transform ${config.mostrar_loja ? 'translate-x-4' : 'translate-x-0'}`} />
                   </button>
                 </div>
                 <p className="text-[9px] text-slate-400 font-medium leading-relaxed">A aba "Catálogo" exibirá o seu site/vitrine completo integrado diretamente na sua página de Bio. Os clientes poderão navegar livremente por lá!</p>
              </div>
           </EditorSection>

           <EditorSection id="cores" title="Cores Globais" icon={Palette} openSection={openSection} setOpenSection={setOpenSection}>
              <div className="grid grid-cols-1 gap-3">
                {[
                  { label: 'Cor do Fundo', field: 'cor_fundo', def: '#f8fafc' },
                  { label: 'Texto Principal', field: 'cor_texto', def: '#1e293b' },
                  { label: 'Fundo dos Botões', field: 'cor_botoes', def: '#f472b6' },
                  { label: 'Texto dos Botões', field: 'cor_texto_botoes', def: '#ffffff' }
                ].map(item => (
                  <div key={item.field} className="space-y-2 bg-slate-800 p-2 rounded border border-slate-700">
                    <label className="text-[9px] font-bold uppercase text-slate-400">{item.label}</label>
                    <div className="flex gap-2 items-center">
                      <div className="relative w-7 h-7 rounded border border-slate-600 shrink-0" style={{ backgroundColor: config?.[item.field] || item.def }}>
                        <input type="color" value={config?.[item.field] || item.def} onChange={(e) => setConfig({...config, [item.field]: e.target.value})} className="absolute -inset-2 w-12 h-12 opacity-0 cursor-pointer" />
                      </div>
                      <Input value={config?.[item.field] || ''} onChange={(e) => setConfig({...config, [item.field]: e.target.value})} className="h-7 font-mono text-[9px] uppercase bg-slate-900 border-slate-600 text-white" />
                    </div>
                    <PaletaSugestoes field={item.field} />
                  </div>
                ))}
              </div>
           </EditorSection>

           <EditorSection id="links" title="Botões de Link" icon={LinkIcon} openSection={openSection} setOpenSection={setOpenSection}>
              <div className="space-y-4">
                 {config.links?.map((link, index) => (
                   <div key={link.id} className="bg-slate-800 p-3 rounded border border-slate-700 space-y-3 relative group">
                     <button onClick={() => removeLink(link.id)} className="absolute -top-2 -right-2 bg-red-500 text-white p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity z-10"><Trash2 size={10}/></button>
                     
                     <div className="flex gap-2 items-start">
                       <div className="flex flex-col items-center gap-1">
                         <div className="w-8 h-8 rounded bg-slate-900 border border-slate-700 flex items-center justify-center relative overflow-hidden shrink-0">
                           {link.imagem_icone ? <img src={link.imagem_icone} className="w-5 h-5 object-contain"/> : <ImageIcon size={14} className="text-slate-500"/>}
                           <input type="file" accept="image/*" onChange={(e) => handleLinkIconUpload(e, link.id)} className="absolute inset-0 opacity-0 cursor-pointer" />
                         </div>
                         <span className="text-[6px] text-slate-500 font-bold uppercase tracking-widest text-center">100x100px</span>
                       </div>
                       <Input value={link.titulo} onChange={e => updateLink(link.id, 'titulo', e.target.value)} placeholder="Título" className="h-8 text-[10px] bg-slate-900 border-slate-700 text-white flex-1" />
                     </div>
                     <Input value={link.url} onChange={e => updateLink(link.id, 'url', e.target.value)} placeholder="https://..." className="h-7 text-[9px] bg-slate-900 border-slate-700 text-slate-400" />
                     
                     <div className="flex flex-col gap-2 pt-2 border-t border-slate-700/50">
                        <div className="flex gap-2">
                          <div className="relative w-6 h-6 rounded border border-slate-600 shrink-0" style={{ backgroundColor: link.cor_fundo || config.cor_botoes }}>
                             <input type="color" value={link.cor_fundo || config.cor_botoes} onChange={e => updateLink(link.id, 'cor_fundo', e.target.value)} className="absolute inset-0 opacity-0 cursor-pointer w-full h-full" />
                          </div>
                          <span className="text-[9px] text-slate-400 flex items-center">Fundo</span>
                          
                          <div className="relative w-6 h-6 rounded border border-slate-600 shrink-0 ml-2" style={{ backgroundColor: link.cor_texto || config.cor_texto_botoes }}>
                             <input type="color" value={link.cor_texto || config.cor_texto_botoes} onChange={e => updateLink(link.id, 'cor_texto', e.target.value)} className="absolute inset-0 opacity-0 cursor-pointer w-full h-full" />
                          </div>
                          <span className="text-[9px] text-slate-400 flex items-center">Texto</span>
                        </div>
                        
                        <div className="flex gap-4">
                           <div className="flex-1"><PaletaSugestoes field="cor_fundo" isLink={true} linkId={link.id} /></div>
                           <div className="flex-1"><PaletaSugestoes field="cor_texto" isLink={true} linkId={link.id} /></div>
                        </div>
                     </div>
                   </div>
                 ))}
                 <Button onClick={addLink} variant="outline" className="w-full h-8 border-dashed border-slate-600 font-bold uppercase text-[9px] bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800 hover:border-slate-500">
                   <Plus size={12} className="mr-1.5"/> Add Link
                 </Button>
              </div>
           </EditorSection>

           <EditorSection id="banners" title="Banners Promo" icon={ImageIcon} openSection={openSection} setOpenSection={setOpenSection}>
              <div className="space-y-4">
                 {config.banners?.map((banner) => (
                   <div key={banner.id} className="bg-slate-800 p-3 rounded border border-slate-700 space-y-3 relative group">
                     <button onClick={() => removeBanner(banner.id)} className="absolute -top-2 -right-2 bg-red-500 text-white p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity z-10"><Trash2 size={10}/></button>

                     <div className="flex gap-2 flex-col">
                       <div className="relative flex-1">
                         <input type="file" accept="image/*" onChange={(e) => handleBannerUpload(e, banner.id)} className="absolute inset-0 opacity-0 cursor-pointer z-10" />
                         <Button variant="outline" className="w-full h-8 rounded border-dashed border-slate-600 bg-slate-900 text-slate-400 font-bold uppercase text-[9px] hover:bg-slate-800">
                           <Upload size={12} className="mr-1.5"/> {banner.imagem_url ? "Trocar Banner" : "Subir Imagem"}
                         </Button>
                       </div>
                       <span className="text-[7px] text-slate-500 font-bold uppercase tracking-widest text-center mt-1">Medida: 1200 x 1200 px</span>
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
           </EditorSection>
        </div>

        {/* FOOTER DESKTOP ONLY */}
        <div className="hidden lg:block p-4 border-t border-slate-800 bg-slate-950 pointer-events-auto">
           <Button onClick={copyBioLink} variant="outline" className="w-full h-8 bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700 font-bold uppercase text-[9px] tracking-widest gap-2">
             <Copy size={12} /> Copiar Link da Bio
           </Button>
        </div>
      </div>

      {/* ÁREA DE PREVIEW (LIVE) */}
      <div className="flex-1 h-full overflow-y-auto relative bg-[#f8fafc] pb-[70px] lg:pb-0 z-10">
        
        {/* BOTÃO SAIR NO MOBILE E DESKTOP FLUTUANTE */}
        <button onClick={() => navigate('/app')} className="lg:hidden fixed top-4 left-4 z-[150] w-10 h-10 bg-slate-900/90 backdrop-blur text-white rounded-full flex items-center justify-center shadow-lg border border-slate-700">
          <ArrowLeft size={18} />
        </button>

        {/* MÁSCARA ESCURA QUANDO PAINEL MOBILE ESTÁ ABERTO */}
        {openSection && <div onClick={() => setOpenSection('')} className="lg:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-[150] transition-opacity pointer-events-auto" />}

        <LivePreview />

        {/* BARRA FIXA DE NAVEGAÇÃO NO MOBILE DO EDITOR */}
        <div className="lg:hidden fixed bottom-0 inset-x-0 h-[64px] bg-slate-950 border-t border-slate-800 flex items-center justify-around z-[160] px-1 pointer-events-auto">
          {[
            { id: 'textos', icon: LayoutTemplate, label: 'Perfil' },
            { id: 'layout', icon: LayoutGrid, label: 'Catálogo' },
            { id: 'cores', icon: Palette, label: 'Cores' },
            { id: 'links', icon: LinkIcon, label: 'Links' },
            { id: 'banners', icon: ImageIcon, label: 'Banners' }
          ].map(tab => (
            <button key={tab.id} onClick={() => setOpenSection(openSection === tab.id ? '' : tab.id)} className={`flex flex-col items-center justify-center flex-1 h-full gap-1.5 transition-colors ${openSection === tab.id ? 'text-blue-400' : 'text-slate-500 hover:text-slate-300'}`}>
               <tab.icon size={18} className={openSection === tab.id ? 'animate-pulse' : ''} />
               <span className="text-[7px] font-bold uppercase tracking-wider">{tab.label}</span>
            </button>
          ))}
          <div className="w-[1px] h-8 bg-slate-800 mx-1"></div>
          <button onClick={handleSave} className="flex flex-col items-center justify-center w-14 h-full gap-1.5 text-emerald-500 hover:text-emerald-400 transition-colors">
             {saved ? <Check size={20} /> : <Save size={20} />}
             <span className="text-[7px] font-bold uppercase tracking-wider">Salvar</span>
          </button>
        </div>
      </div>

      {/* OVERLAY DE CARREGAMENTO GLOBAL DE IMAGENS */}
      {isUploadingGlobal && (
        <div className="fixed inset-0 z-[999] bg-slate-900/60 backdrop-blur-sm flex flex-col items-center justify-center pointer-events-auto">
          <Loader2 className="animate-spin text-white w-12 h-12 mb-4" />
          <p className="text-white font-bold uppercase tracking-widest text-xs animate-pulse">Enviando Imagem...</p>
        </div>
      )}
    </div>
  );
}