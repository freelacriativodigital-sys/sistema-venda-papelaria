import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Trash2, Clock, CheckCircle2, CheckSquare, Square, Pencil, MessageCircle, FileText, DollarSign, Coins, AlertCircle, Calendar, ChevronDown, ChevronUp } from "lucide-react";
import { supabase } from "../../lib/supabase"; 
import html2pdf from 'html2pdf.js';

const fmt = (v) =>
  v?.toLocaleString("pt-BR", { style: "currency", currency: "BRL" }) ?? "R$ 0,00";

const getDeadlineInfo = (dateStr, isDone) => {
  if (!dateStr) return null;
  const [year, month, day] = dateStr.split('-');
  const deadline = new Date(year, month - 1, day);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const diffTime = deadline - today;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  const dataFormatada = deadline.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });

  if (isDone) return { label: `Entregue (${dataFormatada})`, color: "bg-slate-50 text-slate-500 border-slate-200", icon: false };

  if (diffDays < 0) return { label: `Atrasado (${dataFormatada})`, color: "bg-rose-50 text-rose-600 border-rose-200 animate-pulse", icon: true };
  if (diffDays === 0) return { label: `Hoje (${dataFormatada})`, color: "bg-amber-500 text-white border-amber-600 shadow-sm", icon: true };
  if (diffDays <= 2) return { label: `Em ${diffDays}d (${dataFormatada})`, color: "bg-amber-50 text-amber-600 border-amber-200", icon: false };
  return { label: `Para ${dataFormatada}`, color: "bg-slate-50 text-slate-500 border-slate-200", icon: false };
};

