import React, { useState } from 'react';
import { supabase } from "../lib/supabase";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  Users, Search, Plus, MessageCircle, Trash2, Edit3, 
  CheckCircle2, AlertCircle, X, Loader2, Palette, Gift
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AnimatePresence, motion } from "framer-motion";

export default function Clientes() {
  const [searchTerm, setSearchTerm] = useState('');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState(null);

  const [isPedidosModalOpen, setIsPedidosModalOpen] = useState(false);
  const [selectedClientForPedidos, setSelectedClientForPedidos] = useState(null);

  const queryClient = useQueryClient();

  const { data: clientes = [], isLoading: isLoadingClientes } = useQuery({
    queryKey: ["sistema-clientes"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("clientes")
        .select("*")
        .order("nome", { ascending: true });
      if (error) throw error;
      return data || [];
    },
  });

  const { data: tasks = [], isLoading: isLoadingTasks } = useQuery({
    queryKey: ["art-tasks"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("pedidos")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  const getTaskValue = (task) => {
    const checklistTotal = (task.checklist || []).reduce((s, i) => s + (Number(i.value) || 0), 0);
    
    let baseValue = 0;
    if (task.service_value !== undefined && task.service_value !== null && task.service_value !== "") {
       baseValue = Number(task.service_value);
    } else if (task.price) {
       const priceStr = typeof task.price === 'string' ? task.price.replace(/[^0-9.,]/g, '').replace(',', '.') : String(task.price);
       const legacyValor = parseFloat(priceStr) || 0;
       const qtd = Number(task.quantity) || 1;
       baseValue = legacyValor * qtd;
    }
    
    return checklistTotal > 0 ? checklistTotal : baseValue;
  };

  const getClientTier = (cliente, clientTasks) => {
    const totalPedidos = clientTasks.length;
    const valorPedidos = clientTasks.reduce((acc, t) => acc + getTaskValue(t), 0);
    const gastoTotal = Number(cliente?.pago || 0) + valorPedidos;

    if (gastoTotal >= 1000 || totalPedidos >= 10) {
      return { nome: 'Cliente Ouro', text: 'text-yellow-600', icon: '👑' };
    }
    if (gastoTotal >= 300 || totalPedidos >= 4) {
      return { nome: 'Cliente Prata', text: 'text-slate-500', icon: '🥈' };
    }
    return { nome: 'Cliente Bronze', text: 'text-amber-700', icon: '🥉' };
  };

  const formatBirthday = (dateString) => {
    if (!dateString) return '';
    const parts = dateString.split('-'); 
    if (parts.length === 3) return `${parts[2]}/${parts[1]}`;
    return dateString;
  };

  const saveMutation = useMutation({
    mutationFn: async (clientData) => {
      if (clientData.id && typeof clientData.id === 'string' && clientData.id.length > 10) {
        const { error } = await supabase.from("clientes").update(clientData).eq("id", clientData.id);
        if (error) throw error;
      } else {
        const { id, ...newClient } = clientData; 
        const { error } = await supabase.from("clientes").insert([newClient]);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sistema-clientes"] });
      setIsModalOpen(false);
      // Evita o erro apagando os dados com delay após a animação fechar
      setTimeout(() => setEditingClient(null), 300);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      const { error } = await supabase.from("clientes").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["sistema-clientes"] }),
  });

  const handleSave = () => {
    if (!editingClient?.nome) return alert("O nome do cliente é obrigatório.");
    saveMutation.mutate(editingClient);
  };

  // Blindagem contra nomes nulos no filtro
  const filteredClientes = clientes.filter(c => 
    (c.nome || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (c.whatsapp || '').includes(searchTerm)
  );

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0);
  };

  const isLoading = isLoadingClientes || isLoadingTasks;

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 w-full pb-20 relative">
      
      {/* HEADER FIXO - ESTILO EXECUTIVO */}
      <div className="border-b border-slate-200 bg-white/90 backdrop-blur-md sticky top-0 z-10 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 py-3 flex flex-col md:flex-row md:items-center justify-between gap-3">
          
          <div className="flex items-center gap-3">
            <h1 className="text-lg md:text-xl font-semibold text-slate-800 uppercase leading-none tracking-tight flex items-center gap-2">
              <Users className="w-5 h-5 text-blue-600" /> Clientes
            </h1>
            <div className="h-6 w-px bg-slate-200 hidden md:block"></div>
            <p className="text-[9px] md:text-[10px] text-slate-500 font-medium uppercase tracking-widest hidden md:block mt-0.5">
              Base de Dados Centralizada
            </p>
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto">
            <div className="relative w-full md:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
              <Input 
                placeholder="Pesquisar cliente..." 
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="h-9 pl-8 border-slate-200 bg-slate-50 rounded-md font-medium text-xs w-full focus:bg-white"
              />
            </div>
            
            <Button 
              onClick={() => {
                setEditingClient({ nome: '', whatsapp: '', pendente: 0, pago: 0, aniversario: '' });
                setIsModalOpen(true);
              }}
              className="bg-blue-600 hover:bg-blue-700 text-white rounded-md h-9 px-4 shadow-sm flex gap-1.5 font-semibold text-[10px] uppercase tracking-widest shrink-0"
            >
              <Plus className="w-3.5 h-3.5" /> <span className="hidden sm:inline">Novo</span>
            </Button>
          </div>

        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 mt-6">
        {isLoading ? (
          <div className="flex justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-blue-600" /></div>
        ) : (
          <div className="flex flex-col gap-2.5">
            <AnimatePresence mode="popLayout">
              {filteredClientes.map((cliente) => {
                const clientTasks = tasks.filter(t => 
                  t.cliente_id === cliente.id || 
                  (t.cliente_nome && t.cliente_nome.trim().toLowerCase() === (cliente.nome || '').trim().toLowerCase())
                );
                
                let pedidosPago = 0;
                let pedidosPendente = 0;
                
                clientTasks.forEach(task => {
                  const val = getTaskValue(task);
                  const isPaid = String(task.payment_status || '').toLowerCase().trim() === 'pago' || String(task.status || '').toLowerCase().trim() === 'concluida';
                  const valorAdiantado = Number(task.valor_pago || 0);

                  if (isPaid) {
                    pedidosPago += val;
                  } else if (String(task.payment_status || '').toLowerCase().trim() === 'parcial' || valorAdiantado > 0) {
                    pedidosPago += valorAdiantado;
                    pedidosPendente += (val - valorAdiantado);
                  } else {
                    pedidosPendente += val;
                  }
                });

                const totalGastoReal = Number(cliente.pago || 0) + pedidosPago;
                const totalPendenteReal = Number(cliente.pendente || 0) + pedidosPendente;
                
                const tier = getClientTier(cliente, clientTasks);

                return (
                <motion.div
                  key={cliente.id}
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="bg-white border border-slate-200 shadow-sm p-3 rounded-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-3 transition-colors hover:border-blue-200"
                >
                  
                  {/* Avatar e Nome */}
                  <div className="flex items-center gap-3 w-full md:w-1/3 min-w-[220px]">
                    <div className="w-10 h-10 bg-slate-50 border border-slate-100 rounded-lg flex items-center justify-center font-semibold text-blue-600 text-sm shrink-0 shadow-sm">
                      {/* Blindado contra nomes vazios */}
                      {(cliente.nome || 'C').charAt(0).toUpperCase()}
                    </div>
                    <div className="overflow-hidden">
                      <h3 className="font-semibold text-slate-800 text-xs uppercase truncate leading-tight">{cliente.nome || 'Sem Nome'}</h3>
                      <div className="flex items-center gap-1.5 mt-1">
                        <span className={`text-[8px] font-semibold uppercase tracking-widest flex items-center gap-1 ${tier.text}`}>{tier.icon} {tier.nome}</span>
                      </div>
                    </div>
                  </div>

                  {/* Contato (Escondido em telas muito pequenas) */}
                  <div className="hidden sm:flex flex-col gap-1 w-full md:w-1/4">
                    {cliente.whatsapp && (
                      <div className="flex items-center gap-1.5 text-slate-500 font-medium text-[10px]">
                        <MessageCircle className="w-3 h-3 text-emerald-500" /> {cliente.whatsapp}
                      </div>
                    )}
                    {cliente.aniversario && (
                      <div className="flex items-center gap-1.5 text-slate-500 font-medium text-[10px]">
                        <Gift className="w-3 h-3 text-pink-500" /> {formatBirthday(cliente.aniversario)}
                      </div>
                    )}
                  </div>

                  {/* Valores Financeiros */}
                  <div className="flex items-center justify-between sm:justify-start gap-2 w-full md:w-auto shrink-0">
                    <div className="flex flex-col bg-rose-50 px-2.5 py-1 rounded-lg border border-rose-100 items-center justify-center min-w-[80px]">
                      <span className="text-[8px] font-semibold uppercase text-rose-400 flex items-center gap-1 tracking-widest"><AlertCircle className="w-2.5 h-2.5"/> Pendente</span>
                      <span className="font-semibold text-rose-600 text-xs">{formatCurrency(totalPendenteReal)}</span>
                    </div>
                    <div className="flex flex-col bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-100 items-center justify-center min-w-[80px]">
                      <span className="text-[8px] font-semibold uppercase text-emerald-500 flex items-center gap-1 tracking-widest"><CheckCircle2 className="w-2.5 h-2.5"/> Pago</span>
                      <span className="font-semibold text-emerald-600 text-xs">{formatCurrency(totalGastoReal)}</span>
                    </div>
                  </div>

                  {/* Botões de Ação Rápida */}
                  <div className="flex items-center gap-1 shrink-0 w-full md:w-auto mt-2 md:mt-0 justify-end">
                    <Button variant="ghost" size="icon" onClick={() => { setSelectedClientForPedidos(cliente); setIsPedidosModalOpen(true); }} className="h-8 w-8 text-purple-600 bg-purple-50 hover:bg-purple-100 relative rounded-md">
                      <Palette size={14} />
                      {clientTasks.length > 0 && <span className="absolute -top-1.5 -right-1.5 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-purple-600 text-[8px] font-semibold text-white shadow-sm">{clientTasks.length}</span>}
                    </Button>
                    
                    {/* Blindado contra whatsapp nulo na formatação do Link */}
                    {cliente.whatsapp ? (
                      <a href={`https://wa.me/55${(cliente.whatsapp || '').replace(/\D/g, '')}`} target="_blank" rel="noreferrer" className="h-8 w-8 flex items-center justify-center rounded-md text-emerald-600 bg-emerald-50 hover:bg-emerald-100 transition-colors">
                        <MessageCircle size={14} />
                      </a>
                    ) : (
                      <div className="h-8 w-8 flex items-center justify-center rounded-md text-slate-300 bg-slate-50 cursor-not-allowed">
                        <MessageCircle size={14} />
                      </div>
                    )}

                    <div className="h-5 w-px bg-slate-200 mx-1 hidden sm:block"></div>
                    <button onClick={() => { setEditingClient(cliente); setIsModalOpen(true); }} className="h-8 w-8 flex items-center justify-center text-slate-400 hover:text-blue-600 rounded-md transition-colors"><Edit3 size={14} /></button>
                    <button onClick={() => { if(window.confirm("Deseja mesmo excluir o cliente?")) deleteMutation.mutate(cliente.id); }} className="h-8 w-8 flex items-center justify-center text-slate-400 hover:text-rose-500 rounded-md transition-colors"><Trash2 size={14} /></button>
                  </div>
                  
                </motion.div>
              )})}
            </AnimatePresence>
            
            {filteredClientes.length === 0 && !isLoading && (
               <div className="text-center py-16 bg-white rounded-xl border border-slate-200 shadow-sm mt-4">
                 <Users className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                 <p className="text-slate-500 font-semibold uppercase tracking-widest text-[10px]">Nenhum cliente encontrado</p>
               </div>
            )}
          </div>
        )}
      </div>

      {/* MODAL: CRIAR / EDITAR CLIENTE (Blindado) */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsModalOpen(false)} className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" />
            <motion.div initial={{ scale: 0.95, opacity: 0, y: 10 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 10 }} className="bg-white w-full max-w-sm rounded-xl p-5 shadow-xl relative z-10 border border-slate-100">
              
              <div className="flex justify-between items-center mb-4 pb-3 border-b border-slate-100">
                <h2 className="text-sm font-semibold text-slate-800 uppercase tracking-tight">
                   {editingClient?.id ? 'Editar Cliente' : 'Novo Cliente'}
                </h2>
                <button onClick={() => setIsModalOpen(false)} className="p-1 hover:bg-slate-100 text-slate-500 rounded transition-colors"><X size={16} /></button>
              </div>
              
              <div className="space-y-3">
                <div className="space-y-1">
                  <label className="text-[9px] font-semibold uppercase text-slate-500 tracking-widest ml-1">Nome Completo</label>
                  <Input value={editingClient?.nome || ''} onChange={e => setEditingClient(prev => ({...prev, nome: e.target.value}))} className="h-9 border-slate-200 bg-slate-50 focus:bg-white rounded-md font-medium text-xs" />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[9px] font-semibold uppercase text-slate-500 tracking-widest ml-1">WhatsApp</label>
                    <Input value={editingClient?.whatsapp || ''} onChange={e => setEditingClient(prev => ({...prev, whatsapp: e.target.value}))} className="h-9 border-slate-200 bg-slate-50 focus:bg-white rounded-md font-medium text-xs" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-semibold uppercase text-slate-500 tracking-widest ml-1">Aniversário</label>
                    <Input type="date" value={editingClient?.aniversario || ''} onChange={e => setEditingClient(prev => ({...prev, aniversario: e.target.value}))} className="h-9 border-slate-200 bg-slate-50 focus:bg-white rounded-md font-medium text-xs text-slate-600" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[9px] font-semibold uppercase text-rose-500 tracking-widest ml-1">Acrescer Pendência</label>
                    <Input type="number" value={editingClient?.pendente ?? ''} onChange={e => setEditingClient(prev => ({...prev, pendente: Number(e.target.value)}))} className="h-9 border-rose-100 bg-rose-50 focus:bg-white rounded-md font-semibold text-rose-600 text-xs" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-semibold uppercase text-emerald-500 tracking-widest ml-1">Acrescer Pago</label>
                    <Input type="number" value={editingClient?.pago ?? ''} onChange={e => setEditingClient(prev => ({...prev, pago: Number(e.target.value)}))} className="h-9 border-emerald-100 bg-emerald-50 focus:bg-white rounded-md font-semibold text-emerald-600 text-xs" />
                  </div>
                </div>
                <p className="text-[8px] text-slate-400 font-medium px-1 uppercase tracking-widest">Os valores acima somam com os pedidos do sistema.</p>

                <Button onClick={handleSave} className="w-full h-9 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-semibold uppercase text-[10px] tracking-widest mt-2 shadow-sm">
                  {saveMutation.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <><Save size={14} className="mr-1.5"/> Salvar Cliente</>}
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL: HISTÓRICO DE PEDIDOS */}
      <AnimatePresence>
        {isPedidosModalOpen && selectedClientForPedidos && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsPedidosModalOpen(false)} className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" />
            <motion.div initial={{ scale: 0.95, opacity: 0, y: 10 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 10 }} className="bg-white w-full max-w-md rounded-xl p-5 shadow-xl relative z-10 flex flex-col max-h-[85vh]">
              
              <div className="flex justify-between items-start mb-4 border-b border-slate-100 pb-3">
                <div>
                  <h2 className="text-sm font-semibold text-slate-800 uppercase tracking-tight flex items-center gap-1.5">
                    <Palette className="text-purple-500 w-4 h-4" /> Histórico de Pedidos
                  </h2>
                  <p className="text-[9px] font-semibold text-slate-500 uppercase mt-1 tracking-widest">{selectedClientForPedidos.nome}</p>
                </div>
                <button onClick={() => setIsPedidosModalOpen(false)} className="p-1 hover:bg-slate-100 text-slate-500 rounded transition-colors"><X size={16} /></button>
              </div>

              {(() => {
                const modalTasks = tasks.filter(t => t.cliente_id === selectedClientForPedidos.id || (t.cliente_nome && t.cliente_nome.trim().toLowerCase() === (selectedClientForPedidos.nome || '').trim().toLowerCase()));
                return (
                  <>
                    <div className="bg-purple-50 border border-purple-100 rounded-lg p-3 mb-3 flex justify-between items-center shadow-sm">
                      <div>
                        <p className="text-[8px] font-semibold uppercase tracking-widest text-purple-600 mb-0.5">Total em Pedidos</p>
                        <p className="text-lg font-semibold text-purple-700 leading-none">
                          {formatCurrency(modalTasks.reduce((a, t) => a + getTaskValue(t), 0))}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-[8px] font-semibold uppercase tracking-widest text-purple-600 mb-0.5">Qtd.</p>
                        <p className="text-base font-semibold text-purple-700 leading-none">{modalTasks.length}</p>
                      </div>
                    </div>
                    
                    <div className="flex-1 overflow-y-auto no-scrollbar space-y-2 pr-1">
                      {modalTasks.length === 0 ? (
                        <div className="text-center py-8 bg-slate-50 rounded-lg border border-slate-100">
                          <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest">Nenhum pedido encontrado.</p>
                        </div>
                      ) : (
                        modalTasks.map(task => {
                          const val = getTaskValue(task);
                          const isPaid = String(task.payment_status || '').toLowerCase().trim() === 'pago' || String(task.status || '').toLowerCase().trim() === 'concluida';
                          
                          return (
                            <div key={task.id} className="flex flex-col bg-white p-3 rounded-lg border border-slate-200 shadow-sm">
                              <div className="flex justify-between items-start gap-2 mb-1.5">
                                 <span className="text-[11px] font-semibold text-slate-800 leading-tight uppercase">{task.title}</span>
                                 <span className={`text-[11px] font-semibold shrink-0 ${isPaid ? 'text-emerald-600' : 'text-amber-600'}`}>
                                   {formatCurrency(val)}
                                 </span>
                              </div>
                              <div className="flex justify-between items-center mt-1.5 pt-1.5 border-t border-slate-50">
                                 <span className="text-[8px] font-semibold uppercase tracking-widest text-slate-400">
                                   {task.category || 'Serviço'}
                                 </span>
                                 <span className={`text-[8px] font-semibold uppercase tracking-widest px-1.5 py-0.5 rounded-full ${isPaid ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-amber-50 text-amber-600 border border-amber-100'}`}>
                                   {isPaid ? 'Pago' : 'Pendente'}
                                 </span>
                              </div>
                            </div>
                          )
                        })
                      )}
                    </div>
                  </>
                );
              })()}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}