import React from 'react';
import { ImageIcon, Trash2, Upload, ChevronUp, ChevronDown, Package, LayoutTemplate } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function EditorForms({ section, st, setSt, handleImageUpload, removeImageAndStorage, displayCategories }) {
  const moveCategory = (idx, dir) => {
    let order = [...displayCategories];
    if (dir === 'up' && idx > 0) [order[idx-1], order[idx]] = [order[idx], order[idx-1]];
    else if (dir === 'down' && idx < order.length - 1) [order[idx+1], order[idx]] = [order[idx], order[idx+1]];
    setSt({...st, ordem_categorias: order});
  };

  // Puxa as cores cadastradas na Configuração Central
  const paleta = Array.isArray(st?.paleta_cores) ? st.paleta_cores : [];

  // Componente inteligente de bolinhas de cor
  const PaletaSugestoes = ({ field }) => {
    if (paleta.length === 0) return null;
    return (
      <div className="flex flex-wrap gap-2 mt-2 pt-2 border-t border-slate-700/50">
        <span className="text-[8px] text-slate-500 font-bold uppercase w-full">Cores da sua Marca:</span>
        {paleta.map(cor => (
          <button
            key={cor}
            onClick={() => setSt({...st, [field]: cor})}
            className="w-5 h-5 rounded-full border border-slate-600 shadow-sm hover:scale-125 transition-transform"
            style={{ backgroundColor: cor }}
            title={cor}
          />
        ))}
      </div>
    );
  };

  if (section === 'identidade') return (
    <div className="space-y-6">
      
      {/* COR PRINCIPAL (BOTÕES) */}
      <div className="space-y-1.5">
        <label className="text-[10px] font-bold text-slate-500 uppercase">Cor Principal (Botões e Destaques)</label>
        <div className="flex gap-2 items-center">
          <div className="w-8 h-8 rounded border border-slate-700 relative overflow-hidden shrink-0" style={{backgroundColor: st?.cor_principal || '#f472b6'}}>
            <input type="color" value={st?.cor_principal || '#f472b6'} onChange={(e) => setSt({...st, cor_principal: e.target.value})} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
          </div>
          <Input value={st?.cor_principal || ''} onChange={(e) => setSt({...st, cor_principal: e.target.value})} className="h-8 text-[10px] bg-slate-800 border-slate-700 text-white uppercase font-mono" />
        </div>
        <PaletaSugestoes field="cor_principal" />
      </div>

      {/* COR DO FUNDO DO TOPO */}
      <div className="space-y-1.5 pt-4 border-t border-slate-700/50">
        <label className="text-[10px] font-bold text-slate-500 uppercase">Cor de Fundo do Topo (Header)</label>
        <div className="flex gap-2 items-center">
          <div className="w-8 h-8 rounded border border-slate-700 relative overflow-hidden shrink-0" style={{backgroundColor: st?.cor_fundo_topo || '#ffffff'}}>
            <input type="color" value={st?.cor_fundo_topo || '#ffffff'} onChange={(e) => setSt({...st, cor_fundo_topo: e.target.value})} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
          </div>
          <Input value={st?.cor_fundo_topo || ''} placeholder="#ffffff" onChange={(e) => setSt({...st, cor_fundo_topo: e.target.value})} className="h-8 text-[10px] bg-slate-800 border-slate-700 text-white uppercase font-mono" />
        </div>
        <PaletaSugestoes field="cor_fundo_topo" />
      </div>

      {/* COR DO TEXTO DO TOPO */}
      <div className="space-y-1.5 pt-4 border-t border-slate-700/50">
        <label className="text-[10px] font-bold text-slate-500 uppercase">Cor do Texto e Ícones do Topo</label>
        <div className="flex gap-2 items-center">
          <div className="w-8 h-8 rounded border border-slate-700 relative overflow-hidden shrink-0" style={{backgroundColor: st?.cor_texto_topo || '#0f172a'}}>
            <input type="color" value={st?.cor_texto_topo || '#0f172a'} onChange={(e) => setSt({...st, cor_texto_topo: e.target.value})} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
          </div>
          <Input value={st?.cor_texto_topo || ''} placeholder="#0f172a" onChange={(e) => setSt({...st, cor_texto_topo: e.target.value})} className="h-8 text-[10px] bg-slate-800 border-slate-700 text-white uppercase font-mono" />
        </div>
        <PaletaSugestoes field="cor_texto_topo" />
      </div>

      <div className="pt-4 border-t border-slate-700/50 space-y-1.5">
         <label className="text-[10px] font-bold text-slate-500 uppercase">Ícone de Compartilhar (Topo)</label>
         <div className="flex gap-2 items-center bg-slate-800 p-2 rounded border border-slate-700">
            <div className="w-8 h-8 bg-slate-900 rounded border border-slate-700 relative overflow-hidden flex items-center justify-center">
              {st?.icone_compartilhar ? <img src={st.icone_compartilhar} className="w-4 h-4 object-contain" /> : <Upload size={12} className="text-slate-500"/>}
              <input type="file" accept="image/*" onChange={(e) => handleImageUpload(e, 'icone_compartilhar')} className="absolute inset-0 opacity-0 cursor-pointer z-10" />
            </div>
            {st?.icone_compartilhar && <button onClick={() => removeImageAndStorage('icone_compartilhar')} className="text-red-500 hover:text-red-400"><Trash2 size={12}/></button>}
            <span className="text-[8px] text-slate-500 uppercase font-bold ml-1">Recomendado: 100x100px</span>
         </div>
      </div>

      <div className="pt-4 border-t border-slate-700/50">
        <label className="text-[10px] font-bold text-slate-500 uppercase">Formato das Fotos dos Produtos</label>
        <div className="flex gap-2 mt-2">
          <button onClick={() => setSt({...st, formato_imagens: 'quadrado'})} className={`flex-1 h-8 text-[9px] font-bold uppercase rounded border ${st?.formato_imagens !== 'retrato' ? 'bg-slate-700 border-slate-500 text-white' : 'bg-slate-800 border-slate-700 text-slate-500'}`}>Quadrado</button>
          <button onClick={() => setSt({...st, formato_imagens: 'retrato'})} className={`flex-1 h-8 text-[9px] font-bold uppercase rounded border ${st?.formato_imagens === 'retrato' ? 'bg-slate-700 border-slate-500 text-white' : 'bg-slate-800 border-slate-700 text-slate-500'}`}>Retrato</button>
        </div>
      </div>
    </div>
  );

  if (section === 'layout') return (
    <div className="space-y-4">
      <div className="space-y-2"><label className="text-[10px] font-bold text-slate-500 uppercase">Ordem das Categorias</label>
        {displayCategories.filter(c => c !== 'Sem Categoria').map((cat, idx) => (
          <div key={cat} className="flex justify-between items-center bg-slate-800 border border-slate-700 p-2 rounded"><span className="text-[10px] font-bold text-slate-300 uppercase">{cat}</span>
            <div className="flex gap-1"><button onClick={() => moveCategory(idx, 'up')} disabled={idx === 0} className="text-slate-500 hover:text-white disabled:opacity-30"><ChevronUp size={14}/></button><button onClick={() => moveCategory(idx, 'down')} disabled={idx === displayCategories.filter(c => c !== 'Sem Categoria').length - 1} className="text-slate-500 hover:text-white disabled:opacity-30"><ChevronDown size={14}/></button></div>
          </div>
        ))}
      </div>
      <div className="pt-4 border-t border-slate-700/50">
        <div className="flex justify-between items-center bg-slate-800 p-2 rounded"><span className="text-[10px] font-bold text-slate-300 uppercase">Benefícios (Abaixo do Banner)</span><button onClick={() => setSt({...st, mostrar_beneficios: !st.mostrar_beneficios})} className={`w-8 h-4 rounded-full p-0.5 transition-all ${st?.mostrar_beneficios ? 'bg-emerald-500' : 'bg-slate-600'}`}><div className={`w-3 h-3 bg-white rounded-full transition-transform ${st?.mostrar_beneficios ? 'translate-x-4' : 'translate-x-0'}`} /></button></div>
        {st?.mostrar_beneficios && [1,2,3].map(num => (
          <div key={num} className="mt-2 bg-slate-800 p-2 rounded border border-slate-700 flex gap-2 items-start">
            <div className="flex flex-col items-center gap-1 shrink-0">
              <div className="flex gap-1">
                <div className="w-8 h-8 bg-slate-900 rounded border border-slate-700 relative flex items-center justify-center overflow-hidden">
                  {st[`beneficio_${num}_icone`] ? <img src={st[`beneficio_${num}_icone`]} className="w-full h-full object-contain" /> : <Package size={12}/>}
                  <input type="file" accept="image/*" onChange={(e) => handleImageUpload(e, `beneficio_${num}_icone`)} className="absolute inset-0 opacity-0 cursor-pointer z-10" />
                </div>
                {st[`beneficio_${num}_icone`] && (
                  <button onClick={() => removeImageAndStorage(`beneficio_${num}_icone`)} className="bg-red-500 text-white w-8 h-6 rounded flex items-center justify-center relative z-20"><Trash2 size={10}/></button>
                )}
              </div>
            </div>
            <div className="flex-1 space-y-1">
              <Input value={st[`beneficio_${num}_titulo`] || ''} onChange={(e) => setSt({...st, [`beneficio_${num}_titulo`]: e.target.value})} placeholder="Título" className="h-6 text-[9px] bg-slate-900 border-slate-700 text-white" />
              <Input value={st[`beneficio_${num}_desc`] || ''} onChange={(e) => setSt({...st, [`beneficio_${num}_desc`]: e.target.value})} placeholder="Descrição" className="h-6 text-[9px] bg-slate-900 border-slate-700 text-white" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  if (section === 'etiquetas') return (
    <div className="grid gap-4">
      {[{ l: 'Destaque', f: 'cor_etiqueta_destaque', d: '#fbbf24' }, { l: 'Promoção', f: 'cor_etiqueta_promo', d: '#f43f5e' }, { l: 'Atacado', f: 'cor_etiqueta_atacado', d: '#fb923c' }, { l: 'Variações', f: 'cor_etiqueta_variacao', d: '#60a5fa' }].map(i => (
        <div key={i.f} className="flex flex-col bg-slate-800 p-3 rounded border border-slate-700">
           <div className="flex justify-between items-center mb-1">
             <span className="text-[9px] font-bold text-slate-400 uppercase">{i.l}</span>
             <div className="w-6 h-6 rounded relative overflow-hidden" style={{backgroundColor: st?.[i.f] || i.d}}>
               <input type="color" value={st?.[i.f] || i.d} onChange={(e) => setSt({...st, [i.f]: e.target.value})} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
             </div>
           </div>
           {/* Mágica da sugestão de cor também nas etiquetas */}
           <PaletaSugestoes field={i.f} />
        </div>
      ))}
    </div>
  );

  if (section === 'banner') return (
    <div className="space-y-6">
      <div className="space-y-2">
        <label className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest flex items-center gap-1.5"><LayoutTemplate size={12}/> Banner Desktop</label>
        <div className="relative">
          <input type="file" accept="image/*" onChange={(e) => handleImageUpload(e, 'banner_url')} className="absolute inset-0 opacity-0 cursor-pointer z-10" />
          <Button className="w-full h-8 bg-slate-800 text-slate-300 text-[9px] uppercase hover:bg-slate-700"><Upload size={12} className="mr-2"/> Subir Banner Desktop</Button>
          <p className="text-[8px] text-slate-500 font-bold uppercase mt-1.5 text-center">Medida ideal: 1200x400 px</p>
        </div>
        {st?.banner_url && <div className="aspect-[21/9] rounded overflow-hidden border border-slate-700 relative"><img src={st.banner_url} className="w-full h-full object-cover" /><button onClick={() => removeImageAndStorage('banner_url')} className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded z-20"><Trash2 size={10}/></button></div>}
      </div>

      <div className="space-y-2 pt-4 border-t border-slate-700/50">
        <label className="text-[10px] font-bold text-blue-400 uppercase tracking-widest flex items-center gap-1.5"><ImageIcon size={12}/> Banner Mobile</label>
        <div className="relative">
          <input type="file" accept="image/*" onChange={(e) => handleImageUpload(e, 'banner_mobile_url')} className="absolute inset-0 opacity-0 cursor-pointer z-10" />
          <Button className="w-full h-8 bg-slate-800 text-slate-300 text-[9px] uppercase hover:bg-slate-700"><Upload size={12} className="mr-2"/> Subir Banner Mobile</Button>
          <p className="text-[8px] text-slate-500 font-bold uppercase mt-1.5 text-center">Medida ideal: 1080x1080 px ou 1080x1350 px</p>
        </div>
        {st?.banner_mobile_url && <div className="aspect-square w-2/3 mx-auto rounded overflow-hidden border border-slate-700 relative bg-slate-950"><img src={st.banner_mobile_url} className="w-full h-full object-cover" /><button onClick={() => removeImageAndStorage('banner_mobile_url')} className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded z-20"><Trash2 size={10}/></button></div>}
      </div>

      <div className="space-y-1 pt-4 border-t border-slate-700/50">
        <label className="text-[9px] font-bold text-slate-500 uppercase">Link ao clicar no Banner (Opcional)</label>
        <Input value={st?.banner_link || ''} onChange={(e) => setSt({...st, banner_link: e.target.value})} placeholder="https://..." className="h-8 text-[10px] bg-slate-800 border-slate-700 text-white" />
      </div>
    </div>
  );

  return null;
}