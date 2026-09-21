import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Plus, Search, Pencil, Trash2, Wrench, CheckCircle, XCircle, DollarSign } from "lucide-react";
import { useFerramentas, Ferramenta } from "@/hooks/useFerramentas";
import { useAuth } from "@/contexts/AuthContext";
import { FerramentaForm } from "@/components/Ferramentas/FerramentaForm";

export default function AdminFerramentas() {
  const { ferramentas, isLoading, createFerramenta, updateFerramenta, deleteFerramenta, isCreating, isUpdating } = useFerramentas();
  const { canEditAdmin } = useAuth();

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [formOpen, setFormOpen] = useState(false);
  const [editingFerramenta, setEditingFerramenta] = useState<Ferramenta | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [ferramentaToDelete, setFerramentaToDelete] = useState<Ferramenta | null>(null);

  const filtered = useMemo(() => {
    if (!ferramentas) return [];
    return ferramentas.filter((f) => {
      const matchesSearch =
        f.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
        f.usuario?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        f.centro_custo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        f.responsavel?.nome?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "ativa" && f.ativo) ||
        (statusFilter === "cancelada" && !f.ativo);
      return matchesSearch && matchesStatus;
    });
  }, [ferramentas, searchTerm, statusFilter]);

  const stats = useMemo(() => {
    if (!ferramentas) return { total: 0, ativas: 0, canceladas: 0 };
    return {
      total: ferramentas.length,
      ativas: ferramentas.filter((f) => f.ativo).length,
      canceladas: ferramentas.filter((f) => !f.ativo).length,
    };
  }, [ferramentas]);

  const valorTotal = useMemo(() => {
    return filtered.reduce((sum, f) => sum + (f.valor || 0), 0);
  }, [filtered]);

  const handleEdit = (f: Ferramenta) => {
    setEditingFerramenta(f);
    setFormOpen(true);
  };

  const confirmDelete = () => {
    if (ferramentaToDelete) {
      deleteFerramenta(ferramentaToDelete.id);
      setDeleteDialogOpen(false);
      setFerramentaToDelete(null);
    }
  };

  const handleFormSubmit = (data: any) => {
    if (data.id) {
      updateFerramenta(data);
    } else {
      createFerramenta(data);
    }
    setEditingFerramenta(null);
  };

  const handleFormClose = (open: boolean) => {
    setFormOpen(open);
    if (!open) setEditingFerramenta(null);
  };

  return (
    <>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold">Gestão de Ferramentas</h1>
            <p className="text-muted-foreground">Gerencie as ferramentas e softwares da empresa</p>
          </div>
          {canEditAdmin && (
            <Button onClick={() => setFormOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Nova Ferramenta
            </Button>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total</CardTitle>
              <Wrench className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent><div className="text-2xl font-bold">{stats.total}</div></CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Ativas</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent><div className="text-2xl font-bold">{stats.ativas}</div></CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Canceladas</CardTitle>
              <XCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent><div className="text-2xl font-bold">{stats.canceladas}</div></CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Valor Total</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent><div className="text-2xl font-bold">{valorTotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</div></CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nome, usuário, centro de custo ou responsável..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="ativa">Ativas</SelectItem>
                  <SelectItem value="cancelada">Canceladas</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Table */}
        <Card>
          <CardContent className="pt-6">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
              </div>
            ) : filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <Wrench className="h-12 w-12 mb-4 opacity-50" />
                <p>Nenhuma ferramenta encontrada.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome</TableHead>
                      <TableHead className="hidden md:table-cell">Usuário</TableHead>
                      <TableHead className="hidden lg:table-cell">Cartão</TableHead>
                      <TableHead className="hidden lg:table-cell">Centro de Custo</TableHead>
                      
                      <TableHead className="hidden md:table-cell">Valor</TableHead>
                      <TableHead>Status</TableHead>
                      {canEditAdmin && <TableHead className="text-right">Ações</TableHead>}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.map((f) => (
                      <TableRow key={f.id} className={!f.ativo ? "opacity-50" : ""}>
                        <TableCell className="font-medium">
                          <div>
                            {f.nome}
                            {f.link_acesso && (
                              <a
                                href={f.link_acesso}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="block text-xs text-primary hover:underline truncate max-w-[200px]"
                              >
                                {f.link_acesso}
                              </a>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="hidden md:table-cell">{f.usuario || "-"}</TableCell>
                        <TableCell className="hidden lg:table-cell">{f.cartao_cadastrado || "-"}</TableCell>
                        <TableCell className="hidden lg:table-cell">{f.centro_custo || "-"}</TableCell>
                        
                        <TableCell className="hidden md:table-cell">
                          {f.valor != null ? (
                            <div>
                              {f.valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                              {f.tipo_pagamento && (
                                <span className="block text-xs text-muted-foreground">{f.tipo_pagamento === 'mensal' ? 'Mensal' : 'Anual'}</span>
                              )}
                            </div>
                          ) : "-"}
                        </TableCell>
                        <TableCell>
                          <Badge variant={f.ativo ? "default" : "destructive"}>
                            {f.ativo ? "Ativa" : "Cancelada"}
                          </Badge>
                        </TableCell>
                        {canEditAdmin && (
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button variant="ghost" size="icon" onClick={() => handleEdit(f)}>
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => {
                                  setFerramentaToDelete(f);
                                  setDeleteDialogOpen(true);
                                }}
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </div>
                          </TableCell>
                        )}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <FerramentaForm
        open={formOpen}
        onOpenChange={handleFormClose}
        ferramenta={editingFerramenta}
        onSubmit={handleFormSubmit}
        isLoading={isCreating || isUpdating}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Ferramenta</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir a ferramenta "{ferramentaToDelete?.nome}"? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
