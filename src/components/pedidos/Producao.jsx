import React, { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import TaskItem from "@/components/tasks/TaskItem";
import EmptyState from "@/components/tasks/EmptyState";
import { ChevronDown, ChevronUp } from "lucide-react";

export default function Producao({ 
  activeTab, 
  pendingTasks, 
  completedTasks, 
  gruposPendentes,
  agPagamentoTasks, 
  handleToggle, 
  handleUpdate, 
  handleDelete, 
  handleEditOrder 
}) {
  
  // Estado para controlar quais colunas estão recolhidas (sanfona)
  const [isCollapsed, setIsCollapsed] = useState({
    hoje: false,
    amanha: false,
    proximos: false,
    agPagamento: false
  });

  const toggleCol = (col) => {
    setIsCollapsed(prev => ({ ...prev, [col]: !prev[col] }));
  };

  return (
    <>
      {activeTab === "pendentes" && (
        <div className="w-full">
          {(pendingTasks.length === 0 && agPagamentoTasks?.length === 0) ? <EmptyState type="pending" /> : (
            // AQUI ESTÁ A MÁGICA DA CENTRALIZAÇÃO: Flex wrap e Justify Center
            <div className="flex flex-wrap justify-center items-start gap-3 lg:gap-4 w-full">
              
              {/* COLUNA 1: HOJE / ATRASADOS */}
              {gruposPendentes.hoje.length > 0 && (
                <div className="flex flex-col bg-slate-50 p-2.5 rounded-xl border border-slate-200/60 shadow-[inset_0_1px_4px_rgba(0,0,0,0.02)] h-fit w-full sm:w-[calc(50%-0.75rem)] lg:w-[320px] xl:w-[340px] 2xl:w-[360px]">
                  <div 
                    onClick={() => toggleCol('hoje')}
                    className="flex items-center gap-2 px-1 pb-1 mb-2 cursor-pointer group"
                    title="Ocultar/Mostrar Pedidos"
                  >
                    <span className="text-[10px] font-bold uppercase tracking-widest text-rose-500">● Hoje / Atrasados</span>
                    <div className="h-px flex-1 bg-rose-200/50 group-hover:bg-rose-300/50 transition-colors"></div>
                    <span className="text-[9px] font-bold text-rose-500 bg-white border border-rose-100 px-1.5 py-0.5 rounded-full shadow-sm shrink-0">
                      {gruposPendentes.hoje.length}
                    </span>
                    {isCollapsed.hoje ? <ChevronDown size={14} className="text-rose-400" /> : <ChevronUp size={14} className="text-rose-400" />}
                  </div>
                  
                  <AnimatePresence>
                    {!isCollapsed.hoje && (
                      <motion.div 
                        initial={{ height: 0, opacity: 0 }} 
                        animate={{ height: 'auto', opacity: 1 }} 
                        exit={{ height: 0, opacity: 0 }}
                        className="flex flex-col gap-2.5 overflow-hidden"
                      >
                        <AnimatePresence mode="popLayout">
                          {gruposPendentes.hoje.map((t) => (
                            <motion.div key={t.id} layout initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}>
                              <TaskItem task={t} onToggle={handleToggle} onUpdate={handleUpdate} onDelete={handleDelete} onEdit={handleEditOrder} />
                            </motion.div>
                          ))}
                        </AnimatePresence>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}

              {/* COLUNA 2: AMANHÃ */}
              {gruposPendentes.amanha.length > 0 && (
                <div className="flex flex-col bg-slate-50 p-2.5 rounded-xl border border-slate-200/60 shadow-[inset_0_1px_4px_rgba(0,0,0,0.02)] h-fit w-full sm:w-[calc(50%-0.75rem)] lg:w-[320px] xl:w-[340px] 2xl:w-[360px]">
                  <div 
                    onClick={() => toggleCol('amanha')}
                    className="flex items-center gap-2 px-1 pb-1 mb-2 cursor-pointer group"
                    title="Ocultar/Mostrar Pedidos"
                  >
                    <span className="text-[10px] font-bold uppercase tracking-widest text-amber-500">○ Amanhã</span>
                    <div className="h-px flex-1 bg-amber-200/50 group-hover:bg-amber-300/50 transition-colors"></div>
                    <span className="text-[9px] font-bold text-amber-500 bg-white border border-amber-100 px-1.5 py-0.5 rounded-full shadow-sm shrink-0">
                      {gruposPendentes.amanha.length}
                    </span>
                    {isCollapsed.amanha ? <ChevronDown size={14} className="text-amber-400" /> : <ChevronUp size={14} className="text-amber-400" />}
                  </div>
                  
                  <AnimatePresence>
                    {!isCollapsed.amanha && (
                      <motion.div 
                        initial={{ height: 0, opacity: 0 }} 
                        animate={{ height: 'auto', opacity: 1 }} 
                        exit={{ height: 0, opacity: 0 }}
                        className="flex flex-col gap-2.5 overflow-hidden"
                      >
                        <AnimatePresence mode="popLayout">
                          {gruposPendentes.amanha.map((t) => (
                            <motion.div key={t.id} layout initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}>
                              <TaskItem task={t} onToggle={handleToggle} onUpdate={handleUpdate} onDelete={handleDelete} onEdit={handleEditOrder} />
                            </motion.div>
                          ))}
                        </AnimatePresence>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}

              {/* COLUNA 3: PRÓXIMOS */}
              {gruposPendentes.proximos.length > 0 && (
                <div className="flex flex-col bg-slate-50 p-2.5 rounded-xl border border-slate-200/60 shadow-[inset_0_1px_4px_rgba(0,0,0,0.02)] h-fit w-full sm:w-[calc(50%-0.75rem)] lg:w-[320px] xl:w-[340px] 2xl:w-[360px]">
                  <div 
                    onClick={() => toggleCol('proximos')}
                    className="flex items-center gap-2 px-1 pb-1 mb-2 cursor-pointer group"
                    title="Ocultar/Mostrar Pedidos"
                  >
                    <span className="text-[10px] font-bold uppercase tracking-widest text-blue-500">📅 Próximos</span>
                    <div className="h-px flex-1 bg-blue-200/50 group-hover:bg-blue-300/50 transition-colors"></div>
                    <span className="text-[9px] font-bold text-blue-500 bg-white border border-blue-100 px-1.5 py-0.5 rounded-full shadow-sm shrink-0">
                      {gruposPendentes.proximos.length}
                    </span>
                    {isCollapsed.proximos ? <ChevronDown size={14} className="text-blue-400" /> : <ChevronUp size={14} className="text-blue-400" />}
                  </div>
                  
                  <AnimatePresence>
                    {!isCollapsed.proximos && (
                      <motion.div 
                        initial={{ height: 0, opacity: 0 }} 
                        animate={{ height: 'auto', opacity: 1 }} 
                        exit={{ height: 0, opacity: 0 }}
                        className="flex flex-col gap-2.5 overflow-hidden"
                      >
                        <AnimatePresence mode="popLayout">
                          {gruposPendentes.proximos.map((t) => (
                            <motion.div key={t.id} layout initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}>
                              <TaskItem task={t} onToggle={handleToggle} onUpdate={handleUpdate} onDelete={handleDelete} onEdit={handleEditOrder} />
                            </motion.div>
                          ))}
                        </AnimatePresence>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}

              {/* COLUNA 4: AG. PAGAMENTO */}
              {agPagamentoTasks?.length > 0 && (
                <div className="flex flex-col bg-orange-50/40 p-2.5 rounded-xl border border-orange-200/60 shadow-[inset_0_1px_4px_rgba(0,0,0,0.02)] h-fit w-full sm:w-[calc(50%-0.75rem)] lg:w-[320px] xl:w-[340px] 2xl:w-[360px]">
                  <div 
                    onClick={() => toggleCol('agPagamento')}
                    className="flex items-center gap-2 px-1 pb-1 mb-2 cursor-pointer group"
                    title="Ocultar/Mostrar Pedidos"
                  >
                    <span className="text-[10px] font-bold uppercase tracking-widest text-orange-500">⏳ Ag. Pagto</span>
                    <div className="h-px flex-1 bg-orange-200/50 group-hover:bg-orange-300/50 transition-colors"></div>
                    <span className="text-[9px] font-bold text-orange-500 bg-white border border-orange-100 px-1.5 py-0.5 rounded-full shadow-sm shrink-0">
                      {agPagamentoTasks.length}
                    </span>
                    {isCollapsed.agPagamento ? <ChevronDown size={14} className="text-orange-400" /> : <ChevronUp size={14} className="text-orange-400" />}
                  </div>
                  
                  <AnimatePresence>
                    {!isCollapsed.agPagamento && (
                      <motion.div 
                        initial={{ height: 0, opacity: 0 }} 
                        animate={{ height: 'auto', opacity: 1 }} 
                        exit={{ height: 0, opacity: 0 }}
                        className="flex flex-col gap-2.5 overflow-hidden"
                      >
                        <AnimatePresence mode="popLayout">
                          {agPagamentoTasks.map((t) => (
                            <motion.div key={t.id} layout initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}>
                              <TaskItem task={t} onToggle={handleToggle} onUpdate={handleUpdate} onDelete={handleDelete} onEdit={handleEditOrder} />
                            </motion.div>
                          ))}
                        </AnimatePresence>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}

            </div>
          )}
        </div>
      )}

      {activeTab === "concluidas" && (
        <div className="space-y-2.5 w-full">
          {completedTasks.length === 0 ? (
             <div className="text-center py-16 bg-white rounded-xl border border-slate-200 shadow-sm w-full">
               <p className="text-slate-500 font-medium uppercase tracking-widest text-[10px]">Nenhum pedido totalmente concluído e pago.</p>
             </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 2xl:grid-cols-3 gap-3">
              {completedTasks.map((t) => (
                <TaskItem key={t.id} task={t} onToggle={handleToggle} onUpdate={handleUpdate} onDelete={handleDelete} onEdit={handleEditOrder} showUndo />
              ))}
            </div>
          )}
        </div>
      )}
    </>
  );
}