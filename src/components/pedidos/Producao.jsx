import React from "react";
import { AnimatePresence, motion } from "framer-motion";
import TaskItem from "@/components/tasks/TaskItem";
import EmptyState from "@/components/tasks/EmptyState";

export default function Producao({ 
  activeTab, 
  pendingTasks, 
  completedTasks, 
  gruposPendentes, 
  handleToggle, 
  handleUpdate, 
  handleDelete, 
  handleEditOrder 
}) {
  return (
    <>
      {activeTab === "pendentes" && (
        <div className="w-full">
          {pendingTasks.length === 0 ? <EmptyState type="pending" /> : (
            /* A MÁGICA ESTÁ AQUI: Grid dividindo em 3 colunas nas telas grandes */
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-start">
              
              {/* COLUNA 1: HOJE / ATRASADOS */}
              <div className="flex flex-col gap-3 bg-slate-50 p-2.5 rounded-xl border border-slate-200/60 min-h-[150px] shadow-[inset_0_1px_4px_rgba(0,0,0,0.02)]">
                <div className="flex items-center gap-2 px-1 pb-1">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-rose-500">● Hoje / Atrasados</span>
                  <div className="h-px flex-1 bg-rose-200/50"></div>
                  <span className="text-[9px] font-bold text-rose-500 bg-white border border-rose-100 px-1.5 py-0.5 rounded-full shadow-sm">
                    {gruposPendentes.hoje.length}
                  </span>
                </div>
                <div className="flex flex-col gap-2.5">
                  <AnimatePresence mode="popLayout">
                    {gruposPendentes.hoje.map((t) => (
                      <motion.div key={t.id} layout initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}>
                        <TaskItem task={t} onToggle={handleToggle} onUpdate={handleUpdate} onDelete={handleDelete} onEdit={handleEditOrder} />
                      </motion.div>
                    ))}
                  </AnimatePresence>
                  {gruposPendentes.hoje.length === 0 && (
                    <div className="text-center py-8 text-[9px] font-bold uppercase tracking-widest text-slate-300 border-2 border-dashed border-slate-200 rounded-lg bg-white/50">
                      Livre
                    </div>
                  )}
                </div>
              </div>

              {/* COLUNA 2: AMANHÃ */}
              <div className="flex flex-col gap-3 bg-slate-50 p-2.5 rounded-xl border border-slate-200/60 min-h-[150px] shadow-[inset_0_1px_4px_rgba(0,0,0,0.02)]">
                <div className="flex items-center gap-2 px-1 pb-1">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-amber-500">○ Amanhã</span>
                  <div className="h-px flex-1 bg-amber-200/50"></div>
                  <span className="text-[9px] font-bold text-amber-500 bg-white border border-amber-100 px-1.5 py-0.5 rounded-full shadow-sm">
                    {gruposPendentes.amanha.length}
                  </span>
                </div>
                <div className="flex flex-col gap-2.5">
                  <AnimatePresence mode="popLayout">
                    {gruposPendentes.amanha.map((t) => (
                      <motion.div key={t.id} layout initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}>
                        <TaskItem task={t} onToggle={handleToggle} onUpdate={handleUpdate} onDelete={handleDelete} onEdit={handleEditOrder} />
                      </motion.div>
                    ))}
                  </AnimatePresence>
                  {gruposPendentes.amanha.length === 0 && (
                    <div className="text-center py-8 text-[9px] font-bold uppercase tracking-widest text-slate-300 border-2 border-dashed border-slate-200 rounded-lg bg-white/50">
                      Livre
                    </div>
                  )}
                </div>
              </div>

              {/* COLUNA 3: PRÓXIMOS */}
              <div className="flex flex-col gap-3 bg-slate-50 p-2.5 rounded-xl border border-slate-200/60 min-h-[150px] shadow-[inset_0_1px_4px_rgba(0,0,0,0.02)]">
                <div className="flex items-center gap-2 px-1 pb-1">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-blue-500">📅 Próximos</span>
                  <div className="h-px flex-1 bg-blue-200/50"></div>
                  <span className="text-[9px] font-bold text-blue-500 bg-white border border-blue-100 px-1.5 py-0.5 rounded-full shadow-sm">
                    {gruposPendentes.proximos.length}
                  </span>
                </div>
                <div className="flex flex-col gap-2.5">
                  <AnimatePresence mode="popLayout">
                    {gruposPendentes.proximos.map((t) => (
                      <motion.div key={t.id} layout initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}>
                        <TaskItem task={t} onToggle={handleToggle} onUpdate={handleUpdate} onDelete={handleDelete} onEdit={handleEditOrder} />
                      </motion.div>
                    ))}
                  </AnimatePresence>
                  {gruposPendentes.proximos.length === 0 && (
                    <div className="text-center py-8 text-[9px] font-bold uppercase tracking-widest text-slate-300 border-2 border-dashed border-slate-200 rounded-lg bg-white/50">
                      Livre
                    </div>
                  )}
                </div>
              </div>

            </div>
          )}
        </div>
      )}

      {/* A ABA DE CONCLUÍDAS CONTINUA EM LISTA ÚNICA NORMAL */}
      {activeTab === "concluidas" && (
        <div className="space-y-2.5">
          {completedTasks.map((t) => (
            <TaskItem key={t.id} task={t} onToggle={handleToggle} onUpdate={handleUpdate} onDelete={handleDelete} onEdit={handleEditOrder} showUndo />
          ))}
        </div>
      )}
    </>
  );
}