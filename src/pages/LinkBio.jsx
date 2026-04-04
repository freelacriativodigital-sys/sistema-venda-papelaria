import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Upload, Check, Trash2, Copy, Loader2, Save, Link as LinkIcon, 
  Plus, Globe, Image as ImageIcon, Smartphone, Palette, Info, AlignLeft, AlignCenter, AlignRight, Square, Circle, CircleDashed
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
        if (width > height) { if (width > MAX_WIDTH) { height *= MAX_WIDTH / width; width = MAX_WIDTH; } } 
        else { if (height > MAX_HEIGHT) { width *= MAX_HEIGHT / height; height = MAX_HEIGHT; } }
        canvas.width = width; canvas.height = height;
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
    titulo: 'Portal Criarte',
    descricao: 'Tudo feito com muito carinho.',
    cor_fundo: '#f8fafc',
    gradiente_fundo: '',
    cor_botoes: '#f472b6',
    cor_texto_botoes: '#ffffff',
    cor_texto: '#1e293b',
    estilo_pagina: 'list',
    estilo_cabecalho: 'center',
    estilo_avatar: 'circle',
    estilo_botao: 'solid-rounded',
    mostrar_loja: true,
    links: [],
    banners: []
  });

  const [logoLoja, setLogoLoja] = useState('');
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState(false);
  const [isUploadingGlobal, setIsUploadingGlobal] = useState(false);
  const [mobileView, setMobileView] = useState('editor'); 
  const [activeTab, setActiveTab] = useState('links'); 

  useEffect(() => {
    async function loadData() {
      const { data: configData } = await supabase.from('bio_config').select('*').eq('id', 1).single();
      if (configData) {
        setConfig({
          ...configData,
          mostrar_loja: configData.mostrar_loja ?? true,
          estilo_pagina: configData.estilo_pagina || 'list',
          estilo_cabecalho: configData.estilo_cabecalho || 'center',
          estilo_avatar: configData.estilo_avatar || 'circle',
          estilo_botao: configData.estilo_botao || 'solid-rounded',
          gradiente_fundo: configData.gradiente_fundo || '',
          fundo_url: configData.fundo_url || '',
          links: configData.links || [],
          banners: configData.banners || [] 
        });
      }

      const { data: configLoja } = await supabase.from('configuracoes').select('logo_url').eq('id', 1).single();
      if (configLoja) setLogoLoja(configLoja.logo_url);
      setLoading(false);
    }
    loadData();
  }, []);

  useEffect(() => {
    let intervalId;
    if (activeTab === 'catalogo') {
      intervalId = setInterval(() => {
        try {
          const iframe = document.getElementById('iframe-catalogo');
          if (iframe && iframe.contentWindow) {
            const url = iframe.contentWindow.location.href;
            if (url.includes('?produto=') && isPublic) {
              window.top.location.href = url; 
            }
          }
        } catch (err) {}
      }, 500);
    }
    return () => clearInterval(intervalId);
  }, [activeTab, isPublic]);

  const handleSave = async () => {
    const { error } = await supabase.from('bio_config').update(config).eq('id', 1);
    if (!error) { setSaved(true); setTimeout(() => setSaved(false), 2000); } 
    else alert("Erro ao salvar: " + error.message);
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
      } catch (err) { alert("Erro no upload"); } 
      finally { setIsUploadingGlobal(false); }
    }
  };

  const updateLink = (id, field, value) => setConfig({ ...config, links: config.links.map(l => l.id === id ? { ...l, [field]: value } : l) });
  const removeLink = (id) => setConfig({ ...config, links: config.links.filter(l => l.id !== id) });
  const addLink = () => setConfig({ ...config, links: [...(config.links || []), { id: Date.now(), titulo: '', url: '', imagem_icone: '', cor_fundo: '', cor_texto: '', ativo: true }] });

  // === RENDERIZADOR DOS ESTILOS DINÂMICOS ===
  const getButtonClass = () => {
    switch (config.estilo_botao) {
      case 'solid-square': return 'rounded-none border-none';
      case 'solid-rounded': return 'rounded-xl border-none';
      case 'solid-pill': return 'rounded-full border-none';
      case 'shadow-square': return 'rounded-none border-2 border-slate-900 shadow-[4px_4px_0px_#0f172a] hover:shadow-[2px_2px_0px_#0f172a] hover:translate-x-[2px] hover:translate-y-[2px] transition-all';
      case 'shadow-rounded': return 'rounded-xl border-2 border-slate-900 shadow-[4px_4px_0px_#0f172a] hover:shadow-[2px_2px_0px_#0f172a] hover:translate-x-[2px] hover:translate-y-[2px] transition-all';
      case 'outline-square': return 'rounded-none border-2 bg-transparent';
      case 'outline-rounded': return 'rounded-xl border-2 bg-transparent';
      default: return 'rounded-xl';
    }
  };

  const getAvatarClass = () => {
    switch (config.estilo_avatar) {
      case 'square': return 'rounded-none';
      case 'rounded': return 'rounded-3xl';
      case 'circle': return 'rounded-full';
      default: return 'rounded-full';
    }
  };

  const getAlignClass = () => {
    switch (config.estilo_cabecalho) {
      case 'left': return 'items-start text-left';
      case 'right': return 'items-end text-right';
      default: return 'items-center text-center';
    }
  };

  // --- COMPONENTE DE PREVIEW (LIVE) ---
  const BioPreview = () => {
    const isCatalogo = activeTab === 'catalogo';
    const bgStyle = config.fundo_url 
      ? { backgroundImage: `url(${config.fundo_url})`, backgroundSize: 'cover', backgroundPosition: 'center' }
      : config.gradiente_fundo 
        ? { background: config.gradiente_fundo }
        : { backgroundColor: config.cor_fundo };

    if (isCatalogo) {
      return (
        <div className={`flex flex-col animate-in fade-in duration-300 bg-slate-50 ${isPublic ? 'fixed inset-0 z-50' : 'absolute inset-0 z-50 rounded-[2rem] overflow-hidden'}`}>
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none gap-3 z-0">
             <Loader2 className="w-6 h-6 animate-spin text-slate-300" />
          </div>
          <iframe id="iframe-catalogo" src="/vitrine" className="w-full h-full absolute inset-0 z-10 bg-transparent border-0" title="Catálogo" />
        </div>
      );
    }

    return (
      <div className={`w-full flex flex-col relative overflow-x-hidden ${isPublic ? 'min-h-screen lg:py-10' : 'h-full bg-transparent overflow-y-auto no-scrollbar'}`} style={bgStyle}>
        
        {config.fundo_url && <div className="absolute inset-0 bg-black/30 z-0"></div>}

        <div className={`w-full flex flex-col animate-in fade-in duration-500 relative z-10 ${isPublic ? 'max-w-md mx-auto min-h-screen lg:min-h-[800px] lg:rounded-[2.5rem] lg:border-[6px] lg:border-slate-800 pb-28 lg:pb-24 shadow-2xl' : 'min-h-full pb-24'} ${config.estilo_pagina === 'card' ? 'p-4' : 'p-0'}`}>
          
          {/* MODO CARD (O conteúdo fica numa caixa branca) */}
          <div className={`${config.estilo_pagina === 'card' ? 'bg-white/95 backdrop-blur-md rounded-3xl shadow-xl flex-1 flex flex-col pb-10' : 'flex-1 flex flex-col'}`}>
            
            {/* CAPA SPLIT (Se estilo_pagina for split) */}
            {config.estilo_pagina === 'split' && !config.estilo_pagina === 'card' && (
              <div className="w-full h-40 absolute top-0 inset-x-0 z-0" style={{ backgroundColor: config.cor_botoes }}></div>
            )}

            <div className={`px-6 mt-12 flex flex-col w-full relative z-20 ${getAlignClass()}`}>
              <div className={`w-28 h-28 overflow-hidden shadow-xl mb-4 bg-white flex items-center justify-center ${getAvatarClass()}`} style={{ border: `4px solid ${config.estilo_pagina === 'card' ? '#fff' : config.cor_fundo}` }}>
                {logoLoja ? <img src={logoLoja} className="w-full h-full object-contain p-1" alt="Logo" /> : <div className="w-full h-full bg-slate-200"></div>}
              </div>
              
              <h1 className="text-2xl font-black mb-2" style={{ color: (config.fundo_url && config.estilo_pagina !== 'card') ? '#fff' : config.cor_texto }}>{config.titulo}</h1>
              {config.descricao && <p className={`text-[14px] font-medium opacity-90 leading-relaxed mb-8 max-w-sm`} style={{ color: (config.fundo_url && config.estilo_pagina !== 'card') ? '#e2e8f0' : config.cor_texto }}>{config.descricao}</p>}

              <div className="w-full flex flex-col gap-4">
                {config.links?.map((link) => {
                  const btnClass = getButtonClass();
                  const isOutline = config.estilo_botao.includes('outline');
                  const bgColor = isOutline ? 'transparent' : (link.cor_fundo || config.cor_botoes);
                  const textColor = isOutline ? (link.cor_fundo || config.cor_botoes) : (link.cor_texto || config.cor_texto_botoes);
                  const borderColor = link.cor_fundo || config.cor_botoes;

                  return (
                  <a key={link.id} href={link.url} target="_blank" rel="noreferrer" className={`w-full py-4 px-5 font-bold flex justify-between items-center relative overflow-hidden ${btnClass}`} style={{ backgroundColor: bgColor, color: textColor, borderColor: borderColor }}>
                    {link.imagem_icone ? <img src={link.imagem_icone} className="w-8 h-8 object-contain" /> : <div className="w-8 h-8" /> }
                    <span className="flex-1 text-center text-[13px] uppercase tracking-wide">{link.titulo}</span>
                    <div className="w-8 h-8" /> 
                  </a>
                )})}
              </div>
            </div>

            {/* LOGO ORGANIZE RODOAPÉ */}
            <div className="mt-auto w-full pt-16 pb-6 opacity-60 flex flex-col items-center justify-end gap-1.5 z-20">
               <img src="https://yjfvdmpsnpvrpskmqrjt.supabase.co/storage/v1/object/public/produtos/LOGO%20ORGANIZE.png" alt="Organize" className="h-5 object-contain grayscale" />
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-[#f4f7f8]"><Loader2 className="animate-spin text-blue-600" size={40} /></div>;

  if (isPublic) return <BioPreview />;

  // --- MÓDULO: EDITOR ---
  return (
    <div className="min-h-screen flex flex-col bg-[#f4f7f8] font-sans">
      
      <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 md:px-6 shrink-0 sticky top-0 z-50 shadow-sm">
        <div className="flex items-center gap-3">
           <button onClick={() => navigate('/app')} className="p-2 -ml-2 rounded-full hover:bg-slate-100 text-slate-500 transition-colors">
             <ArrowLeft size={18} />
           </button>
           <h1 className="text-sm font-bold text-slate-800 hidden sm:block">Aparência da Bio</h1>
        </div>
        <div className="flex items-center gap-2 md:gap-3">
           <Button onClick={() => window.open('/bio', '_blank')} variant="outline" className="h-9 border-slate-200 text-slate-600 rounded-lg text-[10px] font-bold uppercase tracking-widest gap-2">
             <Globe size={14} className="hidden sm:block" /> Visualizar
           </Button>
           <Button onClick={handleSave} className="h-9 px-6 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-[10px] font-bold uppercase tracking-widest shadow-sm gap-2 transition-colors">
             {saved ? <Check size={14} className="text-emerald-400" /> : <Save size={14} />} {saved ? "Salvo" : "Salvar"}
           </Button>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        
        {/* COLUNA ESQUERDA: EDITOR */}
        <div className={`flex-1 overflow-y-auto p-4 md:p-8 no-scrollbar ${mobileView === 'preview' ? 'hidden md:block' : 'block'}`}>
           <div className="max-w-2xl mx-auto space-y-6 pb-20">
              
              {/* CARD: PERFIL */}
              <div className="space-y-3">
                 <div className="flex items-center gap-2 ml-1 opacity-80">
                   <Info size={14} className="text-slate-500" /> <h2 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Perfil</h2>
                 </div>
                 <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                   <div className="flex flex-col md:flex-row gap-6">
                      <div className="flex flex-col items-center gap-2 shrink-0">
                         <div className={`w-24 h-24 bg-slate-50 border border-slate-200 flex items-center justify-center overflow-hidden p-2 ${getAvatarClass()}`}>
                            {logoLoja ? <img src={logoLoja} className="w-full h-full object-contain" /> : <ImageIcon className="text-slate-300"/>}
                         </div>
                         <span className="text-[9px] font-semibold text-slate-400 uppercase">Logo (Mude nas Config.)</span>
                      </div>
                      <div className="flex-1 space-y-4">
                         <div className="space-y-1.5">
                           <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Título da Página</label>
                           <Input value={config.titulo} onChange={e => setConfig({...config, titulo: e.target.value})} placeholder="Nome da loja" className="h-11 bg-slate-50 border-slate-200 rounded-xl text-sm font-medium" />
                         </div>
                         <div className="space-y-1.5">
                           <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Apresentação</label>
                           <textarea value={config.descricao} onChange={e => setConfig({...config, descricao: e.target.value})} placeholder="Breve bio..." className="w-full h-24 p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium resize-none outline-none focus:border-blue-400 transition-colors" />
                         </div>
                      </div>
                   </div>
                 </div>
              </div>

              {/* CARD: ESTILOS */}
              <div className="space-y-3">
                 <div className="flex items-center gap-2 ml-1 opacity-80">
                   <Info size={14} className="text-slate-500" /> <h2 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Estilos Visuais</h2>
                 </div>
                 <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                       {/* Estilo Cabeçalho */}
                       <div>
                         <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3 block">Alinhamento</label>
                         <div className="flex gap-2">
                           {[{id:'left', icon:AlignLeft}, {id:'center', icon:AlignCenter}, {id:'right', icon:AlignRight}].map(opt => (
                             <button key={opt.id} onClick={() => setConfig({...config, estilo_cabecalho: opt.id})} className={`flex-1 h-12 flex items-center justify-center rounded-xl border-2 transition-all ${config.estilo_cabecalho === opt.id ? 'border-blue-500 bg-blue-50 text-blue-600' : 'border-slate-100 text-slate-400 hover:border-slate-300'}`}>
                               <opt.icon size={20}/>
                             </button>
                           ))}
                         </div>
                       </div>
                       
                       {/* Estilo Avatar */}
                       <div>
                         <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3 block">Foto de Perfil</label>
                         <div className="flex gap-2">
                           {[{id:'square', icon:Square}, {id:'rounded', icon:Square, round:'rounded-md'}, {id:'circle', icon:Circle}].map(opt => (
                             <button key={opt.id} onClick={() => setConfig({...config, estilo_avatar: opt.id})} className={`flex-1 h-12 flex items-center justify-center rounded-xl border-2 transition-all ${config.estilo_avatar === opt.id ? 'border-blue-500 bg-blue-50' : 'border-slate-100 hover:border-slate-300'}`}>
                               <div className={`w-6 h-6 border-2 border-current ${opt.id === 'circle' ? 'rounded-full' : (opt.id === 'rounded' ? 'rounded-lg' : 'rounded-none')} ${config.estilo_avatar === opt.id ? 'text-blue-500' : 'text-slate-400'}`}></div>
                             </button>
                           ))}
                         </div>
                       </div>

                       {/* Estilo Página */}
                       <div>
                         <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3 block">Layout do Fundo</label>
                         <div className="flex gap-2">
                           <button onClick={() => setConfig({...config, estilo_pagina: 'list'})} className={`flex-1 h-12 flex flex-col gap-1 items-center justify-center rounded-xl border-2 transition-all ${config.estilo_pagina === 'list' ? 'border-blue-500 bg-blue-50' : 'border-slate-100'}`}><div className="w-6 h-1 bg-current rounded-full opacity-50"/><div className="w-8 h-1 bg-current rounded-full opacity-50"/></button>
                           <button onClick={() => setConfig({...config, estilo_pagina: 'card'})} className={`flex-1 h-12 flex items-center justify-center rounded-xl border-2 transition-all ${config.estilo_pagina === 'card' ? 'border-blue-500 bg-blue-50' : 'border-slate-100'}`}><div className="w-6 h-6 border-2 border-current rounded-md bg-white shadow-sm"/></button>
                           <button onClick={() => setConfig({...config, estilo_pagina: 'split'})} className={`flex-1 h-12 flex flex-col items-center overflow-hidden rounded-xl border-2 transition-all ${config.estilo_pagina === 'split' ? 'border-blue-500 bg-blue-50' : 'border-slate-100'}`}><div className="w-full h-1/2 bg-slate-300"/><div className="w-full h-1/2 bg-transparent"/></button>
                         </div>
                       </div>
                    </div>

                    {/* Estilo do Botão (6 opções do screenshot) */}
                    <div className="pt-4 border-t border-slate-100">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3 block">Estilo dos Links</label>
                      <div className="flex flex-wrap gap-3">
                         {[
                           {id:'solid-square', cl:'rounded-none bg-slate-400'}, {id:'solid-rounded', cl:'rounded-lg bg-slate-400'}, {id:'solid-pill', cl:'rounded-full bg-slate-400'},
                           {id:'shadow-square', cl:'rounded-none border-2 border-slate-400 shadow-[3px_3px_0px_#94a3b8]'}, {id:'shadow-rounded', cl:'rounded-lg border-2 border-slate-400 shadow-[3px_3px_0px_#94a3b8]'},
                           {id:'outline-square', cl:'rounded-none border-2 border-slate-400'}, {id:'outline-rounded', cl:'rounded-lg border-2 border-slate-400'}, {id:'outline-pill', cl:'rounded-full border-2 border-slate-400'}
                         ].map(opt => (
                           <button key={opt.id} onClick={() => setConfig({...config, estilo_botao: opt.id})} className={`w-14 h-14 flex items-center justify-center rounded-2xl border-2 transition-all ${config.estilo_botao === opt.id ? 'border-blue-500 bg-blue-50' : 'border-slate-100 hover:border-slate-200'}`}>
                             <div className={`w-8 h-4 ${opt.cl}`}></div>
                           </button>
                         ))}
                      </div>
                    </div>

                 </div>
              </div>

              {/* CARD: CORES */}
              <div className="space-y-3">
                 <div className="flex items-center gap-2 ml-1 opacity-80">
                   <Info size={14} className="text-slate-500" /> <h2 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Cores e Fundos</h2>
                 </div>
                 <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                       {[
                         { label: 'Cor do Fundo', field: 'cor_fundo' },
                         { label: 'Cor do Texto', field: 'cor_texto' },
                         { label: 'Fundo dos Links', field: 'cor_botoes' },
                         { label: 'Texto dos Links', field: 'cor_texto_botoes' }
                       ].map(item => (
                         <div key={item.field} className="flex items-center justify-between p-3.5 bg-slate-50 border border-slate-200 rounded-xl relative overflow-hidden">
                           <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full border border-slate-300 shadow-sm" style={{ backgroundColor: config[item.field] }}></div>
                              <span className="text-[11px] font-bold text-slate-700">{item.label}</span>
                           </div>
                           <input type="color" value={config[item.field]} onChange={(e) => setConfig({...config, [item.field]: e.target.value})} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                         </div>
                       ))}
                    </div>

                    <div className="space-y-2 border-t border-slate-100 pt-5">
                       <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-2">Gradientes Prontos (Fundo)</label>
                       <div className="flex flex-wrap gap-2">
                          <button onClick={() => setConfig({...config, gradiente_fundo: ''})} className={`px-4 h-10 rounded-xl border-2 text-[10px] font-bold uppercase transition-all ${!config.gradiente_fundo ? 'border-blue-500 text-blue-600' : 'border-slate-200 text-slate-400'}`}>Sem Gradiente</button>
                          {[
                            'linear-gradient(to right, #ff7e5f, #feb47b)',
                            'linear-gradient(to right, #4facfe, #00f2fe)',
                            'linear-gradient(to right, #43e97b, #38f9d7)',
                            'linear-gradient(to right, #fa709a, #fee140)'
                          ].map((grad, i) => (
                            <button key={i} onClick={() => setConfig({...config, gradiente_fundo: grad})} className={`w-10 h-10 rounded-xl border-2 shadow-sm transition-transform hover:scale-110 ${config.gradiente_fundo === grad ? 'border-slate-900 scale-110' : 'border-transparent'}`} style={{ background: grad }}></button>
                          ))}
                       </div>
                    </div>
                 </div>
              </div>

              {/* CARD: IMAGENS */}
              <div className="space-y-3">
                 <div className="flex items-center gap-2 ml-1 opacity-80">
                   <Info size={14} className="text-slate-500" /> <h2 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Imagens Especiais</h2>
                 </div>
                 <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div className="space-y-2">
                       <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Imagem de Fundo (Wallpaper)</label>
                       <div className="w-full h-36 rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 flex flex-col items-center justify-center relative overflow-hidden hover:border-blue-400 transition-colors">
                          {config.fundo_url ? ( <img src={config.fundo_url} className="w-full h-full object-cover opacity-80" /> ) : ( <div className="flex flex-col items-center text-slate-400"><Upload size={24} className="mb-2"/><span className="text-[9px] font-bold uppercase tracking-widest">Enviar Fundo</span></div> )}
                          <input type="file" accept="image/*" onChange={(e) => handleImageUpload(e, 'fundo_url')} className="absolute inset-0 opacity-0 cursor-pointer z-10" />
                          {config.fundo_url && <button onClick={() => setConfig({...config, fundo_url: ''})} className="absolute top-2 right-2 bg-red-500 text-white p-2 rounded-lg z-20 shadow-md hover:bg-red-600"><Trash2 size={14}/></button>}
                       </div>
                    </div>
                    <div className="space-y-2">
                       <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Banner Cabeçalho (Opcional)</label>
                       <div className="w-full h-36 rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 flex flex-col items-center justify-center relative overflow-hidden hover:border-blue-400 transition-colors">
                          {config.capa_url ? ( <img src={config.capa_url} className="w-full h-full object-cover" /> ) : ( <div className="flex flex-col items-center text-slate-400"><Upload size={24} className="mb-2"/><span className="text-[9px] font-bold uppercase tracking-widest">Enviar Capa</span></div> )}
                          <input type="file" accept="image/*" onChange={(e) => handleImageUpload(e, 'capa_url')} className="absolute inset-0 opacity-0 cursor-pointer z-10" />
                          {config.capa_url && <button onClick={() => setConfig({...config, capa_url: ''})} className="absolute top-2 right-2 bg-red-500 text-white p-2 rounded-lg z-20 shadow-md hover:bg-red-600"><Trash2 size={14}/></button>}
                       </div>
                    </div>
                 </div>
              </div>

              {/* CARD: LINKS */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm mt-8">
                 <div className="flex items-center justify-between mb-5">
                   <h2 className="text-xs font-bold text-slate-800 uppercase tracking-widest flex items-center gap-2"><LinkIcon size={16} className="text-slate-400"/> Meus Links</h2>
                   <Button onClick={addLink} className="h-9 px-4 bg-slate-900 text-white text-[10px] font-bold uppercase tracking-widest rounded-xl shadow-sm"><Plus size={14} className="mr-1"/> Add Link</Button>
                 </div>
                 
                 <div className="space-y-4">
                    {config.links?.map((link) => (
                      <div key={link.id} className="bg-slate-50 p-4 rounded-2xl border border-slate-200 flex flex-col gap-4 relative group">
                         <button onClick={() => removeLink(link.id)} className="absolute top-4 right-4 text-slate-400 hover:text-red-500 transition-colors"><Trash2 size={16}/></button>
                         <div className="flex gap-4 items-center pr-8">
                            <div className="w-14 h-14 rounded-xl bg-white border border-slate-200 shadow-sm flex items-center justify-center relative overflow-hidden shrink-0 hover:border-blue-400 transition-colors">
                               {link.imagem_icone ? <img src={link.imagem_icone} className="w-8 h-8 object-contain"/> : <ImageIcon size={20} className="text-slate-300"/>}
                               <input type="file" accept="image/*" onChange={(e) => {
                                 const file = e.target.files[0];
                                 if(file) { setIsUploadingGlobal(true); uploadToSupabase(file, 'icone').then(url => updateLink(link.id, 'imagem_icone', url)).finally(() => setIsUploadingGlobal(false)); }
                               }} className="absolute inset-0 opacity-0 cursor-pointer" title="Ícone" />
                            </div>
                            <div className="flex-1 space-y-2">
                               <Input value={link.titulo} onChange={e => updateLink(link.id, 'titulo', e.target.value)} placeholder="Título do Botão" className="h-10 bg-white text-xs font-bold border-slate-200 rounded-xl focus:border-blue-400" />
                               <Input value={link.url} onChange={e => updateLink(link.id, 'url', e.target.value)} placeholder="https://..." className="h-10 bg-white text-xs text-slate-500 border-slate-200 rounded-xl focus:border-blue-400" />
                            </div>
                         </div>
                      </div>
                    ))}
                    {(!config.links || config.links.length === 0) && <p className="text-center text-[10px] font-bold text-slate-400 uppercase tracking-widest py-4">Nenhum link adicionado.</p>}
                 </div>
              </div>

           </div>
        </div>

        {/* COLUNA DIREITA: SIMULADOR DE CELULAR */}
        <div className={`w-full md:w-[480px] shrink-0 border-l border-slate-200 bg-slate-50 flex items-center justify-center py-6 md:py-10 relative overflow-hidden ${mobileView === 'editor' ? 'hidden md:flex' : 'flex'}`}>
           
           {/* Celular Frame */}
           <div className="w-[320px] h-[680px] bg-[#111] rounded-[3rem] border-[10px] border-slate-900 shadow-2xl relative flex flex-col overflow-hidden ring-1 ring-slate-800">
             
             {/* Notch iPhone */}
             <div className="absolute top-0 inset-x-0 h-6 flex justify-center z-[100]">
                <div className="w-32 h-6 bg-slate-900 rounded-b-3xl"></div>
             </div>

             {/* Tela do Celular */}
             <div className="flex-1 bg-white rounded-[2rem] overflow-hidden relative mt-2 mb-2 mx-2">
               <BioPreview />
             </div>
           </div>

        </div>
      </div>

      {/* BOTÃO FLUTUANTE MOBILE (Trocar Editor / Preview) */}
      <div className="md:hidden fixed bottom-6 right-6 z-[200]">
         <Button onClick={() => setMobileView(mobileView === 'editor' ? 'preview' : 'editor')} className="w-14 h-14 rounded-full bg-slate-900 text-white shadow-2xl flex items-center justify-center border border-slate-700">
            {mobileView === 'editor' ? <Smartphone size={24} /> : <Palette size={24} />}
         </Button>
      </div>

      {isUploadingGlobal && (
        <div className="fixed inset-0 z-[999] bg-white/80 backdrop-blur-sm flex flex-col items-center justify-center pointer-events-auto">
          <Loader2 className="animate-spin text-blue-600 w-12 h-12 mb-4" />
          <p className="text-slate-800 font-bold uppercase tracking-widest text-xs animate-pulse">Carregando...</p>
        </div>
      )}
    </div>
  );
}