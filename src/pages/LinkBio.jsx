import React, { useState, useEffect } from 'react';
import { 
  Palette, Image as ImageIcon, Upload, Check, Trash2, 
  Copy, Loader2, Save, X, Link as LinkIcon, Plus, Globe, LayoutTemplate, Star, ShoppingBag
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "../lib/supabase";
import { AnimatePresence, motion } from "framer-motion";

// --- FUNÇÃO MÁGICA: COMPRESSOR DE IMAGENS ---
const compressImage = (file) => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new window.Image(); 
      img.src = event.target.result;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 1080; 
        const MAX_HEIGHT = 1350;
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
        resolve(canvas.toDataURL('image/webp', 0.8));
      };
    };
  });
};

// --- PAINEL LATERAL DE CONFIGURAÇÃO ---
const ConfigSidebarBio = ({ config, setConfig, handleSave, saved, setIsSidebarOpen, copyBioLink }) => {
  
  const handleImageUpload = async (e, field) => {
    const file = e.target.files[0];
    if (file) {
      const compressedBase64 = await compressImage(file);
      setConfig({ ...config, [field]: compressedBase64 });
    }
  };

  // --- GERENCIAMENTO DE LINKS ---
  const addLink = () => {
    const novosLinks = [...(config.links || []), { id: Date.now(), titulo: '', url: '', imagem_icone: '', cor_fundo: '', cor_texto: '', ativo: true }];
    setConfig({ ...config, links: novosLinks });
  };

  const updateLink = (id, field, value) => {
    const novosLinks = config.links.map(l => l.id === id ? { ...l, [field]: value } : l);
    setConfig({ ...config, links: novosLinks });
  };

  const handleLinkIconUpload = async (e, id) => {
    const file = e.target.files[0];
    if (file) {
      const compressed = await compressImage(file);
      updateLink(id, 'imagem_icone', compressed);
    }
  };

  const removeLink = (id) => {
    const novosLinks = config.links.filter(l => l.id !== id);
    setConfig({ ...config, links: novosLinks });
  };

  // --- GERENCIAMENTO DE BANNERS MÚLTIPLOS ---
  const addBanner = () => {
    const novosBanners = [...(config.banners || []), { id: Date.now(), imagem_url: '', link: '', descricao: '', botao_texto: 'Acessar' }];
    setConfig({ ...config, banners: novosBanners });
  };

  const updateBanner = (id, field, value) => {
    const novosBanners = config.banners.map(b => b.id === id ? { ...b, [field]: value } : b);
    setConfig({ ...config, banners: novosBanners });
  };

  const handleBannerUpload = async (e, id) => {
    const file = e.target.files[0];
    if (file) {
      const compressed = await compressImage(file);
      updateBanner(id, 'imagem_url', compressed);
    }
  };

  const removeBanner = (id) => {
    const novosBanners = config.banners.filter(b => b.id !== id);
    setConfig({ ...config, banners: novosBanners });
  };

  return (
    <div className="space-y-6 pb-20 p-4 md:p-6 animate-in fade-in duration-700 w-full">
      {/* CABEÇALHO CONFIG */}
      <div className="flex flex-col gap-4 bg-white p-5 rounded-lg border border-slate-100 shadow-sm sticky top-0 z-10">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-xl font-bold text-slate-800 uppercase tracking-tight leading-none">Minha Bio</h1>
            <p className="text-[10px] font-medium text-slate-500 uppercase tracking-widest mt-1.5">Edição ao vivo</p>
          </div>
          <button onClick={() => setIsSidebarOpen(false)} className="text-slate-400 hover:text-slate-700 bg-slate-50 hover:bg-slate-100 p-1.5 rounded-md transition-all shrink-0 border border-slate-200">
            <X size={16} />
          </button>
        </div>
        <div className="flex flex-col gap-2">
          <Button onClick={copyBioLink} variant="outline" className="w-full h-10 font-semibold uppercase text-[10px] gap-2 border">
            <Copy size={14} /> Link da Bio
          </Button>
          <Button onClick={handleSave} className="w-full bg-blue-600 hover:bg-blue-700 text-white h-10 font-semibold uppercase text-[10px] gap-2 shadow-sm transition-all">
            {saved ? <Check size={14} className="text-emerald-300" /> : <Save size={14} />}
            {saved ? "Salvo com sucesso!" : "Salvar Alterações"}
          </Button>
        </div>
      </div>

      {/* PERFIL E CAPA */}
      <div className="bg-white p-5 rounded-lg border border-slate-100 shadow-sm space-y-5">
        <h3 className="text-xs font-semibold uppercase text-slate-700 tracking-widest flex items-center gap-2 border-b border-slate-100 pb-3">
          <LayoutTemplate size={16} className="text-emerald-500" /> Textos e Mídia
        </h3>
        
        {/* FOTO E CAPA */}
        <div className="flex flex-col gap-5 border-b border-slate-100 pb-5">
          <div className="space-y-2">
            <div className="flex justify-between items-center">
               <label className="text-[10px] font-semibold uppercase text-slate-500 tracking-widest">Imagem da Capa</label>
               <span className="text-[8px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded font-bold">800 x 300 px</span>
            </div>
            <div className="relative group w-full h-24 shrink-0">
              <div className="w-full h-full rounded-md border-2 border-dashed border-slate-300 bg-slate-50 flex items-center justify-center overflow-hidden transition-all group-hover:border-blue-400">
                {config.capa_url ? <img src={config.capa_url} className="w-full h-full object-cover" /> : <ImageIcon size={20} className="text-slate-300" />}
              </div>
              <input type="file" accept="image/*" onChange={(e) => handleImageUpload(e, 'capa_url')} className="absolute inset-0 opacity-0 cursor-pointer z-10" />
              {config.capa_url && (
                <button onClick={() => setConfig({...config, capa_url: ''})} className="absolute -top-2 -right-2 bg-red-500 text-white p-1 rounded-full z-20 shadow-sm opacity-0 group-hover:opacity-100"><X size={10}/></button>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center">
               <label className="text-[10px] font-semibold uppercase text-slate-500 tracking-widest">Foto de Perfil</label>
               <span className="text-[8px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded font-bold">1:1 (Quadrado)</span>
            </div>
            <div className="relative group w-16 h-16 shrink-0">
              <div className="w-full h-full rounded-full border-2 border-dashed border-slate-300 bg-slate-50 flex items-center justify-center overflow-hidden transition-all group-hover:border-blue-400">
                {config.avatar_url ? <img src={config.avatar_url} className="w-full h-full object-cover" /> : <ImageIcon size={20} className="text-slate-300" />}
              </div>
              <input type="file" accept="image/*" onChange={(e) => handleImageUpload(e, 'avatar_url')} className="absolute inset-0 opacity-0 cursor-pointer z-10" />
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-[10px] font-semibold uppercase text-slate-500 tracking-widest">Título Principal</label>
            <Input value={config.titulo || ''} onChange={e => setConfig({...config, titulo: e.target.value})} className="h-10 text-xs font-bold" />
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-semibold uppercase text-slate-500 tracking-widest">Descrição (Bio)</label>
            <textarea value={config.descricao || ''} onChange={e => setConfig({...config, descricao: e.target.value})} className="w-full min-h-[80px] p-2.5 bg-slate-50 border border-slate-200 rounded-md text-[11px] font-medium outline-none resize-none" />
          </div>
        </div>
      </div>

      {/* CORES GERAIS */}
      <div className="bg-white p-5 rounded-lg border border-slate-100 shadow-sm space-y-5">
        <h3 className="text-xs font-semibold uppercase text-slate-700 tracking-widest flex items-center gap-2 border-b border-slate-100 pb-3">
          <Palette size={16} className="text-pink-500" /> Cores Globais
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-[10px] font-semibold uppercase text-slate-500">Cor do Fundo</label>
            <div className="flex gap-2 items-center">
              <div className="relative w-9 h-9 rounded-md shadow-sm shrink-0 cursor-pointer border border-slate-200" style={{ backgroundColor: config.cor_fundo || '#f8fafc' }}>
                <input type="color" value={config.cor_fundo || '#f8fafc'} onChange={e => setConfig({...config, cor_fundo: e.target.value})} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
              </div>
              <Input value={config.cor_fundo || ''} onChange={e => setConfig({...config, cor_fundo: e.target.value})} className="h-9 font-mono text-[10px] uppercase w-full" />
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-semibold uppercase text-slate-500">Texto Principal</label>
            <div className="flex gap-2 items-center">
              <div className="relative w-9 h-9 rounded-md shadow-sm shrink-0 cursor-pointer border border-slate-200" style={{ backgroundColor: config.cor_texto || '#1e293b' }}>
                <input type="color" value={config.cor_texto || '#1e293b'} onChange={e => setConfig({...config, cor_texto: e.target.value})} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
              </div>
              <Input value={config.cor_texto || ''} onChange={e => setConfig({...config, cor_texto: e.target.value})} className="h-9 font-mono text-[10px] uppercase w-full" />
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-semibold uppercase text-slate-500">Fundo dos Botões Padrão</label>
            <div className="flex gap-2 items-center">
              <div className="relative w-9 h-9 rounded-md shadow-sm shrink-0 cursor-pointer border border-slate-200" style={{ backgroundColor: config.cor_botoes || '#f472b6' }}>
                <input type="color" value={config.cor_botoes || '#f472b6'} onChange={e => setConfig({...config, cor_botoes: e.target.value})} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
              </div>
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-semibold uppercase text-slate-500">Texto dos Botões Padrão</label>
            <div className="flex gap-2 items-center">
              <div className="relative w-9 h-9 rounded-md shadow-sm shrink-0 cursor-pointer border border-slate-200" style={{ backgroundColor: config.cor_texto_botoes || '#ffffff' }}>
                <input type="color" value={config.cor_texto_botoes || '#ffffff'} onChange={e => setConfig({...config, cor_texto_botoes: e.target.value})} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* LINKS INDIVIDUAIS */}
      <div className="bg-white p-5 rounded-lg border border-slate-100 shadow-sm space-y-5">
        <h3 className="text-xs font-semibold uppercase text-slate-700 tracking-widest flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2"><LinkIcon size={16} className="text-blue-500" /> Botões e Links</div>
          <span className="bg-blue-100 text-blue-600 px-2 py-0.5 rounded text-[10px]">{config.links?.length || 0}</span>
        </h3>
        
        <div className="space-y-4">
          {config.links?.map((link, index) => (
            <div key={link.id} className="bg-slate-50 p-4 rounded-md border border-slate-200 flex flex-col gap-3 relative group shadow-sm">
              <button onClick={() => removeLink(link.id)} className="absolute -top-2 -right-2 bg-red-500 text-white p-1.5 rounded-md shadow-sm opacity-0 group-hover:opacity-100 transition-opacity z-10"><Trash2 size={12}/></button>
              
              <div className="flex gap-3 items-center">
                 {/* ÍCONE UPLOAD */}
                 <div className="space-y-1 shrink-0">
                   <label className="text-[9px] font-semibold uppercase text-slate-500 tracking-widest">Ícone</label>
                   <div className="h-10 w-10 flex items-center justify-center bg-white border border-slate-200 rounded-md relative overflow-hidden group-hover:border-blue-400 transition-colors cursor-pointer">
                     {link.imagem_icone ? <img src={link.imagem_icone} className="w-full h-full object-cover" /> : <ImageIcon size={14} className="text-slate-300"/>}
                     <input type="file" accept="image/*" onChange={(e) => handleLinkIconUpload(e, link.id)} className="absolute inset-0 opacity-0 cursor-pointer" />
                   </div>
                 </div>
                 
                 <div className="space-y-1 flex-1">
                   <label className="text-[9px] font-semibold uppercase text-slate-500 tracking-widest">Título do Botão</label>
                   <Input value={link.titulo} onChange={e => updateLink(link.id, 'titulo', e.target.value)} placeholder="Ex: WhatsApp, Catálogo..." className="h-10 text-xs font-bold bg-white" />
                 </div>
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-semibold uppercase text-slate-500 tracking-widest">URL de Destino</label>
                <Input value={link.url} onChange={e => updateLink(link.id, 'url', e.target.value)} placeholder="https://..." className="h-9 text-xs bg-white" />
              </div>

              {/* CORES INDIVIDUAIS DO BOTÃO */}
              <div className="flex gap-4 pt-2 border-t border-slate-200 mt-2">
                 <div className="space-y-1">
                   <label className="text-[9px] font-semibold uppercase text-slate-500">Cor do Fundo</label>
                   <div className="flex items-center gap-2">
                     <div className="relative w-8 h-8 rounded-md overflow-hidden border border-slate-200" style={{ backgroundColor: link.cor_fundo || config.cor_botoes }}>
                       <input type="color" value={link.cor_fundo || config.cor_botoes} onChange={e => updateLink(link.id, 'cor_fundo', e.target.value)} className="absolute -inset-2 w-14 h-14 cursor-pointer" />
                     </div>
                   </div>
                 </div>
                 <div className="space-y-1">
                   <label className="text-[9px] font-semibold uppercase text-slate-500">Cor do Texto</label>
                   <div className="flex items-center gap-2">
                     <div className="relative w-8 h-8 rounded-md overflow-hidden border border-slate-200" style={{ backgroundColor: link.cor_texto || config.cor_texto_botoes }}>
                       <input type="color" value={link.cor_texto || config.cor_texto_botoes} onChange={e => updateLink(link.id, 'cor_texto', e.target.value)} className="absolute -inset-2 w-14 h-14 cursor-pointer" />
                     </div>
                   </div>
                 </div>
              </div>
            </div>
          ))}
          
          <Button onClick={addLink} variant="outline" className="w-full h-11 border-dashed border-2 border-slate-300 font-semibold uppercase text-[10px] gap-2 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-300 transition-colors bg-white">
            <Plus size={14}/> Adicionar Novo Link
          </Button>
        </div>
      </div>

      {/* BANNERS PROMOCIONAIS (MÚLTIPLOS) */}
      <div className="bg-white p-5 rounded-lg border border-slate-100 shadow-sm space-y-5">
        <h3 className="text-xs font-semibold uppercase text-slate-700 tracking-widest flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2"><ImageIcon size={16} className="text-purple-500" /> Banners Promocionais</div>
          <span className="bg-purple-100 text-purple-600 px-2 py-0.5 rounded text-[10px]">{config.banners?.length || 0}</span>
        </h3>
        
        <div className="space-y-4">
          {config.banners?.map((banner) => (
            <div key={banner.id} className="bg-slate-50 p-4 rounded-md border border-slate-200 flex flex-col gap-3 relative group shadow-sm">
              <button onClick={() => removeBanner(banner.id)} className="absolute -top-2 -right-2 bg-red-500 text-white p-1.5 rounded-md shadow-sm opacity-0 group-hover:opacity-100 transition-opacity z-10"><Trash2 size={12}/></button>

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                   <label className="text-[10px] font-semibold uppercase text-slate-500 tracking-widest">Arte do Banner</label>
                   <span className="text-[8px] bg-slate-200 text-slate-600 px-1.5 py-0.5 rounded font-bold">1080 x 1080 px</span>
                </div>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <input type="file" accept="image/*" onChange={(e) => handleBannerUpload(e, banner.id)} className="absolute inset-0 opacity-0 cursor-pointer z-10" />
                    <Button variant="outline" className="w-full h-10 rounded-md border-dashed border border-slate-300 font-semibold uppercase text-[10px] gap-2 hover:bg-slate-100 bg-white">
                      <Upload size={14}/> {banner.imagem_url ? "Trocar Banner" : "Subir Imagem"}
                    </Button>
                  </div>
                </div>
                {banner.imagem_url && (
                  <div className="mt-2 w-full aspect-square rounded-md overflow-hidden border border-slate-200 bg-slate-100 shadow-sm relative">
                    <img src={banner.imagem_url} className="w-full h-full object-cover" />
                  </div>
                )}
              </div>
              
              <div className="space-y-1.5 pt-2 border-t border-slate-200 mt-2">
                 <label className="text-[10px] font-semibold uppercase text-slate-500 tracking-widest">Descrição (Opcional)</label>
                 <textarea value={banner.descricao || ''} onChange={e => updateBanner(banner.id, 'descricao', e.target.value)} placeholder="Texto que ficará abaixo da imagem..." className="w-full min-h-[60px] p-2.5 bg-white border border-slate-200 rounded-md text-[11px] font-medium outline-none resize-none" />
              </div>
              <div className="space-y-1.5">
                 <label className="text-[10px] font-semibold uppercase text-slate-500 tracking-widest flex items-center gap-1.5"><LinkIcon size={12}/> Link do Banner</label>
                 <Input value={banner.link || ''} onChange={(e) => updateBanner(banner.id, 'link', e.target.value)} placeholder="Ex: https://..." className="h-9 text-xs bg-white" />
              </div>
              {banner.link && (
                 <div className="space-y-1.5">
                   <label className="text-[10px] font-semibold uppercase text-slate-500 tracking-widest flex items-center gap-1.5">Texto do Botão</label>
                   <Input value={banner.botao_texto || ''} onChange={(e) => updateBanner(banner.id, 'botao_texto', e.target.value)} placeholder="Ex: Eu Quero!" className="h-9 text-xs font-bold bg-white" />
                 </div>
              )}
            </div>
          ))}

          <Button onClick={addBanner} variant="outline" className="w-full h-11 border-dashed border-2 border-purple-200 font-semibold uppercase text-[10px] gap-2 hover:bg-purple-50 hover:text-purple-600 hover:border-purple-300 transition-colors bg-white text-purple-500">
            <Plus size={14}/> Adicionar Novo Banner
          </Button>
        </div>
      </div>

    </div>
  );
};

export default function LinkBio({ isPublic = false }) {
  const [config, setConfig] = useState({
    avatar_url: '',
    capa_url: '',
    titulo: 'Criarte Personalizados',
    descricao: 'Transformando ideias em momentos inesquecíveis.',
    cor_fundo: '#f8fafc',
    cor_botoes: '#f472b6',
    cor_texto_botoes: '#ffffff',
    cor_texto: '#1e293b',
    links: [],
    banners: []
  });

  const [produtosDestaque, setProdutosDestaque] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  useEffect(() => {
    async function loadData() {
      // 1. Carrega as configs da Bio
      const { data: configData } = await supabase.from('bio_config').select('*').eq('id', 1).single();
      if (configData) {
        setConfig({
          ...configData,
          links: configData.links || [],
          banners: configData.banners || [] 
        });
      }

      // 2. Carrega APENAS 3 produtos em destaque para o formato Mosaico
      const { data: prods } = await supabase
        .from('produtos')
        .select('id, nome, preco, preco_promocional, imagens, imagem_url')
        .eq('status_online', true)
        .eq('destaque', true)
        .limit(3);
        
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

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-slate-50"><Loader2 className="animate-spin text-slate-300 w-10 h-10" /></div>;

  // --- VISUAL AO VIVO (COMO O CLIENTE VÊ) ---
  const LivePreview = () => {

    return (
      <div 
        className="min-h-screen w-full flex flex-col items-center justify-start pb-20 transition-colors duration-500 overflow-x-hidden"
        style={{ backgroundColor: config.cor_fundo }}
      >
        <div className="w-full max-w-md flex flex-col items-center animate-in fade-in zoom-in-95 duration-500 relative">
          
          {/* CAPA DE FUNDO */}
          {config.capa_url && (
             <div className="w-full h-32 md:h-40 overflow-hidden shadow-sm relative shrink-0">
               <img src={config.capa_url} className="w-full h-full object-cover" />
               <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent"></div>
             </div>
          )}

          {/* AVATAR (SOBREPOSTO SE TIVER CAPA) */}
          <div className={`w-24 h-24 rounded-full overflow-hidden border-[4px] shadow-lg relative z-10 shrink-0 ${config.capa_url ? '-mt-12' : 'mt-12'}`} style={{ borderColor: config.cor_fundo }}>
            {config.avatar_url ? (
              <img src={config.avatar_url} className="w-full h-full object-cover" alt={config.titulo} />
            ) : (
              <div className="w-full h-full bg-slate-200"></div>
            )}
          </div>

          {/* TEXTOS */}
          <div className="px-4 mt-3 flex flex-col items-center w-full">
             <h1 className="text-xl md:text-2xl font-black text-center mb-2" style={{ color: config.cor_texto }}>
               {config.titulo}
             </h1>
             {config.descricao && (
               <p className="text-center text-sm font-medium mb-6 opacity-80 leading-relaxed" style={{ color: config.cor_texto }}>
                 {config.descricao}
               </p>
             )}

             {/* MÚLTIPLOS BANNERS PROMOCIONAIS (MOVIDOS PARA CIMA) */}
             {config.banners?.length > 0 && (
               <div className="w-full flex flex-col gap-6 mb-6">
                 {config.banners.map(banner => {
                   if (!banner.imagem_url) return null;
                   return (
                   <div key={banner.id} className="w-full rounded-2xl overflow-hidden shadow-lg flex flex-col bg-white/5 border border-black/5" style={{ borderColor: `${config.cor_texto}20`}}>
                     <img src={banner.imagem_url} className="w-full object-cover aspect-video" alt="Banner Promo" />
                     {(banner.descricao || banner.link) && (
                        <div className="p-5 flex flex-col gap-4 items-center" style={{ backgroundColor: `${config.cor_botoes}15` }}>
                          {banner.descricao && (
                             <p className="text-[13px] font-medium text-center leading-relaxed" style={{ color: config.cor_texto }}>
                               {banner.descricao}
                             </p>
                          )}
                          {banner.link && (
                             <a 
                               href={banner.link} 
                               target="_blank" 
                               className="w-full py-3 rounded-xl text-center font-bold text-[11px] uppercase tracking-widest shadow-md hover:scale-[1.02] active:scale-95 transition-transform" 
                               style={{ backgroundColor: config.cor_botoes, color: config.cor_texto_botoes }}
                             >
                                {banner.botao_texto || 'Acessar Link'}
                             </a>
                          )}
                        </div>
                     )}
                   </div>
                 )})}
               </div>
             )}

             {/* LINKS COM CORES E ÍCONES INDIVIDUAIS COM w-10 h-10 */}
             <div className="w-full flex flex-col gap-4">
               {config.links?.map((link, i) => (
                 <a 
                   key={link.id || i}
                   href={link.url}
                   target="_blank"
                   rel="noreferrer"
                   className="w-full py-4 px-6 rounded-2xl font-bold shadow-md hover:scale-[1.02] active:scale-[0.98] transition-all relative overflow-hidden group flex justify-between items-center"
                   style={{ backgroundColor: link.cor_fundo || config.cor_botoes, color: link.cor_texto || config.cor_texto_botoes }}
                 >
                   {link.imagem_icone ? (
                      <img src={link.imagem_icone} className="w-10 h-10 object-contain" alt="" />
                   ) : (
                      <div className="w-10 h-10" /> // Espaçador invisível
                   )}
                   <span className="flex-1 text-center text-[13px] uppercase tracking-wide">{link.titulo}</span>
                   <div className="w-10 h-10" /> {/* Espaçador direito */}
                 </a>
               ))}
             </div>
          </div>

          {/* GALERIA DE DESTAQUES (TIPO MOSAICO FIXO EM 3 PRODUTOS) */}
          {produtosDestaque.length > 0 && (
            <div className="w-full mt-10 mb-2 flex flex-col items-center px-4">
              <h3 className="text-xs font-black uppercase tracking-widest mb-4 opacity-80 flex items-center gap-2" style={{ color: config.cor_texto }}>
                <Star size={14}/> Destaques da Loja
              </h3>
              
              {/* BOTÃO DE CATÁLOGO EM CIMA E DESTACADO */}
              <a 
                href="/vitrine" 
                onClick={(e) => {
                  e.preventDefault();
                  window.location.href = "/vitrine";
                }}
                className="w-full mb-6 py-4 px-4 rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl flex items-center justify-center gap-2 transition-transform hover:scale-[1.02] active:scale-[0.98] border border-white/20" 
                style={{ backgroundColor: config.cor_botoes, color: config.cor_texto_botoes }}
              >
                <ShoppingBag size={18}/> Acessar o Catálogo
              </a>

              {/* GRID ESTILO GALERIA (1 Grande, 2 pequenos) - LIMITADO A 3 PRODUTOS */}
              <div className="grid grid-cols-2 gap-3 w-full">
                {produtosDestaque.slice(0, 3).map((prod, index) => {
                   const imgUrl = prod.imagens?.[0] || prod.imagem_url;
                   
                   // O Primeiro produto (index 0) é o grande. Os outros (1 e 2) são pequenos.
                   const isLarge = index === 0; 
                   
                   return (
                     <a 
                       href={`/vitrine?produto=${prod.id}`} 
                       onClick={(e) => {
                         e.preventDefault();
                         window.location.href = `/vitrine?produto=${prod.id}`;
                       }}
                       key={prod.id} 
                       className={`bg-white rounded-xl overflow-hidden shadow-md flex flex-col hover:scale-[1.02] transition-transform text-left ${isLarge ? 'col-span-2' : 'col-span-1'}`}
                     >
                       {/* aspect-[4/3] garante que a imagem fique retangular e o object-cover garante que preencha as laterais */}
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
             <span className="text-[9px] font-bold uppercase tracking-widest">Criarte Personalizados</span>
          </div>

        </div>
      </div>
    );
  };

  if (isPublic) return <LivePreview />;

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

      <div className={`transition-all duration-300 ease-in-out border-b lg:border-b-0 lg:border-r border-slate-200 bg-slate-50 lg:h-screen lg:sticky lg:top-0 overflow-hidden shadow-sm z-50 shrink-0 ${isSidebarOpen ? 'w-full lg:w-[400px] xl:w-[450px] opacity-100' : 'w-0 h-0 opacity-0 border-none'}`}>
        <div className="w-full lg:w-[400px] xl:w-[450px] h-full overflow-y-auto no-scrollbar">
          <ConfigSidebarBio 
            config={config} 
            setConfig={setConfig} 
            handleSave={handleSave} 
            saved={saved} 
            setIsSidebarOpen={setIsSidebarOpen}
            copyBioLink={copyBioLink}
          />
        </div>
      </div>

      <div className="flex-1 w-full bg-[#f8fafc] overflow-x-hidden relative transition-all duration-300">
        {!isPublic && (
          <div className="absolute top-0 inset-x-0 bg-amber-500 text-white text-[10px] font-black text-center py-1 uppercase tracking-widest z-40">
            Painel Administrativo • Modo de Visualização (Live Preview)
          </div>
        )}
        <div className={!isPublic ? "pt-6 h-screen overflow-y-auto no-scrollbar" : ""}>
          <LivePreview />
        </div>
      </div>

    </div>
  );
}