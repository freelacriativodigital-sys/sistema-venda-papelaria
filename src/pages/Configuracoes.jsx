import React, { useState, useEffect } from 'react';
import { Building2, MessageSquare, Wallet, ShieldCheck, Loader2, Save, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "../lib/supabase";

// Vamos importar as abas que criaremos nos próximos passos
import TabEmpresa from '../components/Configuracoes/TabEmpresa';
import TabAtendimento from '../components/Configuracoes/TabAtendimento';
import TabOperacao from '../components/Configuracoes/TabOperacao';
import TabSeguranca from '../components/Configuracoes/TabSeguranca';

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
      
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (err) {
      alert("Erro ao salvar: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  const tabs = [
    { id: 'empresa', label: 'Dados da Empresa', shortLabel: 'Empresa', icon: Building2, desc: 'Logo, nome e endereço' },
    { id: 'atendimento', label: 'Atendimento & Redes', shortLabel: 'Contato', icon: MessageSquare, desc: 'WhatsApp e sociais' },
    { id: 'operacao', label: 'Regras de Venda', shortLabel: 'Vendas', icon: Wallet, desc: 'PIX e pedidos' },
    { id: 'seguranca', label: 'Segurança', shortLabel: 'Acesso', icon: ShieldCheck, desc: 'Acesso da conta' }
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f8fafc]">
        <Loader2 className="animate-spin text-blue-600" size={32} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 pb-[80px] md:pb-12 relative">
      
      {/* HEADER FIXO - ESTILO EXECUTIVO */}
      <div className="border-b border-slate-200 bg-white/90 backdrop-blur-md sticky top-0 z-20 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <h1 className="text-lg md:text-xl font-semibold text-slate-800 uppercase leading-none tracking-tight flex items-center gap-2">
              <Settings className="w-5 h-5 text-blue-600" /> Configurações
            </h1>
            <div className="h-6 w-px bg-slate-200 hidden md:block"></div>
            <p className="text-[9px] md:text-[10px] text-slate-500 font-medium uppercase tracking-widest hidden md:block mt-0.5">
              Gerais e Sistema
            </p>
          </div>
          
          <Button 
            onClick={handleSave} 
            disabled={saving}
            className="h-9 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-semibold uppercase tracking-widest text-[10px] px-5 shadow-sm transition-all flex items-center gap-1.5"
          >
            {saving ? <Loader2 size={14} className="animate-spin" /> : (saved ? <Check size={14} className="text-emerald-400" /> : <Save size={14} />)}
            {saved ? "Salvo" : "Salvar"}
          </Button>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 mt-6 animate-in fade-in">
        <div className="flex flex-col md:flex-row gap-5 md:gap-8">
          
          {/* NAVEGAÇÃO DAS ABAS (DESKTOP ONLY) */}
          <div className="hidden md:flex w-64 shrink-0 flex-col gap-2">
            {tabs.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-3 p-3 rounded-xl transition-all text-left border shadow-sm ${
                    isActive 
                      ? 'bg-white border-slate-200' 
                      : 'bg-transparent border-transparent hover:bg-white/50 shadow-none'
                  }`}
                >
                  <div className={`p-2 rounded-lg shrink-0 ${isActive ? 'bg-blue-50 text-blue-600' : 'bg-slate-200 text-slate-500'}`}>
                    <tab.icon size={16} />
                  </div>
                  <div className="flex flex-col">
                    <span className={`text-[10px] font-semibold uppercase tracking-widest ${isActive ? 'text-slate-800' : 'text-slate-500'}`}>
                      {tab.label}
                    </span>
                    <span className="text-[9px] font-medium text-slate-400 mt-0.5 tracking-widest">
                      {tab.desc}
                    </span>
                  </div>
                </button>
              )
            })}
          </div>

          {/* ÁREA DE CONTEÚDO */}
          <div className="flex-1 min-w-0">
             {/* Deixei comentado temporariamente até criarmos os arquivos nos próximos passos */}
             
            {activeTab === 'empresa' && <TabEmpresa st={st} setSt={setSt} />}
            {activeTab === 'atendimento' && <TabAtendimento st={st} setSt={setSt} />}
            {activeTab === 'operacao' && <TabOperacao st={st} setSt={setSt} />}
            {activeTab === 'seguranca' && <TabSeguranca />}
             
             {/* Você pode apagar este bloco quando preencher todas as abas */}
             <div className="h-32 flex items-center justify-center border border-dashed border-slate-200 bg-slate-50 rounded-xl mt-4">
                <p className="text-[9px] font-semibold text-slate-400 uppercase tracking-widest">
                  Aba "{activeTab}" selecionada (Conteúdo em construção)
                </p>
             </div>
          </div>

        </div>
      </div>

      {/* --- MENU INFERIOR FIXO PARA MOBILE --- */}
      <div className="md:hidden fixed bottom-0 inset-x-0 h-[64px] bg-white border-t border-slate-200 flex items-center justify-around z-[100] pb-safe shadow-[0_-5px_15px_rgba(0,0,0,0.03)]">
        {tabs.map((tab) => (
          <button 
            key={tab.id} 
            onClick={() => setActiveTab(tab.id)} 
            className={`flex flex-col items-center justify-center flex-1 h-full gap-1 transition-colors ${activeTab === tab.id ? 'text-blue-600' : 'text-slate-400 hover:text-slate-600'}`}
          >
             <tab.icon size={18} className={activeTab === tab.id ? 'animate-pulse' : ''} />
             <span className="text-[8px] font-semibold uppercase tracking-wider">{tab.shortLabel}</span>
          </button>
        ))}
      </div>

    </div>
  );
}