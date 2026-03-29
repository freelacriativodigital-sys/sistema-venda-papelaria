import React, { useState, useEffect } from "react";
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
  const [copiedTemplateId, setCopiedTemplateId] = useState(null); 
  
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
    setTimeout(() => setCopiedTemplateId(null), 2000);
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
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 pb-20 relative">
      
      {/* HEADER FIXO ESTILO EXECUTIVO */}
      <div className="border-b border-slate-200 bg-white/90 backdrop-blur-md sticky top-0 z-10 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-3 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <h1 className="text-lg md:text-xl font-semibold text-slate-800 uppercase leading-none tracking-tight flex items-center gap-2">
              <MessageCircle className="w-5 h-5 text-emerald-500" /> WhatsApp
            </h1>
            <div className="h-6 w-px bg-slate-200 hidden md:block"></div>
            <p className="text-[9px] md:text-[10px] text-slate-500 font-medium uppercase tracking-widest hidden md:block mt-0.5">
              Links e Mensagens Rápidas
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 pt-5 animate-in fade-in">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 md:gap-5">
          
          {/* COLUNA ESQUERDA: CRIAR LINK E USAR TEMPLATES */}
          <div className="lg:col-span-6 space-y-4 md:space-y-5">
            
            {/* CARD: GERADOR DE LINK */}
            <div className="bg-white border border-slate-200 rounded-xl p-4 md:p-5 shadow-sm space-y-4">
              <h3 className="text-[11px] font-semibold uppercase text-slate-800 tracking-widest border-b border-slate-100 pb-2 flex items-center gap-1.5">
                <Smartphone size={14} className="text-blue-500"/> Destinatário
              </h3>
              
              <div className="space-y-3">
                {/* BUSCA DE CLIENTES */}
                <div className="space-y-1 relative">
                  <label className="text-[9px] font-semibold uppercase text-slate-500 ml-0.5 tracking-widest">Buscar Cliente Cadastrado</label>
                  <div className="relative">
                    <UserSquare2 className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                    <Input 
                      placeholder="Digite o nome..." 
                      value={buscaCliente}
                      onChange={(e) => {
                        setBuscaCliente(e.target.value);
                        setMostrarDropdown(true);
                      }}
                      onFocus={() => setMostrarDropdown(true)}
                      onBlur={() => setTimeout(() => setMostrarDropdown(false), 200)}
                      className="h-9 pl-8 border-slate-200 rounded-md font-medium text-xs bg-slate-50 focus:bg-white"
                    />
                    {mostrarDropdown && buscaCliente && (
                      <div className="absolute top-10 left-0 right-0 bg-white border border-slate-200 rounded-md shadow-lg max-h-48 overflow-y-auto z-50 p-1.5 space-y-0.5">
                        {clientes.filter(c => c.nome.toLowerCase().includes(buscaCliente.toLowerCase())).map(cli => (
                          <div 
                            key={cli.id} 
                            onMouseDown={() => selecionarCliente(cli)} 
                            className="p-2 hover:bg-slate-50 rounded-md cursor-pointer flex flex-col transition-colors"
                          >
                            <span className="text-[10px] font-semibold text-slate-800 uppercase">{cli.nome}</span>
                            <span className="text-[9px] font-medium text-slate-500">{cli.whatsapp || 'Sem número'}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] font-semibold uppercase text-slate-500 ml-0.5 tracking-widest">Número de Telefone</label>
                  <Input 
                    placeholder="(00) 00000-0000" 
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="h-9 border-slate-200 rounded-md font-semibold text-slate-800 bg-slate-50 focus:bg-white text-xs"
                  />
                </div>

                <div className="space-y-1 pt-1">
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[9px] font-semibold uppercase text-slate-500 ml-0.5 tracking-widest">Mensagem (Opcional)</label>
                    <button onClick={() => setMessage('')} className="text-[9px] font-semibold text-blue-500 uppercase hover:underline tracking-widest">Limpar</button>
                  </div>
                  <Textarea 
                    placeholder="Escreva a mensagem ou clique em uma resposta pronta abaixo..." 
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    className="min-h-[80px] rounded-md border-slate-200 shadow-sm font-medium text-slate-700 p-2.5 text-xs bg-slate-50 focus:bg-white resize-none"
                  />
                </div>

                <div className="flex gap-2 pt-1">
                  <Button 
                    onClick={handleCopyLink}
                    disabled={!finalLink}
                    className={`flex-1 h-9 rounded-md font-semibold uppercase text-[9px] tracking-widest transition-colors shadow-sm ${
                      copied ? "bg-emerald-500 hover:bg-emerald-600" : "bg-emerald-600 hover:bg-emerald-700"
                    } text-white`}
                  >
                    {copied ? <><Check size={14} className="mr-1.5"/> Copiado</> : "Copiar Link Seguro"}
                  </Button>
                  <Button 
                    onClick={() => window.open(finalLink, "_blank")}
                    disabled={!finalLink}
                    variant="outline"
                    className="h-9 w-9 p-0 rounded-md border-slate-200 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 shrink-0 transition-colors"
                  >
                    <ExternalLink size={14} />
                  </Button>
                </div>
              </div>
            </div>

            {/* CARD: MENSAGENS RÁPIDAS (BOTÕES) */}
            <div className="bg-white border border-slate-200 rounded-xl p-4 md:p-5 shadow-sm">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2 mb-3">
                <h3 className="text-[11px] font-semibold uppercase text-slate-800 tracking-widest flex items-center gap-1.5">
                  <Zap size={14} className="text-amber-500"/> Respostas Prontas
                </h3>
                <span className="text-[8px] font-semibold text-slate-400 uppercase tracking-widest">Clique para copiar</span>
              </div>

              {templates.length === 0 ? (
                <p className="text-[9px] font-medium text-slate-400 uppercase text-center py-4 tracking-widest">Nenhuma mensagem cadastrada.</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                   {templates.map((tpl) => (
                     <button 
                       key={tpl.id}
                       onClick={() => handleCopyTemplate(tpl)}
                       className={`text-left p-2.5 rounded-lg border transition-all flex flex-col gap-1 group relative shadow-sm ${
                         copiedTemplateId === tpl.id 
                          ? 'border-emerald-300 bg-emerald-50/50' 
                          : 'border-slate-200 hover:border-blue-300 hover:bg-blue-50/50 bg-slate-50/50'
                       }`}
                     >
                       <div className="flex justify-between items-start w-full">
                         <span className={`text-[9px] font-semibold uppercase tracking-widest ${copiedTemplateId === tpl.id ? 'text-emerald-700' : 'text-slate-800 group-hover:text-blue-700'}`}>
                           {tpl.titulo}
                         </span>
                         {copiedTemplateId === tpl.id ? (
                           <Check size={12} className="text-emerald-500" />
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
            <div className="bg-white border border-slate-200 rounded-xl p-4 md:p-5 shadow-sm h-full min-h-[400px] flex flex-col">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2 mb-4">
                <h3 className="text-[11px] font-semibold uppercase text-slate-800 tracking-widest flex items-center gap-1.5">
                  <Settings size={14} className="text-purple-500"/> Gerenciar Mensagens
                </h3>
                <span className="text-[8px] font-semibold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded-full uppercase tracking-widest">{templates.length} salvas</span>
              </div>

              {/* FORMULÁRIO DE EDIÇÃO/CRIAÇÃO */}
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 mb-4 space-y-2.5">
                <div className="space-y-1">
                  <label className="text-[9px] font-semibold uppercase text-slate-500 ml-0.5 tracking-widest">Título da Mensagem</label>
                  <Input 
                    value={tempTitulo} 
                    onChange={e => setTempTitulo(e.target.value)} 
                    placeholder="Ex: Chave Pix" 
                    className="h-9 text-xs font-medium bg-white rounded-md border-slate-200" 
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-semibold uppercase text-slate-500 ml-0.5 tracking-widest">Texto Padrão</label>
                  <Textarea 
                    value={tempTexto} 
                    onChange={e => setTempTexto(e.target.value)} 
                    placeholder="Escreva o texto que será enviado..." 
                    className="min-h-[60px] text-xs font-medium bg-white resize-none rounded-md p-2.5 border-slate-200" 
                  />
                </div>
                <div className="flex flex-col sm:flex-row gap-2 pt-1">
                  <Button 
                    onClick={salvarTemplate} 
                    className="flex-1 h-9 bg-purple-600 hover:bg-purple-700 text-white rounded-md font-semibold text-[9px] uppercase tracking-widest shadow-sm transition-colors"
                  >
                    {editId ? "Atualizar Mensagem" : "Nova Mensagem"}
                  </Button>
                  {editId && (
                    <Button 
                      variant="outline" 
                      onClick={cancelarEdicao} 
                      className="h-9 px-4 rounded-md font-semibold text-[9px] uppercase tracking-widest border-slate-200 text-slate-500 w-full sm:w-auto hover:bg-slate-100"
                    >
                      Cancelar
                    </Button>
                  )}
                </div>
              </div>

              {/* LISTA DE MENSAGENS */}
              <div className="flex-1 overflow-y-auto space-y-2.5 pr-1 no-scrollbar">
                {templates.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-[9px] font-semibold text-slate-400 uppercase tracking-widest">Use o formulário acima para criar suas mensagens.</p>
                  </div>
                ) : (
                  templates.map(tpl => (
                    <div key={tpl.id} className="border border-slate-200 rounded-lg p-3 shadow-sm bg-white flex flex-col group hover:border-purple-300 transition-colors">
                      <div className="flex justify-between items-start mb-1.5">
                        <p className="text-[10px] font-semibold text-slate-800 uppercase tracking-widest">{tpl.titulo}</p>
                        <div className="flex gap-1.5">
                          <button 
                            onClick={() => { 
                              setEditId(tpl.id); 
                              setTempTitulo(tpl.titulo); 
                              setTempTexto(tpl.texto); 
                              window.scrollTo({ top: 0, behavior: 'smooth' }); 
                            }} 
                            className="text-slate-400 hover:text-blue-500 bg-slate-50 p-1.5 rounded-md transition-colors border border-slate-100"
                          >
                            <Edit3 size={12} />
                          </button>
                          <button 
                            onClick={() => excluirTemplate(tpl.id)} 
                            className="text-slate-400 hover:text-red-500 bg-slate-50 p-1.5 rounded-md transition-colors border border-slate-100"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </div>
                      <p className="text-[9px] text-slate-500 font-medium line-clamp-3 leading-relaxed italic">"{tpl.texto}"</p>
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