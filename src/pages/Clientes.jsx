import React, { useState } from 'react';
import { supabase } from "../lib/supabase";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  Users, Search, Plus, MessageCircle, Trash2, Edit3, 
  CheckCircle2, AlertCircle, X, Loader2, Save, Gift, 
  ScrollText, ChevronRight, CalendarDays
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AnimatePresence, motion } from "framer-motion";

export default function Clientes() {
  const [searchTerm, setSearchTerm] = useState('');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState(null);
  const [editingClientTotals, setEditingClientTotals] = useState({ pago: 0, pendente: 0 });

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

  const formatDate = (dateString) => {
    if (!dateString) return 'Data não informada';
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const getMaisPedido = (clientTasks) => {
    if (clientTasks.length === 0) return 'Nenhum pedido';
    const contagem = {};
    clientTasks.forEach(t => {
      const cat = t.category || t.title || 'Serviço';
      contagem[cat] = (contagem[cat] || 0) + 1;
    });
    return Object.keys(contagem).reduce((a, b) => contagem[a] > contagem[b] ? a : b);
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

  const filteredClientes = clientes.filter(c => 
    (c.nome || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (c.whatsapp || '').includes(searchTerm)
  );

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0);
  };

  const isLoading = isLoadingClientes || isLoadingTasks;

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 w-full pb-24 md:pb-20 relative">
      
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
                setEditingClient({ nome: '', whatsapp: '', aniversario: '' });
                setEditingClientTotals({ pago: 0, pendente: 0 });
                setIsModalOpen(true);
              }}
              className="bg-blue-600 hover:bg-blue-700 text-white rounded-md h-9 px-4 shadow-sm hidden md:flex gap-1.5 font-semibold text-[10px] uppercase tracking-widest shrink-0"
            >
              <Plus className="w-3.5 h-3.5" /> Novo
            </Button>
          </div>

        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 mt-6">
        {isLoading ? (
          <div className="flex justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-blue-600" /></div>
        ) : (
          <div className="flex flex-col gap-3">
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
                const ultimoPedidoData = clientTasks.length > 0 ? formatDate(clientTasks[0].created_at) : 'Nenhum';
                const maisPedidoStr = getMaisPedido(clientTasks);

                return (
                <motion.div
                  key={cliente.id}
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  onClick={() => { setSelectedClientForPedidos(cliente); setIsPedidosModalOpen(true); }}
                  className="bg-white border border-slate-200 shadow-sm p-3 rounded-xl flex flex-col gap-3 transition-colors hover:border-blue-300 cursor-pointer group"
                >
                  
                  <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3 w-full">
                    {/* Avatar e Nome */}
                    <div className="flex items-center gap-3 w-full md:w-1/3 min-w-[220px]">
                      <div className="w-10 h-10 bg-slate-50 border border-slate-100 rounded-lg flex items-center justify-center font-semibold text-blue-600 text-sm shrink-0 shadow-sm">
                        {(cliente.nome || 'C').charAt(0).toUpperCase()}
                      </div>
                      <div className="overflow-hidden">
                        <h3 className="font-semibold text-slate-800 text-xs uppercase truncate leading-tight group-hover:text-blue-600 transition-colors">{cliente.nome || 'Sem Nome'}</h3>
                        <div className="flex items-center gap-1.5 mt-1">
                          <span className={`text-[8px] font-semibold uppercase tracking-widest flex items-center gap-1 ${tier.text}`}>{tier.icon} {tier.nome}</span>
                        </div>
                      </div>
                    </div>

                    {/* Contato */}
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

                    {/* Valores Financeiros e Ações */}
                    <div className="flex items-center justify-between w-full md:w-auto gap-2">
                      <div className="flex items-center gap-1.5 shrink-0">
                        <div className="flex flex-col bg-rose-50 px-2 py-0.5 rounded border border-rose-100 min-w-[60px] md:min-w-[80px] text-center md:text-left md:items-center md:justify-center">
                          <span className="text-[7px] md:text-[8px] font-semibold uppercase text-rose-400 flex items-center justify-center gap-1 tracking-widest"><AlertCircle className="w-2 h-2 md:w-2.5 md:h-2.5"/> Pendente</span>
                          <span className="font-bold text-rose-600 text-[10px] md:text-xs">{formatCurrency(totalPendenteReal)}</span>
                        </div>
                        <div className="flex flex-col bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100 min-w-[60px] md:min-w-[80px] text-center md:text-left md:items-center md:justify-center">
                          <span className="text-[7px] md:text-[8px] font-semibold uppercase text-emerald-500 flex items-center justify-center gap-1 tracking-widest"><CheckCircle2 className="w-2 h-2 md:w-2.5 md:h-2.5"/> Pago</span>
                          <span className="font-bold text-emerald-600 text-[10px] md:text-xs">{formatCurrency(totalGastoReal)}</span>
                        </div>
                      </div>

                      {/* Botões de Ação */}
                      <div className="flex items-center gap-1 shrink-0 justify-end">
                        {cliente.whatsapp ? (
                          <a href={`https://wa.me/55${(cliente.whatsapp || '').replace(/\D/g, '')}`} onClick={(e) => e.stopPropagation()} target="_blank" rel="noreferrer" className="h-7 w-7 md:h-8 md:w-8 flex items-center justify-center rounded-md text-emerald-600 bg-emerald-50 hover:bg-emerald-100 transition-colors">
                            <MessageCircle size={14} />
                          </a>
                        ) : (
                          <div onClick={(e) => e.stopPropagation()} className="h-7 w-7 md:h-8 md:w-8 flex items-center justify-center rounded-md text-slate-300 bg-slate-50 cursor-not-allowed">
                            <MessageCircle size={14} />
                          </div>
                        )}
                        <div className="h-4 w-px bg-slate-200 mx-0.5 hidden sm:block"></div>
                        <button onClick={(e) => { e.stopPropagation(); setEditingClient(cliente); setEditingClientTotals({pago: totalGastoReal, pendente: totalPendenteReal}); setIsModalOpen(true); }} className="h-7 w-7 md:h-8 md:w-8 flex items-center justify-center text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"><Edit3 size={14} /></button>
                        <button onClick={(e) => { e.stopPropagation(); if(window.confirm("Deseja mesmo excluir o cliente?")) deleteMutation.mutate(cliente.id); }} className="h-7 w-7 md:h-8 md:w-8 flex items-center justify-center text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-md transition-colors"><Trash2 size={14} /></button>
                      </div>
                    </div>
                  </div>

                  {/* Resumo do Histórico */}
                  <div className="bg-slate-50/80 p-2 md:p-2.5 rounded-lg border border-slate-100 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 text-[9px] text-slate-500 group-hover:bg-blue-50/50 group-hover:border-blue-100 transition-colors">
                     <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
                        <span><strong className="text-slate-700 uppercase">Último pedido:</strong> {ultimoPedidoData}</span>
                        <span className="hidden xs:inline">•</span>
                        <span className="truncate max-w-[150px]"><strong className="text-slate-700 uppercase">Mais pediu:</strong> {maisPedidoStr}</span>
                     </div>
                     <span className="text-blue-600 font-bold uppercase tracking-widest flex items-center gap-1 self-end sm:self-auto">
                       Ver histórico completo <ChevronRight size={10}/>
                     </span>
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

      {/* BOTÃO FIXO NA BASE PARA MOBILE */}
      <div className="md:hidden fixed bottom-0 left-0 w-full p-3 bg-white border-t border-slate-200 z-[90] shadow-[0_-4px_15px_rgba(0,0,0,0.03)] pb-safe">
        <Button 
          onClick={() => {
            setEditingClient({ nome: '', whatsapp: '', aniversario: '' });
            setEditingClientTotals({ pago: 0, pendente: 0 });
            setIsModalOpen(true);
          }}
          className="w-full h-11 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold uppercase tracking-widest text-[10px] shadow-sm"
        >
          <Plus size={16} className="mr-1.5" /> Cadastrar Novo Cliente
        </Button>
      </div>

      {/* MODAL: CRIAR / EDITAR CLIENTE */}
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
                  {/* MAGIA DO CSS: Esconde o ícone nativo do navegador mas deixa toda a área clicável */}
                  <div className="space-y-1">
                    <label className="text-[9px] font-semibold uppercase text-slate-500 tracking-widest ml-1">Aniversário</label>
                    <div className="relative">
                      <CalendarDays className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
                      <Input 
                        type="date" 
                        value={editingClient?.aniversario || ''} 
                        onChange={e => setEditingClient(prev => ({...prev, aniversario: e.target.value}))} 
                        className="h-9 pl-8 border-slate-200 bg-slate-50 focus:bg-white rounded-md font-medium text-xs text-slate-600 w-full relative [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:right-0 [&::-webkit-calendar-picker-indicator]:w-full [&::-webkit-calendar-picker-indicator]:h-full [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:cursor-pointer" 
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[9px] font-semibold uppercase text-slate-400 tracking-widest ml-1">Total Pendente</label>
                    <Input value={formatCurrency(editingClientTotals.pendente)} readOnly disabled className="h-9 border-slate-100 bg-slate-50 text-slate-400 font-semibold text-xs cursor-not-allowed" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-semibold uppercase text-slate-400 tracking-widest ml-1">Total Pago</label>
                    <Input value={formatCurrency(editingClientTotals.pago)} readOnly disabled className="h-9 border-slate-100 bg-slate-50 text-slate-400 font-semibold text-xs cursor-not-allowed" />
                  </div>
                </div>
                <p className="text-[8px] text-slate-400 font-medium px-1 uppercase tracking-widest text-center mt-1">Os valores acima são somados automaticamente pelo sistema.</p>

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
                    <ScrollText className="text-purple-500 w-4 h-4" /> Histórico de Pedidos
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
                        <p className="text-[8px] font-semibold uppercase tracking-widest text-purple-600 mb-0.5">Qtd. Pedidos</p>
                        <p className="text-base font-semibold text-purple-700 leading-none">{modalTasks.length}</p>
                      </div>
                    </div>
                    
                    <div className="flex-1 overflow-y-auto no-scrollbar space-y-2 pr-1">
                      {modalTasks.length === 0 ? (
                        <div className="text-center py-8 bg-slate-50 rounded-lg border border-slate-100">
                          <ScrollText className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                          <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest">Nenhum pedido encontrado.</p>
                        </div>
                      ) : (
                        modalTasks.map(task => {
                          const val = getTaskValue(task);
                          const isPaid = String(task.payment_status || '').toLowerCase().trim() === 'pago' || String(task.status || '').toLowerCase().trim() === 'concluida';
                          const dataPedido = formatDate(task.created_at);
                          
                          return (
                            <div key={task.id} className="flex flex-col bg-white p-3 rounded-lg border border-slate-200 shadow-sm hover:border-purple-200 transition-colors">
                              <div className="flex justify-between items-start gap-2 mb-1">
                                 <span className="text-[11px] font-bold text-slate-800 leading-tight uppercase">{task.title}</span>
                                 <span className={`text-[11px] font-bold shrink-0 ${isPaid ? 'text-emerald-600' : 'text-amber-600'}`}>
                                   {formatCurrency(val)}
                                 </span>
                              </div>
                              {task.description && (
                                <p className="text-[9px] font-medium text-slate-500 line-clamp-2 leading-relaxed mb-2">
                                  {task.description}
                                </p>
                              )}
                              <div className="flex justify-between items-center mt-1 pt-2 border-t border-slate-50">
                                 <div className="flex items-center gap-2">
                                   <span className="text-[8px] font-semibold uppercase tracking-widest text-slate-400">
                                     {dataPedido}
                                   </span>
                                   <span className="text-[8px] font-semibold uppercase tracking-widest text-purple-400 bg-purple-50 px-1.5 py-0.5 rounded">
                                     {task.category || 'Serviço'}
                                   </span>
                                 </div>
                                 <span className={`text-[8px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded-full ${isPaid ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-amber-50 text-amber-600 border border-amber-100'}`}>
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