import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Trash2, Link as LinkIcon, Save, Palette, AlignLeft, Calendar, Clock, MapPin, Image as ImageIcon, ChevronLeft, MessageSquare, Edit3, Type, List, Loader2, Phone, ChevronDown, CheckCircle2, Search, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const criarSlug = (texto) => {
  return texto
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '');
};

export default function Briefings() {
  const [templates, setTemplates] = useState([]);
  const [respostas, setRespostas] = useState([]);
  
  const [isBuilding, setIsBuilding] = useState(false);
  const [viewingTemplate, setViewingTemplate] = useState(null); 
  const [novoTemplate, setNovoTemplate] = useState({ titulo: '', descricao: '', banner_url: '', campos: [] });

  const [isSaving, setIsSaving] = useState(false);
  
  // ESTADOS DA SANFONA, ABAS E PESQUISA
  const [respostaTab, setRespostaTab] = useState('novas'); 
  const [expandedResp, setExpandedResp] = useState(null);
  const [searchTermResp, setSearchTermResp] = useState(''); // Estado para a barra de pesquisa

  useEffect(() => {
    carregarDados();
  }, []);

  async function carregarDados() {
    const { data: tData } = await supabase.from('briefing_templates').select('*').order('created_at', { ascending: false });
    if (tData) setTemplates(tData);

    const { data: rData } = await supabase.from('briefing_respostas').select('*').order('created_at', { ascending: false });
    if (rData) setRespostas(rData);
  }

  const copiarLink = (template) => {
    const link = `${window.location.origin}/form/${template.slug}`;
    navigator.clipboard.writeText(link);
    alert("Link copiado!");
  };

  const adicionarCampo = (tipo, label = "Nova Pergunta") => {
    const campo = { id: Date.now().toString(), tipo, pergunta: label, obrigatorio: true };
    setNovoTemplate(prev => ({ ...prev, campos: [...prev.campos, campo] }));
  };

  const atualizarCampo = (id, chave, valor) => {
    setNovoTemplate(prev => ({
      ...prev,
      campos: prev.campos.map(c => c.id === id ? { ...c, [chave]: valor } : c)
    }));
  };

  const removerCampo = (id) => {
    setNovoTemplate(prev => ({ ...prev, campos: prev.campos.filter(c => c.id !== id) }));
  };

  const salvarTemplate = async () => {
    if (!novoTemplate.titulo) return alert("Dê um título ao formulário!");
    if (novoTemplate.campos.length === 0) return alert("Adicione pelo menos uma pergunta!");

    setIsSaving(true);
    const { data: authData } = await supabase.auth.getUser();
    const userId = authData?.user?.id;
    
    if (novoTemplate.id) {
      const { error } = await supabase.from('briefing_templates').update({
        titulo: novoTemplate.titulo,
        descricao: novoTemplate.descricao,
        banner_url: novoTemplate.banner_url,
        campos: novoTemplate.campos
      }).eq('id', novoTemplate.id);

      if (!error) {
        alert("Formulário atualizado!");
        setIsBuilding(false);
        carregarDados();
      } else {
        alert("Erro: " + error.message);
      }
    } else {
      const slug = criarSlug(novoTemplate.titulo) + '-' + Math.floor(Math.random() * 1000);
      const payload = { ...novoTemplate, slug };
      if (userId) payload.usuario_id = userId;
      const { error } = await supabase.from('briefing_templates').insert([payload]);
      if (!error) {
        alert("Formulário criado!");
        setIsBuilding(false);
        carregarDados();
      } else {
        alert("Erro: " + error.message);
      }
    }
    setIsSaving(false);
  };

  const handleEditTemplate = (template) => {
    setNovoTemplate(template);
    setIsBuilding(true);
  };

  const handleDeleteTemplate = async (id) => {
    if (window.confirm("ATENÇÃO: Excluir este formulário fará com que o link pare de funcionar. Deseja continuar?")) {
      await supabase.from('briefing_templates').delete().eq('id', id);
      carregarDados();
    }
  };

  const toggleLida = async (id, statusAtual) => {
    const { error } = await supabase.from('briefing_respostas').update({ lida: !statusAtual }).eq('id', id);
    if (!error) {
      setRespostas(prev => prev.map(r => r.id === id ? { ...r, lida: !statusAtual } : r));
    }
  };

  // --- FUNÇÃO PARA EXCLUIR RESPOSTA ---
  const handleDeleteResposta = async (id) => {
    if (window.confirm("Deseja realmente excluir esta resposta permanentemente?")) {
      const { error } = await supabase.from('briefing_respostas').delete().eq('id', id);
      if (!error) {
        setRespostas(prev => prev.filter(r => r.id !== id));
        if (expandedResp === id) setExpandedResp(null);
      } else {
        alert("Erro ao excluir: " + error.message);
      }
    }
  };

  const renderIcon = (tipo) => {
    switch (tipo) {
      case 'texto_curto': return <Type size={14} className="text-blue-500" />;
      case 'texto_longo': return <AlignLeft size={14} className="text-emerald-500" />;
      case 'data': return <Calendar size={14} className="text-amber-500" />;
      case 'hora': return <Clock size={14} className="text-purple-500" />;
      case 'endereco': return <MapPin size={14} className="text-rose-500" />;
      default: return <List size={14} />;
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 pb-20 relative">
      
      <div className="border-b border-slate-200 bg-white/90 backdrop-blur-md sticky top-0 z-10 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-3 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <h1 className="text-lg md:text-xl font-semibold text-slate-800 uppercase leading-none tracking-tight flex items-center gap-2">
              <AlignLeft className="w-5 h-5 text-blue-600" /> Formulários
            </h1>
            <div className="h-6 w-px bg-slate-200 hidden md:block"></div>
            <p className="text-[9px] md:text-[10px] text-slate-500 font-medium uppercase tracking-widest hidden md:block mt-0.5">Briefings e Captura</p>
          </div>
          <Button onClick={() => { setNovoTemplate({ titulo: '', descricao: '', banner_url: '', campos: [] }); setIsBuilding(true); }} className="h-9 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-semibold uppercase text-[10px] px-4 shadow-sm w-full md:w-auto">
            <Plus size={14} className="mr-1.5" /> Novo Formulário
          </Button>
        </div>
      </div>

      <div className="max-w-5xl mx-auto p-4 sm:px-6 mt-4">
        {templates.length === 0 ? (
           <div className="text-center py-16 bg-white rounded-xl border border-slate-200 shadow-sm">
             <AlignLeft size={32} className="mx-auto text-slate-300 mb-3" />
             <p className="text-[9px] font-medium uppercase text-slate-400 tracking-widest">Crie seu primeiro briefing para enviar aos clientes.</p>
           </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {templates.map(t => {
               const countNaoLidas = respostas.filter(r => r.template_id === t.id && !r.lida).length;
               return (
                 <div key={t.id} className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex flex-col gap-3 transition-all hover:border-blue-200 hover:shadow-md">
                    <div className="flex justify-between items-start gap-2">
                      <div className="overflow-hidden">
                        <h3 className="text-sm font-semibold text-slate-800 uppercase tracking-tight truncate">{t.titulo}</h3>
                        <p className="text-[9px] font-medium text-slate-400 mt-0.5 truncate tracking-widest">Link: /form/{t.slug}</p>
                      </div>
                      <span className="bg-slate-50 text-slate-500 text-[8px] font-semibold px-2 py-0.5 rounded-md uppercase border border-slate-100 shrink-0">{t.campos.length} Campos</span>
                    </div>

                    <div className="mt-auto pt-3 border-t border-slate-100 flex flex-wrap items-center gap-1.5">
                      <Button variant="outline" onClick={() => copiarLink(t)} className="h-8 px-2.5 rounded-full text-purple-600 border-purple-200 hover:bg-purple-50 text-[9px] font-semibold uppercase tracking-widest bg-purple-50/30 transition-colors">
                        <LinkIcon size={12} className="mr-1"/> Link
                      </Button>
                      <Button variant="default" onClick={() => { setViewingTemplate(t); setRespostaTab('novas'); setSearchTermResp(''); }} className="h-8 px-2.5 rounded-full bg-slate-800 hover:bg-slate-900 text-white text-[9px] font-semibold uppercase tracking-widest shadow-sm transition-colors relative">
                        <MessageSquare size={12} className="mr-1"/> Respostas
                        {countNaoLidas > 0 && <span className="absolute -top-1.5 -right-1.5 bg-rose-500 text-white text-[8px] w-4 h-4 flex items-center justify-center rounded-full animate-pulse">{countNaoLidas}</span>}
                      </Button>
                      
                      <div className="flex gap-1 ml-auto">
                        <Button variant="ghost" size="icon" onClick={() => handleEditTemplate(t)} className="h-8 w-8 text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors rounded-full"><Edit3 size={14} /></Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDeleteTemplate(t.id)} className="h-8 w-8 text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors rounded-full"><Trash2 size={14} /></Button>
                      </div>
                    </div>
                 </div>
               )
            })}
          </div>
        )}
      </div>

      {/* OVERLAY: VER RESPOSTAS (MODO SANFONA + PESQUISA) */}
      <AnimatePresence>
        {viewingTemplate && (
          <motion.div initial={{ opacity: 0, x: '10%' }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: '10%' }} transition={{ type: "spring", bounce: 0, duration: 0.4 }} className="fixed inset-0 z-[200] bg-[#f8fafc] overflow-y-auto flex flex-col">
            
            <div className="bg-white border-b border-slate-200 sticky top-0 z-50 shadow-sm">
              <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <button onClick={() => { setViewingTemplate(null); setExpandedResp(null); }} className="w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-500 transition-colors">
                    <ChevronLeft size={18} />
                  </button>
                  <div className="w-8 h-8 rounded-lg bg-emerald-50 hidden sm:flex items-center justify-center border border-emerald-100"><MessageSquare className="text-emerald-600 w-4 h-4" /></div>
                  <h2 className="text-sm md:text-base font-semibold text-slate-800 uppercase tracking-tight leading-none truncate max-w-[200px] sm:max-w-md">Respostas: {viewingTemplate.titulo}</h2>
                </div>
              </div>
            </div>

            <div className="flex-1 w-full max-w-4xl mx-auto p-4 pb-24 space-y-4">
              
              {/* BARRA DE PESQUISA */}
              <div className="relative group">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" size={16} />
                <Input 
                  placeholder="Pesquisar por nome ou WhatsApp..." 
                  value={searchTermResp}
                  onChange={(e) => setSearchTermResp(e.target.value)}
                  className="h-10 pl-10 bg-white border-slate-200 text-xs font-medium rounded-xl shadow-sm focus:ring-2 focus:ring-blue-100"
                />
                {searchTermResp && (
                  <button onClick={() => setSearchTermResp('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                    <X size={14} />
                  </button>
                )}
              </div>

              {/* ABAS */}
              <div className="flex bg-slate-200/60 p-1.5 rounded-xl border border-slate-200 shadow-inner">
                 <button onClick={() => { setRespostaTab('novas'); setExpandedResp(null); }} className={`flex-1 py-2.5 text-[10px] font-bold uppercase tracking-widest rounded-lg transition-all ${respostaTab === 'novas' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}>
                   Novas ({respostas.filter(r => r.template_id === viewingTemplate.id && !r.lida).length})
                 </button>
                 <button onClick={() => { setRespostaTab('lidas'); setExpandedResp(null); }} className={`flex-1 py-2.5 text-[10px] font-bold uppercase tracking-widest rounded-lg transition-all ${respostaTab === 'lidas' ? 'bg-white shadow-sm text-emerald-600' : 'text-slate-500 hover:text-slate-700'}`}>
                   Arquivadas ({respostas.filter(r => r.template_id === viewingTemplate.id && r.lida).length})
                 </button>
              </div>

              {/* LISTAGEM COM FILTRO DE PESQUISA */}
              {(() => {
                const searchLower = searchTermResp.toLowerCase();
                const filtradas = respostas.filter(r => {
                   const matchTemplate = r.template_id === viewingTemplate.id;
                   const matchStatus = respostaTab === 'novas' ? !r.lida : r.lida;
                   const matchSearch = (r.cliente_nome?.toLowerCase().includes(searchLower)) || (r.cliente_whatsapp?.toLowerCase().includes(searchLower));
                   return matchTemplate && matchStatus && matchSearch;
                });

                if (filtradas.length === 0) {
                  return (
                    <div className="text-center py-16 bg-white rounded-xl border border-slate-200 shadow-sm animate-in fade-in zoom-in-95">
                      {searchTermResp ? <Search size={32} className="mx-auto text-slate-200 mb-3" /> : <CheckCircle2 size={32} className="mx-auto text-slate-200 mb-3" />}
                      <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest">{searchTermResp ? 'Nenhum resultado encontrado' : `Nenhuma resposta ${respostaTab === 'novas' ? 'nova' : 'lida'}`}</p>
                    </div>
                  );
                }

                return (
                  <div className="space-y-3">
                    {filtradas.map(resposta => (
                       <div key={resposta.id} className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm transition-all hover:border-blue-200 group/item">
                          
                          {/* CABEÇALHO DA SANFONA */}
                          <div onClick={() => setExpandedResp(expandedResp === resposta.id ? null : resposta.id)} className="p-4 flex items-center justify-between cursor-pointer hover:bg-slate-50 transition-colors">
                             <div className="min-w-0 flex-1 pr-4">
                                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-tight truncate">{resposta.cliente_nome || 'Cliente Sem Nome'}</h4>
                                <div className="text-[9px] font-semibold text-slate-500 mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 tracking-widest">
                                  <span className="flex items-center gap-1"><Phone size={10} className="text-blue-500"/> {resposta.cliente_whatsapp || 'Sem WhatsApp'}</span>
                                  <span className="flex items-center gap-1"><Calendar size={10} className="text-slate-400"/> {new Date(resposta.created_at).toLocaleString('pt-BR')}</span>
                                </div>
                             </div>
                             
                             <div className="flex items-center gap-2 sm:gap-4 shrink-0">
                                <div className="hidden sm:flex items-center gap-2 opacity-0 group-hover/item:opacity-100 transition-opacity">
                                   <button onClick={(e) => { e.stopPropagation(); toggleLida(resposta.id, resposta.lida); }} className={`text-[9px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-full transition-all shadow-sm ${!resposta.lida ? 'bg-emerald-50 text-emerald-600 border border-emerald-100 hover:bg-emerald-100' : 'bg-slate-100 text-slate-500 border border-slate-200 hover:bg-slate-200'}`}>
                                      {!resposta.lida ? 'Marcar Lida' : 'Novas'}
                                   </button>
                                   <button onClick={(e) => { e.stopPropagation(); handleDeleteResposta(resposta.id); }} className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors border border-transparent hover:border-red-100">
                                      <Trash2 size={14} />
                                   </button>
                                </div>
                                <div className={`p-1.5 rounded-md transition-transform duration-300 ${expandedResp === resposta.id ? 'bg-blue-50 text-blue-600 rotate-180' : 'bg-slate-50 text-slate-400'}`}>
                                  <ChevronDown size={14} />
                                </div>
                             </div>
                          </div>
                          
                          {/* BOTÕES MOBILE */}
                          <div className="sm:hidden px-4 pb-3 flex gap-2">
                              <button onClick={(e) => { e.stopPropagation(); toggleLida(resposta.id, resposta.lida); }} className={`flex-1 text-[9px] font-bold uppercase tracking-widest px-3 py-2 rounded-md transition-colors shadow-sm ${!resposta.lida ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-slate-100 text-slate-500 border border-slate-200'}`}>
                                {!resposta.lida ? 'Marcar Lida' : 'Novas'}
                              </button>
                              <button onClick={(e) => { e.stopPropagation(); handleDeleteResposta(resposta.id); }} className="bg-red-50 text-red-500 px-3 py-2 rounded-md border border-red-100">
                                <Trash2 size={14} />
                              </button>
                          </div>

                          <AnimatePresence>
                            {expandedResp === resposta.id && (
                              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="border-t border-slate-100 bg-slate-50/50">
                                <div className="p-4 space-y-3">
                                  {viewingTemplate.campos.map(campo => {
                                     const valor = resposta.dados[campo.id];
                                     return (
                                       <div key={campo.id} className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm animate-in slide-in-from-top-1">
                                          <p className="text-[9px] font-bold uppercase text-slate-500 tracking-widest mb-1.5 flex items-center gap-1.5">{renderIcon(campo.tipo)} {campo.pergunta}</p>
                                          {campo.tipo === 'upload' ? (
                                            valor ? (<a href={valor} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-[10px] font-semibold uppercase bg-blue-50 text-blue-600 px-3 py-1.5 rounded-md hover:bg-blue-100 transition-colors border border-blue-100"><ImageIcon size={12} /> Ver Anexo</a>) : (<p className="text-xs font-medium text-slate-400">Nenhum arquivo enviado</p>)
                                          ) : (
                                            <p className="text-xs font-semibold text-slate-800 whitespace-pre-wrap">{valor || '-'}</p>
                                          )}
                                       </div>
                                     )
                                  })}
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                       </div>
                    ))}
                  </div>
                );
              })()}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* OVERLAY: CRIADOR DE FORMULÁRIO (MANTIDO) */}
      <AnimatePresence>
        {isBuilding && (
          <motion.div initial={{ opacity: 0, x: '10%' }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: '10%' }} transition={{ type: "spring", bounce: 0, duration: 0.4 }} className="fixed inset-0 z-[200] bg-[#f8fafc] overflow-y-auto flex flex-col">
            <div className="bg-white border-b border-slate-200 sticky top-0 z-50 shadow-sm">
              <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <button onClick={() => setIsBuilding(false)} className="w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-500 transition-colors"><ChevronLeft size={18} /></button>
                  <div className="w-8 h-8 rounded-lg bg-blue-50 hidden sm:flex items-center justify-center border border-blue-100"><Palette className="text-blue-600 w-4 h-4" /></div>
                  <h2 className="text-sm md:text-base font-semibold text-slate-800 uppercase tracking-tight leading-none">{novoTemplate.id ? 'Editar Formulário' : 'Novo Formulário'}</h2>
                </div>
                <Button onClick={salvarTemplate} disabled={isSaving} className="bg-blue-600 hover:bg-blue-700 text-white h-9 px-5 rounded-md font-semibold uppercase text-[10px] tracking-widest shadow-sm transition-colors">{isSaving ? <Loader2 size={14} className="animate-spin mr-1.5" /> : <Save size={14} className="mr-1.5"/>} Salvar</Button>
              </div>
            </div>

            <div className="flex-1 w-full max-w-4xl mx-auto p-4 pb-24 space-y-4">
              <div className="bg-white p-4 md:p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
                 <div className="space-y-1"><label className="text-[9px] font-semibold uppercase text-slate-500 tracking-widest ml-1">Título do Formulário *</label><Input value={novoTemplate.titulo} onChange={e => setNovoTemplate({...novoTemplate, titulo: e.target.value})} className="h-9 bg-slate-50 border-slate-200 rounded-md font-semibold text-slate-800 text-xs focus:bg-white" placeholder="Ex: Briefing de Identidade Visual" /></div>
                 <div className="space-y-1"><label className="text-[9px] font-semibold uppercase text-slate-500 tracking-widest ml-1">Mensagem de Boas-vindas</label><textarea value={novoTemplate.descricao} onChange={e => setNovoTemplate({...novoTemplate, descricao: e.target.value})} className="w-full min-h-[80px] p-3 bg-slate-50 border border-slate-200 rounded-md text-xs font-medium text-slate-700 outline-none focus:border-blue-400 focus:bg-white transition-all resize-none" placeholder="Explique para o cliente o objetivo deste formulário..." /></div>
                 <div className="space-y-1"><label className="text-[9px] font-semibold uppercase text-slate-500 tracking-widest ml-1 flex items-center gap-1.5"><ImageIcon size={12}/> Link do Banner do Topo (Opcional)</label><Input value={novoTemplate.banner_url} onChange={e => setNovoTemplate({...novoTemplate, banner_url: e.target.value})} className="h-9 bg-slate-50 border-slate-200 rounded-md font-medium text-slate-800 text-[10px] focus:bg-white" placeholder="https://..." /><p className="text-[8px] text-slate-400 font-semibold uppercase tracking-widest ml-1">*Tamanho recomendado: 1200x400px</p></div>
              </div>

              <div className="bg-white p-4 md:p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
                 <div className="border-b border-slate-100 pb-2"><h3 className="text-xs font-semibold uppercase text-slate-800 tracking-tight">Perguntas do Briefing</h3></div>
                 {novoTemplate.campos.length === 0 ? (<div className="p-8 text-center bg-slate-50 rounded-lg border border-dashed border-slate-200"><p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest">Nenhuma pergunta adicionada ainda.</p></div>) : (
                    <div className="space-y-3">
                      {novoTemplate.campos.map((c, i) => (
                        <div key={c.id} className="bg-slate-50 p-3 md:p-4 rounded-lg border border-slate-200 relative group"><button onClick={() => removerCampo(c.id)} className="absolute -top-2 -right-2 bg-red-500 text-white w-6 h-6 rounded flex items-center justify-center shadow-sm opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"><Trash2 size={10} /></button>
                           <div className="flex flex-col md:flex-row gap-3">
                             <div className="flex-1 space-y-1"><label className="text-[9px] font-semibold uppercase text-slate-500 tracking-widest ml-1 flex items-center gap-1.5">{renderIcon(c.tipo)} Pergunta {i + 1}</label><Input value={c.pergunta} onChange={e => atualizarCampo(c.id, 'pergunta', e.target.value)} className="h-9 bg-white border-slate-200 font-semibold text-xs text-slate-800 rounded-md shadow-sm" /></div>
                             <div className="flex items-center gap-3 pt-2 md:pt-5 shrink-0"><label className="flex items-center gap-1.5 cursor-pointer text-[9px] font-semibold uppercase text-slate-600 tracking-widest"><input type="checkbox" checked={c.obrigatorio} onChange={e => atualizarCampo(c.id, 'obrigatorio', e.target.checked)} className="w-3.5 h-3.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500" />Obrigatório</label></div>
                           </div>
                        </div>
                      ))}
                    </div>
                 )}
                 <div className="pt-2"><p className="text-[9px] font-semibold uppercase text-slate-500 tracking-widest mb-2">Adicionar Novo Campo:</p>
                   <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
                     <Button variant="outline" onClick={() => adicionarCampo('texto_curto', 'Nova Pergunta')} className="h-9 text-[9px] font-semibold uppercase tracking-widest flex items-center gap-1.5 bg-slate-50 border-slate-200 text-slate-600 hover:bg-white rounded-md shadow-sm px-2"><Type size={12} className="text-blue-500"/> Texto Curto</Button>
                     <Button variant="outline" onClick={() => adicionarCampo('texto_longo', 'Fale mais sobre...')} className="h-9 text-[9px] font-semibold uppercase tracking-widest flex items-center gap-1.5 bg-slate-50 border-slate-200 text-slate-600 hover:bg-white rounded-md shadow-sm px-2"><AlignLeft size={12} className="text-emerald-500"/> Texto Longo</Button>
                     <Button variant="outline" onClick={() => adicionarCampo('data', 'Data do Evento')} className="h-9 text-[9px] font-semibold uppercase tracking-widest flex items-center gap-1.5 bg-slate-50 border-slate-200 text-slate-600 hover:bg-white rounded-md shadow-sm px-2"><Calendar size={12} className="text-amber-500"/> Data</Button>
                     <Button variant="outline" onClick={() => adicionarCampo('hora', 'Horário')} className="h-9 text-[9px] font-semibold uppercase tracking-widest flex items-center gap-1.5 bg-slate-50 border-slate-200 text-slate-600 hover:bg-white rounded-md shadow-sm px-2"><Clock size={12} className="text-purple-500"/> Hora</Button>
                     <Button variant="outline" onClick={() => adicionarCampo('endereco', 'Endereço')} className="h-9 text-[9px] font-semibold uppercase tracking-widest flex items-center gap-1.5 bg-slate-50 border-slate-200 text-slate-600 hover:bg-white rounded-md shadow-sm px-2"><MapPin size={12} className="text-rose-500"/> Endereço</Button>
                   </div>
                 </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}