import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Trash2, Link as LinkIcon, Save, Palette, AlignLeft, Calendar, Clock, MapPin, Upload, Image as ImageIcon, ChevronLeft, MessageSquare, Edit3, Type, List, Loader2, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// Função para transformar o Título em Link (Slug)
const criarSlug = (texto) => {
  return texto
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // Remove acentos
    .replace(/\s+/g, '-') // Troca espaços por traços
    .replace(/[^a-z0-9-]/g, ''); // Remove caracteres especiais
};

export default function Briefings() {
  const [templates, setTemplates] = useState([]);
  const [respostas, setRespostas] = useState([]);
  
  const [isBuilding, setIsBuilding] = useState(false);
  const [viewingTemplate, setViewingTemplate] = useState(null); 
  const [novoTemplate, setNovoTemplate] = useState({ titulo: '', descricao: '', banner_url: '', campos: [] });

  const [isSaving, setIsSaving] = useState(false);

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
    alert("Link copiado para a área de transferência!");
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
    
    // Se for edição (tem ID), atualiza. Se não, insere.
    if (novoTemplate.id) {
      const { error } = await supabase.from('briefing_templates').update({
        titulo: novoTemplate.titulo,
        descricao: novoTemplate.descricao,
        banner_url: novoTemplate.banner_url,
        campos: novoTemplate.campos
        // O slug não muda na edição para não quebrar links antigos
      }).eq('id', novoTemplate.id);

      if (!error) {
        alert("Formulário atualizado com sucesso!");
        setIsBuilding(false);
        carregarDados();
      } else {
        alert("Erro ao atualizar: " + error.message);
      }
    } else {
      const slug = criarSlug(novoTemplate.titulo) + '-' + Math.floor(Math.random() * 1000);
      const { error } = await supabase.from('briefing_templates').insert([{ ...novoTemplate, slug }]);
      if (!error) {
        alert("Formulário criado com sucesso!");
        setIsBuilding(false);
        carregarDados();
      } else {
        alert("Erro ao salvar: " + error.message);
      }
    }
    setIsSaving(false);
  };

  const handleEditTemplate = (template) => {
    setNovoTemplate(template);
    setIsBuilding(true);
  };

  const handleDeleteTemplate = async (id) => {
    if (window.confirm("ATENÇÃO: Excluir este formulário fará com que o link pare de funcionar para os clientes. Deseja continuar?")) {
      await supabase.from('briefing_templates').delete().eq('id', id);
      carregarDados();
    }
  };

  const renderIcon = (tipo) => {
    switch (tipo) {
      case 'texto_curto': return <Type size={14} className="text-blue-500" />;
      case 'texto_longo': return <AlignLeft size={14} className="text-emerald-500" />;
      case 'data': return <Calendar size={14} className="text-amber-500" />;
      case 'hora': return <Clock size={14} className="text-purple-500" />;
      case 'endereco': return <MapPin size={14} className="text-rose-500" />;
      case 'upload': return <Upload size={14} className="text-indigo-500" />;
      default: return <List size={14} />;
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 pb-20 relative">
      
      {/* HEADER FIXO ESTILO EXECUTIVO */}
      <div className="border-b border-slate-200 bg-white/90 backdrop-blur-md sticky top-0 z-10 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-3 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <h1 className="text-lg md:text-xl font-semibold text-slate-800 uppercase leading-none tracking-tight flex items-center gap-2">
              <AlignLeft className="w-5 h-5 text-blue-600" /> Formulários
            </h1>
            <div className="h-6 w-px bg-slate-200 hidden md:block"></div>
            <p className="text-[9px] md:text-[10px] text-slate-500 font-medium uppercase tracking-widest hidden md:block mt-0.5">
              Briefings e Captura
            </p>
          </div>
          <Button onClick={() => { 
            setNovoTemplate({ titulo: '', descricao: '', banner_url: '', campos: [] }); 
            setIsBuilding(true); 
          }} className="h-9 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-semibold uppercase text-[10px] px-4 shadow-sm w-full md:w-auto">
            <Plus size={14} className="mr-1.5" /> Novo Formulário
          </Button>
        </div>
      </div>

      {/* LISTAGEM DE TEMPLATES */}
      <div className="max-w-5xl mx-auto p-4 sm:px-6 mt-4">
        {templates.length === 0 ? (
           <div className="text-center py-16 bg-white rounded-xl border border-slate-200 shadow-sm">
             <AlignLeft size={32} className="mx-auto text-slate-300 mb-3" />
             <h3 className="text-sm font-semibold text-slate-800 uppercase tracking-tight mb-1">Nenhum formulário</h3>
             <p className="text-[9px] font-medium uppercase text-slate-400 tracking-widest">Crie seu primeiro briefing para enviar aos clientes.</p>
           </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {templates.map(t => {
               const countRespostas = respostas.filter(r => r.template_id === t.id).length;
               return (
                 <div key={t.id} className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex flex-col gap-3 transition-all hover:border-blue-200 hover:shadow-md">
                    <div className="flex justify-between items-start gap-2">
                      <div className="overflow-hidden">
                        <h3 className="text-sm font-semibold text-slate-800 uppercase tracking-tight truncate">{t.titulo}</h3>
                        <p className="text-[9px] font-medium text-slate-400 mt-0.5 truncate tracking-widest">Link: /form/{t.slug}</p>
                      </div>
                      <span className="bg-slate-50 text-slate-500 text-[8px] font-semibold px-2 py-0.5 rounded-md uppercase border border-slate-100 shrink-0">
                        {t.campos.length} Campos
                      </span>
                    </div>

                    <div className="mt-auto pt-3 border-t border-slate-100 flex flex-wrap items-center gap-1.5">
                      <Button variant="outline" onClick={() => copiarLink(t)} className="h-8 px-2.5 rounded-full text-purple-600 border-purple-200 hover:bg-purple-50 text-[9px] font-semibold uppercase tracking-widest bg-purple-50/30 transition-colors">
                        <LinkIcon size={12} className="mr-1"/> Link
                      </Button>
                      <Button variant="default" onClick={() => setViewingTemplate(t)} className="h-8 px-2.5 rounded-full bg-slate-800 hover:bg-slate-900 text-white text-[9px] font-semibold uppercase tracking-widest shadow-sm transition-colors">
                        <MessageSquare size={12} className="mr-1"/> Respostas ({countRespostas})
                      </Button>
                      
                      <div className="flex gap-1 ml-auto">
                        <Button variant="ghost" size="icon" onClick={() => handleEditTemplate(t)} className="h-8 w-8 text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors rounded-full">
                          <Edit3 size={14} />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDeleteTemplate(t.id)} className="h-8 w-8 text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors rounded-full">
                          <Trash2 size={14} />
                        </Button>
                      </div>
                    </div>
                 </div>
               )
            })}
          </div>
        )}
      </div>

      {/* OVERLAY: CRIADOR DE FORMULÁRIO */}
      <AnimatePresence>
        {isBuilding && (
          <motion.div 
            initial={{ opacity: 0, x: '10%' }} 
            animate={{ opacity: 1, x: 0 }} 
            exit={{ opacity: 0, x: '10%' }} 
            transition={{ type: "spring", bounce: 0, duration: 0.4 }}
            className="fixed inset-0 z-[200] bg-[#f8fafc] overflow-y-auto flex flex-col"
          >
            <div className="bg-white border-b border-slate-200 sticky top-0 z-50 shadow-sm">
              <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <button onClick={() => setIsBuilding(false)} className="w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-500 transition-colors">
                    <ChevronLeft size={18} />
                  </button>
                  <div className="w-8 h-8 rounded-lg bg-blue-50 hidden sm:flex items-center justify-center border border-blue-100">
                     <Palette className="text-blue-600 w-4 h-4" />
                  </div>
                  <div>
                    <h2 className="text-sm md:text-base font-semibold text-slate-800 uppercase tracking-tight leading-none">
                      {novoTemplate.id ? 'Editar Formulário' : 'Novo Formulário'}
                    </h2>
                  </div>
                </div>
                <Button onClick={salvarTemplate} disabled={isSaving} className="bg-blue-600 hover:bg-blue-700 text-white h-9 px-5 rounded-md font-semibold uppercase text-[10px] tracking-widest shadow-sm transition-colors">
                  {isSaving ? <Loader2 size={14} className="animate-spin mr-1.5" /> : <Save size={14} className="mr-1.5"/>} Salvar
                </Button>
              </div>
            </div>

            <div className="flex-1 w-full max-w-4xl mx-auto p-4 pb-24 space-y-4">
              
              <div className="bg-white p-4 md:p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
                 <div className="space-y-1">
                   <label className="text-[9px] font-semibold uppercase text-slate-500 tracking-widest ml-1">Título do Formulário *</label>
                   <Input value={novoTemplate.titulo} onChange={e => setNovoTemplate({...novoTemplate, titulo: e.target.value})} className="h-9 bg-slate-50 border-slate-200 rounded-md font-semibold text-slate-800 text-xs focus:bg-white" placeholder="Ex: Briefing de Identidade Visual" />
                 </div>
                 <div className="space-y-1">
                   <label className="text-[9px] font-semibold uppercase text-slate-500 tracking-widest ml-1">Mensagem de Boas-vindas</label>
                   <textarea value={novoTemplate.descricao} onChange={e => setNovoTemplate({...novoTemplate, descricao: e.target.value})} className="w-full min-h-[80px] p-3 bg-slate-50 border border-slate-200 rounded-md text-xs font-medium text-slate-700 outline-none focus:border-blue-400 focus:bg-white transition-all resize-none" placeholder="Explique para o cliente o objetivo deste formulário..." />
                 </div>
                 <div className="space-y-1">
                   <label className="text-[9px] font-semibold uppercase text-slate-500 tracking-widest ml-1 flex items-center gap-1.5"><ImageIcon size={12}/> Link do Banner do Topo (Opcional)</label>
                   <Input value={novoTemplate.banner_url} onChange={e => setNovoTemplate({...novoTemplate, banner_url: e.target.value})} className="h-9 bg-slate-50 border-slate-200 rounded-md font-medium text-slate-800 text-[10px] focus:bg-white" placeholder="https://..." />
                   <p className="text-[8px] text-slate-400 font-semibold uppercase tracking-widest ml-1">*Tamanho recomendado: 1200x400px (JPG ou PNG compactado)</p>
                 </div>
              </div>

              <div className="bg-white p-4 md:p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
                 <div className="border-b border-slate-100 pb-2">
                   <h3 className="text-xs font-semibold uppercase text-slate-800 tracking-tight">Perguntas do Briefing</h3>
                 </div>

                 {novoTemplate.campos.length === 0 ? (
                    <div className="p-8 text-center bg-slate-50 rounded-lg border border-dashed border-slate-200">
                      <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest">Nenhuma pergunta adicionada ainda.</p>
                    </div>
                 ) : (
                    <div className="space-y-3">
                      {novoTemplate.campos.map((c, i) => (
                        <div key={c.id} className="bg-slate-50 p-3 md:p-4 rounded-lg border border-slate-200 relative group">
                           <button onClick={() => removerCampo(c.id)} className="absolute -top-2 -right-2 bg-red-500 text-white w-6 h-6 rounded flex items-center justify-center shadow-sm opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"><Trash2 size={10} /></button>
                           <div className="flex flex-col md:flex-row gap-3">
                             <div className="flex-1 space-y-1">
                               <label className="text-[9px] font-semibold uppercase text-slate-500 tracking-widest ml-1 flex items-center gap-1.5">
                                 {renderIcon(c.tipo)} Pergunta {i + 1}
                               </label>
                               <Input value={c.pergunta} onChange={e => atualizarCampo(c.id, 'pergunta', e.target.value)} className="h-9 bg-white border-slate-200 font-semibold text-xs text-slate-800 rounded-md shadow-sm" />
                             </div>
                             <div className="flex items-center gap-3 pt-2 md:pt-5 shrink-0">
                               <label className="flex items-center gap-1.5 cursor-pointer text-[9px] font-semibold uppercase text-slate-600 tracking-widest">
                                 <input type="checkbox" checked={c.obrigatorio} onChange={e => atualizarCampo(c.id, 'obrigatorio', e.target.checked)} className="w-3.5 h-3.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500" />
                                 Obrigatório
                               </label>
                             </div>
                           </div>
                        </div>
                      ))}
                    </div>
                 )}

                 <div className="pt-2">
                   <p className="text-[9px] font-semibold uppercase text-slate-500 tracking-widest mb-2">Adicionar Novo Campo:</p>
                   <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
                     <Button variant="outline" onClick={() => adicionarCampo('texto_curto', 'Nome Completo')} className="h-9 text-[9px] font-semibold uppercase tracking-widest flex items-center gap-1.5 bg-slate-50 border-slate-200 text-slate-600 hover:bg-white rounded-md shadow-sm px-2"><Type size={12} className="text-blue-500"/> Texto Curto</Button>
                     <Button variant="outline" onClick={() => adicionarCampo('texto_longo', 'Fale mais sobre...')} className="h-9 text-[9px] font-semibold uppercase tracking-widest flex items-center gap-1.5 bg-slate-50 border-slate-200 text-slate-600 hover:bg-white rounded-md shadow-sm px-2"><AlignLeft size={12} className="text-emerald-500"/> Texto Longo</Button>
                     <Button variant="outline" onClick={() => adicionarCampo('data', 'Data do Evento')} className="h-9 text-[9px] font-semibold uppercase tracking-widest flex items-center gap-1.5 bg-slate-50 border-slate-200 text-slate-600 hover:bg-white rounded-md shadow-sm px-2"><Calendar size={12} className="text-amber-500"/> Data</Button>
                     <Button variant="outline" onClick={() => adicionarCampo('hora', 'Horário')} className="h-9 text-[9px] font-semibold uppercase tracking-widest flex items-center gap-1.5 bg-slate-50 border-slate-200 text-slate-600 hover:bg-white rounded-md shadow-sm px-2"><Clock size={12} className="text-purple-500"/> Hora</Button>
                     <Button variant="outline" onClick={() => adicionarCampo('endereco', 'Endereço')} className="h-9 text-[9px] font-semibold uppercase tracking-widest flex items-center gap-1.5 bg-slate-50 border-slate-200 text-slate-600 hover:bg-white rounded-md shadow-sm px-2"><MapPin size={12} className="text-rose-500"/> Endereço</Button>
                     <Button variant="outline" onClick={() => adicionarCampo('upload', 'Envie sua Logo')} className="h-9 text-[9px] font-semibold uppercase tracking-widest flex items-center gap-1.5 bg-slate-50 border-slate-200 text-slate-600 hover:bg-white rounded-md shadow-sm px-2"><Upload size={12} className="text-indigo-500"/> Upload</Button>
                   </div>
                 </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* OVERLAY: VER RESPOSTAS */}
      <AnimatePresence>
        {viewingTemplate && (
          <motion.div 
            initial={{ opacity: 0, x: '10%' }} 
            animate={{ opacity: 1, x: 0 }} 
            exit={{ opacity: 0, x: '10%' }} 
            transition={{ type: "spring", bounce: 0, duration: 0.4 }}
            className="fixed inset-0 z-[200] bg-[#f8fafc] overflow-y-auto flex flex-col"
          >
            <div className="bg-white border-b border-slate-200 sticky top-0 z-50 shadow-sm">
              <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <button onClick={() => setViewingTemplate(null)} className="w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-500 transition-colors">
                    <ChevronLeft size={18} />
                  </button>
                  <div className="w-8 h-8 rounded-lg bg-emerald-50 hidden sm:flex items-center justify-center border border-emerald-100">
                     <MessageSquare className="text-emerald-600 w-4 h-4" />
                  </div>
                  <div>
                    <h2 className="text-sm md:text-base font-semibold text-slate-800 uppercase tracking-tight leading-none">
                      Respostas: {viewingTemplate.titulo}
                    </h2>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex-1 w-full max-w-4xl mx-auto p-4 pb-24 space-y-4">
              {respostas.filter(r => r.template_id === viewingTemplate.id).length === 0 ? (
                 <div className="text-center py-16 bg-white rounded-xl border border-slate-200 shadow-sm">
                   <MessageSquare size={32} className="mx-auto text-slate-300 mb-3" />
                   <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest">Nenhuma resposta recebida ainda.</p>
                 </div>
              ) : (
                 <div className="grid grid-cols-1 gap-4">
                    {respostas.filter(r => r.template_id === viewingTemplate.id).map(resposta => (
                       <div key={resposta.id} className="bg-white p-4 md:p-5 rounded-xl border border-slate-200 shadow-sm">
                          <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
                             <p className="text-[10px] font-semibold uppercase text-slate-500 tracking-widest flex items-center gap-1.5"><Calendar size={12} className="text-blue-500"/> Enviado em: {new Date(resposta.created_at).toLocaleString('pt-BR')}</p>
                          </div>
                          
                          <div className="space-y-4">
                            {viewingTemplate.campos.map(campo => {
                               const valor = resposta.dados[campo.id];
                               return (
                                 <div key={campo.id} className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                                    <p className="text-[9px] font-semibold uppercase text-slate-500 tracking-widest mb-1">{campo.pergunta}</p>
                                    
                                    {campo.tipo === 'upload' ? (
                                      valor ? (
                                        <a href={valor} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-[10px] font-semibold uppercase bg-indigo-50 text-indigo-600 px-3 py-1.5 rounded-full hover:bg-indigo-100 transition-colors border border-indigo-100">
                                          <ImageIcon size={12} /> Ver Anexo
                                        </a>
                                      ) : (
                                        <p className="text-xs font-medium text-slate-400">Nenhum arquivo enviado</p>
                                      )
                                    ) : (
                                      <p className="text-xs font-semibold text-slate-800 whitespace-pre-wrap">{valor || '-'}</p>
                                    )}
                                 </div>
                               )
                            })}
                          </div>
                       </div>
                    ))}
                 </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}