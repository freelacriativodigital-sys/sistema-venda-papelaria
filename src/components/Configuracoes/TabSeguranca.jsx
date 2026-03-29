import React, { useState } from 'react';
import { ShieldCheck, Mail, Key, Loader2, AlertCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { supabase } from "../../lib/supabase";

export default function TabSeguranca() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const handleUpdate = async () => {
    if (!email && !password) {
      setErrorMsg('Preencha pelo menos o e-mail ou a senha para atualizar.');
      return;
    }

    setLoading(true);
    setErrorMsg('');
    setMessage('');

    try {
      const updates = {};
      if (email) updates.email = email;
      if (password) updates.password = password;

      // Chama a função nativa de segurança do Supabase
      const { error } = await supabase.auth.updateUser(updates);

      if (error) throw error;

      setMessage('Dados de acesso atualizados com sucesso! (Se alterou o e-mail, verifique sua caixa de entrada para confirmar).');
      setEmail('');
      setPassword('');
    } catch (err) {
      setErrorMsg(err.message || 'Erro ao atualizar dados de segurança.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-10 animate-in fade-in duration-500">
      <section>
        <div className="flex items-center gap-2 mb-4">
          <ShieldCheck size={18} className="text-slate-400" />
          <h2 className="text-lg font-bold text-slate-800">Segurança da Conta</h2>
        </div>
        
        <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 flex flex-col gap-6">
          <p className="text-[11px] text-slate-500 font-medium">
            Atualize o e-mail e a senha que você usa para fazer login neste painel administrativo. 
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* NOVO E-MAIL */}
            <div className="flex flex-col gap-2">
              <label className="text-[11px] font-bold text-slate-600 uppercase flex items-center gap-1.5">
                <Mail size={14} /> Novo E-mail de Acesso
              </label>
              <Input 
                type="email"
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
                placeholder="Digite o novo e-mail" 
                className="h-12 bg-white border-slate-200 text-slate-800 text-sm rounded-xl" 
              />
            </div>

            {/* NOVA SENHA */}
            <div className="flex flex-col gap-2">
              <label className="text-[11px] font-bold text-slate-600 uppercase flex items-center gap-1.5">
                <Key size={14} /> Nova Senha
              </label>
              <Input 
                type="password"
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
                placeholder="Digite a nova senha (mín. 6 caracteres)" 
                className="h-12 bg-white border-slate-200 text-slate-800 text-sm rounded-xl" 
              />
            </div>
          </div>

          {/* MENSAGENS DE ERRO OU SUCESSO */}
          {errorMsg && (
            <div className="p-3 bg-red-50 border border-red-100 rounded-xl flex items-center gap-2 text-red-600 text-[11px] font-bold">
              <AlertCircle size={14} /> {errorMsg}
            </div>
          )}

          {message && (
            <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-xl flex items-center gap-2 text-emerald-600 text-[11px] font-bold">
              <ShieldCheck size={14} /> {message}
            </div>
          )}

          {/* BOTÃO SALVAR SEGURANÇA */}
          <div className="pt-2">
            <Button 
              onClick={handleUpdate} 
              disabled={loading}
              className="h-10 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-bold uppercase tracking-widest text-[11px] px-6 shadow-sm transition-all"
            >
              {loading ? <Loader2 size={16} className="animate-spin mr-2" /> : null}
              {loading ? "Atualizando..." : "Atualizar Credenciais"}
            </Button>
          </div>

        </div>
      </section>
    </div>
  );
}