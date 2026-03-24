// src/lib/theme.js

export const theme = {
  // --- LAYOUT E CONTAINERS ---
  pageBackground: "min-h-screen bg-[#f8fafc] text-slate-900 pb-32",
  container: "max-w-7xl mx-auto space-y-6 px-4 sm:px-6 pt-8 animate-in fade-in",
  
  // O cartão padrão de todo o sistema
  card: "bg-white p-6 md:p-8 rounded-criarte border border-slate-200 shadow-sm",
  
  // --- TIPOGRAFIA (TEXTOS E TÍTULOS) ---
  h1: "text-2xl font-black uppercase text-slate-900 tracking-tight",
  subtitle: "text-[11px] font-bold text-slate-500 uppercase tracking-widest mt-1",
  h2: "text-xl font-black text-brand-dark uppercase leading-none",
  h3: "text-sm font-black uppercase text-slate-800 border-b border-slate-100 pb-4",
  label: "text-[10px] font-black uppercase text-slate-500 tracking-widest",
  
  // --- FORMULÁRIOS E INPUTS ---
  input: "h-12 w-full bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 text-sm focus:bg-white focus:border-brand focus:ring-2 focus:ring-brand/20 outline-none transition-all px-4",
  
  // --- BOTÕES PADRÃO (Eles usam as cores mágicas bg-brand e bg-brand-dark) ---
  btnPrimary: "h-12 bg-brand hover:brightness-110 text-white rounded-xl font-black uppercase text-[10px] px-6 shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2",
  btnDark: "h-12 bg-brand-dark hover:brightness-150 text-white rounded-xl font-black uppercase text-[10px] px-6 shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2",
  btnOutline: "h-12 border-2 border-slate-200 text-slate-600 hover:bg-slate-50 rounded-xl font-black uppercase text-[10px] px-4 transition-all flex items-center justify-center gap-2",
  btnGhost: "h-12 text-slate-500 hover:bg-slate-100 hover:text-slate-900 rounded-xl font-black uppercase text-[10px] px-4 transition-all flex items-center justify-center gap-2",
  btnDanger: "h-12 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl font-black uppercase text-[10px] px-4 transition-all flex items-center justify-center gap-2",
};