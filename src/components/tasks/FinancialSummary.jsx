import React from "react";
import { TrendingUp, Clock, CheckCircle2 } from "lucide-react";

const fmt = (v) =>
  v?.toLocaleString("pt-BR", { style: "currency", currency: "BRL" }) ?? "R$ 0,00";

export default function FinancialSummary({ tasks }) {
  let totalEmAberto = 0;
  let totalPago = 0;

  tasks.forEach((t) => {
    // Calcula o valor total do pedido
    const checklistTotal = (t.checklist || []).reduce((s, i) => s + (Number(i.value) || 0), 0);
    const baseValue = t.service_value !== undefined ? Number(t.service_value) : (Number(t.price) || 0);
    const displayValue = checklistTotal > 0 ? checklistTotal : baseValue;

    const valorAdiantado = Number(t.valor_pago || 0);
    const statusPagamento = String(t.payment_status || '').toLowerCase().trim();
    const isPaid = statusPagamento === 'pago' || String(t.status || '').toLowerCase().trim() === 'concluida';
    const isParcial = statusPagamento === 'parcial' || (valorAdiantado > 0 && !isPaid);

    if (isPaid || (valorAdiantado >= displayValue && displayValue > 0)) {
      totalPago += displayValue; // Se pagou tudo, soma o total em "Recebido"
    } else if (isParcial) {
      totalPago += valorAdiantado; // Soma só a entrada no "Recebido"
      totalEmAberto += (displayValue - valorAdiantado); // Soma só o restante no "Em Aberto"
    } else {
      totalEmAberto += displayValue; // Se não pagou nada, soma tudo no "Em Aberto"
    }
  });

  const totalGeral = totalEmAberto + totalPago;

  return (
    <div className="grid grid-cols-3 gap-2 md:gap-3 mb-6">
      <div className="bg-card border border-border rounded-xl p-3 md:p-4 text-center flex flex-col items-center justify-center">
        <div className="w-7 h-7 md:w-8 md:h-8 rounded-lg bg-primary/10 flex items-center justify-center mb-1 md:mb-2">
          <TrendingUp className="w-3.5 h-3.5 md:w-4 md:h-4 text-primary" />
        </div>
        <p className="hidden md:block text-[10px] text-muted-foreground uppercase tracking-wide font-medium">Total Geral</p>
        <p className="text-sm md:text-base font-bold text-foreground mt-0.5">{fmt(totalGeral)}</p>
      </div>

      <div className="bg-card border border-destructive/20 rounded-xl p-3 md:p-4 text-center flex flex-col items-center justify-center">
        <div className="w-7 h-7 md:w-8 md:h-8 rounded-lg bg-destructive/10 flex items-center justify-center mb-1 md:mb-2">
          <Clock className="w-3.5 h-3.5 md:w-4 md:h-4 text-destructive" />
        </div>
        <p className="hidden md:block text-[10px] text-muted-foreground uppercase tracking-wide font-medium">Em Aberto</p>
        <p className="text-sm md:text-base font-bold text-destructive mt-0.5">{fmt(totalEmAberto)}</p>
      </div>

      <div className="bg-card border border-green-200 rounded-xl p-3 md:p-4 text-center flex flex-col items-center justify-center">
        <div className="w-7 h-7 md:w-8 md:h-8 rounded-lg bg-green-100 flex items-center justify-center mb-1 md:mb-2">
          <CheckCircle2 className="w-3.5 h-3.5 md:w-4 md:h-4 text-green-600" />
        </div>
        <p className="hidden md:block text-[10px] text-muted-foreground uppercase tracking-wide font-medium">Recebido</p>
        <p className="text-sm md:text-base font-bold text-green-600 mt-0.5">{fmt(totalPago)}</p>
      </div>
    </div>
  );
}