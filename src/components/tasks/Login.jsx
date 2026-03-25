import React, { useState } from 'react';
import { Lock, User, Loader2, ShieldCheck, ArrowRight } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { motion } from 'framer-motion';

export default function Login({ onLogin }) {
  const [usuario, setUsuario] = useState('');
  const [senha, setSenha] = useState('');
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErro('');

    try {
      const { data, error } = await supabase
        .from('usuarios_painel')
        .select('*')
        .eq('usuario', usuario)
        .eq('senha', senha)
        .single();

      if (error || !data) {
        setErro('Usuário ou senha incorretos.');
      } else {
        // --- MÁGICA DO CRONÔMETRO DE SESSÃO AQUI ---
        localStorage.setItem('sistema_auth', 'true');
        localStorage.setItem('sistema_auth_time', Date.now().toString()); // Grava o milissegundo exato do login
        onLogin();
      }
    } catch (err) {
      setErro('Erro de conexão. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-blue-500/10 rounded-full blur-3xl"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl"></div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }} 
        animate={{ opacity: 1, y: 0 }} 
        className="bg-white w-full max-w-sm rounded-2xl shadow-xl border border-slate-100 p-8 relative z-10"
      >
        <div className="flex flex-col items-center mb-8 text-center">
          <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center mb-4 shadow-sm border border-blue-100">
            <ShieldCheck size={28} />
          </div>
          <h1 className="text-xl font-bold text-slate-800 uppercase tracking-tight">Acesso ao Sistema</h1>
          <p className="text-[10px] font-medium text-slate-500 uppercase tracking-widest mt-1">Gestão de Pedidos e Catálogo</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 ml-1">Usuário</label>
            <div className="relative">
              <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input 
                type="text" 
                value={usuario}
                onChange={(e) => setUsuario(e.target.value)}
                placeholder="Digite seu usuário..."
                className="w-full h-11 pl-10 pr-4 bg-slate-50 border border-slate-200 rounded-md text-sm font-medium text-slate-800 outline-none focus:border-blue-400 focus:bg-white transition-all"
                required
                autoFocus
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 ml-1">Senha</label>
            <div className="relative">
              <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input 
                type="password" 
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                placeholder="••••••••"
                className="w-full h-11 pl-10 pr-4 bg-slate-50 border border-slate-200 rounded-md text-sm font-medium text-slate-800 outline-none focus:border-blue-400 focus:bg-white transition-all"
                required
              />
            </div>
          </div>

          {erro && (
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-[11px] font-semibold text-red-500 text-center bg-red-50 p-2 rounded-md border border-red-100">
              {erro}
            </motion.p>
          )}

          <button 
            type="submit" 
            disabled={loading}
            className="w-full h-11 mt-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-400 text-white rounded-md font-bold uppercase text-[11px] tracking-widest transition-all flex items-center justify-center gap-2 shadow-sm"
          >
            {loading ? <Loader2 size={16} className="animate-spin" /> : <>Entrar no Painel <ArrowRight size={14}/></>}
          </button>
        </form>

      </motion.div>
    </div>
  );
}