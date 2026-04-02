import React, { useState, useEffect } from "react";
import { ShoppingBag, CheckCheck, Trash2, ArrowRight, UserSquare2, Loader2, UserPlus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AnimatePresence, motion } from "framer-motion";
import { supabase } from "../../lib/supabase";

import ClienteModal from "../clientes/ClienteModal"; // <-- Importando o seu Modal Universal!

export default function PedidosSite({ solicitacoes, handleUpdate, handleDelete }) {
  const [clientes, setClientes] = useState([]);
  const [carregandoClientes, setCarregandoClientes] = useState(false);
  
  // --- ESTADOS DO MODAL DE APROVAÇÃO ---
  const [pedidoSendoAprovado, setPedidoSendoAprovado] = useState(null);
  const [nomeBusca, setNomeBusca] = useState("");
  const [mostrarDropdown, setMostrarDropdown] = useState(false);
  
  // Controle do Modal Universal de Clientes
  const [isClienteModalOpen, setIsClienteModalOpen] = useState(false);

  // Busca os clientes para o buscador assim que a tela abre
  useEffect(() => {
    async function fetchClientes() {
      setCarregandoClientes(true);
      const { data } = await supabase.from('clientes').select('id, nome, whatsapp').order('nome');
      if (data) setClientes(data);
      setCarregandoClientes(false);
    }
    fetchClientes();
  }, []);

  // 1. Abre a janelinha para vincular o cliente
  const iniciarAprovacao = (task) => {
    setPedidoSendoAprovado(task);
    // Se o pedido do site já vier com um nome, pré-preenche o buscador
    setNomeBusca(task.cliente_nome || task.title || "");
    setMostrarDropdown(true);
  };

  // 2. Confirma o envio para a produção salvando o cliente vinculado
  const confirmarAprovacao = (clienteId, clienteNome) => {
    handleUpdate(pedidoSendoAprovado.id, { 
      status: 'pendente', 
      tipo_pedido: 'producao',
      cliente_id: clienteId,
      cliente_nome: clienteNome,
      title: clienteNome // Força o título do pedido a ficar com o nome do cliente
    });
    fecharModais();
  };

  // 3. Recebe o cliente que foi criado lá no Modal Universal
  const handleClienteCriado = (novoCliente) => {
    setClientes([...clientes, novoCliente]);
    confirmarAprovacao(novoCliente.id, novoCliente.nome);
  };

  const fecharModais = () => {
    setPedidoSendoAprovado(null);
    setNomeBusca("");
    setMostrarDropdown(false);
    setIsClienteModalOpen(false);
  };

  const handleInputKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const searchStr = String(nomeBusca || '').toLowerCase().trim();
      const exists = clientes.some(c => String(c.nome || '').toLowerCase() === searchStr);
      
      // Se deu Enter e o cliente não existe, puxa a tela de cadastro
      if (!exists && searchStr.length > 0) {
        setIsClienteModalOpen(true);
        setMostrarDropdown(false);
      }
    }
  };

  const searchStr = String(nomeBusca || '').toLowerCase().trim();
  const filteredClientes = clientes.filter(c => String(c.nome || '').toLowerCase().includes(searchStr));

  return (
    <div className="space-y-4">
      <div className="bg-blue-50 border border-blue-200 p-3 rounded-lg text-blue-800">
         <h2 className="font-semibold uppercase tracking-widest text-[10px] flex items-center gap-1.5">
           <ShoppingBag size={14}/> Caixa de Entrada do Site
         </h2>
         <p className="text-[9px] mt-1 font-medium">Pedidos iniciados pelos clientes no seu Catálogo. Aceite para enviar para a fila de Produção.</p>
      </div>
      
      {solicitacoes.length === 0 ? (
         <div className="text-center py-16 bg-white rounded-xl border border-slate-200 shadow-sm">
           <ShoppingBag className="w-10 h-10 text-slate-300 mx-auto mb-2" />
           <p className="text-slate-500 font-semibold uppercase tracking-widest text-[10px]">Nenhum pedido novo no site</p>
         </div>
      ) : (
         <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
           <AnimatePresence>
             {solicitacoes.map(t => (
               <motion.div key={t.id} layout initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-white border border-blue-200 shadow-sm rounded-xl p-3 flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-start gap-2 mb-2">
                       <h3 className="font-semibold text-slate-800 text-xs leading-tight uppercase">{t.title}</h3>
                       <span className="font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full text-[9px] shrink-0 border border-emerald-100">
                         {(t.service_value || 0).toLocaleString('pt-BR', {style: 'currency', currency: 'BRL'})}
                       </span>
                    </div>
                    <div className="bg-slate-50 p-2.5 rounded-md border border-slate-100 text-[10px] text-slate-600 whitespace-pre-wrap mb-3 font-medium">
                       {t.description}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 mt-auto">
                     <Button 
                       onClick={() => iniciarAprovacao(t)} 
                       className="flex-1 bg-blue-600 hover:bg-blue-700 text-white h-8 text-[9px] uppercase font-semibold tracking-widest rounded-md shadow-sm transition-colors"
                     >
                       <CheckCheck size={12} className="mr-1.5"/> Enviar p/ Produção <ArrowRight size={12} className="ml-1"/>
                     </Button>
                     <Button onClick={() => handleDelete(t)} variant="outline" className="h-8 px-2.5 rounded-md border-red-200 text-red-500 hover:bg-red-50 transition-colors">
                       <Trash2 size={14} />
                     </Button>
                  </div>
               </motion.div>
             ))}
           </AnimatePresence>
         </div>
      )}

      {/* JANELA DE APROVAÇÃO (VINCULAR CLIENTE) */}
      <AnimatePresence>
        {pedidoSendoAprovado && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }} 
              animate={{ opacity: 1, scale: 1 }} 
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-xl shadow-2xl w-full max-w-sm overflow-visible flex flex-col"
            >
              <div className="flex items-center justify-between p-4 border-b border-slate-100">
                <h2 className="text-[10px] font-bold text-slate-800 uppercase tracking-widest">Aprovar Pedido</h2>
                <button onClick={fecharModais} className="text-slate-400 hover:text-slate-600 transition-colors">
                  <X size={16} />
                </button>
              </div>

              <div className="p-5 space-y-4 overflow-visible">
                <p className="text-[10px] font-medium text-slate-500 text-center">
                  Vincule este pedido a um cliente para enviá-lo à fila de produção.
                </p>

                <div className="space-y-1 relative">
                  <label className="text-[9px] font-semibold uppercase text-slate-500 tracking-widest ml-1">Buscar ou Criar Cliente</label>
                  <div className="relative z-40">
                     <UserSquare2 className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 w-3.5 h-3.5" />
                     <Input
                       placeholder="Digite o nome e aperte Enter..."
                       value={nomeBusca}
                       onChange={(e) => { 
                         setNomeBusca(e.target.value); 
                         setMostrarDropdown(true); 
                       }}
                       onKeyDown={handleInputKeyDown}
                       onFocus={() => setMostrarDropdown(true)}
                       onBlur={() => setTimeout(() => setMostrarDropdown(false), 250)}
                       className="bg-slate-50 border-slate-200 h-9 text-xs font-medium pl-8 focus:bg-white"
                       autoFocus
                     />
                     {carregandoClientes && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 w-3.5 h-3.5 animate-spin" />}
                     
                     {mostrarDropdown && searchStr.length > 0 && (
                       <div className="absolute top-10 left-0 right-0 bg-white border border-slate-200 rounded-md shadow-xl overflow-hidden p-1 space-y-0.5 z-[300]">
                         <div className="max-h-40 overflow-y-auto">
                           {filteredClientes.map(cli => (
                             <div key={cli.id} onMouseDown={(e) => { e.preventDefault(); confirmarAprovacao(cli.id, cli.nome); }} className="flex flex-col p-2 hover:bg-slate-50 rounded cursor-pointer transition-colors">
                               <span className="text-[10px] font-semibold text-slate-800 uppercase">{cli.nome}</span>
                               {cli.whatsapp && <span className="text-[9px] text-slate-400">{cli.whatsapp}</span>}
                             </div>
                           ))}
                         </div>
                         
                         {filteredClientes.length === 0 && (
                           <div className="p-1.5 bg-slate-50 rounded-md border border-slate-100 mt-1">
                              <div 
                                onMouseDown={(e) => { e.preventDefault(); setIsClienteModalOpen(true); setMostrarDropdown(false); }}
                                className="flex items-center gap-2 p-2 text-[10px] font-semibold text-blue-600 bg-blue-100/50 hover:bg-blue-100 rounded cursor-pointer transition-colors"
                              >
                                <UserPlus size={14} /> Cadastrar "{nomeBusca}"
                              </div>
                           </div>
                         )}
                       </div>
                     )}
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* RENDERIZANDO O MODAL UNIVERSAL POR CIMA DE TUDO */}
      <ClienteModal 
        isOpen={isClienteModalOpen} 
        onClose={() => setIsClienteModalOpen(false)}
        clienteInicial={nomeBusca}
        onSuccess={handleClienteCriado}
      />
    </div>
  );
}