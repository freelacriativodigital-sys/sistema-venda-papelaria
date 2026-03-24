import React, { useState } from "react";
import { base44 as db } from "../../api";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Trash2, Tag, X, Loader2 } from "lucide-react";

export default function CategoryManager({ onClose }) {
  const [newName, setNewName] = useState("");
  const queryClient = useQueryClient();

  // Busca as categorias personalizadas
  const { data: customCats = [], isLoading } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const res = await db.get("Category");
      return Array.isArray(res) ? res : [];
    },
  });

  // Mutação de criação
  const createMutation = useMutation({
    mutationFn: (data) => db.create("Category", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      setNewName("");
    },
  });

  // Mutação de exclusão REFORMULADA
  const deleteMutation = useMutation({
    mutationFn: (id) => db.delete("Category", id),
    onSuccess: () => {
      // Força a atualização de todos os seletores de categoria do app
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      queryClient.invalidateQueries({ queryKey: ["art-tasks"] });
    },
    onError: (error) => {
      console.error("Erro ao deletar categoria:", error);
      alert("Não foi possível excluir. Verifique se há pedidos usando esta categoria.");
    }
  });

  const handleAdd = () => {
    if (!newName.trim() || createMutation.isPending) return;
    const slug = newName.trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, "_");
    createMutation.mutate({ name: newName.trim(), slug });
  };

  return (
    <div className="space-y-4 p-1">
      <div className="flex items-center justify-between">
        <h3 className="text-[10px] font-black text-foreground uppercase tracking-[0.2em]">Gerenciar Categorias</h3>
        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onClose}><X className="w-4 h-4" /></Button>
      </div>
      
      <div className="bg-secondary/20 rounded-xl p-2 max-h-[250px] overflow-y-auto border border-border/10">
        {isLoading ? (
          <div className="flex justify-center p-4"><Loader2 className="w-4 h-4 animate-spin text-primary" /></div>
        ) : customCats.length === 0 ? (
          <div className="py-8 text-center">
            <Tag className="w-6 h-6 text-muted-foreground/20 mx-auto mb-2" />
            <p className="text-[10px] text-muted-foreground uppercase font-bold">Nenhuma categoria</p>
          </div>
        ) : (
          <div className="space-y-1">
            {customCats.map((cat) => (
              <div key={cat.id} className="flex items-center justify-between bg-background/50 p-2 rounded-lg border border-border/5 group">
                <div className="flex items-center gap-2">
                  <Tag className="w-3 h-3 text-primary/60" />
                  <span className="text-xs font-semibold text-foreground">{cat.name}</span>
                </div>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-8 w-8 text-destructive hover:bg-destructive/10 transition-colors" 
                  disabled={deleteMutation.isPending}
                  onClick={() => {
                    if (confirm(`Excluir "${cat.name}"?`)) {
                      deleteMutation.mutate(cat.id);
                    }
                  }}
                >
                  {deleteMutation.isPending ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Trash2 className="w-4 h-4" />
                  )}
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="flex gap-2 bg-secondary/10 p-1 rounded-xl border border-border/5">
        <Input
          placeholder="Ex: Papelaria, Copos..."
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          className="h-10 text-xs bg-background border-0 focus-visible:ring-1"
        />
        <Button 
          size="sm" 
          className="h-10 bg-primary hover:bg-primary/90 px-4 shadow-md" 
          onClick={handleAdd}
          disabled={createMutation.isPending}
        >
          {createMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4 mr-1" />}
          Criar
        </Button>
      </div>
    </div>
  );
}