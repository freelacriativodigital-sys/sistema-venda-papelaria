import { useState, useEffect } from "react";
import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { pagesConfig } from './pages.config'
import { BrowserRouter as Router, Route, Routes, Link, useLocation, useParams } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import Login from '@/components/tasks/Login';
import { Reorder, useDragControls } from "framer-motion"; 
import { 
  Home, Package, MessageCircle, LogOut, 
  ChevronRight, Users, ShoppingBag, Settings, Globe, GripVertical, FileText,
  Image, Upload, Link as LinkIcon, RefreshCcw, Palette, Calculator 
} from "lucide-react";

import { supabase } from "./lib/supabase"; 
import BriefingPublico from './pages/BriefingPublico'; 

// === IMPORTAÇÃO DA PÁGINA DE ENTREGA (ISSO FAZ A MÁGICA ACONTECER) ===
import EntregaCliente from './pages/EntregaCliente';

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

const Sidebar = ({ st, isOpen, setIsOpen, onLogoUpload }) => {
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
      "links": { path: "/links", icon: Globe },
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
        console.error("Erro ao carregar ordem do menu:", err);
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
      localStorage.removeItem("criarte_menu_order_v3");
      window.location.reload();
    } catch (err) {
      console.error(err);
      window.location.reload();
    }
  };

  return (
    <div className={`fixed left-0 top-0 h-screen w-64 bg-white border-r border-slate-200 flex flex-col z-[100] transition-transform duration-300 ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
      
      <div className="flex justify-center items-center py-4 border-b border-slate-100 mb-4 min-h-[120px] relative group cursor-pointer overflow-hidden">
        <input 
          type="file" 
          accept="image/*" 
          onChange={onLogoUpload} 
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20" 
          title="Clique para alterar a logo"
        />
        
        {st.logoUrl ? (
          <img 
            src={st.logoUrl} 
            alt="Logo" 
            className="max-h-24 max-w-[85%] object-contain group-hover:opacity-30 transition-opacity" 
          />
        ) : (
          <div className="flex flex-col items-center text-slate-300 group-hover:text-blue-500 transition-colors">
            <Image size={24} />
            <span className="text-[10px] font-bold uppercase mt-1">Add Logo</span>
          </div>
        )}
        
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-10">
          <Upload size={28} className="text-slate-700" />
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto no-scrollbar flex flex-col">
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
        
        <div className="px-5 mt-4">
          <a href="/" target="_blank" className="flex items-center justify-center gap-2 p-3 rounded-lg font-bold uppercase text-[10px] text-emerald-600 hover:bg-emerald-50 transition-all border border-emerald-100 w-full">
            <Globe size={14} /> Ver Site do Cliente
          </a>
        </div>
      </nav>

      <div className="p-4 border-t border-slate-100 flex flex-col gap-2">
        <button onClick={forcarResetDoMenu}
          className="flex items-center justify-center gap-2 w-full p-2.5 rounded-lg text-slate-400 font-bold uppercase text-[9px] hover:bg-slate-50 transition-colors">
          <RefreshCcw size={12} /> Restaurar Menu Padrão
        </button>
        <button onClick={() => { localStorage.removeItem("criarte_auth"); window.location.reload(); }} 
          className="flex items-center justify-center gap-2 w-full p-3 rounded-lg border border-red-100 bg-red-50 text-red-500 font-bold uppercase text-[10px] hover:bg-red-100 transition-colors">
          <LogOut size={14} /> Sair do Sistema
        </button>
      </div>
    </div>
  );
};

const LayoutWrapper = ({ children, currentPageName, st, Layout, onLogoUpload }) => {
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

      <Sidebar st={st} isOpen={isMobileMenuOpen} setIsOpen={setIsMobileMenuOpen} onLogoUpload={onLogoUpload} />
      
      <main className="flex-1 ml-0 md:ml-64 p-4 md:p-8 overflow-y-auto w-full transition-all duration-300">
        {Layout ? <Layout currentPageName={currentPageName}>{children}</Layout> : children}
      </main>
    </div>
  );
};

const RedirecionadorDrive = () => {
  const { slug } = useParams();
  const [erro, setErro] = useState(false);

  useEffect(() => {
    async function buscarLink() {
      try {
        const { data, error } = await supabase
          .from('encurtador')
          .select('*')
          .eq('slug', slug)
          .single();

        if (data && data.url_destino) {
          await supabase.from('encurtador').update({ cliques: (data.cliques || 0) + 1 }).eq('id', data.id);
          window.location.href = data.url_destino;
        } else {
          setErro(true);
        }
      } catch (err) {
        setErro(true);
      }
    }
    buscarLink();
  }, [slug]);

  if (erro) return <PageNotFound />;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 gap-4">
      <div className="w-10 h-10 border-4 border-slate-200 border-t-blue-600 rounded-full animate-spin"></div>
      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Acessando Arquivos...</p>
    </div>
  );
};

const AppRoutes = ({ isAuthorized, onLogin, st, onLogoUpload }) => {
  const location = useLocation();
  const { Pages, Layout, mainPage } = pagesConfig;
  const { isLoadingAuth, isLoadingPublicSettings, authError } = useAuth();
  
  // === CONFIGURAÇÃO: LIBERA A ROTA DE ENTREGA PARA O CLIENTE ABRIR SEM LOGIN ===
  const isVitrine = location.pathname === '/' || location.pathname === '/vitrine';
  const isBriefingClient = location.pathname.startsWith('/briefing/');
  const isEntregaClient = location.pathname.startsWith('/entrega/'); 
  
  const mainPageKey = mainPage !== undefined ? mainPage : (Pages[""] !== undefined ? "" : Object.keys(Pages || {})[0]);
  const MainPage = Pages[mainPageKey];
  const VitrinePage = Pages["catalogo"];
  const BioPage = Pages["minhabio"]; 

  // LIBERA O ACESSO PARA ROTAS PÚBLICAS
  if (!isVitrine && !isBriefingClient && !isEntregaClient && !isAuthorized && !location.pathname.match(/^\/[^/]+$/)) return <Login onLogin={onLogin} />;
  
  if (isLoadingPublicSettings || isLoadingAuth) return <div className="fixed inset-0 flex items-center justify-center bg-slate-50"><div className="w-8 h-8 border-4 border-slate-200 border-t-blue-600 rounded-full animate-spin"></div></div>;
  if (authError && !isVitrine && authError.type === 'user_not_registered') return <UserNotRegisteredError />;

  return (
    <Routes>
      <Route path="/" element={VitrinePage ? <VitrinePage isPublic={true} /> : <PageNotFound />} />
      <Route path="/vitrine" element={VitrinePage ? <VitrinePage isPublic={true} /> : <PageNotFound />} />
      <Route path="/bio" element={BioPage ? <BioPage isPublic={true} /> : <PageNotFound />} />
      
      <Route path="/briefing/:slug" element={<BriefingPublico />} />
      
      {/* === ROTA DA ENTREGA REGISTRADA AQUI! === */}
      <Route path="/entrega/:driveFolderId" element={<EntregaCliente />} />
      
      <Route path="/app" element={<LayoutWrapper currentPageName={mainPageKey} st={st} Layout={Layout} onLogoUpload={onLogoUpload}>{MainPage ? <MainPage isPublic={false} /> : <PageNotFound />}</LayoutWrapper>} />

      {Pages && Object.entries(Pages).map(([path, PageComponent]) => (
        path !== "" && path !== mainPageKey && path !== "vitrine" && path !== "bio" && ( 
          <Route key={path} path={`/${path}`} element={<LayoutWrapper currentPageName={path} st={st} Layout={Layout} onLogoUpload={onLogoUpload}><PageComponent isPublic={false} /></LayoutWrapper>} />
        )
      ))}
      
      <Route path="/:slug" element={<RedirecionadorDrive />} />
      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
};

export default function App() {
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [st, setSt] = useState({ nomeLoja: 'Criarte', corPrincipal: '#f472b6', logoUrl: '' });
  
  useEffect(() => {
    const auth = localStorage.getItem("criarte_auth");
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
            nomeLoja: data.nome_loja || 'Criarte', 
            corPrincipal: data.cor_orcamento || '#f472b6',
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

  const handleLogoUpload = async (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64Logo = reader.result;
        setSt(prev => ({ ...prev, logoUrl: base64Logo }));
        await supabase.from('configuracoes').update({ logo_url: base64Logo }).eq('id', 1);
      };
      reader.readAsDataURL(file);
    }
  };

  if (checkingAuth) return null;
  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router><AppRoutes isAuthorized={isAuthorized} onLogin={() => setIsAuthorized(true)} st={st} onLogoUpload={handleLogoUpload} /></Router>
        <Toaster />
      </QueryClientProvider>
    </AuthProvider>
  );
}