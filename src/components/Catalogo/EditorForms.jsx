import React from 'react';
import { ImageIcon, Trash2, Upload, ChevronUp, ChevronDown, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function EditorForms({ section, st, setSt, handleImageUpload, removeImageAndStorage, displayCategories }) {
  const moveCategory = (idx, dir) => {
    let order = [...displayCategories];
    if (dir === 'up' && idx > 0) [order[idx-1], order[idx]] = [order[idx], order[idx-1]];
    else if (dir === 'down' && idx < order.length - 1) [order[idx+1], order[idx]] = [order[idx], order[idx+1]];
    setSt({...st, ordem_categorias: order});
  };

  if (section === 'identidade') return (
    <div className="space-y-4">
      <div className="space-y-1.5"><label className="text-[10px] font-bold text-slate-500 uppercase">Nome da Loja</label><Input value={st?.nome_loja || ''} onChange={(e) => setSt({...st, nome_loja: e.target.value})} className="h-8 text-xs bg-slate-800 border-slate-700 text-white" /></div>
      <div className="space-y-1.5"><label className="text-[10px] font-bold text-slate-500 uppercase">Logo Central</label>
        <div className="flex gap-2">
          <div className="w-12 h-12 bg-slate-800 border border-slate-700 rounded relative flex items-center justify-center overflow-hidden">
            {st?.logo_url ? <img src={st.logo_url} className="w-full h-full object-contain bg-white" /> : <ImageIcon size={16} className="text-slate-500" />}
            <input type="file" accept="image/*" onChange={(e) => handleImageUpload(e, 'logo_url')} className="absolute inset-0 opacity-0 cursor-pointer z-10" />
          </div>
          {st?.logo_url && <button onClick={() => removeImageAndStorage('logo_url')} className="bg-red-500 p-2 rounded text-white"><Trash2 size={14}/></button>}
        </div>
        <p className="text-[8px] text-slate-500 font-bold uppercase">Medida: 500x500 px</p>
      </div>
      <div className="space-y-1.5"><label className="text-[10px] font-bold text-slate-500 uppercase">Cor Principal</label>
        <div className="flex gap-2 items-center">
          <div className="w-8 h-8 rounded border border-slate-700 relative overflow-hidden" style={{backgroundColor: st?.cor_principal || '#000'}}><input type="color" value={st?.cor_principal || '#000'} onChange={(e) => setSt({...st, cor_principal: e.target.value})} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" /></div>
          <Input value={st?.cor_principal || ''} onChange={(e) => setSt({...st, cor_principal: e.target.value})} className="h-8 text-[10px] bg-slate-800 border-slate-700 text-white uppercase" />
        </div>
      </div>
      <div className="pt-3 border-t border-slate-700/50"><label className="text-[10px] font-bold text-slate-500 uppercase">Formato das Fotos</label>
        <div className="flex gap-2 mt-1">
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
            <div className="flex gap-1"><button onClick={() => moveCategory(idx, 'up')} className="text-slate-500 hover:text-white"><ChevronUp size={14}/></button><button onClick={() => moveCategory(idx, 'down')} className="text-slate-500 hover:text-white"><ChevronDown size={14}/></button></div>
          </div>
        ))}
      </div>
      <div className="pt-4 border-t border-slate-700/50">
        <div className="flex justify-between items-center bg-slate-800 p-2 rounded"><span className="text-[10px] font-bold text-slate-300 uppercase">Benefícios</span><button onClick={() => setSt({...st, mostrar_beneficios: !st.mostrar_beneficios})} className={`w-8 h-4 rounded-full p-0.5 transition-all ${st?.mostrar_beneficios ? 'bg-emerald-500' : 'bg-slate-600'}`}><div className={`w-3 h-3 bg-white rounded-full transition-transform ${st?.mostrar_beneficios ? 'translate-x-4' : 'translate-x-0'}`} /></button></div>
        {st?.mostrar_beneficios && [1,2,3].map(num => (
          <div key={num} className="mt-2 bg-slate-800 p-2 rounded border border-slate-700 flex gap-2">
            <div className="flex flex-col items-center gap-1 shrink-0">
              <div className="w-8 h-8 bg-slate-900 rounded border border-slate-700 relative flex items-center justify-center overflow-hidden">{st[`beneficio_${num}_icone`] ? <img src={st[`beneficio_${num}_icone`]} className="w-full h-full object-contain" /> : <Package size={12}/>}<input type="file" onChange={(e) => handleImageUpload(e, `beneficio_${num}_icone`)} className="absolute inset-0 opacity-0 cursor-pointer z-10" /></div>
              {st[`beneficio_${num}_icone`] && <button onClick={() => removeImageAndStorage(`beneficio_${num}_icone`)} className="bg-red-500 text-white w-8 h-6 rounded flex items-center justify-center relative z-20"><Trash2 size={10}/></button>}
              <span className="text-[7px] text-slate-500 font-bold uppercase">100x100</span>
            </div>
            <div className="flex-1 space-y-1"><Input value={st[`beneficio_${num}_titulo`] || ''} onChange={(e) => setSt({...st, [`beneficio_${num}_titulo`]: e.target.value})} placeholder="Título" className="h-6 text-[9px] bg-slate-900 border-slate-700 text-white" /><Input value={st[`beneficio_${num}_desc`] || ''} onChange={(e) => setSt({...st, [`beneficio_${num}_desc`]: e.target.value})} placeholder="Descrição" className="h-6 text-[9px] bg-slate-900 border-slate-700 text-white" /></div>
          </div>
        ))}
      </div>
    </div>
  );

  if (section === 'etiquetas') return (
    <div className="grid gap-2">
      {[{ l: 'Destaque', f: 'cor_etiqueta_destaque', d: '#fbbf24' }, { l: 'Promo', f: 'cor_etiqueta_promo', d: '#f43f5e' }, { l: 'Atacado', f: 'cor_etiqueta_atacado', d: '#fb923c' }, { l: 'Var.', f: 'cor_etiqueta_variacao', d: '#60a5fa' }].map(i => (
        <div key={i.f} className="flex justify-between items-center bg-slate-800 p-2 rounded border border-slate-700"><span className="text-[9px] font-bold text-slate-400 uppercase">{i.l}</span><div className="w-6 h-6 rounded relative overflow-hidden" style={{backgroundColor: st?.[i.f] || i.d}}><input type="color" value={st?.[i.f] || i.d} onChange={(e) => setSt({...st, [i.f]: e.target.value})} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" /></div></div>
      ))}
    </div>
  );

  if (section === 'banner') return (
    <div className="space-y-4">
      <div className="relative"><input type="file" onChange={(e) => handleImageUpload(e, 'banner_url')} className="absolute inset-0 opacity-0 cursor-pointer z-10" /><Button className="w-full h-8 bg-slate-800 text-slate-300 text-[9px] uppercase"><Upload size={12} className="mr-2"/> Subir Banner</Button><p className="text-[8px] text-slate-500 font-bold uppercase mt-1 text-center">1200x400 px</p></div>
      {st?.banner_url && <div className="aspect-[21/9] rounded overflow-hidden border border-slate-700 relative"><img src={st.banner_url} className="w-full h-full object-cover" /><button onClick={() => removeImageAndStorage('banner_url')} className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded"><Trash2 size={10}/></button></div>}
      <div className="space-y-1"><label className="text-[9px] font-bold text-slate-500 uppercase">Link</label><Input value={st?.banner_link || ''} onChange={(e) => setSt({...st, banner_link: e.target.value})} className="h-8 text-[10px] bg-slate-800 border-slate-700 text-white" /></div>
    </div>
  );

  if (section === 'rodape') return (
    <div className="space-y-2">
      <textarea value={st?.texto_sobre || ''} onChange={(e) => setSt({...st, texto_sobre: e.target.value})} placeholder="Sobre a Empresa" className="w-full h-16 p-2 bg-slate-800 border-slate-700 rounded text-[10px] text-white resize-none" />
      <Input value={st?.whatsapp || ''} onChange={(e) => setSt({...st, whatsapp: e.target.value})} placeholder="WhatsApp" className="h-8 text-[10px] bg-slate-800 border-slate-700 text-white" />
      <Input value={st?.instagram || ''} onChange={(e) => setSt({...st, instagram: e.target.value})} placeholder="Instagram" className="h-8 text-[10px] bg-slate-800 border-slate-700 text-white" />
      <Input value={st?.endereco || ''} onChange={(e) => setSt({...st, endereco: e.target.value})} placeholder="Endereço" className="h-8 text-[10px] bg-slate-800 border-slate-700 text-white" />
    </div>
  );

  return null;
}