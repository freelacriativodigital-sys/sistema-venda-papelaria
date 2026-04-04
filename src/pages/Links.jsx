import React, { useState, useEffect } from 'react';
import { Plus, Search, Trash2, Copy, Loader2, MousePointerClick, ExternalLink, UserSquare2, Users, Gift, Settings, Image as ImageIcon, Instagram, MessageCircle, Sparkles, Check, Edit2, X, Link as LinkIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "../lib/supabase";
import { AnimatePresence, motion } from "framer-motion";

import SeletorData from "@/components/SeletorData";

export default function Links() {
  const [links, setLinks] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Estados para Criação de Portal
  const [dataEvento, setDataEvento] = useState('');
  const [slug, setSlug] = useState('');
  const [urlDestino, setUrlDestino] = useState('');
  const [salvando, setSalvando] = useState(false);
  const [isMobileFormOpen, setIsMobileFormOpen] = useState(false);

  // Estados do Cliente
  const [clienteAtual, setClienteAtual] = useState({ id: null, nome: '' });
  const [mostrarDropdownCliente, setMostrarDropdownCliente] = useState(false);

  // Estados do Modal de Edição
  const [modalEdicao, setModalEdicao] = useState(false);
  const [editDados, setEditDados] = useState({ id: null, slug: '', url_destino: '', dataEvento: '' });
  const [editClienteAtual, setEditClienteAtual] = useState({ id: null, nome: '' });
  const [mostrarDropdownEditCliente, setMostrarDropdownEditCliente] = useState(false);

  // Estados das Configurações do Portal
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

  // === FUNÇÕES DE CONFIGURAÇÃO ===
  const handleLogoUpload = async (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = async () => setConfigPortal(prev => ({ ...prev, logo_url: reader.result }));
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
      alert("Configurações atualizadas!");
      setMostrarConfig(false);
    } catch (err) {
      alert("Erro ao salvar: " + err.message);
    } finally {
      setSalvandoConfig(false);
    }
  };

  // === FUNÇÕES DE CRIAÇÃO ===
  const gerarSlugAutomatico = (texto) => {
    return texto.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]/g, "_").replace(/_+/g, "_");
  };

  const selecionarCliente = (cli) => {
    setClienteAtual({ id: cli.id, nome: cli.nome });
    setMostrarDropdownCliente(false);
    if (!slug) setSlug(gerarSlugAutomatico(cli.nome));
  };

  const handleAdd = async () => {
    if (!urlDestino) return alert("Cole o link da pasta do Drive!");
    
    let finalSlug = slug || "portal_" + Math.floor(Math.random() * 10000);
    finalSlug = finalSlug.replace(/[^a-zA-Z0-9_-]/g, "");

    const folderMatch = urlDestino.match(/folders\/([a-zA-Z0-9_-]+)/);
    const idMatch = urlDestino.match(/id=([a-zA-Z0-9_-]+)/);
    let folderId = "";
    
    if (folderMatch && folderMatch[1]) folderId = folderMatch[1];
    else if (idMatch && idMatch[1]) folderId = idMatch[1];
    else if (urlDestino.includes("drive.google.com") && !urlDestino.includes("folders/")) {
       return alert("Atenção: Por favor, cole o link de uma PASTA do Google Drive.");
    } else folderId = urlDestino;

    const origin = window.location.origin;
    const finalUrlDestino = `${origin}/entrega/${folderId}${dataEvento ? '?evento=' + dataEvento : ''}`;

    setSalvando(true);
    const payload = { slug: finalSlug, url_destino: finalUrlDestino, cliente_id: clienteAtual.id };
    const { error } = await supabase.from('encurtador').insert([payload]);
    setSalvando(false);

    if (error) {
      if (error.code === '23505') alert("Esse final de link já existe! Escolha outro nome.");
      else alert("Erro ao salvar: " + error.message);
    } else {
      setSlug(''); setUrlDestino(''); setDataEvento(''); setClienteAtual({ id: null, nome: '' });
      setIsMobileFormOpen(false);
      fetchData();
    }
  };

  // === FUNÇÕES DE EDIÇÃO E LISTAGEM ===
  const abrirEdicao = (link) => {
    let urlLimpa = link.url_destino;
    let dataExtraida = '';
    
    if (urlLimpa.includes('?evento=')) {
      const split = urlLimpa.split('?evento=');
      urlLimpa = split[0];
      dataExtraida = split[1];
    }
    
    setEditDados({ id: link.id, slug: link.slug, url_destino: urlLimpa, dataEvento: dataExtraida });
    const cli = clientes.find(c => c.id === link.cliente_id);
    setEditClienteAtual(cli ? { id: cli.id, nome: cli.nome } : { id: null, nome: '' });
    setModalEdicao(true);
  };

  const salvarEdicao = async () => {
    if (!editDados.url_destino || !editDados.slug) return alert("URL e Nome são obrigatórios.");
    setSalvando(true);
    let urlFinal = editDados.dataEvento ? `${editDados.url_destino}?evento=${editDados.dataEvento}` : editDados.url_destino;

    const { error } = await supabase.from('encurtador').update({
      slug: gerarSlugAutomatico(editDados.slug), 
      url_destino: urlFinal,
      cliente_id: editClienteAtual.id
    }).eq('id', editDados.id);

    setSalvando(false);
    if (error) alert("Erro ao salvar edição: " + error.message);
    else { setModalEdicao(false); fetchData(); }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Deseja excluir este portal?")) {
      await supabase.from('encurtador').delete().eq('id', id);
      fetchData();
    }
  };

  const copiarLink = (slugDaVez) => {
    const urlCompleta = window.location.origin + "/" + slugDaVez;
    navigator.clipboard.writeText(urlCompleta);
    alert("Link copiado: " + urlCompleta);
  };

  const getNomeCliente = (id) => {
    if (!id) return null;
    const c = clientes.find(cli => cli.id === id);
    return c ? c.nome : 'Cliente Removido';
  };

  const filtrados = links.filter(l => l.slug.toLowerCase().includes(searchTerm.toLowerCase()));

  // === FORMULÁRIO REUTILIZÁVEL (Desktop Inline / Mobile Modal) ===
  const FormularioNovoPortal = () => (
    <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
      <div className="md:col-span-3 space-y-1.5 relative">
        <label className="text-[9px] font-semibold uppercase text-slate-500 tracking-widest ml-1">Cliente</label>
        <div className="relative">
          <UserSquare2 className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
          <Input 
            value={clienteAtual.nome} 
            onChange={e => { setClienteAtual({ id: null, nome: e.target.value }); setMostrarDropdownCliente(true); }} 
            onFocus={() => setMostrarDropdownCliente(true)}
            onBlur={() => setTimeout(() => setMostrarDropdownCliente(false), 200)}
            placeholder="Buscar..." 
            className="h-9 pl-8 font-medium bg-slate-50 border-slate-200 focus:bg-white rounded-md text-[10px]" 
          />
          {mostrarDropdownCliente && clienteAtual.nome.length > 0 && (
            <div className="absolute top-10 left-0 right-0 bg-white border border-slate-200 rounded-md shadow-lg max-h-40 overflow-y-auto p-1 space-y-0.5 z-50">
              {clientes.filter(c => c.nome.toLowerCase().includes(clienteAtual.nome.toLowerCase())).map(cli => (
                <div key={cli.id} onMouseDown={() => selecionarCliente(cli)} className="flex flex-col p-2 hover:bg-slate-50 rounded cursor-pointer transition-colors">
                  <span className="text-[10px] font-semibold text-slate-800 uppercase">{cli.nome}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="md:col-span-3 space-y-1.5">
        <label className="text-[9px] font-semibold uppercase text-slate-500 tracking-widest ml-1">Final do Link</label>
        <div className="flex items-center">
          <span className="bg-slate-100 text-slate-400 text-[10px] font-medium px-2 h-9 flex items-center rounded-l-md border border-r-0 border-slate-200">/</span>
          <Input value={slug} onChange={e => setSlug(gerarSlugAutomatico(e.target.value))} placeholder="nome_do_evento" className="h-9 bg-slate-50 border-slate-200 rounded-l-none rounded-r-md font-medium text-slate-800 text-[10px] focus:bg-white px-2" />
        </div>
      </div>

      <div className="md:col-span-2 space-y-1.5">
        <SeletorData label="Data do Evento" value={dataEvento} onChange={setDataEvento} />
      </div>
      
      <div className="md:col-span-4 space-y-1.5">
        <label className="text-[9px] font-semibold uppercase text-slate-500 tracking-widest ml-1">Link da Pasta do Drive</label>
        <div className="relative">
          <LinkIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
          <Input value={urlDestino} onChange={e => setUrlDestino(e.target.value)} placeholder="https://drive.google.com/drive/folders/..." className="h-9 pl-8 bg-slate-50 border-slate-200 rounded-md font-medium text-slate-800 text-[10px] focus:bg-white" />
        </div>
      </div>
      
      <div className="md:col-span-12 flex justify-end mt-2 md:mt-0">
        <Button onClick={handleAdd} disabled={salvando} className="w-full md:w-auto px-6 h-9 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-semibold uppercase tracking-widest text-[9px] shadow-sm">
          {salvando ? <Loader2 size={14} className="animate-spin" /> : "Gerar Portal"}
        </Button>
      </div>
    </div>
  );

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-slate-50"><Loader2 className="animate-spin text-blue-600" size={32} /></div>;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-20">
      
      {/* HEADER FIXO MOBILE */}
      <div className="md:hidden sticky top-0 z-[40] bg-white/90 backdrop-blur-md border-b border-slate-200 px-4 py-3 flex items-center justify-between shadow-sm">
         <div>
           <h1 className="text-sm font-semibold uppercase text-slate-800 tracking-tight">Portais</h1>
         </div>
         <div className="flex gap-1.5">
           <Button onClick={() => setMostrarConfig(!mostrarConfig)} variant="outline" className="h-8 px-2.5 bg-white text-slate-500 border-slate-200 shadow-sm">
             <Settings size={14}/>
           </Button>
           <Button onClick={() => setIsMobileFormOpen(true)} className="h-8 px-3.5 bg-blue-600 hover:bg-blue-700 text-white text-[9px] uppercase font-semibold tracking-widest shadow-sm">
             <Plus size={14} className="mr-1"/> Novo
           </Button>
         </div>
      </div>

      <div className="max-w-6xl mx-auto space-y-4 px-4 sm:px-6 pt-4 md:pt-8 animate-in fade-in">
        
        {/* HEADER DESKTOP */}
        <div className="hidden md:flex items-center justify-between mb-4 border-b border-slate-200 pb-3">
          <div>
             <h1 className="text-lg font-semibold uppercase text-slate-800 tracking-tight">Gerenciador de Portais</h1>
             <p className="text-[9px] font-medium text-slate-500 uppercase tracking-widest mt-0.5">Entregue arquivos com profissionalismo</p>
          </div>
          <Button onClick={() => setMostrarConfig(!mostrarConfig)} variant="outline" className="h-9 px-4 rounded-md font-semibold uppercase tracking-widest text-[9px] gap-1.5 bg-white text-slate-600 border-slate-200 hover:bg-slate-50 shadow-sm">
            <Settings size={14} /> Configurar Portal
          </Button>
        </div>

        {/* FORMULÁRIO DESKTOP (INLINE) */}
        <div className="hidden md:block bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
           <h3 className="text-[10px] font-semibold uppercase tracking-widest text-slate-700 flex items-center gap-1.5 mb-3 border-b border-slate-100 pb-2">
             <Gift size={14} className="text-blue-500"/> Criar Novo Portal
           </h3>
           <FormularioNovoPortal />
        </div>

        {/* CONFIGURAÇÕES DO PORTAL */}
        <AnimatePresence>
          {mostrarConfig && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
              <div className="bg-white p-4 md:p-5 rounded-xl border border-slate-200 shadow-sm mb-4">
                 <div className="flex items-center gap-2 mb-4 border-b border-slate-100 pb-3">
                   <Sparkles size={16} className="text-indigo-500" />
                   <div>
                     <h3 className="text-[11px] font-semibold uppercase tracking-tight text-slate-800">Marketing do Portal</h3>
                     <p className="text-[8px] font-medium text-slate-500 uppercase tracking-widest">Contatos no rodapé da página do cliente</p>
                   </div>
                 </div>

                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-3">
                       <div className="space-y-1">
                         <label className="text-[9px] font-semibold uppercase text-slate-500 tracking-widest">Logo do Portal</label>
                         <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-lg border border-dashed border-slate-200 flex items-center justify-center bg-slate-50 overflow-hidden relative shrink-0">
                               {configPortal.logo_url ? <img src={configPortal.logo_url} alt="Logo" className="w-full h-full object-contain p-1" /> : <ImageIcon size={16} className="text-slate-300" />}
                               <input type="file" accept="image/*" onChange={handleLogoUpload} className="absolute inset-0 opacity-0 cursor-pointer" />
                            </div>
                            <p className="text-[9px] text-slate-400 font-medium leading-tight">Clique no quadrado para enviar sua logo.</p>
                         </div>
                       </div>
                       <div className="space-y-1">
                         <label className="text-[9px] font-semibold uppercase text-slate-500 tracking-widest flex items-center gap-1"><Instagram size={12}/> Link do Instagram</label>
                         <Input value={configPortal.instagram} onChange={e => setConfigPortal({...configPortal, instagram: e.target.value})} placeholder="https://instagram.com/criarte" className="h-9 bg-slate-50 border-slate-200 text-[10px] font-medium" />
                       </div>
                       <div className="space-y-1">
                         <label className="text-[9px] font-semibold uppercase text-slate-500 tracking-widest flex items-center gap-1"><MessageCircle size={12}/> WhatsApp (Com DDD)</label>
                         <Input value={configPortal.whatsapp} onChange={e => setConfigPortal({...configPortal, whatsapp: e.target.value.replace(/\D/g, '')})} placeholder="Ex: 5511999999999" className="h-9 bg-slate-50 border-slate-200 text-[10px] font-medium" />
                       </div>
                       <div className="flex justify-end pt-2">
                         <Button onClick={handleSalvarConfig} disabled={salvandoConfig} className="h-9 px-5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md font-semibold uppercase tracking-widest text-[9px] shadow-sm flex gap-1.5">
                           {salvandoConfig ? <Loader2 size={14} className="animate-spin" /> : <><Check size={14}/> Salvar</>}
                         </Button>
                       </div>
                    </div>
                 </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* LISTAGEM DE PORTAIS */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
           <div className="p-3 border-b border-slate-100 bg-slate-50/50">
             <div className="relative w-full md:max-w-xs">
               <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
               <input type="text" placeholder="Buscar portal..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full h-9 pl-8 pr-3 bg-white outline-none text-[10px] font-medium border border-slate-200 rounded-md focus:border-blue-300 transition-all" />
             </div>
           </div>

           <div className="divide-y divide-slate-100">
             {filtrados.length === 0 ? (
               <p className="p-6 text-center text-[10px] font-semibold text-slate-400 uppercase tracking-widest">Nenhum portal encontrado</p>
             ) : (
               filtrados.map(link => {
                 const nomeDoCliente = getNomeCliente(link.cliente_id);
                 return (
                 <div key={link.id} className="p-3 md:p-4 hover:bg-slate-50 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-3">
                   <div className="flex-1 min-w-0">
                     <div className="flex items-center gap-1.5 mb-1.5">
                       <span className="font-semibold text-xs text-slate-800 truncate">criartepapelaria.com.br/{link.slug}</span>
                       <a href={link.url_destino} target="_blank" rel="noreferrer" className="text-blue-500 hover:text-blue-700" title="Testar Destino">
                         <ExternalLink size={12} />
                       </a>
                     </div>
                     <div className="flex flex-wrap items-center gap-1.5">
                       <span className="flex items-center gap-1 text-[8px] font-semibold uppercase tracking-widest text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-100 shrink-0">
                         <Gift size={10} /> Portal
                       </span>
                       {nomeDoCliente && (
                         <span className="flex items-center gap-1 text-[8px] font-semibold uppercase tracking-widest text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100 shrink-0">
                           <Users size={10} /> {nomeDoCliente}
                         </span>
                       )}
                     </div>
                   </div>
                   
                   <div className="flex items-center gap-2 shrink-0 pt-2 md:pt-0 border-t border-slate-50 md:border-none">
                     <div className="flex flex-col items-center justify-center bg-slate-100 rounded-md px-2 py-1 min-w-[50px] mr-2">
                       <span className="text-[7px] font-semibold text-slate-400 uppercase tracking-widest flex items-center gap-0.5"><MousePointerClick size={8}/> Acessos</span>
                       <span className="text-xs font-semibold text-slate-700">{link.cliques || 0}</span>
                     </div>
                     <Button variant="outline" onClick={() => copiarLink(link.slug)} className="h-7 px-2 border-slate-200 text-slate-500 rounded-md hover:bg-slate-100 font-semibold text-[8px] uppercase tracking-widest gap-1 shadow-sm">
                       <Copy size={12} /> Copiar
                     </Button>
                     <Button variant="outline" onClick={() => abrirEdicao(link)} className="h-7 px-2 border-slate-200 text-blue-600 rounded-md hover:bg-blue-50 hover:border-blue-200 font-semibold text-[8px] uppercase tracking-widest gap-1 shadow-sm">
                       <Edit2 size={12} /> Editar
                     </Button>
                     <Button variant="ghost" onClick={() => handleDelete(link.id)} className="h-7 px-2 rounded-md bg-red-50 text-red-500 hover:bg-red-100 font-semibold text-[8px] uppercase tracking-widest border border-red-100">
                       <Trash2 size={12}/>
                     </Button>
                   </div>
                 </div>
               )})
             )}
           </div>
        </div>
      </div>

      {/* === MODAL "NOVO PORTAL" (MOBILE APENAS) === */}
      <AnimatePresence>
        {isMobileFormOpen && (
          <div className="md:hidden fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-sm flex items-end justify-center p-0">
            <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} transition={{ type: "spring", damping: 25, stiffness: 300 }} className="bg-white w-full rounded-t-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
              <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50 sticky top-0 z-10">
                <h3 className="text-xs font-semibold uppercase tracking-widest text-slate-800 flex items-center gap-1.5">
                  <Gift size={14} className="text-blue-500" /> Novo Portal
                </h3>
                <button onClick={() => setIsMobileFormOpen(false)} className="text-slate-400 hover:text-slate-600 p-1 bg-white rounded-md border border-slate-200">
                  <X size={16} />
                </button>
              </div>
              <div className="p-4 overflow-y-auto">
                <FormularioNovoPortal />
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* === MODAL DE EDIÇÃO === */}
      <AnimatePresence>
        {modalEdicao && (
          <div className="fixed inset-0 z-[110] bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="bg-white w-full max-w-sm rounded-xl shadow-2xl overflow-hidden">
              <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                <h3 className="text-[11px] font-semibold uppercase text-slate-800 tracking-widest flex items-center gap-1.5">
                  <Edit2 size={14} className="text-blue-500" /> Editar Portal
                </h3>
                <button onClick={() => setModalEdicao(false)} className="text-slate-400 hover:text-red-500 p-1">
                  <X size={16} />
                </button>
              </div>

              <div className="p-4 space-y-3">
                <div className="space-y-1 relative">
                  <label className="text-[9px] font-semibold uppercase text-slate-500 tracking-widest ml-1">Cliente</label>
                  <div className="relative">
                    <UserSquare2 className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                    <Input value={editClienteAtual.nome} onChange={e => { setEditClienteAtual({ id: null, nome: e.target.value }); setMostrarDropdownEditCliente(true); }} onFocus={() => setMostrarDropdownEditCliente(true)} onBlur={() => setTimeout(() => setMostrarDropdownEditCliente(false), 200)} placeholder="Sem cliente..." className="h-9 pl-8 font-medium bg-slate-50 border-slate-200 rounded-md text-[10px] focus:bg-white" />
                    {mostrarDropdownEditCliente && editClienteAtual.nome.length > 0 && (
                      <div className="absolute top-10 left-0 right-0 bg-white border border-slate-200 rounded-md shadow-lg max-h-40 overflow-y-auto p-1 space-y-0.5 z-50">
                        {clientes.filter(c => c.nome.toLowerCase().includes(editClienteAtual.nome.toLowerCase())).map(cli => (
                          <div key={cli.id} onMouseDown={() => { setEditClienteAtual({ id: cli.id, nome: cli.nome }); setMostrarDropdownEditCliente(false); }} className="flex flex-col p-2 hover:bg-slate-50 rounded cursor-pointer transition-colors">
                            <span className="text-[10px] font-semibold text-slate-800 uppercase">{cli.nome}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] font-semibold uppercase text-slate-500 tracking-widest ml-1">Final do Link</label>
                  <div className="flex items-center">
                    <span className="bg-slate-100 text-slate-400 text-[9px] font-medium px-2 h-9 flex items-center rounded-l-md border border-r-0 border-slate-200">/</span>
                    <Input value={editDados.slug} onChange={e => setEditDados({...editDados, slug: e.target.value})} className="h-9 bg-slate-50 border-slate-200 rounded-l-none rounded-r-md font-medium text-slate-800 text-[10px] focus:bg-white px-2" />
                  </div>
                </div>

                <div className="space-y-1">
                  <SeletorData label="Nova Data do Evento" value={editDados.dataEvento} onChange={(val) => setEditDados({...editDados, dataEvento: val})} />
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] font-semibold uppercase text-slate-500 tracking-widest ml-1">Link da Pasta do Drive</label>
                  <div className="relative">
                    <LinkIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                    <Input value={editDados.url_destino} onChange={e => setEditDados({...editDados, url_destino: e.target.value})} className="h-9 pl-8 bg-slate-50 border-slate-200 rounded-md font-medium text-slate-500 text-[10px] focus:bg-white" />
                  </div>
                </div>
              </div>

              <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex justify-end gap-2">
                <Button onClick={() => setModalEdicao(false)} variant="ghost" className="h-9 px-4 text-[9px] font-semibold uppercase tracking-widest text-slate-500 hover:text-slate-800 rounded-md">Cancelar</Button>
                <Button onClick={salvarEdicao} disabled={salvando} className="h-9 px-5 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-semibold uppercase tracking-widest text-[9px] shadow-sm">
                  {salvando ? <Loader2 size={14} className="animate-spin" /> : "Salvar"}
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}