import React from 'react';
import { X, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { motion } from "framer-motion";

export default function CategoriaModal({ 
  setIsCategoryModalOpen, 
  categorias, 
  handleRemoveCategory, 
  newCategoryName, 
  setNewCategoryName, 
  handleAddCategory 
}) {
  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsCategoryModalOpen(false)} className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" />
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
        className="relative w-full max-w-sm bg-white rounded-xl shadow-xl overflow-hidden p-5">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-semibold text-xs uppercase tracking-widest text-slate-800">Gerenciar Categorias</h3>
          <button onClick={() => setIsCategoryModalOpen(false)} className="bg-slate-50 p-1.5 rounded-md hover:bg-slate-100 transition-colors"><X size={14} className="text-slate-500" /></button>
        </div>
        <div className="space-y-2 max-h-[300px] overflow-y-auto mb-4 pr-1">
          {categorias.map((cat) => (
            <div key={cat} className="flex items-center justify-between p-2.5 bg-slate-50 rounded-md border border-slate-200 group hover:border-slate-300 transition-colors">
              <span className="text-[10px] font-semibold text-slate-700 uppercase">{cat}</span>
              {cat !== 'Sem Categoria' && (
                <button onClick={() => handleRemoveCategory(cat)} className="text-slate-400 hover:text-red-500 transition-colors"><Trash2 size={12} /></button>
              )}
            </div>
          ))}
        </div>
        <div className="flex flex-col sm:flex-row gap-2 pt-3 border-t border-slate-100">
          <Input placeholder="Nova categoria..." value={newCategoryName} onChange={(e) => setNewCategoryName(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleAddCategory()} className="h-9 border-slate-200 bg-white rounded-md font-medium uppercase text-[10px] w-full shadow-sm" />
          <Button onClick={handleAddCategory} className="bg-blue-600 hover:bg-blue-700 text-white h-9 px-4 rounded-md font-semibold uppercase text-[9px] shadow-sm w-full sm:w-auto transition-colors">Add</Button>
        </div>
      </motion.div>
    </div>
  );
}