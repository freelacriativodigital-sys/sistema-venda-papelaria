if (section === 'banner') return (
    <div className="space-y-6">
      {/* BANNER DESKTOP */}
      <div className="space-y-2">
        <label className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest flex items-center gap-1.5"><LayoutTemplate size={12}/> Banner Desktop (Computador)</label>
        <div className="relative">
          <input type="file" accept="image/*" onChange={(e) => handleImageUpload(e, 'banner_url')} className="absolute inset-0 opacity-0 cursor-pointer z-10" />
          <Button className="w-full h-8 bg-slate-800 text-slate-300 text-[9px] uppercase hover:bg-slate-700"><Upload size={12} className="mr-2"/> Subir Banner Desktop</Button>
          <p className="text-[8px] text-slate-500 font-bold uppercase mt-1.5 text-center">Medida ideal: 1200x400 px</p>
        </div>
        {st?.banner_url && <div className="aspect-[21/9] rounded overflow-hidden border border-slate-700 relative"><img src={st.banner_url} className="w-full h-full object-cover" /><button onClick={() => removeImageAndStorage('banner_url')} className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded z-20"><Trash2 size={10}/></button></div>}
      </div>

      {/* BANNER MOBILE */}
      <div className="space-y-2 pt-4 border-t border-slate-700/50">
        <label className="text-[10px] font-bold text-blue-400 uppercase tracking-widest flex items-center gap-1.5"><ImageIcon size={12}/> Banner Mobile (Celular)</label>
        <div className="relative">
          <input type="file" accept="image/*" onChange={(e) => handleImageUpload(e, 'banner_mobile_url')} className="absolute inset-0 opacity-0 cursor-pointer z-10" />
          <Button className="w-full h-8 bg-slate-800 text-slate-300 text-[9px] uppercase hover:bg-slate-700"><Upload size={12} className="mr-2"/> Subir Banner Mobile</Button>
          <p className="text-[8px] text-slate-500 font-bold uppercase mt-1.5 text-center">Medida ideal: 1080x1080 px ou 1080x1350 px</p>
        </div>
        {st?.banner_mobile_url && <div className="aspect-square w-2/3 mx-auto rounded overflow-hidden border border-slate-700 relative bg-slate-950"><img src={st.banner_mobile_url} className="w-full h-full object-cover" /><button onClick={() => removeImageAndStorage('banner_mobile_url')} className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded z-20"><Trash2 size={10}/></button></div>}
      </div>

      <div className="space-y-1 pt-4 border-t border-slate-700/50"><label className="text-[9px] font-bold text-slate-500 uppercase">Link ao clicar no Banner</label><Input value={st?.banner_link || ''} onChange={(e) => setSt({...st, banner_link: e.target.value})} className="h-8 text-[10px] bg-slate-800 border-slate-700 text-white" /></div>
    </div>
  );

  if (section === 'rodape') return (
    <div className="space-y-5">
      <div className="space-y-2">
        <textarea value={st?.texto_sobre || ''} onChange={(e) => setSt({...st, texto_sobre: e.target.value})} placeholder="Escreva algo sobre a sua Empresa..." className="w-full h-20 p-3 bg-slate-800 border-slate-700 rounded text-[10px] text-white resize-none" />
        <Input value={st?.endereco || ''} onChange={(e) => setSt({...st, endereco: e.target.value})} placeholder="Endereço Físico (Opcional)" className="h-8 text-[10px] bg-slate-800 border-slate-700 text-white" />
      </div>

      <div className="space-y-3 pt-4 border-t border-slate-700/50">
         <label className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">Redes & Links Topo</label>
         
         {/* Link 1 (Padrão Insta) */}
         <div className="bg-slate-800 p-2 rounded border border-slate-700 flex flex-col gap-2">
            <div className="flex gap-2 items-center">
              <div className="flex flex-col items-center gap-1 shrink-0">
                <div className="w-8 h-8 bg-slate-900 rounded border border-slate-700 relative overflow-hidden flex items-center justify-center">
                  {st?.icone_social_1 ? <img src={st.icone_social_1} className="w-5 h-5 object-contain" /> : <Upload size={12} className="text-slate-500"/>}
                  <input type="file" accept="image/*" onChange={(e) => handleImageUpload(e, 'icone_social_1')} className="absolute inset-0 opacity-0 cursor-pointer z-10" />
                </div>
                {st?.icone_social_1 && <button onClick={() => removeImageAndStorage('icone_social_1')} className="text-red-500 hover:text-red-400"><Trash2 size={10}/></button>}
              </div>
              <Input value={st?.link_social_1 || ''} onChange={(e) => setSt({...st, link_social_1: e.target.value})} placeholder="URL do Link 1 (ex: Insta)" className="h-8 text-[9px] bg-slate-900 border-slate-700 text-white" />
            </div>
         </div>

         {/* Link 2 (Padrão Zap / TikTok) */}
         <div className="bg-slate-800 p-2 rounded border border-slate-700 flex flex-col gap-2">
            <div className="flex gap-2 items-center">
              <div className="flex flex-col items-center gap-1 shrink-0">
                <div className="w-8 h-8 bg-slate-900 rounded border border-slate-700 relative overflow-hidden flex items-center justify-center">
                  {st?.icone_social_2 ? <img src={st.icone_social_2} className="w-5 h-5 object-contain" /> : <Upload size={12} className="text-slate-500"/>}
                  <input type="file" accept="image/*" onChange={(e) => handleImageUpload(e, 'icone_social_2')} className="absolute inset-0 opacity-0 cursor-pointer z-10" />
                </div>
                {st?.icone_social_2 && <button onClick={() => removeImageAndStorage('icone_social_2')} className="text-red-500 hover:text-red-400"><Trash2 size={10}/></button>}
              </div>
              <Input value={st?.link_social_2 || ''} onChange={(e) => setSt({...st, link_social_2: e.target.value})} placeholder="URL do Link 2 (ex: TikTok)" className="h-8 text-[9px] bg-slate-900 border-slate-700 text-white" />
            </div>
         </div>

         {/* Ícone Compartilhar */}
         <div className="flex items-center justify-between bg-slate-800 p-2.5 rounded border border-slate-700">
           <span className="text-[9px] text-slate-300 font-bold uppercase">Ícone de Compartilhar</span>
           <div className="flex gap-2 items-center">
              {st?.icone_compartilhar && <button onClick={() => removeImageAndStorage('icone_compartilhar')} className="text-red-500 hover:text-red-400"><Trash2 size={12}/></button>}
              <div className="w-8 h-8 bg-slate-900 rounded border border-slate-700 relative overflow-hidden flex items-center justify-center">
                {st?.icone_compartilhar ? <img src={st.icone_compartilhar} className="w-4 h-4 object-contain" /> : <Upload size={12} className="text-slate-500"/>}
                <input type="file" accept="image/*" onChange={(e) => handleImageUpload(e, 'icone_compartilhar')} className="absolute inset-0 opacity-0 cursor-pointer z-10" />
              </div>
           </div>
         </div>
         <p className="text-[8px] text-slate-500 font-bold uppercase text-center w-full block">Medida dos ícones: 100x100 px</p>
      </div>

      <div className="space-y-1 pt-4 border-t border-slate-700/50">
        <label className="text-[10px] font-bold text-slate-500 uppercase">Seu WhatsApp (Apenas Números)</label>
        <Input value={st?.whatsapp || ''} onChange={(e) => setSt({...st, whatsapp: e.target.value})} placeholder="Ex: 5585999999999" className="h-8 text-[10px] bg-slate-800 border-slate-700 text-white font-mono" />
      </div>
    </div>
  );