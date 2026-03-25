import React, { useState } from "react";
import { TrendingUp, Clock, CheckCircle2, Eye, EyeOff, Lock, X, Loader2 } from "lucide-react";
import { supabase } from "../../lib/supabase";
import { AnimatePresence, motion } from "framer-motion";

const fmt = (v) =>
  v?.toLocaleString("pt-BR", { style: "currency", currency: "BRL" }) ?? "R$ 0,00";

export default function FinancialSummary({ tasks }) {
  // Estados de controle
  const [showValues, setShowValues] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

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

  const handleToggleEye = () => {
    if (showValues) {
      // Se já está visível, pode ocultar sem pedir senha
      setShowValues(false);
    } else {
      // Se está oculto, abre o modal pedindo a senha
      setErrorMsg('');
      setPasswordInput('');
      setIsModalOpen(true);
    }
  };

  const handleVerifyPassword = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg('');

    try {
      // Busca a senha do perfil 'admin' no banco
      const { data, error } = await supabase
        .from('usuarios_painel')
        .select('senha')
        .eq('perfil', 'admin')
        .limit(1)
        .single();

      if (error || !data) {
        setErrorMsg('Erro ao verificar permissão. Contate o suporte.');
      } else if (data.senha === passwordInput) {
        // Senha correta! Libera a visualização
        setShowValues(true);
        setIsModalOpen(false);
        setPasswordInput('');
      } else {
        // Senha incorreta
        setErrorMsg('Senha incorreta. Acesso negado.');
        setPasswordInput('');
      }
    } catch (err) {
      setErrorMsg('Erro de conexão ao verificar senha.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative mb-6">
      
      {/* Botão Olhinho para Mostrar/Ocultar Totais */}
      <div className="flex justify-end mb-2">
        <button 
          onClick={handleToggleEye}
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

      {/* MODAL DE SENHA DO ADMINISTRADOR */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }} 
              onClick={() => setIsModalOpen(false)} 
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" 
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 10 }} 
              animate={{ opacity: 1, scale: 1, y: 0 }} 
              exit={{ opacity: 0, scale: 0.95, y: 10 }} 
              className="relative w-full max-w-sm bg-white rounded-xl shadow-2xl overflow-hidden z-10 border border-slate-100"
            >
              <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                <div>
                  <h3 className="font-bold text-slate-800 uppercase tracking-tight flex items-center gap-2">
                    <Lock size={16} className="text-blue-600" /> Acesso Restrito
                  </h3>
                  <p className="text-[10px] text-slate-500 font-medium uppercase mt-1 tracking-widest">
                    Insira a senha de Administrador
                  </p>
                </div>
                <button 
                  onClick={() => setIsModalOpen(false)} 
                  className="text-slate-400 hover:text-slate-600 p-1.5 rounded-md hover:bg-slate-200 transition-colors"
                >
                  <X size={16}/>
                </button>
              </div>
              <form onSubmit={handleVerifyPassword} className="p-6 space-y-5">
                <div className="relative">
                  <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input 
                    type="password" 
                    value={passwordInput} 
                    onChange={(e) => setPasswordInput(e.target.value)} 
                    placeholder="Sua senha..." 
                    className="w-full h-12 pl-10 pr-4 bg-slate-50 border border-slate-200 rounded-md text-sm font-bold text-slate-800 outline-none focus:border-blue-500 focus:bg-white transition-all shadow-sm tracking-widest text-center" 
                    required 
                    autoFocus 
                  />
                </div>
                
                {errorMsg && (
                  <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-[10px] font-bold text-red-500 uppercase tracking-widest text-center bg-red-50 p-2 rounded border border-red-100">
                    {errorMsg}
                  </motion.p>
                )}
                
                <button 
                  type="submit" 
                  disabled={isLoading} 
                  className="w-full h-11 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-bold uppercase text-[11px] tracking-widest transition-all flex items-center justify-center gap-2 shadow-sm disabled:opacity-50"
                >
                  {isLoading ? <Loader2 size={16} className="animate-spin"/> : 'Desbloquear Valores'}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}