import { useState, useEffect } from "react";
import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { pagesConfig } from './pages.config'
import { BrowserRouter as Router, Route, Routes, Link, useLocation } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';

// IMPORTAÇÃO DA NOSSA NOVA TELA DE LOGIN REAL
import Login from '@/components/tasks/Login';

import { Reorder, useDragControls } from "framer-motion"; 
import { 
  Home, Package, MessageCircle, LogOut, 
  ChevronRight, Users, ShoppingBag, Settings, Globe, GripVertical, FileText,
  Link as LinkIcon, RefreshCcw, Palette, Calculator 
} from "lucide-react";

import { supabase } from "./lib/supabase"; 
import BriefingPublico from './pages/BriefingPublico'; 

const MenuItem = ({ item, isActive, path, Icon, colorPrincipal, onClick }) => {
  const dragControls = useDragControls();

  return (
    <Reorder.Item 
      value={item}
      id={item.id}
      dragListener={false}
      dragControls={dragControls}
      className="relative select-none list-none"
    >
      <div className="flex items-center gap-2 group mb-1.5 px-3">
        <div 
          onPointerDown={(e) => dragControls.start(e)}
          className="cursor-grab active:cursor-grabbing p-1.5 text-slate-300 hover:text-slate-500 transition-colors"
        >
          <GripVertical size={16} />
        </div>

        <Link to={path} draggable="false" onClick={onClick}
          className={`flex-1 flex items-center justify-between p-3 rounded-lg font-bold uppercase text-[11px] tracking-tight transition-all ${
            isActive ? 'shadow-sm border' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
          }`}
          style={isActive ? { 
            color: colorPrincipal, 
            backgroundColor: `${colorPrincipal}10`, 
            borderColor: `${colorPrincipal}20` 
          } : {}}
        >
          <div className="flex items-center gap-3">
            <Icon size={16} />
            {item.label}
          </div>
          {isActive && <ChevronRight size={14} />}
        </Link>
      </div>
    </Reorder.Item>
  );
};

