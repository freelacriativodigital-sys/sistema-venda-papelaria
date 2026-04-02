import React, { useState } from "react";
import { supabase } from "../lib/supabase"; 
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AnimatePresence, motion } from "framer-motion";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Palette, CheckCheck, Loader2, Wallet, Download, Upload, ShoppingBag, Trash2, Plus, CheckCircle2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import TaskItem from "@/components/tasks/TaskItem";
import NewTaskForm from "@/components/tasks/NewTaskForm";
import EmptyState from "@/components/tasks/EmptyState";
import FinancialTab from "@/components/tasks/FinancialTab";

const priorityWeight = { urgente: 1, alta: 2, media: 3, baixa: 4 };

const COLUNAS_PERMITIDAS = [
  'title', 'description', 'priority', 'category', 'service_value', 
  'checklist', 'status', 'kanban_stage', 'payment_status', 'valor_pago', 
  'delivery_date', 'completed_date', 'cliente_id', 'cliente_nome'
];

export default function Pedidos() {
  const [activeTab, setActiveTab] = useState("pendentes");
  const queryClient = useQueryClient();

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingOrder, setEditingOrder] = useState(null);

  const { data: tasks = [], isLoading } = useQuery({
    queryKey: ["art-tasks"],
    queryFn: async () => {
      const { data, error } = await supabase.from("pedidos").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }) => {
      const { error } = await supabase.from("pedidos").update(data).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["art-tasks"] }),
  });

  const blindarDados = (dadosBrutos) => {
    const dadosLimpos = {};
    if (dadosBrutos.nome && !dadosBrutos.title) dadosLimpos.title = dadosBrutos.nome;
    if (dadosBrutos.valor && dadosBrutos.service_value === undefined) dadosLimpos.service_value = dadosBrutos.valor;

    Object.keys(dadosBrutos).forEach(key => {
      if (COLUNAS_PERMITIDAS.includes(key)) {
        let valor = dadosBrutos[key];
        if ((key === 'cliente_id' || key === 'delivery_date') && valor === "") valor = null;
        if ((key === 'service_value' || key === 'valor_pago') && (valor === "" || isNaN(valor))) valor = 0;
        dadosLimpos[key] = valor;
      }
    });

    if ('title' in dadosLimpos && (!dadosLimpos.title || String(dadosLimpos.title).trim() === "")) {
      dadosLimpos.title = "Pedido sem título";
    }
    return dadosLimpos;
  };

  const handleUpdate = async (arg1, arg2) => {
    let finalId, finalData;
    if (typeof arg1 === 'object' && arg1 !== null) {
      if (arg1.id !== undefined && arg1.data !== undefined) { finalId = arg1.id; finalData = arg1.data; } 
      else { finalId = arg1.id; finalData = arg1; }
    } else { finalId = arg1; finalData = arg2; }
    
    if (!finalId) return;
    const dadosBlindados = blindarDados(finalData);
    await updateMutation.mutateAsync({ id: finalId, data: dadosBlindados });
  };

  const handleCreate = async (data) => {
    const dadosBlindados = blindarDados(data);
    const { error } = await supabase.from("pedidos").insert([{ ...dadosBlindados, status: 'pendente' }]);
    if (error) alert("Erro ao salvar o pedido:\n" + error.message);
    else queryClient.invalidateQueries({ queryKey: ["art-tasks"] });
  };

  const handleSaveOrder = async (data) => {
    if (data.id) {
      await handleUpdate(data.id, data);
    } else {
      await handleCreate(data);
    }
    setIsFormOpen(false);
  };

  const handleDelete = async (task) => {
    const { error } = await supabase.from("pedidos").delete().eq("id", task.id);
    if (!error) queryClient.invalidateQueries({ queryKey: ["art-tasks"] });
  };

  const handleNewOrder = () => {
    setEditingOrder(null);
    setIsFormOpen(true);
  };

  const handleEditOrder = (task) => {
    setEditingOrder(task);
    setIsFormOpen(true);
  };

  const uniqueTasks = Array.from(new Map(tasks.map(t => [t.id, t])).values());

  const handleExportData = async () => {
    try {
      const dataStr = JSON.stringify({ produtos: uniqueTasks }, null, 2);
      const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
      const exportFileDefaultName = `backup_sistema_${new Date().toLocaleDateString('pt-BR').replace(/\//g, '-')}.json`;
      const linkElement = document.createElement('a');
      linkElement.setAttribute('href', dataUri);
      linkElement.setAttribute('download', exportFileDefaultName);
      linkElement.click();
    } catch (error) {
      console.error("Erro ao exportar:", error);
    }
  };

  const handleImportData = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const importedData = JSON.parse(e.target.result);
        const itemsToImport = importedData.produtos || importedData;
        
        if (Array.isArray(itemsToImport)) {
          for (const item of itemsToImport) {
            const { id, created_at, ...dataToImport } = item;
            await supabase.from("pedidos").insert([blindarDados(dataToImport)]);
          }
          queryClient.invalidateQueries({ queryKey: ["art-tasks"] });
          alert("Backup enviado com sucesso!");
        }
      } catch (error) {
        alert("Erro ao processar o arquivo JSON.");
      }
    };
    reader.readAsText(file);
  };

  const handleToggle = (task) => {
    const newStatus = task.status === "concluida" ? "pendente" : "concluida";
    handleUpdate(task.id, { status: newStatus, completed_date: newStatus === "concluida" ? new Date().toISOString() : null });
  };

  // --- CÁLCULOS DOS CARDS SUPERIORES ---
  const getTaskValue = (task) => {
    const checklistTotal = (task.checklist || []).reduce((s, i) => s + (Number(i.value) || 0), 0);
    if (checklistTotal > 0) return checklistTotal;
    let baseValue = 0;
    if (task.service_value !== undefined && task.service_value !== null && task.service_value !== "") {
       baseValue = Number(task.service_value);
    } else if (task.price) {
       const priceStr = typeof task.price === 'string' ? task.price.replace(/[^0-9.,]/g, '').replace(',', '.') : String(task.price);
       baseValue = (parseFloat(priceStr) || 0) * (Number(task.quantity) || 1);
    }
    return baseValue;
  };

  let ganhosReais = 0;
  let pendentesValor = 0;
  let totalPedidos = 0;

  uniqueTasks.forEach(task => {
    const totalValue = getTaskValue(task);
    const statusLower = String(task.status || '').toLowerCase().trim();
    const paymentLower = String(task.payment_status || '').toLowerCase().trim();
    
    const isPaid = paymentLower === 'pago' || statusLower === 'concluida' || statusLower === 'concluido';
    const isPartial = paymentLower === 'parcial';
    const valorAdiantado = Number(task.valor_pago || 0);

    totalPedidos += totalValue;

    if (isPaid) {
      ganhosReais += totalValue;
    } else if (isPartial || valorAdiantado > 0) {
      ganhosReais += valorAdiantado;
      pendentesValor += (totalValue - valorAdiantado);
    } else {
      pendentesValor += totalValue;
    }
  });

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0);
  };

  // --- SEPARAÇÃO DOS STATUS ---
  const solicitacoes = uniqueTasks.filter((t) => t.status === "solicitacao");
  const pendingTasks = uniqueTasks.filter((t) => t.status !== "concluida" && t.status !== "solicitacao");
  const completedTasks = uniqueTasks.filter((t) => t.status === "concluida");

  const organizarPorData = (lista) => {
    const dataAtual = new Date();
    dataAtual.setHours(dataAtual.getHours() - 3);
    const hoje = dataAtual.toISOString().split('T')[0];
    const dataAmanha = new Date(dataAtual);
    dataAmanha.setDate(dataAmanha.getDate() + 1);
    const amanha = dataAmanha.toISOString().split('T')[0];

    const sortByPriority = (arr) => arr.sort((a, b) => (priorityWeight[String(a.priority || '').toLowerCase()] || 99) - (priorityWeight[String(b.priority || '').toLowerCase()] || 99));
    const sortByDateAndPriority = (arr) => arr.sort((a, b) => {
      if (a.delivery_date !== b.delivery_date) {
         if (!a.delivery_date) return 1; if (!b.delivery_date) return -1;
         return String(a.delivery_date || '').localeCompare(String(b.delivery_date || ''));
      }
      return (priorityWeight[String(a.priority || '').toLowerCase()] || 99) - (priorityWeight[String(b.priority || '').toLowerCase()] || 99);
    });

    return {
      hoje: sortByPriority(lista.filter(t => !t.delivery_date || t.delivery_date <= hoje)), 
      amanha: sortByPriority(lista.filter(t => t.delivery_date === amanha)),
      proximos: sortByDateAndPriority(lista.filter(t => t.delivery_date && t.delivery_date > amanha))
    };
  };

  const gruposPendentes = organizarPorData(pendingTasks);

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 w-full pb-20 relative">
      <div className="border-b border-slate-200 bg-white/90 backdrop-blur-md sticky top-0 z-10 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-3 md:py-4 flex flex-col md:flex-row md:items-center justify-between transition-all gap-3">
          <div className="flex items-center gap-3">
            <div>
              <h1 className="text-lg md:text-xl font-semibold text-slate-800 uppercase leading-none tracking-tight">GERENCIADOR</h1>
              <p className="text-[9px] md:text-[10px] text-slate-500 font-medium uppercase tracking-widest mt-1">DE PEDIDOS</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button onClick={handleNewOrder} className="h-9 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-semibold uppercase text-[10px] shadow-sm px-4">
              <Plus size={14} className="mr-1.5"/> Novo Pedido
            </Button>
            <div className="w-px h-6 bg-slate-200 mx-1"></div>
            <Button variant="outline" size="icon" className="h-9 w-9 rounded-md border hover:bg-slate-50 text-slate-500" onClick={handleExportData}>
              <Download className="w-4 h-4" />
            </Button>
            <label className="cursor-pointer h-9 w-9 flex items-center justify-center rounded-md border border-slate-200 bg-white hover:bg-slate-50 transition-colors shadow-sm text-slate-500">
              <Upload className="w-4 h-4" />
              <input type="file" className="hidden" accept=".json" onChange={handleImportData} />
            </label>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 md:py-8 w-full">
        
        {/* CARDS SUPERIORES COLORIDOS (Padrão Executivo) */}
        {!isLoading && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
             <div className="bg-violet-600 rounded-xl p-3 md:p-4 border border-violet-700 shadow-md flex flex-col justify-between group overflow-hidden relative min-h-[90px]">
               <div className="absolute -top-2 -right-2 p-2 opacity-10 group-hover:scale-110 transition-transform"><ShoppingBag size={70}/></div>
               <div className="flex items-center justify-between mb-1.5 relative z-10">
                 <span className="text-[9px] font-semibold uppercase tracking-widest text-violet-100/90">Total em Pedidos</span>
               </div>
               <div className="relative z-10">
                 <h3 className="text-xl md:text-2xl font-semibold text-white tracking-tight">{formatCurrency(totalPedidos)}</h3>
               </div>
             </div>

             <div className="bg-emerald-600 rounded-xl p-3 md:p-4 border border-emerald-700 shadow-md flex flex-col justify-between group overflow-hidden relative min-h-[90px]">
               <div className="absolute -top-2 -right-2 p-2 opacity-10 group-hover:scale-110 transition-transform"><CheckCircle2 size={70}/></div>
               <div className="flex items-center justify-between mb-1.5 relative z-10">
                 <span className="text-[9px] font-semibold uppercase tracking-widest text-emerald-100/90">Já Recebido (Sinal)</span>
               </div>
               <div className="relative z-10">
                 <h3 className="text-xl md:text-2xl font-semibold text-white tracking-tight">{formatCurrency(ganhosReais)}</h3>
               </div>
             </div>

             <div className="bg-rose-600 rounded-xl p-3 md:p-4 border border-rose-700 shadow-md flex flex-col justify-between group overflow-hidden relative min-h-[90px]">
               <div className="absolute -top-2 -right-2 p-2 opacity-10 group-hover:scale-110 transition-transform"><Wallet size={70}/></div>
               <div className="flex items-center justify-between mb-1.5 relative z-10">
                 <span className="text-[9px] font-semibold uppercase tracking-widest text-rose-100/90">Falta Receber</span>
               </div>
               <div className="relative z-10">
                 <h3 className="text-xl md:text-2xl font-semibold text-white tracking-tight">{formatCurrency(pendentesValor)}</h3>
               </div>
             </div>
          </div>
        )}

        <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
          <TabsList className="w-full bg-slate-100 h-11 border border-slate-200 p-1 rounded-md flex">
            <TabsTrigger value="solicitacoes" className="flex-1 text-[9px] md:text-[10px] gap-1.5 font-semibold uppercase tracking-widest rounded data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-blue-600 relative">
              <ShoppingBag className="w-3.5 h-3.5" /> <span className="hidden xs:inline">Site/Catálogo</span><span className="xs:hidden">Site</span>
              {solicitacoes.length > 0 && <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white w-4 h-4 rounded-full text-[9px] flex items-center justify-center font-bold animate-pulse">{solicitacoes.length}</span>}
            </TabsTrigger>
            
            <TabsTrigger value="pendentes" className="flex-1 text-[9px] md:text-[10px] gap-1.5 font-semibold uppercase tracking-widest rounded data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-blue-600">
              <Palette className="w-3.5 h-3.5" /> <span className="hidden xs:inline">Pendentes</span><span className="xs:hidden">Fazer</span>
            </TabsTrigger>
            <TabsTrigger value="concluidas" className="flex-1 text-[9px] md:text-[10px] gap-1.5 font-semibold uppercase tracking-widest rounded data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-blue-600">
              <CheckCheck className="w-3.5 h-3.5" /> <span className="hidden xs:inline">Concluídas</span><span className="xs:hidden">Feitas</span>
            </TabsTrigger>
            <TabsTrigger value="financeiro" className="flex-1 text-[9px] md:text-[10px] gap-1.5 font-semibold uppercase tracking-widest rounded data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-blue-600">
              <Wallet className="w-3.5 h-3.5" /> <span className="hidden xs:inline">Financeiro</span><span className="xs:hidden">Caixa</span>
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {isLoading ? (
          <div className="flex justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-blue-600" /></div>
        ) : (
          <>
            {activeTab === "solicitacoes" && (
              <div className="space-y-4">
                <div className="bg-blue-50 border border-blue-200 p-3 rounded-lg text-blue-800">
                   <h2 className="font-semibold uppercase tracking-widest text-[10px] flex items-center gap-1.5"><ShoppingBag size={14}/> Novas Solicitações</h2>
                   <p className="text-[9px] mt-1 font-medium">Pedidos iniciados pelos clientes através do seu Catálogo ou Link da Bio. Aceite para iniciar a produção.</p>
                </div>
                
                {solicitacoes.length === 0 ? (
                   <div className="text-center py-16 bg-white rounded-xl border border-slate-200 shadow-sm">
                     <ShoppingBag className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                     <p className="text-slate-500 font-semibold uppercase tracking-widest text-[10px]">Nenhum pedido novo</p>
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
                               <Button onClick={() => handleUpdate(t.id, { status: 'pendente' })} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white h-8 text-[9px] uppercase font-semibold tracking-widest rounded-md">
                                 <CheckCheck size={12} className="mr-1.5"/> Aceitar Pedido
                               </Button>
                               <Button onClick={() => handleDelete(t)} variant="outline" className="h-8 px-2.5 rounded-md border-red-200 text-red-500 hover:bg-red-50">
                                 <Trash2 size={14} />
                               </Button>
                            </div>
                         </motion.div>
                       ))}
                     </AnimatePresence>
                   </div>
                )}
              </div>
            )}

            {activeTab === "pendentes" && (
              <div className="space-y-5">
                {pendingTasks.length === 0 ? <EmptyState type="pending" /> : (
                  <div className="flex flex-col gap-6">
                    <AnimatePresence mode="popLayout">
                      {gruposPendentes.hoje.length > 0 && (
                        <div className="space-y-2.5">
                          <div className="flex items-center gap-2 px-1">
                            <span className="text-[9px] font-semibold uppercase tracking-widest text-rose-500">● Entregar Hoje / Atrasados</span>
                            <div className="h-px flex-1 bg-rose-100"></div>
                          </div>
                          <div className="flex flex-col gap-2.5">
                            {gruposPendentes.hoje.map((t) => (
                              <motion.div key={t.id} layout initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}>
                                <TaskItem task={t} onToggle={handleToggle} onUpdate={handleUpdate} onDelete={handleDelete} onEdit={handleEditOrder} />
                              </motion.div>
                            ))}
                          </div>
                        </div>
                      )}

                      {gruposPendentes.amanha.length > 0 && (
                        <div className="space-y-2.5">
                          <div className="flex items-center gap-2 px-1">
                            <span className="text-[9px] font-semibold uppercase tracking-widest text-amber-500">○ Para Amanhã</span>
                            <div className="h-px flex-1 bg-amber-100"></div>
                          </div>
                          <div className="flex flex-col gap-2.5">
                            {gruposPendentes.amanha.map((t) => (
                              <motion.div key={t.id} layout initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}>
                                <TaskItem task={t} onToggle={handleToggle} onUpdate={handleUpdate} onDelete={handleDelete} onEdit={handleEditOrder} />
                              </motion.div>
                            ))}
                          </div>
                        </div>
                      )}

                      {gruposPendentes.proximos.length > 0 && (
                        <div className="space-y-2.5">
                          <div className="flex items-center gap-2 px-1">
                            <span className="text-[9px] font-semibold uppercase tracking-widest text-blue-400">📅 Próximas Entregas</span>
                            <div className="h-px flex-1 bg-blue-100/50"></div>
                          </div>
                          <div className="flex flex-col gap-2.5">
                            {gruposPendentes.proximos.map((t) => (
                              <motion.div key={t.id} layout initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}>
                                <TaskItem task={t} onToggle={handleToggle} onUpdate={handleUpdate} onDelete={handleDelete} onEdit={handleEditOrder} />
                              </motion.div>
                            ))}
                          </div>
                        </div>
                      )}
                    </AnimatePresence>
                  </div>
                )}
              </div>
            )}

            {activeTab === "concluidas" && (
              <div className="space-y-2.5">
                {completedTasks.map((t) => (
                  <TaskItem key={t.id} task={t} onToggle={handleToggle} onUpdate={handleUpdate} onDelete={handleDelete} onEdit={handleEditOrder} showUndo />
                ))}
              </div>
            )}

            {activeTab === "financeiro" && (
              <FinancialTab tasks={uniqueTasks} onUpdate={handleUpdate} />
            )}
          </>
        )}
      </div>

      {/* OVERLAY TELA CHEIA PARA NOVO/EDITAR PEDIDO */}
      <AnimatePresence>
         {isFormOpen && (
            <NewTaskForm 
              isOpen={isFormOpen} 
              onClose={() => setIsFormOpen(false)} 
              taskToEdit={editingOrder} 
              onSubmit={handleSaveOrder} 
            />
         )}
      </AnimatePresence>

    </div>
  );
}