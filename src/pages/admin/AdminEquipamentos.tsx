import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
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
import {
  Plus,
  Search,
  Pencil,
  Trash2,
  Package,
  Laptop,
  Users,
  DollarSign,
  AlertTriangle,
} from "lucide-react";
import {
  useEquipamentos,
  Equipamento,
  TIPOS_EQUIPAMENTO,
  ESTADOS_EQUIPAMENTO,
} from "@/hooks/useEquipamentos";
import { useAppPreferences } from "@/contexts/AppPreferencesContext";
import { EquipamentoForm } from "@/components/Equipamentos/EquipamentoForm";

export default function AdminEquipamentos() {
  const {
    equipamentos,
    isLoading,
    createEquipamento,
    updateEquipamento,
    deleteEquipamento,
    isCreating,
    isUpdating,
  } = useEquipamentos();

  const { equipamentosFilters, setEquipamentosFilter } = useAppPreferences();
  const { searchTerm, tipoFilter, estadoFilter, responsavelFilter } = equipamentosFilters;

  const [formOpen, setFormOpen] = useState(false);
  const [editingEquipamento, setEditingEquipamento] = useState<Equipamento | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [equipamentoToDelete, setEquipamentoToDelete] = useState<Equipamento | null>(null);

  const colaboradoresUnicos = useMemo(() => {
    if (!equipamentos) return [];
    const colaboradoresMap = new Map<string, { id: string; nome: string }>();
    equipamentos.forEach((eq) => {
      if (eq.colaborador?.id && eq.colaborador?.nome) {
        colaboradoresMap.set(eq.colaborador.id, { id: eq.colaborador.id, nome: eq.colaborador.nome });
      }
    });
    return Array.from(colaboradoresMap.values()).sort((a, b) => 
      a.nome.localeCompare(b.nome)
    );
  }, [equipamentos]);

  const filteredEquipamentos = useMemo(() => {
    if (!equipamentos) return [];

    return equipamentos.filter((eq) => {
      const matchesSearch =
        eq.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
        eq.marca?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        eq.modelo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        eq.numero_serie?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        eq.patrimonio?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        eq.colaborador?.nome?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesTipo = tipoFilter === "all" || eq.tipo === tipoFilter;
      const matchesEstado = estadoFilter === "all" || eq.estado === estadoFilter;
      const matchesResponsavel = 
        responsavelFilter === "all" || 
        (responsavelFilter === "none" && !eq.colaborador_id) ||
        eq.colaborador_id === responsavelFilter;

      return matchesSearch && matchesTipo && matchesEstado && matchesResponsavel;
    });
  }, [equipamentos, searchTerm, tipoFilter, estadoFilter, responsavelFilter]);

  const stats = useMemo(() => {
    if (!equipamentos) return { total: 0, ativos: 0, semResponsavel: 0, valorTotal: 0 };

    return {
      total: equipamentos.length,
      ativos: equipamentos.filter((e) => e.ativo).length,
      semResponsavel: equipamentos.filter((e) => !e.colaborador_id && e.ativo).length,
      valorTotal: equipamentos.reduce((acc, e) => acc + (e.valor || 0), 0),
    };
  }, [equipamentos]);

  const getEstadoLabel = (estado: string) => {
    return ESTADOS_EQUIPAMENTO.find((e) => e.value === estado)?.label || estado;
  };

  const getEstadoVariant = (estado: string) => {
    switch (estado) {
      case "novo":
        return "default";
      case "bom":
        return "secondary";
      case "regular":
        return "outline";
      case "danificado":
        return "destructive";
      default:
        return "secondary";
    }
  };

  const handleEdit = (equipamento: Equipamento) => {
    setEditingEquipamento(equipamento);
    setFormOpen(true);
  };

  const handleDelete = (equipamento: Equipamento) => {
    setEquipamentoToDelete(equipamento);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (equipamentoToDelete) {
      deleteEquipamento(equipamentoToDelete.id);
      setDeleteDialogOpen(false);
      setEquipamentoToDelete(null);
    }
  };

  const handleFormSubmit = (data: any) => {
    if (data.id) {
      updateEquipamento(data);
    } else {
      createEquipamento(data);
    }
    setEditingEquipamento(null);
  };

  const handleFormClose = (open: boolean) => {
    setFormOpen(open);
    if (!open) {
      setEditingEquipamento(null);
    }
  };

  return (
    <>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold">Gestão de Equipamentos</h1>
            <p className="text-muted-foreground">
              Gerencie os equipamentos e vincule aos colaboradores
            </p>
          </div>
          <Button onClick={() => setFormOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Novo Equipamento
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total de Equipamentos
              </CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Equipamentos Ativos
              </CardTitle>
              <Laptop className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.ativos}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Sem Responsável
              </CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.semResponsavel}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Valor Total
              </CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats.valorTotal.toLocaleString("pt-BR", {
                  style: "currency",
                  currency: "BRL",
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nome, marca, modelo, série, patrimônio ou responsável..."
                  value={searchTerm}
                  onChange={(e) => setEquipamentosFilter("searchTerm", e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={tipoFilter} onValueChange={(v) => setEquipamentosFilter("tipoFilter", v)}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder="Tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os Tipos</SelectItem>
                  {TIPOS_EQUIPAMENTO.map((tipo) => (
                    <SelectItem key={tipo} value={tipo}>
                      {tipo}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={estadoFilter} onValueChange={(v) => setEquipamentosFilter("estadoFilter", v)}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder="Estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os Estados</SelectItem>
                  {ESTADOS_EQUIPAMENTO.map((estado) => (
                    <SelectItem key={estado.value} value={estado.value}>
                      {estado.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={responsavelFilter} onValueChange={(v) => setEquipamentosFilter("responsavelFilter", v)}>
                <SelectTrigger className="w-full sm:w-[200px]">
                  <SelectValue placeholder="Responsável" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os Responsáveis</SelectItem>
                  <SelectItem value="none">Sem Responsável</SelectItem>
                  {colaboradoresUnicos.map((colab) => (
                    <SelectItem key={colab.id} value={colab.id}>
                      {colab.nome}
                    </SelectItem>
                  ))}
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
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : filteredEquipamentos.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <Package className="h-12 w-12 mb-4 opacity-50" />
                <p>Nenhum equipamento encontrado.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead className="hidden md:table-cell">Marca/Modelo</TableHead>
                      <TableHead className="hidden lg:table-cell">Série/Patrimônio</TableHead>
                      <TableHead>Responsável</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredEquipamentos.map((equipamento) => (
                      <TableRow
                        key={equipamento.id}
                        className={!equipamento.ativo ? "opacity-50" : ""}
                      >
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            {equipamento.nome}
                            {!equipamento.ativo && (
                              <Badge variant="outline" className="text-xs">
                                Inativo
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>{equipamento.tipo}</TableCell>
                        <TableCell className="hidden md:table-cell">
                          {equipamento.marca || "-"}
                          {equipamento.modelo && ` / ${equipamento.modelo}`}
                        </TableCell>
                        <TableCell className="hidden lg:table-cell">
                          {equipamento.patrimonio || equipamento.numero_serie || "-"}
                        </TableCell>
                        <TableCell>
                          {equipamento.colaborador?.nome || (
                            <span className="text-muted-foreground flex items-center gap-1">
                              <AlertTriangle className="h-3 w-3" />
                              Sem responsável
                            </span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant={getEstadoVariant(equipamento.estado)}>
                            {getEstadoLabel(equipamento.estado)}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleEdit(equipamento)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDelete(equipamento)}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <EquipamentoForm
        open={formOpen}
        onOpenChange={handleFormClose}
        equipamento={editingEquipamento}
        onSubmit={handleFormSubmit}
        isLoading={isCreating || isUpdating}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Equipamento</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o equipamento "{equipamentoToDelete?.nome}"?
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
