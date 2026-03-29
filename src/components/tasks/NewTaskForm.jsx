import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { 
  Plus, X, UserSquare2, Loader2, CalendarDays, UserPlus, 
  ArrowLeft, Save, Briefcase, DollarSign, Layers, Tag
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

import ChecklistEditor from "./ChecklistEditor";
import { supabase } from "../../lib/supabase";

const DEFAULT_CATEGORIES = [
  { name: "Impressão", slug: "impressao" },
  { name: "Personalizados", slug: "personalizados" },
  { name: "Design Gráfico", slug: "design_grafico" },
  { name: "Convites", slug: "convites" },
  { name: "Brindes", slug: "brindes" },
  { name: "Adesivos", slug: "adesivos" }
];

export default function NewTaskForm({ isOpen, onClose, orderToEdit }) {
  const queryClient = useQueryClient();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState("media");
  const [category, setCategory] = useState("");
  const [serviceValue, setServiceValue] = useState("");
  const [checklist, setChecklist] = useState([]);
  const [deliveryDate, setDeliveryDate] = useState(null);
  
  const [selectedClientId, setSelectedClientId] = useState("novo");
  const [selectedClientName, setSelectedClientName] = useState("");

  const [newClientData, setNewClientData] = useState({
    nome: "", email: "", telefone: "", whatsapp: "", aniversario: ""
  });

  const { data: clients = [], isLoading: isLoadingClients } = useQuery({
    queryKey: ["clientes"],
    queryFn: async () => {
      const { data, error } = await supabase.from("clientes").select("*").order('nome', { ascending: true });
      if (error) throw error;
      return data || [];
    }
  });

  useEffect(() => {
    if (orderToEdit) {
      setTitle(orderToEdit.title || "");
      setDescription(orderToEdit.description || "");
      setPriority(orderToEdit.priority || "media");
      setCategory(orderToEdit.category || "");
      setServiceValue(orderToEdit.service_value || "");
      setChecklist(orderToEdit.checklist || []);
      setDeliveryDate(orderToEdit.delivery_date ? new Date(orderToEdit.delivery_date + 'T00:00:00') : null);
      if (orderToEdit.cliente_id) {
        setSelectedClientId(orderToEdit.cliente_id);
        setSelectedClientName(orderToEdit.cliente_nome || "");
      } else {
        setSelectedClientId("");
        setSelectedClientName("");
      }
    } else {
      setTitle(""); setDescription(""); setPriority("media"); setCategory("");
      setServiceValue(""); setChecklist([]); setDeliveryDate(null);
      setSelectedClientId("novo"); setSelectedClientName("");
    }
  }, [orderToEdit]);

  const saveClientMutation = useMutation({
    mutationFn: async (newClient) => {
      const { data, error } = await supabase.from("clientes").insert([newClient]).select('*').single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["clientes"] });
      setSelectedClientId(data.id);
      setSelectedClientName(data.nome);
      alert("Cliente cadastrado com sucesso!");
    },
  });

  const saveOrderMutation = useMutation({
    mutationFn: async (payload) => {
      if (orderToEdit) {
        const { error } = await supabase.from("pedidos").update(payload).eq("id", orderToEdit.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("pedidos").insert([payload]);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["art-tasks"] });
      onClose();
    },
  });

  const handleSave = () => {
    if (!title.trim()) return alert("O título/nome do pedido é obrigatório.");
    
    let finalClientId = selectedClientId;
    let finalClientName = selectedClientName;

    if (finalClientId === "novo") {
      finalClientId = null;
      finalClientName = newClientData.nome; 
    } else if (finalClientId) {
      const client = clients.find(c => c.id === finalClientId);
      if (client) finalClientName = client.nome;
    }

    const payload = {
      title,
      description,
      priority,
      category,
      service_value: serviceValue ? parseFloat(serviceValue) : 0,
      checklist,
      delivery_date: deliveryDate ? format(deliveryDate, "yyyy-MM-dd") : null,
      cliente_id: finalClientId !== "novo" ? finalClientId : null,
      cliente_nome: finalClientName || null,
      status: orderToEdit ? orderToEdit.status : "pendente",
      payment_status: orderToEdit ? orderToEdit.payment_status : "pendente",
      valor_pago: orderToEdit ? orderToEdit.valor_pago : 0,
      kanban_stage: orderToEdit ? orderToEdit.kanban_stage : "novo"
    };

    saveOrderMutation.mutate(payload);
  };

  if (!isOpen) return null;

  return (
    <motion.div 
      initial={{ opacity: 0, x: '10%' }} 
      animate={{ opacity: 1, x: 0 }} 
      exit={{ opacity: 0, x: '10%' }} 
      transition={{ type: "spring", bounce: 0, duration: 0.4 }}
      className="fixed inset-0 z-[200] bg-[#f8fafc] overflow-y-auto flex flex-col"
    >
      
      {/* HEADER FIXO ESTILO PÁGINA */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <button onClick={onClose} className="w-10 h-10 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-500 transition-colors">
              <ArrowLeft size={22} />
            </button>
            <div className="w-10 h-10 rounded-xl bg-blue-50 hidden sm:flex items-center justify-center border border-blue-100">
               <Briefcase className="text-blue-600 w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg md:text-2xl font-black text-slate-800 uppercase tracking-tight leading-none">
                {orderToEdit ? 'Editar Pedido' : 'Novo Pedido'}
              </h2>
              <p className="text-[10px] md:text-[11px] text-slate-500 font-bold uppercase mt-1 tracking-widest">
                {orderToEdit ? `#${orderToEdit.id.substring(0,8).toUpperCase()}` : 'Preencha os dados do cliente e do serviço'}
              </p>
            </div>
          </div>
          <Button onClick={handleSave} disabled={saveOrderMutation.isPending} className="bg-blue-600 hover:bg-blue-700 text-white h-11 px-6 md:px-8 rounded-lg font-bold uppercase text-[10px] md:text-xs shadow-md transition-colors">
            {saveOrderMutation.isPending ? <Loader2 className="w-5 h-5 animate-spin mr-2"/> : <Save size={16} className="mr-2"/>}
            Salvar
          </Button>
        </div>
      </div>

      {/* CORPO PRINCIPAL */}
      <div className="flex-1 w-full max-w-6xl mx-auto p-4 md:p-6 pb-24 grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* LADO ESQUERDO: Dados do Cliente e Detalhes */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          
          <div className="bg-white p-5 md:p-6 rounded-2xl border border-slate-200 shadow-sm space-y-5">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3 mb-2">
              <UserSquare2 size={18} className="text-blue-500"/>
              <h3 className="text-xs font-black uppercase text-slate-800 tracking-widest">1. Dados do Cliente</h3>
            </div>
            
            <div className="space-y-4">
              {isLoadingClients ? (
                 <div className="flex items-center gap-2 text-slate-400 text-xs font-bold uppercase"><Loader2 className="w-4 h-4 animate-spin"/> Carregando clientes...</div>
              ) : (
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase text-slate-500 tracking-widest ml-0.5">Selecione o Cliente</label>
                  <Select value={selectedClientId} onValueChange={(val) => { setSelectedClientId(val); if(val !== "novo") { const c = clients.find(cl => cl.id === val); setSelectedClientName(c ? c.nome : ""); }}}>
                    <SelectTrigger className="w-full h-12 bg-slate-50 border-slate-200 font-bold text-sm text-slate-700 rounded-xl focus:ring-blue-500">
                      <SelectValue placeholder="Selecione ou cadastre um novo..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="novo" className="font-bold text-blue-600 bg-blue-50 focus:bg-blue-100 focus:text-blue-700 mb-1">+ Cadastrar Novo Cliente Agora</SelectItem>
                      {clients.map(client => (
                        <SelectItem key={client.id} value={client.id} className="font-medium text-slate-700">
                          {client.nome} {client.whatsapp ? `(${client.whatsapp})` : ''}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* FORMULÁRIO RÁPIDO DE NOVO CLIENTE */}
              <AnimatePresence>
                {selectedClientId === "novo" && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                    <div className="bg-blue-50/50 border border-blue-100 p-4 rounded-xl space-y-4 mt-2 relative">
                      <div className="absolute top-0 right-4 px-2 py-0.5 bg-blue-500 text-white text-[8px] font-black uppercase rounded-b-md shadow-sm">Cadastro Rápido</div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-3">
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-bold uppercase text-slate-600 tracking-widest ml-1">Nome Completo *</label>
                          <Input value={newClientData.nome} onChange={e => setNewClientData({...newClientData, nome: e.target.value})} className="h-11 border-blue-200 bg-white rounded-lg font-semibold text-sm focus:border-blue-400" />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-bold uppercase text-slate-600 tracking-widest ml-1">WhatsApp</label>
                          <Input value={newClientData.whatsapp} onChange={e => setNewClientData({...newClientData, whatsapp: e.target.value})} placeholder="(00) 00000-0000" className="h-11 border-blue-200 bg-white rounded-lg font-semibold text-sm focus:border-blue-400" />
                        </div>
                      </div>
                      <Button type="button" onClick={() => { if (!newClientData.nome) return alert("O nome é obrigatório!"); saveClientMutation.mutate(newClientData); }} className="w-full h-11 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold uppercase tracking-widest text-[10px] shadow-sm">
                        {saveClientMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <><UserPlus size={14} className="mr-2"/> Salvar Cliente e Usar no Pedido</>}
                      </Button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          <div className="bg-white p-5 md:p-6 rounded-2xl border border-slate-200 shadow-sm space-y-5">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3 mb-2">
              <FileText size={18} className="text-slate-800"/>
              <h3 className="text-xs font-black uppercase text-slate-800 tracking-widest">2. Detalhes do Serviço</h3>
            </div>
            
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase text-slate-500 tracking-widest ml-0.5">Título do Pedido *</label>
                <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ex: 100 Cartões de Visita + Logo" className="h-12 border-slate-200 bg-slate-50 rounded-xl font-bold text-slate-800 focus:bg-white text-sm" />
              </div>
              
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase text-slate-500 tracking-widest ml-0.5">Descrição e Observações</label>
                <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Escreva os detalhes, cores, formato, referências..." className="min-h-[140px] border-slate-200 bg-slate-50 rounded-xl text-sm font-medium text-slate-700 resize-none focus:bg-white" />
              </div>
            </div>
          </div>

          <div className="bg-white p-5 md:p-6 rounded-2xl border border-slate-200 shadow-sm">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3 mb-4">
              <Layers size={18} className="text-emerald-500"/>
              <h3 className="text-xs font-black uppercase text-slate-800 tracking-widest">3. Etapas de Produção (Opcional)</h3>
            </div>
            <ChecklistEditor checklist={checklist} setChecklist={setChecklist} />
          </div>
          
        </div>

        {/* LADO DIREITO: Prazos, Valores e Organização */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          <div className="sticky top-28 space-y-6">
            
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-5">
               <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                 <DollarSign size={18} className="text-emerald-500"/>
                 <h3 className="text-xs font-black uppercase text-slate-800 tracking-widest">Valores & Prazos</h3>
               </div>
               
               <div className="space-y-1.5">
                 <label className="text-[10px] font-bold uppercase text-slate-500 tracking-widest ml-0.5">Valor Total (R$)</label>
                 <div className="relative">
                   <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-semibold text-sm">R$</span>
                   <Input type="number" value={serviceValue} onChange={(e) => setServiceValue(e.target.value)} placeholder="0.00" className="h-14 pl-10 border-emerald-200 bg-emerald-50/50 rounded-xl font-black text-xl text-emerald-700 focus:bg-white focus:border-emerald-400 shadow-inner" />
                 </div>
               </div>

               <div className="space-y-1.5">
                 <label className="text-[10px] font-bold uppercase text-slate-500 tracking-widest ml-0.5">Prazo de Entrega</label>
                 <Popover>
                   <PopoverTrigger asChild>
                     <Button variant="outline" className={`w-full h-12 justify-start text-left font-bold rounded-xl border-slate-200 ${!deliveryDate && "text-slate-400"}`}>
                       <CalendarDays className="mr-2 h-4 w-4" />
                       {deliveryDate ? format(deliveryDate, "PPP", { locale: ptBR }) : <span>Definir data...</span>}
                     </Button>
                   </PopoverTrigger>
                   <PopoverContent className="w-auto p-0" align="start">
                     <Calendar mode="single" selected={deliveryDate} onSelect={setDeliveryDate} initialFocus />
                   </PopoverContent>
                 </Popover>
               </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-5">
               <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                 <Tag size={18} className="text-purple-500"/>
                 <h3 className="text-xs font-black uppercase text-slate-800 tracking-widest">Classificação</h3>
               </div>

               <div className="space-y-1.5">
                 <label className="text-[10px] font-bold uppercase text-slate-500 tracking-widest ml-0.5">Prioridade</label>
                 <Select value={priority} onValueChange={setPriority}>
                   <SelectTrigger className="w-full h-12 border-slate-200 bg-slate-50 font-bold rounded-xl text-slate-700">
                     <SelectValue />
                   </SelectTrigger>
                   <SelectContent>
                     <SelectItem value="urgente" className="text-rose-600 font-bold">🔴 Urgente (Para Ontem)</SelectItem>
                     <SelectItem value="alta" className="text-amber-600 font-bold">🟠 Alta Prioridade</SelectItem>
                     <SelectItem value="media" className="text-blue-600 font-bold">🔵 Média (Normal)</SelectItem>
                     <SelectItem value="baixa" className="text-slate-600 font-bold">⚪ Baixa (Sem Pressa)</SelectItem>
                   </SelectContent>
                 </Select>
               </div>

               <div className="space-y-1.5">
                 <label className="text-[10px] font-bold uppercase text-slate-500 tracking-widest ml-0.5">Categoria do Serviço</label>
                 <Select value={category} onValueChange={setCategory}>
                   <SelectTrigger className="w-full h-12 border-slate-200 bg-slate-50 font-bold rounded-xl text-slate-700">
                     <SelectValue placeholder="Escolha uma opção" />
                   </SelectTrigger>
                   <SelectContent>
                     {DEFAULT_CATEGORIES.map(cat => (
                       <SelectItem key={cat.slug} value={cat.name} className="font-medium text-slate-700">{cat.name}</SelectItem>
                     ))}
                   </SelectContent>
                 </Select>
               </div>
            </div>

          </div>
        </div>

      </div>
    </motion.div>
  );
}