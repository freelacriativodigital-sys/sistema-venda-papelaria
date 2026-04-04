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

// IMPORTANDO O NOSSO NOVO MÓDULO PADRÃO DE DATA
import SeletorData from "@/components/SeletorData";

// === MOTOR DE CRIPTOGRAFIA (SEGURANÇA DO BANCO) ===
const SECRET_KEY = "CriarteMasterKey2026";

const encrypt = (text) => {
  if (!text) return text;
  if (text.startsWith('ENC:')) return text; 
  let result = '';
  for (let i = 0; i < text.length; i++) {
      result += String.fromCharCode(text.charCodeAt(i) ^ SECRET_KEY.charCodeAt(i % SECRET_KEY.length));
  }
  return 'ENC:' + btoa(result);
};

const decrypt = (text) => {
  if (!text) return text;
  if (!text.startsWith('ENC:')) return text; 
  const raw = atob(text.replace('ENC:', ''));
  let result = '';
  for (let i = 0; i < raw.length; i++) {
      result += String.fromCharCode(raw.charCodeAt(i) ^ SECRET_KEY.charCodeAt(i % SECRET_KEY.length));
  }
  return result;
};

// --- MÁSCARA INTELIGENTE DO WHATSAPP ---
const formatWhatsApp = (val) => {
  if (!val) return '';
  let cleanVal = val.replace(/^\+?\s*55\s*/, '');
  let nums = cleanVal.replace(/\D/g, '');
  if (nums.length >= 12 && nums.startsWith('55')) nums = nums.slice(2);
  if (nums.length > 11) nums = nums.slice(0, 11);
  if (nums.length === 0) return '';
  let formatted = '+55 ';
  if (nums.length > 0) formatted += nums.slice(0, 2);
  if (nums.length > 2) formatted += ' ' + nums.slice(2, 7);
  if (nums.length > 7) formatted += '-' + nums.slice(7, 11);
  return formatted;
};

