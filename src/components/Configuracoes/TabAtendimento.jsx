import React from 'react';
import { MessageCircle, Instagram, Facebook, Mail, Smartphone, HelpCircle, Share2 } from "lucide-react";
import { Input } from "@/components/ui/input";

export default function TabAtendimento({ st, setSt }) {
  return (
    <div className="space-y-10 animate-in fade-in duration-500">
      
      {/* SEÇÃO 1: WHATSAPP */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <MessageCircle size={18} className="text-slate-400" />
          <h2 className="text-lg font-bold text-slate-800">Canais de Atendimento</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50 p-6 rounded-2xl border border-slate-100">
          
          {/* WhatsApp Pedidos */}
          <div className="flex flex-col gap-2">
            <label className="text-[11px] font-bold text-emerald-600 uppercase tracking-widest flex items-center gap-1.5">
              <Smartphone size={14} /> WhatsApp (Pedidos)
            </label>
            <p className="text-[10px] text-slate-500 font-medium mb-1">Número que receberá a mensagem com o carrinho do Catálogo.</p>
            <Input 
              value={st?.whatsapp || ''} 
              onChange={(e) => setSt({...st, whatsapp: e.target.value})} 
              placeholder="Ex: 5585999999999" 
              className="h-12 bg-white border-slate-200 text-slate-800 font-medium text-sm rounded-xl" 
            />
          </div>

          {/* WhatsApp SAC */}
          <div className="flex flex-col gap-2">
            <label className="text-[11px] font-bold text-blue-600 uppercase tracking-widest flex items-center gap-1.5">
              <HelpCircle size={14} /> WhatsApp (Suporte / SAC)
            </label>
            <p className="text-[10px] text-slate-500 font-medium mb-1">Número exclusivo para tirar dúvidas dos clientes.</p>
            <Input 
              value={st?.whatsapp_sac || ''} 
              onChange={(e) => setSt({...st, whatsapp_sac: e.target.value})} 
              placeholder="Ex: 5585888888888" 
              className="h-12 bg-white border-slate-200 text-slate-800 font-medium text-sm rounded-xl" 
            />
          </div>

        </div>
      </section>

      {/* SEÇÃO 2: REDES SOCIAIS */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <Share2 size={18} className="text-slate-400" />
          <h2 className="text-lg font-bold text-slate-800">Redes Sociais</h2>
        </div>
        
        <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 flex flex-col gap-5">
          <p className="text-[11px] text-slate-500 font-medium mb-2">
            Preencha os links dos seus perfis. Deixe em branco os que não quiser exibir. No futuro, os ícones aparecerão magicamente onde precisar!
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Instagram */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-bold text-slate-600 uppercase flex items-center gap-1.5">
                <Instagram size={14} className="text-pink-600" /> Instagram
              </label>
              <Input 
                value={st?.link_instagram || ''} 
                onChange={(e) => setSt({...st, link_instagram: e.target.value})} 
                placeholder="https://instagram.com/suamarca" 
                className="h-10 bg-white border-slate-200 text-slate-800 text-sm rounded-lg" 
              />
            </div>

            {/* TikTok */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-bold text-slate-600 uppercase flex items-center gap-1.5">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-800"><path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5"/></svg> 
                TikTok
              </label>
              <Input 
                value={st?.link_tiktok || ''} 
                onChange={(e) => setSt({...st, link_tiktok: e.target.value})} 
                placeholder="https://tiktok.com/@suamarca" 
                className="h-10 bg-white border-slate-200 text-slate-800 text-sm rounded-lg" 
              />
            </div>

            {/* Facebook */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-bold text-slate-600 uppercase flex items-center gap-1.5">
                <Facebook size={14} className="text-blue-600" /> Facebook
              </label>
              <Input 
                value={st?.link_facebook || ''} 
                onChange={(e) => setSt({...st, link_facebook: e.target.value})} 
                placeholder="https://facebook.com/suamarca" 
                className="h-10 bg-white border-slate-200 text-slate-800 text-sm rounded-lg" 
              />
            </div>

            {/* E-mail */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-bold text-slate-600 uppercase flex items-center gap-1.5">
                <Mail size={14} className="text-slate-600" /> E-mail Profissional
              </label>
              <Input 
                type="email"
                value={st?.link_email || ''} 
                onChange={(e) => setSt({...st, link_email: e.target.value})} 
                placeholder="contato@suamarca.com.br" 
                className="h-10 bg-white border-slate-200 text-slate-800 text-sm rounded-lg" 
              />
            </div>
          </div>

        </div>
      </section>

    </div>
  );
}