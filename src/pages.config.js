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
  },

  menuOrder: [
    { id: "", label: "Visão Geral" }, 
    { id: "pedidos", label: "Pedidos (To-Do)" }, 
    { id: "clientes", label: "Clientes" },
    { id: "orcamentos", label: "Orçamentos" },
    { id: "despesas", label: "Despesas" },
    { id: "produtos", label: "Produtos" },
    { id: "precificacao", label: "Precificação" },
    { id: "whatsapp", label: "WhatsApp" },
    { id: "catalogo", label: "Catálogo" },
    { id: "briefings", label: "Briefings" }, 
    { id: "minhabio", label: "Link na Bio" }, 
  ],
  mainPage: ""
};