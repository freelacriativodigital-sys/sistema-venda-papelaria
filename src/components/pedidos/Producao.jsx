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
        <div className="space-y-5">
          {pendingTasks.length === 0 ? <EmptyState type="pending" /> : (
            <div className="flex flex-col gap-6">
              <AnimatePresence mode="popLayout">
                {gruposPendentes.hoje.length > 0 && (
                  <div className="space-y-2.5">
                    <div className="flex items-center gap-2 px-1">
                      <span className="text-[9px] font-semibold uppercase tracking-widest text-rose-500">● Entregar Hoje / Atrasados</span>
                      <div className="h-px flex-1 bg-rose-100"></div>
                    </div>
                    <div className="flex flex-col gap-2.5">
                      {gruposPendentes.hoje.map((t) => (
                        <motion.div key={t.id} layout initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}>
                          <TaskItem task={t} onToggle={handleToggle} onUpdate={handleUpdate} onDelete={handleDelete} onEdit={handleEditOrder} />
                        </motion.div>
                      ))}
                    </div>
                  </div>
                )}

                {gruposPendentes.amanha.length > 0 && (
                  <div className="space-y-2.5">
                    <div className="flex items-center gap-2 px-1">
                      <span className="text-[9px] font-semibold uppercase tracking-widest text-amber-500">○ Para Amanhã</span>
                      <div className="h-px flex-1 bg-amber-100"></div>
                    </div>
                    <div className="flex flex-col gap-2.5">
                      {gruposPendentes.amanha.map((t) => (
                        <motion.div key={t.id} layout initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}>
                          <TaskItem task={t} onToggle={handleToggle} onUpdate={handleUpdate} onDelete={handleDelete} onEdit={handleEditOrder} />
                        </motion.div>
                      ))}
                    </div>
                  </div>
                )}

                {gruposPendentes.proximos.length > 0 && (
                  <div className="space-y-2.5">
                    <div className="flex items-center gap-2 px-1">
                      <span className="text-[9px] font-semibold uppercase tracking-widest text-blue-400">📅 Próximas Entregas</span>
                      <div className="h-px flex-1 bg-blue-100/50"></div>
                    </div>
                    <div className="flex flex-col gap-2.5">
                      {gruposPendentes.proximos.map((t) => (
                        <motion.div key={t.id} layout initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}>
                          <TaskItem task={t} onToggle={handleToggle} onUpdate={handleUpdate} onDelete={handleDelete} onEdit={handleEditOrder} />
                        </motion.div>
                      ))}
                    </div>
                  </div>
                )}
              </AnimatePresence>
            </div>
          )}
        </div>
      )}

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