const Sidebar = ({ st, isOpen, setIsOpen }) => {
  const location = useLocation();
  
  const [items, setItems] = useState(pagesConfig.menuOrder);
  const [isLoaded, setIsLoaded] = useState(false);

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
    };
    return meta[id] || { path: `/${id}`, icon: Package };
  };

  useEffect(() => {
    async function fetchMenuOrder() {
      try {
        const { data, error } = await supabase
          .from('configuracoes')
          .select('ordem_menu')
          .eq('id', 1)
          .single();

        let parsed = [];

        if (data && data.ordem_menu) {
          parsed = typeof data.ordem_menu === 'string' ? JSON.parse(data.ordem_menu) : data.ordem_menu;
        } else {
          parsed = [...pagesConfig.menuOrder];
        }

        const missingItems = pagesConfig.menuOrder.filter(
          defaultItem => !parsed.find(savedItem => savedItem.id === defaultItem.id)
        );

        if (missingItems.length > 0) {
          parsed = [...parsed, ...missingItems];
        }

        parsed = parsed.filter(savedItem => 
          pagesConfig.menuOrder.find(defaultItem => defaultItem.id === savedItem.id)
        );

        setItems(parsed);
      } catch (err) {
        setItems([...pagesConfig.menuOrder]); 
      } finally {
        setIsLoaded(true); 
      }
    }
    fetchMenuOrder();
  }, []);

  useEffect(() => {
    if (!isLoaded) return;
    
    const saveTimer = setTimeout(async () => {
      try {
        await supabase
          .from('configuracoes')
          .update({ ordem_menu: items })
          .eq('id', 1);
      } catch (err) {
        console.error("Erro ao salvar ordem no Supabase", err);
      }
    }, 1000);

    return () => clearTimeout(saveTimer);
  }, [items, isLoaded]);

  const forcarResetDoMenu = async () => {
    const padrao = [...pagesConfig.menuOrder];
    setItems(padrao);
    try {
      await supabase.from('configuracoes').update({ ordem_menu: padrao }).eq('id', 1);
      localStorage.removeItem("sistema_menu_order");
      window.location.reload();
    } catch (err) {
      window.location.reload();
    }
  };

  return (
    <div className={`fixed left-0 top-0 h-screen w-64 bg-white border-r border-slate-200 flex flex-col z-[100] transition-transform duration-300 ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
      
      {/* Cabeçalho do Menu Limpo e Fixo */}
      <div className="flex justify-center items-center h-24 border-b border-slate-100 shrink-0 px-6">
        {st.logoUrl ? (
          <img 
            src={st.logoUrl} 
            alt="Logo da Loja" 
            className="max-h-12 w-auto object-contain drop-shadow-sm" 
          />
        ) : (
          <span className="text-sm font-black text-slate-700 uppercase tracking-widest text-center truncate">
            {st.nomeLoja || "Painel de Gestão"}
          </span>
        )}
      </div>

      <nav className="flex-1 overflow-y-auto no-scrollbar flex flex-col pt-4">
        <Reorder.Group axis="y" values={items} onReorder={setItems} className="space-y-0.5">
          {items.map((item) => {
            const { path, icon } = getMenuMeta(item.id);
            return (
              <MenuItem 
                key={item.id}
                item={item}
                path={path}
                Icon={icon}
                isActive={location.pathname === path}
                colorPrincipal={st.corPrincipal}
                onClick={() => setIsOpen && setIsOpen(false)}
              />
            );
          })}
        </Reorder.Group>
        
        {/* Botões de Acesso Rápido */}
        <div className="px-5 mt-4 space-y-2 pb-4">
          <a href="/" target="_blank" className="flex items-center justify-center gap-2 p-3 rounded-lg font-bold uppercase text-[10px] text-emerald-600 hover:bg-emerald-50 transition-all border border-emerald-100 w-full">
            <Globe size={14} /> Ver Site do Cliente
          </a>
          <a href="/bio" target="_blank" className="flex items-center justify-center gap-2 p-3 rounded-lg font-bold uppercase text-[10px] text-pink-600 hover:bg-pink-50 transition-all border border-pink-100 w-full">
            <LinkIcon size={14} /> Ver Link da Bio
          </a>
        </div>
      </nav>

      <div className="p-4 border-t border-slate-100 flex flex-col gap-2 shrink-0">
        <button onClick={forcarResetDoMenu}
          className="flex items-center justify-center gap-2 w-full p-2.5 rounded-lg text-slate-400 font-bold uppercase text-[9px] hover:bg-slate-50 transition-colors">
          <RefreshCcw size={12} /> Restaurar Menu Padrão
        </button>
        {/* BOTÃO DE SAIR AGORA APAGA A SESSÃO DO NAVEGADOR E VOLTA PRO LOGIN */}
        <button onClick={() => { localStorage.removeItem("sistema_auth"); window.location.reload(); }} 
          className="flex items-center justify-center gap-2 w-full p-3 rounded-lg border border-red-100 bg-red-50 text-red-500 font-bold uppercase text-[10px] hover:bg-red-100 transition-colors">
          <LogOut size={14} /> Sair do Sistema
        </button>
      </div>
    </div>
  );
};

const LayoutWrapper = ({ children, currentPageName, st, Layout }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-900 relative overflow-x-hidden">
      {isMobileMenuOpen && (
        <div onClick={() => setIsMobileMenuOpen(false)} className="md:hidden fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[90]" />
      )}
      {!isMobileMenuOpen && (
        <button 
          onClick={() => setIsMobileMenuOpen(true)} 
          className="md:hidden fixed left-0 top-1/2 -translate-y-1/2 z-[80] bg-white text-slate-800 p-1 py-4 rounded-r-lg shadow-xl border border-l-0 border-slate-200"
        >
          <ChevronRight size={24} />
        </button>
      )}

      <Sidebar st={st} isOpen={isMobileMenuOpen} setIsOpen={setIsMobileMenuOpen} />
      
      <main className="flex-1 ml-0 md:ml-64 p-4 md:p-8 overflow-y-auto w-full transition-all duration-300">
        {Layout ? <Layout currentPageName={currentPageName}>{children}</Layout> : children}
      </main>
    </div>
  );
};

const AppRoutes = ({ isAuthorized, onLogin, st }) => {
  const location = useLocation();
  const { Pages, Layout, mainPage } = pagesConfig;
  
  const isVitrine = location.pathname === '/' || location.pathname === '/vitrine';
  const isBriefingClient = location.pathname.startsWith('/briefing/');
  
  const mainPageKey = mainPage !== undefined ? mainPage : (Pages[""] !== undefined ? "" : Object.keys(Pages || {})[0]);
  const MainPage = Pages[mainPageKey];
  const VitrinePage = Pages["catalogo"];
  const BioPage = Pages["minhabio"]; 

  // SE NÃO ESTIVER LOGADO E TENTAR ENTRAR NUMA TELA INTERNA, MOSTRA A TELA DE LOGIN NOVA!
  if (!isVitrine && !isBriefingClient && !isAuthorized) {
    return <Login onLogin={onLogin} />;
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
    // Verifica se já passou pelo Login na sessão atual
    const auth = localStorage.getItem("sistema_auth");
    if (auth === "true") setIsAuthorized(true);
    setCheckingAuth(false);

    async function carregarTemaDinâmico() {
      try {
        const { data, error } = await supabase
          .from('configuracoes')
          .select('*')
          .eq('id', 1)
          .single();

        if (data && !error) {
          setSt({ 
            nomeLoja: data.nome_loja || 'Minha Loja', 
            corPrincipal: data.cor_orcamento || '#33BEE8',
            logoUrl: data.logo_url || '' 
          });

          const root = document.documentElement;
          if (data.cor_orcamento) root.style.setProperty('--brand-color', data.cor_orcamento);
          if (data.cor_nome_empresa) root.style.setProperty('--brand-dark', data.cor_nome_empresa);
        }
      } catch (err) {
        console.error("Erro:", err);
      }
    }
    
    carregarTemaDinâmico();
  }, []);

  if (checkingAuth) return null;

  return (
    <QueryClientProvider client={queryClientInstance}>
      <Router>
        <AppRoutes isAuthorized={isAuthorized} onLogin={() => setIsAuthorized(true)} st={st} />
      </Router>
      <Toaster />
    </QueryClientProvider>
  );
}