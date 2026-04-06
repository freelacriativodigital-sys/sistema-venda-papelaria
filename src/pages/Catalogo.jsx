import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, MessageCircle, Plus, Minus, Loader2, Star, Check, Save, ArrowLeft, ShoppingCart, ShoppingBag, X, Trash2, Palette, LayoutTemplate, Tags, Image as ImageIcon, Globe, Box, Package, Layers, Sparkles, Copy, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "../lib/supabase";
import { AnimatePresence, motion } from "framer-motion";

// --- IMPORTANDO OS SEUS NOVOS COMPONENTES (Cérebro e Visual) ---
import { deletePhysicalFile, compressImageToBlob } from '../components/Catalogo/catalogoUtils';
import { HeaderSite } from '../components/Catalogo/HeaderSite';
import BenefitsBar from '../components/Catalogo/BenefitsBar';
import FooterSite from '../components/Catalogo/FooterSite';
import EditorSection from '../components/Catalogo/EditorSection';
import EditorForms from '../components/Catalogo/EditorForms';
import SeletorData from '../components/SeletorData';

// --- COMPONENTE DO CARROSSEL DE FOTOS DO CARD ---
const CardSlider = ({ prod, aspectClass, st, isDestaqueCarrossel }) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  const images = useMemo(() => {
    const imgSet = new Set();
    if (prod.imagem_url) imgSet.add(prod.imagem_url);
    if (prod.imagens && Array.isArray(prod.imagens)) {
      prod.imagens.forEach(img => imgSet.add(img));
    }
    if (prod.variacoes?.ativa && prod.variacoes.atributos) {
      prod.variacoes.atributos.forEach(attr => {
        attr.opcoes?.forEach(op => {
          if (op.imagem) imgSet.add(op.imagem);
        });
      });
    }
    return Array.from(imgSet);
  }, [prod]);

  useEffect(() => {
    let interval;
    if (prod.variacoes?.ativa && images.length > 1) {
      interval = setInterval(() => {
        setCurrentIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
      }, 2500); 
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [images.length, prod.variacoes?.ativa]);

  const nextSlide = (e) => {
    e.stopPropagation();
    e.preventDefault();
    setCurrentIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };

  const prevSlide = (e) => {
    e.stopPropagation();
    e.preventDefault();
    setCurrentIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  const activeImg = images[currentIndex] || `https://placehold.co/400`;

  return (
    <div className={`${aspectClass} bg-slate-50 border-b border-slate-100 overflow-hidden relative shrink-0 group/slider`}>
      {prod.destaque && (
        <span className={`absolute ${isDestaqueCarrossel ? 'top-2 left-2 text-[8px] px-1.5 py-0.5' : 'top-3 left-3 text-[9px] px-2 py-1'} z-10 text-white font-semibold rounded shadow-sm flex items-center gap-1 uppercase`} style={{ backgroundColor: st?.cor_etiqueta_destaque || '#fbbf24' }}>
          <Star size={isDestaqueCarrossel ? 8 : 10} fill="currentColor" /> Destaque
        </span>
      )}
      
      <img src={activeImg} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" alt={prod.nome} />
      
      {images.length > 1 && (
        <>
          <button onClick={prevSlide} className="absolute left-2 top-1/2 -translate-y-1/2 w-6 h-6 md:w-7 md:h-7 bg-white/90 text-slate-700 rounded-full flex items-center justify-center opacity-0 group-hover/slider:opacity-100 transition-opacity z-20 shadow-md hover:bg-white"><ChevronLeft size={14}/></button>
          <button onClick={nextSlide} className="absolute right-2 top-1/2 -translate-y-1/2 w-6 h-6 md:w-7 md:h-7 bg-white/90 text-slate-700 rounded-full flex items-center justify-center opacity-0 group-hover/slider:opacity-100 transition-opacity z-20 shadow-md hover:bg-white"><ChevronLeft size={14} className="rotate-180"/></button>
          
          <div className="absolute bottom-2 left-0 right-0 flex justify-center gap-1 z-20">
            {images.map((_, i) => (
              <div key={i} className={`h-1.5 rounded-full transition-all shadow-sm ${i === currentIndex ? 'w-3 bg-white' : 'w-1.5 bg-white/60'}`} />
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default function Catalogo({ isPublic = false }) {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const [view, setView] = useState('grid');
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('Todas');
  const [searchTerm, setSearchTerm] = useState('');
  
  const [quantidade, setQuantidade] = useState(1);
  const [selecoes, setSelecoes] = useState({});
  const [respostasPersonalizadas, setRespostasPersonalizadas] = useState({});
  
  // Controle da sanfona (accordion) de descrição para mobile e desktop
  const [isDescExpanded, setIsDescExpanded] = useState(false);

  const [activeImage, setActiveImage] = useState('');
  const [galleryImages, setGalleryImages] = useState([]);
  
  const [st, setSt] = useState(null);
  const [produtos, setProdutos] = useState([]);
  const [categoriasRaw, setCategoriasRaw] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState(false);
  const [isUploadingGlobal, setIsUploadingGlobal] = useState(false);

  const [openSection, setOpenSection] = useState('');
  const [carrinho, setCarrinho] = useState([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  
  const imageRef = useRef(null);

  useEffect(() => {
    async function registrarAcesso() {
      if (isPublic && !sessionStorage.getItem('visitou_catalogo')) {
        try {
          const { data } = await supabase.from('configuracoes').select('acessos_catalogo').eq('id', 1).single();
          const acessosAtuais = data ? Number(data.acessos_catalogo) || 0 : 0;
          await supabase.from('configuracoes').update({ acessos_catalogo: acessosAtuais + 1 }).eq('id', 1);
          sessionStorage.setItem('visitou_catalogo', 'true');
        } catch (error) {}
      }
    }
    registrarAcesso();
  }, [isPublic]);

  useEffect(() => {
    async function fetchData() {
      try {
        const { data: configData } = await supabase.from('configuracoes').select('*').eq('id', 1).single();
        if (configData) setSt(configData);

        const { data: prodData } = await supabase.from('produtos').select('*').eq('status_online', true).order('created_at', { ascending: false });
        if (prodData) {
          setProdutos(prodData);
          const uniqueCats = [...new Set(prodData.map(p => p.categoria))];
          setCategoriasRaw(uniqueCats);
        }
      } catch (err) {}
      finally { setLoading(false); }
    }
    fetchData();
  }, []);

  useEffect(() => {
    if (st) {
      let metaRobots = document.getElementById('seo-robots');
      if (!metaRobots) {
        metaRobots = document.createElement('meta');
        metaRobots.name = 'robots';
        metaRobots.id = 'seo-robots';
        document.head.appendChild(metaRobots);
      }

      if (st.indexar_google !== false && isPublic) {
        metaRobots.setAttribute("content", "index, follow");
      } else {
        metaRobots.setAttribute("content", "noindex, nofollow");
      }

      if (st.meta_pixel_id && isPublic && !window.fbq) {
        !function(f,b,e,v,n,t,s)
        {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
        n.callMethod.apply(n,arguments):n.queue.push(arguments)};
        if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
        n.queue=[];t=b.createElement(e);t.async=!0;
        t.src=v;s=b.getElementsByTagName(e)[0];
        s.parentNode.insertBefore(t,s)}(window, document,'script',
        'https://connect.facebook.net/en_US/fbevents.js');
        
        window.fbq('init', st.meta_pixel_id);
        window.fbq('track', 'PageView');
      }
    }
  }, [st, isPublic]);

  const displayCategories = useMemo(() => {
    if (categoriasRaw.length === 0) return [];
    let orderedCats = [...categoriasRaw];
    if (st?.ordem_categorias && st.ordem_categorias.length > 0) {
      orderedCats.sort((a, b) => {
        const idxA = st.ordem_categorias.indexOf(a);
        const idxB = st.ordem_categorias.indexOf(b);
        if (idxA !== -1 && idxB !== -1) return idxA - idxB;
        if (idxA !== -1) return -1;
        if (idxB !== -1) return 1;
        return 0;
      });
    }
    return orderedCats;
  }, [categoriasRaw, st?.ordem_categorias]);

  useEffect(() => {
    if (produtos.length === 0) return;
    const urlCategoria = searchParams.get('categoria') || 'Todas';
    const urlProduto = searchParams.get('produto');

    setSelectedCategory(urlCategoria);

    if (urlProduto) {
      const prod = produtos.find(p => String(p.id) === String(urlProduto));
      if (prod) {
        if (view !== 'detalhe' || selectedProduct?.id !== prod.id) setupDetalheProduto(prod);
      } else {
        setView('grid');
        setSelectedProduct(null);
      }
    } else {
      setView('grid');
      setSelectedProduct(null);
    }
  }, [searchParams, produtos]);

  const changeCategory = (cat) => { setSearchParams({ categoria: cat }); window.scrollTo({ top: 0, behavior: 'smooth' }); };
  const goHome = () => { setSearchParams({}); window.scrollTo({ top: 0, behavior: 'smooth' }); };

  const abrirDetalhe = (prod) => {
    const params = new URLSearchParams(searchParams);
    params.set('produto', prod.id);
    setSearchParams(params);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    
    if (st?.meta_pixel_id && isPublic && window.fbq) {
      window.fbq('track', 'ViewContent', {
        content_name: prod.nome,
        content_ids: [prod.id],
        content_type: 'product',
        value: prod.preco_promocional > 0 ? prod.preco_promocional : prod.preco,
        currency: 'BRL'
      });
    }
  };

  const voltarParaGrid = () => {
    const params = new URLSearchParams(searchParams);
    params.delete('produto');
    setSearchParams(params);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const setupDetalheProduto = (prod) => {
    const mainImage = (prod.imagens && prod.imagens.length > 0) ? prod.imagens[0] : prod.imagem_url;
    
    const iniciais = {};
    let selectedImageForGallery = mainImage;

    if (prod.variacoes?.ativa && prod.variacoes.atributos) {
      prod.variacoes.atributos.forEach(atrib => {
        let selectedOpcao = atrib.opcoes?.find(op => op.imagem && op.imagem === mainImage);
        if (!selectedOpcao && atrib.opcoes?.length > 0) {
          selectedOpcao = atrib.opcoes[0];
        }

        if (selectedOpcao) {
          iniciais[atrib.nome] = selectedOpcao;
          if (selectedOpcao.imagem) {
            selectedImageForGallery = selectedOpcao.imagem;
          }
        }
      });
    }
    
    const imgSet = new Set();
    if (prod.imagem_url) imgSet.add(prod.imagem_url);
    if (prod.imagens && Array.isArray(prod.imagens)) prod.imagens.forEach(img => imgSet.add(img));
    if (prod.variacoes?.ativa && prod.variacoes.atributos) {
      prod.variacoes.atributos.forEach(attr => attr.opcoes?.forEach(op => { if (op.imagem) imgSet.add(op.imagem); }));
    }
    
    const finalGallery = Array.from(imgSet);
    setGalleryImages(finalGallery);
    
    setActiveImage(selectedImageForGallery || `https://placehold.co/600x600?text=${encodeURIComponent(prod.nome)}`);
    setSelecoes(iniciais);
    setRespostasPersonalizadas({}); 
    setQuantidade(prod.qtd_minima || 1);
    setIsDescExpanded(false); // Reseta a sanfona ao abrir um novo produto
    setSelectedProduct(prod);
    setView('detalhe');
  };

  const handleSave = async () => {
    const { error } = await supabase.from('configuracoes').update(st).eq('id', 1);
    if (!error) {
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
      setOpenSection('');
    } else {
      alert("Erro ao salvar: " + error.message);
    }
  };

  const copyVitrineLink = () => {
    const url = window.location.origin + "/vitrine";
    navigator.clipboard.writeText(url);
    alert("Link copiado!");
  };

  const handleImageUpload = async (e, field) => {
    const file = e.target.files[0];
    if (!file) return;
    setIsUploadingGlobal(true);
    try {
      if (st[field]) await deletePhysicalFile(st[field]);
      const blob = await compressImageToBlob(file);
      const fileName = `catalogo-${field}-${Date.now()}-${Math.random().toString(36).substring(7)}.webp`;
      const { error } = await supabase.storage.from('produtos').upload(fileName, blob, { contentType: 'image/webp', upsert: true });
      if (error) throw error;
      const { data: publicUrlData } = supabase.storage.from('produtos').getPublicUrl(fileName);
      setSt(prev => ({ ...prev, [field]: publicUrlData.publicUrl }));
    } catch (err) {
      alert("Erro ao subir imagem: " + err.message);
    } finally {
      setIsUploadingGlobal(false);
    }
  };

  const removeImageAndStorage = async (field) => {
    const currentUrl = st[field];
    if (currentUrl) {
      setIsUploadingGlobal(true);
      await deletePhysicalFile(currentUrl);
      setSt(prev => ({ ...prev, [field]: '' }));
      setIsUploadingGlobal(false);
    }
  };

  const filtered = produtos
    .filter(p => {
      const matchSearch = p.nome?.toLowerCase().includes(searchTerm.toLowerCase());
      const pCat = String(p.categoria || "").toLowerCase().trim();
      const sCat = String(selectedCategory || "").toLowerCase().trim();
      const matchCategory = selectedCategory === 'Todas' || pCat === sCat;
      return matchSearch && matchCategory;
    })
    .sort((a, b) => {
      if (a.destaque && !b.destaque) return -1;
      if (!a.destaque && b.destaque) return 1;
      return 0;
    });

  const calcularDesconto = (preco, promo) => {
    if (!promo || promo >= preco || preco === 0) return 0;
    return Math.round(((preco - promo) / preco) * 100);
  };

  const selecionarOpcao = (nomeAtributo, opcao) => {
    setSelecoes(prev => ({ ...prev, [nomeAtributo]: opcao }));
    if (opcao.imagem) {
      setActiveImage(opcao.imagem);
      if (window.innerWidth < 768 && imageRef.current) {
        const rect = imageRef.current.getBoundingClientRect();
        if (rect.top < 60) window.scrollBy({ top: rect.top - 80, behavior: 'smooth' });
      }
    }
  };

  const lidarRespostaPersonalizada = (id, valor) => {
    setRespostasPersonalizadas(prev => ({ ...prev, [id]: valor }));
  };

  const handleQuantidadeChange = (e) => {
    const val = e.target.value.replace(/\D/g, '');
    if (val === '') { setQuantidade(''); } else { setQuantidade(parseInt(val)); }
  };

  const handleQuantidadeBlur = () => {
    const minQtd = selectedProduct?.qtd_minima || 1;
    if (!quantidade || quantidade < minQtd) setQuantidade(minQtd);
  };

  const decrementarQuantidade = () => {
     const minQtd = selectedProduct?.qtd_minima || 1;
     setQuantidade(prev => Math.max(minQtd, prev - 1));
  };

  const finalizarPedido = () => {
    if (carrinho.length === 0) return;

    const num = st?.whatsapp?.replace(/\D/g, '');
    let dbDesc = '';
    let zapMsg = 'Olá! Gostaria de fazer o seguinte pedido pelo catálogo:\n\n';
    let totalGeral = 0;

    carrinho.forEach((item) => {
       const textoVars = Object.entries(item.selecoes).map(([k, v]) => `▪️ *${k}:* ${v.nome}`).join('\n');
       
       let textoPersonalizado = '';
       
       if (item.respostasPersonalizadas && Object.keys(item.respostasPersonalizadas).length > 0) {
          textoPersonalizado = '\n*Personalização:*\n' + Object.entries(item.respostasPersonalizadas).map(([k, v]) => {
             // CORREÇÃO: Comparando como String para evitar bug de ID numérico não bater com a chave string
             const campo = item.produto.campos_personalizados?.find(c => String(c.id) === String(k));
             
             // BÔNUS: Se for data (YYYY-MM-DD), inverte para o padrão Brasil no Zap (DD/MM/YYYY)
             let valorExibido = v;
             if (campo?.tipo === 'data' && v.includes('-')) {
                 const [year, month, day] = v.split('-');
                 if (year && month && day) {
                     valorExibido = `${day}/${month}/${year}`;
                 }
             }

             return `▪️ *${campo?.titulo || k}:* ${valorExibido}`;
          }).join('\n');
       }

       const itemTotal = item.precoTotal;
       totalGeral += itemTotal;

       const descItem = `🛍️ *${item.tituloDinamico}*\n${textoVars}${textoPersonalizado ? '\n' + textoPersonalizado : ''}\n*Qtd:* ${item.quantidade} un. | *Subtotal:* R$ ${itemTotal.toFixed(2)}${item.wholesaleApplied ? ' (Atacado)' : ''}\n\n`;
       
       dbDesc += descItem;
       zapMsg += descItem;
    });

    dbDesc += `\n*TOTAL DO PEDIDO:* R$ ${totalGeral.toFixed(2)}`;
    zapMsg += `*TOTAL DO PEDIDO:* R$ ${totalGeral.toFixed(2)}`;

    if (st?.meta_pixel_id && isPublic && window.fbq) {
      window.fbq('track', 'InitiateCheckout', {
        value: totalGeral,
        currency: 'BRL',
        num_items: carrinho.length
      });
    }

    supabase.from('pedidos').insert([{
       title: `Catálogo: Pedido de ${carrinho.length} item(s)`,
       description: dbDesc,
       service_value: totalGeral,
       status: 'solicitacao',
       priority: 'alta',
       category: 'Catálogo'
    }]).then(() => {}).catch(err => console.error(err));

    window.open(`https://wa.me/${num}?text=${encodeURIComponent(zapMsg)}`, '_blank');
    setCarrinho([]); 
    setIsCartOpen(false);
  };

  const renderCatalog = () => {
    const aspectClass = st?.formato_imagens === 'retrato' ? 'aspect-[4/5]' : 'aspect-square';

    if (view === 'detalhe' && selectedProduct) {
      let baseProductPrice = selectedProduct.preco_promocional > 0 ? selectedProduct.preco_promocional : selectedProduct.preco;
      let currentPrice = baseProductPrice;
      let hasVariationPrice = false;
      let variationPriceSum = 0;

      Object.values(selecoes).forEach(opcao => { 
        if (opcao && Number(opcao.preco) > 0) { variationPriceSum += Number(opcao.preco); hasVariationPrice = true; } 
      });

      if (hasVariationPrice) currentPrice = variationPriceSum;

      const getWholesalePrice = (rulePrice) => {
        if (hasVariationPrice && baseProductPrice > 0) {
          const absoluteDiscount = baseProductPrice - rulePrice;
          return Math.max(0, currentPrice - absoluteDiscount);
        }
        return rulePrice;
      };

      let unitPriceFinal = currentPrice;
      let wholesaleApplied = false;
      const minQtd = selectedProduct.qtd_minima || 1;
      const qtdSafe = Math.max(quantidade || minQtd, minQtd);

      if (selectedProduct.atacado?.ativa && selectedProduct.atacado?.regras?.length > 0) {
        const validRules = selectedProduct.atacado.regras.filter(r => qtdSafe >= r.min && (!r.max || qtdSafe <= r.max)).sort((a, b) => b.min - a.min);
        if (validRules.length > 0) {
          unitPriceFinal = getWholesalePrice(validRules[0].preco);
          wholesaleApplied = true;
        }
      }

      let atacadoData = null;
      if (selectedProduct.atacado?.ativa && selectedProduct.atacado?.regras?.length > 0) {
        const sortedRules = [...selectedProduct.atacado.regras].sort((a, b) => a.min - b.min);
        const nextRule = sortedRules.find(r => r.min > qtdSafe);
        const activeRule = [...sortedRules].reverse().find(r => qtdSafe >= r.min);
        atacadoData = { rules: sortedRules, nextRule, activeRule, progress: nextRule ? (qtdSafe / nextRule.min) * 100 : 100 };
      }

      const precoTotal = unitPriceFinal * qtdSafe;
      const descontoPercent = calcularDesconto(selectedProduct.preco, selectedProduct.preco_promocional);
      const relacionados = produtos.filter(p => p.categoria === selectedProduct.categoria && p.id !== selectedProduct.id).slice(0, 4);

      const variacoesSelecionadasStr = Object.values(selecoes)
        .filter(Boolean)
        .map(opcao => opcao.nome)
        .join(' - ');
      
      const tituloDinamico = variacoesSelecionadasStr 
        ? `${selectedProduct.nome} (${variacoesSelecionadasStr})` 
        : selectedProduct.nome;

      const adicionarAoCarrinho = () => {
        if (selectedProduct.campos_personalizados?.length > 0) {
          const camposFaltando = selectedProduct.campos_personalizados.filter(
            campo => campo.obrigatorio && (!respostasPersonalizadas[campo.id] || respostasPersonalizadas[campo.id].trim() === '')
          );
          if (camposFaltando.length > 0) {
            alert(`Por favor, preencha o campo obrigatório: ${camposFaltando[0].titulo}`);
            return;
          }
        }

        const novoItem = {
          id_carrinho: Date.now() + Math.random(),
          produto: selectedProduct,
          tituloDinamico,
          quantidade: qtdSafe,
          unitPriceFinal,
          precoTotal,
          wholesaleApplied,
          selecoes,
          respostasPersonalizadas,
          activeImage
        };

        if (st?.meta_pixel_id && isPublic && window.fbq) {
          window.fbq('track', 'AddToCart', {
            content_name: tituloDinamico,
            content_ids: [selectedProduct.id],
            content_type: 'product',
            value: precoTotal,
            currency: 'BRL'
          });
        }

        setCarrinho(prev => [...prev, novoItem]);
        setIsCartOpen(true); 
      };

      const variacoesJSX = selectedProduct.variacoes?.ativa && selectedProduct.variacoes?.atributos ? (
        <div className="space-y-4 md:space-y-5 mb-4 md:mb-6 md:border-b border-slate-100 md:pb-6">
          {selectedProduct.variacoes.atributos.map(atrib => (
            <div key={atrib.id}>
              <h3 className="text-[11px] md:text-xs font-semibold text-slate-700 mb-2">{atrib.nome}:</h3>
              <div className="flex flex-wrap gap-2 md:gap-2.5">
                {atrib.opcoes.map(opcao => {
                  const isSelected = selecoes[atrib.nome]?.id === opcao.id;
                  return (
                    <button
                      key={opcao.id}
                      onClick={() => selecionarOpcao(atrib.nome, opcao)}
                      className={`px-3 py-1.5 md:px-4 md:py-2 rounded-lg text-[10px] md:text-xs font-semibold transition-all border flex items-center gap-2.5 ${isSelected ? 'border-slate-800 bg-slate-900 text-white' : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50'}`}
                    >
                      {opcao.imagem && <div className="w-7 h-7 md:w-5 md:h-5 rounded-full overflow-hidden shrink-0 bg-white"><img src={opcao.imagem} className="w-full h-full object-cover"/></div>}
                      {opcao.nome}
                    </button>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      ) : null;

      const camposPersonalizadosJSX = selectedProduct.campos_personalizados?.length > 0 ? (
        <div className="mb-6 space-y-3">
          <h3 className="text-[11px] font-semibold text-slate-700 uppercase tracking-widest border-b border-slate-100 pb-2 flex items-center gap-1.5">
            <FileText size={14} className="text-emerald-500"/> Personalização
          </h3>
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-4 shadow-sm">
            {selectedProduct.campos_personalizados.map(campo => (
              <div key={campo.id} className="space-y-1.5">
                <label className="text-[10px] font-semibold text-slate-700 uppercase tracking-widest ml-0.5 flex items-center gap-1">
                  {campo.titulo} {campo.obrigatorio && <span className="text-red-500">*</span>}
                </label>
                {campo.tipo === 'texto_curto' && (
                  <Input 
                    value={respostasPersonalizadas[campo.id] || ''} 
                    onChange={(e) => lidarRespostaPersonalizada(campo.id, e.target.value)} 
                    className="h-9 bg-white border-slate-200 text-xs font-medium text-slate-800 focus:border-emerald-400" 
                    placeholder="Digite sua resposta..."
                  />
                )}
                {campo.tipo === 'texto_longo' && (
                  <textarea 
                    value={respostasPersonalizadas[campo.id] || ''} 
                    onChange={(e) => lidarRespostaPersonalizada(campo.id, e.target.value)} 
                    className="w-full min-h-[80px] p-2.5 bg-white border border-slate-200 rounded-md text-xs font-medium text-slate-800 resize-none outline-none focus:border-emerald-400 transition-colors" 
                    placeholder="Escreva os detalhes..."
                  />
                )}
                {campo.tipo === 'data' && (
                  <SeletorData 
                    value={respostasPersonalizadas[campo.id] || ''} 
                    onChange={(val) => lidarRespostaPersonalizada(campo.id, val)} 
                  />
                )}
                {campo.tipo === 'hora' && (
                  <Input 
                    type="time"
                    value={respostasPersonalizadas[campo.id] || ''} 
                    onChange={(e) => lidarRespostaPersonalizada(campo.id, e.target.value)} 
                    className="h-9 bg-white border-slate-200 text-xs font-medium text-slate-800 focus:border-emerald-400 cursor-pointer" 
                  />
                )}
                {campo.tipo === 'upload' && (
                  <div className="bg-white border border-dashed border-slate-300 p-3 rounded-md text-center shadow-inner">
                     <ImageIcon size={16} className="mx-auto text-slate-300 mb-1" />
                     <p className="text-[9px] font-semibold text-slate-500 uppercase tracking-widest leading-tight">
                       O envio da foto/arte será solicitado pelo WhatsApp após finalizar o pedido.
                     </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      ) : null;

      let floatingCartBottom = 'bottom-6'; 
      if (view === 'detalhe') {
         floatingCartBottom = isPublic ? 'bottom-[140px]' : 'bottom-[200px]';
      } else if (!isPublic) {
         floatingCartBottom = 'bottom-[88px]'; 
      }

      return (
        <div className="min-h-screen bg-white flex flex-col relative pb-[160px] md:pb-0">
          <HeaderSite st={st} searchTerm={searchTerm} setSearchTerm={setSearchTerm} selectedCategory={selectedCategory} changeCategory={changeCategory} categorias={displayCategories} isPublic={isPublic} goHome={goHome} view={view} />
          <BenefitsBar st={st} />
          
          <div className="max-w-6xl mx-auto px-4 md:px-8 pt-6 md:pt-10 flex-1 w-full animate-in fade-in duration-500 mb-10">
            <button onClick={voltarParaGrid} className="flex items-center gap-1.5 text-slate-500 font-semibold text-xs hover:text-slate-900 transition-all mb-6">
              <ChevronLeft size={16} /> Voltar para loja
            </button>
            <div className="flex flex-col md:flex-row gap-8 lg:gap-12" ref={imageRef}>
              
              {/* LADO ESQUERDO (Imagens e Descrição no Desktop) */}
              <div className="w-full md:w-[45%] flex flex-col gap-4">
                 <div className={`${aspectClass} rounded-2xl overflow-hidden bg-slate-50 border border-slate-100 shadow-sm relative group`}>
                   {selectedProduct.destaque && (
                      <div className="absolute top-4 left-4 z-10 text-white text-[10px] font-semibold px-3 py-1.5 rounded-lg shadow-sm flex items-center gap-1 uppercase" style={{ backgroundColor: st?.cor_etiqueta_destaque || '#fbbf24' }}>
                        <Star size={12} fill="currentColor" /> Destaque
                      </div>
                   )}
                   <img key={activeImage} src={activeImage} className="w-full h-full object-cover animate-in fade-in duration-300" alt={tituloDinamico} />
                 </div>
                 {galleryImages.length > 1 && (
                   <div className="flex gap-2.5 overflow-x-auto pb-2 no-scrollbar">
                     {galleryImages.map((img, idx) => (
                       <button key={idx} onClick={() => setActiveImage(img)} className={`w-16 h-16 shrink-0 rounded-lg overflow-hidden border-2 p-0.5 transition-all ${activeImage === img ? 'border-slate-800 bg-white' : 'border-transparent opacity-70 hover:opacity-100 bg-slate-50'}`}>
                         <img src={img} className="w-full h-full object-cover rounded-md" />
                       </button>
                     ))}
                   </div>
                 )}
                 <div className="block md:hidden mt-2">{variacoesJSX}</div>
                 
                 {/* DESCRIÇÃO - DESKTOP (Lado esquerdo com sanfona) */}
                 {selectedProduct.descricao && (
                    <div className="hidden md:block mt-6 pt-6 border-t border-slate-100">
                      <h3 className="text-xs font-semibold text-slate-800 uppercase tracking-widest mb-3">Descrição do Produto</h3>
                      <div className={`text-sm text-slate-600 leading-relaxed whitespace-pre-wrap transition-all duration-300 ${!isDescExpanded ? 'line-clamp-4' : ''}`}>
                        {selectedProduct.descricao}
                      </div>
                      <button 
                        onClick={() => setIsDescExpanded(!isDescExpanded)} 
                        className="mt-2 flex items-center gap-1 text-[11px] font-semibold text-blue-600 uppercase tracking-widest hover:text-blue-700 transition-colors"
                      >
                        {isDescExpanded ? 'Menos detalhes' : 'Ler mais'} 
                        <ChevronLeft size={12} className={`transition-transform duration-300 ${isDescExpanded ? 'rotate-90' : '-rotate-90'}`} />
                      </button>
                    </div>
                 )}
              </div>

              {/* LADO DIREITO */}
              <div className="w-full md:w-[55%] flex flex-col">
                <div className="flex flex-wrap gap-2 mb-3">
                  {descontoPercent > 0 && !wholesaleApplied && !hasVariationPrice && (
                    <span className="text-white text-[10px] font-semibold px-2 py-1 rounded-full uppercase shadow-sm" style={{ backgroundColor: st?.cor_etiqueta_promo || '#f43f5e' }}>
                      -{descontoPercent}% OFF
                    </span>
                  )}
                  {selectedProduct.qtd_minima > 1 && (
                    <span className="bg-slate-800 text-white text-[10px] font-semibold px-2 py-1 rounded-full uppercase shadow-sm">
                      Pedido Mín. {selectedProduct.qtd_minima} un.
                    </span>
                  )}
                  <span className="bg-slate-100 text-slate-600 border border-slate-200 text-[10px] font-semibold px-2 py-1 rounded-full uppercase shadow-sm flex items-center gap-1">
                    <Package size={12}/> {selectedProduct.categoria}
                  </span>
                </div>
                
                <h1 className="text-2xl md:text-3xl font-semibold text-slate-900 mb-4 leading-tight transition-all">
                  {tituloDinamico}
                </h1>
                
                <div className="mb-6 pb-6 border-b border-slate-100">
                   <div className="flex items-end gap-3 mb-1">
                     <span className="text-3xl md:text-4xl font-semibold transition-colors duration-300" style={{ color: st?.cor_principal }}>R$ {unitPriceFinal.toFixed(2)}</span>
                     {selectedProduct.preco_promocional > 0 && !wholesaleApplied && !hasVariationPrice && (
                       <span className="text-sm text-slate-400 line-through font-medium mb-1.5">R$ {selectedProduct.preco.toFixed(2)}</span>
                     )}
                   </div>
                   {wholesaleApplied && (
                      <span className="font-semibold text-[10px] uppercase flex items-center gap-1 mt-1" style={{ color: st?.cor_etiqueta_atacado || '#fb923c' }}>
                        <Box size={12}/> Preço de Atacado Aplicado
                      </span>
                   )}
                </div>
                
                {/* DESCRIÇÃO - MOBILE (Abaixo do Título e Valor com Sanfona) */}
                {selectedProduct.descricao && (
                  <div className="block md:hidden mb-6 pb-6 border-b border-slate-100">
                    <h3 className="text-[11px] font-semibold text-slate-800 uppercase tracking-widest mb-2">Descrição do Produto</h3>
                    <div className={`text-xs text-slate-600 leading-relaxed whitespace-pre-wrap transition-all duration-300 ${!isDescExpanded ? 'line-clamp-4' : ''}`}>
                      {selectedProduct.descricao}
                    </div>
                    <button 
                      onClick={() => setIsDescExpanded(!isDescExpanded)} 
                      className="mt-2 flex items-center gap-1 text-[10px] font-semibold text-blue-600 uppercase tracking-widest hover:text-blue-700 transition-colors"
                    >
                      {isDescExpanded ? 'Menos detalhes' : 'Ler mais'} 
                      <ChevronLeft size={12} className={`transition-transform duration-300 ${isDescExpanded ? 'rotate-90' : '-rotate-90'}`} />
                    </button>
                  </div>
                )}
                
                <div className="hidden md:block">{variacoesJSX}</div>
                
                {atacadoData && (
                  <div className="mb-6 bg-slate-50 border border-slate-200 rounded-xl p-4 md:p-5">
                    <h3 className="text-[11px] font-semibold text-slate-600 uppercase tracking-widest mb-3 flex items-center gap-1.5"><Box size={14}/> Descontos por Quantidade</h3>
                    {atacadoData.nextRule ? (
                      <div className="mb-4 bg-white p-3 rounded-lg border border-slate-100 shadow-sm">
                         <p className="text-[11px] font-medium text-slate-600 mb-2">
                           🔥 Faltam só <span className="font-semibold text-emerald-600">{atacadoData.nextRule.min - qtdSafe} un.</span> para pagar <span className="font-semibold text-emerald-600">R$ {getWholesalePrice(atacadoData.nextRule.preco).toFixed(2)}/un</span>
                         </p>
                         <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden mb-1"><div className="bg-emerald-500 h-2 rounded-full transition-all duration-500" style={{ width: `${atacadoData.progress}%` }}></div></div>
                      </div>
                    ) : (
                      <div className="mb-4 bg-amber-50 border border-amber-200 p-3 rounded-lg flex items-center gap-2 text-amber-700">
                        <Sparkles size={16} className="text-amber-500" /><span className="text-[11px] font-semibold uppercase tracking-widest">Desconto Máximo Atingido!</span>
                      </div>
                    )}
                    <div className="flex flex-col gap-1.5">
                      {atacadoData.rules.map((r, i) => {
                         const isCurrent = atacadoData.activeRule?.min === r.min;
                         return (
                           <div key={i} className={`flex justify-between items-center text-[10px] px-3 py-2 rounded-md border ${isCurrent ? 'bg-amber-100/50 border-amber-200 text-amber-900 font-semibold shadow-sm' : 'bg-white border-slate-100 text-slate-500'}`}>
                             <span>Acima de {r.min} un.</span>
                             <span className={isCurrent ? 'font-semibold' : 'font-medium'}>R$ {getWholesalePrice(r.preco).toFixed(2)} /un</span>
                           </div>
                         )
                      })}
                    </div>
                  </div>
                )}

                {camposPersonalizadosJSX}
                
                {/* BARRA DE COMPRA DESKTOP */}
                <div className="hidden md:block mt-4">
                   <div className="flex flex-col w-full max-w-6xl mx-auto">
                     <div className={`flex flex-row items-center gap-3 md:gap-4 w-full`}>
                       <div className="flex items-center justify-between bg-slate-50 p-3 md:p-3.5 rounded-xl border border-slate-200 w-full md:w-auto shrink-0 md:pr-6">
                         <div className="flex items-center border border-slate-300 rounded-lg h-10 md:h-12 bg-white overflow-hidden shadow-sm mr-4">
                           <button onClick={decrementarQuantidade} className="w-10 md:w-12 h-full flex items-center justify-center text-slate-500 hover:bg-slate-50 transition-colors" disabled={quantidade <= minQtd}><Minus size={16} className={quantidade <= minQtd ? "opacity-30" : ""}/></button>
                           <input type="text" inputMode="numeric" pattern="[0-9]*" value={quantidade} onChange={handleQuantidadeChange} onBlur={handleQuantidadeBlur} className="w-10 md:w-12 h-full text-center font-semibold text-slate-800 text-sm border-x border-slate-200 outline-none" />
                           <button onClick={() => setQuantidade(qtdSafe + 1)} className="w-10 md:w-12 h-full flex items-center justify-center text-slate-500 hover:bg-slate-50 transition-colors"><Plus size={16}/></button>
                         </div>
                         <div className="text-right">
                           <p className="text-[9px] md:text-[10px] font-semibold uppercase text-slate-400 tracking-widest mb-0.5">Subtotal</p>
                           <p className="text-xl md:text-2xl font-semibold text-slate-900 tracking-tighter leading-none">R$ {precoTotal.toFixed(2)}</p>
                         </div>
                       </div>
                       
                       <div className="w-full md:flex-1 flex flex-col gap-1.5">
                         <Button onClick={adicionarAoCarrinho} className="w-full h-12 md:h-14 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold uppercase text-[11px] md:text-xs gap-2 shadow-md transition-all border-none active:scale-[0.98]">
                           <ShoppingCart size={20} fill="currentColor" /> Adicionar ao Carrinho
                         </Button>
                         <p className="text-[9px] text-center text-slate-400 font-semibold uppercase tracking-widest">*(Caso queira escolher mais itens para o pedido)*</p>
                       </div>
                     </div>
                   </div>
                </div>

              </div>
            </div>
            
            {relacionados.length > 0 && (
              <div className="mt-16 md:mt-24 mb-10">
                <h3 className="text-xl md:text-2xl font-semibold text-slate-900 mb-6 flex items-center gap-2">Veja também</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 md:gap-6">
                  {relacionados.map(prod => (
                    <div key={prod.id} onClick={() => abrirDetalhe(prod)} className="group cursor-pointer flex flex-col h-full bg-white rounded-xl md:rounded-2xl border border-slate-200 overflow-hidden hover:shadow-md hover:border-slate-300 transition-all duration-300">
                      <CardSlider prod={prod} aspectClass={aspectClass} st={st} isDestaqueCarrossel={true} />
                      <div className="flex flex-col flex-1 p-3 md:p-4">
                        <h3 className="text-xs font-semibold text-slate-800 line-clamp-2 leading-tight mb-2 min-h-[32px] md:min-h-[36px]">{prod.nome}</h3>
                        <div className="mt-auto pt-3 flex flex-col gap-3">
                           <div className="flex flex-col">
                             <span className="text-sm font-semibold text-slate-900 leading-none">R$ {Number(prod.preco_promocional > 0 ? prod.preco_promocional : prod.preco).toFixed(2)}</span>
                           </div>
                           <button className="w-full py-2 rounded-lg text-white text-[10px] font-semibold uppercase transition-colors duration-300" style={{ backgroundColor: st?.cor_principal }}>Ver Detalhes</button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          
          <FooterSite st={st} />

          {/* BARRA FIXA MOBILE */}
          <div className={`block md:hidden fixed inset-x-0 ${isPublic ? 'bottom-0' : 'bottom-[64px]'} bg-white p-4 pb-5 border-t border-slate-200 shadow-[0_-20px_25px_-5px_rgba(0,0,0,0.1)] z-[100]`}>
             <div className="flex flex-col w-full max-w-6xl mx-auto">
               {atacadoData && atacadoData.nextRule && (
                 <div className="flex flex-col gap-1.5 mb-3 px-1">
                    <p className="text-[9px] font-semibold text-emerald-600 uppercase tracking-widest text-center">
                      🔥 Faltam só {atacadoData.nextRule.min - qtdSafe} un. para pagar R$ {getWholesalePrice(atacadoData.nextRule.preco).toFixed(2)}/un
                    </p>
                    <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                       <div className="bg-emerald-500 h-1.5 rounded-full transition-all duration-500" style={{ width: `${atacadoData.progress}%` }}></div>
                    </div>
                 </div>
               )}

               <div className={`flex flex-col gap-3 w-full`}>
                 <div className="flex items-center justify-between bg-slate-50 p-3 rounded-xl border border-slate-200 w-full shrink-0">
                   <div className="flex items-center border border-slate-300 rounded-lg h-10 bg-white overflow-hidden shadow-sm mr-4">
                     <button onClick={decrementarQuantidade} className="w-10 h-full flex items-center justify-center text-slate-500 hover:bg-slate-50 transition-colors" disabled={quantidade <= minQtd}><Minus size={16} className={quantidade <= minQtd ? "opacity-30" : ""}/></button>
                     <input type="text" inputMode="numeric" pattern="[0-9]*" value={quantidade} onChange={handleQuantidadeChange} onBlur={handleQuantidadeBlur} className="w-10 h-full text-center font-semibold text-slate-800 text-sm border-x border-slate-200 outline-none" />
                     <button onClick={() => setQuantidade(qtdSafe + 1)} className="w-10 h-full flex items-center justify-center text-slate-500 hover:bg-slate-50 transition-colors"><Plus size={16}/></button>
                   </div>
                   <div className="text-right">
                     <p className="text-[9px] font-semibold uppercase text-slate-400 tracking-widest mb-0.5">Subtotal</p>
                     <p className="text-xl font-semibold text-slate-900 tracking-tighter leading-none">R$ {precoTotal.toFixed(2)}</p>
                   </div>
                 </div>
                 
                 <div className="w-full flex flex-col gap-1.5">
                   <Button onClick={adicionarAoCarrinho} className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold uppercase text-[11px] gap-2 shadow-md transition-all border-none active:scale-[0.98]">
                     <ShoppingCart size={20} fill="currentColor" /> Adicionar ao Carrinho
                   </Button>
                 </div>
               </div>
             </div>
          </div>

          {/* GAVETA DO CARRINHO */}
          <AnimatePresence>
            {isCartOpen && (
              <>
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsCartOpen(false)} className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[200]"/>
                <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: "spring", bounce: 0, duration: 0.4 }} className="fixed top-0 right-0 h-full w-full max-w-md bg-slate-50 shadow-2xl z-[210] flex flex-col border-l border-slate-200">
                  <div className="p-5 bg-white border-b border-slate-200 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center"><ShoppingCart size={20}/></div>
                      <div>
                        <h2 className="text-lg font-semibold text-slate-800 uppercase tracking-tight leading-none">Seu Carrinho</h2>
                        <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest mt-1">{carrinho.length} item(s) adicionado(s)</p>
                      </div>
                    </div>
                    <button onClick={() => setIsCartOpen(false)} className="p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 rounded-lg transition-colors"><X size={20} /></button>
                  </div>

                  <div className="flex-1 overflow-y-auto p-5 space-y-4">
                    {carrinho.length === 0 ? (
                       <div className="h-full flex flex-col items-center justify-center text-slate-300 opacity-70">
                          <ShoppingBag size={48} className="mb-4 text-slate-200"/>
                          <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">Seu carrinho está vazio</p>
                          <Button onClick={() => setIsCartOpen(false)} variant="outline" className="mt-4 border-slate-300 text-slate-500 font-semibold uppercase text-[10px]">Continuar Comprando</Button>
                       </div>
                    ) : (
                       carrinho.map((item) => (
                         <div key={item.id_carrinho} className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm flex gap-3 relative">
                            <button onClick={() => setCarrinho(prev => prev.filter(c => c.id_carrinho !== item.id_carrinho))} className="absolute -top-2 -right-2 bg-red-500 text-white p-1.5 rounded-lg shadow-sm hover:bg-red-600"><Trash2 size={12}/></button>
                            <div className="w-20 h-20 rounded-lg overflow-hidden bg-slate-50 border border-slate-100 shrink-0">
                               <img src={item.activeImage || item.produto.imagem_url} className="w-full h-full object-cover" />
                            </div>
                            <div className="flex flex-col justify-center flex-1">
                               <h4 className="text-xs font-semibold text-slate-800 line-clamp-2 leading-tight">{item.tituloDinamico || item.produto.nome}</h4>
                               <p className="text-[10px] text-slate-500 mt-1 font-medium">Qtd: {item.quantidade} un.</p>
                               <p className="text-sm font-semibold text-slate-900 mt-1">R$ {item.precoTotal.toFixed(2)}</p>
                            </div>
                         </div>
                       ))
                    )}
                  </div>

                  {carrinho.length > 0 && (
                    <div className="p-5 bg-white border-t border-slate-200 shadow-[0_-10px_20px_rgba(0,0,0,0.03)]">
                      <div className="flex justify-between items-end mb-4">
                         <span className="text-xs font-semibold text-slate-500 uppercase tracking-widest">Total do Pedido:</span>
                         <span className="text-2xl font-semibold text-slate-900">R$ {carrinho.reduce((acc, curr) => acc + curr.precoTotal, 0).toFixed(2)}</span>
                      </div>
                      <Button onClick={finalizarPedido} className="w-full h-14 bg-[#25D366] hover:bg-[#20bd5a] text-white rounded-xl font-semibold uppercase text-[11px] gap-2 shadow-md transition-all border-none">
                        <MessageCircle size={20} fill="currentColor" /> Finalizar Pedido
                      </Button>
                      <button onClick={() => setIsCartOpen(false)} className="w-full mt-3 text-[10px] font-semibold text-slate-400 uppercase tracking-widest hover:text-slate-600">
                        Continuar Comprando
                      </button>
                    </div>
                  )}
                </motion.div>
              </>
            )}
          </AnimatePresence>

          {/* BOTÃO FLUTUANTE DO CARRINHO */}
          {carrinho.length > 0 && !isCartOpen && (
            <button 
              onClick={() => setIsCartOpen(true)}
              className={`fixed right-4 md:right-10 z-[100] w-14 h-14 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-xl shadow-blue-600/30 flex items-center justify-center transition-transform hover:scale-105 active:scale-95 animate-in zoom-in-95 md:bottom-10 ${floatingCartBottom}`}
            >
              <ShoppingCart size={24} />
              <span className="absolute -top-1 -right-1 w-6 h-6 bg-rose-500 text-white text-[11px] font-semibold rounded-full flex items-center justify-center shadow-sm">
                {carrinho.length}
              </span>
            </button>
          )}

        </div>
      );
    }

    return (
      <div className="min-h-screen bg-[#f8fafc] flex flex-col relative">
        <HeaderSite st={st} searchTerm={searchTerm} setSearchTerm={setSearchTerm} selectedCategory={selectedCategory} changeCategory={changeCategory} categorias={displayCategories} isPublic={isPublic} goHome={goHome} view={view} />
        
        <BenefitsBar st={st} />
        <main className="max-w-7xl mx-auto px-4 md:px-8 py-8 md:py-12 flex-1 w-full space-y-10 md:space-y-14">
          
          {filtered.length === 0 ? (
             <div className="text-center py-20 bg-white rounded-2xl border border-slate-200 shadow-sm">
               <ShoppingBag size={40} className="mx-auto text-slate-200 mb-4" />
               <p className="text-slate-500 font-semibold uppercase text-xs tracking-widest">Nenhum produto encontrado.</p>
             </div>
          ) : (
            <div className="space-y-12">
              
              {/* --- 1. SESSÃO DE DESTAQUES (Carrossel Horizontal) --- */}
              {selectedCategory === 'Todas' && !searchTerm && filtered.filter(p => p.destaque).length > 0 && (
                <div className="w-full">
                  <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
                    <h2 className="text-xl font-semibold text-slate-900 flex items-center gap-2">
                      <span className="text-xl">🔥</span> Destaques
                    </h2>
                    <div className="hidden md:flex items-center gap-2">
                      <button onClick={() => { document.getElementById('carrossel-destaques').scrollBy({ left: -300, behavior: 'smooth' }) }} className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors border border-slate-200 shadow-sm">
                        <ChevronLeft size={18} />
                      </button>
                      <button onClick={() => { document.getElementById('carrossel-destaques').scrollBy({ left: 300, behavior: 'smooth' }) }} className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors border border-slate-200 shadow-sm">
                        <ChevronLeft size={18} className="rotate-180" />
                      </button>
                    </div>
                  </div>
                  
                  <div id="carrossel-destaques" className="flex overflow-x-auto gap-4 md:gap-5 pb-6 no-scrollbar snap-x items-stretch">
                    {filtered.filter(p => p.destaque).map(prod => {
                      const descontoPercent = calcularDesconto(prod.preco, prod.preco_promocional);
                      return (
                        <div key={prod.id} className="w-[160px] md:w-[220px] shrink-0 snap-start group bg-white rounded-xl md:rounded-2xl border border-slate-200 overflow-hidden hover:shadow-lg hover:border-slate-300 transition-all duration-300 flex flex-col h-full cursor-pointer" onClick={() => abrirDetalhe(prod)}>
                          
                          <CardSlider prod={prod} aspectClass={aspectClass} st={st} isDestaqueCarrossel={true} />
                          
                          <div className="flex flex-col flex-1 p-3">
                            <div className="flex flex-wrap items-center gap-1 mb-2">
                              {descontoPercent > 0 && <span className="text-white text-[8px] font-semibold px-1 py-0.5 rounded-full uppercase" style={{ backgroundColor: st?.cor_etiqueta_promo || '#f43f5e' }}>-{descontoPercent}%</span>}
                              {prod.atacado?.ativa && <span className="text-white text-[8px] font-semibold px-1 py-0.5 rounded-full uppercase" style={{ backgroundColor: st?.cor_etiqueta_atacado || '#fb923c' }}>Atacado</span>}
                            </div>
                            <h3 className="text-xs font-semibold text-slate-700 line-clamp-2 leading-tight min-h-[32px] md:min-h-[36px]">{prod.nome}</h3>
                            
                            <div className="mt-auto pt-3 flex flex-col gap-3 justify-end">
                              <div className="flex flex-col">
                                {prod.preco_promocional > 0 ? (
                                  <><span className="text-[9px] text-slate-400 line-through font-semibold leading-none">R$ {Number(prod.preco).toFixed(2)}</span><span className="text-sm font-semibold text-slate-900 leading-none mt-1">R$ {Number(prod.preco_promocional).toFixed(2)}</span></>
                                ) : (
                                  <span className="text-sm font-semibold text-slate-900 leading-none">R$ {Number(prod.preco).toFixed(2)}</span>
                                )}
                              </div>
                              <button className="w-full h-8 rounded-lg text-white text-[10px] font-semibold uppercase transition-colors duration-300 shadow-sm flex items-center justify-center hover:opacity-90" style={{ backgroundColor: st?.cor_principal || '#f472b6' }}>
                                Ver Detalhes
                              </button>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* --- 2. SESSÃO PRINCIPAL DA GRADE (Todos ou Categoria) --- */}
              <div className="w-full">
                <h2 className="text-xl font-semibold text-slate-900 border-b border-slate-100 pb-3 mb-6">
                  {selectedCategory === 'Todas' ? 'Todos os Produtos' : selectedCategory}
                </h2>
                
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-5">
                  {filtered
                    .filter(prod => {
                      if (selectedCategory === 'Todas' && !searchTerm) {
                        return !prod.destaque;
                      }
                      return true;
                    })
                    .map(prod => {
                      const descontoPercent = calcularDesconto(prod.preco, prod.preco_promocional);
                      return (
                        <div key={prod.id} className="group bg-white rounded-xl md:rounded-2xl border border-slate-200 overflow-hidden hover:shadow-lg hover:border-slate-300 transition-all duration-300 flex flex-col h-full cursor-pointer animate-in fade-in" onClick={() => abrirDetalhe(prod)}>
                          
                          <CardSlider prod={prod} aspectClass={aspectClass} st={st} isDestaqueCarrossel={false} />

                          <div className="flex flex-col flex-1 p-3 md:p-4">
                            <div className="flex flex-wrap items-center gap-1.5 mb-2">
                              {descontoPercent > 0 && <span className="text-white text-[9px] font-semibold px-1.5 py-0.5 rounded-full uppercase shadow-sm" style={{ backgroundColor: st?.cor_etiqueta_promo || '#f43f5e' }}>-{descontoPercent}% OFF</span>}
                              {prod.atacado?.ativa && <span className="text-white text-[9px] font-semibold px-1.5 py-0.5 rounded-full uppercase shadow-sm flex items-center gap-0.5" style={{ backgroundColor: st?.cor_etiqueta_atacado || '#fb923c' }}><Box size={10} /> Atacado</span>}
                              {prod.variacoes?.ativa && <span className="text-white text-[9px] font-semibold px-1.5 py-0.5 rounded-full uppercase shadow-sm flex items-center gap-0.5" style={{ backgroundColor: st?.cor_etiqueta_variacao || '#60a5fa' }}><Layers size={10} /> Var.</span>}
                            </div>
                            
                            <h3 className="text-xs md:text-sm font-semibold text-slate-700 line-clamp-2 leading-tight min-h-[32px] md:min-h-[40px]">{prod.nome}</h3>
                            
                            <div className="mt-auto pt-4 flex flex-col gap-3 justify-end">
                              <div className="flex flex-col">
                                {prod.preco_promocional > 0 ? (
                                  <><span className="text-[10px] text-slate-400 line-through font-semibold leading-none">R$ {Number(prod.preco).toFixed(2)}</span><span className="text-base md:text-lg font-semibold text-slate-900 leading-none mt-1">R$ {Number(prod.preco_promocional).toFixed(2)}</span></>
                                ) : (
                                  <span className="text-base md:text-lg font-semibold text-slate-900 leading-none">R$ {Number(prod.preco).toFixed(2)}</span>
                                )}
                              </div>
                              <button className="w-full h-9 md:h-10 rounded-lg text-white text-[11px] font-semibold uppercase transition-colors duration-300 shadow-sm flex items-center justify-center gap-1.5 hover:opacity-90" style={{ backgroundColor: st?.cor_principal || '#f472b6' }}>
                                Ver Detalhes
                              </button>
                            </div>
                          </div>
                        </div>
                      )
                  })}
                </div>
              </div>

            </div>
          )}
        </main>
        <FooterSite st={st} />
      </div>
    );
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-slate-50"><Loader2 className="animate-spin text-slate-300" size={48} /></div>;

  if (isPublic) return renderCatalog();

  return (
    <div className="fixed inset-0 z-[120] flex bg-slate-100 overflow-hidden animate-in fade-in zoom-in-95 duration-300">
      
      {/* CONTAINER HÍBRIDO DO EDITOR */}
      <div className="absolute lg:relative inset-y-0 left-0 w-full lg:w-[320px] flex flex-col bg-transparent lg:bg-slate-900 lg:border-r lg:border-slate-800 lg:shadow-2xl z-[140] lg:z-20 pointer-events-none lg:pointer-events-auto">
        
        <div className="hidden lg:flex p-4 border-b border-slate-800 items-center justify-between bg-slate-950">
          <button onClick={() => navigate('/app')} className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-widest text-slate-400 hover:text-white transition-colors">
            <ArrowLeft size={14} /> Sair
          </button>
          <Button onClick={handleSave} className="h-8 px-4 bg-emerald-500 hover:bg-emerald-600 text-white rounded text-[10px] font-semibold uppercase tracking-widest transition-all">
            {saved ? <Check size={14} /> : "Salvar"}
          </Button>
        </div>

        <div className="flex-1 lg:overflow-y-auto no-scrollbar lg:pb-10 pointer-events-none lg:pointer-events-auto">
           <EditorSection id="identidade" title="Visual & Logo" icon={Palette} openSection={openSection} setOpenSection={setOpenSection}>
              <EditorForms section="identidade" st={st} setSt={setSt} handleImageUpload={handleImageUpload} removeImageAndStorage={removeImageAndStorage} displayCategories={displayCategories} />
           </EditorSection>
           <EditorSection id="layout" title="Estrutura" icon={LayoutTemplate} openSection={openSection} setOpenSection={setOpenSection}>
              <EditorForms section="layout" st={st} setSt={setSt} handleImageUpload={handleImageUpload} removeImageAndStorage={removeImageAndStorage} displayCategories={displayCategories} />
           </EditorSection>
           <EditorSection id="etiquetas" title="Etiquetas" icon={Tags} openSection={openSection} setOpenSection={setOpenSection}>
              <EditorForms section="etiquetas" st={st} setSt={setSt} />
           </EditorSection>
           <EditorSection id="banners" title="Banner Principal" icon={ImageIcon} openSection={openSection} setOpenSection={setOpenSection}>
              <EditorForms section="banner" st={st} setSt={setSt} handleImageUpload={handleImageUpload} removeImageAndStorage={removeImageAndStorage} />
           </EditorSection>
           <EditorSection id="rodape" title="Rodapé" icon={Globe} openSection={openSection} setOpenSection={setOpenSection}>
              <EditorForms section="rodape" st={st} setSt={setSt} />
           </EditorSection>
        </div>

        <div className="hidden lg:block p-4 border-t border-slate-800 bg-slate-950">
           <Button onClick={copyVitrineLink} variant="outline" className="w-full h-8 bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700 font-semibold uppercase text-[9px] tracking-widest gap-2">
             <Copy size={12} /> Copiar Link da Loja
           </Button>
        </div>
      </div>

      <div className="flex-1 h-full overflow-y-auto relative bg-[#f8fafc] pb-[70px] lg:pb-0 z-10">
        <button onClick={() => navigate('/app')} className="lg:hidden fixed top-4 left-4 z-[150] w-10 h-10 bg-slate-900/90 backdrop-blur text-white rounded-full flex items-center justify-center shadow-lg border border-slate-700"><ArrowLeft size={18} /></button>
        {openSection && <div onClick={() => setOpenSection('')} className="lg:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-[130] transition-opacity" />}

        {renderCatalog()}

        <div className="lg:hidden fixed bottom-0 inset-x-0 h-[64px] bg-slate-950 border-t border-slate-800 flex items-center justify-around z-[150] px-1 pointer-events-auto">
          {[
            { id: 'identidade', icon: Palette, label: 'Visual' },
            { id: 'layout', icon: LayoutTemplate, label: 'Estrutura' },
            { id: 'banners', icon: ImageIcon, label: 'Banners' },
            { id: 'rodape', icon: Globe, label: 'Rodapé' }
          ].map(tab => (
            <button key={tab.id} onClick={() => setOpenSection(openSection === tab.id ? '' : tab.id)} className={`flex flex-col items-center justify-center w-16 h-full gap-1.5 transition-colors ${openSection === tab.id ? 'text-blue-400' : 'text-slate-500 hover:text-slate-300'}`}>
               <tab.icon size={20} className={openSection === tab.id ? 'animate-pulse' : ''} />
               <span className="text-[8px] font-semibold uppercase tracking-wider">{tab.label}</span>
            </button>
          ))}
          <div className="w-[1px] h-8 bg-slate-800 mx-1"></div>
          <button onClick={handleSave} className="flex flex-col items-center justify-center w-16 h-full gap-1.5 text-emerald-500 hover:text-emerald-400 transition-colors">
             {saved ? <Check size={20} /> : <Save size={20} />}
             <span className="text-[8px] font-semibold uppercase tracking-wider">Salvar</span>
          </button>
        </div>
      </div>

      {isUploadingGlobal && (
        <div className="fixed inset-0 z-[999] bg-slate-900/60 backdrop-blur-sm flex flex-col items-center justify-center pointer-events-auto">
          <Loader2 className="animate-spin text-white w-12 h-12 mb-4" />
          <p className="text-white font-semibold uppercase tracking-widest text-xs animate-pulse">Processando...</p>
        </div>
      )}
    </div>
  );
}