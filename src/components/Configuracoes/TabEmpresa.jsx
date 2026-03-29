import React, { useState } from 'react';
import { Building2, ImageIcon, Trash2, Upload, Plus, X, Palette, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { supabase } from "../../../lib/supabase"; // Ajuste o caminho do supabase se necessário
import { deletePhysicalFile, compressImageToBlob } from '../Catalogo/catalogoUtils';

export default function TabEmpresa({ st, setSt }) {
  const [isUploading, setIsUploading] = useState(false);
  const [novaCor, setNovaCor] = useState('#33BEE8');

  // Função para Upload da Logo
  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setIsUploading(true);
    try {
      if (st.logo_url) await deletePhysicalFile(st.logo_url);
      const blob = await compressImageToBlob(file);
      const fileName = `logo-empresa-${Date.now()}-${Math.random().toString(36).substring(7)}.webp`;
      const { error } = await supabase.storage.from('produtos').upload(fileName, blob, { contentType: 'image/webp', upsert: true });
      if (error) throw error;
      const { data: publicUrlData } = supabase.storage.from('produtos').getPublicUrl(fileName);
      setSt(prev => ({ ...prev, logo_url: publicUrlData.publicUrl }));
    } catch (err) {
      alert("Erro ao subir imagem: " + err.message);
    } finally {
      setIsUploading(false);
    }
  };

  const removeLogo = async () => {
    if (st.logo_url) {
      setIsUploading(true);
      await deletePhysicalFile(st.logo_url);
      setSt(prev => ({ ...prev, logo_url: '' }));
      setIsUploading(false);
    }
  };

  // Funções da Paleta de Cores
  const paleta = Array.isArray(st?.paleta_cores) ? st.paleta_cores : [];

  const adicionarCor = () => {
    if (!paleta.includes(novaCor)) {
      setSt(prev => ({ ...prev, paleta_cores: [...paleta, novaCor] }));
    }
  };

  const removerCor = (corParaRemover) => {
    setSt(prev => ({ ...prev, paleta_cores: paleta.filter(c => c !== corParaRemover) }));
  };

  return (
    <div className="space-y-10 animate-in fade-in duration-500">
      
      {/* SEÇÃO 1: PERFIL PRINCIPAL */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <Building2 size={18} className="text-slate-400" />
          <h2 className="text-lg font-bold text-slate-800">Perfil da Empresa</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 bg-slate-50 p-6 rounded-2xl border border-slate-100">
          
          {/* Upload de Logo */}
          <div className="col-span-1 md:col-span-4 flex flex-col items-center justify-center gap-3">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Logo Oficial</label>
            <div className="w-32 h-32 bg-white rounded-2xl border-2 border-dashed border-slate-200 relative flex items-center justify-center overflow-hidden shadow-sm group hover:border-blue-400 transition-colors">
              {isUploading ? (
                 <Loader2 className="animate-spin text-slate-300" size={24} />
              ) : st?.logo_url ? (
                 <>
                   <img src={st.logo_url} className="w-full h-full object-contain p-2" alt="Logo" />
                   <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <button onClick={removeLogo} className="bg-red-500 text-white p-2 rounded-lg hover:bg-red-600 transition-colors"><Trash2 size={16}/></button>
                   </div>
                 </>
              ) : (
                 <div className="flex flex-col items-center text-slate-400 group-hover:text-blue-500 transition-colors">
                   <ImageIcon size={28} className="mb-2" />
                   <span className="text-[9px] font-bold uppercase">Upload</span>
                 </div>
              )}
              {!st?.logo_url && !isUploading && (
                <input type="file" accept="image/*" onChange={handleImageUpload} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
              )}
            </div>
            <p className="text-[10px] text-slate-400 font-medium text-center">Recomendado: 500x500px<br/>Fundo transparente (PNG)</p>
          </div>

          {/* Dados Básicos */}
          <div className="col-span-1 md:col-span-8 flex flex-col gap-4">
            <div>
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 block">Nome da Empresa / Loja</label>
              <Input 
                value={st?.nome_loja || ''} 
                onChange={(e) => setSt({...st, nome_loja: e.target.value})} 
                placeholder="Ex: Criarte Papelaria" 
                className="h-12 bg-white border-slate-200 text-slate-800 font-medium text-base rounded-xl" 
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 block">CNPJ / CPF</label>
                <Input 
                  value={st?.documento || ''} 
                  onChange={(e) => setSt({...st, documento: e.target.value})} 
                  placeholder="00.000.000/0000-00" 
                  className="h-10 bg-white border-slate-200 text-slate-800 font-medium text-sm rounded-xl" 
                />
              </div>
              <div>
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 block">Endereço Físico (Opcional)</label>
                <Input 
                  value={st?.endereco || ''} 
                  onChange={(e) => setSt({...st, endereco: e.target.value})} 
                  placeholder="Rua, Número, Bairro, Cidade" 
                  className="h-10 bg-white border-slate-200 text-slate-800 font-medium text-sm rounded-xl" 
                />
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* SEÇÃO 2: BRAND KIT (PALETA DE CORES) */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <Palette size={18} className="text-slate-400" />
          <h2 className="text-lg font-bold text-slate-800">Identidade Visual (Brand Kit)</h2>
        </div>
        
        <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 flex flex-col gap-6">
           <div>
             <h3 className="text-sm font-bold text-slate-700 mb-1">Paleta de Cores Global</h3>
             <p className="text-[11px] text-slate-500 font-medium">Cadastre as cores da sua marca aqui. Elas aparecerão como sugestões rápidas na hora de montar o layout do seu Catálogo ou Link da Bio.</p>
           </div>
           
           <div className="flex flex-wrap items-center gap-4">
             {/* Cores Salvas */}
             {paleta.map((cor, idx) => (
                <div key={idx} className="relative group">
                   <div className="w-12 h-12 rounded-full border-2 border-white shadow-md transition-transform group-hover:scale-110 flex items-center justify-center" style={{ backgroundColor: cor }}>
                      <span className="opacity-0 group-hover:opacity-100 text-[8px] font-black uppercase text-white drop-shadow-md mix-blend-difference">{cor}</span>
                   </div>
                   <button onClick={() => removerCor(cor)} className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-sm hover:bg-red-600 hover:scale-110">
                      <X size={12} strokeWidth={3} />
                   </button>
                </div>
             ))}

             {/* Adicionar Nova Cor */}
             <div className="flex items-center gap-2 bg-white p-1.5 rounded-full border border-slate-200 shadow-sm pr-2">
                <div className="relative w-9 h-9 rounded-full overflow-hidden border border-slate-200 shrink-0 cursor-pointer">
                   <div className="absolute inset-0 bg-slate-100 flex items-center justify-center pointer-events-none" style={{ backgroundColor: novaCor }}></div>
                   <input type="color" value={novaCor} onChange={(e) => setNovaCor(e.target.value)} className="absolute -inset-2 w-14 h-14 opacity-0 cursor-pointer" />
                </div>
                <Input value={novaCor} onChange={(e) => setNovaCor(e.target.value)} className="w-20 h-8 text-[11px] font-mono font-bold uppercase bg-transparent border-none shadow-none focus-visible:ring-0 px-1" />
                <button onClick={adicionarCor} className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center hover:bg-slate-800 transition-colors shrink-0">
                   <Plus size={16} />
                </button>
             </div>
           </div>
        </div>
      </section>

      {/* SEÇÃO 3: SOBRE A EMPRESA */}
      <section>
         <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-2 block">História / Sobre a Empresa</label>
         <textarea 
            value={st?.texto_sobre || ''} 
            onChange={(e) => setSt({...st, texto_sobre: e.target.value})} 
            placeholder="Escreva um breve texto sobre a sua empresa para aparecer no rodapé do seu site..." 
            className="w-full h-28 p-4 bg-white border border-slate-200 rounded-2xl text-sm text-slate-700 resize-none focus:outline-none focus:border-blue-400 transition-colors" 
         />
      </section>

    </div>
  );
}