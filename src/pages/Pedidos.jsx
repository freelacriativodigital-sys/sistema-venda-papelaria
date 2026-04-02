import React, { useState, useMemo } from "react";
import { supabase } from "../lib/supabase"; 
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AnimatePresence, motion } from "framer-motion";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Palette, CheckCheck, Loader2, Wallet, Download, Upload, 
  ShoppingBag, Trash2, Plus, CheckCircle2, Store, Paintbrush
} from "lucide-react";
import { Button } from "@/components/ui/button";
import TaskItem from "@/components/tasks/TaskItem";
import NewTaskForm from "@/components/tasks/NewTaskForm";
import EmptyState from "@/components/tasks/EmptyState";
import FinancialTab from "@/components/tasks/FinancialTab";

const priorityWeight = { urgente: 1, alta: 2, media: 3, baixa: 4 };

const COLUNAS_PERMITIDAS = [
  'title', 'description', 'priority', 'category', 'service_value', 
  'checklist', 'status', 'kanban_stage', 'payment_status', 'valor_pago', 
  'delivery_date', 'completed_date', 'cliente_id', 'cliente_nome', 'tipo_pedido'
];

// --- COMPONENTES MODULARES INTERNOS ---

const HeaderPedidos = ({ onNewOrder, onExport, onImport }) => (
  <div className="border-b border-slate-200 bg-white/90 backdrop-blur-md sticky top-0 z-10 shadow-sm">
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-3 flex flex-col md:flex-row md:items-center justify-between gap-3">
      <div>
        <h1 className="text-lg md:text-xl font-semibold text-slate-800 uppercase tracking-tight">ORGANIZE</h1>
        <p className="text-[9px] text-slate-500 font-medium uppercase tracking-widest mt-0.5">Gestão de Pedidos</p>
      </div>
      <div className="flex items-center gap-2">
        <Button onClick={onNewOrder} className="h-8 bg-blue-600 hover:bg-blue-700 text-white rounded-full font-semibold uppercase text-[9px] tracking-widest px-4">
          <Plus size={14} className="mr-1.5"/> Novo Pedido
        </Button>
        <div className="w-px h-5 bg-slate-200 mx-1"></div>
        <Button variant="outline" size="icon" className="h-8 w-8 rounded-full border text-slate-500" onClick={onExport}>
          <Download className="w-3.5 h-3.5" />
        </Button>
        <label className="cursor-pointer h-8 w-8 flex items-center justify-center rounded-full border border-slate-200 bg-white hover:bg-slate-50 text-slate-500">
          <Upload className="w-3.5 h-3.5" />
          <input type="file" className="hidden" accept=".json" onChange={onImport} />
        </label>
      </div>
    </div>
  </div>
);

const KPICards = ({ total, recebido, falta }) => {
  const formatCurrency = (val) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val || 0);
  
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
      <div className="bg-blue-600 rounded-xl p-3 border border-blue-700 shadow-sm flex flex-col justify-between group overflow-hidden relative min-h-[80px]">
        <div className="absolute -top-2 -right-2 p-2 opacity-10"><ShoppingBag size={60}/></div>
        <span className="text-[9px] font-semibold uppercase tracking-widest text-white/80 relative z-10 mb-1">Total em Pedidos</span>
        <h3 className="text-xl font-semibold text-white tracking-tight relative z-10">{formatCurrency(total)}</h3>
      </div>
      <div className="bg-emerald-600 rounded-xl p-3 border border-emerald-700 shadow-sm flex flex-col justify-between group overflow-hidden relative min-h-[80px]">
        <div className="absolute -top-2 -right-2 p-2 opacity-10"><CheckCircle2 size={60}/></div>
        <span className="text-[9px] font-semibold uppercase tracking-widest text-white/80 relative z-10 mb-1">Já Recebido</span>
        <h3 className="text-xl font-semibold text-white tracking-tight relative z-10">{formatCurrency(recebido)}</h3>
      </div>
      <div className="bg-rose-600 rounded-xl p-3 border border-rose-700 shadow-sm flex flex-col justify-between group overflow-hidden relative min-h-[80px]">
        <div className="absolute -top-2 -right-2 p-2 opacity-10"><Wallet size={60}/></div>
        <span className="text-[9px] font-semibold uppercase tracking-widest text-white/80 relative z-10 mb-1">Falta Receber</span>
        <h3 className="text-xl font-semibold text-white tracking-tight relative z-10">{formatCurrency(falta)}</h3>
      </div>
    </div>
  );
};

