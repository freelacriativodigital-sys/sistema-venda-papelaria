import { useState, useEffect } from "react";
import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { pagesConfig } from './pages.config'
import { BrowserRouter as Router, Route, Routes, Link, useLocation, Navigate } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { motion, AnimatePresence } from "framer-motion";

import Login from '@/components/tasks/Login';
import LancamentoModal from '@/components/tasks/LancamentoModal'; // IMPORTANDO O MODAL GLOBAL

import { 
  Home, Package, MessageCircle, LogOut, 
  ChevronRight, Users, ShoppingBag, Settings, Globe, FileText,
  Link as LinkIcon, Palette, Calculator, ShieldCheck, Plus, Wallet
} from "lucide-react";

import { supabase } from "./lib/supabase"; 
import BriefingPublico from './pages/BriefingPublico'; 

const MenuItem = ({ item, isActive, path, Icon, colorPrincipal, onClick }) => {
  return (
    <Link to={path} onClick={onClick}
      className={`flex items-center justify-between px-3 py-2.5 rounded-lg font-bold uppercase text-[10px] tracking-tight transition-all ${
        isActive ? 'shadow-sm border' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
      }`}
      style={isActive ? { color: colorPrincipal, backgroundColor: `${colorPrincipal}10`, borderColor: `${colorPrincipal}20` } : {}}
    >
      <div className="flex items-center gap-3">
        <Icon size={16} className={isActive ? '' : 'text-slate-400'} />
        {item.label}
      </div>
      {isActive && <ChevronRight size={14} />}
    </Link>
  );
};

