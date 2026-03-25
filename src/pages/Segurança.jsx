import React, { useState, useEffect } from 'react';
import { ShieldCheck, Lock, User, Save, Eye, EyeOff, Loader2, KeyRound, ArrowRight, ShieldAlert } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { motion, AnimatePresence } from 'framer-motion';

export default function Seguranca() {
  // Dados do Banco
  const [idUsuario, setIdUsuario] = useState(null);
  const [usuarioAtual, setUsuarioAtual] = useState('');
  const [senhaAtualDB, setSenhaAtualDB] = useState('');
  
  // Estados de Controle da Trava
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [senhaTentativa, setSenhaTentativa] = useState('');
  const [erroDestrava, setErroDestrava] = useState('');

  // Estados do Formulário Novo
  const [novoUsuario, setNovoUsuario] = useState('');
  const [novaSenha, setNovaSenha] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  // Estados de Loading e Mensagens
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [mensagem, setMensagem] = useState({ tipo: '', texto: '' });

  // 1. Busca os dados reais no banco ao carregar a página
  useEffect(() => {
    async function fetchCredenciais() {
      try {
        const { data, error } = await supabase
          .from('usuarios_painel')
          .select('*')
          .limit(1)
          .single();

        if (data) {
          setIdUsuario(data.id);
          setUsuarioAtual(data.usuario);
          setSenhaAtualDB(data.senha);
          
          // Preenche os inputs com o atual para facilitar a edição
          setNovoUsuario(data.usuario);
          setNovaSenha(data.senha);
        }
      } catch (err) {
        console.error("Erro ao buscar credenciais", err);
      } finally {
        setIsLoading(false);
      }
    }
    fetchCredenciais();
  }, []);

  // 2. Função para tentar abrir o cadeado
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

  // 3. Função para salvar os novos dados
  const handleSalvar = async (e) => {
    e.preventDefault();
    if (!novoUsuario || !novaSenha) {
      setMensagem({ tipo: 'erro', texto: 'Preencha usuário e senha.' });
      return;
    }

    setIsSaving(true);
    setMensagem({ tipo: '', texto: '' });

    try {
      const { error } = await supabase
        .from('usuarios_painel')
        .update({ usuario: novoUsuario, senha: novaSenha })
        .eq('id', idUsuario);

      if (error) throw error;

      setMensagem({ tipo: 'sucesso', texto: 'Credenciais atualizadas com sucesso!' });
      setSenhaAtualDB(novaSenha); // Atualiza a senha na memória para não bloquear o usuário se ele salvar de novo
      
      setTimeout(() => setMensagem({ tipo: '', texto: '' }), 3000);
      
    } catch (err) {
      setMensagem({ tipo: 'erro', texto: 'Erro ao atualizar credenciais.' });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      <div className="max-w-3xl mx-auto space-y-6 md:space-y-8 px-4 sm:px-6 pt-6 md:pt-8">
        
        {/* TOPO: TÍTULO */}
        <div>
          <h1 className="text-xl md:text-2xl font-bold md:font-semibold uppercase text-slate-800 tracking-tight flex items-center gap-2">
            <ShieldCheck className="text-blue-600 w-6 h-6 md:w-7 md:h-7" /> 
            Segurança e Acesso
          </h1>
          <p className="text-[10px] md:text-[11px] font-medium text-slate-500 uppercase tracking-widest mt-1">
            Proteção e alteração de credenciais
          </p>
        </div>

        <AnimatePresence mode="wait">
          {!isUnlocked ? (
            /* --- TELA DE BLOQUEIO (O CADEADO) --- */
            <motion.div 
              key="lock-screen"
              initial={{ opacity: 0, scale: 0.95 }} 
              animate={{ opacity: 1, scale: 1 }} 
              exit={{ opacity: 0, scale: 0.95, y: -20 }}
              className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden max-w-md mx-auto mt-10"
            >
              <div className="bg-slate-800 p-6 flex justify-center">
                <div className="w-16 h-16 bg-slate-700 rounded-full flex items-center justify-center border-4 border-slate-600 shadow-inner">
                  <Lock className="text-blue-400 w-8 h-8" />
                </div>
              </div>
              <div className="p-6 md:p-8 text-center">
                <h2 className="text-lg font-bold text-slate-800 uppercase tracking-tight mb-2">Área Protegida</h2>
                <p className="text-xs text-slate-500 font-medium mb-6">
                  Para visualizar ou alterar suas credenciais de acesso, confirme sua senha atual.
                </p>
                
                <form onSubmit={handleDestravar} className="space-y-4 text-left">
                  <div className="relative">
                    <Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input 
                      type="password" 
                      value={senhaTentativa}
                      onChange={(e) => setSenhaTentativa(e.target.value)}
                      placeholder="Sua senha atual..."
                      className="w-full h-12 pl-10 pr-4 bg-slate-50 border border-slate-200 rounded-md text-sm font-bold text-slate-800 outline-none focus:border-blue-500 focus:bg-white transition-all shadow-sm text-center tracking-widest"
                      required
                      autoFocus
                    />
                  </div>
                  
                  {erroDestrava && (
                    <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-[10px] font-bold text-red-500 uppercase tracking-widest text-center flex items-center justify-center gap-1">
                      <ShieldAlert size={14} /> {erroDestrava}
                    </motion.p>
                  )}

                  <button 
                    type="submit" 
                    className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-bold uppercase text-[11px] tracking-widest transition-all flex items-center justify-center gap-2 shadow-sm"
                  >
                    Desbloquear Cofre <ArrowRight size={16}/>
                  </button>
                </form>
              </div>
            </motion.div>
          ) : (
            /* --- TELA DO COFRE ABERTO (FORMULÁRIO DE TROCA) --- */
            <motion.div 
              key="unlocked-screen"
              initial={{ opacity: 0, y: 20 }} 
              animate={{ opacity: 1, y: 0 }} 
              className="bg-white border border-emerald-200 rounded-xl shadow-md overflow-hidden"
            >
              <div className="bg-emerald-600 p-5 md:p-6 text-white flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-bold uppercase tracking-widest flex items-center gap-2">
                    <KeyRound size={18} className="text-emerald-200" />
                    Cofre Aberto
                  </h2>
                  <p className="text-[10px] text-emerald-100 font-medium mt-1">Altere os dados de acesso do seu painel administrativo.</p>
                </div>
              </div>

              <form onSubmit={handleSalvar} className="p-5 md:p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* CAMPO USUÁRIO */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 ml-1">Usuário de Acesso</label>
                    <div className="relative">
                      <User size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input 
                        type="text" 
                        value={novoUsuario}
                        onChange={(e) => setNovoUsuario(e.target.value)}
                        placeholder="Ex: admin"
                        className="w-full h-12 pl-10 pr-4 bg-slate-50 border border-slate-200 rounded-md text-sm font-bold text-slate-800 outline-none focus:border-emerald-500 focus:bg-white transition-all shadow-sm"
                        required
                      />
                    </div>
                  </div>

                  {/* CAMPO NOVA SENHA */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 ml-1">Senha de Acesso</label>
                    <div className="relative">
                      <Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input 
                        type={showPassword ? "text" : "password"} 
                        value={novaSenha}
                        onChange={(e) => setNovaSenha(e.target.value)}
                        placeholder="Sua senha secreta"
                        className="w-full h-12 pl-10 pr-12 bg-slate-50 border border-slate-200 rounded-md text-sm font-bold text-slate-800 outline-none focus:border-emerald-500 focus:bg-white transition-all shadow-sm"
                        required
                      />
                      <button 
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-emerald-600 transition-colors p-1"
                      >
                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>
                </div>

                {/* ÁREA DE MENSAGENS E BOTÃO DE SALVAR */}
                <div className="pt-4 border-t border-slate-100 flex flex-col md:flex-row items-center justify-between gap-4">
                  <div className="w-full md:w-auto">
                    {mensagem.texto && (
                      <motion.div 
                        initial={{ opacity: 0, x: -10 }} 
                        animate={{ opacity: 1, x: 0 }} 
                        className={`text-[11px] font-bold uppercase tracking-widest px-4 py-2 rounded-md border ${
                          mensagem.tipo === 'erro' ? 'bg-red-50 text-red-600 border-red-100' : 'bg-emerald-50 text-emerald-600 border-emerald-100'
                        }`}
                      >
                        {mensagem.texto}
                      </motion.div>
                    )}
                  </div>
                  
                  <button 
                    type="submit" 
                    disabled={isSaving}
                    className="w-full md:w-auto h-11 px-8 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-400 text-white rounded-md font-bold uppercase text-[11px] tracking-widest transition-all shadow-sm flex items-center justify-center gap-2"
                  >
                    {isSaving ? <Loader2 size={16} className="animate-spin" /> : <><Save size={16}/> Salvar Segurança</>}
                  </button>
                </div>
              </form>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}