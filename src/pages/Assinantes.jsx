import React, { useState, useEffect } from 'react';
import { supabase } from "../lib/supabase";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  ShieldCheck, Search, Plus, Trash2, Edit3, 
  ExternalLink, Globe, Eye, ChevronDown, ChevronUp, 
  CheckCircle2, Copy, AlertTriangle, Clock, LogIn, Users, Terminal, Activity, Download
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AnimatePresence, motion } from "framer-motion";
import { format, differenceInDays, parseISO, isValid } from "date-fns";
import SeletorData from "../components/SeletorData";

import AssinanteModal from "../components/AssinanteModal";

// Importações do Gerador de PDF corrigidas para o Vite
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

const SECRET_KEY = "CriarteMasterKey2026";
const decrypt = (text) => {
  if (!text) return text;
  if (!text.startsWith('ENC:')) return text;
  try {
      let base64 = text.substring(4);
      let textDecoded = atob(base64);
      let result = '';
      for (let i = 0; i < textDecoded.length; i++) {
          result += String.fromCharCode(textDecoded.charCodeAt(i) ^ SECRET_KEY.charCodeAt(i % SECRET_KEY.length));
      }
      return result;
  } catch (e) { return text; }
};

export default function Assinantes() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [passwordAttempt, setPasswordAttempt] = useState('');
  const [loginError, setLoginError] = useState(false);
  const SENHA_MESTRA = "794613Ed"; 

  const [searchTerm, setSearchTerm] = useState('');
  const [showPasswords, setShowPasswords] = useState({}); 
  const [expandedDates, setExpandedDates] = useState({});
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAssinante, setEditingAssinante] = useState(null);

  const [sqlMestre, setSqlMestre] = useState('');
  const [showSql, setShowSql] = useState(false);
  const [isSqlCopied, setIsSqlCopied] = useState(false);

  useEffect(() => {
    const savedSql = localStorage.getItem('criarte_sql_mestre');
    if (savedSql) setSqlMestre(savedSql);
  }, []);

  const handleSaveSql = (val) => {
    setSqlMestre(val);
    localStorage.setItem('criarte_sql_mestre', val);
  };

  const handleCopySql = () => {
    navigator.clipboard.writeText(sqlMestre);
    setIsSqlCopied(true);
    setTimeout(() => setIsSqlCopied(false), 2000);
  };

  const toggleDates = (id) => {
    setExpandedDates(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const queryClient = useQueryClient();

  const { data: assinantes = [] } = useQuery({
    queryKey: ["criarte-assinantes"],
    queryFn: async () => {
      const { data, error } = await supabase.from("assinantes").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data.map(assinante => ({
        ...assinante,
        senha_supabase: decrypt(assinante.senha_supabase),
        senha_banco_dados: decrypt(assinante.senha_banco_dados),
        supabase_anon_key: decrypt(assinante.supabase_anon_key),
        supabase_service_role_key: decrypt(assinante.supabase_service_role_key),
        senha_painel: decrypt(assinante.senha_painel),
      }));
    },
    enabled: isAuthenticated, 
  });

  const quickUpdateMutation = useMutation({
    mutationFn: async ({ id, payload }) => {
      const safePayload = {};
      for(let key in payload) {
         safePayload[key] = payload[key] === '' ? null : payload[key];
      }
      const { error } = await supabase.from("assinantes").update(safePayload).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["criarte-assinantes"] });
    },
    onError: () => {
      alert("Erro ao atualizar os dados rápidos. Tente novamente.");
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      const { error } = await supabase.from("assinantes").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["criarte-assinantes"] }),
  });

  const handleLogin = (e) => {
    e.preventDefault();
    if (passwordAttempt === SENHA_MESTRA) {
      setIsAuthenticated(true);
    } else {
      setLoginError(true);
      setPasswordAttempt('');
    }
  };

  const openNewChecklist = () => {
    setEditingAssinante({ 
      cliente_id: null, nome_cliente: 'Disponível para Teste', whatsapp: '', 
      data_assinatura: format(new Date(), 'yyyy-MM-dd'),
      tipo_conta: 'Disponivel', link_bio: '', dominio: '',
      data_inicio_teste: '', data_fim_teste: '',
      data_inicio_uso: '', data_fim_assinatura: '',
      email_vercel_principal: 'organizesistema@hotmail.com', projeto_vercel: '', 
      email_supabase: '', senha_supabase: '794613Ed@', supabase_organization: '', projeto_supabase: '',
      senha_banco_dados: '', supabase_url: '', supabase_anon_key: '', supabase_service_role_key: '',
      usuario_painel: '', senha_painel: '', 
      link_sistema: '', link_catalogo: '', status: 'Ativo'
    });
    setIsModalOpen(true);
  };

  const handleEdit = (assinante) => {
    setEditingAssinante(assinante);
    setIsModalOpen(true);
  };

  const togglePasswordVisibility = (id, field) => {
    const key = `${id}_${field}`;
    setShowPasswords(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const getAlertStatus = (assinante, columnType) => {
    const hoje = new Date();
    
    if (columnType === 'teste' && assinante.data_fim_teste) {
      const fimTeste = parseISO(assinante.data_fim_teste);
      if (isValid(fimTeste)) {
        const diasRestantes = differenceInDays(fimTeste, hoje);
        const tagColor = 'bg-amber-500 text-white border-amber-600 shadow-sm';
        if (diasRestantes < 0) return { label: `TESTE EXPIRADO`, color: 'bg-rose-600 text-white border-rose-700 shadow-sm' };
        if (diasRestantes === 0) return { label: `TESTE - VENCE HOJE`, color: tagColor };
        if (diasRestantes === 1) return { label: `TESTE - FALTA 1 DIA`, color: tagColor };
        return { label: `TESTE - FALTAM ${diasRestantes} DIAS`, color: tagColor };
      }
    }
    if (columnType === 'assinados' && assinante.data_fim_assinatura) {
      const vencimento = parseISO(assinante.data_fim_assinatura);
      if (isValid(vencimento)) {
        const diasRestantes = differenceInDays(vencimento, hoje);
        const tagColor = 'bg-emerald-600 text-white border-emerald-700 shadow-sm';
        if (diasRestantes < 0) return { label: `ASSINATURA EXPIRADA`, color: 'bg-rose-600 text-white border-rose-700 shadow-sm' };
        if (diasRestantes === 0) return { label: `ASSINATURA - VENCE HOJE`, color: 'bg-amber-500 text-white border-amber-600 shadow-sm' };
        if (diasRestantes === 1) return { label: `ASSINATURA - FALTA 1 DIA`, color: tagColor };
        return { label: `ASSINATURA - FALTAM ${diasRestantes} DIAS`, color: tagColor };
      }
    }
    return null;
  };

  // === FUNÇÕES DE EXPORTAÇÃO PDF ===
  const handleExportAllPDF = () => {
    try {
      const doc = new jsPDF();
      doc.setFontSize(14);
      doc.text('Relatório Geral de Instâncias - Fábrica SaaS', 14, 15);
      doc.setFontSize(10);
      doc.text(`Gerado em: ${format(new Date(), 'dd/MM/yyyy HH:mm')}`, 14, 22);

      const tableColumn = ["Cliente / Projeto", "Tipo", "Domínio", "Vercel", "Vencimento"];
      const tableRows = [];

      assinantes.forEach(a => {
        const nome = (a.nome_cliente && a.nome_cliente !== 'Disponível para Teste') ? a.nome_cliente : (a.projeto_vercel || 'Estoque Livre');
        const vencimento = a.tipo_conta === 'Uso' && a.data_fim_assinatura ? format(parseISO(a.data_fim_assinatura), 'dd/MM/yyyy') : 
                           a.tipo_conta === 'Teste' && a.data_fim_teste ? format(parseISO(a.data_fim_teste), 'dd/MM/yyyy') : '-';
        
        const rowData = [
          nome,
          a.tipo_conta || 'Disponível',
          a.dominio || '-',
          a.projeto_vercel || '-',
          vencimento
        ];
        tableRows.push(rowData);
      });

      // Forma segura de chamar a tabela no Vite
      autoTable(doc, {
        head: [tableColumn],
        body: tableRows,
        startY: 28,
        styles: { fontSize: 8, cellPadding: 3 },
        headStyles: { fillColor: [37, 99, 235] } 
      });

      doc.save('relatorio_todas_instancias.pdf');
    } catch (error) {
      console.error("Erro ao gerar PDF:", error);
      alert("Ocorreu um erro ao gerar o PDF. Verifique a consola.");
    }
  };

  const handleExportSinglePDF = (assinante) => {
    try {
      const doc = new jsPDF();
      const displayName = (assinante.nome_cliente && assinante.nome_cliente !== 'Disponível para Teste') 
        ? assinante.nome_cliente 
        : (assinante.projeto_vercel || 'Projeto Sem Nome');

      doc.setFontSize(16);
      doc.text(`Ficha Técnica: ${displayName}`, 14, 15);
      doc.setFontSize(10);
      doc.text(`Exportado em: ${format(new Date(), 'dd/MM/yyyy HH:mm')}`, 14, 22);

      const bodyData = [
        ['Nome do Cliente', assinante.nome_cliente || 'Não definido'],
        ['Tipo de Conta', assinante.tipo_conta || 'Não definido'],
        ['Status', assinante.status || 'Ativo'],
        ['Domínio Oficial', assinante.dominio || 'Não configurado'],
        ['URL do Catálogo', assinante.link_catalogo || 'Não configurado'],
        ['URL do Painel Admin', assinante.link_sistema || 'Não configurado'],
        ['Link da Bio', assinante.link_bio || 'Não configurado'],
        ['---', '---'],
        ['Login do App (Usuário)', assinante.usuario_painel || 'Não definido'],
        ['Login do App (Senha)', assinante.senha_painel || 'Não definido'],
        ['---', '---'],
        ['Hospedagem (Vercel Project)', assinante.projeto_vercel || 'Não definido'],
        ['Conta Vercel (Email)', assinante.email_vercel_principal || 'Não definido'],
        ['Banco de Dados (Supabase ID)', assinante.projeto_supabase || 'Não definido'],
        ['Conta Supabase (Email)', assinante.email_supabase || 'Não definido'],
        ['Senha do Banco de Dados', assinante.senha_banco_dados || 'Não definido'],
        ['Senha do Projeto Supabase', assinante.senha_supabase || 'Não definido'],
        ['---', '---'],
        ['Data de Instalação', assinante.data_assinatura ? format(parseISO(assinante.data_assinatura), 'dd/MM/yyyy') : 'Não definido'],
        ['Vencimento do Teste', assinante.data_fim_teste ? format(parseISO(assinante.data_fim_teste), 'dd/MM/yyyy') : 'Não definido'],
        ['Vencimento da Assinatura', assinante.data_fim_assinatura ? format(parseISO(assinante.data_fim_assinatura), 'dd/MM/yyyy') : 'Não definido']
      ];

      // Forma segura de chamar a tabela no Vite
      autoTable(doc, {
        body: bodyData,
        startY: 28,
        theme: 'grid',
        styles: { fontSize: 9, cellPadding: 4 },
        columnStyles: {
          0: { fontStyle: 'bold', fillColor: [248, 250, 252], cellWidth: 70 }
        },
        didParseCell: function(data) {
          if (data.row.raw[0] === '---') {
             data.cell.styles.fillColor = [226, 232, 240];
             data.cell.styles.textColor = [226, 232, 240];
          }
        }
      });

      doc.save(`ficha_${displayName.replace(/\s+/g, '_').toLowerCase()}.pdf`);
    } catch (error) {
      console.error("Erro ao gerar PDF:", error);
      alert("Ocorreu um erro ao gerar o PDF. Verifique a consola.");
    }
  };

  const getDaysToExpiration = (dateString) => {
    if (!dateString) return Infinity; 
    const parsed = parseISO(dateString);
    if (!isValid(parsed)) return Infinity;
    return differenceInDays(parsed, new Date());
  };

  const assinantesFiltrados = assinantes.filter(a => {
      const termo = searchTerm.toLowerCase();
      const nome = (a.nome_cliente || '').toLowerCase();
      const projeto = (a.projeto_vercel || '').toLowerCase();
      return nome.includes(termo) || projeto.includes(termo);
  });
  
  const listAssinados = assinantesFiltrados
    .filter(a => !!a.data_fim_assinatura || !!a.data_inicio_uso)
    .sort((a, b) => getDaysToExpiration(a.data_fim_assinatura) - getDaysToExpiration(b.data_fim_assinatura));

  const listEmTeste = assinantesFiltrados
    .filter(a => (!!a.data_fim_teste || !!a.data_inicio_teste) && !a.data_fim_assinatura && !a.data_inicio_uso)
    .sort((a, b) => getDaysToExpiration(a.data_fim_teste) - getDaysToExpiration(b.data_fim_teste));

  const listDisponiveis = assinantesFiltrados
    .filter(a => !a.data_fim_assinatura && !a.data_inicio_uso && !a.data_fim_teste && !a.data_inicio_teste)
    .sort((a, b) => {
      const dateA = a.data_assinatura ? parseISO(a.data_assinatura) : parseISO(a.created_at);
      const dateB = b.data_assinatura ? parseISO(b.data_assinatura) : parseISO(b.created_at);
      return (dateA.getTime() || 0) - (dateB.getTime() || 0);
    });

  const renderCard = (assinante, columnType) => {
    const alert = getAlertStatus(assinante, columnType);
    
    let headerBgClass = "bg-slate-50 border-b border-slate-100";
    let iconBgClass = "bg-slate-700";
    let titleTextClass = "text-slate-800";
    let borderColor = "border-slate-200";

    if (columnType === 'disponiveis') {
      headerBgClass = "bg-blue-50/60 border-b border-blue-100";
      iconBgClass = "bg-blue-500";
      titleTextClass = "text-blue-800";
      borderColor = "border-blue-200 border-dashed";
    } else if (columnType === 'teste') {
      headerBgClass = "bg-amber-50 border-b border-amber-100";
      iconBgClass = "bg-amber-500";
      titleTextClass = "text-amber-900";
      borderColor = "border-amber-200";
    } else if (columnType === 'assinados') {
      headerBgClass = "bg-emerald-50 border-b border-emerald-100";
      iconBgClass = "bg-emerald-600";
      titleTextClass = "text-emerald-900";
      borderColor = "border-emerald-200";
    }

    let diasOcioso = 0;
    if (columnType === 'disponiveis') {
       const dataRef = assinante.data_assinatura ? parseISO(assinante.data_assinatura) : parseISO(assinante.created_at);
       if (isValid(dataRef)) diasOcioso = differenceInDays(new Date(), dataRef);
    }

    const isDefaultName = !assinante.nome_cliente || assinante.nome_cliente === 'Disponível para Teste';
    const displayTitle = isDefaultName && assinante.projeto_vercel 
                         ? assinante.projeto_vercel 
                         : (assinante.nome_cliente || 'Disponível para Teste');

    const displayDomain = assinante.dominio 
                          ? assinante.dominio.replace('https://', '').replace('http://', '') 
                          : (assinante.projeto_vercel ? `${assinante.projeto_vercel}.vercel.app` : null);

    return (
      <motion.div 
         initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
         key={assinante.id} 
         className={`bg-white border shadow-sm rounded-xl flex flex-col transition-all ${borderColor}`}
      >
        <div className={`p-3 flex justify-between items-center rounded-t-[10px] ${headerBgClass}`}>
          <div className="flex gap-3 items-center min-w-0">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-white shadow-sm text-sm shrink-0 ${iconBgClass}`}>
              {displayTitle.charAt(0).toUpperCase()}
            </div>
            <div className="flex flex-col gap-0.5 min-w-0">
               <div className="flex items-center gap-1.5 flex-wrap">
                  <h3 className={`font-semibold text-xs uppercase tracking-tight truncate max-w-[130px] md:max-w-[150px] ${titleTextClass}`}>
                     {displayTitle}
                  </h3>
                  {alert ? (
                    <span className={`text-[7px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full border flex-wrap w-fit ${alert.color}`}>
                       {alert.label}
                    </span>
                  ) : columnType === 'disponiveis' ? (
                    <span className="text-[7px] font-bold uppercase tracking-widest bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full border border-blue-200 flex items-center gap-1 w-fit">
                      <Clock size={8}/> Disponível
                    </span>
                  ) : null}
               </div>
               
               {displayDomain && (
                  <a href={`https://${displayDomain}`} target="_blank" rel="noreferrer" className="text-[8.5px] font-medium text-slate-500 hover:text-blue-600 hover:underline tracking-widest flex items-center gap-1 truncate w-fit">
                     <Globe size={8} className="shrink-0"/> {displayDomain}
                  </a>
               )}

            </div>
          </div>
          <div className="flex gap-1 shrink-0 ml-2">
             <button onClick={() => handleExportSinglePDF(assinante)} className="p-1.5 text-slate-400 hover:text-indigo-600 transition-all" title="Baixar PDF do Cliente"><Download size={14}/></button>
             <button onClick={() => handleEdit(assinante)} className="p-1.5 text-slate-400 hover:text-blue-600 transition-all" title="Editar"><Edit3 size={14}/></button>
             <button onClick={() => deleteMutation.mutate(assinante.id)} className="p-1.5 text-slate-400 hover:text-rose-600 transition-all" title="Excluir"><Trash2 size={14}/></button>
          </div>
        </div>

        {columnType === 'disponiveis' && (
           <div className="bg-slate-50 border-b border-slate-100 px-3 py-2 flex items-center justify-between">
              <p className="text-[9px] font-medium text-slate-500 flex items-center gap-1">
                 <AlertTriangle size={10} className="text-slate-400"/> Supabase parado há <b className="text-slate-700">{diasOcioso} dias</b>
              </p>
              {assinante.link_catalogo && (
                 <a href={assinante.link_catalogo} target="_blank" rel="noreferrer" className="text-[8px] font-bold uppercase tracking-widest bg-blue-600 hover:bg-blue-700 text-white px-2 py-1 rounded shadow-sm flex items-center gap-1 transition-colors">
                    <Activity size={10}/> Movimentar
                 </a>
              )}
           </div>
        )}

        <div className="p-3 flex flex-col gap-3">
          
          <div className="grid grid-cols-2 gap-3">
             <div className="space-y-0.5 min-w-0">
                <p className="text-[8px] font-bold uppercase tracking-widest text-slate-400">Infra Vercel</p>
                <p className="text-[10px] font-medium text-slate-700 truncate">{assinante.projeto_vercel || 'N/A'}</p>
             </div>
             <div className="space-y-0.5 min-w-0">
                <p className="text-[8px] font-bold uppercase tracking-widest text-slate-400">Supabase (+ID)</p>
                <p className="text-[10px] font-medium text-slate-700 truncate">{assinante.projeto_supabase || 'N/A'}</p>
             </div>
          </div>
          
          <div className="bg-slate-50/50 p-2 rounded-lg border border-slate-100 flex flex-col gap-1">
             <p className="text-[8px] font-bold uppercase tracking-widest text-slate-500 flex items-center gap-1"><LogIn size={10}/> Login Cliente</p>
             <div className="flex justify-between items-center gap-2">
                <p className="text-[10px] font-medium text-slate-700 truncate">{assinante.usuario_painel || 'Não definido'}</p>
                <div className="flex items-center gap-2 shrink-0 bg-white px-2 py-0.5 rounded border border-slate-200">
                  <p className="text-[10px] font-mono text-slate-600">
                    {showPasswords[`${assinante.id}_painel`] ? assinante.senha_painel : '••••••'}
                  </p>
                  <button onClick={() => togglePasswordVisibility(assinante.id, 'painel')} className="text-slate-400 hover:text-blue-600"><Eye size={10}/></button>
                </div>
             </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 pt-1">
            {assinante.link_bio && <a href={assinante.link_bio} target="_blank" rel="noreferrer" className="text-[8px] font-bold text-slate-400 hover:text-slate-600 hover:underline uppercase tracking-widest flex items-center gap-1"><Users size={10}/> Bio</a>}
            {assinante.link_sistema && <a href={assinante.link_sistema} target="_blank" rel="noreferrer" className="ml-auto bg-slate-900 text-white px-3 py-1 rounded-full text-[8px] font-bold uppercase tracking-widest flex items-center gap-1 hover:bg-slate-800 transition-colors shadow-sm shrink-0">Admin <ExternalLink size={10}/></a>}
          </div>

          <div className="mt-1 pt-2 border-t border-slate-100 flex justify-center">
             <button onClick={() => toggleDates(assinante.id)} className="text-[8px] font-bold uppercase tracking-widest text-slate-400 hover:text-slate-600 flex items-center gap-1 transition-all">
                {expandedDates[assinante.id] ? <><ChevronUp size={10}/> Ocultar Datas</> : <><ChevronDown size={10}/> Gerenciar Datas</>}
             </button>
          </div>

          <AnimatePresence>
             {expandedDates[assinante.id] && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden pt-1 flex flex-col gap-2">
                   
                   <div className="bg-slate-50 rounded-lg p-2 border border-slate-200">
                      <p className="text-[8px] font-bold uppercase tracking-widest text-amber-500 mb-2 border-b border-slate-200/60 pb-1">Período de Teste</p>
                      <div className="grid grid-cols-2 gap-2">
                         <div className="space-y-1 relative z-20">
                            <label className="text-[7px] font-bold text-slate-400 uppercase tracking-widest block">Início</label>
                            <SeletorData 
                               value={assinante.data_inicio_teste} 
                               onChange={val => quickUpdateMutation.mutate({id: assinante.id, payload: {data_inicio_teste: val, tipo_conta: 'Teste'}})} 
                            />
                         </div>
                         <div className="space-y-1 relative z-10">
                            <label className="text-[7px] font-bold text-slate-400 uppercase tracking-widest block">Bloqueio</label>
                            <SeletorData 
                               value={assinante.data_fim_teste} 
                               onChange={val => quickUpdateMutation.mutate({id: assinante.id, payload: {data_fim_teste: val, tipo_conta: 'Teste'}})} 
                            />
                         </div>
                      </div>
                   </div>

                   <div className="bg-slate-50 rounded-lg p-2 border border-slate-200">
                      <p className="text-[8px] font-bold uppercase tracking-widest text-emerald-600 mb-2 border-b border-slate-200/60 pb-1">Assinatura Real</p>
                      <div className="grid grid-cols-2 gap-2">
                         <div className="space-y-1 relative z-20">
                            <label className="text-[7px] font-bold text-slate-400 uppercase tracking-widest block">Início</label>
                            <SeletorData 
                               value={assinante.data_inicio_uso} 
                               onChange={val => quickUpdateMutation.mutate({id: assinante.id, payload: {data_inicio_uso: val, tipo_conta: 'Uso'}})} 
                            />
                         </div>
                         <div className="space-y-1 relative z-10">
                            <label className="text-[7px] font-bold text-slate-400 uppercase tracking-widest block">Vencimento</label>
                            <SeletorData 
                               value={assinante.data_fim_assinatura} 
                               onChange={val => quickUpdateMutation.mutate({id: assinante.id, payload: {data_fim_assinatura: val, tipo_conta: 'Uso'}})} 
                            />
                         </div>
                      </div>
                   </div>

                </motion.div>
             )}
          </AnimatePresence>

        </div>
      </motion.div>
    );
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white max-w-sm w-full p-6 rounded-2xl shadow-sm border border-slate-200 text-center">
          <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <ShieldCheck size={24} />
          </div>
          <h1 className="text-xl font-semibold text-slate-800 uppercase tracking-tight mb-1">Fábrica SaaS</h1>
          <p className="text-[9px] font-medium text-slate-500 uppercase tracking-widest mb-6">Acesso Administrativo</p>
          <form onSubmit={handleLogin} className="space-y-4">
            <Input type="password" placeholder="Senha Mestra..." value={passwordAttempt} onChange={(e) => setPasswordAttempt(e.target.value)} className="h-10 text-center tracking-widest text-sm" autoFocus />
            <Button type="submit" className="w-full h-10 bg-blue-600 hover:bg-blue-700 font-bold uppercase text-[10px] tracking-widest text-white">Desbloquear</Button>
          </form>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      <div className="bg-white border-b border-slate-100 sticky top-0 z-20 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-3 flex flex-col md:flex-row justify-between items-center gap-3">
          <div>
            <h1 className="text-lg font-semibold text-slate-800 flex items-center gap-2 uppercase tracking-tight">
              <ShieldCheck className="w-5 h-5 text-blue-600" /> Assinantes
            </h1>
            <p className="text-[9px] font-medium text-slate-500 uppercase tracking-widest">Gestão de Licenças e Infraestrutura</p>
          </div>
          <div className="flex gap-2 w-full md:w-auto">
            <div className="relative flex-1 md:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400" />
              <Input placeholder="Buscar cliente..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-8 h-9 text-[10px] uppercase tracking-widest font-medium" />
            </div>
            <Button onClick={handleExportAllPDF} variant="outline" className="h-9 px-4 font-bold text-[10px] tracking-widest uppercase rounded-full text-slate-600 border-slate-200 hover:bg-slate-100"><Download className="w-3 h-3 mr-1" /> Dados</Button>
            <Button onClick={openNewChecklist} className="bg-blue-600 hover:bg-blue-700 h-9 px-4 font-bold text-[10px] tracking-widest uppercase rounded-full text-white"><Plus className="w-3 h-3 mr-1" /> Instalar</Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 mt-6 grid grid-cols-1 gap-6">
        
        {/* BLOCO DE ALERTAS E SQL */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-rose-50 border border-rose-200 rounded-lg p-3 flex gap-3 items-center shadow-sm text-[10px]">
             <AlertTriangle className="text-rose-600 w-4 h-4 shrink-0" />
             <p className="font-medium text-rose-700 leading-tight">
               <b>Inadimplência (Bloqueio Seguro):</b> Para pausar, vá em Supabase &gt; Settings &gt; General &gt; <b>Pause Project</b>. Para reativar, clique em <b>Resume project</b>.
             </p>
          </div>
          <div className="bg-slate-900 border border-slate-700 rounded-lg shadow-sm overflow-hidden flex flex-col justify-center">
             <div className="flex justify-between items-center p-3 bg-slate-800/50">
                <div className="flex items-center gap-2 text-blue-400">
                   <Terminal size={14} />
                   <h3 className="text-[10px] font-bold uppercase tracking-widest text-slate-200">Script SQL Mestre</h3>
                </div>
                <div className="flex items-center gap-2">
                   <button onClick={handleCopySql} className={`flex items-center gap-1 text-[9px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-full transition-colors ${isSqlCopied ? 'bg-emerald-500/20 text-emerald-400' : 'bg-blue-600 hover:bg-blue-500 text-white'}`}>
                     {isSqlCopied ? <><CheckCircle2 size={10}/> Copiado</> : <><Copy size={10}/> Copiar</>}
                   </button>
                   <button onClick={() => setShowSql(!showSql)} className="text-slate-400 hover:text-white p-1">
                     {showSql ? <ChevronUp size={16}/> : <ChevronDown size={16}/>}
                   </button>
                </div>
             </div>
             <AnimatePresence>
                {showSql && (
                   <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="border-t border-slate-700/50">
                     <textarea value={sqlMestre} onChange={e => handleSaveSql(e.target.value)} placeholder="Cole seu código SQL Mestre aqui..." className="w-full h-40 bg-slate-900 text-emerald-400 font-mono text-[10px] p-3 outline-none resize-y placeholder:text-slate-600" />
                   </motion.div>
                )}
             </AnimatePresence>
          </div>
        </div>

        {/* ESTRUTURA KANBAN DE COLUNAS */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
           
           <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between border-b-2 border-blue-200 pb-2">
                 <h2 className="text-[11px] font-bold text-blue-600 uppercase tracking-widest flex items-center gap-2"><Globe size={14}/> Disponíveis / Estoque</h2>
                 <span className="bg-blue-100 text-blue-700 text-[10px] font-bold px-2 py-0.5 rounded-full">{listDisponiveis.length}</span>
              </div>
              {listDisponiveis.map(a => renderCard(a, 'disponiveis'))}
              {listDisponiveis.length === 0 && <p className="text-[10px] text-slate-400 uppercase tracking-widest text-center py-6 font-medium">Nenhum sistema no estoque</p>}
           </div>

           <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between border-b-2 border-amber-200 pb-2">
                 <h2 className="text-[11px] font-bold text-amber-500 uppercase tracking-widest flex items-center gap-2"><Clock size={14}/> Em Teste</h2>
                 <span className="bg-amber-100 text-amber-700 text-[10px] font-bold px-2 py-0.5 rounded-full">{listEmTeste.length}</span>
              </div>
              {listEmTeste.map(a => renderCard(a, 'teste'))}
              {listEmTeste.length === 0 && <p className="text-[10px] text-slate-400 uppercase tracking-widest text-center py-6 font-medium">Nenhum cliente em teste</p>}
           </div>

           <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between border-b-2 border-emerald-200 pb-2">
                 <h2 className="text-[11px] font-bold text-emerald-600 uppercase tracking-widest flex items-center gap-2"><ShieldCheck size={14}/> Assinados / Em Uso</h2>
                 <span className="bg-emerald-100 text-emerald-700 text-[10px] font-bold px-2 py-0.5 rounded-full">{listAssinados.length}</span>
              </div>
              {listAssinados.map(a => renderCard(a, 'assinados'))}
              {listAssinados.length === 0 && <p className="text-[10px] text-slate-400 uppercase tracking-widest text-center py-6 font-medium">Nenhuma assinatura ativa</p>}
           </div>

        </div>

      </div>

      <AssinanteModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        assinanteEditando={editingAssinante} 
      />
      
    </div>
  );
}