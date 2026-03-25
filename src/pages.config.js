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
  },

  menuCategorias: [
    {
      titulo: "Gestão Diária",
      items: [
        { id: "", label: "Visão Geral", roles: ['admin'] }, // <-- AGORA É SÓ ADMIN
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
      ]
    }
  ],
  mainPage: ""
};