export default function Assinantes() {
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalStep, setModalStep] = useState(1);
  const [editingClient, setEditingClient] = useState(null);
  
  const [form, setForm] = useState({
    id: null,
    nome: '',
    email: '',
    telefone: '',
    vencimento: '',
    status: 'Ativo',
    banco_url: '',
    banco_key: '',
    vercel_url: ''
  });

  const [showKeys, setShowKeys] = useState({});
  const [copiedId, setCopiedId] = useState(null);

  const queryClient = useQueryClient();

  const { data: assinantes = [], isLoading } = useQuery({
    queryKey: ["sistema-assinantes"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("assinantes")
        .select("*")
        .order("nome", { ascending: true });
      if (error) throw error;
      return data || [];
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (data) => {
      const payload = {
        nome: data.nome,
        email: data.email,
        telefone: data.telefone,
        vencimento: data.vencimento || null,
        status: data.status,
        banco_url: encrypt(data.banco_url),
        banco_key: encrypt(data.banco_key),
        vercel_url: data.vercel_url,
      };

      if (data.id) {
        const { error } = await supabase.from("assinantes").update(payload).eq("id", data.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("assinantes").insert([payload]);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sistema-assinantes"] });
      setIsModalOpen(false);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      const { error } = await supabase.from("assinantes").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["sistema-assinantes"] }),
  });

  const handleNew = () => {
    setForm({
      id: null, nome: '', email: '', telefone: '', vencimento: '', 
      status: 'Ativo', banco_url: '', banco_key: '', vercel_url: ''
    });
    setModalStep(1);
    setIsModalOpen(true);
  };

  const handleEdit = (cliente) => {
    setForm({
      id: cliente.id,
      nome: cliente.nome || '',
      email: cliente.email || '',
      telefone: cliente.telefone || '',
      vencimento: cliente.vencimento || '',
      status: cliente.status || 'Ativo',
      banco_url: decrypt(cliente.banco_url),
      banco_key: decrypt(cliente.banco_key),
      vercel_url: cliente.vercel_url || ''
    });
    setModalStep(1);
    setIsModalOpen(true);
  };

  const handleSave = () => {
    if (!form.nome || !form.email) return alert("Nome e Email são obrigatórios!");
    saveMutation.mutate(form);
  };

  const toggleKeyVisibility = (id) => {
    setShowKeys(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const copyToClipboard = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const filteredAssinantes = assinantes.filter(a => 
    (a.nome || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (a.email || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusColor = (status) => {
    if (status === 'Ativo') return 'bg-emerald-50 text-emerald-600 border-emerald-100';
    if (status === 'Aviso') return 'bg-amber-50 text-amber-600 border-amber-100';
    return 'bg-rose-50 text-rose-600 border-rose-100';
  };

  const formatDate = (dateString) => {
    if (!dateString) return '---';
    const [ano, mes, dia] = dateString.split('-');
    return `${dia}/${mes}/${ano}`;
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] pb-24 md:pb-20 text-slate-900">
      
      {/* HEADER DA PÁGINA */}
      <div className="border-b border-slate-200 bg-white/90 backdrop-blur-md sticky top-0 z-10 shadow-sm mb-6">
        <div className="max-w-6xl mx-auto px-4 py-3 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <h1 className="text-lg md:text-xl font-semibold text-slate-800 uppercase leading-none tracking-tight flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-blue-600" /> Assinantes
            </h1>
            <div className="h-6 w-px bg-slate-200 hidden md:block"></div>
            <p className="text-[9px] md:text-[10px] text-slate-500 font-medium uppercase tracking-widest hidden md:block mt-0.5">
              Gestão de Licenças e Bancos
            </p>
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto">
            <div className="relative w-full md:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
              <Input 
                placeholder="Pesquisar assinante..." 
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="h-9 pl-8 border-slate-200 bg-slate-50 rounded-md font-medium text-xs w-full focus:bg-white"
              />
            </div>
            <Button onClick={handleNew} className="bg-blue-600 hover:bg-blue-700 text-white rounded-md h-9 px-4 shadow-sm hidden md:flex gap-1.5 font-semibold text-[10px] uppercase tracking-widest shrink-0">
              <Plus className="w-3.5 h-3.5" /> Novo
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        
        {/* ALERTA DE SEGURANÇA */}
        <div className="bg-blue-50/50 border border-blue-100 rounded-xl p-4 mb-6 flex items-start gap-3">
          <Lock className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
          <div>
            <h3 className="text-[11px] font-bold uppercase tracking-widest text-blue-800 mb-1">Cofre de Dados Ativo</h3>
            <p className="text-[10px] font-medium text-blue-600/80 leading-relaxed">
              Todas as chaves do Supabase (URL e KEY) informadas aqui são <strong>criptografadas com AES</strong> antes de serem salvas. 
              Nem mesmo um administrador de banco de dados terá acesso às chaves reais dos seus clientes.
            </p>
          </div>
        </div>

        {/* LISTAGEM DE ASSINANTES */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
            <p className="text-[9px] font-medium text-slate-400 uppercase tracking-widest">Carregando cofre...</p>
          </div>
        ) : filteredAssinantes.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-xl border border-slate-200 shadow-sm">
            <Users className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <h3 className="text-sm font-semibold text-slate-800 uppercase tracking-tight mb-1">Nenhum Assinante</h3>
            <p className="text-[9px] font-medium uppercase text-slate-400 tracking-widest">A sua carteira de clientes está vazia.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
            <AnimatePresence mode="popLayout">
              {filteredAssinantes.map((cliente) => (
                <motion.div
                  key={cliente.id}
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="bg-white border border-slate-200 shadow-sm rounded-xl overflow-hidden hover:border-blue-300 transition-colors flex flex-col"
                >
                  {/* Cabecalho Card */}
                  <div className="p-4 border-b border-slate-100 flex items-start justify-between bg-slate-50/50">
                    <div className="flex items-center gap-3">
                       <div className="w-10 h-10 bg-white border border-slate-200 rounded-lg flex items-center justify-center font-bold text-blue-600 text-sm shrink-0 shadow-sm">
                         {(cliente.nome || 'A').charAt(0).toUpperCase()}
                       </div>
                       <div>
                         <h3 className="font-bold text-slate-800 text-xs uppercase tracking-tight">{cliente.nome}</h3>
                         <span className={`inline-block px-2 py-0.5 mt-1 rounded text-[8px] font-bold uppercase tracking-widest border ${getStatusColor(cliente.status)}`}>
                           {cliente.status}
                         </span>
                       </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <button onClick={() => handleEdit(cliente)} className="w-8 h-8 rounded-md flex items-center justify-center text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"><Edit3 size={14}/></button>
                      <button onClick={() => { if(window.confirm("Excluir definitivamente este assinante e apagar as suas chaves do cofre?")) deleteMutation.mutate(cliente.id); }} className="w-8 h-8 rounded-md flex items-center justify-center text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"><Trash2 size={14}/></button>
                    </div>
                  </div>

                  {/* Corpo Card (Dados Básicos) */}
                  <div className="p-4 space-y-3">
                    <div className="flex items-center gap-2 text-[10px] text-slate-600 font-medium">
                       <Mail size={12} className="text-slate-400"/> <span className="truncate">{cliente.email}</span>
                    </div>
                    {cliente.telefone && (
                      <div className="flex items-center gap-2 text-[10px] text-slate-600 font-medium">
                         <Smartphone size={12} className="text-slate-400"/> {cliente.telefone}
                      </div>
                    )}
                    <div className="flex items-center gap-2 text-[10px] text-slate-600 font-medium">
                       <Calendar size={12} className="text-slate-400"/> Vence em: <strong className="text-slate-800">{formatDate(cliente.vencimento)}</strong>
                    </div>
                    {cliente.vercel_url && (
                      <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                        <div className="flex items-center gap-2 text-[10px] text-blue-600 font-bold uppercase tracking-widest">
                          <Globe size={12} /> URL Vercel
                        </div>
                        <a href={cliente.vercel_url.startsWith('http') ? cliente.vercel_url : `https://${cliente.vercel_url}`} target="_blank" rel="noreferrer" className="text-blue-500 hover:text-blue-700 bg-blue-50 p-1.5 rounded transition-colors">
                          <ExternalLink size={12} />
                        </a>
                      </div>
                    )}
                  </div>

                  {/* Rodapé Card (Cofre Supabase) */}
                  <div className="p-4 bg-slate-900 mt-auto flex flex-col gap-2">
                    <div className="flex items-center justify-between mb-1">
                       <span className="text-[9px] font-bold uppercase tracking-widest text-slate-400 flex items-center gap-1.5"><Database size={10} className="text-emerald-400"/> Credenciais Supabase</span>
                       <button onClick={() => toggleKeyVisibility(cliente.id)} className="text-slate-400 hover:text-white transition-colors">
                         {showKeys[cliente.id] ? <EyeOff size={14}/> : <Eye size={14}/>}
                       </button>
                    </div>

                    <div className="space-y-2">
                      <div className="relative group">
                        <Input 
                          type={showKeys[cliente.id] ? "text" : "password"} 
                          readOnly 
                          value={decrypt(cliente.banco_url) || 'Não informada'}
                          className={`h-8 text-[10px] font-mono border-slate-700 pr-8 ${showKeys[cliente.id] ? 'bg-slate-800 text-emerald-400' : 'bg-slate-800/50 text-slate-500'} focus:ring-0`}
                        />
                        {showKeys[cliente.id] && decrypt(cliente.banco_url) && (
                          <button onClick={() => copyToClipboard(decrypt(cliente.banco_url), `url-${cliente.id}`)} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white">
                            {copiedId === `url-${cliente.id}` ? <Check size={12} className="text-emerald-400"/> : <Copy size={12}/>}
                          </button>
                        )}
                      </div>
                      
                      <div className="relative group">
                        <Input 
                          type={showKeys[cliente.id] ? "text" : "password"} 
                          readOnly 
                          value={decrypt(cliente.banco_key) || 'Não informada'}
                          className={`h-8 text-[10px] font-mono border-slate-700 pr-8 ${showKeys[cliente.id] ? 'bg-slate-800 text-amber-400' : 'bg-slate-800/50 text-slate-500'} focus:ring-0`}
                        />
                        {showKeys[cliente.id] && decrypt(cliente.banco_key) && (
                          <button onClick={() => copyToClipboard(decrypt(cliente.banco_key), `key-${cliente.id}`)} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white">
                            {copiedId === `key-${cliente.id}` ? <Check size={12} className="text-emerald-400"/> : <Copy size={12}/>}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      <div className="md:hidden fixed bottom-0 left-0 w-full p-3 bg-white border-t border-slate-200 z-[90] shadow-[0_-4px_15px_rgba(0,0,0,0.03)] pb-safe">
        <Button onClick={handleNew} className="w-full h-11 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold uppercase tracking-widest text-[10px] shadow-sm">
          <Plus size={16} className="mr-1.5" /> Novo Assinante
        </Button>
      </div>

      {/* MODAL MULTI-STEP DE CADASTRO/EDIÇÃO */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsModalOpen(false)} className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" />
            <motion.div initial={{ scale: 0.95, opacity: 0, y: 10 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 10 }} className="bg-white w-full max-w-md rounded-xl shadow-2xl relative z-10 flex flex-col overflow-visible">
              
              {/* Header Modal */}
              <div className="flex justify-between items-center p-5 border-b border-slate-100">
                <div>
                  <h2 className="text-sm font-bold text-slate-800 uppercase tracking-tight">
                    {form.id ? 'Editar Assinante' : 'Novo Assinante'}
                  </h2>
                  <div className="flex gap-1 mt-2">
                    {[1, 2, 3, 4].map(step => (
                      <div key={step} className={`h-1.5 w-8 rounded-full transition-colors ${modalStep >= step ? 'bg-blue-600' : 'bg-slate-200'}`} />
                    ))}
                  </div>
                </div>
                <button onClick={() => setIsModalOpen(false)} className="p-1.5 bg-slate-50 hover:bg-slate-100 text-slate-500 rounded-md transition-colors"><X size={16} /></button>
              </div>
              
              {/* Body Modal */}
              <div className="p-6 min-h-[250px]">
                
                {/* STEP 1: DADOS BÁSICOS */}
                {modalStep === 1 && (
                  <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
                    <div className="flex items-center gap-2 mb-4 text-blue-600 font-bold uppercase tracking-widest text-[10px]">
                      <Users size={14} /> Passo 1: Informações Pessoais
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Nome Completo / Empresa *</label>
                      <Input value={form.nome} onChange={e => setForm({...form, nome: e.target.value})} className="h-10 text-xs font-semibold" autoFocus />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Email de Acesso *</label>
                      <Input type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} className="h-10 text-xs font-semibold" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">WhatsApp</label>
                      <Input value={form.telefone} onChange={e => setForm({...form, telefone: formatWhatsApp(e.target.value)})} placeholder="+55 85 99192-8470" className="h-10 text-xs font-semibold" />
                    </div>
                  </motion.div>
                )}

                {/* STEP 2: PLANO E VENCIMENTO */}
                {modalStep === 2 && (
                  <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
                    <div className="flex items-center gap-2 mb-4 text-purple-600 font-bold uppercase tracking-widest text-[10px]">
                      <Calendar size={14} /> Passo 2: Assinatura
                    </div>
                    
                    <div className="space-y-1.5">
                      <label className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Vencimento da Licença</label>
                      <SeletorData value={form.vencimento} onChange={val => setForm({...form, vencimento: val})} />
                    </div>

                    <div className="space-y-1.5 pt-2">
                      <label className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Status da Conta</label>
                      <div className="grid grid-cols-3 gap-2">
                        <button onClick={() => setForm({...form, status: 'Ativo'})} className={`py-2 rounded-md text-[10px] font-bold uppercase tracking-widest border transition-all ${form.status === 'Ativo' ? 'bg-emerald-50 text-emerald-600 border-emerald-200 shadow-sm' : 'bg-slate-50 text-slate-400 border-slate-100 hover:bg-slate-100'}`}>Ativo</button>
                        <button onClick={() => setForm({...form, status: 'Aviso'})} className={`py-2 rounded-md text-[10px] font-bold uppercase tracking-widest border transition-all ${form.status === 'Aviso' ? 'bg-amber-50 text-amber-600 border-amber-200 shadow-sm' : 'bg-slate-50 text-slate-400 border-slate-100 hover:bg-slate-100'}`}>Aviso</button>
                        <button onClick={() => setForm({...form, status: 'Bloqueado'})} className={`py-2 rounded-md text-[10px] font-bold uppercase tracking-widest border transition-all ${form.status === 'Bloqueado' ? 'bg-rose-50 text-rose-600 border-rose-200 shadow-sm' : 'bg-slate-50 text-slate-400 border-slate-100 hover:bg-slate-100'}`}>Bloqueio</button>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* STEP 3: INFRAESTRUTURA VERCEL */}
                {modalStep === 3 && (
                  <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
                    <div className="flex items-center gap-2 mb-4 text-emerald-600 font-bold uppercase tracking-widest text-[10px]">
                      <Server size={14} /> Passo 3: Hospedagem (Opcional)
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Domínio / URL Vercel</label>
                      <Input value={form.vercel_url} onChange={e => setForm({...form, vercel_url: e.target.value})} placeholder="ex: cliente.vercel.app" className="h-10 text-xs font-semibold" />
                    </div>
                    <div className="bg-slate-50 border border-slate-100 p-3 rounded-lg flex items-start gap-2">
                       <Globe size={14} className="text-slate-400 shrink-0 mt-0.5"/>
                       <p className="text-[9px] text-slate-500 leading-relaxed font-medium uppercase tracking-widest">
                         Esta URL serve apenas como atalho para você acessar o sistema do cliente rapidamente através da listagem.
                       </p>
                    </div>
                  </motion.div>
                )}

                {/* STEP 4: COFRE SUPABASE */}
                {modalStep === 4 && (
                  <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2 text-rose-600 font-bold uppercase tracking-widest text-[10px]">
                        <Database size={14} /> Passo 4: Cofre do Banco
                      </div>
                      <Lock size={12} className="text-slate-300" />
                    </div>
                    
                    <div className="space-y-1.5">
                      <label className="text-[9px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1">Project URL <span className="text-rose-500">*Criptografado</span></label>
                      <Input type="password" value={form.banco_url} onChange={e => setForm({...form, banco_url: e.target.value})} placeholder="https://xxxxxx.supabase.co" className="h-10 text-xs font-mono" />
                    </div>
                    
                    <div className="space-y-1.5">
                      <label className="text-[9px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1">Anon / API Key <span className="text-rose-500">*Criptografado</span></label>
                      <Input type="password" value={form.banco_key} onChange={e => setForm({...form, banco_key: e.target.value})} placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6..." className="h-10 text-xs font-mono" />
                    </div>

                    <div className="bg-rose-50/50 border border-rose-100 p-3 rounded-lg flex items-start gap-2 mt-4">
                       <ShieldCheck size={14} className="text-rose-400 shrink-0 mt-0.5"/>
                       <p className="text-[9px] text-rose-600 leading-relaxed font-medium">
                         As credenciais informadas aqui não poderão ser lidas nem mesmo pelos administradores do banco de dados principal. 
                         Elas são criptografadas localmente com <strong>AES-256</strong> antes do envio.
                       </p>
                    </div>
                  </motion.div>
                )}

              </div>

              {/* Footer Modal (Navegação) */}
              <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-between items-center rounded-b-xl">
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
                    Próximo <ChevronRight className=\"w-4 h-4 ml-1\" />
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