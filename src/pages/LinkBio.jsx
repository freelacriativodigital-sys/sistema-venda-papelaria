import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../lib/supabase';
import { 
  Instagram, MessageCircle, ShoppingBag, ArrowRight, 
  Loader2, Link as LinkIcon, Store, Globe, MapPin 
} from 'lucide-react';

export default function LinkBio() {
  const [config, setConfig] = useState(null);
  const [produtos, setProdutos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('links'); // 'links' | 'loja'

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        // 1. Busca configurações da loja
        const { data: configData } = await supabase
          .from('configuracoes')
          .select('*')
          .eq('id', 1)
          .single();
          
        if (configData) setConfig(configData);

        // 2. Busca os produtos para a aba loja
        const { data: produtosData } = await supabase
          .from('produtos')
          .select('*')
          .order('created_at', { ascending: false });
          
        if (produtosData) setProdutos(produtosData);

        // Ajusta o título e cor da página
        if (configData?.nome_loja) document.title = `Links | ${configData.nome_loja}`;
      } catch (err) {
        console.error("Erro ao carregar LinkBio:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0);
  };

  const handleComprarProduto = (produto) => {
    if (!config?.whatsapp) return alert("WhatsApp da loja não configurado.");
    const numero = config.whatsapp.replace(/\D/g, '');
    const mensagem = `Olá! Estava na sua Bio e tenho interesse no produto: *${produto.nome}* (${formatCurrency(produto.preco)}). Pode me dar mais detalhes?`;
    window.open(`https://wa.me/${numero}?text=${encodeURIComponent(mensagem)}`, '_blank');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-slate-300" />
      </div>
    );
  }

  const corBanner = config?.cor_orcamento || '#33BEE8';

  return (
    <div className="min-h-screen bg-slate-50 flex justify-center pb-10 font-sans">
      
      {/* O CARD PRINCIPAL (Estilo Mobile, mesmo no Desktop) */}
      <div className="w-full max-w-md bg-white min-h-screen md:min-h-[auto] md:mt-10 md:rounded-[2.5rem] shadow-2xl overflow-hidden relative border border-slate-100 flex flex-col">
        
        {/* BANNER DE TOPO COLORIDO */}
        <div 
          className="h-32 md:h-40 w-full relative"
          style={{ backgroundColor: corBanner }}
        >
          {/* Curva suave na parte inferior do banner */}
          <div className="absolute -bottom-1 left-0 right-0 h-6 bg-white rounded-t-[2rem]"></div>
        </div>

        {/* FOTO E PERFIL */}
        <div className="px-6 flex flex-col items-center relative -mt-16">
          <div className="w-24 h-24 md:w-28 md:h-28 rounded-full border-4 border-white bg-slate-50 shadow-md flex items-center justify-center overflow-hidden z-10">
            {config?.logo_url ? (
              <img src={config.logo_url} alt="Logo" className="w-full h-full object-contain p-2" />
            ) : (
              <Store className="w-10 h-10 text-slate-300" />
            )}
          </div>
          
          <h1 className="mt-3 text-lg md:text-xl font-bold text-slate-800 tracking-tight text-center">
            {config?.nome_loja || "Sua Empresa"}
          </h1>
          
          <p className="mt-1.5 text-[11px] md:text-xs font-medium text-slate-500 text-center leading-relaxed max-w-[280px]">
            {config?.descricao_bio || "✨ Organização com charme! Sua papelaria funcional para deixar a rotina mais leve e bonita."}
          </p>

          {/* LOCALIZAÇÃO (Opcional) */}
          <div className="flex items-center gap-1 mt-3 text-[9px] font-semibold uppercase tracking-widest text-slate-400">
            <MapPin size={10} /> Brasil
          </div>
        </div>

        {/* SELETOR DE ABAS (PÍLULA PREMIUM) */}
        <div className="px-6 mt-6 w-full">
          <div className="flex bg-slate-100 p-1 rounded-full relative">
            <button 
              onClick={() => setActiveTab('links')}
              className={`flex-1 py-2 text-[10px] font-bold uppercase tracking-widest rounded-full transition-all z-10 ${activeTab === 'links' ? 'text-slate-800' : 'text-slate-400 hover:text-slate-600'}`}
            >
              Links Rápidos
            </button>
            <button 
              onClick={() => setActiveTab('loja')}
              className={`flex-1 py-2 text-[10px] font-bold uppercase tracking-widest rounded-full transition-all z-10 ${activeTab === 'loja' ? 'text-slate-800' : 'text-slate-400 hover:text-slate-600'}`}
            >
              Vitrine
            </button>

            {/* Pílula Deslizante Animada */}
            <motion.div 
              className="absolute top-1 bottom-1 w-[calc(50%-4px)] bg-white rounded-full shadow-[0_2px_8px_rgba(0,0,0,0.08)] z-0"
              initial={false}
              animate={{ left: activeTab === 'links' ? '4px' : 'calc(50%)' }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
            />
          </div>
        </div>

        {/* CONTEÚDO DAS ABAS */}
        <div className="flex-1 w-full px-6 pt-6 pb-8">
          <AnimatePresence mode="wait">
            
            {/* ABA: LINKS */}
            {activeTab === 'links' && (
              <motion.div 
                key="links"
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                className="space-y-3"
              >
                {config?.whatsapp && (
                  <a 
                    href={`https://wa.me/${config.whatsapp.replace(/\D/g, '')}`}
                    target="_blank" rel="noreferrer"
                    className="flex items-center p-3.5 bg-white border border-slate-200 rounded-xl shadow-sm hover:shadow-md hover:border-emerald-200 group transition-all"
                  >
                    <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                      <MessageCircle size={18} />
                    </div>
                    <span className="ml-4 text-xs font-bold text-slate-700 uppercase tracking-widest flex-1">
                      Fale no WhatsApp
                    </span>
                    <ArrowRight size={14} className="text-slate-300 group-hover:text-emerald-500 transition-colors" />
                  </a>
                )}

                {config?.instagram && (
                  <a 
                    href={config.instagram.startsWith('http') ? config.instagram : `https://${config.instagram}`}
                    target="_blank" rel="noreferrer"
                    className="flex items-center p-3.5 bg-white border border-slate-200 rounded-xl shadow-sm hover:shadow-md hover:border-pink-200 group transition-all"
                  >
                    <div className="w-10 h-10 rounded-full bg-pink-50 text-pink-600 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                      <Instagram size={18} />
                    </div>
                    <span className="ml-4 text-xs font-bold text-slate-700 uppercase tracking-widest flex-1">
                      Siga no Instagram
                    </span>
                    <ArrowRight size={14} className="text-slate-300 group-hover:text-pink-500 transition-colors" />
                  </a>
                )}

                {/* Exemplo de botão para o site ou catálogo completo */}
                <LinkIcon href="/" className="flex items-center p-3.5 bg-slate-900 border border-slate-800 rounded-xl shadow-md hover:bg-slate-800 group transition-all cursor-pointer">
                    <div className="w-10 h-10 rounded-full bg-white/10 text-white flex items-center justify-center shrink-0">
                      <Globe size={18} />
                    </div>
                    <span className="ml-4 text-xs font-bold text-white uppercase tracking-widest flex-1">
                      Acessar Site Completo
                    </span>
                    <ArrowRight size={14} className="text-slate-400 group-hover:text-white transition-colors" />
                </LinkIcon>

              </motion.div>
            )}

            {/* ABA: LOJA / VITRINE */}
            {activeTab === 'loja' && (
              <motion.div 
                key="loja"
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
              >
                {produtos.length === 0 ? (
                  <div className="text-center py-10 flex flex-col items-center">
                    <ShoppingBag className="w-10 h-10 text-slate-200 mb-3" />
                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Nenhum produto cadastrado.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-3 md:gap-4">
                    {produtos.map((produto) => (
                      <button 
                        key={produto.id} 
                        onClick={() => handleComprarProduto(produto)}
                        className="bg-white border border-slate-100 rounded-xl overflow-hidden shadow-sm hover:shadow-md hover:border-slate-300 transition-all text-left flex flex-col group"
                      >
                        <div className="aspect-square bg-slate-50 w-full overflow-hidden relative">
                          {produto.imagem_url ? (
                            <img src={produto.imagem_url} alt={produto.nome} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-slate-200"><ShoppingBag size={32}/></div>
                          )}
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <span className="text-white text-[9px] font-bold uppercase tracking-widest px-3 py-1.5 border border-white/50 rounded-full backdrop-blur-sm">
                              Eu Quero
                            </span>
                          </div>
                        </div>
                        <div className="p-3 flex flex-col flex-1">
                          <h3 className="text-[10px] md:text-xs font-semibold text-slate-800 leading-snug line-clamp-2" title={produto.nome}>
                            {produto.nome}
                          </h3>
                          <p className="text-[11px] md:text-sm font-bold text-emerald-600 mt-auto pt-2">
                            {formatCurrency(produto.preco)}
                          </p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </motion.div>
            )}

          </AnimatePresence>
        </div>

        {/* FOOTER */}
        <div className="mt-auto py-6 flex justify-center border-t border-slate-50 bg-slate-50/50">
          <p className="text-[8px] font-bold uppercase tracking-[0.2em] text-slate-300 flex items-center gap-1.5">
            <Globe size={10} /> {config?.nome_loja || "Criarte"}
          </p>
        </div>

      </div>
    </div>
  );
}