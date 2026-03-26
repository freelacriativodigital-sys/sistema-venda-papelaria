import { useState, useEffect } from "react";
import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { pagesConfig } from './pages.config'
import { BrowserRouter as Router, Route, Routes, Link, useLocation, Navigate } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';

import Login from '@/components/tasks/Login';

import { 
  Home, Package, MessageCircle, LogOut, 
  ChevronRight, Users, ShoppingBag, Settings, Globe, FileText,
  Link as LinkIcon, Palette, Calculator, ShieldCheck, Key, Link2, Link2 as Link2Icon
} from "lucide-react";

import { supabase } from "./lib/supabase"; 
import BriefingPublico from './pages/BriefingPublico'; 

// ================= MENU =================

const MenuItem = ({ item, isActive, path, Icon, colorPrincipal, onClick }) => {
  return (
    <Link to={path} onClick={onClick}
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

// ================= SIDEBAR =================

const Sidebar = ({ st, isOpen, setIsOpen }) => {
  const location = useLocation();
  const categorias = pagesConfig.menuCategorias;

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
    };
    return meta[id] || { path: `/${id}`, icon: Package };
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.reload();
  };

  return (
    <div className={`fixed left-0 top-0 h-screen w-64 bg-white border-r border-slate-200 flex flex-col z-[100]`}>
      <div className="flex justify-center items-center h-24 border-b border-slate-100 shrink-0 px-6">
        {st.logoUrl ? <img src={st.logoUrl} alt="Logo" className="max-h-12" /> : <span>{st.nomeLoja}</span>}
      </div>

      <nav className="flex-1 overflow-y-auto px-4 pt-6 space-y-6">
        {categorias.map((categoria, idx) => (
          <div key={idx} className="space-y-1">
            <h4 className="text-xs font-bold text-slate-400">{categoria.titulo}</h4>
            {categoria.items.map((item) => {
              const { path, icon } = getMenuMeta(item.id);
              return <MenuItem key={item.id} item={item} path={path} Icon={icon} isActive={location.pathname === path} colorPrincipal={st.corPrincipal} />;
            })}
          </div>
        ))}
      </nav>

      <div className="p-4 border-t">
        <button onClick={handleLogout} className="w-full bg-red-500 text-white p-2 rounded">
          <LogOut size={14} /> Sair
        </button>
      </div>
    </div>
  );
};

// ================= ROTAS =================

const AppRoutes = ({ session, st }) => {
  const location = useLocation();
  const { Pages, Layout, mainPage } = pagesConfig;

  const isVitrine = location.pathname === '/' || location.pathname === '/vitrine';

  // 🔒 PROTEÇÃO REAL
  if (!isVitrine && !session) {
    return <Login />;
  }

  const MainPage = Pages[mainPage];

  return (
    <Routes>
      <Route path="/" element={<div>Vitrine</div>} />
      <Route path="/app" element={<MainPage />} />
      {Object.entries(Pages).map(([path, PageComponent]) => (
        <Route key={path} path={`/${path}`} element={<PageComponent />} />
      ))}
      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
};

// ================= APP =================

export default function App() {
  const [session, setSession] = useState(null);
  const [st, setSt] = useState({ nomeLoja: 'Minha Loja', corPrincipal: '#33BEE8', logoUrl: '' });

  useEffect(() => {
    // pegar sessão atual
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    // escutar login/logout
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  return (
    <QueryClientProvider client={queryClientInstance}>
      <Router>
        <AppRoutes session={session} st={st} />
      </Router>
      <Toaster />
    </QueryClientProvider>
  );
}