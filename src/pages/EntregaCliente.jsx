import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams, Link, useNavigate } from 'react-router-dom';
import { Download, Folder, File as FileIcon, Instagram, MessageCircle, Clock, AlertCircle, Loader2, Sparkles, ChevronRight, ArrowLeft, DownloadCloud } from "lucide-react";
import { supabase } from "../lib/supabase";

// === A SUA URL MÁGICA DO GOOGLE DRIVE ===
const GAS_WEB_APP_URL = "https://script.google.com/macros/s/AKfycbwK3y82SHDhof_TZUs_lvGK625nrJ6hgRIiP9Jr9qukybLnzRIFciysY2Bo-Gp_QRDL/exec";

export default function EntregaCliente() {
  const { driveFolderId } = useParams();
  const [searchParams] = useSearchParams();
  const dataEvento = searchParams.get('evento');
  const navigate = useNavigate(); 

  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState(null);
  const [arquivos, setArquivos] = useState([]);
  const [nomePasta, setNomePasta] = useState('');
  const [config, setConfig] = useState({ logo_url: '', instagram: '', whatsapp: '' });
  const [diasRestantes, setDiasRestantes] = useState(null);

  useEffect(() => {
    async function carregarTudo() {
      setLoading(true);
      setErro(null);

      try {
        const { data: configData } = await supabase
          .from('configuracoes')
          .select('logo_url, instagram, whatsapp')
          .eq('id', 1)
          .single();

        if (configData) {
          setConfig(configData);
        }

        if (dataEvento) {
          const dataFesta = new Date(dataEvento + 'T00:00:00');
          const dataExpiracao = new Date(dataFesta);
          dataExpiracao.setDate(dataExpiracao.getDate() + 30);
          
          const hoje = new Date();
          const diferencaTempo = dataExpiracao.getTime() - hoje.getTime();
          const diferencaDias = Math.ceil(diferencaTempo / (1000 * 3600 * 24));
          setDiasRestantes(diferencaDias);
        }

        const response = await fetch(`${GAS_WEB_APP_URL}?id=${driveFolderId}`);
        const result = await response.json();

        if (result.error) {
          throw new Error(result.error);
        }

        setNomePasta(result.folderName);
        setArquivos(result.items || []);

      } catch (err) {
        setErro("Não foi possível carregar os arquivos. Verifique se o link está correto ou se a pasta foi excluída.");
        console.error("Erro ao carregar portal:", err);
      } finally {
        setLoading(false);
      }
    }

    carregarTudo();
  }, [driveFolderId, dataEvento]);

  const formatarTamanho = (bytes) => {
    if (!bytes) return '';
    const mb = bytes / (1024 * 1024);
    if (mb < 1) return (bytes / 1024).toFixed(1) + ' KB';
    return mb.toFixed(1) + ' MB';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center gap-4">
        <Loader2 className="animate-spin text-blue-600" size={40} />
        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest animate-pulse">Preparando seus arquivos...</p>
      </div>
    );
  }

  if (erro) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center">
        <AlertCircle className="text-red-400 mb-4" size={48} />
        <h1 className="text-xl font-black text-slate-800 uppercase tracking-tight mb-2">Ops! Algo deu errado</h1>
        <p className="text-sm font-medium text-slate-500 max-w-md">{erro}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans pb-32 md:pb-20">
      
      {/* HEADER ATUALIZADO: Mais compacto no mobile (pt-6, max-h-16) */}
      <header className="w-full pt-6 md:pt-10 pb-2 md:pb-4 px-4 flex justify-center items-center">
        {config.logo_url ? (
          <img 
            src={config.logo_url} 
            alt="Logo" 
            className="max-h-16 md:max-h-36 object-contain drop-shadow-xl hover:scale-105 transition-transform duration-500" 
          />
        ) : (
          <h1 className="text-xl md:text-3xl font-black text-slate-800 uppercase tracking-widest drop-shadow-sm">
            Portal do Cliente
          </h1>
        )}
      </header>

      {/* Espaçamentos globais ajustados para mobile (space-y-4 no lugar de space-y-6) */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 pt-2 md:pt-4 space-y-4 md:space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        
        {/* BANNER DE MARKETING: Responsivo e Compacto no Mobile */}
        <div className="w-full bg-[#1e1b4b] rounded-xl md:rounded-2xl p-4 md:p-8 shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
            <Sparkles className="w-20 h-20 md:w-32 md:h-32" />
          </div>
          
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-3 md:gap-6">
            <div className="flex-1">
              <span className="text-[8px] md:text-[9px] font-bold text-indigo-300 uppercase tracking-widest block mb-0.5 md:mb-1">
                FEITO COM CARINHO - PORTAL CRIARTE
              </span>
              <h2 className="text-sm md:text-xl font-black text-white uppercase tracking-tight mb-1 md:mb-2">
                MUITO OBRIGADO PELA CONFIANÇA!
              </h2>
              {/* O texto agora aparece inteiro, sem cortar (removido o line-clamp) */}
              <p className="text-[10px] md:text-xs font-medium text-slate-300 leading-snug md:leading-relaxed max-w-lg">
                É uma alegria fazer parte do seu projeto! Fico imensamente grato por escolher o meu trabalho. Te convido a acompanhar meu Instagram para conferir as últimas novidades e inspirações. Ah, e se precisar de qualquer ajuda na hora de abrir ou usar os arquivos, estou à total disposição!
              </p>
            </div>
            
            {/* Botões Lado a Lado no Celular (flex-row) e Empilhados no PC (md:flex-col) */}
            <div className="flex flex-row md:flex-col gap-2 shrink-0 w-full md:w-auto mt-1 md:mt-0">
              {config.instagram && (
                <a href={config.instagram.startsWith('http') ? config.instagram : `https://${config.instagram}`} target="_blank" rel="noreferrer" className="flex-1 md:flex-none bg-white/10 hover:bg-white/20 border border-white/30 text-white px-2 md:px-5 py-2.5 md:py-3.5 rounded-lg font-bold uppercase tracking-widest text-[9px] md:text-[10px] flex items-center justify-center gap-1.5 md:gap-2 transition-all">
                  <Instagram size={14} /> 
                  <span className="hidden md:inline">Ver Novidades no Insta</span>
                  <span className="md:hidden">Instagram</span>
                </a>
              )}
              {config.whatsapp && (
                <a href={`https://wa.me/${config.whatsapp}`} target="_blank" rel="noreferrer" className="flex-1 md:flex-none bg-[#10b981] hover:bg-[#059669] text-white px-2 md:px-5 py-2.5 md:py-3.5 rounded-lg font-bold uppercase tracking-widest text-[9px] md:text-[10px] flex items-center justify-center gap-1.5 md:gap-2 shadow-lg transition-all border border-transparent">
                  <MessageCircle size={14} /> 
                  <span className="hidden md:inline">Preciso de Ajuda</span>
                  <span className="md:hidden">Ajuda</span>
                </a>
              )}
            </div>
          </div>
        </div>

        {/* Botão de Voltar Menor e Mais Fino no Mobile */}
        <div className="flex justify-start">
          <button 
            onClick={() => navigate(-1)} 
            className="flex items-center gap-1.5 md:gap-2 text-[9px] md:text-[10px] font-bold uppercase tracking-widest text-slate-500 hover:text-slate-800 transition-colors px-3 md:px-4 py-1.5 md:py-2 bg-white border border-slate-200 rounded-lg shadow-sm hover:shadow-md hover:border-slate-300 active:scale-95"
          >
            <ArrowLeft className="w-3.5 h-3.5 md:w-4 md:h-4" /> Voltar
          </button>
        </div>

        {/* Títulos e Alertas Compactados no Mobile */}
        <div className="space-y-2 md:space-y-4 text-center">
          <h2 className="text-xl md:text-3xl font-black text-slate-800 tracking-tight break-words">
            {nomePasta || "Seus Arquivos"}
          </h2>
          
          {diasRestantes !== null && (
            <div className={`inline-flex items-center gap-2 px-3 md:px-4 py-1.5 md:py-2 rounded-full text-[10px] md:text-xs font-bold uppercase tracking-widest border ${diasRestantes > 5 ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-red-50 text-red-600 border-red-200'}`}>
              <Clock size={14} className="w-3.5 h-3.5 md:w-4 md:h-4" />
              {diasRestantes > 0 
                ? `Expira em ${diasRestantes} dia${diasRestantes > 1 ? 's' : ''}` 
                : "Acesso Expirado"}
            </div>
          )}
          <p className="text-[10px] md:text-xs font-medium text-slate-500 uppercase tracking-widest max-w-lg mx-auto leading-relaxed px-4 md:px-0 mt-1 md:mt-0">
            Faça o download dos seus arquivos em um computador para não perder a qualidade.
          </p>

          <div className="hidden md:flex pt-3 pb-2 justify-center">
            <a 
              href={`https://drive.google.com/drive/folders/${driveFolderId}`} 
              target="_blank" 
              rel="noreferrer"
              className="flex items-center gap-2 px-6 py-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-black uppercase tracking-widest text-[11px] shadow-lg shadow-blue-600/20 transition-all hover:-translate-y-0.5"
            >
              <DownloadCloud size={18} />
              Abrir Pasta no Google Drive
            </a>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden mt-2 md:mt-0">
          <div className="p-3 md:p-4 bg-white border-b border-slate-100 flex items-center justify-between">
            <span className="text-[9px] md:text-[10px] font-bold text-slate-500 uppercase tracking-widest">Conteúdo da Pasta</span>
            <span className="text-[9px] md:text-[10px] font-bold text-slate-500 uppercase tracking-widest bg-slate-100 px-3 py-1 rounded-full border border-slate-200">
              {arquivos.length} item(s)
            </span>
          </div>

          {arquivos.length === 0 ? (
            <p className="p-10 text-center text-[10px] md:text-xs font-bold text-slate-400 uppercase tracking-widest">Esta pasta está vazia.</p>
          ) : (
            <div className="p-4 md:p-6 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 md:gap-6 bg-slate-50/30">
              {arquivos.map((item, index) => (
                <div key={index} className="group flex flex-col bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 hover:border-blue-200">
                  
                  <div className="aspect-square bg-slate-100 border-b border-slate-100 flex items-center justify-center overflow-hidden relative">
                    {item.type === 'folder' ? (
                      <Folder size={64} className="text-slate-300 group-hover:scale-110 transition-transform duration-500" />
                    ) : (
                      <>
                        <img
                          src={`https://drive.google.com/thumbnail?id=${item.id}&sz=w400`}
                          alt={item.name}
                          loading="lazy" 
                          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                            e.currentTarget.nextElementSibling.classList.remove('hidden');
                          }}
                        />
                        <div className="hidden fallback-icon text-slate-300 group-hover:scale-110 transition-transform duration-500">
                          <FileIcon size={64} />
                        </div>
                      </>
                    )}
                  </div>

                  <div className="p-3 md:p-4 flex flex-col flex-1 justify-between gap-3 md:gap-4">
                    <div className="min-w-0 text-center">
                      <p className="text-xs md:text-sm font-bold text-slate-800 truncate" title={item.name}>{item.name}</p>
                      {item.size && <p className="text-[9px] md:text-[10px] font-bold text-slate-400 uppercase mt-0.5 md:mt-1">{formatarTamanho(item.size)}</p>}
                    </div>

                    {item.type === 'folder' ? (
                      <Link to={`${item.portalUrl}${dataEvento ? '?evento=' + dataEvento : ''}`} className="flex items-center justify-center gap-2 w-full py-2 md:py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[9px] md:text-[10px] font-bold uppercase tracking-widest transition-colors">
                        Abrir Pasta <ChevronRight size={14} className="w-3.5 h-3.5 md:w-4 md:h-4" />
                      </Link>
                    ) : (
                      <a href={item.driveUrl} target="_blank" rel="noreferrer" className="flex items-center justify-center gap-2 w-full py-2 md:py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-[9px] md:text-[10px] font-bold uppercase tracking-widest shadow-sm transition-colors">
                        <Download size={14} className="w-3.5 h-3.5 md:w-4 md:h-4" /> Baixar
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </main>

      <div className="md:hidden fixed bottom-0 left-0 right-0 p-4 bg-white/90 backdrop-blur-md border-t border-slate-200 z-[90] shadow-[0_-10px_30px_rgba(0,0,0,0.05)]">
        <a 
          href={`https://drive.google.com/drive/folders/${driveFolderId}`} 
          target="_blank" 
          rel="noreferrer"
          className="flex items-center justify-center gap-2 w-full py-3 bg-blue-600 active:bg-blue-700 text-white rounded-xl font-black uppercase tracking-widest text-[10px] shadow-lg shadow-blue-600/20 transition-colors"
        >
          <DownloadCloud size={18} />
          Abrir Pasta no Google Drive
        </a>
      </div>

    </div>
  );
}