import Home from './pages/Home';
import Pedidos from './pages/Pedidos'; 
import Produtos from './pages/Produtos';
import Whatsapp from './pages/Whatsapp';
import Clientes from './pages/Clientes';
import Catalogo from './pages/Catalogo';
import Orcamentos from './pages/Orcamentos';
import Despesas from './pages/Despesas';
import LinkBio from './pages/LinkBio'; 
import Briefings from './pages/Briefings'; 
import Precificacao from './pages/Precificacao'; 
import Seguranca from './pages/Seguranca';

// Importação das páginas Master
import Assinantes from './pages/Assinantes';
import Links from './pages/Links';

const isMaster = import.meta.env.VITE_APP_IS_MASTER === 'true';

export const pagesConfig = {
  Pages: {
    "": Home, 
    "pedidos": Pedidos, 
    "produtos": Produtos,
    "whatsapp": Whatsapp,
    "clientes": Clientes,
    "orcamentos": Orcamentos,
    "despesas": Despesas,
    "catalogo": Catalogo,
    "minhabio": LinkBio, 
    "briefings": Briefings, 
    "precificacao": Precificacao,
    "seguranca": Seguranca,
    // Rotas master só entram no objeto se for a sua Vercel
    ...(isMaster && { 
        "assinantes": Assinantes, 
        "links": Links 
    })
  },

  menuCategorias: [
    {
      titulo: "Gestão Diária",
      items: [
        { id: "", label: "Visão Geral", roles: ['admin'] }, 
        { id: "pedidos", label: "Painel de Pedidos", roles: ['admin', 'padrao'] }, 
        { id: "clientes", label: "Meus Clientes", roles: ['admin', 'padrao'] },
      ]
    },
    {
      titulo: "Financeiro & Vendas",
      items: [
        { id: "orcamentos", label: "Orçamentos", roles: ['admin', 'padrao'] },
        { id: "despesas", label: "Despesas", roles: ['admin'] }, 
        { id: "precificacao", label: "Calculadora de Preços", roles: ['admin'] }, 
      ]
    },
    {
      titulo: "Catálogo Online",
      items: [
        { id: "produtos", label: "Meus Produtos", roles: ['admin', 'padrao'] },
        { id: "catalogo", label: "Vitrine (Catálogo)", roles: ['admin', 'padrao'] },
        { id: "minhabio", label: "Link na Bio", roles: ['admin', 'padrao'] }, 
      ]
    },
    {
      titulo: "Atendimento",
      items: [
        { id: "briefings", label: "Briefings", roles: ['admin', 'padrao'] }, 
        { id: "whatsapp", label: "WhatsApp", roles: ['admin', 'padrao'] },
      ]
    },
    {
      titulo: "Sistema",
      items: [
        { id: "seguranca", label: "Segurança e Acesso", roles: ['admin'] }, 
        // Menu Master só é adicionado se for a sua Vercel
        ...(isMaster ? [
          { id: "assinantes", label: "Assinantes SaaS", roles: ['admin'] },
          { id: "links", label: "Links e Portais", roles: ['admin'] }
        ] : [])
      ]
    }
  ],
  mainPage: ""
};