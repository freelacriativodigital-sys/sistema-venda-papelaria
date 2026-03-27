import React from 'react';
import { MessageCircle, Instagram, Mail, MapPin } from "lucide-react";

export default function FooterSite({ st }) {
  return (
    <footer className="bg-slate-950 text-slate-400 pt-12 pb-32 md:pb-8 border-t-[6px] mt-16 transition-colors duration-300" style={{ borderColor: st?.cor_principal || '#f472b6' }}>
      <div className="max-w-7xl mx-auto px-4 md:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 mb-12">
          <div className="space-y-3 text-center md:text-left">
            <h2 className="text-xl font-black uppercase tracking-tighter text-white italic transition-colors duration-300" style={{ color: st?.cor_principal }}>{st?.nome_loja}</h2>
            <p className="text-[11px] font-medium leading-relaxed max-w-sm mx-auto md:mx-0 text-slate-500">{st?.texto_sobre}</p>
          </div>
          <div className="space-y-4 text-center md:text-left flex flex-col items-center md:items-start">
            <h3 className="text-white font-bold uppercase tracking-widest text-[10px]">Canais de Atendimento</h3>
            <div className="flex flex-col gap-3">
              {st?.whatsapp && (
                <button onClick={() => window.open(`https://wa.me/${st.whatsapp.replace(/\D/g, '')}`, '_blank')} className="flex items-center gap-2 hover:text-white transition-colors text-[11px] font-bold uppercase tracking-wide">
                  <MessageCircle size={16} className="text-[#25D366]" fill="currentColor" /> WhatsApp Oficial
                </button>
              )}
              {st?.instagram && (
                <button onClick={() => window.open(st.instagram.includes('http') ? st.instagram : `https://instagram.com/${st.instagram}`, '_blank')} className="flex items-center gap-2 hover:text-white transition-colors text-[11px] font-bold uppercase tracking-wide">
                  <Instagram size={16} className="text-pink-500" /> Instagram
                </button>
              )}
              {st?.email && (
                <button onClick={() => window.open(`mailto:${st.email}`, '_blank')} className="flex items-center gap-2 hover:text-white transition-colors text-[11px] font-bold uppercase tracking-wide">
                  <Mail size={16} className="text-blue-400" /> E-mail
                </button>
              )}
              {st?.endereco && (
                <p className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wide text-slate-500 mt-2">
                  <MapPin size={16} /> {st.endereco}
                </p>
              )}
            </div>
          </div>
          <div className="space-y-3 text-center md:text-left">
            <h3 className="text-white font-bold uppercase tracking-widest text-[10px] mb-1">Compra 100% Segura</h3>
            <p className="text-[11px] font-medium leading-relaxed text-slate-500">
              Seu pedido é fechado diretamente via WhatsApp com nosso time. Atendimento humano, rápido e sem complicações.
            </p>
          </div>
        </div>
        <div className="pt-6 border-t border-white/10 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-slate-600 text-center md:text-left">{st?.copyright}</p>
        </div>
      </div>
    </footer>
  );
}