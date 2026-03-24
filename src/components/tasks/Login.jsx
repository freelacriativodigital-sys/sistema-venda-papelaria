import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Lock, ShieldAlert } from "lucide-react";
import { motion } from "framer-motion";

export default function Login({ onLogin }) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState(false);

  // A senha "794613Er" disfarçada em Base64
  const HASH_ACESSO = "Nzk0NjEzRXI=";

  const handleSubmit = (e) => {
    e.preventDefault();
    if (btoa(password) === HASH_ACESSO) {
      // Nova chave genérica de autenticação
      localStorage.setItem("sistema_auth", "true");
      onLogin();
    } else {
      setError(true);
      setTimeout(() => setError(false), 2000);
    }
  };

  return (
    <div className="min-h-screen bg-[#0f172a] flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-blue-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-xl shadow-blue-500/20">
            <Lock className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-black text-white uppercase tracking-tighter">Área Restrita</h1>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em] mt-2">Painel Administrativo</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            type="password"
            placeholder="SENHA DE ACESSO"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="h-14 bg-slate-900 border-slate-800 text-white text-center tracking-[0.5em] focus:ring-blue-500/50"
          />
          
          {error && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center justify-center gap-2 text-red-400">
              <ShieldAlert className="w-4 h-4" />
              <span className="text-[10px] font-bold uppercase">Acesso Negado</span>
            </motion.div>
          )}

          <Button type="submit" className="w-full h-14 bg-blue-600 hover:bg-blue-500 text-white font-black uppercase tracking-widest transition-all active:scale-95">
            Entrar no Painel
          </Button>
        </form>
      </div>
    </div>
  );
}