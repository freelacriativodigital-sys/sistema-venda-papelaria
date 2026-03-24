import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Trash2, Link as LinkIcon, Save, Palette, AlignLeft, Calendar, Clock, MapPin, Upload, Image as ImageIcon, ChevronLeft, MessageSquare, Edit3 } from 'lucide-react';

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

  useEffect(() => {
    carregarDados();
  }, []);

  async function carregarDados() {
    const { data: tData } = await supabase.from('briefing_templates').select('*').order('created_at', { ascending: false });
    if (tData) setTemplates(tData);

    const { data: rData } = await supabase.from('briefing_respostas').select('*, briefing_templates(titulo)').order('created_at', { ascending: false });
    if (rData) setRespostas(rData);
  }

  // --- FUNÇÕES DE CONTROLE DE TELA ---
  const handleNewTemplate = () => {
    setNovoTemplate({ titulo: '', descricao: '', banner_url: '', campos: [] });
    setIsBuilding(true);
  };

  const handleEditTemplate = (template) => {
    setNovoTemplate(template); // Puxa todos os dados do template, incluindo o ID
    setIsBuilding(true);
  };

  const handleDeleteTemplate = async (id) => {
    if (window.confirm("Deseja realmente excluir este formulário? As respostas vinculadas a ele também poderão ser afetadas.")) {
      const { error } = await supabase.from('briefing_templates').delete().eq('id', id);
      if (error) {
        alert("Erro ao excluir: " + error.message);
      } else {
        carregarDados();
      }
    }
  };

  // --- FUNÇÕES DO CONSTRUTOR ---
  const handleAddCampo = (tipo) => {
    const novoCampo = { id: Date.now().toString(), tipo, label: 'Nova Pergunta', required: false };
    setNovoTemplate({ ...novoTemplate, campos: [...novoTemplate.campos, novoCampo] });
  };

  const handleRemoveCampo = (id) => {
    setNovoTemplate({ ...novoTemplate, campos: novoTemplate.campos.filter(c => c.id !== id) });
  };

  const handleUpdateCampo = (id, field, value) => {
    setNovoTemplate({
      ...novoTemplate,
      campos: novoTemplate.campos.map(c => c.id === id ? { ...c, [field]: value } : c)
    });
  };

  const handleUploadBanner = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setNovoTemplate({ ...novoTemplate, banner_url: reader.result });
      reader.readAsDataURL(file);
    }
  };

  const handleSaveTemplate = async () => {
    if (!novoTemplate.titulo) return alert("Dê um título ao seu briefing!");

    if (novoTemplate.id) {
      // Se tem ID, estamos Editando (UPDATE)
      const { error } = await supabase.from('briefing_templates').update(novoTemplate).eq('id', novoTemplate.id);
      if (error) return alert("Erro ao atualizar: " + error.message);
    } else {
      // Se não tem ID, estamos Criando (INSERT)
      const { error } = await supabase.from('briefing_templates').insert([novoTemplate]);
      if (error) return alert("Erro ao salvar: " + error.message);
    }
    
    setIsBuilding(false);
    setNovoTemplate({ titulo: '', descricao: '', banner_url: '', campos: [] });
    carregarDados();
  };

  const copiarLink = (template) => {
    const slug = criarSlug(template.titulo);
    const url = `${window.location.origin}/briefing/${slug}`;
    navigator.clipboard.writeText(url);
    alert(`Link copiado com sucesso!\nSeu cliente vai acessar:\n${url}`);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in pb-20">
      
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-black text-slate-800 uppercase flex items-center gap-3">
            <Palette className="text-purple-600" size={28} /> Briefings
          </h1>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Identidade Visual & Projetos</p>
        </div>
        {!isBuilding && !viewingTemplate && (
          <Button onClick={handleNewTemplate} className="bg-purple-600 hover:bg-purple-700 text-white font-bold uppercase text-[10px] tracking-widest h-10 shadow-md">
            <Plus size={16} className="mr-2" /> Novo Formulário
          </Button>
        )}
      </div>

      {isBuilding && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
          <div className="space-y-4">
            <h2 className="text-sm font-black text-slate-800 uppercase tracking-widest border-b border-slate-100 pb-2">
              {novoTemplate.id ? 'Editando Formulário' : 'Configurações Gerais'}
            </h2>
            
            <div className="relative group w-full h-32 bg-slate-100 rounded-xl border-2 border-dashed border-slate-300 flex items-center justify-center overflow-hidden cursor-pointer hover:border-purple-400 transition-colors">
              {novoTemplate.banner_url ? (
                <img src={novoTemplate.banner_url} alt="Banner" className="w-full h-full object-cover opacity-80 group-hover:opacity-50 transition-opacity" />
              ) : (
                <div className="flex flex-col items-center text-slate-400"><ImageIcon size={32} className="mb-2" /><span className="text-xs font-bold uppercase tracking-widest">Capa do Formulário (Opcional)</span></div>
              )}
              <input type="file" accept="image/*" onChange={handleUploadBanner} className="absolute inset-0 opacity-0 cursor-pointer z-10" />
            </div>

            <Input placeholder="Título (Ex: Identidade Visual - Empresa)" className="h-12 font-bold text-lg bg-slate-50" value={novoTemplate.titulo} onChange={e => setNovoTemplate({...novoTemplate, titulo: e.target.value})} />
            <textarea placeholder="Mensagem de boas-vindas / Instruções..." className="w-full h-20 p-3 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:border-purple-400" value={novoTemplate.descricao} onChange={e => setNovoTemplate({...novoTemplate, descricao: e.target.value})} />
          </div>

          <div className="space-y-4">
            <h2 className="text-sm font-black text-slate-800 uppercase tracking-widest border-b border-slate-100 pb-2">Perguntas do Formulário</h2>
            
            {novoTemplate.campos.map((campo, index) => (
              <div key={campo.id} className="flex items-center gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200">
                <div className="bg-white p-2 rounded text-slate-400 border border-slate-100 font-bold text-[10px] uppercase w-20 text-center shadow-sm">
                  {campo.tipo}
                </div>
                <Input className="flex-1 bg-white border-slate-200" value={campo.label} onChange={e => handleUpdateCampo(campo.id, 'label', e.target.value)} placeholder="Digite a pergunta..." />
                <Button variant="ghost" size="icon" onClick={() => handleRemoveCampo(campo.id)} className="text-rose-400 hover:bg-rose-50 hover:text-rose-600"><Trash2 size={16} /></Button>
              </div>
            ))}

            <div className="flex flex-wrap gap-2 pt-2">
              <Button variant="outline" size="sm" onClick={() => handleAddCampo('texto')} className="text-[10px] font-bold uppercase text-slate-500 hover:text-purple-600 hover:border-purple-200 hover:bg-purple-50"><AlignLeft size={14} className="mr-1.5"/> Texto</Button>
              <Button variant="outline" size="sm" onClick={() => handleAddCampo('cores')} className="text-[10px] font-bold uppercase text-slate-500 hover:text-purple-600 hover:border-purple-200 hover:bg-purple-50"><Palette size={14} className="mr-1.5"/> Paleta de Cores</Button>
              <Button variant="outline" size="sm" onClick={() => handleAddCampo('data')} className="text-[10px] font-bold uppercase text-slate-500 hover:text-purple-600 hover:border-purple-200 hover:bg-purple-50"><Calendar size={14} className="mr-1.5"/> Data</Button>
              <Button variant="outline" size="sm" onClick={() => handleAddCampo('hora')} className="text-[10px] font-bold uppercase text-slate-500 hover:text-purple-600 hover:border-purple-200 hover:bg-purple-50"><Clock size={14} className="mr-1.5"/> Hora</Button>
              <Button variant="outline" size="sm" onClick={() => handleAddCampo('endereco')} className="text-[10px] font-bold uppercase text-slate-500 hover:text-purple-600 hover:border-purple-200 hover:bg-purple-50"><MapPin size={14} className="mr-1.5"/> Endereço</Button>
              <Button variant="outline" size="sm" onClick={() => handleAddCampo('anexo')} className="text-[10px] font-bold uppercase text-slate-500 hover:text-purple-600 hover:border-purple-200 hover:bg-purple-50"><Upload size={14} className="mr-1.5"/> Imagem/Anexo</Button>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-6 border-t border-slate-100">
            <Button variant="ghost" onClick={() => setIsBuilding(false)} className="text-[10px] font-bold uppercase text-slate-500">Cancelar</Button>
            <Button onClick={handleSaveTemplate} className="bg-purple-600 hover:bg-purple-700 text-white text-[10px] font-bold uppercase tracking-widest shadow-md">
              <Save size={16} className="mr-2"/> {novoTemplate.id ? 'Atualizar Formulário' : 'Salvar Formulário'}
            </Button>
          </div>
        </div>
      )}

      {!isBuilding && viewingTemplate && (() => {
        const respostasDesteTemplate = respostas.filter(r => r.template_id === viewingTemplate.id);
        
        return (
          <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
            <Button variant="ghost" onClick={() => setViewingTemplate(null)} className="text-[10px] font-bold uppercase tracking-widest text-slate-500 hover:text-slate-800 hover:bg-slate-200 -ml-4">
              <ChevronLeft size={16} className="mr-1" /> Voltar para formulários
            </Button>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
              <div>
                <h2 className="text-xl font-black text-slate-800 tracking-tight">{viewingTemplate.titulo}</h2>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">{respostasDesteTemplate.length} {respostasDesteTemplate.length === 1 ? 'Resposta recebida' : 'Respostas recebidas'}</p>
              </div>
              <Button variant="outline" size="sm" onClick={() => copiarLink(viewingTemplate)} className="text-purple-600 border-purple-200 hover:bg-purple-50 text-[10px] font-bold uppercase shadow-sm">
                <LinkIcon size={14} className="mr-1.5"/> Copiar Link para Clientes
              </Button>
            </div>

            <div className="space-y-4">
              {respostasDesteTemplate.length === 0 ? (
                 <div className="p-10 text-center text-slate-400 font-bold uppercase tracking-widest text-xs border-2 border-dashed border-slate-200 rounded-2xl bg-white/50">
                   Nenhum cliente respondeu este briefing ainda.
                 </div>
              ) : (
                respostasDesteTemplate.map(r => (
                  <div key={r.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                    <div className="flex items-center gap-3 border-b border-slate-100 pb-3 mb-4">
                      <div className="w-10 h-10 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center font-black text-sm border border-purple-200">
                        {r.cliente_nome.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-800 text-base leading-tight">{r.cliente_nome}</h4>
                        <p className="text-[9px] text-slate-400 uppercase font-bold mt-0.5">
                          Enviado em {new Date(r.created_at).toLocaleDateString('pt-BR')} às {new Date(r.created_at).toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'})}
                        </p>
                      </div>
                    </div>

                    <div className="space-y-4">
                      {Object.entries(r.respostas).map(([pergunta, resposta]) => (
                        <div key={pergunta} className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                          <span className="block text-[10px] font-bold uppercase text-purple-600 mb-1.5">{pergunta}</span>
                          
                          {String(resposta).startsWith('data:image') ? (
                            <img src={resposta} alt="Anexo do cliente" className="mt-2 max-w-[200px] sm:max-w-[300px] rounded-lg shadow-sm border border-slate-200 object-contain bg-white" />
                          ) : (
                            <span className="text-sm text-slate-700 font-medium whitespace-pre-wrap">{resposta || <span className="text-slate-400 italic">Não respondeu</span>}</span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        );
      })()}

      {!isBuilding && !viewingTemplate && (
        <div className="space-y-4">
          <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">Meus Formulários de Briefing</h3>
          
          {templates.length === 0 ? (
             <div className="p-10 text-center text-slate-400 font-bold uppercase tracking-widest text-xs border-2 border-dashed border-slate-200 rounded-2xl bg-white/50 flex flex-col items-center">
               <Palette size={32} className="mb-3 text-slate-300" />
               Você ainda não criou nenhum formulário.
             </div>
          ) : (
            templates.map(t => {
              const countRespostas = respostas.filter(r => r.template_id === t.id).length;
              return (
                <div key={t.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-purple-200 transition-colors group">
                  <div>
                    <h4 className="font-bold text-slate-800 text-base">{t.titulo}</h4>
                    <p className="text-[10px] text-slate-400 uppercase font-bold mt-1">{t.campos.length} Perguntas cadastradas</p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Button variant="outline" size="sm" onClick={() => copiarLink(t)} className="text-purple-600 border-purple-200 hover:bg-purple-50 text-[10px] font-bold uppercase bg-purple-50/30">
                      <LinkIcon size={14} className="mr-1.5"/> Copiar Link
                    </Button>
                    <Button variant="default" size="sm" onClick={() => setViewingTemplate(t)} className="bg-slate-800 hover:bg-slate-900 text-white text-[10px] font-bold uppercase shadow-md">
                      <MessageSquare size={14} className="mr-1.5"/> Ver Respostas ({countRespostas})
                    </Button>
                    
                    {/* NOVOS BOTÕES: EDITAR E EXCLUIR */}
                    <div className="flex gap-1 ml-auto sm:ml-2">
                      <Button variant="ghost" size="icon" onClick={() => handleEditTemplate(t)} className="h-8 w-8 text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors">
                        <Edit3 size={16} />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDeleteTemplate(t.id)} className="h-8 w-8 text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors">
                        <Trash2 size={16} />
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

    </div>
  );
}