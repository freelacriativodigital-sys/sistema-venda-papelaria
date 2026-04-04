import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Palette, Image as ImageIcon, Upload, Check, Trash2, 
  Copy, Loader2, Save, Link as LinkIcon, Plus, Globe, 
  LayoutGrid, ArrowLeft, Store, Smartphone
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "../lib/supabase";

// --- MÓDULO DE COMPRESSÃO DE IMAGENS ---
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

export default function LinkBio({ isPublic = false }) {
  const navigate = useNavigate();
  const [config, setConfig] = useState({
    capa_url: '',
    fundo_url: '',
    cor_capa: '#cbd5e1', 
    titulo: 'Portal Criarte',
    descricao: 'Tudo feito com muito carinho.',
    cor_fundo: '#f8fafc',
    cor_botoes: '#f472b6',
    cor_texto_botoes: '#ffffff',
    cor_texto: '#1e293b',
    mostrar_loja: true,
    formato_imagens: 'quadrado',
    estilo_botao: 'rounded-2xl',
    links: [],
    banners: []
  });

  const [logoLoja, setLogoLoja] = useState('');
  const [paletaCores, setPaletaCores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState(false);
  const [isUploadingGlobal, setIsUploadingGlobal] = useState(false);
  const [activeTab, setActiveTab] = useState('links'); 
  const [mobileView, setMobileView] = useState('editor'); // 'editor' | 'preview'

  useEffect(() => {
    async function loadData() {
      const { data: configData } = await supabase.from('bio_config').select('*').eq('id', 1).single();
      if (configData) {
        setConfig({
          ...configData,
          cor_capa: configData.cor_capa || '#cbd5e1',
          mostrar_loja: configData.mostrar_loja ?? true,
          formato_imagens: configData.formato_imagens || 'quadrado',
          estilo_botao: configData.estilo_botao || 'rounded-2xl',
          fundo_url: configData.fundo_url || '',
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

  // RADAR DO IFRAME (Catálogo Integrado)
  useEffect(() => {
    let intervalId;
    if (activeTab === 'catalogo') {
      intervalId = setInterval(() => {
        try {
          const iframe = document.getElementById('iframe-catalogo');
          if (iframe && iframe.contentWindow) {
            const url = iframe.contentWindow.location.href;
            if (url.includes('?produto=')) {
              if (isPublic) {
                window.top.location.href = url; // Expulsa o iframe e abre na tela inteira
              }
            }
          }
        } catch (err) {}
      }, 500);
    }
    return () => clearInterval(intervalId);
  }, [activeTab, isPublic]);

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
        const url = await uploadToSupabase(file, field);
        setConfig({ ...config, [field]: url });
      } catch (err) { alert("Erro no upload: " + err.message); } 
      finally { setIsUploadingGlobal(false); }
    }
  };

  const updateLink = (id, field, value) => setConfig({ ...config, links: config.links.map(l => l.id === id ? { ...l, [field]: value } : l) });
  
  // --- MÓDULO: VISUALIZAÇÃO (PREVIEW) ---
  const BioPreview = ({ isEditorMode = false }) => {
    const isCatalogo = activeTab === 'catalogo';

    const BottomNavBar = () => {
      if (!config.mostrar_loja) return null;
      return (
        <div 
          className={`z-[90] flex justify-around items-center px-4 py-2 backdrop-blur-xl shadow-[0_-10px_40px_rgba(0,0,0,0.15)] pb-safe ${isPublic ? 'fixed bottom-0 inset-x-0 md:rounded-full md:bottom-6 md:w-[320px] md:left-1/2 md:-translate-x-1/2' : 'absolute bottom-0 inset-x-0 rounded-b-[2rem]'}`} 
          style={{ backgroundColor: `${config.cor_fundo}FA`, borderTop: `1px solid ${config.cor_texto}15` }}
        >
          <button onClick={() => setActiveTab('links')} className="flex flex-col items-center justify-center gap-1.5 w-24 py-1.5 transition-all relative" style={{ color: activeTab === 'links' ? config.cor_botoes : `${config.cor_texto}70` }}>
            {activeTab === 'links' && <div className="absolute -top-1.5 w-10 h-1 rounded-full" style={{ backgroundColor: config.cor_botoes }}></div>}
            <LinkIcon size={20} className={activeTab === 'links' ? '-translate-y-1 transition-transform' : ''} />
            <span className={`text-[8.5px] uppercase tracking-widest ${activeTab === 'links' ? 'font-black' : 'font-semibold'}`}>LINKS</span>
          </button>

          <button onClick={() => setActiveTab('catalogo')} className="flex flex-col items-center justify-center gap-1.5 w-24 py-1.5 transition-all relative" style={{ color: activeTab === 'catalogo' ? config.cor_botoes : `${config.cor_texto}70` }}>
            {activeTab === 'catalogo' && <div className="absolute -top-1.5 w-10 h-1 rounded-full" style={{ backgroundColor: config.cor_botoes }}></div>}
            <LayoutGrid size={20} className={activeTab === 'catalogo' ? '-translate-y-1 transition-transform' : ''} />
            <span className={`text-[8.5px] uppercase tracking-widest ${activeTab === 'catalogo' ? 'font-black' : 'font-semibold'}`}>CATÁLOGO</span>
          </button>
        </div>
      );
    };

    if (isCatalogo) {
      return (
        <div className={`flex flex-col animate-in fade-in duration-300 bg-slate-50 ${isPublic ? 'fixed inset-0 z-50' : 'absolute inset-0 z-50 rounded-[2rem] overflow-hidden'}`}>
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none gap-3 z-0">
             <Loader2 className="w-6 h-6 animate-spin text-slate-300" />
             <span className="text-[9px] font-bold uppercase tracking-widest text-slate-400">Carregando Site...</span>
          </div>
          <iframe id="iframe-catalogo" src="/vitrine" className="w-full h-full absolute inset-0 z-10 bg-transparent border-0" title="Catálogo" />
          <BottomNavBar />
        </div>
      );
    }

    return (
      <div 
        className={`w-full flex flex-col items-center relative overflow-x-hidden ${isPublic ? 'min-h-screen bg-slate-100 lg:py-10' : 'h-full bg-transparent overflow-y-auto no-scrollbar'}`}
      >
        <div 
          className={`w-full flex flex-col items-center animate-in fade-in duration-500 relative bg-white shadow-2xl overflow-hidden ${isPublic ? 'lg:max-w-[420px] min-h-screen lg:min-h-[800px] lg:rounded-[2.5rem] lg:border-[6px] lg:border-slate-800 pb-28 lg:pb-24' : 'min-h-full rounded-[2rem] pb-24'}`} 
          style={{ 
            backgroundColor: config.cor_fundo, 
            backgroundImage: config.fundo_url ? `url(${config.fundo_url})` : 'none',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            borderColor: `${config.cor_texto}10` 
          }}
        >
          {/* Overlay escurecedor caso tenha imagem de fundo */}
          {config.fundo_url && <div className="absolute inset-0 bg-black/20 z-0"></div>}

          <div className={`w-full h-32 overflow-hidden shadow-sm relative shrink-0 z-10 ${config.capa_url ? 'block' : 'block'}`} style={{ backgroundColor: config.cor_capa || '#cbd5e1' }}>
             {config.capa_url && <><img src={config.capa_url} className="w-full h-full object-cover" /><div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent"></div></>}
          </div>
          
          <div className="w-24 h-24 rounded-full overflow-hidden border-[4px] shadow-lg relative z-20 shrink-0 -mt-12 bg-white flex items-center justify-center" style={{ borderColor: config.cor_fundo }}>
            {logoLoja ? <img src={logoLoja} className="w-full h-full object-contain p-1 bg-white" alt="Logo" /> : <div className="w-full h-full bg-slate-200"></div>}
          </div>
          
          <div className="px-4 mt-4 flex flex-col items-center w-full z-20">
             <h1 className="text-xl font-black text-center mb-1.5" style={{ color: config.fundo_url ? '#fff' : config.cor_texto }}>{config.titulo}</h1>
             {config.descricao && <p className="text-center text-[13px] font-medium mb-6 opacity-90 leading-relaxed max-w-xs" style={{ color: config.fundo_url ? '#e2e8f0' : config.cor_texto }}>{config.descricao}</p>}

             <div className="w-full max-w-[320px] flex flex-col gap-4">
                {config.banners?.map(banner => {
                  if (!banner.imagem_url) return null;
                  return (
                  <div key={banner.id} className="w-full rounded-2xl overflow-hidden shadow-lg flex flex-col bg-white/5 backdrop-blur-sm border border-white/10" style={{ borderColor: `${config.cor_texto}20`}}>
                    <img src={banner.imagem_url} className="w-full object-cover" alt="Banner" />
                    {(banner.descricao || banner.link) && (
                       <div className="p-4 flex flex-col gap-3 items-center" style={{ backgroundColor: `${config.cor_botoes}15` }}>
                         {banner.descricao && <p className="text-[13px] font-medium text-center" style={{ color: config.fundo_url ? '#fff' : config.cor_texto }}>{banner.descricao}</p>}
                         {banner.link && (
                            <a href={banner.link} target="_blank" rel="noreferrer" className={`w-full py-3.5 text-center font-bold text-[11px] uppercase tracking-widest shadow-md hover:scale-[1.02] active:scale-95 transition-transform ${config.estilo_botao}`} style={{ backgroundColor: config.cor_botoes, color: config.cor_texto_botoes }}>
                               {banner.botao_texto || 'Acessar Link'}
                            </a>
                         )}
                       </div>
                    )}
                  </div>
                )})}

                {config.links?.map((link) => (
                  <a key={link.id} href={link.url} target="_blank" rel="noreferrer" className={`w-full py-4 px-5 font-bold shadow-md hover:scale-[1.02] active:scale-[0.98] transition-all relative overflow-hidden flex justify-between items-center border border-white/10 ${config.estilo_botao}`} style={{ backgroundColor: link.cor_fundo || config.cor_botoes, color: link.cor_texto || config.cor_texto_botoes }}>
                    {link.imagem_icone ? <img src={link.imagem_icone} className="w-8 h-8 object-contain drop-shadow-sm" alt="" /> : <div className="w-8 h-8" /> }
                    <span className="flex-1 text-center text-[13px] uppercase tracking-wide drop-shadow-sm">{link.titulo}</span>
                    <div className="w-8 h-8" /> 
                  </a>
                ))}
             </div>
          </div>

          {/* LOGO ORGANIZE (Ancorada exatamente no rodapé do conteúdo bio) */}
          <div className="mt-auto w-full pt-16 pb-12 opacity-50 flex flex-col items-center justify-end gap-1.5 z-20">
             <span className="text-[7.5px] font-black uppercase tracking-[0.25em]" style={{ color: config.fundo_url ? '#fff' : config.cor_texto }}>Tecnologia</span>
             <img 
                src="https://yjfvdmpsnpvrpskmqrjt.supabase.co/storage/v1/object/public/produtos/LOGO%20ORGANIZE.png" 
                alt="Organize" 
                className="h-6 object-contain grayscale opacity-80" 
             />
          </div>

          <BottomNavBar />
        </div>
      </div>
    );
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-[#f4f7f8]"><Loader2 className="animate-spin text-blue-600" size={40} /></div>;

  if (isPublic) return <LivePreview />;

  // --- MÓDULO: EDITOR (ESTILO LINKME) ---
  return (
    <div className="min-h-screen flex flex-col bg-[#f4f7f8] font-sans">
      
      {/* HEADER DO EDITOR */}
      <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 shrink-0 sticky top-0 z-50 shadow-sm">
        <div className="flex items-center gap-4">
           <button onClick={() => navigate('/app')} className="p-2 -ml-2 rounded-full hover:bg-slate-100 text-slate-500 transition-colors">
             <ArrowLeft size={18} />
           </button>
           <h1 className="text-sm font-bold text-slate-800">Aparência da Bio</h1>
        </div>
        <div className="flex items-center gap-3">
           <Button onClick={copyBioLink} variant="outline" className="hidden md:flex h-9 px-4 border-slate-200 text-slate-600 rounded-lg text-[10px] font-bold uppercase tracking-widest gap-2">
             <Globe size={14} /> Link da Bio
           </Button>
           <Button onClick={handleSave} className="h-9 px-6 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-[10px] font-bold uppercase tracking-widest shadow-sm gap-2">
             {saved ? <Check size={14} /> : <Save size={14} />} {saved ? "Salvo" : "Salvar"}
           </Button>
        </div>
      </header>

      {/* ÁREA DE TRABALHO: EDITOR (ESQUERDA) + PREVIEW (DIREITA) */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* COLUNA ESQUERDA: EDITOR EM CARDS */}
        <div className={`flex-1 overflow-y-auto p-4 md:p-8 no-scrollbar ${mobileView === 'preview' ? 'hidden md:block' : 'block'}`}>
           <div className="max-w-2xl mx-auto space-y-6 pb-20">
              
              {/* CARD: PERFIL */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                 <h2 className="text-xs font-bold text-slate-800 uppercase tracking-widest mb-5 flex items-center gap-2"><Store size={16} className="text-slate-400"/> Perfil</h2>
                 
                 <div className="flex flex-col md:flex-row gap-6">
                    <div className="flex flex-col items-center gap-2 shrink-0">
                       <div className="w-24 h-24 rounded-full bg-slate-50 border border-slate-200 flex items-center justify-center overflow-hidden p-2">
                          {logoLoja ? <img src={logoLoja} className="w-full h-full object-contain" /> : <ImageIcon className="text-slate-300"/>}
                       </div>
                       <span className="text-[9px] font-semibold text-slate-400 uppercase">Logo da Loja</span>
                    </div>

                    <div className="flex-1 space-y-4">
                       <div className="space-y-1.5">
                         <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Título da Página</label>
                         <Input value={config.titulo} onChange={e => setConfig({...config, titulo: e.target.value})} placeholder="Nome da sua loja" className="h-11 bg-slate-50 border-slate-200 rounded-xl text-sm font-medium" />
                       </div>
                       <div className="space-y-1.5">
                         <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Apresentação</label>
                         <textarea value={config.descricao} onChange={e => setConfig({...config, descricao: e.target.value})} placeholder="Escreva uma breve bio..." className="w-full h-24 p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium resize-none outline-none focus:border-blue-400 transition-colors" />
                       </div>
                    </div>
                 </div>
              </div>

              {/* CARD: ESTILOS */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                 <h2 className="text-xs font-bold text-slate-800 uppercase tracking-widest mb-5 flex items-center gap-2"><Palette size={16} className="text-slate-400"/> Estilos</h2>
                 
                 <div className="space-y-5">
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 block">Formato dos Botões (Links)</label>
                      <div className="flex gap-3">
                         <button onClick={() => setConfig({...config, estilo_botao: 'rounded-none'})} className={`w-16 h-12 flex items-center justify-center border-2 transition-all ${config.estilo_botao === 'rounded-none' ? 'border-blue-500 bg-blue-50' : 'border-slate-200 hover:border-slate-300'}`}><div className="w-8 h-4 bg-slate-300"></div></button>
                         <button onClick={() => setConfig({...config, estilo_botao: 'rounded-xl'})} className={`w-16 h-12 flex items-center justify-center border-2 rounded-xl transition-all ${config.estilo_botao === 'rounded-xl' ? 'border-blue-500 bg-blue-50' : 'border-slate-200 hover:border-slate-300'}`}><div className="w-8 h-4 bg-slate-300 rounded-md"></div></button>
                         <button onClick={() => setConfig({...config, estilo_botao: 'rounded-full'})} className={`w-16 h-12 flex items-center justify-center border-2 rounded-2xl transition-all ${config.estilo_botao === 'rounded-full' || config.estilo_botao === 'rounded-2xl' ? 'border-blue-500 bg-blue-50' : 'border-slate-200 hover:border-slate-300'}`}><div className="w-8 h-4 bg-slate-300 rounded-full"></div></button>
                      </div>
                    </div>
                 </div>
              </div>

              {/* CARD: CORES */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                 <h2 className="text-xs font-bold text-slate-800 uppercase tracking-widest mb-5 flex items-center gap-2"><Palette size={16} className="text-slate-400"/> Cores</h2>
                 
                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {[
                      { label: 'Cor do Fundo', field: 'cor_fundo' },
                      { label: 'Cor do Texto', field: 'cor_texto' },
                      { label: 'Fundo dos Links', field: 'cor_botoes' },
                      { label: 'Texto dos Links', field: 'cor_texto_botoes' }
                    ].map(item => (
                      <div key={item.field} className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-xl relative overflow-hidden group">
                        <div className="flex items-center gap-3">
                           <div className="w-8 h-8 rounded-full border border-slate-200 shadow-sm" style={{ backgroundColor: config[item.field] }}></div>
                           <span className="text-[11px] font-semibold text-slate-700">{item.label}</span>
                        </div>
                        <input type="color" value={config[item.field]} onChange={(e) => setConfig({...config, [item.field]: e.target.value})} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                      </div>
                    ))}
                 </div>
              </div>

              {/* CARD: IMAGENS */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                 <h2 className="text-xs font-bold text-slate-800 uppercase tracking-widest mb-5 flex items-center gap-2"><ImageIcon size={16} className="text-slate-400"/> Imagens</h2>
                 
                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div className="space-y-2">
                       <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Imagem de Fundo (Wallpaper)</label>
                       <div className="w-full h-32 rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 flex flex-col items-center justify-center relative overflow-hidden group hover:border-blue-400 transition-colors">
                          {config.fundo_url ? (
                             <img src={config.fundo_url} className="w-full h-full object-cover opacity-60" />
                          ) : (
                             <div className="flex flex-col items-center text-slate-400 group-hover:text-blue-500"><Upload size={20} className="mb-2"/><span className="text-[10px] font-bold uppercase tracking-widest">Adicionar Fundo</span></div>
                          )}
                          <input type="file" accept="image/*" onChange={(e) => handleImageUpload(e, 'fundo_url')} className="absolute inset-0 opacity-0 cursor-pointer z-10" />
                          {config.fundo_url && <button onClick={() => setConfig({...config, fundo_url: ''})} className="absolute top-2 right-2 bg-red-500 text-white p-1.5 rounded-lg z-20 shadow-sm"><Trash2 size={12}/></button>}
                       </div>
                    </div>

                    <div className="space-y-2">
                       <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Capa do Cabeçalho</label>
                       <div className="w-full h-32 rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 flex flex-col items-center justify-center relative overflow-hidden group hover:border-blue-400 transition-colors">
                          {config.capa_url ? (
                             <img src={config.capa_url} className="w-full h-full object-cover" />
                          ) : (
                             <div className="flex flex-col items-center text-slate-400 group-hover:text-blue-500"><Upload size={20} className="mb-2"/><span className="text-[10px] font-bold uppercase tracking-widest">Adicionar Capa</span></div>
                          )}
                          <input type="file" accept="image/*" onChange={(e) => handleImageUpload(e, 'capa_url')} className="absolute inset-0 opacity-0 cursor-pointer z-10" />
                          {config.capa_url && <button onClick={() => setConfig({...config, capa_url: ''})} className="absolute top-2 right-2 bg-red-500 text-white p-1.5 rounded-lg z-20 shadow-sm"><Trash2 size={12}/></button>}
                       </div>
                    </div>
                 </div>
              </div>

              {/* CARD: CONTEÚDO (LINKS) */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                 <div className="flex items-center justify-between mb-5">
                   <h2 className="text-xs font-bold text-slate-800 uppercase tracking-widest flex items-center gap-2"><LinkIcon size={16} className="text-slate-400"/> Meus Links</h2>
                   <Button onClick={() => setConfig({ ...config, links: [...(config.links || []), { id: Date.now(), titulo: '', url: '', imagem_icone: '', cor_fundo: '', cor_texto: '', ativo: true }] })} className="h-8 px-4 bg-slate-900 text-white text-[10px] font-bold uppercase rounded-lg shadow-sm">Adicionar Link</Button>
                 </div>
                 
                 <div className="space-y-4">
                    {config.links?.map((link) => (
                      <div key={link.id} className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex flex-col gap-3 relative group">
                         <button onClick={() => setConfig({ ...config, links: config.links.filter(l => l.id !== link.id) })} className="absolute top-4 right-4 text-slate-400 hover:text-red-500 transition-colors"><Trash2 size={14}/></button>
                         <div className="flex gap-3 items-center">
                            <div className="w-12 h-12 rounded-xl bg-white border border-slate-200 flex items-center justify-center relative overflow-hidden shrink-0">
                               {link.imagem_icone ? <img src={link.imagem_icone} className="w-8 h-8 object-contain"/> : <ImageIcon size={16} className="text-slate-300"/>}
                               <input type="file" accept="image/*" onChange={(e) => {
                                 const file = e.target.files[0];
                                 if(file) { setIsUploadingGlobal(true); uploadToSupabase(file, 'icone').then(url => updateLink(link.id, 'imagem_icone', url)).finally(() => setIsUploadingGlobal(false)); }
                               }} className="absolute inset-0 opacity-0 cursor-pointer" />
                            </div>
                            <div className="flex-1 space-y-2 pr-6">
                               <Input value={link.titulo} onChange={e => updateLink(link.id, 'titulo', e.target.value)} placeholder="Título do Botão" className="h-9 bg-white text-xs font-bold border-slate-200 rounded-lg" />
                               <Input value={link.url} onChange={e => updateLink(link.id, 'url', e.target.value)} placeholder="URL de Destino (https://...)" className="h-9 bg-white text-xs text-slate-500 border-slate-200 rounded-lg" />
                            </div>
                         </div>
                      </div>
                    ))}
                    {(!config.links || config.links.length === 0) && <p className="text-center text-[10px] font-bold text-slate-400 uppercase tracking-widest py-4">Nenhum link adicionado.</p>}
                 </div>
              </div>

           </div>
        </div>

        {/* COLUNA DIREITA: VISUALIZAÇÃO (PREVIEW) */}
        <div className={`w-full md:w-[420px] shrink-0 border-l border-slate-200 bg-white flex items-center justify-center py-6 md:py-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] relative ${mobileView === 'editor' ? 'hidden md:flex' : 'flex'}`}>
           <BioPreview isEditorMode={true} />
        </div>
      </div>

      {/* BOTÃO FLUTUANTE MOBILE (Trocar Editor / Preview) */}
      <div className="md:hidden fixed bottom-6 right-6 z-[200]">
         <Button 
            onClick={() => setMobileView(mobileView === 'editor' ? 'preview' : 'editor')}
            className="w-14 h-14 rounded-full bg-slate-900 text-white shadow-2xl shadow-slate-900/40 flex items-center justify-center border border-slate-700"
         >
            {mobileView === 'editor' ? <Smartphone size={24} /> : <Palette size={24} />}
         </Button>
      </div>

      {isUploadingGlobal && (
        <div className="fixed inset-0 z-[999] bg-white/80 backdrop-blur-sm flex flex-col items-center justify-center pointer-events-auto">
          <Loader2 className="animate-spin text-blue-600 w-12 h-12 mb-4" />
          <p className="text-slate-800 font-bold uppercase tracking-widest text-xs animate-pulse">Enviando Imagem...</p>
        </div>
      )}
    </div>
  );
}