import React, { useState } from 'react';
import { supabase } from "../lib/supabase";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  Users, Search, Plus, MessageCircle, Trash2, Edit3, 
  ExternalLink, Wallet, CheckCircle2, AlertCircle, X, Save,
  ArrowRight, Loader2, Link as LinkIcon, Copy, Palette, Gift,
  LayoutGrid, List
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AnimatePresence, motion } from "framer-motion";

export default function Clientes() {
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' ou 'list'
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState(null);
  
  const [isLinksModalOpen, setIsLinksModalOpen] = useState(false);
  const [selectedClientForLinks, setSelectedClientForLinks] = useState(null);

  const [isPedidosModalOpen, setIsPedidosModalOpen] = useState(false);
  const [selectedClientForPedidos, setSelectedClientForPedidos] = useState(null);

  const queryClient = useQueryClient();

  const { data: clientes = [], isLoading: isLoadingClientes } = useQuery({
    queryKey: ["criarte-clientes"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("clientes")
        .select("*")
        .order("nome", { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  const { data: links = [], isLoading: isLoadingLinks } = useQuery({
    queryKey: ["criarte-links-clientes"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("encurtador")
        .select("*")
        .not("cliente_id", "is", null);
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
    const gastoTotal = Number(cliente.pago || 0) + valorPedidos;

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
      queryClient.invalidateQueries({ queryKey: ["criarte-clientes"] });
      setIsModalOpen(false);
      setEditingClient(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      const { error } = await supabase.from("clientes").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["criarte-clientes"] }),
  });

  const handleSave = () => {
    if (!editingClient.nome) return;
    saveMutation.mutate(editingClient);
  };

  const copiarLink = (slugDaVez) => {
    const urlCompleta = window.location.origin + "/" + slugDaVez;
    navigator.clipboard.writeText(urlCompleta);
    alert("Link encurtado copiado!");
  };

  const filteredClientes = clientes.filter(c => 
    c.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.whatsapp.includes(searchTerm)
  );

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0);
  };

  const isLoading = isLoadingClientes || isLoadingLinks || isLoadingTasks;

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      {/* Header */}
      <div className="bg-white border-b border-slate-100 sticky top-0 z-20 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 md:py-5">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            
            <div>
              <h1 className="text-xl md:text-2xl font-bold md:font-semibold text-slate-800 flex items-center gap-2 uppercase tracking-tight">
                <Users className="w-5 h-5 md:w-6 md:h-6 text-blue-600" /> Clientes
              </h1>
              <p className="text-[10px] md:text-xs font-medium text-slate-500 uppercase tracking-widest mt-1">Base de Dados Centralizada</p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto items-center">
              
              {/* --- BOTÕES DE ALTERNAR VISUALIZAÇÃO (CARDS / LINHAS) --- */}
              <div className="flex bg-slate-100 p-1 rounded-md border border-slate-200 shrink-0 w-full sm:w-auto justify-center">
                <button 
                  onClick={() => setViewMode('grid')} 
                  className={`flex-1 sm:flex-none p-1.5 px-4 rounded transition-all flex items-center justify-center gap-2 ${viewMode === 'grid' ? 'bg-white shadow text-blue-600' : 'text-slate-400 hover:text-slate-600'}`}
                  title="Visão em Cards"
                >
                  <LayoutGrid size={18} /> <span className="text-[10px] font-bold uppercase sm:hidden">Cards</span>
                </button>
                <button 
                  onClick={() => setViewMode('list')} 
                  className={`flex-1 sm:flex-none p-1.5 px-4 rounded transition-all flex items-center justify-center gap-2 ${viewMode === 'list' ? 'bg-white shadow text-blue-600' : 'text-slate-400 hover:text-slate-600'}`}
                  title="Visão em Linhas"
                >
                  <List size={18} /> <span className="text-[10px] font-bold uppercase sm:hidden">Linhas</span>
                </button>
              </div>

              <div className="relative w-full md:w-72 lg:w-80">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input 
                  placeholder="Pesquisar cliente..." 
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="h-10 md:h-9 pl-9 border-slate-200 bg-slate-50/50 rounded-md font-medium text-xs w-full"
                />
              </div>
              
              <Button 
                onClick={() => {
                  setEditingClient({ nome: '', whatsapp: '', pendente: 0, pago: 0, aniversario: '' });
                  setIsModalOpen(true);
                }}
                className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white rounded-md h-10 md:h-9 px-6 shadow-sm flex gap-2 font-semibold text-xs uppercase"
              >
                <Plus className="w-4 h-4" /> NOVO CLIENTE
              </Button>
            </div>

          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 mt-6 md:mt-8">
        {isLoading ? (
          <div className="flex justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-blue-600" /></div>
        ) : (
          <motion.div 
            layout 
            className={viewMode === 'grid' ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5" : "flex flex-col gap-3"}
          >
            <AnimatePresence mode="popLayout">
              {filteredClientes.map((cliente) => {
                const clientLinks = links.filter(l => l.cliente_id === cliente.id);
                
                // --- CORREÇÃO: PUXANDO PEDIDOS PELO ID OU PELO NOME IGUAL ---
                const clientTasks = tasks.filter(t => 
                  t.cliente_id === cliente.id || 
                  (t.cliente_nome && t.cliente_nome.trim().toLowerCase() === cliente.nome.trim().toLowerCase())
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
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className={`bg-white border border-slate-200 shadow-sm overflow-hidden group ${
                    viewMode === 'grid' 
                      ? 'p-4 md:p-5 rounded-xl md:rounded-lg flex flex-col justify-between relative' 
                      : 'p-4 rounded-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 transition-colors hover:border-blue-300'
                  }`}
                >
                  
                  {/* --- MODO: CARDS (GRADE) --- */}
                  {viewMode === 'grid' && (
                    <>
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex gap-3">
                          <div className="w-12 h-12 md:w-10 md:h-10 bg-slate-50 border border-slate-100 rounded-lg md:rounded-md flex items-center justify-center font-bold text-blue-600 text-lg md:text-base shrink-0">
                            {cliente.nome.charAt(0).toUpperCase()}
                          </div>
                          <div className="pr-2">
                            <h3 className="font-bold text-slate-800 text-sm md:text-[13px] leading-tight uppercase line-clamp-1 mb-1">{cliente.nome}</h3>
                            <div className="flex flex-col gap-1.5">
                              <div className="flex items-center gap-3 flex-wrap">
                                <div className="flex items-center gap-1 text-slate-500 font-medium text-[10px] md:text-[11px]">
                                  <MessageCircle className="w-3 h-3 text-emerald-500" /> {cliente.whatsapp}
                                </div>
                                {cliente.aniversario && (
                                  <div className="flex items-center gap-1 text-slate-500 font-medium text-[10px] md:text-[11px]">
                                    <Gift className="w-3 h-3 text-pink-500" /> {formatBirthday(cliente.aniversario)}
                                  </div>
                                )}
                              </div>
                              <div className={`flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest ${tier.text}`}>
                                {tier.icon} {tier.nome}
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-1 shrink-0">
                          <button onClick={() => { setEditingClient(cliente); setIsModalOpen(true); }} className="p-1.5 hover:bg-blue-50 text-slate-400 hover:text-blue-600 rounded-md transition-colors"><Edit3 className="w-4 h-4 md:w-3.5 md:h-3.5" /></button>
                          <button onClick={() => deleteMutation.mutate(cliente.id)} className="p-1.5 hover:bg-red-50 text-slate-400 hover:text-red-500 rounded-md transition-colors"><Trash2 className="w-4 h-4 md:w-3.5 md:h-3.5" /></button>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2 mt-auto">
                        <div className="bg-red-50/50 p-3 md:p-2.5 rounded-lg md:rounded-md border border-red-50 flex flex-col justify-center">
                          <div className="flex items-center gap-1.5 mb-1">
                            <AlertCircle className="w-3 h-3 text-red-400" />
                            <span className="text-[9px] md:text-[10px] font-semibold uppercase text-red-500">Pendente</span>
                          </div>
                          <p className="font-semibold text-red-600 text-xs md:text-sm">{formatCurrency(totalPendenteReal)}</p>
                        </div>
                        <div className="bg-emerald-50/50 p-3 md:p-2.5 rounded-lg md:rounded-md border border-emerald-50 flex flex-col justify-center">
                          <div className="flex items-center gap-1.5 mb-1">
                            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                            <span className="text-[9px] md:text-[10px] font-semibold uppercase text-emerald-500">Total Pago</span>
                          </div>
                          <p className="font-semibold text-emerald-600 text-xs md:text-sm">{formatCurrency(totalGastoReal)}</p>
                        </div>
                      </div>

                      <div className="mt-4 pt-3 border-t border-slate-100 space-y-2">
                        <Button variant="outline" onClick={() => { setSelectedClientForPedidos(cliente); setIsPedidosModalOpen(true); }} className="w-full h-9 md:h-8 border-dashed border-slate-200 text-slate-500 hover:bg-purple-50 hover:text-purple-600 hover:border-purple-200 transition-colors flex justify-between items-center px-3">
                          <div className="flex items-center gap-2"><Palette size={14} /><span className="text-[10px] font-bold uppercase tracking-widest">Pedidos</span></div>
                          {clientTasks.length > 0 ? <span className="bg-purple-100 text-purple-600 text-[10px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1.5">{clientTasks.length} <span className="opacity-40">|</span> {formatCurrency(totalGastoReal + totalPendenteReal)}</span> : <span className="text-[10px] font-semibold text-slate-400 uppercase">Vazio</span>}
                        </Button>
                        <Button variant="outline" onClick={() => { setSelectedClientForLinks(cliente); setIsLinksModalOpen(true); }} className="w-full h-9 md:h-8 border-dashed border-slate-200 text-slate-500 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 transition-colors flex justify-between items-center px-3">
                          <div className="flex items-center gap-2"><LinkIcon size={14} /><span className="text-[10px] font-bold uppercase tracking-widest">Links e Arquivos</span></div>
                          {clientLinks.length > 0 ? <span className="bg-blue-100 text-blue-600 text-[10px] font-bold px-2 py-0.5 rounded-md">{clientLinks.length}</span> : <span className="text-[10px] font-semibold text-slate-400 uppercase">Vazio</span>}
                        </Button>
                      </div>

                      <a href={`https://wa.me/55${cliente.whatsapp.replace(/\D/g, '')}`} target="_blank" className="mt-3 w-full h-10 md:h-8 bg-slate-50 hover:bg-emerald-50 text-slate-500 hover:text-emerald-600 rounded-lg md:rounded-md flex items-center justify-center gap-2 transition-colors font-semibold uppercase text-[10px] md:text-xs border border-slate-100 hover:border-emerald-200">
                        Abrir Conversa <ArrowRight className="w-3 h-3 md:w-3.5 md:h-3.5" />
                      </a>
                    </>
                  )}

                  {/* --- MODO: LINHAS (LISTA) --- */}
                  {viewMode === 'list' && (
                    <>
                      {/* Avatar e Nome */}
                      <div className="flex items-center gap-3 w-full md:w-1/3 min-w-[200px]">
                        <div className="w-12 h-12 bg-slate-50 border border-slate-100 rounded-lg flex items-center justify-center font-bold text-blue-600 text-lg shrink-0">
                          {cliente.nome.charAt(0).toUpperCase()}
                        </div>
                        <div className="overflow-hidden">
                          <h3 className="font-bold text-slate-800 text-[13px] uppercase truncate leading-tight">{cliente.nome}</h3>
                          <div className="flex items-center gap-2 mt-1">
                            <span className={`text-[9px] font-bold uppercase tracking-widest flex items-center gap-1 ${tier.text}`}>{tier.icon} {tier.nome}</span>
                          </div>
                        </div>
                      </div>

                      {/* Contato (Escondido em telas muito pequenas) */}
                      <div className="hidden sm:flex flex-col gap-1.5 w-full md:w-1/4">
                        <div className="flex items-center gap-1.5 text-slate-500 font-medium text-[10px]">
                          <MessageCircle className="w-3.5 h-3.5 text-emerald-500" /> {cliente.whatsapp}
                        </div>
                        {cliente.aniversario && (
                          <div className="flex items-center gap-1.5 text-slate-500 font-medium text-[10px]">
                            <Gift className="w-3.5 h-3.5 text-pink-500" /> {formatBirthday(cliente.aniversario)}
                          </div>
                        )}
                      </div>

                      {/* Valores Financeiros */}
                      <div className="flex items-center justify-between sm:justify-start gap-4 w-full md:w-auto mt-2 md:mt-0 pt-3 md:pt-0 border-t md:border-0 border-slate-100 shrink-0">
                        <div className="flex flex-col bg-red-50/50 px-3 py-1.5 rounded-md border border-red-50">
                          <span className="text-[9px] font-bold uppercase text-red-400 flex items-center gap-1 tracking-widest"><AlertCircle className="w-3 h-3"/> Pendente</span>
                          <span className="font-bold text-red-600 text-xs sm:text-sm">{formatCurrency(totalPendenteReal)}</span>
                        </div>
                        <div className="flex flex-col bg-emerald-50/50 px-3 py-1.5 rounded-md border border-emerald-50">
                          <span className="text-[9px] font-bold uppercase text-emerald-500 flex items-center gap-1 tracking-widest"><CheckCircle2 className="w-3 h-3"/> Pago</span>
                          <span className="font-bold text-emerald-600 text-xs sm:text-sm">{formatCurrency(totalGastoReal)}</span>
                        </div>
                      </div>

                      {/* Botões de Ação Rápida */}
                      <div className="flex items-center gap-1.5 shrink-0 w-full md:w-auto mt-2 md:mt-0 justify-end">
                        <Button variant="ghost" size="icon" title="Pedidos" onClick={() => { setSelectedClientForPedidos(cliente); setIsPedidosModalOpen(true); }} className="h-9 w-9 text-purple-600 bg-purple-50 hover:bg-purple-100 relative rounded-lg">
                          <Palette size={16} />
                          {clientTasks.length > 0 && <span className="absolute -top-1.5 -right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-purple-600 text-[9px] font-bold text-white shadow-sm">{clientTasks.length}</span>}
                        </Button>
                        <Button variant="ghost" size="icon" title="Links e Arquivos" onClick={() => { setSelectedClientForLinks(cliente); setIsLinksModalOpen(true); }} className="h-9 w-9 text-blue-600 bg-blue-50 hover:bg-blue-100 relative rounded-lg">
                          <LinkIcon size={16} />
                          {clientLinks.length > 0 && <span className="absolute -top-1.5 -right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-blue-600 text-[9px] font-bold text-white shadow-sm">{clientLinks.length}</span>}
                        </Button>
                        <a href={`https://wa.me/55${cliente.whatsapp.replace(/\D/g, '')}`} target="_blank" title="WhatsApp" className="h-9 w-9 flex items-center justify-center rounded-lg text-emerald-600 bg-emerald-50 hover:bg-emerald-100 transition-colors">
                          <MessageCircle size={16} />
                        </a>
                        <div className="h-6 w-px bg-slate-200 mx-1 hidden sm:block"></div>
                        <button onClick={() => { setEditingClient(cliente); setIsModalOpen(true); }} className="p-2 text-slate-400 hover:text-blue-600 rounded-md transition-colors"><Edit3 size={16} /></button>
                        <button onClick={() => deleteMutation.mutate(cliente.id)} className="p-2 text-slate-400 hover:text-red-500 rounded-md transition-colors"><Trash2 size={16} /></button>
                      </div>
                    </>
                  )}
                  
                </motion.div>
              )})}
            </AnimatePresence>
          </motion.div>
        )}
      </div>

      {/* MODAL: DADOS DO CLIENTE */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsModalOpen(false)} className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" />
            <motion.div initial={{ scale: 0.95, opacity: 0, y: 10 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 10 }} className="bg-white w-full max-w-md rounded-2xl md:rounded-xl p-6 md:p-6 shadow-xl relative z-10 overflow-hidden">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-lg md:text-xl font-semibold text-slate-800 uppercase tracking-tight">Dados do Cliente</h2>
                <button onClick={() => setIsModalOpen(false)} className="p-1.5 hover:bg-slate-100 text-slate-500 rounded-md transition-colors"><X className="w-5 h-5" /></button>
              </div>
              
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] md:text-xs font-semibold uppercase text-slate-500 tracking-widest ml-1">Nome Completo</label>
                  <Input value={editingClient.nome} onChange={e => setEditingClient({...editingClient, nome: e.target.value})} className="h-11 md:h-9 border-slate-200 bg-white rounded-md font-medium text-sm md:text-xs" />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-[10px] md:text-xs font-semibold uppercase text-slate-500 tracking-widest ml-1">WhatsApp</label>
                    <Input value={editingClient.whatsapp} onChange={e => setEditingClient({...editingClient, whatsapp: e.target.value})} className="h-11 md:h-9 border-slate-200 bg-white rounded-md font-medium text-sm md:text-xs" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] md:text-xs font-semibold uppercase text-slate-500 tracking-widest ml-1">Aniversário</label>
                    <Input type="date" value={editingClient.aniversario || ''} onChange={e => setEditingClient({...editingClient, aniversario: e.target.value})} className="h-11 md:h-9 border-slate-200 bg-white rounded-md font-medium text-sm md:text-xs text-slate-600" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-[10px] md:text-xs font-semibold uppercase text-red-500 tracking-widest ml-1">Acrescer Pendência</label>
                    <Input type="number" value={editingClient.pendente} onChange={e => setEditingClient({...editingClient, pendente: Number(e.target.value)})} className="h-11 md:h-9 border-red-100 bg-red-50/50 rounded-md font-semibold text-red-600 text-sm md:text-xs" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] md:text-xs font-semibold uppercase text-emerald-500 tracking-widest ml-1">Acrescer Pago</label>
                    <Input type="number" value={editingClient.pago} onChange={e => setEditingClient({...editingClient, pago: Number(e.target.value)})} className="h-11 md:h-9 border-emerald-100 bg-emerald-50/50 rounded-md font-semibold text-emerald-600 text-sm md:text-xs" />
                  </div>
                </div>
                <p className="text-[9px] text-slate-400 font-medium px-1 leading-tight">Os valores acima são somados automaticamente com os pedidos do sistema.</p>

                <Button onClick={handleSave} className="w-full h-12 md:h-10 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-semibold uppercase text-xs mt-2 shadow-sm">
                  {saveMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Salvar Cliente"}
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL: VER LINKS DO CLIENTE */}
      <AnimatePresence>
        {isLinksModalOpen && selectedClientForLinks && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsLinksModalOpen(false)} className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" />
            <motion.div initial={{ scale: 0.95, opacity: 0, y: 10 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 10 }} className="bg-white w-full max-w-lg rounded-2xl md:rounded-xl p-6 md:p-6 shadow-xl relative z-10 flex flex-col max-h-[85vh]">
              
              <div className="flex justify-between items-start mb-6 border-b border-slate-100 pb-4">
                <div>
                  <h2 className="text-lg md:text-xl font-semibold text-slate-800 uppercase tracking-tight flex items-center gap-2">
                    <LinkIcon className="text-blue-500 w-5 h-5" /> Links do Cliente
                  </h2>
                  <p className="text-[10px] font-bold text-slate-500 uppercase mt-1 tracking-widest">{selectedClientForLinks.nome}</p>
                </div>
                <button onClick={() => setIsLinksModalOpen(false)} className="p-1.5 hover:bg-slate-100 text-slate-500 rounded-md transition-colors"><X className="w-5 h-5" /></button>
              </div>
              
              <div className="flex-1 overflow-y-auto no-scrollbar space-y-3 pr-1">
                {links.filter(l => l.cliente_id === selectedClientForLinks.id).length === 0 ? (
                  <div className="text-center py-10 bg-slate-50 rounded-lg border border-slate-100">
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest">Nenhum link vinculado.</p>
                    <p className="text-[10px] text-slate-400 mt-1">Crie na aba "Links".</p>
                  </div>
                ) : (
                  links.filter(l => l.cliente_id === selectedClientForLinks.id).map(link => (
                    <div key={link.id} className="flex items-center justify-between bg-slate-50 p-3 rounded-lg border border-slate-200">
                      <div className="flex-1 min-w-0 pr-4">
                         <span className="text-xs font-semibold text-blue-600 truncate block">/{link.slug}</span>
                         <span className="text-[9px] font-medium text-slate-400 truncate block mt-0.5">Destino: {link.url_destino}</span>
                      </div>
                      <div className="flex gap-2 shrink-0">
                        <button onClick={() => copiarLink(link.slug)} className="p-2 text-slate-500 hover:text-slate-800 bg-white border border-slate-200 hover:border-slate-300 rounded-md transition-colors shadow-sm" title="Copiar Link Encurtado">
                          <Copy size={14} />
                        </button>
                        <a href={link.url_destino} target="_blank" rel="noreferrer" className="p-2 text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-100 rounded-md transition-colors shadow-sm" title="Abrir no Drive">
                          <ExternalLink size={14} />
                        </a>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL: HISTÓRICO DE PEDIDOS */}
      <AnimatePresence>
        {isPedidosModalOpen && selectedClientForPedidos && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsPedidosModalOpen(false)} className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" />
            <motion.div initial={{ scale: 0.95, opacity: 0, y: 10 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 10 }} className="bg-white w-full max-w-lg rounded-2xl md:rounded-xl p-6 md:p-6 shadow-xl relative z-10 flex flex-col max-h-[85vh]">
              
              <div className="flex justify-between items-start mb-6 border-b border-slate-100 pb-4">
                <div>
                  <h2 className="text-lg md:text-xl font-semibold text-slate-800 uppercase tracking-tight flex items-center gap-2">
                    <Palette className="text-purple-500 w-5 h-5" /> Pedidos do Cliente
                  </h2>
                  <p className="text-[10px] font-bold text-slate-500 uppercase mt-1 tracking-widest">{selectedClientForPedidos.nome}</p>
                </div>
                <button onClick={() => setIsPedidosModalOpen(false)} className="p-1.5 hover:bg-slate-100 text-slate-500 rounded-md transition-colors"><X className="w-5 h-5" /></button>
              </div>

              {(() => {
                const modalTasks = tasks.filter(t => t.cliente_id === selectedClientForPedidos.id || (t.cliente_nome && t.cliente_nome.trim().toLowerCase() === selectedClientForPedidos.nome.trim().toLowerCase()));
                return (
                  <>
                    <div className="bg-purple-50 border border-purple-100 rounded-xl p-4 mb-4 flex justify-between items-center shadow-sm">
                      <div>
                        <p className="text-[9px] font-bold uppercase tracking-widest text-purple-600 mb-1">Total em Pedidos</p>
                        <p className="text-2xl font-black text-purple-700 leading-none">
                          {formatCurrency(modalTasks.reduce((a, t) => a + getTaskValue(t), 0))}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-[9px] font-bold uppercase tracking-widest text-purple-600 mb-1">Qtd.</p>
                        <p className="text-xl font-black text-purple-700 leading-none">{modalTasks.length}</p>
                      </div>
                    </div>
                    
                    <div className="flex-1 overflow-y-auto no-scrollbar space-y-2.5 pr-1">
                      {modalTasks.length === 0 ? (
                        <div className="text-center py-10 bg-slate-50 rounded-lg border border-slate-100">
                          <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest">Nenhum pedido encontrado.</p>
                          <p className="text-[10px] text-slate-400 mt-1">Crie na aba "Pedidos".</p>
                        </div>
                      ) : (
                        modalTasks.map(task => {
                          const val = getTaskValue(task);
                          const isPaid = String(task.payment_status || '').toLowerCase().trim() === 'pago' || String(task.status || '').toLowerCase().trim() === 'concluida';
                          
                          return (
                            <div key={task.id} className="flex flex-col bg-slate-50 hover:bg-slate-100 transition-colors p-3.5 rounded-lg border border-slate-200">
                              <div className="flex justify-between items-start gap-2 mb-1">
                                 <span className="text-xs font-bold text-slate-800 leading-snug line-clamp-2">{task.title}</span>
                                 <span className={`text-xs font-black shrink-0 ${isPaid ? 'text-emerald-600' : 'text-amber-600'}`}>
                                   {formatCurrency(val)}
                                 </span>
                              </div>
                              <div className="flex justify-between items-center mt-2 pt-2 border-t border-slate-200/60">
                                 <span className="text-[9px] font-bold uppercase tracking-widest text-slate-400">
                                   {task.category || 'Serviço'}
                                 </span>
                                 <span className={`text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded ${isPaid ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
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