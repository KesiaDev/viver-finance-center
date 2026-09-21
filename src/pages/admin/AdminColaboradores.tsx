import { useState, useMemo } from "react";
import { Plus, Users, UserCheck, Shield, Upload, DollarSign, Download } from "lucide-react";
import * as XLSX from "xlsx";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ColaboradorForm } from "@/components/Colaboradores/ColaboradorForm";
import { ColaboradoresList } from "@/components/Colaboradores/ColaboradoresList";
import { useColaboradores } from "@/hooks/useColaboradores";
import { useAppPreferences } from "@/contexts/AppPreferencesContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ImportColaboradoresDialog } from "@/components/Colaboradores/ImportColaboradoresDialog";
import { useAuth } from "@/contexts/AuthContext";

const AdminColaboradores = () => {
  const { canEditAdmin } = useAuth();
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showImportDialog, setShowImportDialog] = useState(false);
  const { colaboradores, createColaborador, isCreating, importColaboradores, isImporting } = useColaboradores();
  const { colaboradoresFilters, setColaboradoresFilter } = useAppPreferences();

  // Extract filters from context
  const { searchQuery, statusFilter, funcaoFilter, areaFilter, mesAniversarioFilter, contaFilter } = colaboradoresFilters;

  // Filtered collaborators based on filters
  const filteredColaboradores = useMemo(() => {
    if (!colaboradores) return [];
    return colaboradores.filter(c => {
      // Filtro de pesquisa por texto
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesSearch = 
          c.nome?.toLowerCase().includes(query) ||
          c.email?.toLowerCase().includes(query) ||
          c.cpf?.toLowerCase().includes(query) ||
          c.cnpj?.toLowerCase().includes(query);
        if (!matchesSearch) return false;
      }
      
      if (statusFilter === "ativo" && !c.ativo) return false;
      if (statusFilter === "inativo" && c.ativo) return false;
      if (funcaoFilter !== "todos" && c.funcao !== funcaoFilter) return false;
      if (areaFilter !== "todos" && c.area !== areaFilter) return false;
      
      // Filtro por mês de aniversário
      if (mesAniversarioFilter !== "todos") {
        if (!c.data_nascimento) return false;
        const mes = parseInt(c.data_nascimento.split('-')[1], 10);
        if (mes !== parseInt(mesAniversarioFilter, 10)) return false;
      }
      
      // Filtro por status da conta
      if (contaFilter !== "todos") {
        if (contaFilter === "ativa" && c.user_id === null) return false;
        if (contaFilter === "pendente" && c.user_id !== null) return false;
      }
      
      return true;
    });
  }, [colaboradores, searchQuery, statusFilter, funcaoFilter, areaFilter, mesAniversarioFilter, contaFilter]);

  const handleCreate = (data: any) => {
    // Converter strings vazias para null nos campos de data
    const sanitizedData = {
      ...data,
      data_fim_contrato: data.data_fim_contrato || null,
      data_nascimento: data.data_nascimento || null,
    };
    createColaborador(sanitizedData, {
      onSuccess: () => {
        setShowCreateDialog(false);
      },
    });
  };

  const totalColaboradores = filteredColaboradores.length;
  const totalAtivos = filteredColaboradores.filter(c => c.ativo).length;
  const totalAdmins = filteredColaboradores.filter(c => c.is_admin).length;
  const totalRemuneracao = useMemo(() => {
    return filteredColaboradores.reduce((sum, c) => sum + (c.remuneracao || 0), 0);
  }, [filteredColaboradores]);

  const handleExportExcel = () => {
    const formatDate = (dateStr: string | null) => {
      if (!dateStr) return "";
      const date = new Date(dateStr);
      return date.toLocaleDateString("pt-BR");
    };

    const exportData = filteredColaboradores.map((c) => ({
      "Nome": c.nome || "",
      "Email": c.email || "",
      "CPF": c.cpf || "",
      "CNPJ": c.cnpj || "",
      "Endereço": c.endereco || "",
      "Chave PIX CNPJ": c.chave_pix_cnpj || "",
      "Data de Nascimento": formatDate(c.data_nascimento),
      "Data Início Contrato": formatDate(c.data_inicio_contrato),
      "Data Fim Contrato": formatDate(c.data_fim_contrato),
      "Área": c.area || "",
      "Função": c.funcao || "",
      "Remuneração": c.remuneracao || 0,
      "Variável": c.variavel || "",
      "Regra OTE": c.regra_ote || "",
      "Administrador": c.is_admin ? "Sim" : "Não",
      "Acesso Financeiro": c.has_finance_access ? "Sim" : "Não",
      "Status": c.ativo ? "Ativo" : "Inativo",
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Colaboradores");
    
    const timestamp = new Date().toISOString().split("T")[0];
    XLSX.writeFile(workbook, `colaboradores_${timestamp}.xlsx`);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Gestão de Colaboradores</h1>
          <p className="text-muted-foreground mt-1">
            Gerencie colaboradores e permissões de acesso
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={handleExportExcel}
            disabled={filteredColaboradores.length === 0}
            className="gap-2"
          >
            <Download className="w-4 h-4" />
            Exportar Excel
          </Button>
          {canEditAdmin && (
            <>
              <Button variant="outline" onClick={() => setShowImportDialog(true)} className="gap-2">
                <Upload className="w-4 h-4" />
                Importar Planilha
              </Button>
              <Button onClick={() => setShowCreateDialog(true)} className="gap-2">
                <Plus className="w-4 h-4" />
                Novo Colaborador
              </Button>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total de Colaboradores
            </CardTitle>
            <Users className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{totalColaboradores}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Colaboradores Ativos
            </CardTitle>
            <UserCheck className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{totalAtivos}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Administradores
            </CardTitle>
            <Shield className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{totalAdmins}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Remuneração
            </CardTitle>
            <DollarSign className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              R$ {totalRemuneracao.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
          </CardContent>
        </Card>
      </div>

      <ColaboradoresList
        searchQuery={searchQuery}
        setSearchQuery={(v) => setColaboradoresFilter("searchQuery", v)}
        statusFilter={statusFilter}
        setStatusFilter={(v) => setColaboradoresFilter("statusFilter", v)}
        funcaoFilter={funcaoFilter}
        setFuncaoFilter={(v) => setColaboradoresFilter("funcaoFilter", v)}
        areaFilter={areaFilter}
        setAreaFilter={(v) => setColaboradoresFilter("areaFilter", v)}
        mesAniversarioFilter={mesAniversarioFilter}
        setMesAniversarioFilter={(v) => setColaboradoresFilter("mesAniversarioFilter", v)}
        contaFilter={contaFilter}
        setContaFilter={(v) => setColaboradoresFilter("contaFilter", v)}
        colaboradores={colaboradores || []}
        filteredColaboradores={filteredColaboradores}
        canEdit={canEditAdmin}
      />

      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Novo Colaborador</DialogTitle>
          </DialogHeader>
          <ColaboradorForm onSubmit={handleCreate} isLoading={isCreating} />
        </DialogContent>
      </Dialog>

      <ImportColaboradoresDialog
        open={showImportDialog}
        onOpenChange={setShowImportDialog}
        onImport={importColaboradores}
        isImporting={isImporting}
      />
    </div>
  );
};

export default AdminColaboradores;
