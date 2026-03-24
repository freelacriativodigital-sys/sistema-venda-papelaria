import React, { useState, useEffect } from "react";
// --- LIGAÇÃO REAL AO SUPABASE ---
import { supabase } from "../lib/supabase";
import { useQuery } from "@tanstack/react-query";
import { 
  MessageCircle, Copy, ExternalLink, Trash2, 
  Smartphone, Search, UserSquare2, Zap, Check, Edit3, Settings
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export default function Whatsapp() {
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");
  const [copied, setCopied] = useState(false);
  const [copiedTemplateId, setCopiedTemplateId] = useState(null); // <-- Estado novo para o feedback visual da cópia
  
  const [buscaCliente, setBuscaCliente] = useState("");
  const [mostrarDropdown, setMostrarDropdown] = useState(false);
  
  // --- ESTADOS PARA O GERENCIADOR DE TEMPLATES ---
  const [templates, setTemplates] = useState(() => {
    const saved = localStorage.getItem("app_wa_templates");
    return saved ? JSON.parse(saved) : [
      { id: 1, titulo: "Boas-vindas", texto: "Olá! Tudo bem? Como posso te ajudar hoje?" },
      { id: 2, titulo: "Pedido Pronto", texto: "Oie! Passando para avisar que o seu pedido já está pronto e embalado com muito carinho. Quando desejar, já pode vir retirar/solicitar o envio!" },
      { id: 3, titulo: "Chave Pix", texto: "Segue a nossa chave PIX para pagamento: [SUA CHAVE AQUI]. Assim que realizar a transferência, me envia o comprovante por favor!" },
      { id: 4, titulo: "Aprovação de Arte", texto: "Olá! Segue a prévia da sua arte para aprovação. Por favor, confira todos os detalhes (nomes, datas, cores) antes de iniciarmos a produção." }
    ];
  });

  const [editId, setEditId] = useState(null);
  const [tempTitulo, setTempTitulo] = useState("");
  const [tempTexto, setTempTexto] = useState("");

  // Salva os templates no LocalStorage sempre que houver alteração
  useEffect(() => {
    localStorage.setItem("app_wa_templates", JSON.stringify(templates));
  }, [templates]);

  // --- LER CLIENTES PARA BUSCA ---
  const { data: clientes = [] } = useQuery({
    queryKey: ["app-clientes"],
    queryFn: async () => {
      const { data, error } = await supabase.from("clientes").select("*").order("nome", { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  const cleanPhone = phone.replace(/\D/g, "");
  const finalLink = cleanPhone 
    ? `https://wa.me/55${cleanPhone}${message ? `?text=${encodeURIComponent(message)}` : ""}`
    : "";

  const handleCopyLink = () => {
    if (!finalLink) return;
    navigator.clipboard.writeText(finalLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // --- FUNÇÃO PARA COPIAR A MENSAGEM RÁPIDA ---
  const handleCopyTemplate = (tpl) => {
    navigator.clipboard.writeText(tpl.texto);
    setCopiedTemplateId(tpl.id);
    setTimeout(() => setCopiedTemplateId(null), 2000); // Tira o aviso de "Copiado" depois de 2 segundos
  };

  const selecionarCliente = (cli) => {
    setPhone(cli.whatsapp);
    setBuscaCliente(cli.nome);
    setMostrarDropdown(false);
  };

  // --- FUNÇÕES DO GERENCIADOR DE TEMPLATES ---
  const salvarTemplate = () => {
    if (!tempTitulo.trim() || !tempTexto.trim()) return alert("Preencha o título e o texto da mensagem.");
    
    if (editId) {
      setTemplates(templates.map(t => t.id === editId ? { ...t, titulo: tempTitulo, texto: tempTexto } : t));
    } else {
      setTemplates([...templates, { id: Date.now(), titulo: tempTitulo, texto: tempTexto }]);
    }
    
    setEditId(null);
    setTempTitulo("");
    setTempTexto("");
  };

  const cancelarEdicao = () => {
    setEditId(null);
    setTempTitulo("");
    setTempTexto("");
  };

  const excluirTemplate = (id) => {
    if (window.confirm("Tem certeza que deseja excluir esta mensagem rápida?")) {
      setTemplates(templates.filter(t => t.id !== id));
      if (editId === id) cancelarEdicao();
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-6 md:pt-8 animate-in fade-in">
        
        {/* CABEÇALHO */}
        <div className="flex items-center gap-3 mb-6 md:mb-8 bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="w-12 h-12 md:w-14 md:h-14 bg-emerald-500 rounded-lg flex items-center justify-center text-white shadow-sm">
            <MessageCircle size={24} />
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-bold uppercase text-slate-800 tracking-tight">WhatsApp Central</h1>
            <p className="text-[10px] md:text-xs font-semibold text-slate-500 uppercase tracking-widest mt-0.5">Gerador de Links e Mensagens Rápidas</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* COLUNA ESQUERDA: CRIAR LINK E USAR TEMPLATES */}
          <div className="lg:col-span-6 space-y-6">
            
            {/* CARD: GERADOR DE LINK */}
            <div className="bg-white border border-slate-200 rounded-xl p-5 md:p-6 shadow-sm">
              <h3 className="text-xs font-semibold uppercase text-slate-700 tracking-widest border-b border-slate-100 pb-3 flex items-center gap-1.5 mb-5">
                <Smartphone size={16} className="text-blue-500"/> Destinatário
              </h3>
              
              <div className="space-y-4">
                
                {/* BUSCA DE CLIENTES */}
                <div className="space-y-1.5 relative">
                  <label className="text-[10px] font-semibold uppercase text-slate-500 ml-0.5">Buscar Cliente Cadastrado</label>
                  <div className="relative">
                    <UserSquare2 className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                    <Input 
                      placeholder="Digite o nome..." 
                      value={buscaCliente}
                      onChange={(e) => {
                        setBuscaCliente(e.target.value);
                        setMostrarDropdown(true);
                      }}
                      onFocus={() => setMostrarDropdown(true)}
                      onBlur={() => setTimeout(() => setMostrarDropdown(false), 200)}
                      className="h-11 md:h-10 pl-9 border-slate-200 rounded-md font-medium text-xs md:text-sm bg-slate-50 focus:bg-white"
                    />
                    {mostrarDropdown && buscaCliente && (
                      <div className="absolute top-12 left-0 right-0 bg-white border border-slate-200 rounded-md shadow-lg max-h-48 overflow-y-auto z-50 p-1.5">
                        {clientes.filter(c => c.nome.toLowerCase().includes(buscaCliente.toLowerCase())).map(cli => (
                          <div 
                            key={cli.id} 
                            onMouseDown={() => selecionarCliente(cli)} 
                            className="p-2 hover:bg-slate-50 rounded-md cursor-pointer flex flex-col transition-colors"
                          >
                            <span className="text-xs font-semibold text-slate-800 uppercase">{cli.nome}</span>
                            <span className="text-[9px] font-medium text-slate-500">{cli.whatsapp || 'Sem número'}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-semibold uppercase text-slate-500 ml-0.5">Número de Telefone</label>
                  <Input 
                    placeholder="(00) 00000-0000" 
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="h-11 md:h-10 border-slate-200 rounded-md font-semibold text-slate-800 bg-slate-50 focus:bg-white"
                  />
                </div>

                <div className="space-y-1.5 pt-2">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] font-semibold uppercase text-slate-500 ml-0.5">Mensagem (Opcional)</label>
                    <button onClick={() => setMessage('')} className="text-[9px] font-semibold text-blue-500 uppercase hover:underline">Limpar</button>
                  </div>
                  <Textarea 
                    placeholder="Escreva a mensagem ou clique em uma mensagem rápida abaixo..." 
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    className="min-h-[120px] rounded-md border-slate-200 shadow-sm font-medium text-slate-700 p-3 text-xs md:text-sm bg-slate-50 focus:bg-white resize-none"
                  />
                </div>

                <div className="flex gap-2 pt-2">
                  <Button 
                    onClick={handleCopyLink}
                    disabled={!finalLink}
                    className={`flex-1 h-12 md:h-10 rounded-md font-semibold uppercase text-xs transition-colors shadow-sm ${
                      copied ? "bg-emerald-500 hover:bg-emerald-600" : "bg-emerald-600 hover:bg-emerald-700"
                    } text-white`}
                  >
                    {copied ? <><Check size={16} className="mr-1.5"/> Copiado</> : "Copiar Link Seguro"}
                  </Button>
                  <Button 
                    onClick={() => window.open(finalLink, "_blank")}
                    disabled={!finalLink}
                    variant="outline"
                    className="h-12 w-12 md:h-10 md:w-10 rounded-md border-slate-200 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 shrink-0"
                  >
                    <ExternalLink size={18} />
                  </Button>
                </div>
              </div>
            </div>

            {/* CARD: MENSAGENS RÁPIDAS (BOTÕES) */}
            <div className="bg-white border border-slate-200 rounded-xl p-5 md:p-6 shadow-sm">
              <h3 className="text-xs font-semibold uppercase text-slate-700 tracking-widest border-b border-slate-100 pb-3 flex items-center justify-between mb-4">
                <span className="flex items-center gap-1.5"><Zap size={16} className="text-amber-500"/> Respostas Prontas</span>
                <span className="text-[9px] font-bold text-slate-400">Clique para copiar o texto</span>
              </h3>
              {templates.length === 0 ? (
                <p className="text-[10px] font-medium text-slate-400 uppercase text-center py-2">Nenhuma mensagem cadastrada.</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                   {templates.map((tpl) => (
                     <button 
                       key={tpl.id}
                       onClick={() => handleCopyTemplate(tpl)}
                       className={`text-left p-3 rounded-md border transition-all flex flex-col gap-1 group relative ${
                         copiedTemplateId === tpl.id 
                          ? 'border-emerald-300 bg-emerald-50' 
                          : 'border-slate-200 hover:border-blue-300 hover:bg-blue-50 bg-slate-50'
                       }`}
                     >
                       <div className="flex justify-between items-start w-full">
                         <span className={`text-[10px] font-semibold uppercase ${copiedTemplateId === tpl.id ? 'text-emerald-700' : 'text-slate-800 group-hover:text-blue-700'}`}>
                           {tpl.titulo}
                         </span>
                         {copiedTemplateId === tpl.id ? (
                           <Check size={14} className="text-emerald-500" />
                         ) : (
                           <Copy size={12} className="text-slate-400 group-hover:text-blue-500" />
                         )}
                       </div>
                       <span className={`text-[9px] font-medium line-clamp-2 leading-tight ${copiedTemplateId === tpl.id ? 'text-emerald-600' : 'text-slate-500'}`}>
                         {tpl.texto}
                       </span>
                     </button>
                   ))}
                </div>
              )}
            </div>

          </div>

          {/* COLUNA DIREITA: GERENCIADOR DE TEMPLATES */}
          <div className="lg:col-span-6">
            <div className="bg-white border border-slate-200 rounded-xl p-5 md:p-6 shadow-sm h-full min-h-[500px] flex flex-col">
              <h3 className="text-xs font-semibold uppercase text-slate-700 tracking-widest border-b border-slate-100 pb-3 flex items-center justify-between mb-5">
                <span className="flex items-center gap-1.5"><Settings size={16} className="text-purple-500"/> Gerenciar Mensagens</span>
                <span className="text-[9px] font-medium text-slate-400 bg-slate-100 px-2 py-0.5 rounded">{templates.length} salvas</span>
              </h3>

              {/* FORMULÁRIO DE EDIÇÃO/CRIAÇÃO */}
              <div className="bg-slate-50 p-4 rounded-md border border-slate-200 mb-5 space-y-3">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-semibold uppercase text-slate-500 ml-0.5">Título da Mensagem</label>
                  <Input 
                    value={tempTitulo} 
                    onChange={e => setTempTitulo(e.target.value)} 
                    placeholder="Ex: Chave Pix" 
                    className="h-10 md:h-9 text-xs font-medium bg-white rounded-md" 
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-semibold uppercase text-slate-500 ml-0.5">Texto Padrão</label>
                  <Textarea 
                    value={tempTexto} 
                    onChange={e => setTempTexto(e.target.value)} 
                    placeholder="Escreva o texto que será enviado..." 
                    className="min-h-[80px] text-xs font-medium bg-white resize-none rounded-md p-3" 
                  />
                </div>
                <div className="flex flex-col sm:flex-row gap-2 pt-1">
                  <Button 
                    onClick={salvarTemplate} 
                    className="flex-1 h-10 md:h-9 bg-purple-600 hover:bg-purple-700 text-white rounded-md font-semibold text-[10px] uppercase shadow-sm"
                  >
                    {editId ? "Atualizar Mensagem" : "Adicionar Nova Mensagem"}
                  </Button>
                  {editId && (
                    <Button 
                      variant="outline" 
                      onClick={cancelarEdicao} 
                      className="h-10 md:h-9 px-4 rounded-md font-semibold text-[10px] uppercase border-slate-200 text-slate-500 w-full sm:w-auto"
                    >
                      Cancelar
                    </Button>
                  )}
                </div>
              </div>

              {/* LISTA DE MENSAGENS */}
              <div className="flex-1 overflow-y-auto space-y-3 pr-1">
                {templates.length === 0 ? (
                  <div className="text-center py-10">
                    <p className="text-[10px] font-medium text-slate-400 uppercase">Use o formulário acima para criar suas mensagens.</p>
                  </div>
                ) : (
                  templates.map(tpl => (
                    <div key={tpl.id} className="border border-slate-200 rounded-md p-4 shadow-sm bg-white flex flex-col group hover:border-purple-200 transition-colors">
                      <div className="flex justify-between items-start mb-2">
                        <p className="text-xs font-bold text-slate-800 uppercase">{tpl.titulo}</p>
                        <div className="flex gap-1.5">
                          <button 
                            onClick={() => { 
                              setEditId(tpl.id); 
                              setTempTitulo(tpl.titulo); 
                              setTempTexto(tpl.texto); 
                              window.scrollTo({ top: 0, behavior: 'smooth' }); // Rola pra cima no mobile
                            }} 
                            className="text-slate-400 hover:text-blue-500 bg-slate-50 p-1.5 rounded transition-colors border border-slate-200"
                          >
                            <Edit3 size={12} />
                          </button>
                          <button 
                            onClick={() => excluirTemplate(tpl.id)} 
                            className="text-slate-400 hover:text-red-500 bg-slate-50 p-1.5 rounded transition-colors border border-slate-200"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </div>
                      <p className="text-[10px] text-slate-600 font-medium line-clamp-3 italic">"{tpl.texto}"</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}