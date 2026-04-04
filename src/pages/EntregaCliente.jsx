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
        <Loader2 className="animate-spin text-blue-600" size={32} />
        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest animate-pulse">Preparando galeria...</p>
      </div>
    );
  }

  if (erro) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center">
        <AlertCircle className="text-red-400 mb-4" size={40} />
        <h1 className="text-lg md:text-xl font-black text-slate-800 uppercase tracking-tight mb-2">Ops! Algo deu errado</h1>
        <p className="text-[10px] md:text-xs font-medium text-slate-500 max-w-md">{erro}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans pb-32 md:pb-20">
      
      <header className="w-full pt-6 md:pt-10 pb-2 md:pb-4 px-4 flex justify-center items-center">
        {config.logo_url ? (
          <img 
            src={config.logo_url} 
            alt="Logo" 
            className="max-h-12 md:max-h-24 object-contain drop-shadow-xl hover:scale-105 transition-transform duration-500" 
          />
        ) : (
          <h1 className="text-lg md:text-2xl font-black text-slate-800 uppercase tracking-widest drop-shadow-sm">
            Portal do Cliente
          </h1>
        )}
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 pt-2 md:pt-4 space-y-4 md:space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
        
        {/* BANNER DE MARKETING */}
        <div className="w-full bg-[#1e1b4b] rounded-xl p-4 shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
            <Sparkles className="w-16 h-16 md:w-24 md:h-24" />
          </div>
          
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-3 md:gap-4">
            <div className="flex-1">
              <span className="text-[7px] md:text-[8px] font-bold text-indigo-300 uppercase tracking-widest block mb-0.5">
                FEITO COM CARINHO - PORTAL CRIARTE
              </span>
              <h2 className="text-xs md:text-sm font-black text-white uppercase tracking-tight mb-1">
                MUITO OBRIGADO PELA CONFIANÇA!
              </h2>
              <p className="text-[9px] md:text-[10px] font-medium text-slate-300 leading-snug max-w-xl">
                É uma alegria fazer parte do seu projeto! Fico imensamente grato por escolher o meu trabalho. Te convido a acompanhar meu Instagram para conferir as últimas novidades. Ah, e se precisar de qualquer ajuda na hora de abrir ou usar os arquivos, estou à total disposição!
              </p>
            </div>
            
            <div className="flex flex-row md:flex-col gap-2 shrink-0 w-full md:w-auto mt-1 md:mt-0">
              {config.instagram && (
                <a href={config.instagram.startsWith('http') ? config.instagram : `https://${config.instagram}`} target="_blank" rel="noreferrer" className="flex-1 md:flex-none bg-white/10 hover:bg-white/20 border border-white/30 text-white px-3 py-2 rounded-lg font-bold uppercase tracking-widest text-[8px] md:text-[9px] flex items-center justify-center gap-1.5 transition-all">
                  <Instagram size={12} /> 
                  <span className="hidden md:inline">Ver Insta</span>
                  <span className="md:hidden">Instagram</span>
                </a>
              )}
              {config.whatsapp && (
                <a href={`https://wa.me/${config.whatsapp}`} target="_blank" rel="noreferrer" className="flex-1 md:flex-none bg-[#10b981] hover:bg-[#059669] text-white px-3 py-2 rounded-lg font-bold uppercase tracking-widest text-[8px] md:text-[9px] flex items-center justify-center gap-1.5 shadow-lg transition-all border border-transparent">
                  <MessageCircle size={12} /> 
                  <span className="hidden md:inline">Preciso de Ajuda</span>
                  <span className="md:hidden">Ajuda</span>
                </a>
              )}
            </div>
          </div>
        </div>

        <div className="flex justify-between items-end gap-3">
          <button 
            onClick={() => navigate(-1)} 
            className="flex items-center gap-1 text-[8px] md:text-[9px] font-bold uppercase tracking-widest text-slate-500 hover:text-slate-800 transition-colors px-2 md:px-3 py-1.5 bg-white border border-slate-200 rounded-lg shadow-sm hover:shadow-md hover:border-slate-300 active:scale-95 shrink-0"
          >
            <ArrowLeft className="w-3 h-3 md:w-3.5 md:h-3.5" /> Voltar
          </button>

          <div className="text-right flex-1 min-w-0">
             <h2 className="text-base md:text-2xl font-black text-slate-800 tracking-tight break-words leading-tight truncate">
               {nomePasta || "Galeria de Arquivos"}
             </h2>
             <p className="text-[8px] md:text-[9px] font-medium text-slate-500 uppercase tracking-widest truncate mt-0.5">
               Para não perder qualidade, baixe usando um computador.
             </p>
          </div>
        </div>

        {diasRestantes !== null && (
          <div className="flex justify-end">
             <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[8px] md:text-[9px] font-bold uppercase tracking-widest border ${diasRestantes > 5 ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-red-50 text-red-600 border-red-200'}`}>
               <Clock size={12} className="w-3 h-3" />
               {diasRestantes > 0 
                 ? `Acesso expira em ${diasRestantes} dia${diasRestantes > 1 ? 's' : ''}` 
                 : "Acesso Expirado"}
             </div>
          </div>
        )}

        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden mt-2 md:mt-0">
          <div className="p-2 md:p-3 bg-slate-50/50 border-b border-slate-100 flex items-center justify-between">
            <span className="text-[8px] md:text-[9px] font-bold text-slate-500 uppercase tracking-widest ml-1">Arquivos da Pasta</span>
            <span className="text-[8px] md:text-[9px] font-bold text-slate-500 uppercase tracking-widest bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
              {arquivos.length} itens
            </span>
          </div>

          {arquivos.length === 0 ? (
            <p className="p-8 text-center text-[9px] md:text-[10px] font-bold text-slate-400 uppercase tracking-widest">A pasta está vazia.</p>
          ) : (
            // A MÁGICA DA GALERIA COMPACTA: Grid menor, mais colunas.
            <div className="p-3 md:p-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 md:gap-4 bg-slate-50/30">
              {arquivos.map((item, index) => {
                const isFolder = item.type === 'folder';
                const linkDestino = isFolder ? `${item.portalUrl}${dataEvento ? '?evento=' + dataEvento : ''}` : item.driveUrl;

                return (
                  <div key={index} className="group flex flex-col bg-white border border-slate-200 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 hover:border-blue-200">
                    
                    {/* ÁREA DA IMAGEM TOTALMENTE CLICÁVEL SE FOR PASTA */}
                    {isFolder ? (
                       <Link to={linkDestino} className="aspect-square bg-slate-50 border-b border-slate-100 flex flex-col items-center justify-center overflow-hidden relative cursor-pointer group-hover:bg-slate-100 transition-colors">
                          <Folder size={40} className="text-slate-300 group-hover:scale-110 group-hover:text-blue-400 transition-all duration-500 mb-1" />
                          <span className="text-[8px] font-bold uppercase tracking-widest text-slate-400 group-hover:text-blue-500 opacity-0 group-hover:opacity-100 transition-opacity">Abrir Pasta</span>
                       </Link>
                    ) : (
                       <div className="aspect-square bg-slate-100 border-b border-slate-100 flex items-center justify-center overflow-hidden relative">
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
                           <FileIcon size={40} />
                         </div>
                       </div>
                    )}

                    <div className="p-2 md:p-2.5 flex flex-col flex-1 justify-between gap-2">
                      <div className="min-w-0 text-center">
                        <p className="text-[10px] md:text-xs font-bold text-slate-800 truncate" title={item.name}>{item.name}</p>
                        {item.size && <p className="text-[7.5px] md:text-[8px] font-bold text-slate-400 uppercase mt-0.5">{formatarTamanho(item.size)}</p>}
                      </div>

                      {!isFolder && (
                        <a href={item.driveUrl} target="_blank" rel="noreferrer" className="flex items-center justify-center gap-1.5 w-full py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-[8px] md:text-[9px] font-bold uppercase tracking-widest shadow-sm transition-colors mt-1">
                          <Download size={12} className="w-3 h-3 md:w-3.5 md:h-3.5" /> Baixar
                        </a>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* BOTÃO DO DRIVE MAIS DISCRETO NO PC */}
        <div className="hidden md:flex pt-2 pb-4 justify-center">
          <a 
            href={`https://drive.google.com/drive/folders/${driveFolderId}`} 
            target="_blank" 
            rel="noreferrer"
            className="flex items-center gap-2 px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg font-bold uppercase tracking-widest text-[9px] transition-colors border border-slate-200"
          >
            <DownloadCloud size={14} />
            Se preferir, abra direto no Google Drive
          </a>
        </div>

      </main>

      {/* BOTÃO DO DRIVE MAIS DISCRETO NO MOBILE */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 p-3 bg-white/90 backdrop-blur-md border-t border-slate-200 z-[90] shadow-[0_-10px_30px_rgba(0,0,0,0.03)] pb-safe">
        <a 
          href={`https://drive.google.com/drive/folders/${driveFolderId}`} 
          target="_blank" 
          rel="noreferrer"
          className="flex items-center justify-center gap-2 w-full py-2.5 bg-slate-100 active:bg-slate-200 text-slate-600 border border-slate-200 rounded-lg font-bold uppercase tracking-widest text-[9px] transition-colors"
        >
          <DownloadCloud size={14} />
          Se preferir, abra no Google Drive
        </a>
      </div>

    </div>
  );
}