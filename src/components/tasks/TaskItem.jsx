import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Trash2, Clock, CheckCircle2, CheckSquare, Square, Pencil, MessageCircle, FileText, DollarSign, Coins, AlertCircle, Calendar } from "lucide-react";
import { supabase } from "../../lib/supabase"; 
import html2pdf from 'html2pdf.js';

const fmt = (v) =>
  v?.toLocaleString("pt-BR", { style: "currency", currency: "BRL" }) ?? "R$ 0,00";

const getDeadlineInfo = (dateStr) => {
  if (!dateStr) return null;
  const [year, month, day] = dateStr.split('-');
  const deadline = new Date(year, month - 1, day);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const diffTime = deadline - today;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  const dataFormatada = deadline.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });

  if (diffDays < 0) return { label: `Atrasado (${dataFormatada})`, color: "bg-rose-50 text-rose-600 border-rose-200 animate-pulse", icon: true };
  if (diffDays === 0) return { label: `Hoje (${dataFormatada})`, color: "bg-amber-500 text-white border-amber-600 shadow-sm", icon: true };
  if (diffDays <= 2) return { label: `Em ${diffDays}d (${dataFormatada})`, color: "bg-amber-50 text-amber-600 border-amber-200", icon: false };
  return { label: `Para ${dataFormatada}`, color: "bg-slate-50 text-slate-500 border-slate-200", icon: false };
};

