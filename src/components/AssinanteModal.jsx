import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from "framer-motion";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../lib/supabase";
import { ShieldCheck, X, Save, Loader2, Database, Globe, ChevronRight, ChevronLeft, UserPlus, LogIn, Server, Dices } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import SeletorData from "./SeletorData";

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

export default function AssinanteModal({ isOpen, onClose, assinanteEditando }) {
  const [localAssinante, setLocalAssinante] = useState(null);
  const [modalStep, setModalStep] = useState(1);
  const [isNewClientFormOpen, setIsNewClientFormOpen] = useState(false);
  const [newClientName, setNewClientName] = useState('');
  
  const queryClient = useQueryClient();

  useEffect(() => {
    if (assinanteEditando && isOpen) {
      setLocalAssinante(assinanteEditando);
      setModalStep(1);
      setIsNewClientFormOpen(false);
      setNewClientName('');
    }
  }, [assinanteEditando, isOpen]);

  const { data: clientes = [] } = useQuery({
    queryKey: ["criarte-clientes-lista"],
    queryFn: async () => {
      const { data, error } = await supabase.from("clientes").select("id, nome, whatsapp").order("nome", { ascending: true });
      if (error) throw error;
      return data;
    },
    enabled: isOpen,
  });

  const gerarSenhaCurta = () => {
    const prefixos = ['teste', 'loja', 'app', 'web', 'box', 'sys'];
    const prefixo = prefixos[Math.floor(Math.random() * prefixos.length)];
    const numero = Math.floor(Math.random() * 900) + 100;
    return `${prefixo}${numero}`;
  };

  const addClientMutation = useMutation({
    mutationFn: async (nome) => {
      const { data, error } = await supabase.from("clientes").insert([{ nome }]).select();
      if (error) throw error;
      return data[0];
    },
    onSuccess: (newClient) => {
      queryClient.invalidateQueries({ queryKey: ["criarte-clientes-lista"] });
      setLocalAssinante({
        ...localAssinante,
        cliente_id: newClient.id,
        nome_cliente: newClient.nome,
        tipo_conta: 'Teste'
      });
      setIsNewClientFormOpen(false);
      setNewClientName('');
    }
  });

  const saveMutation = useMutation({
    mutationFn: async (assinanteData) => {
      const dadosSeguros = {
        ...assinanteData,
        senha_supabase: encrypt(assinanteData.senha_supabase),
        senha_banco_dados: encrypt(assinanteData.senha_banco_dados),
        supabase_anon_key: encrypt(assinanteData.supabase_anon_key),
        supabase_service_role_key: encrypt(assinanteData.supabase_service_role_key),
        senha_painel: encrypt(assinanteData.senha_painel),
      };

      const payloadFinal = {};
      Object.keys(dadosSeguros).forEach(key => {
        payloadFinal[key] = dadosSeguros[key] === '' ? null : dadosSeguros[key];
      });

      if (payloadFinal.id && typeof payloadFinal.id === 'string' && payloadFinal.id.length > 10) {
        const { error } = await supabase.from("assinantes").update(payloadFinal).eq("id", payloadFinal.id);
        if (error) throw error;
      } else {
        const { id, ...novoAssinante } = payloadFinal; 
        const { error } = await supabase.from("assinantes").insert([novoAssinante]);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["criarte-assinantes"] });
      onClose();
    },
    onError: (error) => {
      console.error("Erro no Supabase:", error);
      alert("Erro ao salvar!");
    }
  });

  const handleSave = () => {
    saveMutation.mutate(localAssinante);
  };

  // Função para limpar dados e tornar disponível
  const setComoDisponivel = () => {
    setLocalAssinante({
      ...localAssinante, 
      tipo_conta: 'Disponivel', 
      nome_cliente: 'Disponível para Teste',
      cliente_id: null,
      data_inicio_teste: null,
      data_fim_teste: null,
      data_inicio_uso: null,
      data_fim_assinatura: null
    });
  };

  return (
    <AnimatePresence>
      {isOpen && localAssinante && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-3">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" />
          <motion.div className="bg-white w-full max-w-3xl rounded-xl shadow-2xl relative z-10 overflow-hidden flex flex-col max-h-[90vh]">
            
            <div className="p-3 border-b flex justify-between items-center bg-slate-50">
              <h2 className="text-sm font-semibold text-slate-800 uppercase tracking-tight flex items-center gap-2">
                 <ShieldCheck className="text-blue-600 w-4 h-4" /> Configuração de Instância
              </h2>
              <button onClick={onClose} className="p-1.5 hover:bg-slate-200 rounded-full transition-colors"><X className="w-4 h-4"/></button>
            </div>

            <div className="bg-white border-b px-4 py-3 flex justify-between relative">
              <div className="absolute left-8 right-8 top-1/2 h-[1px] bg-slate-100"></div>
              {[1, 2, 3, 4].map(s => (
                <div key={s} className={`relative z-10 w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-bold border transition-all ${modalStep >= s ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-400 border-slate-200'}`}>{s}</div>
              ))}
            </div>

            <div className="p-4 overflow-y-auto bg-slate-50/50">
              
              {modalStep === 1 && (
                <motion.div initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                     <div className="space-y-1 col-span-2 md:col-span-1">
                        <label className="text-[9px] font-bold uppercase tracking-widest text-slate-500">Tipo da Conta</label>
                        <div className="flex bg-white p-1 rounded-lg border gap-1">
                           <button onClick={setComoDisponivel} className={`flex-1 py-1.5 text-[8px] font-bold uppercase rounded-md transition-all ${(!localAssinante.data_fim_teste && !localAssinante.data_fim_assinatura) ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-400 hover:bg-slate-50'}`}>Estoque</button>
                           <button onClick={() => setLocalAssinante({...localAssinante, tipo_conta: 'Teste'})} className={`flex-1 py-1.5 text-[8px] font-bold uppercase rounded-md transition-all ${(localAssinante.data_fim_teste && !localAssinante.data_fim_assinatura) ? 'bg-amber-500 text-white shadow-sm' : 'text-slate-400 hover:bg-slate-50'}`}>Em Teste</button>
                           <button onClick={() => setLocalAssinante({...localAssinante, tipo_conta: 'Uso'})} className={`flex-1 py-1.5 text-[8px] font-bold uppercase rounded-md transition-all ${(localAssinante.data_fim_assinatura) ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-400 hover:bg-slate-50'}`}>Assinado</button>
                        </div>
                     </div>
                     <div className="space-y-1 col-span-2 md:col-span-1">
                        <label className="text-[9px] font-bold uppercase tracking-widest text-slate-500">Status Geral</label>
                        <select className="w-full h-9 border border-slate-200 rounded-md px-2 text-[10px] font-medium uppercase tracking-widest outline-none" value={localAssinante.status} onChange={e => setLocalAssinante({...localAssinante, status: e.target.value})}>
                           <option value="Ativo">Ativo (Rodando)</option>
                           <option value="Pausado">Pausado (Supabase)</option>
                           <option value="Cancelado">Cancelado</option>
                        </select>
                     </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 bg-white p-3 rounded-xl border border-slate-200">
                     <div className="space-y-1 col-span-2 md:col-span-1">
                        <div className="flex justify-between items-center mb-1">
                           <label className="text-[9px] font-bold uppercase tracking-widest text-slate-500">Cliente Dono</label>
                           <button onClick={() => setIsNewClientFormOpen(!isNewClientFormOpen)} className="text-[8px] font-bold text-blue-600 flex items-center gap-1 hover:underline"><UserPlus size={10}/> NOVO CLIENTE</button>
                        </div>
                        
                        {isNewClientFormOpen && (
                          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} className="flex gap-2 mb-2">
                             <Input placeholder="Nome Completo..." value={newClientName} onChange={e => setNewClientName(e.target.value)} className="h-9 text-[10px]" />
                             <Button onClick={() => addClientMutation.mutate(newClientName)} disabled={!newClientName} className="h-9 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[8px] uppercase rounded-md px-3">Salvar</Button>
                          </motion.div>
                        )}

                        <select className="w-full h-9 border border-slate-200 rounded-md px-2 text-[10px] font-medium outline-none" value={localAssinante.cliente_id || ''} onChange={e => {
                          const c = clientes.find(cl => cl.id === e.target.value);
                          setLocalAssinante({...localAssinante, cliente_id: e.target.value, nome_cliente: c ? c.nome : 'Disponível para Teste'});
                        }}>
                           <option value="">-- Estoque (Sem Cliente) --</option>
                           {clientes.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
                        </select>
                     </div>

                     <div className="space-y-1 col-span-2 md:col-span-1">
                        <label className="text-[9px] font-bold uppercase tracking-widest text-slate-500 mb-1 block">Data de Instalação (Criação)</label>
                        <SeletorData 
                           value={localAssinante.data_assinatura} 
                           onChange={val => setLocalAssinante({...localAssinante, data_assinatura: val})} 
                        />
                     </div>
                  </div>
                </motion.div>
              )}

              {modalStep === 2 && (
                 <motion.div initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} className="space-y-4">
                    <h3 className="text-[9px] font-bold uppercase tracking-widest text-slate-500 border-b pb-1">Hospedagem & Infra</h3>
                    <div className="grid grid-cols-2 gap-3">
                       <div className="space-y-1 col-span-2 md:col-span-1">
                          <label className="text-[9px] font-bold uppercase tracking-widest text-slate-400">Conta Vercel Principal</label>
                          <Input value={localAssinante.email_vercel_principal || ''} onChange={e => setLocalAssinante({...localAssinante, email_vercel_principal: e.target.value})} className="h-9 text-[10px]" />
                       </div>
                       <div className="space-y-1 col-span-2 md:col-span-1">
                          <label className="text-[9px] font-bold uppercase tracking-widest text-slate-400">Projeto (Vercel usuario)</label>
                          <Input value={localAssinante.projeto_vercel || ''} onChange={e => setLocalAssinante({...localAssinante, projeto_vercel: e.target.value})} className="h-9 text-[10px]" />
                       </div>
                       <div className="space-y-1 col-span-2 md:col-span-1">
                          <label className="text-[9px] font-bold uppercase tracking-widest text-slate-400">Supabase (+ID)</label>
                          <Input value={localAssinante.email_supabase || ''} onChange={e => setLocalAssinante({...localAssinante, email_supabase: e.target.value})} placeholder="+01@hotmail.com" className="h-9 text-[10px]" />
                       </div>
                       <div className="space-y-1 col-span-2 md:col-span-1">
                          <label className="text-[9px] font-bold uppercase tracking-widest text-slate-400">Senha Supabase</label>
                          <Input value={localAssinante.senha_supabase || ''} onChange={e => setLocalAssinante({...localAssinante, senha_supabase: e.target.value})} className="h-9 text-[10px]" />
                       </div>
                       <div className="space-y-1 col-span-2 md:col-span-1">
                          <label className="text-[9px] font-bold uppercase tracking-widest text-slate-400">Organization</label>
                          <Input value={localAssinante.supabase_organization || ''} onChange={e => setLocalAssinante({...localAssinante, supabase_organization: e.target.value})} className="h-9 text-[10px]" />
                       </div>
                       <div className="space-y-1 col-span-2 md:col-span-1">
                          <label className="text-[9px] font-bold uppercase tracking-widest text-slate-400">Project name</label>
                          <Input value={localAssinante.projeto_supabase || ''} onChange={e => setLocalAssinante({...localAssinante, projeto_supabase: e.target.value})} className="h-9 text-[10px]" />
                       </div>
                       <div className="space-y-1 col-span-2">
                          <label className="text-[9px] font-bold uppercase tracking-widest text-slate-400 flex items-center gap-1"><Server size={10}/> Database password</label>
                          <Input value={localAssinante.senha_banco_dados || ''} onChange={e => setLocalAssinante({...localAssinante, senha_banco_dados: e.target.value})} className="h-9 text-[10px]" />
                       </div>
                    </div>
                 </motion.div>
              )}

              {modalStep === 3 && (
                 <motion.div initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} className="space-y-3">
                    <div className="bg-blue-600 p-3 rounded-xl shadow-sm relative overflow-hidden mb-3">
                       <Database className="absolute -right-2 -bottom-2 text-white/10 w-16 h-16" />
                       <p className="text-[9px] font-bold uppercase tracking-widest text-blue-100 mb-0.5">Vercel Variables</p>
                       <h4 className="text-sm font-semibold text-white uppercase tracking-tight">Environment Config</h4>
                    </div>
                    <div className="grid grid-cols-1 gap-3">
                       <div className="space-y-1">
                          <label className="text-[9px] font-bold uppercase tracking-widest text-slate-500">VITE_SUPABASE_URL</label>
                          <Input value={localAssinante.supabase_url || ''} onChange={e => setLocalAssinante({...localAssinante, supabase_url: e.target.value})} className="h-9 font-mono text-[9px]" />
                       </div>
                       <div className="space-y-1">
                          <label className="text-[9px] font-bold uppercase tracking-widest text-slate-500">VITE_SUPABASE_ANON_KEY</label>
                          <Input value={localAssinante.supabase_anon_key || ''} onChange={e => setLocalAssinante({...localAssinante, supabase_anon_key: e.target.value})} className="h-9 font-mono text-[9px]" />
                       </div>
                       <div className="space-y-1">
                          <label className="text-[9px] font-bold uppercase tracking-widest text-slate-500">SUPABASE_SERVICE_ROLE_KEY</label>
                          <Input value={localAssinante.supabase_service_role_key || ''} onChange={e => setLocalAssinante({...localAssinante, supabase_service_role_key: e.target.value})} className="h-9 font-mono text-[9px]" />
                       </div>
                    </div>
                 </motion.div>
              )}

              {modalStep === 4 && (
                 <motion.div initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} className="space-y-4">
                    
                    <div className="grid grid-cols-2 gap-3">
                       <div className="bg-white p-3 rounded-xl border border-slate-200 space-y-3">
                          <p className="text-[9px] font-bold uppercase tracking-widest text-amber-500 border-b border-slate-100 pb-1">Período de Teste</p>
                          <div className="space-y-1 relative z-50">
                             <label className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mb-1 block">Início do Teste</label>
                             <SeletorData 
                               value={localAssinante.data_inicio_teste} 
                               onChange={val => setLocalAssinante({...localAssinante, data_inicio_teste: val, tipo_conta: 'Teste'})} 
                             />
                          </div>
                          <div className="space-y-1 relative z-40">
                             <label className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mb-1 block">Fim (Bloqueio)</label>
                             <SeletorData 
                               value={localAssinante.data_fim_teste} 
                               onChange={val => setLocalAssinante({...localAssinante, data_fim_teste: val, tipo_conta: 'Teste'})} 
                             />
                          </div>
                       </div>
                       <div className="bg-white p-3 rounded-xl border border-slate-200 space-y-3">
                          <p className="text-[9px] font-bold uppercase tracking-widest text-emerald-600 border-b border-slate-100 pb-1">Assinatura Real</p>
                          <div className="space-y-1 relative z-30">
                             <label className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mb-1 block">Início Pago</label>
                             <SeletorData 
                               value={localAssinante.data_inicio_uso} 
                               onChange={val => setLocalAssinante({...localAssinante, data_inicio_uso: val, tipo_conta: 'Uso'})} 
                             />
                          </div>
                          <div className="space-y-1 relative z-20">
                             <label className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mb-1 block">Vencimento Final</label>
                             <SeletorData 
                               value={localAssinante.data_fim_assinatura} 
                               onChange={val => setLocalAssinante({...localAssinante, data_fim_assinatura: val, tipo_conta: 'Uso'})} 
                             />
                          </div>
                       </div>
                    </div>

                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-2 relative z-10">
                       <p className="text-[9px] font-bold uppercase tracking-widest text-slate-600 flex items-center gap-1"><LogIn size={10}/> Credenciais do Cliente (App)</p>
                       <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <label className="text-[8px] font-bold text-slate-500 uppercase">Usuário / E-mail</label>
                            <Input placeholder="admin@loja.com" value={localAssinante.usuario_painel || ''} onChange={e => setLocalAssinante({...localAssinante, usuario_painel: e.target.value})} className="h-8 text-[10px] bg-white border-slate-200" />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[8px] font-bold text-slate-500 uppercase flex justify-between items-center">
                               Senha
                               <button type="button" onClick={() => setLocalAssinante({...localAssinante, senha_painel: gerarSenhaCurta()})} className="text-[8px] font-bold text-blue-600 hover:text-blue-800 flex items-center gap-0.5 uppercase tracking-widest"><Dices size={10}/> GERAR</button>
                            </label>
                            <Input placeholder="Senha123" value={localAssinante.senha_painel || ''} onChange={e => setLocalAssinante({...localAssinante, senha_painel: e.target.value})} className="h-8 text-[10px] bg-white border-slate-200" />
                          </div>
                       </div>
                    </div>
                    
                    <div className="bg-purple-50 p-3 rounded-xl border border-purple-100 space-y-2 relative z-0">
                       <p className="text-[9px] font-bold uppercase tracking-widest text-purple-600 flex items-center gap-1"><Globe size={10}/> Links de Publicação</p>
                       <Input placeholder="Domínio Próprio (ex: suamarca.com.br)" value={localAssinante.dominio || ''} onChange={e => setLocalAssinante({...localAssinante, dominio: e.target.value})} className="h-8 text-[10px] bg-white border-purple-200" />
                       <Input placeholder="Link da Bio (ex: linktr.ee/loja)" value={localAssinante.link_bio || ''} onChange={e => setLocalAssinante({...localAssinante, link_bio: e.target.value})} className="h-8 text-[10px] bg-white border-purple-200" />
                       <div className="grid grid-cols-2 gap-3">
                          <Input placeholder="URL Admin Vercel" value={localAssinante.link_sistema || ''} onChange={e => setLocalAssinante({...localAssinante, link_sistema: e.target.value})} className="h-8 text-[10px] bg-white border-purple-200" />
                          <Input placeholder="URL Catálogo Público" value={localAssinante.link_catalogo || ''} onChange={e => setLocalAssinante({...localAssinante, link_catalogo: e.target.value})} className="h-8 text-[10px] bg-white border-purple-200" />
                       </div>
                    </div>
                 </motion.div>
              )}
            </div>

            <div className="p-3 bg-white border-t flex justify-between relative z-[100]">
               <Button variant="outline" onClick={() => setModalStep(s => s - 1)} disabled={modalStep === 1} className="font-bold text-[9px] uppercase tracking-widest h-8 px-6 rounded-full"><ChevronLeft className="w-3 h-3 mr-1"/> Voltar</Button>
               {modalStep < 4 ? (
                 <Button onClick={() => setModalStep(s => s + 1)} className="bg-blue-600 hover:bg-blue-700 font-bold text-[9px] uppercase tracking-widest h-8 px-6 rounded-full text-white">Próximo <ChevronRight className="w-3 h-3 ml-1"/></Button>
               ) : (
                 <Button onClick={handleSave} disabled={saveMutation.isPending} className="bg-emerald-600 hover:bg-emerald-700 font-bold text-[9px] uppercase tracking-widest h-8 px-6 rounded-full text-white">
                   {saveMutation.isPending ? <Loader2 className="w-3 h-3 animate-spin"/> : <><Save className="w-3 h-3 mr-1"/> Salvar</>}
                 </Button>
               )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}