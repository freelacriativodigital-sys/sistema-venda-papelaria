import React, { useState } from "react";
import { supabase } from "../lib/supabase"; 
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AnimatePresence, motion } from "framer-motion";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Palette, CheckCheck, Loader2, Wallet, Download, Upload, ShoppingBag, Trash2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

import TaskItem from "@/components/tasks/TaskItem";
import NewTaskForm from "@/components/tasks/NewTaskForm";
import EmptyState from "@/components/tasks/EmptyState";
import FinancialSummary from "@/components/tasks/FinancialSummary";
import FinancialTab from "@/components/tasks/FinancialTab";

const priorityWeight = { urgente: 1, alta: 2, media: 3, baixa: 4 };

export default function Pedidos() {
  const [activeTab, setActiveTab] = useState("pendentes");
  const queryClient = useQueryClient();

  // Estados da Nova Página Sobreposta (Overlay)
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

  const updateTaskMutation = useMutation({
    mutationFn: async ({ id, updates }) => {
      const { error } = await supabase.from("pedidos").update(updates).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["art-tasks"] }),
  });

  const deleteTaskMutation = useMutation({
    mutationFn: async (id) => {
      const { error } = await supabase.from("pedidos").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["art-tasks"] }),
  });

  const handleUpdate = (id, updates) => updateTaskMutation.mutate({ id, updates });
  const handleDelete = (task) => { if (window.confirm(`Excluir o pedido "${task.title}" permanentemente?`)) { deleteTaskMutation.mutate(task.id); } };
  const handleToggle = (task) => {
    const isCompleted = task.status === "concluido";
    handleUpdate(task.id, { status: isCompleted ? "pendente" : "concluido", completed_date: isCompleted ? null : new Date().toISOString() });
  };

  const handleNewOrder = () => {
    setEditingOrder(null);
    setIsFormOpen(true);
  };

  const handleEditOrder = (task) => {
    setEditingOrder(task);
    setIsFormOpen(true);
  };

  const uniqueTasks = Array.from(new Map(tasks.map(item => [item.id, item])).values());
  const pendingTasks = uniqueTasks.filter((t) => t.status !== "concluido");
  const completedTasks = uniqueTasks.filter((t) => t.status === "concluido");

  // Separação de Atrasados, Hoje e Próximos
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);

  const gruposPendentes = pendingTasks.reduce((acc, t) => {
    if (!t.delivery_date) { acc.proximos.push(t); return acc; }
    const [year, month, day] = t.delivery_date.split('-');
    const deadline = new Date(year, month - 1, day);
    const diffTime = deadline - hoje;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) acc.atrasados.push(t);
    else if (diffDays === 0) acc.hoje.push(t);
    else acc.proximos.push(t);
    return acc;
  }, { atrasados: [], hoje: [], proximos: [] });

  const sortTasks = (arr) => arr.sort((a, b) => priorityWeight[a.priority] - priorityWeight[b.priority]);
  sortTasks(gruposPendentes.atrasados);
  sortTasks(gruposPendentes.hoje);
  sortTasks(gruposPendentes.proximos);

  if (isLoading) return <div className="min-h-screen flex items-center justify-center bg-slate-50"><Loader2 className="w-10 h-10 animate-spin text-blue-500" /></div>;

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 pb-32">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-6 md:pt-8">
        
        {/* HEADER TIPO DASHBOARD */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
             <h1 className="text-xl md:text-2xl font-bold md:font-semibold uppercase text-slate-800 tracking-tight">Painel de Pedidos</h1>
             <p className="text-[10px] md:text-[11px] font-medium text-slate-500 uppercase tracking-widest mt-1">
               Acompanhe e gerencie suas encomendas
             </p>
          </div>
          <Button onClick={handleNewOrder} className="h-11 md:h-10 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold uppercase text-[10px] md:text-xs gap-2 px-6 shadow-md transition-all w-full sm:w-auto">
            <Plus size={16} /> Novo Pedido
          </Button>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full mb-6">
          <TabsList className="w-full bg-slate-200/50 p-1 flex">
            <TabsTrigger value="pendentes" className="flex-1 text-[11px] font-bold uppercase tracking-widest data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-sm">
              <Palette size={14} className="mr-2" /> Produção
            </TabsTrigger>
            <TabsTrigger value="concluidas" className="flex-1 text-[11px] font-bold uppercase tracking-widest data-[state=active]:bg-white data-[state=active]:text-emerald-600 data-[state=active]:shadow-sm">
              <CheckCheck size={14} className="mr-2" /> Prontos
            </TabsTrigger>
            <TabsTrigger value="financeiro" className="flex-1 text-[11px] font-bold uppercase tracking-widest data-[state=active]:bg-white data-[state=active]:text-purple-600 data-[state=active]:shadow-sm">
              <Wallet size={14} className="mr-2" /> Financeiro
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {activeTab !== "financeiro" && <FinancialSummary tasks={uniqueTasks} />}

        {uniqueTasks.length === 0 ? (
          <EmptyState onAdd={handleNewOrder} />
        ) : (
          <div className="mt-8">
            {activeTab === "pendentes" && (
              <div className="space-y-8">
                {pendingTasks.length === 0 ? (
                  <div className="text-center py-10 bg-white rounded-xl border border-slate-200 shadow-sm">
                    <CheckCheck size={40} className="mx-auto text-emerald-400 mb-3" />
                    <p className="text-slate-500 font-bold uppercase text-[11px] tracking-widest">Nenhum pedido na fila de produção!</p>
                  </div>
                ) : (
                  <div className="space-y-8">
                    <AnimatePresence mode="popLayout">
                      {gruposPendentes.atrasados.length > 0 && (
                        <div className="space-y-3">
                          <div className="flex items-center gap-2 px-1">
                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-rose-500">🚨 Atrasados</span>
                            <div className="h-[1px] flex-1 bg-rose-200"></div>
                          </div>
                          <div className="flex flex-col gap-3">
                            {gruposPendentes.atrasados.map((t) => (
                              <motion.div key={t.id} layout initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}>
                                <TaskItem task={t} onToggle={handleToggle} onUpdate={handleUpdate} onDelete={handleDelete} onEdit={handleEditOrder} />
                              </motion.div>
                            ))}
                          </div>
                        </div>
                      )}

                      {gruposPendentes.hoje.length > 0 && (
                        <div className="space-y-3">
                          <div className="flex items-center gap-2 px-1">
                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-amber-500">⚡ Entregar Hoje</span>
                            <div className="h-[1px] flex-1 bg-amber-200"></div>
                          </div>
                          <div className="flex flex-col gap-3">
                            {gruposPendentes.hoje.map((t) => (
                              <motion.div key={t.id} layout initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}>
                                <TaskItem task={t} onToggle={handleToggle} onUpdate={handleUpdate} onDelete={handleDelete} onEdit={handleEditOrder} />
                              </motion.div>
                            ))}
                          </div>
                        </div>
                      )}

                      {gruposPendentes.proximos.length > 0 && (
                        <div className="space-y-3">
                          <div className="flex items-center gap-2 px-1">
                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#33BEE8]">📅 Próximas Entregas</span>
                            <div className="h-[1px] flex-1 bg-[#33BEE8]/20"></div>
                          </div>
                          <div className="flex flex-col gap-3">
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
              <div className="space-y-3">
                {completedTasks.map((t) => (
                  <TaskItem key={t.id} task={t} onToggle={handleToggle} onUpdate={handleUpdate} onDelete={handleDelete} onEdit={handleEditOrder} showUndo />
                ))}
              </div>
            )}

            {activeTab === "financeiro" && (
              <FinancialTab tasks={uniqueTasks} onUpdate={handleUpdate} />
            )}
          </div>
        )}
      </div>

      {/* RENDERIZAÇÃO DA PÁGINA SOBREPOSTA (OVERLAY) DE PEDIDO */}
      <AnimatePresence>
        {isFormOpen && (
          <NewTaskForm 
            isOpen={isFormOpen} 
            onClose={() => setIsFormOpen(false)} 
            orderToEdit={editingOrder} 
          />
        )}
      </AnimatePresence>
    </div>
  );
}