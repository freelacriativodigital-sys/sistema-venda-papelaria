import React from 'react';
import { ChevronDown, X } from "lucide-react";

export default function EditorSection({ id, title, icon: Icon, openSection, setOpenSection, children }) {
  const isOpen = openSection === id;
  return (
    <div className="lg:border-b lg:border-slate-700/50 pointer-events-auto">
      <button onClick={() => setOpenSection(isOpen ? '' : id)} className="hidden lg:flex w-full items-center justify-between p-3.5 hover:bg-slate-800 transition-colors">
        <div className="flex items-center gap-2.5 text-[10px] font-bold text-slate-300 uppercase tracking-widest">
          <Icon size={14} className="text-slate-400" /> {title}
        </div>
        <ChevronDown size={14} className={`text-slate-400 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      
      <div className={`
        transition-all duration-300 ease-in-out
        ${isOpen ? 'fixed inset-x-0 bottom-[64px] top-auto max-h-[80vh] bg-slate-900 z-[160] overflow-y-auto p-5 rounded-t-2xl shadow-[0_-20px_50px_rgba(0,0,0,0.7)] border-t border-slate-700 flex flex-col opacity-100' : 'fixed inset-x-0 bottom-[64px] max-h-0 opacity-0 overflow-hidden pointer-events-none'}
        lg:static lg:inset-auto lg:bottom-auto lg:rounded-none lg:shadow-none lg:border-none lg:bg-transparent lg:z-auto lg:pointer-events-auto
        lg:block ${isOpen ? 'lg:max-h-[1500px] lg:opacity-100 lg:p-4' : 'lg:max-h-0 lg:opacity-0 lg:overflow-hidden lg:p-0 lg:m-0'}
      `}>
        <div className="flex lg:hidden items-center justify-between mb-5 border-b border-slate-800 pb-3 shrink-0">
           <div className="flex items-center gap-2 text-[11px] font-bold text-white uppercase tracking-widest">
             <Icon size={16} className="text-blue-400" /> {title}
           </div>
           <button onClick={() => setOpenSection('')} className="bg-slate-800 p-1.5 rounded-full text-slate-400 hover:text-white"><X size={14}/></button>
        </div>
        <div className="space-y-4 pb-6 lg:pb-0">
          {children}
        </div>
      </div>
    </div>
  );
}