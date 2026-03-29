import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Send, CheckCircle2, Palette } from 'lucide-react';

const criarSlug = (texto) => {
  return texto
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '');
};

export default function BriefingPublico() {
  const { slug } = useParams();
  const [template, setTemplate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [enviando, setEnviando] = useState(false);
  const [enviado, setEnviado] = useState(false);
  const [config, setConfig] = useState(null);
  
  const [clienteNome, setClienteNome] = useState('');
  const [respostas, setRespostas] = useState({});

  useEffect(() => {
    async function carregarFormulario() {
      try {
        const { data: configData } = await supabase.from('configuracoes').select('*').eq('id', 1).single();
        if (configData) setConfig(configData);

        const { data: templates } = await supabase.from('briefing_templates').select('*');
        if (templates) {
          const formEncontrado = templates.find(t => t.slug === slug || criarSlug(t.titulo) === slug);
          if (formEncontrado) {
            setTemplate(formEncontrado);
            const initialResp = {};
            formEncontrado.campos.forEach(c => { initialResp[c.id] = ''; });
            setRespostas(initialResp);
          }
        }
      } catch (error) {
        console.error("Erro ao carregar:", error);
      } finally {
        setLoading(false);
      }
    }
    carregarFormulario();
  }, [slug]);

  const handleChange = (campoId, valor) => {
    setRespostas(prev => ({ ...prev, [campoId]: valor }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!clienteNome) return alert("Por favor, preencha o seu nome.");
    
    const camposObrigatoriosVazios = template.campos.filter(c => c.obrigatorio && !respostas[c.id]);
    if (camposObrigatoriosVazios.length > 0) {
      return alert("Por favor, preencha todos os campos obrigatórios.");
    }

    setEnviando(true);
    
    const payload = {
      template_id: template.id,
      cliente_nome: clienteNome,
      dados: respostas
    };

    const { data: authData } = await supabase.auth.getUser();
    if (authData?.user?.id) {
      payload.usuario_id = authData.user.id;
    }

    const { error } = await supabase.from('briefing_respostas').insert([payload]);

    if (!error) {
      setEnviado(true);
    } else {
      alert("Erro ao enviar respostas: " + error.message);
    }
    setEnviando(false);
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-[#f8fafc]"><Loader2 className="w-8 h-8 animate-spin text-slate-400" /></div>;
  }

  if (!template) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#f8fafc] p-4">
        <Palette size={48} className="text-slate-300 mb-4" />
        <h1 className="text-lg font-semibold text-slate-800 uppercase tracking-tight">Formulário não encontrado</h1>
        <p className="text-[10px] font-medium uppercase tracking-widest text-slate-500 mt-2 text-center">Este link pode estar quebrado ou foi desativado.</p>
      </div>
    );
  }

  const corPrincipal = config?.cor_orcamento || '#2563eb';

  if (enviado) {
    return (
      <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-xl shadow-sm border border-slate-200 max-w-md w-full text-center animate-in zoom-in-95">
          <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: `${corPrincipal}15`, color: corPrincipal }}>
            <CheckCircle2 size={24} />
          </div>
          <h2 className="text-lg font-semibold uppercase tracking-tight text-slate-800 mb-2">Tudo Certo!</h2>
          <p className="text-[10px] font-medium text-slate-500 uppercase tracking-widest leading-relaxed">Suas respostas foram enviadas com sucesso. Entraremos em contato em breve!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8fafc]">
      {template.banner_url && (
        <div className="w-full h-32 md:h-48 bg-slate-200">
          <img src={template.banner_url} alt="Banner" className="w-full h-full object-cover" />
        </div>
      )}
      
      <div className={`max-w-2xl mx-auto px-4 ${template.banner_url ? '-mt-10' : 'pt-10'} pb-20 relative z-10`}>
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          
          {/* CABEÇALHO DO FORM */}
          <div className="p-5 md:p-8 border-b border-slate-100 text-center">
             {config?.logo_url && (
               <img src={config.logo_url} alt="Logo" className="h-14 w-14 object-contain mx-auto mb-3 rounded-lg shadow-sm border border-slate-100" />
             )}
             <h1 className="text-lg md:text-xl font-semibold uppercase tracking-tight text-slate-800" style={{ color: corPrincipal }}>{template.titulo}</h1>
             {template.descricao && (
               <p className="text-[11px] font-medium text-slate-500 mt-2.5 leading-relaxed whitespace-pre-wrap">{template.descricao}</p>
             )}
          </div>

          <form onSubmit={handleSubmit} className="p-5 md:p-8 space-y-5">
            
            {/* DADOS DO CLIENTE */}
            <div className="space-y-3 bg-slate-50/50 p-4 rounded-lg border border-slate-100">
              <div className="space-y-1">
                <label className="text-[9px] font-semibold uppercase tracking-widest text-slate-600 ml-1 block">Seu Nome Completo <span className="text-rose-500">*</span></label>
                <Input 
                  required 
                  value={clienteNome} 
                  onChange={e => setClienteNome(e.target.value)} 
                  placeholder="Como devemos te chamar?" 
                  className="h-9 bg-white border-slate-200 focus:border-blue-400 rounded-md text-xs font-medium text-slate-800" 
                />
              </div>
            </div>

            {/* PERGUNTAS DINÂMICAS */}
            <div className="space-y-4">
              {template.campos.map((campo, index) => (
                <div key={campo.id} className="space-y-1.5">
                  <label className="text-[9px] font-semibold uppercase tracking-widest text-slate-700 ml-1 block leading-tight">
                    {index + 1}. {campo.pergunta} {campo.obrigatorio && <span className="text-rose-500">*</span>}
                  </label>
                  
                  {campo.tipo === 'texto_curto' && (
                    <Input required={campo.obrigatorio} value={respostas[campo.id] || ''} onChange={e => handleChange(campo.id, e.target.value)} className="h-9 bg-slate-50 border-slate-200 focus:bg-white rounded-md text-xs font-medium text-slate-800" />
                  )}
                  
                  {campo.tipo === 'texto_longo' && (
                    <textarea required={campo.obrigatorio} value={respostas[campo.id] || ''} onChange={e => handleChange(campo.id, e.target.value)} className="w-full min-h-[80px] p-2.5 bg-slate-50 border border-slate-200 focus:bg-white rounded-md text-xs font-medium text-slate-800 outline-none focus:ring-1 focus:ring-slate-300 transition-all resize-none" />
                  )}
                  
                  {campo.tipo === 'data' && (
                    <Input type="date" required={campo.obrigatorio} value={respostas[campo.id] || ''} onChange={e => handleChange(campo.id, e.target.value)} className="h-9 bg-slate-50 border-slate-200 focus:bg-white rounded-md text-xs font-medium text-slate-800" />
                  )}
                  
                  {campo.tipo === 'hora' && (
                    <Input type="time" required={campo.obrigatorio} value={respostas[campo.id] || ''} onChange={e => handleChange(campo.id, e.target.value)} className="h-9 bg-slate-50 border-slate-200 focus:bg-white rounded-md text-xs font-medium text-slate-800" />
                  )}

                  {campo.tipo === 'endereco' && (
                    <Input required={campo.obrigatorio} value={respostas[campo.id] || ''} onChange={e => handleChange(campo.id, e.target.value)} placeholder="Rua, Número, Bairro, Cidade..." className="h-9 bg-slate-50 border-slate-200 focus:bg-white rounded-md text-xs font-medium text-slate-800" />
                  )}
                </div>
              ))}
            </div>

            <Button 
              type="submit" 
              disabled={enviando}
              className="w-full h-10 rounded-md text-white font-semibold uppercase text-[10px] tracking-widest shadow-sm transition-transform active:scale-[0.98] mt-4"
              style={{ backgroundColor: corPrincipal }}
            >
              {enviando ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : <><Send size={14} className="mr-2" /> Enviar Respostas</>}
            </Button>
          </form>
        </div>
        
        <div className="text-center mt-5">
          <p className="text-[8px] font-semibold uppercase tracking-widest text-slate-400">Protegido pelo Sistema</p>
        </div>
      </div>
    </div>
  );
}