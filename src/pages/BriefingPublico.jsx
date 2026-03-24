import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Send, CheckCircle2, Upload, Palette } from 'lucide-react';

// A mesma função de criar o slug para comparar e achar o formulário certo
const criarSlug = (texto) => {
  return texto
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '');
};

export default function BriefingPublico() {
  const { slug } = useParams(); // Agora lemos o "Nome" da URL
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

        // Baixa todos os templates para encontrar o que bate com o nome na URL
        const { data: tData } = await supabase.from('briefing_templates').select('*');
        if (tData) {
          const formularioEncontrado = tData.find(t => criarSlug(t.titulo) === slug || t.id === slug);
          setTemplate(formularioEncontrado || null);
        }
      } catch (error) {
        console.error("Erro:", error);
      } finally {
        setLoading(false);
      }
    }
    carregarFormulario();
  }, [slug]);

  const handleChange = (pergunta, valor) => {
    setRespostas(prev => ({ ...prev, [pergunta]: valor }));
  };

  const handleFileUpload = (pergunta, e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.readAsDataURL(file);
    
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;
      
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 1000; 
        const MAX_HEIGHT = 1000;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        const compressedBase64 = canvas.toDataURL('image/jpeg', 0.7);
        
        handleChange(pergunta, compressedBase64);
      };
    };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!clienteNome) return alert("Por favor, preencha o seu nome.");

    setEnviando(true);
    try {
      await supabase.from('briefing_respostas').insert([{
        template_id: template.id, // Usa o ID verdadeiro escondido para salvar
        cliente_nome: clienteNome,
        respostas: respostas
      }]);
      setEnviado(true);
    } catch (error) {
      alert("Ocorreu um erro ao enviar. Tente novamente.");
    } finally {
      setEnviando(false);
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-slate-50"><Loader2 className="w-8 h-8 animate-spin text-purple-600" /></div>;
  if (!template) return <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-500 font-bold uppercase tracking-widest text-xs">Formulário não encontrado ou inativo.</div>;

  const corPrincipal = config?.cor_orcamento || '#9333ea'; 

  if (enviado) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 p-6 text-center animate-in fade-in zoom-in duration-500">
        <CheckCircle2 size={80} className="text-emerald-500 mb-6 shadow-xl rounded-full bg-white" />
        <h1 className="text-2xl font-black text-slate-800 uppercase tracking-tight mb-2">Tudo certo, {clienteNome}!</h1>
        <p className="text-sm font-medium text-slate-500 max-w-sm">Suas respostas foram enviadas com sucesso para a nossa equipe. Em breve entraremos em contato com você.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-20 font-sans">
      <div 
        className="w-full h-48 md:h-64 bg-slate-200 bg-cover bg-center shadow-inner relative"
        style={{ backgroundImage: template.banner_url ? `url(${template.banner_url})` : 'none', backgroundColor: corPrincipal }}
      >
        <div className="absolute inset-0 bg-black/30 backdrop-blur-[2px]"></div>
      </div>

      <div className="max-w-2xl mx-auto px-4 sm:px-6 -mt-16 relative z-10">
        <div className="bg-white rounded-3xl p-6 md:p-8 shadow-xl border border-slate-100 mb-6 text-center">
          {config?.logo_url && (
            <img src={config.logo_url} alt="Logo" className="w-24 h-24 object-contain mx-auto -mt-16 bg-white rounded-full p-2 shadow-lg mb-4 border-4 border-white" />
          )}
          <h1 className="text-2xl md:text-3xl font-black text-slate-800 uppercase tracking-tighter mb-2">{template.titulo}</h1>
          {template.descricao && (
            <p className="text-sm text-slate-500 font-medium whitespace-pre-wrap">{template.descricao}</p>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-white rounded-3xl p-6 md:p-8 shadow-lg border border-slate-100 space-y-6">
            
            <div className="space-y-2">
              <label className="text-[11px] font-black uppercase tracking-widest text-slate-700 ml-1">Seu Nome / Empresa <span className="text-rose-500">*</span></label>
              <Input 
                required 
                placeholder="Como podemos te chamar?" 
                className="h-12 bg-slate-50/50 border-slate-200 focus-visible:ring-purple-400"
                value={clienteNome}
                onChange={e => setClienteNome(e.target.value)}
              />
            </div>

            {template.campos.map(campo => (
              <div key={campo.id} className="space-y-2 pt-4 border-t border-slate-50">
                <label className="text-[11px] font-black uppercase tracking-widest text-slate-700 ml-1 flex items-center gap-2">
                  {campo.label} {campo.required && <span className="text-rose-500">*</span>}
                </label>

                {campo.tipo === 'texto' && (
                  <textarea 
                    className="w-full min-h-[100px] p-3 rounded-xl border border-slate-200 bg-slate-50/50 text-sm focus:outline-none focus:border-purple-400 focus:ring-1 focus:ring-purple-400"
                    placeholder="Digite sua resposta..."
                    onChange={e => handleChange(campo.label, e.target.value)}
                  />
                )}

                {campo.tipo === 'cores' && (
                  <div className="flex gap-3 items-center bg-slate-50/50 p-3 rounded-xl border border-slate-200">
                    <Palette size={20} className="text-slate-400" />
                    <input type="color" className="w-10 h-10 rounded cursor-pointer border-0 p-0" onChange={e => handleChange(`${campo.label} (Cor 1)`, e.target.value)} />
                    <input type="color" className="w-10 h-10 rounded cursor-pointer border-0 p-0" onChange={e => handleChange(`${campo.label} (Cor 2)`, e.target.value)} />
                    <input type="color" className="w-10 h-10 rounded cursor-pointer border-0 p-0" onChange={e => handleChange(`${campo.label} (Cor 3)`, e.target.value)} />
                    <span className="text-[10px] text-slate-400 uppercase font-bold tracking-widest">Escolha até 3 cores</span>
                  </div>
                )}

                {campo.tipo === 'data' && (
                  <Input type="date" className="h-12 bg-slate-50/50 border-slate-200" onChange={e => handleChange(campo.label, e.target.value)} />
                )}

                {campo.tipo === 'hora' && (
                  <Input type="time" className="h-12 bg-slate-50/50 border-slate-200" onChange={e => handleChange(campo.label, e.target.value)} />
                )}

                {campo.tipo === 'endereco' && (
                  <Input type="text" placeholder="Rua, Número, Bairro, Cidade..." className="h-12 bg-slate-50/50 border-slate-200" onChange={e => handleChange(campo.label, e.target.value)} />
                )}

                {campo.tipo === 'anexo' && (
                  <div className="relative w-full border-2 border-dashed border-slate-300 rounded-xl p-6 flex flex-col items-center justify-center text-slate-500 hover:border-purple-400 hover:bg-purple-50/30 transition-colors bg-slate-50/50 cursor-pointer">
                    <Upload size={24} className="mb-2" />
                    <span className="text-xs font-bold uppercase tracking-widest text-center">Clique para enviar imagem/referência</span>
                    <input type="file" accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer" onChange={(e) => handleFileUpload(campo.label, e)} />
                    {respostas[campo.label] && <span className="text-[10px] text-emerald-500 mt-2 font-black uppercase">✅ Arquivo Anexado (Otimizado)</span>}
                  </div>
                )}
              </div>
            ))}
          </div>

          <Button 
            type="submit" 
            disabled={enviando}
            className="w-full h-14 rounded-2xl text-white font-black uppercase tracking-widest shadow-lg shadow-purple-500/30 transition-transform active:scale-[0.98]"
            style={{ backgroundColor: corPrincipal }}
          >
            {enviando ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : <><Send size={18} className="mr-2" /> Enviar Minhas Respostas</>}
          </Button>

        </form>
      </div>
    </div>
  );
}