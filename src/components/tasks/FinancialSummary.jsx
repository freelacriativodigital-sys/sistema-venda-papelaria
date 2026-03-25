import React, { useState } from "react";
import { TrendingUp, Clock, CheckCircle2, Eye, EyeOff } from "lucide-react";

const fmt = (v) =>
  v?.toLocaleString("pt-BR", { style: "currency", currency: "BRL" }) ?? "R$ 0,00";

export default function FinancialSummary({ tasks }) {
  // Estado para controlar a visualização dos valores sensíveis (inicia oculto)
  const [showValues, setShowValues] = useState(false);

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
      totalPago += displayValue; 
    } else if (isParcial) {
      totalPago += valorAdiantado; 
      totalEmAberto += (displayValue - valorAdiantado); 
    } else {
      totalEmAberto += displayValue; 
    }
  });

  const totalGeral = totalEmAberto + totalPago;

  return (
    <div className="relative mb-6">
      
      {/* Botão Olhinho para Mostrar/Ocultar Totais */}
      <div className="flex justify-end mb-2">
        <button 
          onClick={() => setShowValues(!showValues)}
          className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-slate-400 hover:text-slate-600 transition-colors"
        >
          {showValues ? <EyeOff size={14} /> : <Eye size={14} />}
          {showValues ? "Ocultar Totais" : "Ver Totais"}
        </button>
      </div>

      <div className="grid grid-cols-3 gap-2 md:gap-3">
        {/* TOTAL GERAL (Escondido por padrão) */}
        <div className="bg-card border border-border rounded-xl p-3 md:p-4 text-center flex flex-col items-center justify-center">
          <div className="w-7 h-7 md:w-8 md:h-8 rounded-lg bg-primary/10 flex items-center justify-center mb-1 md:mb-2">
            <TrendingUp className="w-3.5 h-3.5 md:w-4 md:h-4 text-primary" />
          </div>
          <p className="hidden md:block text-[10px] text-muted-foreground uppercase tracking-wide font-medium">Total Geral</p>
          <p className="text-sm md:text-base font-bold text-foreground mt-0.5">
            {showValues ? fmt(totalGeral) : "R$ *****"}
          </p>
        </div>

        {/* EM ABERTO (Sempre Visível) */}
        <div className="bg-card border border-destructive/20 rounded-xl p-3 md:p-4 text-center flex flex-col items-center justify-center relative overflow-hidden">
          {/* Brilho sutil para destacar que este é o painel de foco */}
          <div className="absolute inset-0 bg-gradient-to-t from-destructive/5 to-transparent"></div>
          
          <div className="relative z-10 flex flex-col items-center">
            <div className="w-7 h-7 md:w-8 md:h-8 rounded-lg bg-destructive/10 flex items-center justify-center mb-1 md:mb-2">
              <Clock className="w-3.5 h-3.5 md:w-4 md:h-4 text-destructive" />
            </div>
            <p className="hidden md:block text-[10px] text-muted-foreground uppercase tracking-wide font-medium">Em Aberto</p>
            <p className="text-sm md:text-base font-black text-destructive mt-0.5">
              {fmt(totalEmAberto)}
            </p>
          </div>
        </div>

        {/* RECEBIDO (Escondido por padrão) */}
        <div className="bg-card border border-green-200 rounded-xl p-3 md:p-4 text-center flex flex-col items-center justify-center">
          <div className="w-7 h-7 md:w-8 md:h-8 rounded-lg bg-green-100 flex items-center justify-center mb-1 md:mb-2">
            <CheckCircle2 className="w-3.5 h-3.5 md:w-4 md:h-4 text-green-600" />
          </div>
          <p className="hidden md:block text-[10px] text-muted-foreground uppercase tracking-wide font-medium">Recebido</p>
          <p className="text-sm md:text-base font-bold text-green-600 mt-0.5">
            {showValues ? fmt(totalPago) : "R$ *****"}
          </p>
        </div>
      </div>
    </div>
  );
}