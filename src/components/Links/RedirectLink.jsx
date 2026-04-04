import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase'; // <-- CORREÇÃO DO CAMINHO AQUI
import { Loader2 } from "lucide-react";

export default function RedirectLink() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [erro, setErro] = useState(false);

  useEffect(() => {
    async function buscarERedirecionar() {
      try {
        // 1. Busca o link curto no banco de dados
        const { data, error } = await supabase
          .from('encurtador')
          .select('*')
          .eq('slug', slug)
          .single();

        // Se não achar o link, mostra o erro 404
        if (error || !data) {
          setErro(true);
          return;
        }

        // 2. Contabiliza o acesso (soma +1 no contador de cliques)
        await supabase
          .from('encurtador')
          .update({ cliques: (data.cliques || 0) + 1 })
          .eq('id', data.id);

        // 3. Verifica para onde mandar o cliente
        if (data.url_destino.includes(window.location.origin)) {
          // Se for pro seu próprio portal, usa o React Router (piscou, carregou)
          const pathInterno = data.url_destino.replace(window.location.origin, "");
          navigate(pathInterno, { replace: true });
        } else {
          // Se for link externo (Drive, Instagram), redireciona o navegador
          window.location.href = data.url_destino;
        }
      } catch (err) {
        console.error("Erro no redirecionamento:", err);
        setErro(true);
      }
    }

    buscarERedirecionar();
  }, [slug, navigate]);

  if (erro) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="text-center p-8 bg-white rounded-2xl border border-slate-200 shadow-sm max-w-sm w-full mx-4">
        <h1 className="text-5xl font-black text-slate-200 mb-3">404</h1>
        <p className="text-xs font-bold text-slate-600 uppercase tracking-widest mb-1">Ops! Link não encontrado.</p>
        <p className="text-[10px] font-medium text-slate-400 uppercase tracking-widest mb-6">Este link pode ter expirado ou sido digitado incorretamente.</p>
        <button onClick={() => navigate('/')} className="h-10 px-6 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold uppercase text-[10px] tracking-widest transition-colors w-full shadow-sm">
          Voltar ao Início
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#f8fafc]">
      <Loader2 className="animate-spin text-blue-600 mb-4" size={36} />
      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] animate-pulse">Preparando seu acesso...</p>
    </div>
  );
}