const Sidebar = ({ st, isOpen, setIsOpen, onOpenLancamento }) => {
  const location = useLocation();
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);
  const categorias = pagesConfig.menuCategorias;
  const userRole = localStorage.getItem('sistema_user_role') || 'padrao';

  const getMenuMeta = (id) => {
    const meta = {
      "": { path: "/app", icon: Home }, 
      "produtos": { path: "/produtos", icon: Package },
      "clientes": { path: "/clientes", icon: Users },
      "orcamentos": { path: "/orcamentos", icon: FileText },
      "catalogo": { path: "/catalogo", icon: ShoppingBag },
      "minhabio": { path: "/minhabio", icon: LinkIcon }, 
      "configuracoes": { path: "/configuracoes", icon: Settings },
      "whatsapp": { path: "/whatsapp", icon: MessageCircle },
      "briefings": { path: "/briefings", icon: Palette },
      "precificacao": { path: "/precificacao", icon: Calculator },
      "seguranca": { path: "/seguranca", icon: ShieldCheck },
      "caixa": { path: "/caixa", icon: Wallet },
    };
    return meta[id] || { path: `/${id}`, icon: Package };
  };

  return (
    <div className={`fixed left-0 top-0 h-screen w-64 bg-white border-r border-slate-200 flex flex-col z-[100] transition-transform duration-300 ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
      
      <div className="flex justify-center items-center h-24 border-b border-slate-100 shrink-0 px-6">
        {st.logoUrl ? <img src={st.logoUrl} alt="Logo" className="max-h-12 w-auto object-contain drop-shadow-sm" /> : <span className="text-sm font-black text-slate-700 uppercase tracking-widest text-center truncate">{st.nomeLoja || "Painel de Gestão"}</span>}
      </div>

      {/* --- BOTÃO DE AÇÃO RÁPIDA GLOBAL --- */}
      <div className="px-4 pt-5 pb-1 relative z-50">
        <button 
          onClick={() => setIsQuickAddOpen(!isQuickAddOpen)}
          className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white p-2.5 rounded-lg font-bold uppercase text-[10px] tracking-widest shadow-sm transition-all active:scale-95"
        >
          <Plus size={14} /> Ação Rápida
        </button>

        <AnimatePresence>
          {isQuickAddOpen && (
            <>
              {/* Fundo invisível para fechar ao clicar fora */}
              <div className="fixed inset-0 z-40" onClick={() => setIsQuickAddOpen(false)} />
              
              <motion.div 
                initial={{ opacity: 0, y: -10 }} 
                animate={{ opacity: 1, y: 0 }} 
                exit={{ opacity: 0, y: -10 }}
                className="absolute top-full left-4 right-4 mt-2 bg-white border border-slate-200 rounded-xl shadow-xl z-50 overflow-hidden"
              >
                <div className="flex flex-col">
                   <Link to="/pedidos" onClick={() => { setIsQuickAddOpen(false); setIsOpen && setIsOpen(false); }} className="flex items-center gap-2.5 px-4 py-3 hover:bg-slate-50 border-b border-slate-100 text-slate-700 transition-colors">
                     <Package size={14} className="text-blue-500" />
                     <span className="text-[9px] font-bold uppercase tracking-widest">Novo Pedido</span>
                   </Link>
                   <Link to="/clientes" onClick={() => { setIsQuickAddOpen(false); setIsOpen && setIsOpen(false); }} className="flex items-center gap-2.5 px-4 py-3 hover:bg-slate-50 border-b border-slate-100 text-slate-700 transition-colors">
                     <Users size={14} className="text-emerald-500" />
                     <span className="text-[9px] font-bold uppercase tracking-widest">Novo Cliente</span>
                   </Link>
                   <Link to="/produtos" onClick={() => { setIsQuickAddOpen(false); setIsOpen && setIsOpen(false); }} className="flex items-center gap-2.5 px-4 py-3 hover:bg-slate-50 border-b border-slate-100 text-slate-700 transition-colors">
                     <ShoppingBag size={14} className="text-amber-500" />
                     <span className="text-[9px] font-bold uppercase tracking-widest">Novo Produto</span>
                   </Link>
                   <button onClick={() => { setIsQuickAddOpen(false); onOpenLancamento(); setIsOpen && setIsOpen(false); }} className="flex items-center gap-2.5 px-4 py-3 hover:bg-slate-50 text-slate-700 transition-colors w-full text-left">
                     <Wallet size={14} className="text-rose-500" />
                     <span className="text-[9px] font-bold uppercase tracking-widest">Nova Transação</span>
                   </button>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>

      <nav className="flex-1 overflow-y-auto no-scrollbar flex flex-col pt-3 pb-4 px-4 space-y-6">
        {categorias.map((categoria, idx) => {
          const filteredItems = categoria.items.filter(item => item.roles.includes(userRole));
          if (filteredItems.length === 0) return null;

          return (
            <div key={idx} className="space-y-1">
              <h4 className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-2 px-3">{categoria.titulo}</h4>
              <div className="space-y-1">
                {filteredItems.map((item) => {
                  const { path, icon } = getMenuMeta(item.id);
                  return <MenuItem key={item.id} item={item} path={path} Icon={icon} isActive={location.pathname === path} colorPrincipal={st.corPrincipal} onClick={() => setIsOpen && setIsOpen(false)} />;
                })}
              </div>
            </div>
          )
        })}
        
        <div className="pt-4 mt-2 border-t border-slate-100 space-y-2">
          <a href="/" target="_blank" className="flex items-center justify-center gap-2 p-3 rounded-lg font-bold uppercase text-[10px] text-emerald-600 hover:bg-emerald-50 transition-all border border-emerald-100 w-full"><Globe size={14} /> Ver Site </a>
          <a href="/bio" target="_blank" className="flex items-center justify-center gap-2 p-3 rounded-lg font-bold uppercase text-[10px] text-pink-600 hover:bg-pink-50 transition-all border border-pink-100 w-full"><LinkIcon size={14} /> Link da Bio</a>
        </div>
      </nav>

      <div className="p-4 border-t border-slate-100 flex flex-col gap-2 shrink-0">
        <button onClick={() => { localStorage.removeItem("sistema_auth"); localStorage.removeItem("sistema_auth_time"); localStorage.removeItem("sistema_user_role"); window.location.reload(); }} className="flex items-center justify-center gap-2 w-full p-3 rounded-lg border border-red-100 bg-red-50 text-red-500 font-bold uppercase text-[10px] hover:bg-red-100 transition-colors">
          <LogOut size={14} /> Sair do Sistema
        </button>
      </div>
    </div>
  );
};

const LayoutWrapper = ({ children, currentPageName, st, Layout }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isLancamentoOpen, setIsLancamentoOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-900 relative overflow-x-hidden">
      {isMobileMenuOpen && <div onClick={() => setIsMobileMenuOpen(false)} className="md:hidden fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[90]" />}
      {!isMobileMenuOpen && <button onClick={() => setIsMobileMenuOpen(true)} className="md:hidden fixed left-0 top-1/2 -translate-y-1/2 z-[80] bg-white text-slate-800 p-1 py-4 rounded-r-lg shadow-xl border border-l-0 border-slate-200"><ChevronRight size={24} /></button>}
      
      <Sidebar 
        st={st} 
        isOpen={isMobileMenuOpen} 
        setIsOpen={setIsMobileMenuOpen} 
        onOpenLancamento={() => setIsLancamentoOpen(true)} 
      />
      
      <main className="flex-1 ml-0 md:ml-64 p-4 md:p-8 overflow-y-auto w-full transition-all duration-300">
        {Layout ? <Layout currentPageName={currentPageName}>{children}</Layout> : children}
      </main>

      {/* MODAL GLOBAL DE LANÇAMENTO */}
      <LancamentoModal 
        isOpen={isLancamentoOpen} 
        onClose={() => setIsLancamentoOpen(false)} 
        tipoInicial="entrada" 
      />
    </div>
  );
};

const AppRoutes = ({ isAuthorized, onLogin, st }) => {
  const location = useLocation();
  const { Pages, Layout, mainPage } = pagesConfig;
  
  const isVitrine = location.pathname === '/' || location.pathname === '/vitrine';
  const isBriefingClient = location.pathname.startsWith('/briefing/');
  const userRole = localStorage.getItem('sistema_user_role') || 'padrao';
  
  const mainPageKey = mainPage !== undefined ? mainPage : (Pages[""] !== undefined ? "" : Object.keys(Pages || {})[0]);
  const MainPage = Pages[mainPageKey];
  const VitrinePage = Pages["catalogo"];
  const BioPage = Pages["minhabio"]; 

  if (!isVitrine && !isBriefingClient && !isAuthorized) {
    return <Login onLogin={onLogin} />;
  }

  // --- BLOQUEIO DE SEGURANÇA ATUALIZADO ---
  const paginasProibidasParaPadrao = ['/app', '/despesas', '/precificacao', '/seguranca', '/caixa'];
  
  if (userRole === 'padrao' && paginasProibidasParaPadrao.includes(location.pathname)) {
    return <Navigate to="/pedidos" replace />;
  }
  
  return (
    <Routes>
      <Route path="/" element={VitrinePage ? <VitrinePage isPublic={true} /> : <PageNotFound />} />
      <Route path="/vitrine" element={VitrinePage ? <VitrinePage isPublic={true} /> : <PageNotFound />} />
      <Route path="/bio" element={BioPage ? <BioPage isPublic={true} /> : <PageNotFound />} />
      <Route path="/briefing/:slug" element={<BriefingPublico />} />
      <Route path="/app" element={<LayoutWrapper currentPageName={mainPageKey} st={st} Layout={Layout}>{MainPage ? <MainPage isPublic={false} /> : <PageNotFound />}</LayoutWrapper>} />

      {Pages && Object.entries(Pages).map(([path, PageComponent]) => (
        path !== "" && path !== mainPageKey && path !== "vitrine" && path !== "bio" && ( 
          <Route key={path} path={`/${path}`} element={<LayoutWrapper currentPageName={path} st={st} Layout={Layout}><PageComponent isPublic={false} /></LayoutWrapper>} />
        )
      ))}
      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
};

export default function App() {
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [st, setSt] = useState({ nomeLoja: 'Minha Loja', corPrincipal: '#33BEE8', logoUrl: '' });
  
  useEffect(() => {
    const auth = localStorage.getItem("sistema_auth");
    const authTime = localStorage.getItem("sistema_auth_time");
    const TEMPO_LIMITE_MS = 24 * 60 * 60 * 1000;

    if (auth === "true" && authTime) {
      const tempoLogado = Date.now() - parseInt(authTime);
      if (tempoLogado < TEMPO_LIMITE_MS) {
        setIsAuthorized(true);
      } else {
        localStorage.removeItem("sistema_auth");
        localStorage.removeItem("sistema_auth_time");
        localStorage.removeItem("sistema_user_role");
        setIsAuthorized(false);
      }
    } else {
      setIsAuthorized(false);
    }
    setCheckingAuth(false);

    async function carregarTemaDinâmico() {
      try {
        const { data, error } = await supabase.from('configuracoes').select('*').eq('id', 1).single();
        if (data && !error) {
          setSt({ nomeLoja: data.nome_loja || 'Minha Loja', corPrincipal: data.cor_orcamento || '#33BEE8', logoUrl: data.logo_url || '' });
          const root = document.documentElement;
          if (data.cor_orcamento) root.style.setProperty('--brand-color', data.cor_orcamento);
          if (data.cor_nome_empresa) root.style.setProperty('--brand-dark', data.cor_nome_empresa);
        }
      } catch (err) {}
    }
    carregarTemaDinâmico();
  }, []);

  if (checkingAuth) return null;

  return (
    <QueryClientProvider client={queryClientInstance}>
      <Router><AppRoutes isAuthorized={isAuthorized} onLogin={() => setIsAuthorized(true)} st={st} /></Router>
      <Toaster />
    </QueryClientProvider>
  );
}