export default function TaskItem({ task, onToggle, onDelete, onUpdate, onEdit, showUndo = false }) {
  const [config, setConfig] = useState(null);
  const [showAllItems, setShowAllItems] = useState(false); 

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
  
  const deadline = getDeadlineInfo(task.delivery_date); 

  const valorPago = Number(task.valor_pago || 0);
  let statusPagamento = 'pendente';
  let corBadge = 'bg-emerald-50 text-emerald-600 border-emerald-100';
  let textoStatus = 'Pago';
  let corValor = 'text-emerald-600';
  
  if (task.payment_status === 'pago' || (valorPago >= displayValue && displayValue > 0)) {
     statusPagamento = 'pago';
     corBadge = 'bg-emerald-50 text-emerald-600 border-emerald-200';
     textoStatus = 'Pago';
     corValor = 'text-emerald-600';
  } else if (task.payment_status === 'parcial' || (valorPago > 0 && valorPago < displayValue)) {
     statusPagamento = 'parcial';
     corBadge = 'bg-blue-50 text-blue-600 border-blue-200';
     textoStatus = 'Parcial';
     corValor = 'text-rose-500'; 
  } else {
     statusPagamento = 'pendente';
     corBadge = 'bg-rose-50 text-rose-600 border-rose-200';
     textoStatus = 'Em Aberto';
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

  // --- GERADOR DE PDF (CORRIGIDO E OTIMIZADO) ---
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

    // Cria o elemento e anexa escondido no DOM para que a biblioteca consiga ler
    const element = document.createElement('div');
    element.style.position = 'absolute';
    element.style.left = '-9999px';
    element.style.top = '-9999px';
    element.innerHTML = `
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

    document.body.appendChild(element);

    const opt = {
      margin:       0,
      filename:     `Detalhamento - ${nomeClienteRaw}.pdf`,
      image:        { type: 'jpeg', quality: 0.98 },
      html2canvas:  { scale: 2, useCORS: true, logging: false },
      jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' },
      pagebreak:    { mode: 'avoid-all' }
    };

    html2pdf().set(opt).from(element).save().then(() => {
      document.body.removeChild(element); // Destrói o "papel" após gerar
    });
  };

  const toggleChecklistItem = (idx) => {
    const updated = task.checklist.map((item, i) =>
      i === idx ? { ...item, done: !item.done } : item
    );
    onUpdate(task.id, { checklist: updated });
  };

  return (
    <div className={`bg-white border ${isDone ? 'border-slate-100 opacity-80' : 'border-slate-200'} rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all`}>
      
      <div className="flex items-start justify-between p-3 border-b border-slate-50">
        <div className="flex items-start gap-3 w-full">
          <button onClick={(e) => { e.stopPropagation(); onToggle(task); }} className="mt-1 hover:scale-110 transition-transform shrink-0">
            {isDone ? <CheckCircle2 className="w-5 h-5 text-emerald-500" /> : <Clock className="w-5 h-5 text-slate-300 hover:text-emerald-400" />}
          </button>

          <div className="flex flex-col flex-1 min-w-0">
            <h3 className={`text-sm font-semibold leading-none tracking-tight truncate ${isDone ? "text-slate-400 line-through" : "text-slate-800"}`}>
              {task.cliente_nome || task.title}
            </h3>
            
            {task.cliente_nome && task.title !== task.cliente_nome && (
              <span className="text-[9px] text-slate-400 font-medium uppercase tracking-widest mt-1 truncate">
                {task.title}
              </span>
            )}

            <div className="flex flex-wrap items-center gap-1.5 mt-2">
              {deadline && (
                <span className={`px-2 py-0.5 rounded-full text-[8px] font-semibold tracking-widest uppercase border flex items-center gap-1 ${deadline.color}`}>
                  {deadline.icon ? <AlertCircle size={10}/> : <Calendar size={10}/>}
                  {deadline.label}
                </span>
              )}

              {task.priority && (
                <span className={`px-2 py-0.5 rounded-full text-[8px] font-semibold tracking-widest uppercase border ${
                  task.priority.toLowerCase() === 'urgente' ? 'text-rose-600 bg-rose-50 border-rose-200 animate-pulse' :
                  task.priority.toLowerCase() === 'alta' ? 'text-amber-600 bg-amber-50 border-amber-200' :
                  'text-slate-500 bg-slate-50 border-slate-200'
                }`}>
                  {task.priority}
                </span>
              )}

              {task.category && (
                <span className="text-[8px] font-medium text-slate-400 border border-slate-200 px-2 py-0.5 rounded-full uppercase tracking-widest">
                  {task.category}
                </span>
              )}

              <span className={`px-2 py-0.5 rounded-full text-[8px] font-semibold uppercase tracking-widest border ${corBadge}`}>
                {textoStatus}
              </span>
            </div>
          </div>
        </div>

        <div className="flex flex-col items-end shrink-0 pl-3">
          {statusPagamento === 'parcial' ? (
            <div className="text-right">
              <span className="text-[8px] font-medium text-slate-400 uppercase tracking-widest">Falta Receber</span>
              <div className="flex items-center gap-1 mt-0.5">
                 <span className="text-sm font-semibold text-rose-500 leading-none">
                   {fmt(displayValue - valorPago)}
                 </span>
              </div>
            </div>
          ) : (
            <div className="text-right">
              <span className="text-[8px] font-medium text-slate-400 uppercase tracking-widest">Valor Total</span>
              <span className={`text-sm font-semibold leading-none block mt-0.5 ${corValor}`}>
                {fmt(displayValue)}
              </span>
            </div>
          )}
        </div>
      </div>

      <div className="px-3 py-2 bg-slate-50/50">
        {hasDescription && (
          <div className="mb-2">
            <p className="text-[10px] md:text-xs text-slate-500 leading-relaxed font-medium whitespace-pre-wrap">{task.description}</p>
          </div>
        )}

        {hasChecklist && (
          <div className="space-y-1">
            {visibleChecklist.map((item, idx) => (
              <div key={idx} className="flex items-center justify-between py-1 group border-b border-slate-100/50 last:border-0">
                <button onClick={(e) => { e.stopPropagation(); toggleChecklistItem(idx); }} className="flex items-center gap-2 flex-1 text-left">
                  {item.done ? <CheckSquare className="w-3 h-3 text-emerald-500 shrink-0" /> : <Square className="w-3 h-3 text-slate-300 shrink-0 group-hover:text-emerald-400 transition-colors" />}
                  <span className={`text-[10px] md:text-xs font-medium ${item.done ? "line-through text-slate-400" : "text-slate-600"}`}>
                    {item.name || "Item sem nome"}
                  </span>
                </button>
                {item.value > 0 && <span className="text-[10px] font-semibold text-slate-400">{fmt(item.value)}</span>}
              </div>
            ))}
            
            {hiddenItemsCount > 0 && (
              <button onClick={() => setShowAllItems(true)} className="mt-1 w-full text-center text-[9px] font-semibold text-slate-400 hover:text-emerald-600 uppercase tracking-widest py-1.5 border border-dashed border-slate-200 rounded-md bg-white transition-colors">
                + Exibir {hiddenItemsCount} detalhes
              </button>
            )}
            
            {showAllItems && (
              <button onClick={() => setShowAllItems(false)} className="mt-1 w-full text-center text-[9px] font-semibold text-rose-400 hover:text-rose-600 uppercase tracking-widest py-1.5 border border-dashed border-slate-200 rounded-md bg-white transition-colors">
                Recolher itens
              </button>
            )}
          </div>
        )}
      </div>

      <div className="flex flex-wrap items-center justify-between px-3 py-2 border-t border-slate-100 bg-white gap-2">
        <div className="flex gap-1.5 flex-wrap">
          <Button onClick={handleGeneratePDF} variant="ghost" className="h-7 px-2.5 rounded-full text-[9px] font-semibold uppercase tracking-widest text-slate-500 bg-slate-50 hover:bg-slate-100 transition-colors">
            <FileText size={12} className="md:mr-1"/> <span className="hidden md:inline">PDF</span>
          </Button>
          <Button onClick={handleWhatsAppShare} variant="ghost" className="h-7 px-2.5 rounded-full text-[9px] font-semibold uppercase tracking-widest text-slate-500 bg-slate-50 hover:bg-slate-100 transition-colors">
            <MessageCircle size={12} className="md:mr-1"/> <span className="hidden md:inline">Enviar</span>
          </Button>

          {statusPagamento !== 'pago' && (
            <>
              <Button onClick={handleSetPago} variant="ghost" className="h-7 px-2.5 rounded-full text-[9px] font-semibold uppercase tracking-widest text-emerald-600 bg-emerald-50 hover:bg-emerald-100 transition-colors">
                <DollarSign size={12} className="md:mr-1"/> <span className="hidden md:inline">Pago</span>
              </Button>
              <Button onClick={handleSetParcial} variant="ghost" className="h-7 px-2.5 rounded-full text-[9px] font-semibold uppercase tracking-widest text-blue-600 bg-blue-50 hover:bg-blue-100 transition-colors">
                <Coins size={12} className="md:mr-1"/> <span className="hidden md:inline">Sinal</span>
              </Button>
            </>
          )}
        </div>
        
        <div className="flex gap-1.5">
          <Button onClick={() => onEdit(task)} variant="ghost" className="h-7 px-2.5 rounded-full text-[9px] font-semibold uppercase tracking-widest text-slate-500 hover:bg-slate-100 border border-slate-100">
            <Pencil size={12} className="md:mr-1"/> <span className="hidden md:inline">Editar</span>
          </Button>
          <Button onClick={() => onDelete(task)} variant="ghost" className="h-7 px-2.5 rounded-full text-[9px] font-semibold uppercase tracking-widest text-rose-500 hover:bg-rose-50 border border-rose-50">
            <Trash2 size={12} className="md:mr-1"/> <span className="hidden md:inline">Excluir</span>
          </Button>
        </div>
      </div>
    </div>
  );
}