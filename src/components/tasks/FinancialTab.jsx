import React, { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Clock, ChevronDown, ChevronUp, CheckSquare, Square } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

const fmt = (v) =>
  (v || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

function FinancialTaskRow({ task, onUpdate }) {
  const [expanded, setExpanded] = useState(false);
  
  const checklistTotal = (task.checklist || []).reduce((s, i) => s + (Number(i.value) || 0), 0);
  const baseValue = task.service_value !== undefined ? Number(task.service_value) : (Number(task.price) || 0);
  const displayValue = checklistTotal > 0 ? checklistTotal : baseValue;
  const hasChecklist = task.checklist && task.checklist.length > 0;

  // Lógica rigorosa de pagamento (Mesma da Home e Summary)
  const valorAdiantado = Number(task.valor_pago || 0);
  const statusString = String(task.payment_status || '').toLowerCase().trim();
  
  const isPaid = statusString === 'pago' || String(task.status || '').toLowerCase().trim() === 'concluida' || (valorAdiantado >= displayValue && displayValue > 0);
  const isParcial = !isPaid && (statusString === 'parcial' || valorAdiantado > 0);

  const togglePayment = () => {
    onUpdate(task.id, { payment_status: isPaid ? "em_aberto" : "pago" });
  };

  if (displayValue === 0) return null;

  return (
    <motion.div layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-card border border-border rounded-xl overflow-hidden">
      <div className="flex items-center gap-3 p-3">
        <button onClick={togglePayment} className="flex-shrink-0 transition-transform hover:scale-110">
          {isPaid
            ? <CheckCircle2 className="w-5 h-5 text-emerald-500" />
            : <Clock className="w-5 h-5 text-rose-500 hover:text-emerald-400" />
          }
        </button>

        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-foreground truncate">{task.cliente_nome || task.title}</p>
          <div className="flex items-center gap-2 mt-0.5">
            <Badge
              className={`text-[10px] px-2 py-0 cursor-pointer ${
                isPaid ? "bg-emerald-50 text-emerald-600 hover:bg-emerald-100 border-transparent"
                  : isParcial ? "bg-blue-50 text-blue-600 hover:bg-blue-100 border-blue-100/50"
                  : "bg-rose-50 text-rose-600 hover:bg-rose-100 border-transparent"
              }`}
              onClick={togglePayment}
            >
              {isPaid ? "Pago" : isParcial ? "Parcial" : "Em aberto"}
            </Badge>
            {task.status === "concluida" && (
              <Badge variant="secondary" className="text-[10px] px-2 py-0 bg-slate-100 text-slate-600">Concluída</Badge>
            )}
          </div>
        </div>

        <div className="flex flex-col items-end gap-0.5">
          <div className="flex items-center gap-2">
            {isParcial ? (
               <span className="text-sm font-black text-rose-600 flex items-center gap-1">
                 <span className="text-[9px] text-rose-500 uppercase tracking-widest hidden sm:inline">Falta</span> 
                 {fmt(displayValue - valorAdiantado)}
               </span>
            ) : (
               <span className={`text-sm font-bold ${isPaid ? "text-emerald-600" : "text-rose-600"}`}>
                 {fmt(displayValue)}
               </span>
            )}

            {hasChecklist && (
              <button onClick={() => setExpanded(!expanded)} className="text-muted-foreground ml-1">
                {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>
            )}
          </div>
          
          {isParcial && (
            <span className="text-[9px] font-bold uppercase tracking-widest text-slate-400 leading-none">
              Total: {fmt(displayValue)}
            </span>
          )}
        </div>
      </div>

      <AnimatePresence>
        {expanded && hasChecklist && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="border-t border-border/50 px-4 pb-3 pt-2 space-y-1.5 bg-slate-50/30">
              {task.checklist.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {item.done
                      ? <CheckSquare className="w-3.5 h-3.5 text-purple-500" />
                      : <Square className="w-3.5 h-3.5 text-slate-300" />
                    }
                    <span className={`text-xs font-medium ${item.done ? "line-through text-slate-400" : "text-slate-700"}`}>
                      {item.name || "Sem nome"}
                    </span>
                  </div>
                  {item.value > 0 && (
                    <span className="text-xs font-medium text-slate-500">{fmt(item.value)}</span>
                  )}
                </div>
              ))}
              <div className="flex justify-end pt-2 border-t border-slate-100 mt-2">
                <span className="text-xs font-bold text-purple-600">Total: {fmt(checklistTotal)}</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default function FinancialTab({ tasks, onUpdate }) {
  const [filter, setFilter] = useState("todos");

  // Filtra as tarefas que tem algum valor (para não mostrar tarefas zeradas no financeiro)
  const tasksWithValue = tasks.filter((t) => {
    const checklistTotal = (t.checklist || []).reduce((s, i) => s + (Number(i.value) || 0), 0);
    const baseValue = t.service_value !== undefined ? Number(t.service_value) : (Number(t.price) || 0);
    return checklistTotal > 0 || baseValue > 0;
  });

  // Cálculo global para exibir nos botões de filtro
  let totalEmAbertoGlobal = 0;
  let totalPagoGlobal = 0;

  tasksWithValue.forEach((t) => {
    const checklistTotal = (t.checklist || []).reduce((s, i) => s + (Number(i.value) || 0), 0);
    const baseValue = t.service_value !== undefined ? Number(t.service_value) : (Number(t.price) || 0);
    const displayValue = checklistTotal > 0 ? checklistTotal : baseValue;

    const valorAdiantado = Number(t.valor_pago || 0);
    const statusPagamento = String(t.payment_status || '').toLowerCase().trim();
    
    const isPaid = statusPagamento === 'pago' || String(t.status || '').toLowerCase().trim() === 'concluida' || (valorAdiantado >= displayValue && displayValue > 0);
    const isParcial = !isPaid && (statusPagamento === 'parcial' || valorAdiantado > 0);

    if (isPaid) {
      totalPagoGlobal += displayValue;
    } else if (isParcial) {
      totalPagoGlobal += valorAdiantado;
      totalEmAbertoGlobal += (displayValue - valorAdiantado);
    } else {
      totalEmAbertoGlobal += displayValue;
    }
  });

  // Filtra quais tarefas vão aparecer na lista
  const emAberto = tasksWithValue.filter((t) => {
    const statusPagamento = String(t.payment_status || '').toLowerCase().trim();
    const isConcluida = String(t.status || '').toLowerCase().trim() === 'concluida';
    const displayVal = (t.checklist || []).reduce((s, i) => s + (Number(i.value) || 0), 0) || (t.service_value !== undefined ? Number(t.service_value) : Number(t.price) || 0);
    return statusPagamento !== "pago" && !isConcluida && (Number(t.valor_pago || 0) < displayVal);
  });
  
  const pagos = tasksWithValue.filter((t) => {
    const statusPagamento = String(t.payment_status || '').toLowerCase().trim();
    const isConcluida = String(t.status || '').toLowerCase().trim() === 'concluida';
    const displayVal = (t.checklist || []).reduce((s, i) => s + (Number(i.value) || 0), 0) || (t.service_value !== undefined ? Number(t.service_value) : Number(t.price) || 0);
    return statusPagamento === "pago" || isConcluida || (Number(t.valor_pago || 0) >= displayVal);
  });

  const filtered = filter === "em_aberto" ? emAberto : filter === "pagos" ? pagos : tasksWithValue;

  return (
    <div className="space-y-4">
      {/* Botões de Filtro */}
      <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
        {[
          { key: "todos", label: "Todos" },
          { key: "em_aberto", label: `Em aberto — ${fmt(totalEmAbertoGlobal)}` },
          { key: "pagos", label: `Pagos — ${fmt(totalPagoGlobal)}` },
        ].map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`text-[10px] md:text-xs px-3 py-1.5 rounded-full border transition-all font-bold uppercase tracking-tight whitespace-nowrap ${
              filter === f.key
                ? "bg-primary text-primary-foreground border-primary shadow-sm"
                : "bg-card text-slate-500 border-border hover:border-primary/40"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-12 text-slate-400 text-[10px] md:text-xs font-bold uppercase tracking-widest">
          Nenhuma tarefa com valor encontrada
        </div>
      ) : (
        <div className="space-y-2">
          <AnimatePresence>
            {filtered.map((task) => (
              <FinancialTaskRow key={task.id} task={task} onUpdate={onUpdate} />
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}