export default function TaskItem({ task, onToggle, onDelete, onUpdate, onEdit, showUndo = false }) {
  const [config, setConfig] = useState(null);
  const [showAllItems, setShowAllItems] = useState(false); 
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    async function loadConfig() {
      const { data } = await supabase.from('configuracoes').select('*').eq('id', 1).single();
      if (data) setConfig(data);
    }
    loadConfig();
  }, []);

  const isDone = task.status === "concluida";
  const checklistTotal = (task.checklist || []).reduce((s, i) => s + (Number(i.value) || 0), 0);
  const baseValue = task.service_value !== undefined ? Number(task.service_value) : (Number(task.price) || 0);
  const displayValue = checklistTotal > 0 ? checklistTotal : baseValue;
  
  const deadline = getDeadlineInfo(task.delivery_date, isDone); 

  const valorPago = Number(task.valor_pago || 0);
  let statusPagamento = 'pendente';
  let corValor = 'text-slate-700';
  
  if (task.payment_status === 'pago' || (valorPago >= displayValue && displayValue > 0)) {
     statusPagamento = 'pago';
     corValor = 'text-emerald-600';
  } else if (task.payment_status === 'parcial' || (valorPago > 0 && valorPago < displayValue)) {
     statusPagamento = 'parcial';
     corValor = 'text-rose-500'; 
  } else {
     statusPagamento = 'pendente';
     corValor = 'text-slate-700';
  }

  const hasChecklist = task.checklist && task.checklist.length > 0;
  const hasDescription = task.description && task.description.trim().length > 0;

  const visibleChecklist = (hasChecklist && task.checklist.length > 5 && !showAllItems) 
    ? task.checklist.slice(0, 3) 
    : task.checklist;

  const hiddenItemsCount = (hasChecklist && task.checklist.length > 5 && !showAllItems) 
    ? task.checklist.length - 3 
    : 0;

  const handleSetPago = (e) => {
    e.stopPropagation();
    onUpdate(task.id, { payment_status: 'pago', valor_pago: displayValue });
  };

  const handleSetAgPagamento = (e) => {
    e.stopPropagation();
    onUpdate(task.id, { status: 'concluida' });
  };

  const handleSetParcial = (e) => {
    e.stopPropagation();
    const input = window.prompt(`Informe o valor pago pelo cliente (Total: R$ ${displayValue.toFixed(2)}):`);
    if (input === null || input.trim() === '') return;
    
    let cleanStr = input.replace('R$', '').trim();
    if (cleanStr.includes('.') && cleanStr.includes(',')) {
      cleanStr = cleanStr.replace(/\./g, '').replace(',', '.');
    } else if (cleanStr.includes(',')) {
      cleanStr = cleanStr.replace(',', '.');
    }

    const val = parseFloat(cleanStr);
    if (!isNaN(val) && val >= 0) {
      if(val >= displayValue) {
        onUpdate(task.id, { payment_status: 'pago', valor_pago: val });
      } else {
        onUpdate(task.id, { payment_status: 'parcial', valor_pago: val });
      }
    } else {
      alert('Valor inválido. Tente digitar apenas os números, como 50,00');
    }
  };

  const handleWhatsAppShare = async (e) => {
    e.stopPropagation();
    let numero = "";

    if (task.cliente_id) {
      const { data } = await supabase.from('clientes').select('whatsapp').eq('id', task.cliente_id).single();
      if (data?.whatsapp) {
        numero = data.whatsapp.replace(/\D/g, '');
        if (!numero.startsWith('55')) numero = '55' + numero;
      }
    }

    const checklist = task.checklist || [];
    let itensTexto = checklist.length > 0 
      ? checklist.map(item => `▪️ *${item.name || 'Item'}* - ${fmt(item.value)}`).join('\n')
      : `▪️ *${task.title}* - ${fmt(displayValue)}`;

    let texto = `*DETALHAMENTO DE SERVIÇOS*\n\n` +
                  `*Cliente:* ${task.cliente_nome || "Cliente"}\n` +
                  `*Valor Total:* ${fmt(displayValue)}\n`;
                  
    if (statusPagamento === 'parcial') {
      texto += `*Valor Adiantado:* ${fmt(valorPago)}\n*Restante:* ${fmt(displayValue - valorPago)}\n`;
    }
                  
    texto += `\n_Resumo dos serviços:_\n${itensTexto}\n\n_Agradecemos a confiança._`;

    const url = numero ? `https://wa.me/${numero}?text=${encodeURIComponent(texto)}` : `https://wa.me/?text=${encodeURIComponent(texto)}`;
    window.open(url, '_blank');
  };

  const handleGeneratePDF = (e) => {
    e.stopPropagation();
    const nomeClienteRaw = task.cliente_nome || "Cliente";
    const nomeClienteUpper = nomeClienteRaw.toUpperCase();
    const dataAtual = new Date().toLocaleDateString('pt-BR');
    
    const corBase = config?.cor_orcamento || '#0f172a';
    const corNomeEmpresa = config?.cor_nome_empresa || corBase;

    const checklist = task.checklist || [];
    const linhasHTML = checklist.length > 0
      ? checklist.map(item => `
          <tr style="border-bottom: 1px solid #e2e8f0;">
            <td style="padding: 10px 12px; font-size: 12px; color: #334155;">${item.name || 'Serviço'}</td>
            <td style="padding: 10px 12px; font-size: 12px; color: #334155; text-align: center;">1</td>
            <td style="padding: 10px 12px; font-size: 12px; color: #334155; text-align: right;">${fmt(item.value)}</td>
            <td style="padding: 10px 12px; font-size: 12px; color: #0f172a; text-align: right; font-weight: bold;">${fmt(item.value)}</td>
          </tr>
        `).join('')
      : `
          <tr style="border-bottom: 1px solid #e2e8f0;">
            <td style="padding: 10px 12px; font-size: 12px; color: #334155;">${task.title}</td>
            <td style="padding: 10px 12px; font-size: 12px; color: #334155; text-align: center;">1</td>
            <td style="padding: 10px 12px; font-size: 12px; color: #334155; text-align: right;">${fmt(displayValue)}</td>
            <td style="padding: 10px 12px; font-size: 12px; color: #0f172a; text-align: right; font-weight: bold;">${fmt(displayValue)}</td>
          </tr>
        `;

    let totaisHTML = `
      <div style="display: flex; justify-content: space-between; font-size: 11px; color: #64748b; margin-bottom: 10px;">
        <span>Subtotal</span>
        <span>${fmt(displayValue)}</span>
      </div>
    `;

    if (statusPagamento === 'parcial' || valorPago > 0) {
      totaisHTML += `
        <div style="display: flex; justify-content: space-between; font-size: 11px; font-weight: 600; color: ${corBase}; margin-bottom: 10px;">
          <span>Sinal / Pago</span>
          <span>- ${fmt(valorPago)}</span>
        </div>
        <div style="display: flex; justify-content: space-between; font-size: 11px; font-weight: 500; color: #64748b; padding-bottom: 12px; border-bottom: 1px solid #e2e8f0;">
          <span>Restante</span>
          <span>${fmt(displayValue - valorPago)}</span>
        </div>
      `;
    }

    totaisHTML += `
      <div style="display: flex; justify-content: space-between; align-items: flex-end; padding-top: 10px;">
        <span style="font-size: 10px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px; color: #64748b;">Total Final</span>
        <span style="font-size: 18px; font-weight: bold; color: ${corBase};">${fmt(displayValue)}</span>
      </div>
    `;

    const htmlContent = `
      <div style="font-family: 'Inter', sans-serif; padding: 15mm; width: 210mm; box-sizing: border-box; background: white;">
        <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid ${corBase}; padding-bottom: 20px; margin-bottom: 30px;">
          <div style="display: flex; align-items: center; gap: 15px;">
            ${config?.logo_url ? `<img src="${config.logo_url}" style="height: 60px; width: 60px; object-fit: contain; border-radius: 6px;">` : ''}
            <div>
              <h1 style="margin: 0; font-size: 22px; font-weight: bold; color: ${corNomeEmpresa}; text-transform: uppercase; letter-spacing: -0.5px;">${config?.nome_loja || 'MINHA EMPRESA'}</h1>
              ${config?.cnpj ? `<p style="margin: 3px 0 0; font-size: 10px; color: #64748b; font-weight: 500;">CNPJ: ${config.cnpj}</p>` : ''}
            </div>
          </div>
          <div style="text-align: right;">
            <h2 style="margin: 0; font-size: 20px; color: ${corBase}; font-weight: 800; text-transform: uppercase; letter-spacing: -0.5px;">DETALHAMENTO DE SERVIÇOS</h2>
            <div style="display: flex; flex-direction: column; align-items: flex-end; gap: 4px; margin-top: 8px;">
              <span style="font-size: 10px; font-weight: 600; color: #475569; background: #f1f5f9; padding: 4px 8px; border-radius: 4px;">Emissão: ${dataAtual}</span>
            </div>
          </div>
        </div>

        <div style="margin-bottom: 25px;">
          <h3 style="font-size: 11px; font-weight: 700; color: ${corBase}; text-transform: uppercase; margin-bottom: 10px; letter-spacing: 0.5px;">Informações do Cliente</h3>
          <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 15px; display: flex; justify-content: space-between; align-items: center;">
            <div>
              <p style="margin: 0; font-size: 9px; font-weight: 600; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 2px;">Nome / Razão Social</p>
              <p style="margin: 0; font-size: 13px; font-weight: 700; color: #1e293b; text-transform: uppercase;">${nomeClienteUpper}</p>
            </div>
            <div style="text-align: right;">
              <p style="margin: 0; font-size: 9px; font-weight: 600; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 2px;">Status do Pedido</p>
              <p style="margin: 0; font-size: 13px; font-weight: 700; color: ${statusPagamento === 'pago' ? '#059669' : statusPagamento === 'parcial' ? '#2563eb' : '#e11d48'}; text-transform: uppercase;">
                ${statusPagamento === 'pago' ? 'PAGO' : statusPagamento === 'parcial' ? 'PAGTO PARCIAL' : 'PENDENTE'}
              </p>
            </div>
          </div>
        </div>

        <div style="margin-bottom: 30px;">
          <table style="width: 100%; text-align: left; border-collapse: collapse; border-radius: 8px; overflow: hidden; border: 1px solid #e2e8f0;">
            <thead>
              <tr style="background-color: ${corBase};">
                <th style="padding: 10px 12px; font-size: 10px; font-weight: 600; text-transform: uppercase; color: white; letter-spacing: 0.5px;">Descrição do Item</th>
                <th style="padding: 10px 12px; font-size: 10px; font-weight: 600; text-transform: uppercase; color: white; letter-spacing: 0.5px; text-align: center; width: 60px;">Qtd</th>
                <th style="padding: 10px 12px; font-size: 10px; font-weight: 600; text-transform: uppercase; color: white; letter-spacing: 0.5px; text-align: right; width: 100px;">V. Unitário</th>
                <th style="padding: 10px 12px; font-size: 10px; font-weight: 600; text-transform: uppercase; color: white; letter-spacing: 0.5px; text-align: right; width: 100px;">Total</th>
              </tr>
            </thead>
            <tbody style="background: white;">
              ${linhasHTML}
            </tbody>
          </table>
        </div>

        <div style="display: flex; gap: 24px; padding-top: 20px; border-top: 2px solid ${corBase};">
          <div style="flex: 1;">
            <div style="margin-bottom: 16px;">
              <p style="margin: 0 0 4px 0; font-size: 10px; font-weight: 600; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.5px;">Chave PIX</p>
              <p style="margin: 0; font-size: 12px; font-weight: 600; color: #1e293b; font-family: monospace;">${config?.chave_pix || 'A combinar'}</p>
            </div>
            ${task.description ? `
            <div>
              <p style="margin: 0 0 4px 0; font-size: 10px; font-weight: 600; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.5px;">Observações</p>
              <p style="margin: 0; font-size: 11px; color: #475569; line-height: 1.4;">${task.description}</p>
            </div>
            ` : ''}
          </div>

          <div style="width: 260px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 15px;">
            ${totaisHTML}
          </div>
        </div>

        <div style="margin-top: 40px; text-align: center; padding-top: 15px; border-top: 1px solid #f1f5f9;">
          <p style="margin: 0; font-size: 10px; font-weight: 500; color: #64748b;">
            ${config?.whatsapp ? `WhatsApp: ${config.whatsapp}` : ''}
            ${config?.whatsapp && config?.instagram ? '   |   ' : ''}
            ${config?.instagram ? `Instagram: ${config.instagram}` : ''}
          </p>
        </div>
      </div>
    `;

    const opt = {
      margin:       0,
      filename:     `Detalhamento - ${nomeClienteRaw}.pdf`,
      image:        { type: 'jpeg', quality: 0.98 },
      html2canvas:  { scale: 2, useCORS: true, logging: false },
      jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' },
      pagebreak:    { mode: 'avoid-all' }
    };

    html2pdf().set(opt).from(htmlContent).save();
  };

  const toggleChecklistItem = (idx) => {
    const updated = task.checklist.map((item, i) =>
      i === idx ? { ...item, done: !item.done } : item
    );
    onUpdate(task.id, { checklist: updated });
  };

  return (
    <div className={`bg-white w-full border ${isDone ? 'border-slate-100 opacity-80' : 'border-slate-200'} rounded-xl overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,0.02)] hover:shadow-md transition-all flex flex-col`}>
      
      {/* HEADER DO CARD */}
      <div className="flex items-start justify-between p-2.5 border-b border-slate-50 gap-2">
        <div className="flex items-start gap-2 flex-1 min-w-0">
          <button onClick={(e) => { e.stopPropagation(); onToggle(task); }} className="mt-0.5 hover:scale-110 transition-transform shrink-0">
            {isDone ? <CheckCircle2 className="w-4 h-4 text-emerald-500" /> : <Clock className="w-4 h-4 text-slate-300 hover:text-emerald-400" />}
          </button>

          <div className="flex flex-col flex-1 min-w-0">
            <div className="flex items-center gap-1.5 w-full">
              <h3 className={`text-[12px] sm:text-sm font-semibold leading-tight tracking-tight truncate min-w-0 ${isDone ? "text-slate-400 line-through" : "text-slate-800"}`}>
                {task.cliente_nome || task.title}
              </h3>
              {task.priority?.toLowerCase() === 'urgente' && !isDone && (
                <div className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse shrink-0 shadow-[0_0_5px_rgba(244,63,94,0.6)]" title="Urgente" />
              )}
            </div>
            
            {task.cliente_nome && task.title !== task.cliente_nome && (
              <span className="text-[8.5px] sm:text-[9px] text-slate-400 font-medium uppercase tracking-widest mt-0.5 truncate block min-w-0">
                {task.title}
              </span>
            )}

            <div className="flex flex-wrap items-center gap-1 mt-1.5">
              {deadline && (
                <span className={`px-1.5 py-0.5 rounded-full text-[7.5px] sm:text-[8px] font-semibold tracking-widest uppercase border flex items-center gap-0.5 shrink-0 ${deadline.color}`}>
                  {deadline.icon ? <AlertCircle size={9}/> : <Calendar size={9}/>}
                  {deadline.label}
                </span>
              )}

              {task.category && (
                <span className="text-[7.5px] sm:text-[8px] font-medium text-slate-400 border border-slate-200 px-1.5 py-0.5 rounded-full uppercase tracking-widest shrink-0">
                  {task.category}
                </span>
              )}

              {isDone && statusPagamento !== 'pago' && (
                <span className="px-1.5 py-0.5 rounded-full text-[7.5px] sm:text-[8px] font-bold uppercase tracking-widest border bg-orange-50 text-orange-600 border-orange-200 shrink-0">
                  Entregue (Ag. Pagto)
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex flex-col items-end shrink-0 pl-1 text-right">
          {statusPagamento === 'parcial' ? (
            <>
              <span className="text-[7.5px] sm:text-[8px] font-medium text-slate-400 uppercase tracking-widest whitespace-nowrap">Falta Receber</span>
              <span className="text-xs sm:text-sm font-semibold text-rose-500 leading-none mt-0.5 whitespace-nowrap">
                {fmt(displayValue - valorPago)}
              </span>
            </>
          ) : (
            <>
              <span className="text-[7.5px] sm:text-[8px] font-medium text-slate-400 uppercase tracking-widest whitespace-nowrap">Valor Total</span>
              <span className={`text-xs sm:text-sm font-semibold leading-none mt-0.5 whitespace-nowrap ${corValor}`}>
                {fmt(displayValue)}
              </span>
            </>
          )}
        </div>
      </div>

      {/* SANFONA DE SERVIÇOS */}
      {(hasDescription || hasChecklist) && (
        <button 
          onClick={(e) => { e.stopPropagation(); setIsExpanded(!isExpanded); }}
          className="w-full py-1.5 flex items-center justify-center gap-1 bg-slate-50/80 border-b border-slate-100 hover:bg-slate-100 transition-colors text-slate-400"
        >
          <span className="text-[8px] sm:text-[9px] font-bold uppercase tracking-widest whitespace-nowrap">{isExpanded ? "Ocultar Serviços" : "Ver Serviços"}</span>
          {isExpanded ? <ChevronUp size={10} /> : <ChevronDown size={10} />}
        </button>
      )}

      {/* DETALHES DOS SERVIÇOS */}
      <AnimatePresence initial={false}>
        {isExpanded && (hasDescription || hasChecklist) && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }} 
            animate={{ height: 'auto', opacity: 1 }} 
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden bg-slate-50/50 w-full"
          >
            <div className="px-2.5 py-2 w-full">
              {hasDescription && (
                <div className="mb-2">
                  <p className="text-[9.5px] sm:text-[10px] md:text-[11px] text-slate-500 leading-relaxed font-medium whitespace-pre-wrap break-words">{task.description}</p>
                </div>
              )}

              {hasChecklist && (
                <div className="space-y-1 w-full">
                  {visibleChecklist.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between py-1 group border-b border-slate-100/50 last:border-0 gap-2 min-w-0">
                      <button onClick={(e) => { e.stopPropagation(); toggleChecklistItem(idx); }} className="flex items-center gap-1.5 flex-1 min-w-0 text-left">
                        {item.done ? <CheckSquare className="w-3 h-3 text-emerald-500 shrink-0" /> : <Square className="w-3 h-3 text-slate-300 shrink-0 group-hover:text-emerald-400 transition-colors" />}
                        <span className={`text-[9.5px] sm:text-[10px] md:text-[11px] font-medium truncate block min-w-0 ${item.done ? "line-through text-slate-400" : "text-slate-600"}`}>
                          {item.name || "Item sem nome"}
                        </span>
                      </button>
                      {item.value > 0 && <span className="text-[9.5px] sm:text-[10px] font-semibold text-slate-400 shrink-0 whitespace-nowrap">{fmt(item.value)}</span>}
                    </div>
                  ))}
                  
                  {hiddenItemsCount > 0 && (
                    <button onClick={() => setShowAllItems(true)} className="mt-1 w-full text-center text-[8.5px] font-semibold text-slate-400 hover:text-emerald-600 uppercase tracking-widest py-1.5 border border-dashed border-slate-200 rounded-md bg-white transition-colors">
                      + Exibir {hiddenItemsCount} detalhes
                    </button>
                  )}
                  
                  {showAllItems && (
                    <button onClick={() => setShowAllItems(false)} className="mt-1 w-full text-center text-[8.5px] font-semibold text-rose-400 hover:text-rose-600 uppercase tracking-widest py-1.5 border border-dashed border-slate-200 rounded-md bg-white transition-colors">
                      Recolher itens
                    </button>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* RODAPÉ E AÇÕES - BLOQUEIO DE LINHA ÚNICA */}
      <div className="flex flex-col bg-white w-full mt-auto">
        
        {/* LINHA 1: FINANCEIRO */}
        {statusPagamento !== 'pago' && (
          <div className="flex gap-1.5 px-2.5 py-2 border-b border-slate-50 bg-slate-50/50 overflow-hidden">
            <Button onClick={handleSetPago} variant="ghost" className="flex-1 h-7 px-0 rounded-md text-[9px] font-semibold uppercase tracking-widest text-emerald-600 bg-emerald-100/50 hover:bg-emerald-100 transition-colors border border-emerald-200/50 flex items-center justify-center">
              <DollarSign size={14} className="shrink-0"/>
              <span className="hidden sm:inline md:hidden lg:inline xl:hidden 2xl:inline ml-1.5">Pago</span>
            </Button>
            <Button onClick={handleSetParcial} variant="ghost" className="flex-1 h-7 px-0 rounded-md text-[9px] font-semibold uppercase tracking-widest text-blue-600 bg-blue-100/50 hover:bg-blue-100 transition-colors border border-blue-200/50 flex items-center justify-center">
              <Coins size={14} className="shrink-0"/>
              <span className="hidden sm:inline md:hidden lg:inline xl:hidden 2xl:inline ml-1.5">Sinal</span>
            </Button>
            {!isDone && (
              <Button onClick={handleSetAgPagamento} variant="ghost" className="flex-1 h-7 px-0 rounded-md text-[9px] font-semibold uppercase tracking-widest text-orange-600 bg-orange-100/50 hover:bg-orange-100 transition-colors border border-orange-200/50 flex items-center justify-center">
                <AlertCircle size={14} className="shrink-0"/>
                <span className="hidden sm:inline md:hidden lg:inline xl:hidden 2xl:inline ml-1.5">Ag. Pagto</span>
              </Button>
            )}
          </div>
        )}

        {/* LINHA 2: AÇÕES GERAIS */}
        <div className="flex gap-1.5 px-2.5 py-2 overflow-hidden">
          <Button onClick={handleGeneratePDF} variant="ghost" className="flex-1 h-7 px-0 rounded-md text-[9px] font-semibold uppercase tracking-widest text-slate-500 bg-slate-50 hover:bg-slate-100 transition-colors flex items-center justify-center">
            <FileText size={14} className="shrink-0"/>
            <span className="hidden sm:inline md:hidden lg:inline xl:hidden 2xl:inline ml-1.5">PDF</span>
          </Button>
          <Button onClick={handleWhatsAppShare} variant="ghost" className="flex-1 h-7 px-0 rounded-md text-[9px] font-semibold uppercase tracking-widest text-slate-500 bg-slate-50 hover:bg-slate-100 transition-colors flex items-center justify-center">
            <MessageCircle size={14} className="shrink-0"/>
            <span className="hidden sm:inline md:hidden lg:inline xl:hidden 2xl:inline ml-1.5">Enviar</span>
          </Button>
          <Button onClick={() => onEdit(task)} variant="ghost" className="flex-1 h-7 px-0 rounded-md text-[9px] font-semibold uppercase tracking-widest text-slate-500 hover:bg-slate-100 border border-slate-100 flex items-center justify-center">
            <Pencil size={14} className="shrink-0"/>
            <span className="hidden sm:inline md:hidden lg:inline xl:hidden 2xl:inline ml-1.5">Editar</span>
          </Button>
          <Button onClick={() => onDelete(task)} variant="ghost" className="flex-1 h-7 px-0 rounded-md text-[9px] font-semibold uppercase tracking-widest text-rose-500 hover:bg-rose-50 border border-rose-50 flex items-center justify-center">
            <Trash2 size={14} className="shrink-0"/>
            <span className="hidden sm:inline md:hidden lg:inline xl:hidden 2xl:inline ml-1.5">Excluir</span>
          </Button>
        </div>
      </div>

    </div>
  );
}