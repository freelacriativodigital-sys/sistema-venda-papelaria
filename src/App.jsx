import { useState, useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClientInstance } from '@/lib/query-client';
import { pagesConfig } from './pages.config';
import { BrowserRouter as Router, Route, Routes, Link, useLocation, Navigate } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';

import Login from '@/components/tasks/Login';

import {
  Home, Package, MessageCircle, LogOut,
  ChevronRight, ChevronLeft, Users, ShoppingBag, Settings, Globe, FileText,
  Link as LinkIcon, Palette, Calculator, ShieldCheck, Key, Link2, Link2 as Link2Icon, Wallet
} from "lucide-react";

import { supabase } from "./lib/supabase";
import BriefingPublico from './pages/BriefingPublico';

const MenuItem = ({ item, isActive, path, Icon, colorPrincipal, onClick }) => {
  return (
    <Link
      to={path}
      onClick={onClick}
      className={`flex items-center justify-between px-3 py-2.5 rounded-lg font-bold uppercase text-[10.5px] tracking-tight transition-all ${
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

const Sidebar = ({ st, isOpen, setIsOpen }) => {
  const location = useLocation();
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
      "assinantes": { path: "/assinantes", icon: Key },
      "links": { path: "/links", icon: Link2Icon },
      "caixa": { path: "/caixa", icon: Wallet },
    };
    return meta[id] || { path: `/${id}`, icon: Package };
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
    } catch (error) {
      console.error('Erro ao sair do sistema:', error);
    } finally {
      localStorage.removeItem("sistema_auth");
      localStorage.removeItem("sistema_auth_time");
      localStorage.removeItem("sistema_user_role");
      window.location.reload();
    }
  };

  return (
    <div className={`fixed left-0 top-0 h-screen w-64 bg-white border-r border-slate-200 flex flex-col z-[100] transition-transform duration-300 shadow-[10px_0_30px_rgba(0,0,0,0.05)] ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
      
      <div className="flex justify-between items-center h-24 border-b border-slate-100 shrink-0 px-4 relative">
        <div className="flex-1 flex justify-center">
          <img 
            src="https://yjfvdmpsnpvrpskmqrjt.supabase.co/storage/v1/object/public/produtos/LOGO%20ORGANIZE.png" 
            alt="Logo Organize" 
            className="max-h-14 w-auto object-contain drop-shadow-sm" 
          />
        </div>
        {/* Botão extra para fechar o menu dentro dele mesmo */}
        <button onClick={() => setIsOpen(false)} className="absolute right-3 p-1.5 rounded-md hover:bg-slate-100 text-slate-400 transition-colors">
           <ChevronLeft size={18} />
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto no-scrollbar flex flex-col pt-6 pb-4 px-4 space-y-6">
        {categorias.map((categoria, idx) => {
          const filteredItems = categoria.items.filter(item => item.roles.includes(userRole));
          if (filteredItems.length === 0) return null;

          return (
            <div key={idx} className="space-y-1">
              <h4 className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-2 px-3">
                {categoria.titulo}
              </h4>
              <div className="space-y-1">
                {filteredItems.map((item) => {
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
              </div>
            </div>
          );
        })}

        <div className="pt-4 mt-2 border-t border-slate-100 space-y-2">
          <a
            href="/"
            target="_blank"
            rel="noreferrer"
            className="flex items-center justify-center gap-2 p-3 rounded-lg font-bold uppercase text-[10px] text-emerald-600 hover:bg-emerald-50 transition-all border border-emerald-100 w-full"
          >
            <Globe size={14} /> Ver Site do Cliente
          </a>
          <a
            href="/bio"
            target="_blank"
            rel="noreferrer"
            className="flex items-center justify-center gap-2 p-3 rounded-lg font-bold uppercase text-[10px] text-pink-600 hover:bg-pink-50 transition-all border border-pink-100 w-full"
          >
            <LinkIcon size={14} /> Ver Link da Bio
          </a>
        </div>
      </nav>

      <div className="p-4 border-t border-slate-100 flex flex-col gap-2 shrink-0">
        <button
          onClick={handleLogout}
          className="flex items-center justify-center gap-2 w-full p-3 rounded-lg border border-red-100 bg-red-50 text-red-500 font-bold uppercase text-[10px] hover:bg-red-100 transition-colors"
        >
          <LogOut size={14} /> Sair do Sistema
        </button>
      </div>
    </div>
  );
};

const LayoutWrapper = ({ children, currentPageName, st, Layout }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-[#f8fafc] text-slate-900 relative overflow-x-hidden">
      
      {/* OVERLAY ESCURO: Fica visível em TODAS as telas quando o menu abrir */}
      {isMobileMenuOpen && (
        <div
          onClick={() => setIsMobileMenuOpen(false)}
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[90] transition-opacity"
        />
      )}

      {/* PUXADOR DO MENU: Fica visível sempre que o menu estiver fechado */}
      {!isMobileMenuOpen && (
        <button
          onClick={() => setIsMobileMenuOpen(true)}
          className="fixed left-0 top-1/2 -translate-y-1/2 z-[80] bg-white text-slate-800 p-1.5 py-6 rounded-r-xl shadow-[4px_0_15px_rgba(0,0,0,0.06)] border border-l-0 border-slate-200 hover:bg-slate-50 hover:pr-4 hover:shadow-md transition-all flex items-center justify-center group"
        >
          <ChevronRight size={24} className="text-slate-400 group-hover:text-blue-600 transition-colors" />
        </button>
      )}

      <Sidebar 
        st={st} 
        isOpen={isMobileMenuOpen} 
        setIsOpen={setIsMobileMenuOpen} 
      />

      {/* CONTEÚDO PRINCIPAL: Agora usa 100% da largura e não tem margem esquerda */}
      <main className="flex-1 ml-0 w-full overflow-y-auto transition-all duration-300">
        {Layout ? <Layout currentPageName={currentPageName}>{children}</Layout> : children}
      </main>
    </div>
  );
};

const AppRoutes = ({ isAuthorized, onLogin, st }) => {
  const location = useLocation();
  const { Pages, Layout, mainPage } = pagesConfig;

  const pathNormalizado = location.pathname.toLowerCase();
  
  const isVitrine = pathNormalizado === '/' || pathNormalizado === '/vitrine';
  const isBriefingClient = pathNormalizado.startsWith('/form/');
  const isEntregaPortal = pathNormalizado.startsWith('/entrega/');
  const isBio = pathNormalizado === '/bio';
  const userRole = localStorage.getItem('sistema_user_role') || 'padrao';

  const mainPageKey = mainPage !== undefined ? mainPage : (Pages[""] !== undefined ? "" : Object.keys(Pages || {})[0]);
  const MainPage = Pages[mainPageKey];
  const VitrinePage = Pages["catalogo"];
  const BioPage = Pages["minhabio"];
  const EntregaPage = Pages["entrega/:driveFolderId"];

  if (!isVitrine && !isBriefingClient && !isEntregaPortal && !isBio && !isAuthorized) {
    return <Login onLogin={onLogin} />;
  }

  const paginasProibidasParaPadrao = ['/app', '/despesas', '/precificacao', '/configuracoes', '/assinantes', '/links', '/caixa'];
  if (userRole === 'padrao' && paginasProibidasParaPadrao.includes(location.pathname)) {
    return <Navigate to="/pedidos" replace />;
  }

  return (
    <Routes>
      <Route path="/" element={VitrinePage ? <VitrinePage isPublic={true} /> : <PageNotFound />} />
      <Route path="/vitrine" element={VitrinePage ? <VitrinePage isPublic={true} /> : <PageNotFound />} />
      <Route path="/bio" element={BioPage ? <BioPage isPublic={true} /> : <PageNotFound />} />
      <Route path="/form/:slug" element={<BriefingPublico />} />
      
      <Route path="/entrega/:driveFolderId" element={EntregaPage ? <EntregaPage isPublic={true} /> : <PageNotFound />} />

      <Route
        path="/app"
        element={
          <LayoutWrapper currentPageName={mainPageKey} st={st} Layout={Layout}>
            {MainPage ? <MainPage isPublic={false} /> : <PageNotFound />}
          </LayoutWrapper>
        }
      />

      {Pages && Object.entries(Pages).map(([path, PageComponent]) => (
        path !== "" && path !== mainPageKey && path !== "vitrine" && path !== "bio" && !path.toLowerCase().startsWith("entrega/") && (
          <Route
            key={path}
            path={`/${path}`}
            element={
              <LayoutWrapper currentPageName={path} st={st} Layout={Layout}>
                <PageComponent isPublic={false} />
              </LayoutWrapper>
            }
          />
        )
      ))}

      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
};

export default function App() {
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [st, setSt] = useState({ nomeLoja: 'Portal Criarte', corPrincipal: '#33BEE8', logoUrl: '' });

  useEffect(() => {
    const verificarSessao = async () => {
      try {
        const { data, error } = await supabase.auth.getSession();

        if (error || !data.session) {
          localStorage.removeItem('sistema_user_role');
          localStorage.removeItem('sistema_auth');
          setIsAuthorized(false);
        } else {
          setIsAuthorized(true);
          localStorage.setItem('sistema_user_role', 'admin');
          localStorage.setItem('sistema_auth', 'true');
        }
      } catch (err) {
        console.error('Erro de sessão:', err);
        setIsAuthorized(false);
      } finally {
        setCheckingAuth(false);
      }
    };

    verificarSessao();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      const temSessao = !!session;
      setIsAuthorized(temSessao);

      if (temSessao) {
        localStorage.setItem('sistema_user_role', 'admin');
      } else {
        localStorage.removeItem('sistema_user_role');
      }

      setCheckingAuth(false);
    });

    async function carregarTemaDinamico() {
      try {
        const { data, error } = await supabase.from('configuracoes').select('*').eq('id', 1).single();
        if (data && !error) {
          setSt({
            nomeLoja: data.nome_loja || 'Portal Criarte',
            corPrincipal: data.cor_orcamento || '#33BEE8',
            logoUrl: data.logo_url || ''
          });

          const root = document.documentElement;
          if (data.cor_orcamento) root.style.setProperty('--brand-color', data.cor_orcamento);
          if (data.cor_nome_empresa) root.style.setProperty('--brand-dark', data.cor_nome_empresa);
        }
      } catch (err) {
        console.error('Erro ao carregar tema dinâmico:', err);
      }
    }

    carregarTemaDinamico();

    return () => {
      subscription.unsubscribe();
    };
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