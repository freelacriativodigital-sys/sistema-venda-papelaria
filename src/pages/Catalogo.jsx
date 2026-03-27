import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { 
  ShoppingBag, Search, ChevronLeft, MessageCircle, 
  Plus, Minus, Instagram, Mail, 
  Loader2, Sparkles, Layers, Box, Package,
  Truck, ShieldCheck, CreditCard, Star,
  Save, Palette, Globe, Image as ImageIcon, 
  Upload, Check, Trash2, Copy, Link as LinkIcon, MapPin, Tags, X, ChevronDown, ChevronUp, ArrowLeft, LayoutTemplate
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "../lib/supabase";

// --- COMPRESSOR DE IMAGENS (1200px para Banners Full-Width / 80% WebP) ---
const compressImageToBlob = (file) => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new window.Image(); 
      img.src = event.target.result;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 1200; 
        const MAX_HEIGHT = 1200;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) { height *= MAX_WIDTH / width; width = MAX_WIDTH; }
        } else {
          if (height > MAX_HEIGHT) { width *= MAX_HEIGHT / height; height = MAX_HEIGHT; }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        
        canvas.toBlob((blob) => resolve(blob), 'image/webp', 0.8);
      };
    };
  });
};

// --- COMPONENTE INTELIGENTE: SANFONA NO DESKTOP / BOTTOM SHEET NO MOBILE ---
const EditorSection = ({ id, title, icon: Icon, openSection, setOpenSection, children }) => {
  const isOpen = openSection === id;
  return (
    <div className="lg:border-b lg:border-slate-700/50 pointer-events-auto">
      {/* BOTÃO DESKTOP (SANFONA) */}
      <button onClick={() => setOpenSection(isOpen ? '' : id)} className="hidden lg:flex w-full items-center justify-between p-3.5 hover:bg-slate-800 transition-colors">
        <div className="flex items-center gap-2.5 text-[10px] font-bold text-slate-300 uppercase tracking-widest">
          <Icon size={14} className="text-slate-400" /> {title}
        </div>
        <ChevronDown size={14} className={`text-slate-400 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      
      {/* CONTEÚDO (Muda fisicamente de acordo com a tela) */}
      <div className={`
        transition-all duration-300 ease-in-out
        ${isOpen ? 'fixed inset-x-0 bottom-[64px] top-auto max-h-[80vh] bg-slate-900 z-[160] overflow-y-auto p-5 rounded-t-2xl shadow-[0_-20px_50px_rgba(0,0,0,0.7)] border-t border-slate-700 flex flex-col opacity-100' : 'fixed inset-x-0 bottom-[64px] max-h-0 opacity-0 overflow-hidden pointer-events-none'}
        lg:static lg:inset-auto lg:bottom-auto lg:rounded-none lg:shadow-none lg:border-none lg:bg-transparent lg:z-auto lg:pointer-events-auto
        lg:block ${isOpen ? 'lg:max-h-[1500px] lg:opacity-100 lg:p-4' : 'lg:max-h-0 lg:opacity-0 lg:overflow-hidden lg:p-0 lg:m-0'}
      `}>
        <div className="flex lg:hidden items-center justify-between mb-5 border-b border-slate-800 pb-3 shrink-0">
           <div className="flex items-center gap-2 text-[11px] font-bold text-white uppercase tracking-widest">
             <Icon size={16} className="text-blue-400" /> {title}
           </div>
           <button onClick={() => setOpenSection('')} className="bg-slate-800 p-1.5 rounded-full text-slate-400 hover:text-white"><X size={14}/></button>
        </div>
        <div className="space-y-4 pb-6 lg:pb-0">
          {children}
        </div>
      </div>
    </div>
  );
};

// --- HEADER DA VITRINE (LOGO LIMPA SEM BORDA) ---
const HeaderSite = ({ st, searchTerm, setSearchTerm, selectedCategory, changeCategory, categorias, isPublic, goHome, view }) => (
  <div className="w-full bg-white relative md:sticky top-0 z-40 shadow-sm border-b border-slate-100">
    <div className="h-1.5 w-full transition-colors duration-300" style={{ backgroundColor: st?.cor_principal || '#f472b6' }} />
    <div className="max-w-7xl mx-auto px-4 md:px-8 py-4 md:py-6 flex flex-col md:flex-row items-center gap-4 md:gap-12">
      <div onClick={goHome} className="flex items-center shrink-0 cursor-pointer group w-full md:w-auto justify-center md:justify-start">
        <div className="h-14 md:h-16 flex items-center justify-center transition-transform group-hover:scale-105">
          {st?.logo_url ? <img src={st.logo_url} className="h-full w-auto object-contain" alt="Logo" /> : <ShoppingBag size={32} style={{ color: st?.cor_principal }} />}
        </div>
      </div>
      <div className="flex-1 w-full max-w-4xl relative group">
        <input 
          type="text" 
          placeholder="O que você procura hoje?" 
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full h-11 md:h-14 bg-slate-50/50 hover:bg-slate-50 rounded-full px-6 pl-14 border border-slate-200 focus:bg-white focus:border-slate-300 focus:ring-4 focus:ring-slate-100/50 transition-all outline-none font-normal text-sm md:text-base text-slate-700 placeholder:text-slate-400 shadow-sm focus:shadow-md"
        />
        <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-slate-500 transition-colors" size={20} />
      </div>
    </div>
    {view !== 'detalhe' && (
      <div className="border-t border-slate-100 bg-slate-50/50">
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-3 md:py-4 flex items-center gap-2.5 overflow-x-auto no-scrollbar">
          <button 
            onClick={() => changeCategory('Todas')}
            className={`text-[11px] md:text-xs font-bold whitespace-nowrap transition-all px-4 md:px-5 py-2 md:py-2.5 rounded-full border flex items-center gap-2 ${selectedCategory === 'Todas' ? 'shadow-sm text-white' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-slate-300'}`}
            style={selectedCategory === 'Todas' ? { backgroundColor: st?.cor_principal, borderColor: st?.cor_principal } : {}}
          >
            <Layers size={14} className={selectedCategory === 'Todas' ? "text-white/80" : "text-slate-400"} />
            Todas as Categorias
          </button>
          {categorias?.filter(c => c !== 'Sem Categoria').map(cat => {
            const isSelected = selectedCategory.toLowerCase().trim() === cat.toLowerCase().trim();
            return (
              <button 
                key={cat}
                onClick={() => changeCategory(cat)}
                className={`text-[11px] md:text-xs font-bold whitespace-nowrap transition-all px-4 md:px-5 py-2 md:py-2.5 rounded-full border ${isSelected ? 'shadow-sm text-white' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-slate-300'}`}
                style={isSelected ? { backgroundColor: st?.cor_principal, borderColor: st?.cor_principal } : {}}
              >
                {cat}
              </button>
            )
          })}
        </div>
      </div>
    )}
  </div>
);

// --- FAIXA DE BENEFÍCIOS ---
const BenefitsBar = ({ st }) => {
  if (!st?.mostrar_beneficios) return null;
  return (
    <div className="bg-white border-b border-slate-100 hidden md:block transition-all duration-300">
      <div className="max-w-7xl mx-auto px-8 py-4 flex items-center justify-between gap-4">
        {[1, 2, 3].map(num => (
           <div key={num} className="flex items-center gap-3 text-slate-600">
              <div className="bg-slate-50 p-2 rounded-full border border-slate-100">
                {st[`beneficio_${num}_icone`] ? (
                   <img src={st[`beneficio_${num}_icone`]} className="w-5 h-5 object-contain" alt="" />
                ) : (
                   num === 1 ? <Truck size={18} className="text-rose-500" /> : 
                   num === 2 ? <CreditCard size={18} className="text-blue-500" /> : 
                   <ShieldCheck size={18} className="text-emerald-500" />
                )}
              </div>
              <div>
                <p className="text-[11px] font-bold text-slate-800 leading-none mb-1">{st[`beneficio_${num}_titulo`]}</p>
                <p className="text-[9px] font-medium text-slate-500">{st[`beneficio_${num}_desc`]}</p>
              </div>
           </div>
        ))}
      </div>
    </div>
  );
};

// --- RODAPÉ ---
const FooterSite = ({ st }) => (
  <footer className="bg-slate-950 text-slate-400 pt-12 pb-32 md:pb-8 border-t-[6px] mt-16 transition-colors duration-300" style={{ borderColor: st?.cor_principal || '#f472b6' }}>
    <div className="max-w-7xl mx-auto px-4 md:px-8">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-10 mb-12">
        <div className="space-y-3 text-center md:text-left">
          <h2 className="text-xl font-black uppercase tracking-tighter text-white italic transition-colors duration-300" style={{ color: st?.cor_principal }}>{st?.nome_loja}</h2>
          <p className="text-[11px] font-medium leading-relaxed max-w-sm mx-auto md:mx-0 text-slate-500">{st?.texto_sobre}</p>
        </div>
        <div className="space-y-4 text-center md:text-left flex flex-col items-center md:items-start">
          <h3 className="text-white font-bold uppercase tracking-widest text-[10px]">Canais de Atendimento</h3>
          <div className="flex flex-col gap-3">
            {st?.whatsapp && (
              <button onClick={() => window.open(`https://wa.me/${st.whatsapp.replace(/\D/g, '')}`, '_blank')} className="flex items-center gap-2 hover:text-white transition-colors text-[11px] font-bold uppercase tracking-wide">
                <MessageCircle size={16} className="text-[#25D366]" fill="currentColor" /> WhatsApp Oficial
              </button>
            )}
            {st?.instagram && (
              <button onClick={() => window.open(st.instagram.includes('http') ? st.instagram : `https://instagram.com/${st.instagram}`, '_blank')} className="flex items-center gap-2 hover:text-white transition-colors text-[11px] font-bold uppercase tracking-wide">
                <Instagram size={16} className="text-pink-500" /> Instagram
              </button>
            )}
            {st?.email && (
              <button onClick={() => window.open(`mailto:${st.email}`, '_blank')} className="flex items-center gap-2 hover:text-white transition-colors text-[11px] font-bold uppercase tracking-wide">
                <Mail size={16} className="text-blue-400" /> E-mail
              </button>
            )}
            {st?.endereco && (
              <p className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wide text-slate-500 mt-2">
                <MapPin size={16} /> {st.endereco}
              </p>
            )}
          </div>
        </div>
        <div className="space-y-3 text-center md:text-left">
          <h3 className="text-white font-bold uppercase tracking-widest text-[10px] mb-1">Compra 100% Segura</h3>
          <p className="text-[11px] font-medium leading-relaxed text-slate-500">
            Seu pedido é fechado diretamente via WhatsApp com nosso time. Atendimento humano, rápido e sem complicações.
          </p>
        </div>
      </div>
      <div className="pt-6 border-t border-white/10 flex flex-col md:flex-row justify-between items-center gap-4">
        <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-slate-600 text-center md:text-left">{st?.copyright}</p>
      </div>
    </div>
  </footer>
);

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

  const [activeImage, setActiveImage] = useState('');
  const [galleryImages, setGalleryImages] = useState([]);
  
  const [st, setSt] = useState(null);
  const [produtos, setProdutos] = useState([]);
  const [categoriasRaw, setCategoriasRaw] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState(false);
  const [isUploadingGlobal, setIsUploadingGlobal] = useState(false);

  const [openSection, setOpenSection] = useState('');
  
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
  };

  const voltarParaGrid = () => {
    const params = new URLSearchParams(searchParams);
    params.delete('produto');
    setSearchParams(params);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const setupDetalheProduto = (prod) => {
    const iniciais = {};
    if (prod.variacoes?.ativa && prod.variacoes.atributos) {
      prod.variacoes.atributos.forEach(atrib => {
        if (atrib.opcoes?.length > 0) iniciais[atrib.nome] = atrib.opcoes[0];
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
    setActiveImage(finalGallery[0] || `https://placehold.co/600x600?text=${encodeURIComponent(prod.nome)}`);
    setSelecoes(iniciais);
    setRespostasPersonalizadas({}); 
    setQuantidade(prod.qtd_minima || 1);
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

  const moveCategory = (index, direction) => {
    const reorderable = displayCategories;
    let currentOrder = [...reorderable];
    if (direction === 'up' && index > 0) {
      [currentOrder[index - 1], currentOrder[index]] = [currentOrder[index], currentOrder[index - 1]];
    } else if (direction === 'down' && index < currentOrder.length - 1) {
      [currentOrder[index + 1], currentOrder[index]] = [currentOrder[index], currentOrder[index + 1]];
    }
    setSt({...st, ordem_categorias: currentOrder});
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

      const enviarZap = () => {
        if (selectedProduct.campos_personalizados?.length > 0) {
          const camposFaltando = selectedProduct.campos_personalizados.filter(
            campo => campo.obrigatorio && (!respostasPersonalizadas[campo.id] || respostasPersonalizadas[campo.id].trim() === '')
          );
          if (camposFaltando.length > 0) {
            alert(`Por favor, preencha o campo obrigatório: ${camposFaltando[0].titulo}`);
            return;
          }
        }

        const num = st?.whatsapp?.replace(/\D/g, '');
        const textoVars = Object.entries(selecoes).map(([k, v]) => `▪️ *${k}:* ${v.nome}`).join('\n');
        
        let textoPersonalizado = '';
        if (selectedProduct.campos_personalizados?.length > 0) {
          textoPersonalizado = '\n\n*📝 Personalização:*\n' + selectedProduct.campos_personalizados.map(campo => {
            return `▪️ *${campo.titulo}:* ${respostasPersonalizadas[campo.id] || 'Não preenchido'}`;
          }).join('\n');
        }

        const msg = `Olá! Gostaria de encomendar este produto:\n\n🛍️ *${selectedProduct.nome}*\n${textoVars}${textoPersonalizado}\n\n*Quantidade:* ${qtdSafe} un.\n*Valor Unitário:* R$ ${unitPriceFinal.toFixed(2)} ${wholesaleApplied ? '(Atacado)' : ''}\n*Total:* R$ ${precoTotal.toFixed(2)}`;
        window.open(`https://wa.me/${num}?text=${encodeURIComponent(msg)}`, '_blank');
      };

      const variacoesJSX = selectedProduct.variacoes?.ativa && selectedProduct.variacoes?.atributos ? (
        <div className="space-y-4 md:space-y-5 mb-4 md:mb-6 md:border-b border-slate-100 md:pb-6">
          {selectedProduct.variacoes.atributos.map(atrib => (
            <div key={atrib.id}>
              <h3 className="text-[11px] md:text-xs font-bold text-slate-700 mb-2">{atrib.nome}:</h3>
              <div className="flex flex-wrap gap-2 md:gap-2.5">
                {atrib.opcoes.map(opcao => {
                  const isSelected = selecoes[atrib.nome]?.id === opcao.id;
                  return (
                    <button
                      key={opcao.id}
                      onClick={() => selecionarOpcao(atrib.nome, opcao)}
                      className={`px-3 py-1.5 md:px-4 md:py-2 rounded-lg text-[10px] md:text-xs font-bold transition-all border flex items-center gap-2.5 ${isSelected ? 'border-slate-800 bg-slate-900 text-white' : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50'}`}
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

      return (
        <div className="min-h-screen bg-white flex flex-col">
          <HeaderSite st={st} searchTerm={searchTerm} setSearchTerm={setSearchTerm} selectedCategory={selectedCategory} changeCategory={changeCategory} categorias={displayCategories} isPublic={isPublic} goHome={goHome} view={view} />
          <BenefitsBar st={st} />
          <div className="max-w-6xl mx-auto px-4 md:px-8 pt-6 md:pt-10 flex-1 w-full animate-in fade-in duration-500 pb-40 md:pb-10">
            <button onClick={voltarParaGrid} className="flex items-center gap-1.5 text-slate-500 font-bold text-xs hover:text-slate-900 transition-all mb-6">
              <ChevronLeft size={16} /> Voltar para loja
            </button>
            <div className="flex flex-col md:flex-row gap-8 lg:gap-12" ref={imageRef}>
              {/* ESQUERDA */}
              <div className="w-full md:w-[45%] flex flex-col gap-4">
                 <div className={`${aspectClass} rounded-2xl overflow-hidden bg-slate-50 border border-slate-100 shadow-sm relative group`}>
                   {selectedProduct.destaque && (
                      <div className="absolute top-4 left-4 z-10 text-white text-[10px] font-black px-3 py-1.5 rounded-lg shadow-sm flex items-center gap-1 uppercase" style={{ backgroundColor: st?.cor_etiqueta_destaque || '#fbbf24' }}>
                        <Star size={12} fill="currentColor" /> Destaque
                      </div>
                   )}
                   <img key={activeImage} src={activeImage} className="w-full h-full object-cover animate-in fade-in duration-300" alt={selectedProduct.nome} />
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
                 {selectedProduct.descricao && (
                    <div className="hidden md:block mt-8 pt-8 border-t border-slate-100">
                      <h3 className="text-xs font-bold text-slate-800 uppercase tracking-widest mb-4">Descrição do Produto</h3>
                      <div className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap">{selectedProduct.descricao}</div>
                    </div>
                 )}
              </div>

              {/* DIREITA */}
              <div className="w-full md:w-[55%] flex flex-col">
                <div className="flex flex-wrap gap-2 mb-3">
                  {descontoPercent > 0 && !wholesaleApplied && !hasVariationPrice && (
                    <span className="text-white text-[10px] font-bold px-2 py-1 rounded uppercase shadow-sm" style={{ backgroundColor: st?.cor_etiqueta_promo || '#f43f5e' }}>
                      -{descontoPercent}% OFF
                    </span>
                  )}
                  {selectedProduct.qtd_minima > 1 && (
                    <span className="bg-slate-800 text-white text-[10px] font-bold px-2 py-1 rounded uppercase shadow-sm">
                      Pedido Mín. {selectedProduct.qtd_minima} un.
                    </span>
                  )}
                  <span className="bg-slate-100 text-slate-600 border border-slate-200 text-[10px] font-bold px-2 py-1 rounded uppercase shadow-sm flex items-center gap-1">
                    <Package size={12}/> {selectedProduct.categoria}
                  </span>
                </div>
                <h1 className="text-2xl md:text-3xl font-black text-slate-900 mb-4 leading-tight">{selectedProduct.nome}</h1>
                <div className="mb-6 pb-6 border-b border-slate-100">
                   <div className="flex items-end gap-3 mb-1">
                     <span className="text-3xl md:text-4xl font-black transition-colors duration-300" style={{ color: st?.cor_principal }}>R$ {unitPriceFinal.toFixed(2)}</span>
                     {selectedProduct.preco_promocional > 0 && !wholesaleApplied && !hasVariationPrice && (
                       <span className="text-sm text-slate-400 line-through font-bold mb-1.5">R$ {selectedProduct.preco.toFixed(2)}</span>
                     )}
                   </div>
                   {wholesaleApplied && (
                      <span className="font-bold text-[10px] uppercase flex items-center gap-1 mt-1" style={{ color: st?.cor_etiqueta_atacado || '#fb923c' }}>
                        <Box size={12}/> Preço de Atacado Aplicado
                      </span>
                   )}
                </div>
                <div className="hidden md:block">{variacoesJSX}</div>
                {atacadoData && (
                  <div className="mb-6 bg-slate-50 border border-slate-200 rounded-xl p-4 md:p-5">
                    <h3 className="text-[11px] font-bold text-slate-600 uppercase tracking-widest mb-3 flex items-center gap-1.5"><Box size={14}/> Descontos por Quantidade</h3>
                    {atacadoData.nextRule ? (
                      <div className="mb-4 bg-white p-3 rounded-lg border border-slate-100 shadow-sm">
                         <p className="text-[11px] font-semibold text-slate-600 mb-2">
                           🔥 Faltam só <span className="font-black text-emerald-600">{atacadoData.nextRule.min - qtdSafe} un.</span> para pagar <span className="font-black text-emerald-600">R$ {getWholesalePrice(atacadoData.nextRule.preco).toFixed(2)}/un</span>
                         </p>
                         <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden mb-1"><div className="bg-emerald-500 h-2 rounded-full transition-all duration-500" style={{ width: `${atacadoData.progress}%` }}></div></div>
                      </div>
                    ) : (
                      <div className="mb-4 bg-amber-50 border border-amber-200 p-3 rounded-lg flex items-center gap-2 text-amber-700">
                        <Sparkles size={16} className="text-amber-500" /><span className="text-[11px] font-black uppercase tracking-widest">Desconto Máximo Atingido!</span>
                      </div>
                    )}
                    <div className="flex flex-col gap-1.5">
                      {atacadoData.rules.map((r, i) => {
                         const isCurrent = atacadoData.activeRule?.min === r.min;
                         return (
                           <div key={i} className={`flex justify-between items-center text-[10px] px-3 py-2 rounded-md border ${isCurrent ? 'bg-amber-100/50 border-amber-200 text-amber-900 font-bold shadow-sm' : 'bg-white border-slate-100 text-slate-500'}`}>
                             <span>Acima de {r.min} un.</span>
                             <span className={isCurrent ? 'font-black' : 'font-semibold'}>R$ {getWholesalePrice(r.preco).toFixed(2)} /un</span>
                           </div>
                         )
                      })}
                    </div>
                  </div>
                )}
                {selectedProduct.descricao && (
                  <div className="mb-6 border-b border-slate-100 pb-6 block md:hidden">
                    <h3 className="text-xs font-bold text-slate-800 uppercase tracking-widest mb-2">Descrição do Produto</h3>
                    <div className="text-xs text-slate-600 leading-relaxed whitespace-pre-wrap">{selectedProduct.descricao}</div>
                  </div>
                )}
                <div className="fixed inset-x-0 bottom-[64px] bg-white p-4 pb-4 border-t border-slate-200 shadow-[0_-10px_20px_rgba(0,0,0,0.05)] z-[100] md:static md:bg-transparent md:p-0 md:pb-0 md:shadow-none md:border-none md:mt-2">
                   <div className="flex flex-col max-w-6xl mx-auto">
                      <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3 md:gap-4 w-full">
                        <div className="flex items-center justify-between bg-slate-50 p-3 md:p-3.5 rounded-xl border border-slate-200 w-full md:w-auto shrink-0 md:pr-6">
                          <div className="flex items-center border border-slate-300 rounded-lg h-10 md:h-12 bg-white overflow-hidden shadow-sm mr-4">
                            <button onClick={decrementarQuantidade} className="w-10 md:w-12 h-full flex items-center justify-center text-slate-500 hover:bg-slate-50 transition-colors" disabled={quantidade <= minQtd}><Minus size={16} className={quantidade <= minQtd ? "opacity-30" : ""}/></button>
                            <input type="text" inputMode="numeric" pattern="[0-9]*" value={quantidade} onChange={handleQuantidadeChange} onBlur={handleQuantidadeBlur} className="w-10 md:w-12 h-full text-center font-black text-slate-800 text-sm border-x border-slate-200 outline-none" />
                            <button onClick={() => setQuantidade(qtdSafe + 1)} className="w-10 md:w-12 h-full flex items-center justify-center text-slate-500 hover:bg-slate-50 transition-colors"><Plus size={16}/></button>
                          </div>
                          <div className="text-right">
                            <p className="text-[9px] md:text-[10px] font-bold uppercase text-slate-400 tracking-widest mb-0.5">Total a Pagar</p>
                            <p className="text-xl md:text-2xl font-black text-slate-900 tracking-tighter leading-none">R$ {precoTotal.toFixed(2)}</p>
                          </div>
                        </div>
                        <Button onClick={enviarZap} className="w-full md:flex-1 h-12 md:h-14 bg-[#25D366] hover:bg-[#20bd5a] text-white rounded-xl font-bold uppercase text-[11px] md:text-xs gap-2 shadow-md transition-all border-none active:scale-[0.98]">
                          <MessageCircle size={20} fill="currentColor" /> Encomendar pelo WhatsApp
                        </Button>
                      </div>
                   </div>
                </div>
              </div>
            </div>
            {relacionados.length > 0 && (
              <div className="mt-16 md:mt-24 mb-10">
                <h3 className="text-xl md:text-2xl font-black text-slate-900 mb-6 flex items-center gap-2">Veja também</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 md:gap-6">
                  {relacionados.map(prod => (
                    <div key={prod.id} onClick={() => abrirDetalhe(prod)} className="group cursor-pointer flex flex-col h-full bg-white rounded-xl md:rounded-2xl border border-slate-200 overflow-hidden hover:shadow-md hover:border-slate-300 transition-all duration-300">
                      <div className={`${aspectClass} bg-slate-50 border-b border-slate-100 overflow-hidden relative`}>
                        {prod.destaque && <div className="absolute top-2 left-2 z-10 text-white text-[9px] font-bold px-1.5 py-0.5 rounded shadow-sm flex items-center gap-0.5 uppercase" style={{ backgroundColor: st?.cor_etiqueta_destaque || '#fbbf24' }}><Star size={10} fill="currentColor" /> Destaque</div>}
                        <img src={prod.imagem_url || `https://placehold.co/400`} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                      </div>
                      <div className="flex flex-col flex-1 p-3 md:p-4">
                        <h3 className="text-xs font-bold text-slate-800 line-clamp-2 leading-tight mb-2">{prod.nome}</h3>
                        <div className="flex flex-col mb-3"><span className="text-sm font-black text-slate-900 leading-none">R$ {Number(prod.preco_promocional > 0 ? prod.preco_promocional : prod.preco).toFixed(2)}</span></div>
                        <div className="mt-auto pt-2"><button className="w-full py-2 rounded-lg text-white text-[10px] font-bold uppercase transition-colors duration-300" style={{ backgroundColor: st?.cor_principal }}>Ver Detalhes</button></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          <FooterSite st={st} />
        </div>
      );
    }

    return (
      <div className="min-h-screen bg-[#f8fafc] flex flex-col relative">
        <HeaderSite st={st} searchTerm={searchTerm} setSearchTerm={setSearchTerm} selectedCategory={selectedCategory} changeCategory={changeCategory} categorias={displayCategories} isPublic={isPublic} goHome={goHome} view={view} />
        
        {/* BANNER FULL WIDTH - Fora do container para ir de ponta a ponta */}
        {view === 'grid' && st?.banner_url && (
          <div className="w-full cursor-pointer hover:opacity-95 transition-opacity bg-slate-900" onClick={() => st.banner_link && window.open(st.banner_link, '_blank')}>
              <img src={st.banner_url} className="w-full h-auto max-h-[300px] md:max-h-[500px] object-cover" alt="Banner Principal" />
          </div>
        )}

        <BenefitsBar st={st} />
        <main className="max-w-7xl mx-auto px-4 md:px-8 py-8 md:py-12 flex-1 w-full space-y-10 md:space-y-14">
          
          {filtered.length === 0 ? (
             <div className="text-center py-20 bg-white rounded-2xl border border-slate-200 shadow-sm">
               <ShoppingBag size={40} className="mx-auto text-slate-200 mb-4" />
               <p className="text-slate-500 font-bold uppercase text-xs tracking-widest">Nenhum produto encontrado.</p>
             </div>
          ) : (
            <div className="space-y-6">
              <h2 className="text-xl md:text-2xl font-black text-slate-900 border-b border-slate-200 pb-3">Todos os Produtos</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-5">
                {filtered.map(prod => {
                  const descontoPercent = calcularDesconto(prod.preco, prod.preco_promocional);
                  return (
                  <div key={prod.id} className="group bg-white rounded-xl md:rounded-2xl border border-slate-200 overflow-hidden hover:shadow-md hover:border-slate-300 transition-all duration-300 flex flex-col h-full cursor-pointer animate-in fade-in" onClick={() => abrirDetalhe(prod)}>
                    <div className={`${aspectClass} bg-slate-50 border-b border-slate-100 overflow-hidden relative`}>
                      {prod.destaque && <span className="absolute top-3 left-3 z-10 text-white text-[9px] font-black px-2 py-1 rounded shadow-sm flex items-center gap-1 uppercase" style={{ backgroundColor: st?.cor_etiqueta_destaque || '#fbbf24' }}><Star size={10} fill="currentColor" /> Destaque</span>}
                      <img src={prod.imagem_url || `https://placehold.co/400`} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" alt={prod.nome} />
                    </div>
                    <div className="flex flex-col flex-1 p-3 md:p-4">
                      <div className="flex flex-wrap items-center gap-1.5 mb-2">
                        {descontoPercent > 0 && <span className="text-white text-[9px] font-bold px-1.5 py-0.5 rounded uppercase" style={{ backgroundColor: st?.cor_etiqueta_promo || '#f43f5e' }}>-{descontoPercent}% OFF</span>}
                        {prod.atacado?.ativa && <span className="text-white text-[9px] font-bold px-1.5 py-0.5 rounded uppercase flex items-center gap-0.5" style={{ backgroundColor: st?.cor_etiqueta_atacado || '#fb923c' }}><Box size={10} /> Atacado</span>}
                        {prod.variacoes?.ativa && <span className="text-white text-[9px] font-bold px-1.5 py-0.5 rounded uppercase flex items-center gap-0.5" style={{ backgroundColor: st?.cor_etiqueta_variacao || '#60a5fa' }}><Layers size={10} /> Variações</span>}
                        {!descontoPercent && !prod.atacado?.ativa && !prod.variacoes?.ativa && <span className="bg-slate-100 text-slate-500 text-[9px] font-bold px-1.5 py-0.5 rounded uppercase flex items-center gap-0.5"><Package size={10} /> {prod.categoria}</span>}
                      </div>
                      <h3 className="text-xs md:text-sm font-bold text-slate-800 line-clamp-2 leading-tight mb-2">{prod.nome}</h3>
                      <div className="flex flex-col mb-3">
                        {prod.preco_promocional > 0 ? (
                          <><span className="text-[10px] text-slate-400 line-through font-bold leading-none">R$ {Number(prod.preco).toFixed(2)}</span><span className="text-base md:text-lg font-black text-slate-900 leading-none mt-1">R$ {Number(prod.preco_promocional).toFixed(2)}</span></>
                        ) : (
                          <span className="text-base md:text-lg font-black text-slate-900 leading-none">R$ {Number(prod.preco).toFixed(2)}</span>
                        )}
                      </div>
                      <div className="mt-auto pt-2"><button className="w-full h-9 md:h-10 rounded-lg text-white text-[11px] font-bold uppercase transition-colors duration-300 shadow-sm flex items-center justify-center gap-1.5" style={{ backgroundColor: st?.cor_principal }}>Ver Detalhes</button></div>
                    </div>
                  </div>
                )})}
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

  // --- VISÃO ADMINISTRATIVA: MODO EDITOR HYBRIDO (SIDEBAR/BOTTOM SHEET) ---
  return (
    <div className="fixed inset-0 z-[120] flex bg-slate-100 overflow-hidden animate-in fade-in zoom-in-95 duration-300">
      
      {/* CONTAINER HÍBRIDO DO EDITOR (Invisível no Mobile para permitir cliques na vitrine) */}
      <div className="absolute lg:relative inset-y-0 left-0 w-full lg:w-[320px] flex flex-col bg-transparent lg:bg-slate-900 lg:border-r lg:border-slate-800 lg:shadow-2xl z-[140] lg:z-20 pointer-events-none lg:pointer-events-auto">
        
        {/* HEADER DESKTOP ONLY */}
        <div className="hidden lg:flex p-4 border-b border-slate-800 items-center justify-between bg-slate-950">
          <button onClick={() => navigate('/app')} className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-slate-400 hover:text-white transition-colors">
            <ArrowLeft size={14} /> Sair
          </button>
          <Button onClick={handleSave} className="h-8 px-4 bg-emerald-500 hover:bg-emerald-600 text-white rounded text-[10px] font-bold uppercase tracking-widest transition-all">
            {saved ? <Check size={14} /> : "Salvar"}
          </Button>
        </div>

        {/* CONTEÚDO DO EDITOR */}
        <div className="flex-1 lg:overflow-y-auto no-scrollbar lg:pb-10 pointer-events-none lg:pointer-events-auto">
           <EditorSection id="identidade" title="Visual & Logo" icon={Palette} openSection={openSection} setOpenSection={setOpenSection}>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Nome da Loja</label>
                <Input value={st?.nome_loja || ''} onChange={(e) => setSt({...st, nome_loja: e.target.value})} className="h-8 text-xs bg-slate-800 border-slate-700 text-white focus:border-slate-500" />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase text-slate-500 tracking-widest">Logo Central</label>
                <div className="flex flex-col gap-1">
                  <div className="flex gap-2">
                    <div className="w-12 h-12 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center overflow-hidden relative shrink-0">
                       {st?.logo_url ? <img src={st.logo_url} className="w-full h-full object-contain p-1" /> : <ImageIcon size={16} className="text-slate-500" />}
                       <input type="file" accept="image/*" onChange={(e) => handleImageUpload(e, 'logo_url')} className="absolute inset-0 opacity-0 cursor-pointer" />
                    </div>
                    {st?.logo_url && <button onClick={() => setSt({...st, logo_url: ''})} className="bg-red-500 text-white p-1.5 rounded h-12 flex items-center justify-center"><Trash2 size={14}/></button>}
                  </div>
                  <p className="text-[8px] text-slate-500 font-medium uppercase tracking-widest mt-1">Medida recomendada: 500 x 500 px</p>
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase text-slate-500 tracking-widest">Cor Principal</label>
                <div className="flex gap-2 items-center">
                  <div className="relative w-8 h-8 rounded border border-slate-700 shrink-0" style={{ backgroundColor: st?.cor_principal || '#000000' }}>
                    <input type="color" value={st?.cor_principal || '#000000'} onChange={(e) => setSt({...st, cor_principal: e.target.value})} className="absolute -inset-2 w-12 h-12 opacity-0 cursor-pointer" />
                  </div>
                  <Input value={st?.cor_principal || ''} onChange={(e) => setSt({...st, cor_principal: e.target.value})} className="h-8 font-mono text-[10px] uppercase bg-slate-800 border-slate-700 text-white" />
                </div>
              </div>
              
              <div className="space-y-1.5 pt-3 border-t border-slate-700/50">
                <label className="text-[10px] font-bold uppercase text-slate-500 tracking-widest">Formato das Fotos</label>
                <div className="flex gap-2">
                  <button onClick={() => setSt({...st, formato_imagens: 'quadrado'})} className={`flex-1 h-8 text-[10px] font-bold uppercase rounded border transition-colors ${st?.formato_imagens !== 'retrato' ? 'bg-slate-700 border-slate-500 text-white' : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white'}`}>Quad. (1:1)</button>
                  <button onClick={() => setSt({...st, formato_imagens: 'retrato'})} className={`flex-1 h-8 text-[10px] font-bold uppercase rounded border transition-colors ${st?.formato_imagens === 'retrato' ? 'bg-slate-700 border-slate-500 text-white' : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white'}`}>Retrato (4:5)</button>
                </div>
              </div>

              <div className="space-y-1.5 pt-3 border-t border-slate-700/50">
                 <label className="text-[10px] font-bold uppercase text-slate-500 tracking-widest">Cores das Etiquetas</label>
                 <div className="grid grid-cols-1 gap-2 pt-1">
                  {[
                    { label: 'Destaque', field: 'cor_etiqueta_destaque', def: '#fbbf24' },
                    { label: 'Promoção', field: 'cor_etiqueta_promo', def: '#f43f5e' },
                    { label: 'Atacado', field: 'cor_etiqueta_atacado', def: '#fb923c' },
                    { label: 'Variações', field: 'cor_etiqueta_variacao', def: '#60a5fa' }
                  ].map(item => (
                    <div key={item.field} className="flex gap-2 items-center justify-between bg-slate-800 p-1.5 rounded border border-slate-700">
                      <span className="text-[9px] font-bold uppercase text-slate-400 px-1">{item.label}</span>
                      <div className="relative w-6 h-6 rounded shrink-0" style={{ backgroundColor: st?.[item.field] || item.def }}>
                        <input type="color" value={st?.[item.field] || item.def} onChange={(e) => setSt({...st, [item.field]: e.target.value})} className="absolute -inset-2 w-10 h-10 opacity-0 cursor-pointer" />
                      </div>
                    </div>
                  ))}
                 </div>
              </div>
           </EditorSection>

           <EditorSection id="layout" title="Estrutura" icon={LayoutTemplate} openSection={openSection} setOpenSection={setOpenSection}>
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase text-slate-500 tracking-widest">Ordem das Categorias</label>
                {displayCategories.filter(c => c !== 'Sem Categoria').map((cat, index) => (
                  <div key={cat} className="flex items-center justify-between p-2 bg-slate-800 border border-slate-700 rounded-md">
                    <span className="text-[10px] font-bold text-slate-300 uppercase">{cat}</span>
                    <div className="flex gap-1">
                      <button onClick={() => moveCategory(index, 'up')} disabled={index === 0} className="p-1 text-slate-500 hover:text-white disabled:opacity-30"><ChevronUp size={14} /></button>
                      <button onClick={() => moveCategory(index, 'down')} disabled={index === displayCategories.filter(c => c !== 'Sem Categoria').length - 1} className="p-1 text-slate-500 hover:text-white disabled:opacity-30"><ChevronDown size={14} /></button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="space-y-4 pt-4 border-t border-slate-700/50 mt-4">
                 <div className="flex items-center justify-between bg-slate-800 p-2.5 rounded-md">
                   <span className="text-[10px] font-bold uppercase text-slate-300">Faixa de Benefícios</span>
                   <button onClick={() => setSt({...st, mostrar_beneficios: !st.mostrar_beneficios})} className={`w-8 h-4 rounded-full p-0.5 transition-all ${st?.mostrar_beneficios ? 'bg-emerald-500' : 'bg-slate-600'}`}>
                     <div className={`w-3 h-3 bg-white rounded-full transition-transform ${st?.mostrar_beneficios ? 'translate-x-4' : 'translate-x-0'}`} />
                   </button>
                 </div>
                 {st?.mostrar_beneficios && [1, 2, 3].map(num => (
                   <div key={num} className="p-3 bg-slate-800 rounded border border-slate-700 space-y-2">
                     <div className="flex gap-2 items-start">
                       <div className="flex flex-col items-center gap-1 shrink-0">
                         <div className="w-8 h-8 rounded bg-slate-900 border border-slate-700 flex items-center justify-center relative overflow-hidden shrink-0">
                           {st[`beneficio_${num}_icone`] ? <img src={st[`beneficio_${num}_icone`]} className="w-5 h-5 object-contain"/> : <Package size={14} className="text-slate-500"/>}
                           <input type="file" accept="image/*" onChange={(e) => handleImageUpload(e, `beneficio_${num}_icone`)} className="absolute inset-0 opacity-0 cursor-pointer" />
                         </div>
                         <span className="text-[7px] text-slate-500 font-bold uppercase tracking-widest text-center">100x100 px</span>
                       </div>
                       <div className="flex-1 space-y-2">
                         <Input value={st[`beneficio_${num}_titulo`] || ''} onChange={(e) => setSt({...st, [`beneficio_${num}_titulo`]: e.target.value})} placeholder="Título" className="h-8 text-[10px] bg-slate-900 border-slate-700 text-white w-full" />
                         <Input value={st[`beneficio_${num}_desc`] || ''} onChange={(e) => setSt({...st, [`beneficio_${num}_desc`]: e.target.value})} placeholder="Descrição curta" className="h-7 text-[9px] bg-slate-900 border-slate-700 text-slate-400 w-full" />
                       </div>
                     </div>
                   </div>
                 ))}
              </div>
           </EditorSection>

           <EditorSection id="banners" title="Banners" icon={ImageIcon} openSection={openSection} setOpenSection={setOpenSection}>
              <div className="space-y-4">
                <div className="relative">
                  <input type="file" accept="image/*" onChange={(e) => handleImageUpload(e, 'banner_url')} className="absolute inset-0 opacity-0 cursor-pointer z-10" />
                  <Button variant="outline" className="w-full h-8 rounded border-dashed border-slate-600 bg-slate-800 text-slate-300 font-bold uppercase text-[9px] hover:bg-slate-700">
                    <Upload size={12} className="mr-1.5"/> {st?.banner_url ? "Trocar Banner" : "Subir Imagem Full-Width"}
                  </Button>
                  <p className="text-[8px] text-slate-500 font-medium uppercase tracking-widest mt-1.5 text-center w-full">Medida recomendada: 1200 x 400 px</p>
                </div>
                {st?.banner_url && (
                  <div className="aspect-[21/9] rounded overflow-hidden border border-slate-700 relative">
                    <img src={st.banner_url} className="w-full h-full object-cover" />
                    <button onClick={() => setSt({...st, banner_url: ''})} className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded"><Trash2 size={10}/></button>
                  </div>
                )}
                <div className="space-y-1.5">
                  <label className="text-[9px] font-bold uppercase text-slate-500">Link do Banner</label>
                  <Input value={st?.banner_link || ''} onChange={(e) => setSt({...st, banner_link: e.target.value})} placeholder="https://..." className="h-8 text-[10px] bg-slate-800 border-slate-700 text-white" />
                </div>
              </div>
           </EditorSection>

           <EditorSection id="rodape" title="Rodapé" icon={Globe} openSection={openSection} setOpenSection={setOpenSection}>
              <div className="space-y-3">
                <div className="space-y-1">
                  <label className="text-[9px] font-bold uppercase text-slate-500">Sobre a Empresa</label>
                  <textarea value={st?.texto_sobre || ''} onChange={(e) => setSt({...st, texto_sobre: e.target.value})} className="w-full h-16 p-2 bg-slate-800 border border-slate-700 rounded text-[10px] text-white resize-none outline-none focus:border-slate-500" />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-bold uppercase text-slate-500">WhatsApp</label>
                  <Input value={st?.whatsapp || ''} onChange={(e) => setSt({...st, whatsapp: e.target.value})} className="h-8 text-[10px] bg-slate-800 border-slate-700 text-white" />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-bold uppercase text-slate-500">Instagram</label>
                  <Input value={st?.instagram || ''} onChange={(e) => setSt({...st, instagram: e.target.value})} className="h-8 text-[10px] bg-slate-800 border-slate-700 text-white" />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-bold uppercase text-slate-500">Endereço Físico</label>
                  <Input value={st?.endereco || ''} onChange={(e) => setSt({...st, endereco: e.target.value})} className="h-8 text-[10px] bg-slate-800 border-slate-700 text-white" />
                </div>
              </div>
           </EditorSection>
        </div>

        {/* FOOTER DESKTOP ONLY */}
        <div className="hidden lg:block p-4 border-t border-slate-800 bg-slate-950">
           <Button onClick={copyVitrineLink} variant="outline" className="w-full h-8 bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700 font-bold uppercase text-[9px] tracking-widest gap-2">
             <Copy size={12} /> Copiar Link da Loja
           </Button>
        </div>
      </div>

      {/* ÁREA DE PREVIEW (CATÁLOGO AO VIVO) COM OVERLAYS MOBILE */}
      <div className="flex-1 h-full overflow-y-auto relative bg-[#f8fafc] pb-[70px] lg:pb-0 z-10">
        
        {/* BOTÃO SAIR NO MOBILE */}
        <button onClick={() => navigate('/app')} className="lg:hidden fixed top-4 left-4 z-[150] w-10 h-10 bg-slate-900/90 backdrop-blur text-white rounded-full flex items-center justify-center shadow-lg border border-slate-700">
          <ArrowLeft size={18} />
        </button>

        {/* MÁSCARA ESCURA QUANDO PAINEL MOBILE ESTÁ ABERTO */}
        {openSection && <div onClick={() => setOpenSection('')} className="lg:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-[130] transition-opacity" />}

        {renderCatalog()}

        {/* BARRA FIXA DE NAVEGAÇÃO NO MOBILE */}
        <div className="lg:hidden fixed bottom-0 inset-x-0 h-[64px] bg-slate-950 border-t border-slate-800 flex items-center justify-around z-[150] px-1">
          {[
            { id: 'identidade', icon: Palette, label: 'Visual' },
            { id: 'layout', icon: LayoutTemplate, label: 'Estrutura' },
            { id: 'banners', icon: ImageIcon, label: 'Banners' },
            { id: 'rodape', icon: Globe, label: 'Rodapé' }
          ].map(tab => (
            <button key={tab.id} onClick={() => setOpenSection(openSection === tab.id ? '' : tab.id)} className={`flex flex-col items-center justify-center w-16 h-full gap-1.5 transition-colors ${openSection === tab.id ? 'text-blue-400' : 'text-slate-500 hover:text-slate-300'}`}>
               <tab.icon size={20} className={openSection === tab.id ? 'animate-pulse' : ''} />
               <span className="text-[8px] font-bold uppercase tracking-wider">{tab.label}</span>
            </button>
          ))}
          <div className="w-[1px] h-8 bg-slate-800 mx-1"></div>
          <button onClick={handleSave} className="flex flex-col items-center justify-center w-16 h-full gap-1.5 text-emerald-500 hover:text-emerald-400 transition-colors">
             {saved ? <Check size={20} /> : <Save size={20} />}
             <span className="text-[8px] font-bold uppercase tracking-wider">Salvar</span>
          </button>
        </div>

      </div>

      {/* OVERLAY DE CARREGAMENTO GLOBAL DE IMAGENS */}
      {isUploadingGlobal && (
        <div className="fixed inset-0 z-[999] bg-slate-900/60 backdrop-blur-sm flex flex-col items-center justify-center">
          <Loader2 className="animate-spin text-white w-12 h-12 mb-4" />
          <p className="text-white font-bold uppercase tracking-widest text-xs animate-pulse">Comprimindo e Enviando Imagem...</p>
        </div>
      )}
    </div>
  );
}