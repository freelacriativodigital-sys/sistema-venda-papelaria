import React from "react";
import { Palette, CheckCheck } from "lucide-react";

export default function EmptyState({ type = "pending" }) {
  if (type === "completed") {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="w-14 h-14 rounded-2xl bg-secondary flex items-center justify-center mb-4">
          <CheckCheck className="w-6 h-6 text-muted-foreground" />
        </div>
        <p className="text-sm font-medium text-muted-foreground">Nenhuma pendência concluída ainda</p>
        <p className="text-xs text-muted-foreground/60 mt-1">Quando concluir uma tarefa, ela aparecerá aqui</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
        <Palette className="w-6 h-6 text-primary" />
      </div>
      <p className="text-sm font-medium text-foreground">Tudo limpo!</p>
      <p className="text-xs text-muted-foreground mt-1">Adicione uma nova pendência para começar</p>
    </div>
  );
}