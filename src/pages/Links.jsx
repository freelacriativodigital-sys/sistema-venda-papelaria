import React, { useState, useEffect } from 'react';
import { Link as LinkIcon, Plus, Search, Trash2, Copy, Loader2, MousePointerClick, ExternalLink, UserSquare2, Users, Calendar, Gift, Link2, Settings, Upload, Image as ImageIcon, Instagram, MessageCircle, Sparkles, Check, Edit2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "../lib/supabase";

// === URL MÁGICA DO GOOGLE DRIVE ===
const GAS_WEB_APP_URL = "https://script.google.com/macros/s/AKfycbwK3y82SHDhof_TZUs_lvGK625nrJ6hgRIiP9Jr9qukybLnzRIFciysY2Bo-Gp_QRDL/exec";

export default function Links() {
  const [links, setLinks] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Estados para Link/Portal
  const [tipoLink, setTipoLink] = useState('portal'); 
  const [dataEvento, setDataEvento] = useState('');
  const [slug, setSlug] = useState('');
  const [urlDestino, setUrlDestino] = useState('');
  const [salvando, setSalvando] = useState(false);

  // Estados do Cliente
  const [clienteAtual, setClienteAtual] = useState({ id: null, nome: '' });
  const [mostrarDropdownCliente, setMostrarDropdownCliente] = useState(false);

  // === ESTADOS DO MODAL DE EDIÇÃO ===
  const [modalEdicao, setModalEdicao] = useState(false);
  const [editDados, setEditDados] = useState({ id: null, slug: '', url_destino: '', dataEvento: '', isPortal: false });
  const [editClienteAtual, setEditClienteAtual] = useState({ id: null, nome: '' });
  const [mostrarDropdownEditCliente, setMostrarDropdownEditCliente] = useState(false);

  // === ESTADOS DAS CONFIGURAÇÕES DO PORTAL ===
  const [mostrarConfig, setMostrarConfig] = useState(false);
  const [configPortal, setConfigPortal] = useState({ instagram: '', whatsapp: '', logo_url: '' });
  const [salvandoConfig, setSalvandoConfig] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    setLoading(true);
    const [resLinks, resClientes, resConfig] = await Promise.all([
      supabase.from('encurtador').select('*').order('created_at', { ascending: false }),
      supabase.from('clientes').select('id, nome').order('nome'),
      supabase.from('configuracoes').select('*').eq('id', 1).single()
    ]);

    if (resLinks.data) setLinks(resLinks.data);
    if (resClientes.data) setClientes(resClientes.data);
    if (resConfig.data) {
      setConfigPortal({
        instagram: resConfig.data.instagram || '',
        whatsapp: resConfig.data.whatsapp || '',
        logo_url: resConfig.data.logo_url || ''
      });
    }
    setLoading(false);
  }

  // === FUNÇÕES DE CONFIGURAÇÃO DE MARKETING ===
  const handleLogoUpload = async (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64Logo = reader.result;
        setConfigPortal(prev => ({ ...prev, logo_url: base64Logo }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSalvarConfig = async () => {
    setSalvandoConfig(true);
    try {
      const { error } = await supabase.from('configuracoes').update({
        instagram: configPortal.instagram,
        whatsapp: configPortal.whatsapp,
        logo_url: configPortal.logo_url
      }).eq('id', 1);
      
      if (error) throw error;
      alert("Configurações do Portal atualizadas com sucesso!");
    } catch (err) {
      alert("Erro ao salvar configurações: " + err.message);
    } finally {
      setSalvandoConfig(false);
    }
  };

  // === FUNÇÕES DE LINKS ===
  const gerarSlugAutomatico = (texto) => {
    return texto.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]/g, "_").replace(/_+/g, "_");
  };

  const selecionarCliente = (cli) => {
    setClienteAtual({ id: cli.id, nome: cli.nome });
    setMostrarDropdownCliente(false);
    if (!slug) setSlug(gerarSlugAutomatico(cli.nome));
  };

  const selecionarClienteEdit = (cli) => {
    setEditClienteAtual({ id: cli.id, nome: cli.nome });
    setMostrarDropdownEditCliente(false);
  };

  const handleAdd = async () => {
    if (!urlDestino) return alert(tipoLink === 'portal' ? "Cole o link da pasta do Drive!" : "Cole o link original primeiro!");
    
    let finalSlug = slug;
    if (!finalSlug) finalSlug = "link_" + Math.floor(Math.random() * 10000);
    finalSlug = finalSlug.replace(/[^a-zA-Z0-9_-]/g, "");

    let finalUrlDestino = urlDestino;

    if (tipoLink === 'portal') {
      const folderMatch = urlDestino.match(/folders\/([a-zA-Z0-9_-]+)/);
      let folderId = urlDestino; 
      
      if (folderMatch && folderMatch[1]) {
        folderId = folderMatch[1];
      } else if (urlDestino.includes("drive.google.com") && !urlDestino.includes("folders/")) {
         return alert("Atenção: Por favor, cole o link de uma PASTA do Google Drive.");
      }
      
      const origin = window.location.origin;
      finalUrlDestino = `${origin}/entrega/${folderId}${dataEvento ? '?evento=' + dataEvento : ''}`;
    }

    setSalvando(true);
    const payload = { slug: finalSlug, url_destino: finalUrlDestino, cliente_id: clienteAtual.id };
    const { error } = await supabase.from('encurtador').insert([payload]);
    setSalvando(false);

    if (error) {
      if (error.code === '23505') alert("Esse final de link já existe! Escolha outro nome.");
      else alert("Erro ao salvar: " + error.message);
    } else {
      setSlug(''); setUrlDestino(''); setDataEvento(''); setClienteAtual({ id: null, nome: '' });
      fetchData();
    }
  };

  // === FUNÇÕES DE EDIÇÃO ===
  const abrirEdicao = (link) => {
    let urlLimpa = link.url_destino;
    let dataExtraida = '';
    
    // Verifica se tem data do evento pendurada no link e separa
    if (urlLimpa.includes('?evento=')) {
      const split = urlLimpa.split('?evento=');
      urlLimpa = split[0];
      dataExtraida = split[1];
    }
    
    const isPortal = urlLimpa.includes('/entrega/');
    
    setEditDados({
      id: link.id,
      slug: link.slug,
      url_destino: urlLimpa,
      dataEvento: dataExtraida,
      isPortal: isPortal
    });
    
    const cli = clientes.find(c => c.id === link.cliente_id);
    setEditClienteAtual(cli ? { id: cli.id, nome: cli.nome } : { id: null, nome: '' });
    
    setModalEdicao(true);
  };

  const salvarEdicao = async () => {
    if (!editDados.url_destino) return alert("A URL de destino é obrigatória.");
    if (!editDados.slug) return alert("O nome do link é obrigatório.");

    setSalvando(true);
    
    let urlFinal = editDados.url_destino;
    // Se for portal e tiver data, reagrupa a URL com a data atualizada
    if (editDados.isPortal && editDados.dataEvento) {
       urlFinal = `${editDados.url_destino}?evento=${editDados.dataEvento}`;
    }

    const { error } = await supabase.from('encurtador').update({
      slug: gerarSlugAutomatico(editDados.slug), 
      url_destino: urlFinal,
      cliente_id: editClienteAtual.id
    }).eq('id', editDados.id);

    setSalvando(false);

    if (error) {
      if (error.code === '23505') alert("Este final de link já está sendo usado! Escolha outro.");
      else alert("Erro ao salvar edição: " + error.message);
    } else {
      setModalEdicao(false);
      fetchData();
    }
  };

  const handleConverterParaPortal = async (link) => {
    let folderId = null;
    const matchFolders = link.url_destino.match(/folders\/([a-zA-Z0-9_-]+)/);
    const matchId = link.url_destino.match(/id=([a-zA-Z0-9_-]+)/);
    
    if (matchFolders && matchFolders[1]) {
      folderId = matchFolders[1];
    } else if (matchId && matchId[1]) {
      folderId = matchId[1];
    }

    if (folderId) {
      const origin = window.location.origin;
      const novaUrl = `${origin}/entrega/${folderId}`;

      if (window.confirm(`Deseja converter o link da(o) cliente para o Portal Novo?\n\nO link (criartepapelaria.com.br/${link.slug}) continuará o mesmo! A cliente não precisa de um link novo.`)) {
        
        const { error } = await supabase.from('encurtador').update({ url_destino: novaUrl }).eq('id', link.id);
        
        if (error) alert("Erro ao converter: " + error.message);
        else fetchData(); 
      }
    } else {
      alert("Não foi possível encontrar o ID da pasta do Drive neste link.");
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Deseja realmente excluir este link?")) {
      await supabase.from('encurtador').delete().eq('id', id);
      fetchData();
    }
  };

  const copiarLink = (slugDaVez) => {
    const urlCompleta = window.location.origin + "/" + slugDaVez;
    navigator.clipboard.writeText(urlCompleta);
    alert("Link copiado: " + urlCompleta);
  };

  const filtrados = links.filter(l => l.slug.toLowerCase().includes(searchTerm.toLowerCase()));
  const getNomeCliente = (id) => {
    if (!id) return null;
    const c = clientes.find(cli => cli.id === id);
    return c ? c.nome : 'Cliente Removido';
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-slate-50"><Loader2 className="animate-spin text-slate-300" size={40} /></div>;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-32">
      <div className="max-w-6xl mx-auto space-y-6 px-4 sm:px-6 pt-6 md:pt-8 animate-in fade-in">
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-4">
          <div>
             <h1 className="text-xl md:text-2xl font-bold md:font-semibold uppercase text-slate-800 tracking-tight">Gerenciador de Links</h1>
             <p className="text-[10px] md:text-[11px] font-medium text-slate-500 uppercase tracking-widest mt-1">Crie links curtos ou gere portais de entrega</p>
          </div>
          <Button 
            onClick={() => setMostrarConfig(!mostrarConfig)}
            variant="outline" 
            className={`h-10 px-4 rounded-lg font-bold uppercase text-[10px] tracking-widest gap-2 transition-all ${mostrarConfig ? 'bg-slate-800 text-white border-slate-800 hover:bg-slate-700 hover:text-white' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}
          >
            <Settings size={14} /> Configurar Portal
          </Button>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-5">
           
           <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
             <h3 className="text-xs font-semibold uppercase text-slate-700 flex items-center gap-1.5">
               <Plus size={14} className="text-blue-500"/> Novo Link
             </h3>
             
             <div className="flex bg-slate-100 p-1 rounded-lg">
                <button 
                  onClick={() => setTipoLink('portal')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[10px] font-bold uppercase tracking-widest transition-all ${tipoLink === 'portal' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                >
                  <Gift size={14} /> Portal do Cliente
                </button>
                <button 
                  onClick={() => setTipoLink('comum')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[10px] font-bold uppercase tracking-widest transition-all ${tipoLink === 'comum' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                >
                  <Link2 size={14} /> Link Comum
                </button>
             </div>
           </div>
           
           <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
             
             <div className="lg:col-span-3 space-y-1.5 relative">
               <label className="text-[10px] font-semibold uppercase text-slate-500 ml-0.5">Vincular a Cliente (Opcional)</label>
               <div className="relative">
                 <UserSquare2 className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                 <Input 
                   value={clienteAtual.nome} 
                   onChange={e => { setClienteAtual({ id: null, nome: e.target.value }); setMostrarDropdownCliente(true); }} 
                   onFocus={() => setMostrarDropdownCliente(true)}
                   onBlur={() => setTimeout(() => setMostrarDropdownCliente(false), 200)}
                   placeholder="Buscar cliente..." 
                   className="h-11 md:h-10 pl-9 font-medium bg-slate-50 border-slate-200 focus:bg-white rounded-md text-xs" 
                 />
                 
                 {mostrarDropdownCliente && clienteAtual.nome.length > 0 && (
                   <div className="absolute top-11 left-0 right-0 bg-white border border-slate-200 rounded-md shadow-lg max-h-48 overflow-y-auto p-1.5 space-y-0.5 z-50">
                     {clientes.filter(c => c.nome.toLowerCase().includes(clienteAtual.nome.toLowerCase())).length > 0 ? (
                       clientes.filter(c => c.nome.toLowerCase().includes(clienteAtual.nome.toLowerCase())).map(cli => (
                         <div key={cli.id} onMouseDown={() => selecionarCliente(cli)} className="flex flex-col p-2 hover:bg-slate-50 rounded-md cursor-pointer transition-colors">
                           <span className="text-xs font-semibold text-slate-800 uppercase">{cli.nome}</span>
                         </div>
                       ))
                     ) : (
                       <div className="p-2 text-center"><span className="text-[9px] font-medium text-slate-500 uppercase">Nenhum cliente encontrado</span></div>
                     )}
                   </div>
                 )}
               </div>
             </div>

             <div className="lg:col-span-3 space-y-1.5">
               <label className="text-[10px] font-semibold uppercase text-slate-500 ml-0.5">Final do Link Personalizado</label>
               <div className="flex items-center">
                 <span className="bg-slate-100 text-slate-400 text-xs font-medium px-2.5 h-11 md:h-10 flex items-center rounded-l-md border border-r-0 border-slate-200">/</span>
                 <Input value={slug} onChange={e => setSlug(gerarSlugAutomatico(e.target.value))} placeholder="identidade_angelica" className="h-11 md:h-10 bg-slate-50 border-slate-200 rounded-l-none rounded-r-md font-medium text-slate-800 text-sm focus:bg-white px-2" />
               </div>
             </div>

             {tipoLink === 'portal' && (
               <div className="lg:col-span-2 space-y-1.5">
                 <label className="text-[10px] font-semibold uppercase text-slate-500 ml-0.5" title="Para calcular os 30 dias de expiração">Data do Evento</label>
                 <div className="relative">
                   <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                   <Input type="date" value={dataEvento} onChange={e => setDataEvento(e.target.value)} className="h-11 md:h-10 pl-9 bg-slate-50 border-slate-200 rounded-md font-medium text-slate-800 text-sm focus:bg-white" />
                 </div>
               </div>
             )}
             
             <div className={tipoLink === 'portal' ? "lg:col-span-4 space-y-1.5" : "lg:col-span-4 space-y-1.5"}>
               <label className="text-[10px] font-semibold uppercase text-slate-500 ml-0.5">
                 {tipoLink === 'portal' ? 'Link da Pasta do Drive' : 'Link Original (Destino)'}
               </label>
               <div className="relative">
                 {tipoLink === 'portal' ? <Gift className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} /> : <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />}
                 <Input value={urlDestino} onChange={e => setUrlDestino(e.target.value)} placeholder={tipoLink === 'portal' ? "https://drive.google.com/drive/folders/..." : "https://..."} className="h-11 md:h-10 pl-9 bg-slate-50 border-slate-200 rounded-md font-medium text-slate-800 text-sm focus:bg-white" />
               </div>
             </div>
             
             <div className={`lg:col-span-12 flex justify-end ${tipoLink === 'comum' ? 'lg:-mt-16' : 'mt-2'}`}>
               <Button onClick={handleAdd} disabled={salvando} className="w-full lg:w-auto px-8 h-11 md:h-10 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-semibold uppercase text-[10px] shadow-sm">
                 {salvando ? <Loader2 size={16} className="animate-spin" /> : "Gerar Link"}
               </Button>
             </div>
           </div>
        </div>

        {mostrarConfig && (
          <div className="bg-white p-5 md:p-6 rounded-xl border border-slate-200 shadow-sm animate-in slide-in-from-top-4 duration-300">
             <div className="flex items-center gap-2 mb-6 border-b border-slate-100 pb-4">
               <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg"><Sparkles size={18} /></div>
               <div>
                 <h3 className="text-sm font-bold uppercase tracking-tight text-slate-800">Marketing do Portal</h3>
                 <p className="text-[10px] font-medium text-slate-500 uppercase tracking-widest">Configure os contatos que aparecem no final da página da cliente</p>
               </div>
             </div>

             <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="space-y-4">
                   <div className="space-y-1.5">
                     <label className="text-[10px] font-bold uppercase text-slate-500 tracking-widest">Logo do Portal</label>
                     <div className="flex items-center gap-4">
                        <div className="w-16 h-16 rounded-xl border-2 border-dashed border-slate-200 flex items-center justify-center bg-slate-50 overflow-hidden relative">
                           {configPortal.logo_url ? (
                             <img src={configPortal.logo_url} alt="Logo" className="w-full h-full object-contain p-2" />
                           ) : (
                             <ImageIcon size={20} className="text-slate-300" />
                           )}
                           <input type="file" accept="image/*" onChange={handleLogoUpload} className="absolute inset-0 opacity-0 cursor-pointer" title="Trocar Logo" />
                        </div>
                        <div className="flex-1">
                          <p className="text-[10px] text-slate-500 font-medium">Clique no quadrado ao lado para enviar a sua logo. Ela aparecerá no topo do portal e no rodapé.</p>
                        </div>
                     </div>
                   </div>

                   <div className="space-y-1.5">
                     <label className="text-[10px] font-bold uppercase text-slate-500 tracking-widest flex items-center gap-1"><Instagram size={12}/> Link do Instagram</label>
                     <Input 
                       value={configPortal.instagram} 
                       onChange={e => setConfigPortal({...configPortal, instagram: e.target.value})} 
                       placeholder="https://instagram.com/criarte" 
                       className="h-10 bg-slate-50 border-slate-200 text-xs" 
                     />
                   </div>

                   <div className="space-y-1.5">
                     <label className="text-[10px] font-bold uppercase text-slate-500 tracking-widest flex items-center gap-1"><MessageCircle size={12}/> Número do WhatsApp</label>
                     <Input 
                       value={configPortal.whatsapp} 
                       onChange={e => setConfigPortal({...configPortal, whatsapp: e.target.value.replace(/\D/g, '')})} 
                       placeholder="Ex: 5511999999999 (Apenas números com DDD)" 
                       className="h-10 bg-slate-50 border-slate-200 text-xs" 
                     />
                     <p className="text-[9px] text-slate-400 font-medium">Coloque o 55 + DDD + Número. O cliente já cairá direto no seu chat.</p>
                   </div>

                   <Button onClick={handleSalvarConfig} disabled={salvandoConfig} className="w-full h-11 mt-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold uppercase text-[10px] tracking-widest shadow-sm flex gap-2">
                     {salvandoConfig ? <Loader2 size={16} className="animate-spin" /> : <><Check size={16}/> Salvar Configurações</>}
                   </Button>
                </div>

                <div className="bg-slate-100/50 p-4 rounded-2xl border border-slate-200 flex flex-col items-center justify-center relative overflow-hidden">
                   <div className="absolute top-2 left-3 bg-white px-2 py-0.5 rounded shadow-sm text-[8px] font-black uppercase tracking-widest text-slate-400">Preview (Como o cliente vê)</div>
                   
                   {configPortal.logo_url && (
                     <img src={configPortal.logo_url} alt="Logo Preview" className="h-6 mb-6 opacity-80" />
                   )}

                   <div className="w-full bg-gradient-to-br from-indigo-900 to-slate-900 rounded-xl p-5 shadow-lg relative overflow-hidden">
                     <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none"><Sparkles size={80} /></div>
                     <span className="text-[7px] font-bold text-indigo-300 uppercase tracking-widest block mb-1">Produção & Design</span>
                     <h2 className="text-sm font-black text-white uppercase tracking-tight mb-2">Conheça a Criarte Papelaria</h2>
                     <p className="text-[9px] font-medium text-slate-300 leading-relaxed mb-4">
                        Seja você a mamãe da festa ou um fornecedor parceiro, estamos à disposição para tirar dúvidas sobre a aplicação destes arquivos.
                     </p>
                     
                     <div className="flex flex-col gap-2">
                        <div className="bg-white/10 border border-white/20 text-white px-3 py-2 rounded-lg font-bold uppercase tracking-widest text-[8px] flex items-center justify-center gap-2">
                           <Instagram size={12} /> Acompanhe no Insta
                        </div>
                        <div className="bg-emerald-500 text-white px-3 py-2 rounded-lg font-bold uppercase tracking-widest text-[8px] flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(16,185,129,0.3)]">
                           <MessageCircle size={12} /> Tirar Dúvidas
                        </div>
                     </div>
                   </div>
                </div>
             </div>
          </div>
        )}

        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
           <div className="p-4 border-b border-slate-100 bg-slate-50/50">
             <div className="relative w-full md:max-w-sm">
               <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
               <input type="text" placeholder="Buscar link..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full h-10 md:h-9 pl-9 pr-4 bg-white outline-none text-xs font-medium border border-slate-200 rounded-md focus:border-blue-300 transition-all" />
             </div>
           </div>

           <div className="divide-y divide-slate-100">
             {filtrados.length === 0 ? (
               <p className="p-8 text-center text-xs font-semibold text-slate-400 uppercase tracking-widest">Nenhum link encontrado</p>
             ) : (
               filtrados.map(link => {
                 const nomeDoCliente = getNomeCliente(link.cliente_id);
                 const isPortalLink = link.url_destino && link.url_destino.includes('/entrega/');
                 const isDriveFolder = link.url_destino && link.url_destino.toLowerCase().includes('drive.google.com');

                 return (
                 <div key={link.id} className="p-4 hover:bg-slate-50 transition-colors flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                   <div className="flex-1 min-w-0">
                     <div className="flex items-center gap-2 mb-1.5">
                       <span className="font-bold text-sm text-slate-800 break-all">criartepapelaria.com.br/{link.slug}</span>
                       <a href={link.url_destino} target="_blank" rel="noreferrer" className="text-blue-500 hover:text-blue-700 p-1" title="Testar link original">
                         <ExternalLink size={14} />
                       </a>
                     </div>
                     
                     <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                       {isPortalLink ? (
                         <span className="flex items-center gap-1 text-[9px] font-bold uppercase tracking-widest text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-100 w-fit shrink-0">
                           <Gift size={10} /> Portal do Cliente
                         </span>
                       ) : (
                         <span className="flex items-center gap-1 text-[9px] font-bold uppercase tracking-widest text-slate-500 bg-slate-100 px-2 py-0.5 rounded border border-slate-200 w-fit shrink-0">
                           <Link2 size={10} /> Redirecionamento
                         </span>
                       )}
                       {nomeDoCliente && (
                         <span className="flex items-center gap-1 text-[9px] font-bold uppercase tracking-widest text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100 w-fit shrink-0">
                           <Users size={10} /> {nomeDoCliente}
                         </span>
                       )}
                       <p className="text-[10px] font-medium text-slate-400 truncate lg:max-w-md">{link.url_destino}</p>
                     </div>
                   </div>
                   
                   <div className="flex items-center gap-4 shrink-0 pt-3 lg:pt-0 border-t border-slate-100 lg:border-none mt-2 lg:mt-0">
                     <div className="flex flex-col items-center justify-center bg-slate-100 rounded-md px-3 py-1.5 min-w-[70px]">
                       <span className="text-[9px] font-semibold text-slate-400 uppercase tracking-widest flex items-center gap-1"><MousePointerClick size={10}/> Acessos</span>
                       <span className="text-sm font-black text-slate-700">{link.cliques || 0}</span>
                     </div>
                     
                     <div className="flex flex-wrap items-center gap-2">
                       {!isPortalLink && isDriveFolder && (
                         <Button variant="outline" onClick={() => handleConverterParaPortal(link)} className="h-10 md:h-9 px-3 border-indigo-200 text-indigo-600 rounded-md hover:bg-indigo-50 font-semibold text-[10px] uppercase gap-1.5 shadow-sm transition-colors" title="Transformar este link em Portal do Cliente">
                           <Sparkles size={14} /> Converter
                         </Button>
                       )}
                       <Button variant="outline" onClick={() => copiarLink(link.slug)} className="h-10 md:h-9 px-3 border-slate-200 text-slate-600 rounded-md hover:bg-slate-100 font-semibold text-[10px] uppercase gap-1.5 shadow-sm" title="Copiar Link">
                         <Copy size={14} /> Copiar
                       </Button>
                       {/* NOVO BOTÃO DE EDITAR AQUI */}
                       <Button variant="outline" onClick={() => abrirEdicao(link)} className="h-10 md:h-9 px-3 border-slate-200 text-blue-600 rounded-md hover:bg-blue-50 hover:border-blue-200 font-semibold text-[10px] uppercase gap-1.5 shadow-sm transition-colors" title="Editar Link">
                         <Edit2 size={14} /> Editar
                       </Button>
                       <Button variant="ghost" onClick={() => handleDelete(link.id)} className="h-10 md:h-9 px-3 rounded-md bg-red-50 text-red-500 hover:bg-red-600 hover:text-white font-semibold text-[10px] uppercase shadow-none border border-red-100 transition-colors" title="Excluir">
                         <Trash2 size={14}/>
                       </Button>
                     </div>
                   </div>
                 </div>
               )})
             )}
           </div>
        </div>
      </div>

      {/* ========================================= */}
      {/* MODAL DE EDIÇÃO (APARECE POR CIMA DE TUDO) */}
      {/* ========================================= */}
      {modalEdicao && (
        <div className="fixed inset-0 z-[100] bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            
            <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h3 className="text-sm font-black uppercase text-slate-800 tracking-tight flex items-center gap-2">
                <Edit2 size={16} className="text-blue-500" /> Editar Informações
              </h3>
              <button onClick={() => setModalEdicao(false)} className="text-slate-400 hover:text-red-500 transition-colors p-1">
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-5">
              
              <div className="space-y-1.5 relative">
                <label className="text-[10px] font-bold uppercase text-slate-500 tracking-widest ml-0.5">Cliente Vinculado</label>
                <div className="relative">
                  <UserSquare2 className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                  <Input 
                    value={editClienteAtual.nome} 
                    onChange={e => { setEditClienteAtual({ id: null, nome: e.target.value }); setMostrarDropdownEditCliente(true); }} 
                    onFocus={() => setMostrarDropdownEditCliente(true)}
                    onBlur={() => setTimeout(() => setMostrarDropdownEditCliente(false), 200)}
                    placeholder="Deixar sem cliente..." 
                    className="h-11 pl-9 font-medium bg-white border-slate-200 focus:border-blue-400 rounded-lg text-xs" 
                  />
                  
                  {mostrarDropdownEditCliente && editClienteAtual.nome.length > 0 && (
                    <div className="absolute top-12 left-0 right-0 bg-white border border-slate-200 rounded-lg shadow-xl max-h-48 overflow-y-auto p-1.5 space-y-0.5 z-50">
                      {clientes.filter(c => c.nome.toLowerCase().includes(editClienteAtual.nome.toLowerCase())).length > 0 ? (
                        clientes.filter(c => c.nome.toLowerCase().includes(editClienteAtual.nome.toLowerCase())).map(cli => (
                          <div key={cli.id} onMouseDown={() => selecionarClienteEdit(cli)} className="flex flex-col p-2.5 hover:bg-slate-50 rounded-md cursor-pointer transition-colors">
                            <span className="text-xs font-semibold text-slate-800 uppercase">{cli.nome}</span>
                          </div>
                        ))
                      ) : (
                        <div className="p-3 text-center"><span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Nenhum cliente encontrado</span></div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase text-slate-500 tracking-widest ml-0.5">Final do Link Personalizado</label>
                <div className="flex items-center">
                  <span className="bg-slate-100 text-slate-400 text-xs font-bold px-3 h-11 flex items-center rounded-l-lg border border-r-0 border-slate-200">criartepapelaria.com.br/</span>
                  <Input 
                    value={editDados.slug} 
                    onChange={e => setEditDados({...editDados, slug: e.target.value})} 
                    className="h-11 bg-white border-slate-200 rounded-l-none rounded-r-lg font-bold text-slate-800 text-sm focus:border-blue-400 px-3" 
                  />
                </div>
              </div>

              {editDados.isPortal && (
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase text-slate-500 tracking-widest ml-0.5" title="Altere para recriar o prazo de 30 dias">Nova Data do Evento</label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                    <Input 
                      type="date" 
                      value={editDados.dataEvento} 
                      onChange={e => setEditDados({...editDados, dataEvento: e.target.value})} 
                      className="h-11 pl-9 bg-white border-slate-200 rounded-lg font-bold text-slate-800 text-sm focus:border-blue-400" 
                    />
                  </div>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase text-slate-500 tracking-widest ml-0.5">URL de Destino</label>
                <div className="relative">
                  <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                  <Input 
                    value={editDados.url_destino} 
                    onChange={e => setEditDados({...editDados, url_destino: e.target.value})} 
                    className="h-11 pl-9 bg-slate-50 border-slate-200 rounded-lg font-medium text-slate-500 text-xs" 
                  />
                </div>
                <p className="text-[9px] text-slate-400 font-medium ml-0.5 mt-1">Cuidado ao alterar o destino, certifique-se que o link está correto.</p>
              </div>

            </div>

            <div className="p-5 border-t border-slate-100 bg-slate-50/50 flex justify-end gap-3">
              <Button onClick={() => setModalEdicao(false)} variant="ghost" className="h-10 px-5 text-[10px] font-bold uppercase tracking-widest text-slate-500 hover:text-slate-800">
                Cancelar
              </Button>
              <Button onClick={salvarEdicao} disabled={salvando} className="h-10 px-6 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold uppercase text-[10px] tracking-widest shadow-sm">
                {salvando ? <Loader2 size={16} className="animate-spin" /> : "Salvar Alterações"}
              </Button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}