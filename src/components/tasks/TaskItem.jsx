import React from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Trash2, Clock, CheckCircle2, CheckSquare, Square, Pencil, MessageCircle, FileText, DollarSign, Coins, AlertCircle, Calendar } from "lucide-react";
import { supabase } from "../../lib/supabase"; 
import html2pdf from 'html2pdf.js';

const fmt = (v) => v?.toLocaleString("pt-BR", { style: "currency", currency: "BRL" }) ?? "R$ 0,00";

const getDeadlineInfo = (dateStr) => {
  if (!dateStr) return null;
  const [year, month, day] = dateStr.split('-');
  const deadline = new Date(year, month - 1, day);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const diffTime = deadline - today;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  const dataFormatada = deadline.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });

  if (diffDays < 0) return { label: `Atrasado (${dataFormatada})`, color: "bg-rose-600 text-white font-black animate-pulse shadow-sm shadow-rose-200", icon: <AlertCircle size={10} className="mr-1"/> };
  if (diffDays === 0) return { label: "Entregar Hoje", color: "bg-amber-400 text-amber-950 font-black shadow-sm", icon: <Clock size={10} className="mr-1"/> };
  if (diffDays <= 3) return { label: `Em ${diffDays} dias (${dataFormatada})`, color: "bg-amber-100 text-amber-700 font-bold", icon: null };
  return { label: dataFormatada, color: "bg-slate-100 text-slate-500 font-bold", icon: <Calendar size={10} className="mr-1"/> };
};

