import React, { useState, useEffect } from 'react';
import { ShieldCheck, Lock, User, Save, Eye, EyeOff, Loader2, KeyRound, ArrowRight, ShieldAlert, Plus, Trash2, Users } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { motion, AnimatePresence } from 'framer-motion';

export default function Seguranca() {
  const [usuarios, setUsuarios] = useState([]);
  const [senhaAtualDB, setSenhaAtualDB] = useState('');
  
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [senhaTentativa, setSenhaTentativa] = useState('');
  const [erroDestrava, setErroDestrava] = useState('');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [novoUsuario, setNovoUsuario] = useState('');
  const [novaSenha, setNovaSenha] = useState('');
  const [novoPerfil, setNovoPerfil] = useState('padrao');
  const [showPassword, setShowPassword] = useState(false);
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchUsuarios();
  }, []);

  async function fetchUsuarios() {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.from('usuarios_painel').select('*').order('id', { ascending: true });
      if (data) {
        setUsuarios(data);
        // Pega a senha do admin atual para a trava (assumindo que o admin principal é o primeiro)
        const adminPrincipal = data.find(u => u.perfil === 'admin');
        if (adminPrincipal) setSenhaAtualDB(adminPrincipal.senha);
      }
    } catch (err) {
      console.error("Erro", err);
    } finally {
      setIsLoading(false);
    }
  }

  const handleDestravar = (e) => {
    e.preventDefault();
    if (senhaTentativa === senhaAtualDB) {
      setIsUnlocked(true);
      setErroDestrava('');
    } else {
      setErroDestrava('Senha atual incorreta. Acesso negado.');
      setSenhaTentativa('');
    }
  };

  const handleOpenModal = (user = null) => {
    if (user) {
      setEditingUser(user);
      setNovoUsuario(user.usuario);
      setNovaSenha(user.senha);
      setNovoPerfil(user.perfil || 'padrao');
    } else {
      setEditingUser(null);
      setNovoUsuario('');
      setNovaSenha('');
      setNovoPerfil('padrao');
    }
    setShowPassword(false);
    setIsModalOpen(true);
  };

  const handleSalvar = async (e) => {
    e.preventDefault();
    if (!novoUsuario || !novaSenha) return alert("Preencha usuário e senha.");
    setIsSaving(true);

    try {
      if (editingUser) {
        await supabase.from('usuarios_painel').update({ usuario: novoUsuario, senha: novaSenha, perfil: novoPerfil }).eq('id', editingUser.id);
      } else {
        await supabase.from('usuarios_painel').insert([{ usuario: novoUsuario, senha: novaSenha, perfil: novoPerfil }]);
      }
      setIsModalOpen(false);
      fetchUsuarios();
    } catch (err) {
      alert('Erro ao salvar utilizador.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id, perfil) => {
    if (perfil === 'admin' && usuarios.filter(u => u.perfil === 'admin').length === 1) {
      return alert("Não pode excluir o único Administrador do sistema.");
    }
    if (window.confirm("Deseja realmente remover este acesso?")) {
      await supabase.from('usuarios_painel').delete().eq('id', id);
      fetchUsuarios();
    }
  };

  if (isLoading && !isUnlocked) return <div className="min-h-[60vh] flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-blue-600" /></div>;

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      <div className="max-w-4xl mx-auto space-y-6 md:space-y-8 px-4 sm:px-6 pt-6 md:pt-8">
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl md:text-2xl font-bold md:font-semibold uppercase text-slate-800 tracking-tight flex items-center gap-2">
              <ShieldCheck className="text-blue-600 w-6 h-6 md:w-7 md:h-7" /> Gestão de Acessos
            </h1>
            <p className="text-[10px] md:text-[11px] font-medium text-slate-500 uppercase tracking-widest mt-1">
              Controle quem pode aceder ao seu painel
            </p>
          </div>
          {isUnlocked && (
            <button onClick={() => handleOpenModal()} className="h-11 bg-blue-600 hover:bg-blue-700 text-white px-5 rounded-md font-bold uppercase text-[10px] md:text-xs flex items-center gap-2 shadow-sm transition-all">
              <Plus size={16} /> Novo Utilizador
            </button>
          )}
        </div>

        <AnimatePresence mode="wait">
          {!isUnlocked ? (
            <motion.div key="lock-screen" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95, y: -20 }} className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden max-w-md mx-auto mt-10">
              <div className="bg-slate-800 p-6 flex justify-center"><div className="w-16 h-16 bg-slate-700 rounded-full flex items-center justify-center border-4 border-slate-600 shadow-inner"><Lock className="text-blue-400 w-8 h-8" /></div></div>
              <div className="p-6 md:p-8 text-center">
                <h2 className="text-lg font-bold text-slate-800 uppercase tracking-tight mb-2">Área Restrita</h2>
                <p className="text-xs text-slate-500 font-medium mb-6">Confirme a senha de Administrador para gerir acessos.</p>
                <form onSubmit={handleDestravar} className="space-y-4 text-left">
                  <div className="relative">
                    <Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input type="password" value={senhaTentativa} onChange={(e) => setSenhaTentativa(e.target.value)} placeholder="Senha atual..." className="w-full h-12 pl-10 pr-4 bg-slate-50 border border-slate-200 rounded-md text-sm font-bold text-slate-800 outline-none focus:border-blue-500 focus:bg-white transition-all shadow-sm text-center tracking-widest" required autoFocus />
                  </div>
                  {erroDestrava && <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-[10px] font-bold text-red-500 uppercase tracking-widest text-center flex items-center justify-center gap-1"><ShieldAlert size={14} /> {erroDestrava}</motion.p>}
                  <button type="submit" className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-bold uppercase text-[11px] tracking-widest transition-all flex items-center justify-center gap-2 shadow-sm">Desbloquear Cofre <ArrowRight size={16}/></button>
                </form>
              </div>
            </motion.div>
          ) : (
            <motion.div key="unlocked-screen" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white border border-emerald-200 rounded-xl shadow-md overflow-hidden">
              <div className="bg-emerald-600 p-5 text-white flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-bold uppercase tracking-widest flex items-center gap-2"><Users size={18} className="text-emerald-200" /> Equipa e Acessos</h2>
                  <p className="text-[10px] text-emerald-100 font-medium mt-1">Utilizadores autorizados a usar o painel da loja.</p>
                </div>
              </div>

              <div className="p-0">
                {usuarios.map(u => (
                  <div key={u.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-5 border-b border-slate-100 hover:bg-slate-50 transition-colors gap-4">
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center border-2 ${u.perfil === 'admin' ? 'bg-amber-50 border-amber-200 text-amber-500' : 'bg-slate-100 border-slate-200 text-slate-500'}`}>
                        {u.perfil === 'admin' ? <ShieldCheck size={20} /> : <User size={20} />}
                      </div>
                      <div>
                        <p className="font-bold text-slate-800 text-sm">{u.usuario}</p>
                        <p className={`text-[10px] font-bold uppercase tracking-widest mt-0.5 ${u.perfil === 'admin' ? 'text-amber-600' : 'text-slate-500'}`}>
                          {u.perfil === 'admin' ? 'Acesso Total (Admin)' : 'Funcionário (Padrão)'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 w-full sm:w-auto">
                      <button onClick={() => handleOpenModal(u)} className="flex-1 sm:flex-none px-4 h-9 bg-white border border-slate-200 text-slate-600 rounded-md text-[10px] font-bold uppercase hover:bg-slate-50 transition-colors">Editar</button>
                      <button onClick={() => handleDelete(u.id, u.perfil)} className="flex-1 sm:flex-none px-4 h-9 bg-red-50 border border-red-100 text-red-500 rounded-md text-[10px] font-bold uppercase hover:bg-red-500 hover:text-white transition-colors"><Trash2 size={14} className="mx-auto" /></button>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {isModalOpen && (
            <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsModalOpen(false)} className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" />
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="relative w-full max-w-md bg-white rounded-xl shadow-2xl overflow-hidden">
                <div className="p-6 border-b border-slate-100">
                  <h3 className="font-bold text-slate-800 uppercase tracking-tight">{editingUser ? 'Editar Utilizador' : 'Novo Utilizador'}</h3>
                  <p className="text-[10px] text-slate-500 font-medium uppercase mt-1">Configure as credenciais e permissões</p>
                </div>
                <form onSubmit={handleSalvar} className="p-6 space-y-5">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 ml-1">Perfil de Acesso</label>
                    <select value={novoPerfil} onChange={(e) => setNovoPerfil(e.target.value)} className="w-full h-11 bg-slate-50 border border-slate-200 rounded-md px-3 text-xs font-bold text-slate-700 uppercase outline-none focus:border-blue-500">
                      <option value="admin">Administrador (Acesso Total)</option>
                      <option value="padrao">Padrão (Sem Financeiro / Segurança)</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 ml-1">Usuário</label>
                    <input type="text" value={novoUsuario} onChange={(e) => setNovoUsuario(e.target.value)} className="w-full h-11 px-3 bg-slate-50 border border-slate-200 rounded-md text-sm font-bold text-slate-800 outline-none focus:border-blue-500 focus:bg-white" required />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 ml-1">Senha</label>
                    <div className="relative">
                      <input type={showPassword ? "text" : "password"} value={novaSenha} onChange={(e) => setNovaSenha(e.target.value)} className="w-full h-11 pl-3 pr-10 bg-slate-50 border border-slate-200 rounded-md text-sm font-bold text-slate-800 outline-none focus:border-blue-500 focus:bg-white" required />
                      <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-blue-600"><Eye size={16}/></button>
                    </div>
                  </div>
                  <div className="pt-4 flex gap-3">
                    <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 h-11 border border-slate-200 text-slate-600 font-bold uppercase text-[10px] rounded-md hover:bg-slate-50">Cancelar</button>
                    <button type="submit" disabled={isSaving} className="flex-1 h-11 bg-blue-600 text-white font-bold uppercase text-[10px] rounded-md hover:bg-blue-700 flex items-center justify-center gap-2">
                      {isSaving ? <Loader2 size={16} className="animate-spin"/> : <><Save size={16}/> Salvar Acesso</>}
                    </button>
                  </div>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}