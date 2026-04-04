import React, { useState } from 'react';
import { supabase } from "../lib/supabase";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  ShieldCheck, Lock, Unlock, Users, Search, Plus, Trash2, Edit3, 
  ExternalLink, X, Save, Loader2, Database, Globe, Mail, Key, Calendar,
  Smartphone, Eye, EyeOff, CheckCircle2, Server, ChevronRight, ChevronLeft, Check, Copy
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AnimatePresence, motion } from "framer-motion";

// === MOTOR DE CRIPTOGRAFIA (SEGURANÇA DO BANCO) ===
const SECRET_KEY = "CriarteMasterKey2026";

const encrypt = (text) => {
  if (!text) return text;
  if (text.startsWith('ENC:')) return text; // Evita criptografar duas vezes
  let result = '';
  for (let i = 0; i < text.length; i++) {
      result += String.fromCharCode(text.charCodeAt(i) ^ SECRET_KEY.charCodeAt(i % SECRET_KEY.length));
  }
  return 'ENC:' + btoa(result);
};

const decrypt = (text) => {
  if (!text) return text;
  if (!text.startsWith('ENC:')) return text; // Se não estiver criptografado, retorna o texto normal
  try {
      let base64 = text.substring(4);
      let textDecoded = atob(base64);
      let result = '';
      for (let i = 0; i < textDecoded.length; i++) {
          result += String.fromCharCode(textDecoded.charCodeAt(i) ^ SECRET_KEY.charCodeAt(i % SECRET_KEY.length));
      }
      return result;
  } catch (e) {
      return text;
  }
};
// ==================================================

