import React, { useState, useEffect } from 'react';
import { Building2, MessageSquare, Wallet, ShieldCheck, Loader2, Save, Check, Megaphone, Settings2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "../lib/supabase";

// Importações dos componentes das abas
import TabEmpresa from '../components/Configuracoes/TabEmpresa';
import TabAtendimento from '../components/Configuracoes/TabAtendimento';
import TabOperacao from '../components/Configuracoes/TabOperacao';
import TabSeguranca from '../components/Configuracoes/TabSeguranca';
import TabMarketing from '../components/Configuracoes/TabMarketing';

export default function Configuracoes() {
  const [activeTab, setActiveTab] = useState('empresa');
  const [st, setSt] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    async function fetchConfig() {
      try {
        const { data, error } = await supabase.from('configuracoes').select('*').eq('id', 1).single();
        if (data && !error) {
          setSt(data);
          // --- ATUALIZA O TÍTULO DA ABA DO NAVEGADOR ---
          document.title = `ORGANIZE - ${data.nome_loja || 'Sua Loja'}`;
        }
      } catch (err) {
        console.error("Erro ao buscar configurações:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchConfig();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const { error } = await supabase.from('configuracoes').update(st).eq('id', 1);
      if (error) throw error;
      
      // Atualiza o título caso o nome da loja tenha mudado
      document.title = `ORGANIZE - ${st.nome_loja || 'Sua Loja'}`;

      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (err) {
      alert("Erro ao salvar: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  const tabs = [
    { id: 'empresa', label: 'Empresa', icon: Building2, desc: 'Logo e endereço' },
    { id: 'atendimento', label: 'Contato', icon: MessageSquare, desc: 'Redes e WhatsApp' },
    { id: 'operacao', label: 'Vendas', icon: Wallet, desc: 'PIX e regras' },
    { id: 'marketing', label: 'Marketing', icon: Megaphone, desc: 'Pixel e SEO' },
    { id: 'seguranca', label: 'Acesso', icon: ShieldCheck, desc: 'Senhas' }
  ];

  if (loading) {
    return (
      <div className="flex h-full min-h-screen items-center justify-center bg-slate-50">
        <Loader2 className="animate-spin text-blue-600" size={32} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-24 md:pb-10">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 pt-6 md:pt-8 animate-in fade-in">
        
        {/* HEADER DA PÁGINA (COMPACTO) */}
        <div className="flex items-center justify-between gap-4 mb-4 md:mb-6 border-b border-slate-200 pb-3">
          <div>
            <h1 className="text-sm md:text-lg font-semibold text-slate-800 uppercase tracking-tight">Configurações Gerais</h1>
            <p className="text-[9px] font-medium text-slate-500 uppercase tracking-widest mt-0.5">Gerencie os dados do seu negócio</p>
          </div>
          <Button 
            onClick={handleSave} 
            disabled={saving}
            className="h-8 md:h-9 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-semibold uppercase tracking-widest text-[9px] px-4 md:px-6 shadow-sm transition-all flex items-center gap-1.5"
          >
            {saving ? <Loader2 size={14} className="animate-spin" /> : (saved ? <Check size={14} className="text-white" /> : <Save size={14} />)}
            <span className="hidden md:inline">{saved ? "Salvo com sucesso" : "Salvar Alterações"}</span>
            <span className="md:hidden">{saved ? "Salvo" : "Salvar"}</span>
          </Button>
        </div>

        <div className="flex flex-col gap-4">
          
          {/* NAVEGAÇÃO DESKTOP (BARRA HORIZONTAL NO TOPO) - CONFORME PEDIDO */}
          <div className="hidden md:flex flex-row overflow-x-auto no-scrollbar gap-1.5 w-full bg-slate-200/60 p-1.5 rounded-xl border border-slate-200 shadow-sm">
            {tabs.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex flex-1 items-center justify-center gap-2 px-4 py-2.5 rounded-lg transition-all whitespace-nowrap ${
                    isActive 
                      ? 'bg-white border-white shadow-sm text-blue-600' 
                      : 'bg-transparent border-transparent hover:bg-slate-300/50 text-slate-500 hover:text-slate-700'
                  }`}
                >
                  <tab.icon size={16} className={isActive ? 'text-blue-600' : 'text-slate-400'} />
                  <span className="text-[10px] font-bold uppercase tracking-widest">
                    {tab.label}
                  </span>
                </button>
              )
            })}
          </div>

          {/* ÁREA DE CONTEÚDO */}
          <div className="w-full bg-white border border-slate-200 rounded-xl p-4 md:p-5 shadow-sm min-h-[400px]">
             
            {activeTab === 'empresa' && TabEmpresa && <TabEmpresa st={st} setSt={setSt} />}
            {activeTab === 'atendimento' && TabAtendimento && <TabAtendimento st={st} setSt={setSt} />}
            {activeTab === 'operacao' && TabOperacao && <TabOperacao st={st} setSt={setSt} />}
            {activeTab === 'marketing' && <TabMarketing st={st} setSt={setSt} />}
            {activeTab === 'seguranca' && TabSeguranca && <TabSeguranca />}
             
             {!['empresa', 'atendimento', 'operacao', 'marketing', 'seguranca'].includes(activeTab) && (
               <div className="h-32 flex flex-col items-center justify-center border border-dashed border-slate-200 rounded-lg bg-slate-50 mt-4">
                  <Settings2 className="w-6 h-6 text-slate-300 mb-2" />
                  <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest">
                    Aba {activeTab} em construção
                  </p>
               </div>
             )}
          </div>
        </div>
      </div>

      {/* BOTTOM NAVIGATION (MOBILE FIXO NA BASE) - MANTIDO COMO ESTAVA */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-slate-200 flex justify-around items-center px-2 py-2 z-[90] shadow-[0_-5px_20px_rgba(0,0,0,0.05)] pb-safe">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex flex-col items-center justify-center gap-1 w-full py-2 px-1 rounded-md transition-colors ${
                isActive ? 'text-blue-600' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'
              }`}
            >
              <tab.icon size={18} className={`transition-transform ${isActive ? 'scale-110' : ''}`} />
              <span className={`text-[8px] uppercase tracking-widest whitespace-nowrap ${isActive ? 'font-bold' : 'font-semibold'}`}>
                {tab.label}
              </span>
            </button>
          )
        })}
      </div>

    </div>
  );
}