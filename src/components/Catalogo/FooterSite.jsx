import React from 'react';
import { MessageCircle, Instagram, Facebook, Mail, MapPin, HelpCircle } from "lucide-react";

// Ícone do TikTok personalizado
const TikTokIcon = ({ size = 16 }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5"/>
  </svg>
);

export default function FooterSite({ st }) {
  return (
    <footer className="bg-slate-950 text-slate-400 pt-12 pb-32 md:pb-8 border-t-[6px] mt-16 transition-colors duration-300" style={{ borderColor: st?.cor_principal || '#f472b6' }}>
      <div className="max-w-7xl mx-auto px-4 md:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 mb-12">
          
          <div className="space-y-3 text-center md:text-left">
            <h2 className="text-xl font-black uppercase tracking-tighter text-white italic transition-colors duration-300" style={{ color: st?.cor_principal }}>{st?.nome_loja}</h2>
            <p className="text-[11px] font-medium leading-relaxed max-w-sm mx-auto md:mx-0 text-slate-500">{st?.texto_sobre}</p>
            {st?.documento && <p className="text-[10px] font-bold text-slate-600 mt-2">CNPJ/CPF: {st.documento}</p>}
          </div>

          <div className="space-y-4 text-center md:text-left flex flex-col items-center md:items-start">
            <h3 className="text-white font-bold uppercase tracking-widest text-[10px]">Canais de Atendimento</h3>
            <div className="flex flex-col gap-3">
              {st?.whatsapp && (
                <button onClick={() => window.open(`https://wa.me/${st.whatsapp.replace(/\D/g, '')}`, '_blank')} className="flex items-center gap-2 hover:text-white transition-colors text-[11px] font-bold uppercase tracking-wide">
                  <MessageCircle size={16} className="text-[#25D366]" fill="currentColor" /> WhatsApp (Pedidos)
                </button>
              )}
              {st?.whatsapp_sac && (
                <button onClick={() => window.open(`https://wa.me/${st.whatsapp_sac.replace(/\D/g, '')}`, '_blank')} className="flex items-center gap-2 hover:text-white transition-colors text-[11px] font-bold uppercase tracking-wide">
                  <HelpCircle size={16} className="text-blue-400" /> Suporte / SAC
                </button>
              )}
              {st?.link_instagram && (
                <button onClick={() => window.open(st.link_instagram, '_blank')} className="flex items-center gap-2 hover:text-white transition-colors text-[11px] font-bold uppercase tracking-wide">
                  <Instagram size={16} className="text-pink-500" /> Instagram
                </button>
              )}
              {st?.link_tiktok && (
                <button onClick={() => window.open(st.link_tiktok, '_blank')} className="flex items-center gap-2 hover:text-white transition-colors text-[11px] font-bold uppercase tracking-wide">
                  <TikTokIcon size={16} className="text-slate-300" /> TikTok
                </button>
              )}
              {st?.link_facebook && (
                <button onClick={() => window.open(st.link_facebook, '_blank')} className="flex items-center gap-2 hover:text-white transition-colors text-[11px] font-bold uppercase tracking-wide">
                  <Facebook size={16} className="text-blue-600" /> Facebook
                </button>
              )}
              {st?.link_email && (
                <button onClick={() => window.open(`mailto:${st.link_email}`, '_blank')} className="flex items-center gap-2 hover:text-white transition-colors text-[11px] font-bold uppercase tracking-wide">
                  <Mail size={16} className="text-slate-300" /> E-mail
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
          <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-slate-600 text-center md:text-left">
            {st?.copyright || `© ${new Date().getFullYear()} ${st?.nome_loja || 'Minha Loja'}`}
          </p>
        </div>
      </div>
    </footer>
  );
}