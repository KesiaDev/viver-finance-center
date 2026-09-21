import { useState, useMemo } from "react";
import { Pencil, Trash2, KeyRound, Eye, UserCheck, UserX, X, Filter, Cake, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Colaborador, useColaboradores } from "@/hooks/useColaboradores";
import { ColaboradorForm } from "./ColaboradorForm";
import { ResetPasswordDialog } from "./ResetPasswordDialog";
import { DeleteConfirmDialog } from "@/components/Dashboard/DeleteConfirmDialog";
import { ColaboradorDetalhes } from "./ColaboradorDetalhes";

interface ColaboradoresListProps {
  searchQuery: string;
  setSearchQuery: (value: string) => void;
  statusFilter: string;
  setStatusFilter: (value: string) => void;
  funcaoFilter: string;
  setFuncaoFilter: (value: string) => void;
  areaFilter: string;
  setAreaFilter: (value: string) => void;
  mesAniversarioFilter: string;
  setMesAniversarioFilter: (value: string) => void;
  contaFilter: string;
  setContaFilter: (value: string) => void;
  colaboradores: Colaborador[];
  filteredColaboradores: Colaborador[];
  canEdit?: boolean;
}

export const ColaboradoresList = ({
  searchQuery,
  setSearchQuery,
  statusFilter,
  setStatusFilter,
  funcaoFilter,
  setFuncaoFilter,
  areaFilter,
  setAreaFilter,
  mesAniversarioFilter,
  setMesAniversarioFilter,
  contaFilter,
  setContaFilter,
  colaboradores,
  filteredColaboradores,
  canEdit = true,
}: ColaboradoresListProps) => {
  const { 
    isLoading, 
    updateColaborador, 
    deleteColaborador, 
    batchUpdateColaboradores,
    batchDeleteColaboradores,
    isUpdating, 
    isDeleting,
    isBatchUpdating,
    isBatchDeleting 
  } = useColaboradores();
  
  const [editingColaborador, setEditingColaborador] = useState<Colaborador | null>(null);
  const [viewingColaborador, setViewingColaborador] = useState<Colaborador | null>(null);
  const [resetPasswordColaborador, setResetPasswordColaborador] = useState<Colaborador | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showBatchDelete, setShowBatchDelete] = useState(false);

  // Extract unique values for filters
  const uniqueAreas = useMemo(() => {
    if (!colaboradores) return [];
    return [...new Set(colaboradores.map(c => c.area).filter(Boolean))].sort();
  }, [colaboradores]);

  const uniqueFuncoes = useMemo(() => {
    if (!colaboradores) return [];
    return [...new Set(colaboradores.map(c => c.funcao).filter(Boolean))].sort();
  }, [colaboradores]);

  const hasActiveFilters = searchQuery !== "" || statusFilter !== "todos" || funcaoFilter !== "todos" || areaFilter !== "todos" || mesAniversarioFilter !== "todos" || contaFilter !== "todos";

  const clearFilters = () => {
    setSearchQuery("");
    setStatusFilter("todos");
    setFuncaoFilter("todos");
    setAreaFilter("todos");
    setMesAniversarioFilter("todos");
    setContaFilter("todos");
  };

  const isAllSelected = filteredColaboradores.length > 0 && selectedIds.size === filteredColaboradores.length;
  const isSomeSelected = selectedIds.size > 0;

  const toggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredColaboradores.map(c => c.id)));
    }
  };

  const toggleSelect = (id: string) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelectedIds(newSet);
  };

  const handleBatchActivate = () => {
    batchUpdateColaboradores({ ids: Array.from(selectedIds), updates: { ativo: true } });
    setSelectedIds(new Set());
  };

  const handleBatchDeactivate = () => {
    batchUpdateColaboradores({ ids: Array.from(selectedIds), updates: { ativo: false } });
    setSelectedIds(new Set());
  };

  const handleBatchDelete = () => {
    batchDeleteColaboradores(Array.from(selectedIds));
    setSelectedIds(new Set());
    setShowBatchDelete(false);
  };

  const handleEdit = (colaborador: Colaborador) => {
    setEditingColaborador(colaborador);
  };

  const handleUpdate = (data: any) => {
    if (editingColaborador) {
      // Converter strings vazias para null nos campos de data
      const sanitizedData = {
        ...data,
        data_fim_contrato: data.data_fim_contrato || null,
        data_nascimento: data.data_nascimento || null,
      };
      updateColaborador({ id: editingColaborador.id, ...sanitizedData });
      setEditingColaborador(null);
    }
  };

  const handleDelete = () => {
    if (deletingId) {
      deleteColaborador(deletingId);
      setDeletingId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-muted-foreground">Carregando colaboradores...</p>
        </div>
      </div>
    );
  }

  if (!colaboradores || colaboradores.length === 0) {
    return (
      <div className="text-center p-8 border border-subtle rounded-lg bg-card-dark">
        <p className="text-muted-foreground">Nenhum colaborador cadastrado ainda.</p>
      </div>
    );
  }

  return (
    <>
      {/* Filters */}
      <div className="flex gap-3 mb-4 items-center overflow-x-auto pb-2">
        {/* Campo de Pesquisa */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome, email, CPF ou CNPJ..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 w-[280px]"
          />
        </div>

        <div className="flex items-center gap-2 text-muted-foreground">
          <Filter className="w-4 h-4" />
          <span className="text-sm font-medium">Filtros:</span>
        </div>

        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos os Status</SelectItem>
            <SelectItem value="ativo">Ativo</SelectItem>
            <SelectItem value="inativo">Inativo</SelectItem>
          </SelectContent>
        </Select>

        <Select value={areaFilter} onValueChange={setAreaFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Área" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todas as Áreas</SelectItem>
            {uniqueAreas.map(area => (
              <SelectItem key={area} value={area}>{area}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={funcaoFilter} onValueChange={setFuncaoFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Função" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todas as Funções</SelectItem>
            {uniqueFuncoes.map(funcao => (
              <SelectItem key={funcao} value={funcao}>{funcao}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={mesAniversarioFilter} onValueChange={setMesAniversarioFilter}>
          <SelectTrigger className="w-[180px]">
            <div className="flex items-center gap-2">
              <Cake className="w-4 h-4" />
              <SelectValue placeholder="Aniversariantes" />
            </div>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Aniversários</SelectItem>
            <SelectItem value="1">Janeiro</SelectItem>
            <SelectItem value="2">Fevereiro</SelectItem>
            <SelectItem value="3">Março</SelectItem>
            <SelectItem value="4">Abril</SelectItem>
            <SelectItem value="5">Maio</SelectItem>
            <SelectItem value="6">Junho</SelectItem>
            <SelectItem value="7">Julho</SelectItem>
            <SelectItem value="8">Agosto</SelectItem>
            <SelectItem value="9">Setembro</SelectItem>
            <SelectItem value="10">Outubro</SelectItem>
            <SelectItem value="11">Novembro</SelectItem>
            <SelectItem value="12">Dezembro</SelectItem>
          </SelectContent>
        </Select>

        <Select value={contaFilter} onValueChange={setContaFilter}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Conta" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todas as Contas</SelectItem>
            <SelectItem value="ativa">Ativa</SelectItem>
            <SelectItem value="pendente">Pendente</SelectItem>
          </SelectContent>
        </Select>

        {hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={clearFilters}>
            <X className="w-4 h-4 mr-1" />
            Limpar
          </Button>
        )}

        <span className="text-sm text-muted-foreground ml-auto">
          Mostrando {filteredColaboradores.length} de {colaboradores.length}
        </span>
      </div>

      <div className="rounded-lg border border-subtle bg-card-dark overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent border-subtle">
              {canEdit && (
                <TableHead className="w-12">
                  <Checkbox 
                    checked={isAllSelected}
                    onCheckedChange={toggleSelectAll}
                  />
                </TableHead>
              )}
              <TableHead>Nome</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>CPF</TableHead>
              <TableHead>CNPJ</TableHead>
              <TableHead>Data Nasc.</TableHead>
              <TableHead>Área</TableHead>
              <TableHead>Função</TableHead>
              <TableHead>Remuneração</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Conta</TableHead>
              <TableHead>Permissão</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredColaboradores.map((colaborador) => (
              <TableRow 
                key={colaborador.id} 
                className={`border-subtle ${selectedIds.has(colaborador.id) ? 'bg-primary/5' : ''}`}
              >
                {canEdit && (
                  <TableCell>
                    <Checkbox 
                      checked={selectedIds.has(colaborador.id)}
                      onCheckedChange={() => toggleSelect(colaborador.id)}
                    />
                  </TableCell>
                )}
                <TableCell className="font-medium">{colaborador.nome}</TableCell>
                <TableCell className="text-muted-foreground">{colaborador.email}</TableCell>
                <TableCell className="font-mono text-sm">{colaborador.cpf}</TableCell>
                <TableCell className="font-mono text-sm text-muted-foreground">
                  {colaborador.cnpj || "-"}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {colaborador.data_nascimento 
                    ? new Date(colaborador.data_nascimento + 'T00:00:00').toLocaleDateString('pt-BR') 
                    : "-"}
                </TableCell>
                <TableCell>{colaborador.area}</TableCell>
                <TableCell>{colaborador.funcao}</TableCell>
                <TableCell>
                  R$ {colaborador.remuneracao.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </TableCell>
                <TableCell>
                  <Badge variant={colaborador.ativo ? "default" : "secondary"}>
                    {colaborador.ativo ? "Ativo" : "Inativo"}
                  </Badge>
                </TableCell>
                <TableCell>
                  {colaborador.user_id ? (
                    <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/50">
                      Ativa ✓
                    </Badge>
                  ) : (
                    <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/50">
                      Pendente
                    </Badge>
                  )}
                </TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1">
                    {colaborador.is_admin && (
                      <Badge className="bg-cyan text-cyan-foreground">Admin</Badge>
                    )}
                    {colaborador.has_finance_access && (
                      <Badge className="bg-emerald-500 text-white">Financeiro</Badge>
                    )}
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setViewingColaborador(colaborador)}
                      title="Ver detalhes"
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                    {canEdit && (
                      <>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(colaborador)}
                          title="Editar"
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                        {colaborador.user_id && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setResetPasswordColaborador(colaborador)}
                            title="Resetar senha"
                          >
                            <KeyRound className="w-4 h-4" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setDeletingId(colaborador.id)}
                          title="Excluir"
                        >
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Floating Action Bar */}
      {isSomeSelected && canEdit && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-card border border-subtle rounded-lg shadow-xl p-4 flex items-center gap-4 animate-in slide-in-from-bottom-4 duration-300">
          <span className="text-sm font-medium text-foreground">
            {selectedIds.size} selecionado(s)
          </span>
          
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleBatchActivate}
              disabled={isBatchUpdating}
            >
              <UserCheck className="w-4 h-4 mr-2" />
              Ativar
            </Button>
            
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleBatchDeactivate}
              disabled={isBatchUpdating}
            >
              <UserX className="w-4 h-4 mr-2" />
              Desativar
            </Button>
            
            <Button 
              variant="destructive" 
              size="sm" 
              onClick={() => setShowBatchDelete(true)}
              disabled={isBatchDeleting}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Excluir
            </Button>
          </div>
          
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => setSelectedIds(new Set())}
          >
            <X className="w-4 h-4 mr-2" />
            Cancelar
          </Button>
        </div>
      )}

      {/* Batch Delete Confirmation */}
      <AlertDialog open={showBatchDelete} onOpenChange={setShowBatchDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir {selectedIds.size} colaboradores?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação é irreversível. Os colaboradores selecionados e seus acessos ao sistema serão removidos permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleBatchDelete} 
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir {selectedIds.size} colaboradores
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={!!editingColaborador} onOpenChange={() => setEditingColaborador(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Colaborador</DialogTitle>
          </DialogHeader>
          {editingColaborador && (
            <ColaboradorForm
              colaborador={editingColaborador}
              onSubmit={handleUpdate}
              isLoading={isUpdating}
            />
          )}
        </DialogContent>
      </Dialog>

      {resetPasswordColaborador && (
        <ResetPasswordDialog
          colaborador={resetPasswordColaborador}
          open={!!resetPasswordColaborador}
          onClose={() => setResetPasswordColaborador(null)}
        />
      )}

      <DeleteConfirmDialog
        open={!!deletingId}
        onOpenChange={(open) => !open && setDeletingId(null)}
        onConfirm={handleDelete}
        title="Excluir Colaborador"
        description="Tem certeza que deseja excluir este colaborador? Esta ação também removerá o acesso ao sistema e não pode ser desfeita."
      />

      <ColaboradorDetalhes
        colaborador={viewingColaborador}
        open={!!viewingColaborador}
        onClose={() => setViewingColaborador(null)}
      />
    </>
  );
};