export default function Assinantes() {
  // --- SEGURANÇA DA PÁGINA ---
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [passwordAttempt, setPasswordAttempt] = useState('');
  const [loginError, setLoginError] = useState(false);
  const SENHA_MESTRA = "794613Ed"; 

  // --- ESTADOS DA PÁGINA ---
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAssinante, setEditingAssinante] = useState(null);
  const [showPasswords, setShowPasswords] = useState({}); 
  const [modalStep, setModalStep] = useState(1); // Controla o passo do Checklist

  const queryClient = useQueryClient();

  // --- BUSCAS NO BANCO ---
  const { data: assinantes = [], isLoading: isLoadingAssinantes } = useQuery({
    queryKey: ["criarte-assinantes"],
    queryFn: async () => {
      const { data, error } = await supabase.from("assinantes").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      
      // DESCRIPTOGRAFA AS SENHAS ANTES DE MOSTRAR NA TELA
      return data.map(assinante => ({
        ...assinante,
        senha_email: decrypt(assinante.senha_email),
        senha_vercel: decrypt(assinante.senha_vercel),
        senha_supabase: decrypt(assinante.senha_supabase),
        senha_banco_dados: decrypt(assinante.senha_banco_dados),
        supabase_anon_key: decrypt(assinante.supabase_anon_key),
      }));
    },
    enabled: isAuthenticated, 
  });

  const { data: clientes = [], isLoading: isLoadingClientes } = useQuery({
    queryKey: ["criarte-clientes-lista"],
    queryFn: async () => {
      const { data, error } = await supabase.from("clientes").select("id, nome, whatsapp").order("nome", { ascending: true });
      if (error) throw error;
      return data;
    },
    enabled: isAuthenticated,
  });

  // --- MUTAÇÕES ---
  const saveMutation = useMutation({
    mutationFn: async (assinanteData) => {
      
      // CRIPTOGRAFA AS SENHAS ANTES DE MANDAR PARA O SUPABASE
      const dadosSeguros = {
        ...assinanteData,
        senha_email: encrypt(assinanteData.senha_email),
        senha_vercel: encrypt(assinanteData.senha_vercel),
        senha_supabase: encrypt(assinanteData.senha_supabase),
        senha_banco_dados: encrypt(assinanteData.senha_banco_dados),
        supabase_anon_key: encrypt(assinanteData.supabase_anon_key),
      };

      if (dadosSeguros.id && typeof dadosSeguros.id === 'string' && dadosSeguros.id.length > 10) {
        const { error } = await supabase.from("assinantes").update(dadosSeguros).eq("id", dadosSeguros.id);
        if (error) throw error;
      } else {
        const { id, ...novoAssinante } = dadosSeguros; 
        const { error } = await supabase.from("assinantes").insert([novoAssinante]);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["criarte-assinantes"] });
      setIsModalOpen(false);
      setEditingAssinante(null);
      setModalStep(1);
    },
  });

  // --- FUNÇÕES AUXILIARES ---
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
      setLoginError(false);
    } else {
      setLoginError(true);
      setPasswordAttempt('');
    }
  };

  const handleClienteChange = (e) => {
    const clienteId = e.target.value;
    const clienteSelecionado = clientes.find(c => c.id === clienteId);
    if (clienteSelecionado) {
      setEditingAssinante({
        ...editingAssinante,
        cliente_id: clienteSelecionado.id,
        nome_cliente: clienteSelecionado.nome,
        whatsapp: clienteSelecionado.whatsapp || ''
      });
    }
  };

  const togglePasswordVisibility = (id, field) => {
    const key = `${id}_${field}`;
    setShowPasswords(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const copiarTexto = (texto) => {
    navigator.clipboard.writeText(texto);
  };

  const handleSave = () => {
    if (!editingAssinante.nome_cliente) {
      alert("Selecione um cliente no Passo 1 primeiro.");
      setModalStep(1);
      return;
    }
    saveMutation.mutate(editingAssinante);
  };

  const openNewChecklist = () => {
    setEditingAssinante({ 
      cliente_id: '', nome_cliente: '', whatsapp: '', 
      data_assinatura: new Date().toISOString().split('T')[0],
      email_acesso: '', senha_email: '', 
      database_acesso: '', senha_supabase: '', senha_banco_dados: '', supabase_anon_key: '',
      vercel_acesso: '', senha_vercel: '',
      link_sistema: '', link_catalogo: '', status: 'Ativo'
    });
    setModalStep(1);
    setIsModalOpen(true);
  };

  // --- TELA DE BLOQUEIO ---
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white max-w-sm w-full p-8 rounded-2xl shadow-sm border border-slate-200 text-center">
          <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <ShieldCheck size={32} />
          </div>
          <h1 className="text-xl font-bold text-slate-800 uppercase tracking-tight mb-2">Área Restrita</h1>
          <p className="text-xs font-medium text-slate-500 uppercase tracking-widest mb-6">Gestão de Assinantes SaaS</p>
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <Input type="password" placeholder="Digite a senha..." value={passwordAttempt} onChange={(e) => setPasswordAttempt(e.target.value)} className={`h-12 text-center text-lg tracking-widest ${loginError ? 'border-red-500 bg-red-50' : ''}`} autoFocus />
            </div>
            <Button type="submit" className="w-full h-12 bg-blue-600 hover:bg-blue-700 font-bold uppercase text-xs tracking-widest">
              Desbloquear <Unlock className="w-4 h-4 ml-2" />
            </Button>
          </form>
        </motion.div>
      </div>
    );
  }

  const filteredAssinantes = assinantes.filter(a => a.nome_cliente?.toLowerCase().includes(searchTerm.toLowerCase()));
  const isLoading = isLoadingAssinantes || isLoadingClientes;

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      {/* Header */}
      <div className="bg-white border-b border-slate-100 sticky top-0 z-20 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 md:py-5">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-xl md:text-2xl font-bold md:font-semibold text-slate-800 flex items-center gap-2 uppercase tracking-tight">
                <ShieldCheck className="w-5 h-5 md:w-6 md:h-6 text-blue-600" /> Assinantes
              </h1>
              <p className="text-[10px] md:text-xs font-medium text-slate-500 uppercase tracking-widest mt-1">Gerenciamento de Licenças e Infraestrutura</p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto items-center">
              <div className="relative w-full md:w-72 lg:w-80">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input placeholder="Pesquisar assinante..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="h-10 md:h-9 pl-9 border-slate-200 bg-slate-50/50 rounded-md font-medium text-xs w-full" />
              </div>
              <Button onClick={openNewChecklist} className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white rounded-md h-10 md:h-9 px-6 shadow-sm flex gap-2 font-semibold text-xs uppercase">
                <Plus className="w-4 h-4" /> NOVA INSTALAÇÃO
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 mt-6 md:mt-8">
        {isLoading ? (
          <div className="flex justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-blue-600" /></div>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:gap-6">
            <AnimatePresence>
              {filteredAssinantes.map((assinante) => (
                <motion.div key={assinante.id} layout initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-white border border-slate-200 shadow-sm rounded-xl overflow-hidden flex flex-col">
                  {/* Cabeçalho do Card */}
                  <div className="p-4 md:p-5 border-b border-slate-100 flex justify-between items-start bg-slate-50/50">
                    <div className="flex gap-3 items-center">
                      <div className="w-12 h-12 bg-white border border-slate-200 rounded-lg flex items-center justify-center font-bold text-blue-600 text-xl shadow-sm shrink-0">
                        {assinante.nome_cliente.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-800 uppercase tracking-tight">{assinante.nome_cliente}</h3>
                        <div className="flex items-center gap-3 mt-1 flex-wrap">
                          <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-600 flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> {assinante.status}</span>
                          <span className="text-[10px] font-medium text-slate-500 flex items-center gap-1"><Calendar className="w-3 h-3" /> Instalação: {assinante.data_assinatura && assinante.data_assinatura.split('-').reverse().join('/')}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <button onClick={() => { setEditingAssinante(assinante); setModalStep(1); setIsModalOpen(true); }} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"><Edit3 size={16} /></button>
                      <button onClick={() => deleteMutation.mutate(assinante.id)} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors"><Trash2 size={16} /></button>
                    </div>
                  </div>

                  {/* Corpo do Card */}
                  <div className="p-4 md:p-5 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 flex-1">
                    {/* Bloco Conta */}
                    <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 space-y-2 relative">
                      <div className="pb-2 border-b border-slate-200/60">
                         <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400 flex items-center gap-1 mb-1"><Mail size={12}/> Conta Base (Gmail)</p>
                         <p className="text-xs font-semibold text-slate-700 truncate">{assinante.email_acesso || 'N/A'}</p>
                      </div>
                      <div className="pt-1 flex justify-between items-center">
                         <p className="text-xs font-semibold text-slate-700 font-mono">{showPasswords[`${assinante.id}_email`] ? assinante.senha_email : '••••••••'}</p>
                         <button onClick={() => togglePasswordVisibility(assinante.id, 'email')} className="text-slate-400 hover:text-blue-600 transition-colors">{showPasswords[`${assinante.id}_email`] ? <EyeOff size={14}/> : <Eye size={14}/>}</button>
                      </div>
                    </div>

                    {/* Bloco Supabase + Keys */}
                    <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 space-y-2">
                      <div className="pb-2 border-b border-slate-200/60">
                         <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400 flex items-center gap-1 mb-1"><Database size={12}/> Supabase (Projeto)</p>
                         <p className="text-xs font-semibold text-slate-700 truncate">{assinante.database_acesso || 'N/A'}</p>
                      </div>
                      <div className="pt-1 flex justify-between items-center pb-2 border-b border-slate-200/60">
                         <p className="text-xs font-semibold text-slate-700 font-mono">{showPasswords[`${assinante.id}_supabase`] ? assinante.senha_supabase : '••••••••'}</p>
                         <button onClick={() => togglePasswordVisibility(assinante.id, 'supabase')} className="text-slate-400 hover:text-blue-600 transition-colors">{showPasswords[`${assinante.id}_supabase`] ? <EyeOff size={14}/> : <Eye size={14}/>}</button>
                      </div>
                      <div className="pt-1 flex justify-between items-center">
                         <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400">Anon Key:</p>
                         <div className="flex gap-2 items-center">
                           <p className="text-[10px] font-semibold text-slate-600 font-mono max-w-[80px] truncate">{showPasswords[`${assinante.id}_anonkey`] ? assinante.supabase_anon_key : '••••••••'}</p>
                           <button onClick={() => togglePasswordVisibility(assinante.id, 'anonkey')} className="text-slate-400 hover:text-blue-600"><Eye size={12}/></button>
                           {assinante.supabase_anon_key && <button onClick={() => copiarTexto(assinante.supabase_anon_key)} className="text-slate-400 hover:text-blue-600"><Copy size={12}/></button>}
                         </div>
                      </div>
                    </div>

                    {/* Bloco DB & Vercel */}
                    <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 space-y-2">
                      <div className="pb-2 border-b border-slate-200/60">
                         <p className="text-[9px] font-bold uppercase tracking-widest text-blue-500 flex items-center gap-1 mb-1"><Server size={12}/> DB Password</p>
                         <div className="flex justify-between items-center">
                           <p className="text-xs font-bold text-blue-700 font-mono truncate">{showPasswords[`${assinante.id}_db`] ? assinante.senha_banco_dados : '••••••••'}</p>
                           <button onClick={() => togglePasswordVisibility(assinante.id, 'db')} className="text-blue-400 hover:text-blue-600"><Eye size={14}/></button>
                         </div>
                      </div>
                      <div className="pt-1 flex justify-between items-center">
                         <div>
                           <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400 flex items-center gap-1 mb-1"><Globe size={12}/> Vercel</p>
                           <p className="text-[10px] font-semibold text-slate-700 font-mono truncate">{showPasswords[`${assinante.id}_vercel`] ? assinante.senha_vercel : '••••••••'}</p>
                         </div>
                         <button onClick={() => togglePasswordVisibility(assinante.id, 'vercel')} className="text-slate-400 hover:text-blue-600"><Eye size={14}/></button>
                      </div>
                    </div>

                    {/* Links de Entrega */}
                    <div className="bg-purple-50/50 p-3 rounded-lg border border-purple-100 space-y-2 flex flex-col justify-center">
                       <p className="text-[9px] font-bold uppercase tracking-widest text-purple-500 flex items-center gap-1 mb-1"><Globe size={12}/> Link do Painel</p>
                       {assinante.link_sistema ? (
                        <a href={assinante.link_sistema} target="_blank" className="text-xs font-bold text-purple-700 hover:underline flex items-center justify-between bg-white p-2 border border-purple-100 rounded-md shadow-sm">Acessar Admin <ExternalLink size={12}/></a>
                      ) : <p className="text-xs text-purple-400 font-semibold">Pendente</p>}
                    </div>

                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* MODAL CHECKLIST (WIZARD) */}
      <AnimatePresence>
        {isModalOpen && editingAssinante && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsModalOpen(false)} className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" />
            
            <motion.div initial={{ scale: 0.95, opacity: 0, y: 10 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 10 }} className="bg-white w-full max-w-3xl rounded-2xl md:rounded-xl shadow-xl relative z-10 overflow-hidden flex flex-col max-h-[90vh]">
              
              <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                <h2 className="text-lg font-bold text-slate-800 uppercase tracking-tight flex items-center gap-2">
                  <ShieldCheck className="text-blue-600" /> 
                  {editingAssinante.id ? 'Manutenção do Cliente' : 'Assistente de Instalação'}
                </h2>
                <button onClick={() => setIsModalOpen(false)} className="p-1.5 hover:bg-slate-200 text-slate-500 rounded-md transition-colors"><X className="w-5 h-5" /></button>
              </div>
              
              {/* PROGRESS BAR (STEPPER) */}
              <div className="bg-white border-b border-slate-100 px-6 py-4 flex justify-between items-center relative">
                 <div className="absolute left-10 right-10 top-1/2 h-0.5 bg-slate-100 -z-0"></div>
                 {[
                   { step: 1, label: "Conta" },
                   { step: 2, label: "Supabase" },
                   { step: 3, label: "Vercel" },
                   { step: 4, label: "Links" }
                 ].map((s) => (
                   <div key={s.step} className="relative z-10 flex flex-col items-center gap-2 bg-white px-2">
                     <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${modalStep === s.step ? 'bg-blue-600 text-white shadow-md ring-4 ring-blue-50' : modalStep > s.step ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-400 border border-slate-200'}`}>
                       {modalStep > s.step ? <Check size={14} /> : s.step}
                     </div>
                     <span className={`text-[9px] font-bold uppercase tracking-widest ${modalStep >= s.step ? 'text-slate-700' : 'text-slate-400'}`}>{s.label}</span>
                   </div>
                 ))}
              </div>

              {/* CONTEÚDO DOS PASSOS */}
              <div className="p-6 overflow-y-auto min-h-[300px] bg-slate-50/50">
                
                {modalStep === 1 && (
                  <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-5">
                    <h3 className="text-sm font-bold uppercase tracking-widest text-slate-700 border-b border-slate-200 pb-2 mb-4">Fase 1: O Cliente e a Conta Base</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold uppercase text-slate-500 tracking-widest ml-1">1. Escolha o Cliente (Dono)</label>
                        <select className="w-full h-11 border-slate-200 bg-white rounded-md font-medium text-sm text-slate-700 px-3 outline-none focus:border-blue-500" value={editingAssinante.cliente_id || ''} onChange={handleClienteChange}>
                          <option value="">-- Selecione o Cliente --</option>
                          {clientes.map(c => (<option key={c.id} value={c.id}>{c.nome}</option>))}
                        </select>
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold uppercase text-slate-500 tracking-widest ml-1">Data da Instalação</label>
                        <Input type="date" value={editingAssinante.data_assinatura || ''} onChange={e => setEditingAssinante({...editingAssinante, data_assinatura: e.target.value})} className="h-11 border-slate-200 bg-white" />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-white p-4 rounded-lg border border-slate-200">
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold uppercase text-slate-500 tracking-widest ml-1">2. E-mail de Serviço (Google)</label>
                        <Input value={editingAssinante.email_acesso || ''} onChange={e => setEditingAssinante({...editingAssinante, email_acesso: e.target.value})} placeholder="ex: sistema.grafica@gmail.com" className="h-11" />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold uppercase text-slate-500 tracking-widest ml-1">Senha do E-mail</label>
                        <Input value={editingAssinante.senha_email || ''} onChange={e => setEditingAssinante({...editingAssinante, senha_email: e.target.value})} placeholder="Senha criada..." className="h-11" />
                      </div>
                    </div>
                  </motion.div>
                )}

                {modalStep === 2 && (
                  <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-5">
                    <h3 className="text-sm font-bold uppercase tracking-widest text-slate-700 border-b border-slate-200 pb-2 mb-4">Fase 2: Banco de Dados (Supabase)</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold uppercase text-slate-500 tracking-widest ml-1">Nome do Projeto Supabase</label>
                        <Input value={editingAssinante.database_acesso || ''} onChange={e => setEditingAssinante({...editingAssinante, database_acesso: e.target.value})} placeholder="Ex: Projeto Copynet" className="h-11 border-slate-200 bg-white" />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold uppercase text-slate-500 tracking-widest ml-1">Senha do Painel (Login)</label>
                        <Input value={editingAssinante.senha_supabase || ''} onChange={e => setEditingAssinante({...editingAssinante, senha_supabase: e.target.value})} placeholder="Senha para logar no Supabase" className="h-11 border-slate-200 bg-white" />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-blue-50/50 p-4 rounded-lg border border-blue-100">
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold uppercase text-blue-600 tracking-widest ml-1 flex justify-between">DB Password (Chave Mestra) <Database size={12}/></label>
                        <Input value={editingAssinante.senha_banco_dados || ''} onChange={e => setEditingAssinante({...editingAssinante, senha_banco_dados: e.target.value})} placeholder="Senha forte definida na criação" className="h-11 border-blue-200" />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold uppercase text-blue-600 tracking-widest ml-1 flex justify-between">Anon Public Key (Vercel) <Key size={12}/></label>
                        <Input value={editingAssinante.supabase_anon_key || ''} onChange={e => setEditingAssinante({...editingAssinante, supabase_anon_key: e.target.value})} placeholder="eyJh..." className="h-11 border-blue-200 font-mono text-xs" />
                      </div>
                    </div>
                  </motion.div>
                )}

                {modalStep === 3 && (
                  <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-5">
                    <h3 className="text-sm font-bold uppercase tracking-widest text-slate-700 border-b border-slate-200 pb-2 mb-4">Fase 3: Hospedagem (Vercel)</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-white p-4 rounded-lg border border-slate-200">
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold uppercase text-slate-500 tracking-widest ml-1">Nome do Projeto Vercel</label>
                        <Input value={editingAssinante.vercel_acesso || ''} onChange={e => setEditingAssinante({...editingAssinante, vercel_acesso: e.target.value})} placeholder="Ex: grafica-irmao" className="h-11" />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold uppercase text-slate-500 tracking-widest ml-1">Senha da Vercel</label>
                        <Input value={editingAssinante.senha_vercel || ''} onChange={e => setEditingAssinante({...editingAssinante, senha_vercel: e.target.value})} placeholder="Senha de login da Vercel" className="h-11" />
                      </div>
                    </div>
                    <div className="text-center p-4 bg-amber-50 rounded-lg border border-amber-100">
                      <p className="text-[10px] font-bold text-amber-600 uppercase tracking-widest mb-1">Dica de Ouro</p>
                      <p className="text-xs text-amber-700 font-medium">Lembre-se de colar a Anon Key do passo anterior nas "Environment Variables" antes de dar o Deploy!</p>
                    </div>
                  </motion.div>
                )}

                {modalStep === 4 && (
                  <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-5">
                    <h3 className="text-sm font-bold uppercase tracking-widest text-slate-700 border-b border-slate-200 pb-2 mb-4">Fase 4: Entrega Oficial</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-purple-50/50 p-4 rounded-lg border border-purple-100">
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold uppercase text-purple-600 tracking-widest ml-1">Link Final do Painel</label>
                        <Input value={editingAssinante.link_sistema || ''} onChange={e => setEditingAssinante({...editingAssinante, link_sistema: e.target.value})} placeholder="https://painel-grafica.vercel.app" className="h-11 border-purple-200 focus-visible:ring-purple-500" />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold uppercase text-purple-600 tracking-widest ml-1">Link Final do Catálogo (Vitrine)</label>
                        <Input value={editingAssinante.link_catalogo || ''} onChange={e => setEditingAssinante({...editingAssinante, link_catalogo: e.target.value})} placeholder="https://catalogo-grafica.vercel.app" className="h-11 border-purple-200 focus-visible:ring-purple-500" />
                      </div>
                    </div>
                    <div className="text-center py-4">
                      <p className="text-xs text-slate-500 font-medium">Ao clicar em salvar, todos os dados estarão seguros e criptografados no banco de dados.</p>
                    </div>
                  </motion.div>
                )}

              </div>

              {/* FOOTER WIZARD CONTROLS */}
              <div className="p-4 border-t border-slate-100 bg-white flex justify-between items-center rounded-b-xl">
                <Button 
                  variant="outline" 
                  onClick={() => setModalStep(prev => prev - 1)} 
                  disabled={modalStep === 1}
                  className="font-bold uppercase text-[10px] tracking-widest w-32 border-slate-200 text-slate-500 hover:bg-slate-50"
                >
                  <ChevronLeft className="w-4 h-4 mr-1" /> Voltar
                </Button>
                
                {modalStep < 4 ? (
                  <Button 
                    onClick={() => setModalStep(prev => prev + 1)} 
                    className="font-bold uppercase text-[10px] tracking-widest w-32 bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    Próximo <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                ) : (
                  <Button 
                    onClick={handleSave} 
                    disabled={saveMutation.isPending} 
                    className="font-bold uppercase text-[10px] tracking-widest w-auto px-6 bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm"
                  >
                    {saveMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Save className="w-4 h-4 mr-2"/> Finalizar e Salvar</>}
                  </Button>
                )}
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
