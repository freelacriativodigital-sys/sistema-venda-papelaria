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
import Seguranca from './pages/Seguranca'; // <-- Nova página importada

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
    "seguranca": Seguranca, // <-- Rota de segurança adicionada
  },

  // NOVO MENU ORGANIZADO POR CATEGORIAS
  menuCategorias: [
    {
      titulo: "Gestão Diária",
      items: [
        { id: "", label: "Visão Geral" }, 
        { id: "pedidos", label: "Painel de Pedidos" }, 
        { id: "clientes", label: "Meus Clientes" },
      ]
    },
    {
      titulo: "Financeiro & Vendas",
      items: [
        { id: "orcamentos", label: "Orçamentos" },
        { id: "despesas", label: "Despesas" },
        { id: "precificacao", label: "Calculadora de Preços" },
      ]
    },
    {
      titulo: "Catálogo Online",
      items: [
        { id: "produtos", label: "Meus Produtos" },
        { id: "catalogo", label: "Vitrine (Catálogo)" },
        { id: "minhabio", label: "Link na Bio" }, 
      ]
    },
    {
      titulo: "Atendimento",
      items: [
        { id: "briefings", label: "Briefings" }, 
        { id: "whatsapp", label: "WhatsApp" },
      ]
    },
    {
      titulo: "Sistema",
      items: [
        { id: "seguranca", label: "Segurança e Acesso" },
      ]
    }
  ],
  mainPage: ""
};