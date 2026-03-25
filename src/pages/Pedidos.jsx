import React, { useState } from "react";
import { supabase } from "../lib/supabase"; 
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AnimatePresence, motion } from "framer-motion";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Palette, CheckCheck, Loader2, Wallet, Download, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import TaskItem from "@/components/tasks/TaskItem";
import NewTaskForm from "@/components/tasks/NewTaskForm";
import EmptyState from "@/components/tasks/EmptyState";
import FinancialTab from "@/components/tasks/FinancialTab";

const priorityWeight = {
  urgente: 1,
  alta: 2,
  media: 3,
  baixa: 4,
};

// Lista exata de colunas que existem na tabela 'pedidos' no Supabase
const COLUNAS_PERMITIDAS = [
  'title', 'description', 'priority', 'category', 'service_value', 
  'checklist', 'status', 'kanban_stage', 'payment_status', 'valor_pago', 
  'delivery_date', 'completed_date', 'cliente_id', 'cliente_nome'
];

export default function Pedidos() {
  const [activeTab, setActiveTab] = useState("pendentes");
  const queryClient = useQueryClient();

  const { data: tasks = [], isLoading } = useQuery({
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

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }) => {
      const { error } = await supabase.from("pedidos").update(data).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["art-tasks"] }),
  });

  // Função para limpar os dados antes de enviar ao banco
  const blindarDados = (dadosBrutos) => {
    const dadosLimpos = {};
    
    // Tratamento de segurança caso o form envie com chaves diferentes
    if (dadosBrutos.nome && !dadosBrutos.title) dadosLimpos.title = dadosBrutos.nome;
    if (dadosBrutos.valor && dadosBrutos.service_value === undefined) dadosLimpos.service_value = dadosBrutos.valor;

    Object.keys(dadosBrutos).forEach(key => {
      if (COLUNAS_PERMITIDAS.includes(key)) {
        let valor = dadosBrutos[key];

        // Se for string vazia em campos de ID ou Data, o Supabase exige que seja null
        if ((key === 'cliente_id' || key === 'delivery_date') && valor === "") {
          valor = null;
        }
        
        // Se for campo de valor, garante que seja número
        if ((key === 'service_value' || key === 'valor_pago') && (valor === "" || isNaN(valor))) {
          valor = 0;
        }

        dadosLimpos[key] = valor;
      }
    });

    // Garante que o title (obrigatório no banco) nunca vá vazio
    if (!dadosLimpos.title || dadosLimpos.title.trim() === "") {
      dadosLimpos.title = "Pedido sem título";
    }

    return dadosLimpos;
  };

  const handleUpdate = async (arg1, arg2) => {
    let finalId, finalData;
    if (typeof arg1 === 'object' && arg1 !== null) {
      if (arg1.id !== undefined && arg1.data !== undefined) {
        finalId = arg1.id;
        finalData = arg1.data;
      } else {
        finalId = arg1.id;
        finalData = arg1;
      }
    } else {
      finalId = arg1;
      finalData = arg2;
    }
    
    if (!finalId) return;
    
    const dadosBlindados = blindarDados(finalData);
    await updateMutation.mutateAsync({ id: finalId, data: dadosBlindados });
  };

  const handleCreate = async (data) => {
    const dadosBlindados = blindarDados(data);
    
    const { error } = await supabase.from("pedidos").insert([{ ...dadosBlindados, status: 'pendente' }]);
    
    if (error) {
      console.error("Erro detalhado do Supabase:", error);
      alert("Erro ao salvar o pedido no banco de dados:\n" + error.message);
    } else {
      queryClient.invalidateQueries({ queryKey: ["art-tasks"] });
    }
  };

  const handleDelete = async (task) => {
    const { error } = await supabase.from("pedidos").delete().eq("id", task.id);
    if (!error) queryClient.invalidateQueries({ queryKey: ["art-tasks"] });
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
          alert("Backup enviado para a NUVEM com sucesso!");
        }
      } catch (error) {
        alert("Erro ao processar o arquivo JSON.");
      }
    };
    reader.readAsText(file);
  };

  const handleToggle = (task) => {
    const newStatus = task.status === "concluida" ? "pendente" : "concluida";
    handleUpdate(task.id, { 
      status: newStatus, 
      completed_date: newStatus === "concluida" ? new Date().toISOString() : null 
    });
  };

  const pendingTasks = uniqueTasks.filter((t) => t.status !== "concluida");
  const completedTasks = uniqueTasks.filter((t) => t.status === "concluida");

  const organizarPorData = (lista) => {
    const dataAtual = new Date();
    dataAtual.setHours(dataAtual.getHours() - 3);
    const hoje = dataAtual.toISOString().split('T')[0];
    
    const dataAmanha = new Date(dataAtual);
    dataAmanha.setDate(dataAmanha.getDate() + 1);
    const amanha = dataAmanha.toISOString().split('T')[0];

    const sortByPriority = (arr) => arr.sort((a, b) => (priorityWeight[a.priority?.toLowerCase()] || 99) - (priorityWeight[b.priority?.toLowerCase()] || 99));

    const sortByDateAndPriority = (arr) => arr.sort((a, b) => {
      if (a.delivery_date !== b.delivery_date) {
         if (!a.delivery_date) return 1; 
         if (!b.delivery_date) return -1;
         return a.delivery_date.localeCompare(b.delivery_date);
      }
      return (priorityWeight[a.priority?.toLowerCase()] || 99) - (priorityWeight[b.priority?.toLowerCase()] || 99);
    });

    return {
      hoje: sortByPriority(lista.filter(t => !t.delivery_date || t.delivery_date <= hoje)), 
      amanha: sortByPriority(lista.filter(t => t.delivery_date === amanha)),
      proximos: sortByDateAndPriority(lista.filter(t => t.delivery_date && t.delivery_date > amanha))
    };
  };

  const gruposPendentes = organizarPorData(pendingTasks);

  return (
    <div className="min-h-screen bg-background text-foreground w-full pb-20">
      <div className="border-b border-border bg-card/90 backdrop-blur-md sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-3 md:py-4 flex items-center justify-between transition-all">
          <div className="flex items-center gap-3">
            <div>
              <h1 className="text-xl md:text-2xl font-bold md:font-semibold text-slate-800 uppercase leading-none tracking-tight">GERENCIADOR</h1>
              <p className="text-[10px] md:text-xs text-slate-500 font-medium uppercase tracking-widest mt-1">DE PEDIDOS</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="icon" className="h-9 w-9 md:h-9 md:w-9 rounded-md border" onClick={handleExportData}>
              <Download className="w-4 h-4 text-slate-600" />
            </Button>
            <label className="cursor-pointer h-9 w-9 md:h-9 md:w-9 flex items-center justify-center rounded-md border border-border bg-background hover:bg-secondary transition-colors shadow-sm">
              <Upload className="w-4 h-4 text-slate-600" />
              <input type="file" className="hidden" accept=".json" onChange={handleImportData} />
            </label>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 md:py-8 w-full">

        <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6 md:mb-8">
          <TabsList className="w-full bg-secondary/60 h-12 md:h-12 border border-border/40 p-1.5 rounded-lg flex">
            <TabsTrigger value="pendentes" className="flex-1 text-[10px] md:text-xs gap-1.5 md:gap-2 font-medium md:font-semibold uppercase tracking-tight rounded-md data-[state=active]:shadow-sm">
              <Palette className="w-3.5 h-3.5 md:w-4 md:h-4" /> <span className="hidden xs:inline">Pendentes</span><span className="xs:hidden">Fazer</span>
            </TabsTrigger>
            <TabsTrigger value="concluidas" className="flex-1 text-[10px] md:text-xs gap-1.5 md:gap-2 font-medium md:font-semibold uppercase tracking-tight rounded-md data-[state=active]:shadow-sm">
              <CheckCheck className="w-3.5 h-3.5 md:w-4 md:h-4" /> <span className="hidden xs:inline">Concluídas</span><span className="xs:hidden">Feitas</span>
            </TabsTrigger>
            <TabsTrigger value="financeiro" className="flex-1 text-[10px] md:text-xs gap-1.5 md:gap-2 font-medium md:font-semibold uppercase tracking-tight rounded-md data-[state=active]:shadow-sm">
              <Wallet className="w-3.5 h-3.5 md:w-4 md:h-4" /> <span className="hidden xs:inline">Financeiro</span><span className="xs:hidden">Caixa</span>
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {isLoading ? (
          <div className="flex justify-center py-20"><Loader2 className="w-6 h-6 md:w-8 md:h-8 animate-spin text-primary" /></div>
        ) : (
          <>
            {activeTab === "pendentes" && (
              <div className="space-y-6 md:space-y-6">
                <NewTaskForm onSubmit={handleCreate} />
                
                {pendingTasks.length === 0 ? <EmptyState type="pending" /> : (
                  <div className="flex flex-col gap-6 md:gap-8">
                    <AnimatePresence mode="popLayout">
                      
                      {gruposPendentes.hoje.length > 0 && (
                        <div className="space-y-3">
                          <div className="flex items-center gap-2 px-1">
                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-red-500">● Entregar Hoje / Atrasados</span>
                            <div className="h-[1px] flex-1 bg-red-100"></div>
                          </div>
                          <div className="flex flex-col gap-3">
                            {gruposPendentes.hoje.map((t) => (
                              <motion.div key={t.id} layout initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}>
                                <TaskItem task={t} onToggle={handleToggle} onUpdate={handleUpdate} onDelete={handleDelete} />
                              </motion.div>
                            ))}
                          </div>
                        </div>
                      )}

                      {gruposPendentes.amanha.length > 0 && (
                        <div className="space-y-3">
                          <div className="flex items-center gap-2 px-1">
                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-amber-500">○ Para Amanhã</span>
                            <div className="h-[1px] flex-1 bg-amber-100"></div>
                          </div>
                          <div className="flex flex-col gap-3">
                            {gruposPendentes.amanha.map((t) => (
                              <motion.div key={t.id} layout initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}>
                                <TaskItem task={t} onToggle={handleToggle} onUpdate={handleUpdate} onDelete={handleDelete} />
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
                                <TaskItem task={t} onToggle={handleToggle} onUpdate={handleUpdate} onDelete={handleDelete} />
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
              <div className="space-y-3 md:space-y-3">
                {completedTasks.map((t) => (
                  <TaskItem 
                    key={t.id} 
                    task={t} 
                    onToggle={handleToggle} 
                    onUpdate={handleUpdate} 
                    onDelete={handleDelete} 
                    showUndo 
                  />
                ))}
              </div>
            )}

            {activeTab === "financeiro" && (
              <FinancialTab tasks={uniqueTasks} onUpdate={handleUpdate} />
            )}
          </>
        )}
      </div>
    </div>
  );
}