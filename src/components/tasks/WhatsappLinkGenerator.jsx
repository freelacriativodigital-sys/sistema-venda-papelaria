import React, { useState } from "react";
import { base44 as db } from "../api";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AnimatePresence, motion } from "framer-motion";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Palette, CheckCheck, Loader2, Wallet, Download, Upload, Database, Link as LinkIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

// Importações dos seus componentes
import TaskItem from "@/components/tasks/TaskItem";
import NewTaskForm from "@/components/tasks/NewTaskForm";
import EmptyState from "@/components/tasks/EmptyState";
import FinancialSummary from "@/components/tasks/FinancialSummary";
import FinancialTab from "@/components/tasks/FinancialTab";
import WhatsappLinkGenerator from "@/components/tasks/WhatsappLinkGenerator"; // Novo componente!

const priorityWeight = { urgente: 1, alta: 2, media: 3, baixa: 4 };

export default function Home() {
  const [activeTab, setActiveTab] = useState("pendentes");
  const queryClient = useQueryClient();

  const { data: tasks = [], isLoading } = useQuery({
    queryKey: ["art-tasks"],
    queryFn: () => db.get("ArtTask"),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => db.update("ArtTask", id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["art-tasks"] }),
  });

  // Funções de Backup
  const handleExportData = async () => {
    try {
      const categories = await db.get("Category");
      const tasksData = await db.get("ArtTask");
      const backup = { categories, tasks: tasksData, exportDate: new Date().toISOString() };
      const blob = new Blob([JSON.stringify(backup, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `CRIARTE_DADOS.json`;
      link.click();
    } catch (err) { alert("Erro ao gerar backup."); }
  };

  const handleToggle = (task) => {
    const newStatus = task.status === "concluida" ? "pendente" : "concluida";
    updateMutation.mutate({
      id: task.id,
      data: { status: newStatus, completed_date: newStatus === "concluida" ? new Date().toISOString() : null },
    });
  };

  const sortTasks = (list) => [...list].sort((a, b) => (priorityWeight[a.priority?.toLowerCase()] || 99) - (priorityWeight[b.priority?.toLowerCase()] || 99));

  const pendingTasks = sortTasks(tasks.filter((t) => t.status !== "concluida"));
  const completedTasks = tasks.filter((t) => t.status === "concluida");

  return (
    <div className="min-h-screen bg-background text-foreground font-sans">
      <div className="border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-black uppercase tracking-tighter">Criarte</h1>
          </div>
          <div className="flex gap-1">
            <Button variant="ghost" size="icon" onClick={handleExportData}><Download className="w-4 h-4" /></Button>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6">
        {!isLoading && <FinancialSummary tasks={tasks} />}

        <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
          <TabsList className="w-full bg-secondary/60 h-10 border border-border/40 p-1">
            <TabsTrigger value="pendentes" className="flex-1 text-[10px] font-bold uppercase gap-1.5">
              <Palette className="w-3.5 h-3.5" /> Pendentes
            </TabsTrigger>
            <TabsTrigger value="concluidas" className="flex-1 text-[10px] font-bold uppercase gap-1.5">
              <CheckCheck className="w-3.5 h-3.5" /> Concluídas
            </TabsTrigger>
            <TabsTrigger value="financeiro" className="flex-1 text-[10px] font-bold uppercase gap-1.5">
              <Wallet className="w-3.5 h-3.5" /> Financeiro
            </TabsTrigger>
            {/* NOVA ABA DE CONVITES */}
            <TabsTrigger value="links" className="flex-1 text-[10px] font-bold uppercase gap-1.5">
              <LinkIcon className="w-3.5 h-3.5" /> Convites
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {isLoading ? (
          <div className="flex justify-center py-20"><Loader2 className="w-5 h-5 animate-spin text-primary" /></div>
        ) : (
          <>
            {activeTab === "pendentes" && (
              <div className="space-y-4">
                <NewTaskForm onSubmit={(data) => db.create("ArtTask", data).then(() => queryClient.invalidateQueries(["art-tasks"]))} />
                <AnimatePresence mode="popLayout">
                  {pendingTasks.map((t) => (
                    <motion.div key={t.id} layout transition={{ type: "spring", stiffness: 500, damping: 40 }}>
                      <TaskItem task={t} onToggle={handleToggle} onUpdate={(id, data) => updateMutation.mutate({ id, data })} onDelete={(task) => db.delete("ArtTask", task.id).then(() => queryClient.invalidateQueries(["art-tasks"]))} />
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}

            {activeTab === "concluidas" && (
              <div className="space-y-4">
                {completedTasks.map((t) => <TaskItem key={t.id} task={t} onToggle={handleToggle} onUpdate={(id, data) => updateMutation.mutate({ id, data })} onDelete={(task) => db.delete("ArtTask", task.id).then(() => queryClient.invalidateQueries(["art-tasks"]))} showUndo />)}
              </div>
            )}

            {activeTab === "financeiro" && <FinancialTab tasks={tasks} onUpdate={({ id, data }) => updateMutation.mutate({ id, data })} />}

            {/* CONTEÚDO DA NOVA ABA */}
            {activeTab === "links" && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                <WhatsappLinkGenerator />
              </motion.div>
            )}
          </>
        )}
      </div>
      
      <footer className="max-w-2xl mx-auto px-4 pb-8 pt-4 border-t border-border/40 text-center">
        <p className="text-[9px] text-muted-foreground uppercase font-bold tracking-widest flex items-center justify-center gap-2">
          <Database className="w-3 h-3" /> Backup sugerido uma vez por semana
        </p>
      </footer>
    </div>
  );
}