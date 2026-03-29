// src/components/Home/homeUtils.js
import { supabase } from "../../lib/supabase";

// --- CÁLCULOS FINANCEIROS ---

// Função auxiliar para pegar o valor real do pedido
export const getTaskValue = (task) => {
  // 1. Prioridade para checklist com valores (somatório dos itens)
  const checklistTotal = (task.checklist || []).reduce((s, i) => s + (Number(i.value) || 0), 0);
  if (checklistTotal > 0) return checklistTotal;
  
  // 2. Fallback para service_value (padrão novo) ou price * quantity (padrão antigo)
  let baseValue = 0;
  if (task.service_value !== undefined && task.service_value !== null && task.service_value !== "") {
     baseValue = Number(task.service_value);
  } else if (task.price) {
     const priceStr = typeof task.price === 'string' ? task.price.replace(/[^0-9.,]/g, '').replace(',', '.') : String(task.price);
     baseValue = (parseFloat(priceStr) || 0) * (Number(task.quantity) || 1);
  }
  return baseValue;
};

// Processa a lista de pedidos para calcular Ganhos Reais e Pendentes
export const processFinancialData = (tasks = []) => {
  const uniqueTasks = Array.from(new Map(tasks.map(t => [t.id, t])).values());
  let pedidosGanhosReal = 0;
  let pedidosPendentesValor = 0;

  uniqueTasks.forEach(task => {
    const totalValue = getTaskValue(task);
    const isPaid = String(task.payment_status || '').toLowerCase().trim() === 'pago';
    const isPartial = String(task.payment_status || '').toLowerCase().trim() === 'parcial';
    const valorAdiantado = Number(task.valor_pago || 0);

    if (isPaid) {
      // Pedido Pago Integralmente: Todo o valor entra no ganho real
      pedidosGanhosReal += totalValue;
    } else if (isPartial || valorAdiantado > 0) {
      // Pedido Parcial (Sinal): O sinal entra no real, o restante no pendente
      pedidosGanhosReal += valorAdiantado;
      pedidosPendentesValor += (totalValue - valorAdiantado);
    } else {
      // Pedido Pendente (sem pagamento): Todo o valor no pendente
      pedidosPendentesValor += totalValue;
    }
  });

  return { pedidosGanhosReal, pedidosPendentesValor };
};

// Formatação padrão de moeda
export const formatCurrency = (value) => {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0);
};


// --- MUTAÇÃO (AJUSTE DE CAIXA) ---

// Essa função define a lógica da mutação que será usada na Home
export const createCashAdjustment = async ({ difference, saldoBancario, caixaRealLimpo }) => {
  if (difference === 0) return null;

  const isPositive = difference > 0;
  const absDiff = Math.abs(difference);
  
  // Define o payload do pedido de ajuste
  const payload = {
    title: `Ajuste de Caixa (${isPositive ? 'Entrada' : 'Saída'})`,
    service_value: isPositive ? absDiff : -absDiff, // Valor negativo se for saída
    priority: 'media',
    status: 'concluida', // Já nasce concluído
    payment_status: 'pago', // E pago
    description: `Ajuste automático para coincidir com saldo bancário de ${formatCurrency(Number(saldoBancario))}. Caixa sistema era ${formatCurrency(caixaRealLimpo)}.`
  };

  // Tenta inserir na tabela 'pedidos'
  const { data, error } = await supabase.from('pedidos').insert([payload]).select().single();
  
  if (error) throw error;
  return data;
};