export default function TaskItem({ task, onToggle, onUpdate, onDelete, onEdit, showUndo }) {
  const isCompleted = task.status === "concluido";
  
  const totalItems = task.checklist ? task.checklist.length : 0;
  const completedItems = task.checklist ? task.checklist.filter(item => item.completed).length : 0;
  const progress = totalItems === 0 ? 0 : (completedItems / totalItems) * 100;

  const paymentStatusMap = {
    pendente: { label: "Pendente", color: "bg-rose-50 text-rose-600 border border-rose-100" },
    parcial: { label: "Sinal Pago", color: "bg-blue-50 text-blue-600 border border-blue-100" },
    pago: { label: "Pago", color: "bg-emerald-50 text-emerald-600 border border-emerald-100" }
  };

  const currentPaymentStatus = paymentStatusMap[task.payment_status || "pendente"];
  const deadlineInfo = getDeadlineInfo(task.delivery_date);

  const handleSetPago = () => onUpdate(task.id, { payment_status: "pago", valor_pago: task.service_value || 0 });
  
  const handleSetParcial = () => {
    const valor = prompt(`Qual valor de sinal/entrada o cliente já pagou? \nValor total do pedido: ${fmt(task.service_value)}`, task.valor_pago || "");
    if (valor !== null) {
      const numValor = Number(valor.replace(',', '.'));
      if (!isNaN(numValor) && numValor > 0) {
        onUpdate(task.id, { payment_status: numValor >= task.service_value ? "pago" : "parcial", valor_pago: numValor });
      }
    }
  };

  const exportToPDF = () => {
    const element = document.createElement('div');
    element.innerHTML = `
      <div style="font-family: Arial, sans-serif; padding: 40px; color: #333; max-width: 800px; margin: 0 auto;">
        <div style="border-bottom: 2px solid #eee; padding-bottom: 20px; margin-bottom: 30px;">
          <h1 style="color: #2563eb; margin: 0 0 10px 0; font-size: 28px;">ORDEM DE SERVIÇO</h1>
          <p style="margin: 0; color: #64748b; font-size: 14px;">Pedido #${task.id?.substring(0,8).toUpperCase() || '0000'} • Data: ${new Date().toLocaleDateString('pt-BR')}</p>
        </div>
        <div style="display: flex; justify-content: space-between; margin-bottom: 40px; background: #f8fafc; padding: 20px; border-radius: 8px;">
          <div>
            <h3 style="margin: 0 0 10px 0; color: #0f172a; font-size: 14px; text-transform: uppercase; letter-spacing: 1px;">Cliente</h3>
            <p style="margin: 0; font-size: 18px; font-weight: bold; color: #334155;">${task.cliente_nome || 'Cliente não informado'}</p>
          </div>
          <div style="text-align: right;">
            <h3 style="margin: 0 0 10px 0; color: #0f172a; font-size: 14px; text-transform: uppercase; letter-spacing: 1px;">Prazo de Entrega</h3>
            <p style="margin: 0; font-size: 18px; font-weight: bold; color: #334155;">${task.delivery_date ? new Date(task.delivery_date + 'T00:00:00').toLocaleDateString('pt-BR') : 'A combinar'}</p>
          </div>
        </div>
        <div style="margin-bottom: 40px;">
          <h2 style="color: #0f172a; font-size: 20px; margin-bottom: 15px;">Detalhes do Pedido</h2>
          <div style="background: #fff; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px;">
            <h3 style="margin: 0 0 10px 0; color: #1e293b; font-size: 18px;">${task.title}</h3>
            <p style="margin: 0; color: #475569; line-height: 1.6; white-space: pre-wrap;">${task.description || 'Nenhuma descrição detalhada.'}</p>
          </div>
        </div>
        <div style="margin-bottom: 40px;">
          <h2 style="color: #0f172a; font-size: 20px; margin-bottom: 15px;">Itens / Checklist</h2>
          <ul style="list-style-type: none; padding: 0; margin: 0;">
            ${task.checklist && task.checklist.length > 0 
              ? task.checklist.map(item => `
                <li style="padding: 12px; border-bottom: 1px solid #eee; display: flex; align-items: center; color: #334155;">
                  <span style="display: inline-block; width: 16px; height: 16px; border: 2px solid ${item.completed ? '#22c55e' : '#cbd5e1'}; background: ${item.completed ? '#22c55e' : 'transparent'}; border-radius: 4px; margin-right: 12px;"></span>
                  ${item.text}
                </li>`).join('') 
              : '<li style="color: #94a3b8; font-style: italic;">Nenhum item na lista.</li>'}
          </ul>
        </div>
        <div style="border-top: 2px solid #eee; padding-top: 20px; text-align: right;">
          <h3 style="margin: 0 0 5px 0; color: #64748b; font-size: 14px; text-transform: uppercase;">Valor do Serviço</h3>
          <p style="margin: 0; font-size: 24px; font-weight: bold; color: #0f172a;">${fmt(task.service_value)}</p>
          <p style="margin: 5px 0 0 0; font-size: 14px; color: ${task.payment_status === 'pago' ? '#22c55e' : '#f59e0b'}; font-weight: bold;">
            Status Financeiro: ${task.payment_status === 'pago' ? 'Pago Integralmente' : task.payment_status === 'parcial' ? `Sinal Pago (${fmt(task.valor_pago)})` : 'Aguardando Pagamento'}
          </p>
        </div>
      </div>
    `;

    const opt = {
      margin: 1,
      filename: `OS_${task.cliente_nome ? task.cliente_nome.split(' ')[0] : 'Pedido'}_${task.id?.substring(0,4)}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: 'cm', format: 'a4', orientation: 'portrait' }
    };
    html2pdf().set(opt).from(element).save();
  };

  return (
    <div className={`bg-white rounded-xl shadow-sm border overflow-hidden transition-all duration-300 relative group ${isCompleted ? "opacity-75 border-slate-200" : "border-slate-200 hover:shadow-md hover:border-slate-300"}`}>
      <div className={`absolute top-0 left-0 w-1.5 h-full ${
        task.priority === "urgente" ? "bg-rose-500" : 
        task.priority === "alta" ? "bg-amber-500" : 
        task.priority === "media" ? "bg-blue-500" : "bg-slate-300"
      }`} />

      <div className="p-4 md:p-5 pl-5 md:pl-6">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
          
          <div className="flex items-start gap-3 flex-1 min-w-0">
            <button onClick={() => onToggle(task)} className={`mt-0.5 shrink-0 transition-transform active:scale-90 ${isCompleted ? "text-emerald-500" : "text-slate-300 hover:text-emerald-400"}`}>
              {isCompleted ? <CheckSquare size={22} /> : <Square size={22} />}
            </button>
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-1.5">
                <span className="text-[9px] md:text-[10px] font-bold uppercase tracking-widest text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                  {task.category || "Geral"}
                </span>
                <span className={`text-[9px] md:text-[10px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded flex items-center ${currentPaymentStatus.color}`}>
                  {currentPaymentStatus.label}
                </span>
                {deadlineInfo && (
                  <span className={`text-[9px] md:text-[10px] uppercase tracking-widest px-1.5 py-0.5 rounded flex items-center shadow-sm ${deadlineInfo.color}`}>
                    {deadlineInfo.icon} {deadlineInfo.label}
                  </span>
                )}
              </div>
              <h3 className={`text-sm md:text-base font-black tracking-tight line-clamp-2 ${isCompleted ? "text-slate-500 line-through decoration-slate-300" : "text-slate-800"}`}>
                {task.title}
              </h3>
              <p className="text-[11px] md:text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                {task.description || "Nenhuma descrição fornecida."}
              </p>
              
              {task.cliente_nome && (
                <div className="flex items-center gap-1.5 mt-2.5 bg-slate-50 w-fit px-2 py-1 rounded-md border border-slate-100">
                  <div className="w-5 h-5 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-[9px] uppercase">
                    {task.cliente_nome.charAt(0)}
                  </div>
                  <span className="text-[10px] md:text-[11px] font-bold text-slate-600 truncate max-w-[120px] md:max-w-[200px]">
                    {task.cliente_nome}
                  </span>
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-row md:flex-col items-center md:items-end justify-between gap-3 shrink-0 pt-3 md:pt-0 border-t border-slate-100 md:border-0">
             <div className="flex flex-col md:items-end">
               <span className="text-[9px] md:text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Valor Total</span>
               <span className={`text-base md:text-lg font-black leading-none ${isCompleted ? "text-slate-400" : "text-emerald-600"}`}>
                 {fmt(task.service_value)}
               </span>
               {task.valor_pago > 0 && task.payment_status !== "pago" && (
                 <span className="text-[9px] font-bold text-blue-500 uppercase tracking-widest mt-1">Pago: {fmt(task.valor_pago)}</span>
               )}
             </div>

             {totalItems > 0 && (
               <div className="w-24 md:w-32 flex flex-col items-end gap-1.5">
                  <div className="flex justify-between w-full text-[9px] font-bold text-slate-500 uppercase tracking-widest">
                    <span>Etapas</span>
                    <span>{completedItems}/{totalItems}</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                    <div className="bg-blue-500 h-1.5 rounded-full transition-all duration-500" style={{ width: `${progress}%` }} />
                  </div>
               </div>
             )}
          </div>

        </div>
      </div>

      <div className="bg-slate-50 border-t border-slate-100 p-2 md:p-3 flex flex-wrap items-center justify-between gap-2 pl-5 md:pl-6">
         <div className="flex items-center gap-1.5 flex-1">
            {task.payment_status !== "pago" && (
              <>
                <Button onClick={handleSetPago} variant="ghost" className="h-8 px-2.5 text-[10px] font-black uppercase tracking-widest text-emerald-700 bg-emerald-50 hover:bg-emerald-100 transition-colors">
                  <DollarSign size={12} className="md:mr-1.5"/> <span className="hidden md:inline">Marcar Pago</span>
                </Button>
                <Button onClick={handleSetParcial} variant="ghost" className="h-8 px-2.5 text-[10px] font-black uppercase tracking-widest text-blue-700 bg-blue-50 hover:bg-blue-100 transition-colors">
                  <Coins size={12} className="md:mr-1.5"/> <span className="hidden md:inline">Pagto Parcial</span>
                </Button>
              </>
            )}
            {isCompleted && showUndo && (
              <Button onClick={() => onToggle(task)} variant="ghost" className="h-8 px-2.5 text-[10px] font-black uppercase tracking-widest text-amber-600 bg-amber-50 hover:bg-amber-100">
                 Desfazer Conclusão
              </Button>
            )}
         </div>
         
         <div className="flex gap-1.5 shrink-0">
            <Button onClick={exportToPDF} variant="ghost" className="h-8 px-2.5 text-[10px] font-black uppercase tracking-widest text-indigo-600 hover:bg-indigo-50" title="Imprimir Ordem de Serviço">
              <FileText size={12} className="md:mr-1.5"/> <span className="hidden md:inline">O.S.</span>
            </Button>
            <Button onClick={() => onEdit(task)} variant="ghost" className="h-8 px-2.5 text-[10px] font-black uppercase tracking-widest text-slate-500 hover:bg-slate-100">
              <Pencil size={12} className="md:mr-1.5"/> <span className="hidden md:inline">Editar</span>
            </Button>
            <Button onClick={() => onDelete(task)} variant="ghost" className="h-8 px-2.5 text-[10px] font-black uppercase tracking-widest text-rose-500 hover:bg-rose-50">
              <Trash2 size={12} className="md:mr-1.5"/> <span className="hidden md:inline">Excluir</span>
            </Button>
         </div>
      </div>
    </div>
  );
}