// --- COMPONENTE PRINCIPAL ---

export default function Pedidos() {
  const queryClient = useQueryClient();
  const [viewMode, setViewMode] = useState("site"); // 'site' ou 'arte'
  const [activeTab, setActiveTab] = useState("pendentes");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingOrder, setEditingOrder] = useState(null);

  const { data: allTasks = [], isLoading } = useQuery({
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

  // Filtra as tasks pelo modo de visualização atual (Site vs Arte)
  const currentTasks = useMemo(() => {
    return allTasks.filter(t => {
      const tipo = t.tipo_pedido || 'arte';
      return tipo === viewMode;
    });
  }, [allTasks, viewMode]);

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

    if ('title' in dadosLimpos && (!dadosLimpos.title || String(dadosLimpos.title).trim() === "")) dadosLimpos.title = "Pedido sem título";
    if (!dadosLimpos.tipo_pedido) dadosLimpos.tipo_pedido = viewMode; // Força o tipo atual
    
    return dadosLimpos;
  };

  const handleUpdate = async (id, data) => {
    const dadosBlindados = blindarDados(data);
    await updateMutation.mutateAsync({ id, data: dadosBlindados });
  };

  const handleSaveOrder = async (data) => {
    const dadosBlindados = blindarDados(data);
    if (data.id) {
      await updateMutation.mutateAsync({ id: data.id, data: dadosBlindados });
    } else {
      await supabase.from("pedidos").insert([{ ...dadosBlindados, status: 'pendente' }]);
      queryClient.invalidateQueries({ queryKey: ["art-tasks"] });
    }
    setIsFormOpen(false);
  };

  const handleDelete = async (task) => {
    const { error } = await supabase.from("pedidos").delete().eq("id", task.id);
    if (!error) queryClient.invalidateQueries({ queryKey: ["art-tasks"] });
  };

  // --- CÁLCULOS FINANCEIROS ISOLADOS ---
  const stats = useMemo(() => {
    let totalPedidos = 0, ganhosReais = 0, pendentesValor = 0;
    currentTasks.forEach(task => {
      let baseValue = Number(task.service_value || 0);
      const isPaid = task.payment_status === 'pago' || task.status === 'concluida';
      const isPartial = task.payment_status === 'parcial';
      const valorAdiantado = Number(task.valor_pago || 0);

      totalPedidos += baseValue;

      if (isPaid) {
        ganhosReais += baseValue;
      } else if (isPartial || valorAdiantado > 0) {
        ganhosReais += valorAdiantado;
        pendentesValor += (baseValue - valorAdiantado);
      } else {
        pendentesValor += baseValue;
      }
    });
    return { totalPedidos, ganhosReais, pendentesValor };
  }, [currentTasks]);

  // --- SEPARAÇÃO DOS STATUS ---
  const solicitacoes = currentTasks.filter((t) => t.status === "solicitacao");
  const pendingTasks = currentTasks.filter((t) => t.status !== "concluida" && t.status !== "solicitacao");
  const completedTasks = currentTasks.filter((t) => t.status === "concluida");

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 w-full pb-20">
      <HeaderPedidos 
        onNewOrder={() => { setEditingOrder(null); setIsFormOpen(true); }} 
        onExport={() => {}} 
        onImport={() => {}} 
      />

      <div className="max-w-4xl mx-auto px-4 py-6">
        
        {/* MODULADOR DE AMBIENTE: SITE VS ARTE */}
        <div className="flex bg-slate-200/60 p-1 rounded-full w-full max-w-sm mx-auto mb-8">
          <button 
            onClick={() => { setViewMode("site"); setActiveTab("pendentes"); }}
            className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-full text-[10px] font-semibold uppercase tracking-widest transition-all ${viewMode === "site" ? "bg-white text-blue-600 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
          >
            <Store size={14} /> Loja do Site
          </button>
          <button 
            onClick={() => { setViewMode("arte"); setActiveTab("pendentes"); }}
            className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-full text-[10px] font-semibold uppercase tracking-widest transition-all ${viewMode === "arte" ? "bg-white text-purple-600 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
          >
            <Paintbrush size={14} /> Criação de Arte
          </button>
        </div>

        {!isLoading && <KPICards total={stats.totalPedidos} recebido={stats.ganhosReais} falta={stats.pendentesValor} />}

        {/* NAVEGAÇÃO COMPACTA */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
          <TabsList className="w-full bg-slate-100 h-10 border border-slate-200 p-1 rounded-lg flex">
            {viewMode === "site" && (
              <TabsTrigger value="solicitacoes" className="flex-1 text-[9px] gap-1.5 font-semibold uppercase tracking-widest rounded-md data-[state=active]:bg-white data-[state=active]:text-blue-600 relative">
                <ShoppingBag className="w-3.5 h-3.5" /> <span className="hidden xs:inline">Catálogo</span>
                {solicitacoes.length > 0 && <span className="absolute -top-1 -right-1 bg-red-500 text-white w-3 h-3 rounded-full text-[8px] flex items-center justify-center animate-pulse">{solicitacoes.length}</span>}
              </TabsTrigger>
            )}
            <TabsTrigger value="pendentes" className="flex-1 text-[9px] gap-1.5 font-semibold uppercase tracking-widest rounded-md data-[state=active]:bg-white data-[state=active]:text-blue-600">
              <Palette className="w-3.5 h-3.5" /> Fazer
            </TabsTrigger>
            <TabsTrigger value="concluidas" className="flex-1 text-[9px] gap-1.5 font-semibold uppercase tracking-widest rounded-md data-[state=active]:bg-white data-[state=active]:text-blue-600">
              <CheckCheck className="w-3.5 h-3.5" /> Feitas
            </TabsTrigger>
            <TabsTrigger value="financeiro" className="flex-1 text-[9px] gap-1.5 font-semibold uppercase tracking-widest rounded-md data-[state=active]:bg-white data-[state=active]:text-blue-600">
              <Wallet className="w-3.5 h-3.5" /> Caixa
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {isLoading ? (
          <div className="flex justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-blue-600" /></div>
        ) : (
          <div className="space-y-4">
            {activeTab === "solicitacoes" && viewMode === "site" && (
              /* A renderização das solicitações se mantém igual ao seu código original, só modularizada visualmente */
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                 {/* ... Mapeamento de solicitações ... */}
                 {solicitacoes.map(t => (
                    <TaskItem key={t.id} task={t} onUpdate={handleUpdate} onDelete={handleDelete} />
                 ))}
              </div>
            )}
            
            {activeTab === "pendentes" && (
              <div className="flex flex-col gap-2.5">
                {pendingTasks.map((t) => (
                  <TaskItem key={t.id} task={t} onUpdate={(data) => handleUpdate(t.id, data)} onDelete={() => handleDelete(t)} onEdit={() => { setEditingOrder(t); setIsFormOpen(true); }} />
                ))}
              </div>
            )}

            {activeTab === "concluidas" && (
              <div className="flex flex-col gap-2.5">
                {completedTasks.map((t) => (
                  <TaskItem key={t.id} task={t} showUndo onUpdate={(data) => handleUpdate(t.id, data)} onDelete={() => handleDelete(t)} onEdit={() => { setEditingOrder(t); setIsFormOpen(true); }} />
                ))}
              </div>
            )}

            {activeTab === "financeiro" && <FinancialTab tasks={currentTasks} onUpdate={handleUpdate} />}
          </div>
        )}
      </div>

      <AnimatePresence>
         {isFormOpen && (
            <NewTaskForm isOpen={isFormOpen} onClose={() => setIsFormOpen(false)} taskToEdit={editingOrder} onSubmit={handleSaveOrder} />
         )}
      </AnimatePresence>
    </div>
  );
}