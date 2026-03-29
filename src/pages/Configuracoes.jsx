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
    { id: 'empresa', label: 'Dados da Empresa', icon: Building2, desc: 'Logo, nome e endereço' },
    { id: 'atendimento', label: 'Atendimento & Redes', icon: MessageSquare, desc: 'WhatsApp e mídias sociais' },
    { id: 'operacao', label: 'Regras de Venda', icon: Wallet, desc: 'PIX e pedidos' },
    { id: 'seguranca', label: 'Segurança', icon: ShieldCheck, desc: 'Acesso da conta' }
  ];

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center bg-slate-50">
        <Loader2 className="animate-spin text-slate-300" size={48} />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto w-full pb-20 md:pb-10">
      
      {/* HEADER DA PÁGINA */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">Configurações Gerais</h1>
          <p className="text-sm font-medium text-slate-500 mt-1">Gerencie os dados centrais, redes sociais e regras do seu negócio.</p>
        </div>
        <Button 
          onClick={handleSave} 
          disabled={saving}
          className="h-12 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold uppercase tracking-widest text-[11px] px-8 shadow-md transition-all flex items-center gap-2"
        >
          {saving ? <Loader2 size={16} className="animate-spin" /> : (saved ? <Check size={16} className="text-emerald-400" /> : <Save size={16} />)}
          {saved ? "Salvo com sucesso!" : "Salvar Alterações"}
        </Button>
      </div>

      <div className="flex flex-col md:flex-row gap-8">
        
        {/* NAVEGAÇÃO DAS ABAS (MOBILE E DESKTOP) */}
        <div className="w-full md:w-72 shrink-0">
          <div className="flex md:flex-col gap-2 overflow-x-auto md:overflow-visible pb-2 md:pb-0 no-scrollbar snap-x">
            {tabs.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-start gap-4 p-4 rounded-2xl transition-all text-left snap-start shrink-0 w-[240px] md:w-full border ${
                    isActive 
                      ? 'bg-white border-slate-200 shadow-sm' 
                      : 'bg-transparent border-transparent hover:bg-slate-200/50'
                  }`}
                >
                  <div className={`p-2.5 rounded-xl shrink-0 ${isActive ? 'bg-slate-900 text-white shadow-md' : 'bg-slate-200 text-slate-500'}`}>
                    <tab.icon size={20} />
                  </div>
                  <div className="flex flex-col">
                    <span className={`text-sm font-bold ${isActive ? 'text-slate-900' : 'text-slate-600'}`}>
                      {tab.label}
                    </span>
                    <span className="text-[11px] font-medium text-slate-400 mt-0.5">
                      {tab.desc}
                    </span>
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        {/* ÁREA DE CONTEÚDO (ONDE AS ABAS VÃO APARECER) */}
        <div className="flex-1 min-w-0 bg-white border border-slate-200 rounded-3xl p-6 md:p-10 shadow-sm">
           {/* Deixei comentado temporariamente até criarmos os arquivos nos próximos passos */}
           
          {activeTab === 'empresa' && <TabEmpresa st={st} setSt={setSt} />}
          {activeTab === 'atendimento' && <TabAtendimento st={st} setSt={setSt} />}
          {activeTab === 'operacao' && <TabOperacao st={st} setSt={setSt} />}
          {activeTab === 'seguranca' && <TabSeguranca />}
           
           <div className="h-40 flex items-center justify-center border-2 border-dashed border-slate-200 rounded-2xl">
              <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">
                Aba "{activeTab}" selecionada (Conteúdo em construção)
              </p>
           </div>
        </div>

      </div>
    </div>
  );
}