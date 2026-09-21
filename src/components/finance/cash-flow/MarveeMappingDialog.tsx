import { useState } from "react";
import { Plus, Trash2, Check, X, Search, Loader2, AlertCircle, CheckCircle2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useMarveeSync, DiscoveredCategory } from "@/hooks/useMarveeSync";
import { useCashFlowData } from "@/hooks/useCashFlowData";

interface MarveeMappingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function MarveeMappingDialog({ open, onOpenChange }: MarveeMappingDialogProps) {
  const currentYear = new Date().getFullYear();
  const { 
    mappings, 
    isLoadingMappings, 
    upsertMapping, 
    deleteMapping, 
    isUpdatingMapping,
    discoverCategories,
    isDiscovering 
  } = useMarveeSync();
  const { categories } = useCashFlowData(currentYear);

  const [newMapping, setNewMapping] = useState({
    marvee_category_structure: "",
    marvee_category_description: "",
    cash_flow_category_code: "",
  });
  const [isAdding, setIsAdding] = useState(false);
  const [discoveredCategories, setDiscoveredCategories] = useState<DiscoveredCategory[]>([]);
  const [hasDiscovered, setHasDiscovered] = useState(false);
  const [pendingMappings, setPendingMappings] = useState<Record<string, string>>({});

  // Get only leaf categories (those without children)
  const leafCategories = (categories || []).filter(
    cat => !categories?.some(c => c.parent_code === cat.code)
  );

  const handleDiscover = async () => {
    try {
      const result = await discoverCategories();
      setDiscoveredCategories(result.categories);
      setHasDiscovered(true);
    } catch (error) {
      console.error("Error discovering categories:", error);
    }
  };

  const handleAddMapping = () => {
    if (!newMapping.marvee_category_structure || !newMapping.marvee_category_description || !newMapping.cash_flow_category_code) {
      return;
    }

    upsertMapping({
      ...newMapping,
      is_active: true,
    });

    setNewMapping({
      marvee_category_structure: "",
      marvee_category_description: "",
      cash_flow_category_code: "",
    });
    setIsAdding(false);
  };

  const handleQuickMap = (category: DiscoveredCategory, categoryCode: string) => {
    upsertMapping({
      marvee_category_structure: category.id,
      marvee_category_description: category.description,
      cash_flow_category_code: categoryCode,
      is_active: true,
    });

    // Update local state to reflect mapping
    setDiscoveredCategories(prev => 
      prev.map(cat => cat.id === category.id ? { ...cat, isMapped: true } : cat)
    );
    setPendingMappings(prev => {
      const next = { ...prev };
      delete next[category.id];
      return next;
    });
  };

  const handleToggleActive = (mapping: NonNullable<typeof mappings>[number]) => {
    if (!mapping.marvee_category_structure || !mapping.marvee_category_description) return;
    
    upsertMapping({
      marvee_category_structure: mapping.marvee_category_structure,
      marvee_category_description: mapping.marvee_category_description,
      cash_flow_category_code: mapping.cash_flow_category_code,
      is_active: !mapping.is_active,
    });
  };

  const handleUpdateCategory = (mapping: NonNullable<typeof mappings>[number], newCategoryCode: string) => {
    if (!mapping.marvee_category_structure || !mapping.marvee_category_description) return;
    
    upsertMapping({
      marvee_category_structure: mapping.marvee_category_structure,
      marvee_category_description: mapping.marvee_category_description,
      cash_flow_category_code: newCategoryCode,
      is_active: mapping.is_active,
    });
  };

  const unmappedCategories = discoveredCategories.filter(cat => !cat.isMapped);
  const mappedCategories = discoveredCategories.filter(cat => cat.isMapped);

  // Filter only mappings with category structure (new format)
  const validMappings = (mappings || []).filter(m => m.marvee_category_structure);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Mapeamento de Categorias Marvee</DialogTitle>
          <DialogDescription>
            Configure o mapeamento entre as categorias do Marvee e as categorias do Fluxo de Caixa.
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="discover" className="flex-1 flex flex-col overflow-hidden">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="discover">
              <Search className="h-4 w-4 mr-2" />
              Descobrir Categorias
            </TabsTrigger>
            <TabsTrigger value="mappings">
              Mapeamentos Configurados ({validMappings.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="discover" className="flex-1 overflow-hidden flex flex-col mt-4">
            <div className="space-y-4 flex-1 overflow-hidden flex flex-col">
              {/* Discovery button */}
              <Button
                onClick={handleDiscover}
                disabled={isDiscovering}
                className="w-full"
              >
                {isDiscovering ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Buscando categorias...
                  </>
                ) : (
                  <>
                    <Search className="h-4 w-4 mr-2" />
                    Buscar Categorias do Marvee
                  </>
                )}
              </Button>

              {hasDiscovered && (
                <div className="flex-1 overflow-hidden flex flex-col">
                  {/* Summary */}
                  <div className="flex gap-4 mb-4">
                    <Badge variant="outline" className="text-orange-600 border-orange-300 bg-orange-50">
                      <AlertCircle className="h-3 w-3 mr-1" />
                      {unmappedCategories.length} não mapeadas
                    </Badge>
                    <Badge variant="outline" className="text-green-600 border-green-300 bg-green-50">
                      <CheckCircle2 className="h-3 w-3 mr-1" />
                      {mappedCategories.length} já mapeadas
                    </Badge>
                  </div>

                  {/* Unmapped categories */}
                  {unmappedCategories.length > 0 && (
                    <div className="flex-1 overflow-auto border rounded-lg">
                      <Table>
                        <TableHeader className="sticky top-0 bg-background">
                          <TableRow>
                            <TableHead>Categoria (Marvee)</TableHead>
                            <TableHead>Tipo</TableHead>
                            <TableHead>Qtd</TableHead>
                            <TableHead>Mapear para Categoria</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {unmappedCategories.map((cat) => (
                            <TableRow key={cat.id} className="bg-orange-50/50">
                              <TableCell>
                                <div className="flex flex-col">
                                  <span className="font-medium">{cat.name}</span>
                                  <span className="text-xs text-muted-foreground">Código: {cat.id}</span>
                                </div>
                              </TableCell>
                              <TableCell>
                                <Badge variant="secondary" className="text-xs">
                                  {cat.source === "both" ? "Ambos" : cat.source === "receivable" ? "Receber" : "Pagar"}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-muted-foreground">{cat.count}</TableCell>
                              <TableCell>
                                <div className="flex gap-2 items-center">
                                  <Select
                                    value={pendingMappings[cat.id] || ""}
                                    onValueChange={(value) => setPendingMappings(prev => ({ ...prev, [cat.id]: value }))}
                                  >
                                    <SelectTrigger className="w-[220px]">
                                      <SelectValue placeholder="Selecionar categoria" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {leafCategories.map((localCat) => (
                                        <SelectItem key={localCat.code} value={localCat.code}>
                                          {localCat.code} - {localCat.name}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                  <Button
                                    size="sm"
                                    disabled={!pendingMappings[cat.id] || isUpdatingMapping}
                                    onClick={() => handleQuickMap(cat, pendingMappings[cat.id])}
                                  >
                                    Mapear
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}

                  {unmappedCategories.length === 0 && hasDiscovered && (
                    <div className="flex-1 flex items-center justify-center text-muted-foreground">
                      <CheckCircle2 className="h-8 w-8 mr-2 text-green-500" />
                      Todas as categorias estão mapeadas!
                    </div>
                  )}
                </div>
              )}

              {!hasDiscovered && (
                <div className="flex-1 flex items-center justify-center text-muted-foreground text-center p-8">
                  <div>
                    <Search className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Clique no botão acima para descobrir as categorias disponíveis no Marvee.</p>
                    <p className="text-xs mt-2">Isso irá buscar dados de contas a receber e pagar para identificar todas as categorias.</p>
                  </div>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="mappings" className="flex-1 overflow-hidden flex flex-col mt-4">
            <div className="space-y-4 flex-1 overflow-hidden flex flex-col">
              {/* Add new mapping button */}
              {!isAdding && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsAdding(true)}
                  className="w-full"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar mapeamento manual
                </Button>
              )}

              {/* Add new mapping form */}
              {isAdding && (
                <div className="flex gap-2 p-3 border rounded-lg bg-muted/50">
                  <Input
                    placeholder="Código da categoria (ex: 01.01.01)"
                    value={newMapping.marvee_category_structure}
                    onChange={(e) => setNewMapping(prev => ({ ...prev, marvee_category_structure: e.target.value }))}
                    className="flex-1"
                  />
                  <Input
                    placeholder="Descrição da categoria"
                    value={newMapping.marvee_category_description}
                    onChange={(e) => setNewMapping(prev => ({ ...prev, marvee_category_description: e.target.value }))}
                    className="flex-1"
                  />
                  <Select
                    value={newMapping.cash_flow_category_code}
                    onValueChange={(value) => setNewMapping(prev => ({ ...prev, cash_flow_category_code: value }))}
                  >
                    <SelectTrigger className="w-[200px]">
                      <SelectValue placeholder="Categoria" />
                    </SelectTrigger>
                    <SelectContent>
                      {leafCategories.map((cat) => (
                        <SelectItem key={cat.code} value={cat.code}>
                          {cat.code} - {cat.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button size="icon" variant="ghost" onClick={handleAddMapping} disabled={isUpdatingMapping}>
                    <Check className="h-4 w-4 text-green-600" />
                  </Button>
                  <Button size="icon" variant="ghost" onClick={() => setIsAdding(false)}>
                    <X className="h-4 w-4 text-red-600" />
                  </Button>
                </div>
              )}

              {/* Mappings table */}
              <div className="border rounded-lg flex-1 overflow-auto">
                <Table>
                  <TableHeader className="sticky top-0 bg-background">
                    <TableRow>
                      <TableHead>Ativo</TableHead>
                      <TableHead>Categoria (Marvee)</TableHead>
                      <TableHead>Categoria (Fluxo de Caixa)</TableHead>
                      <TableHead className="w-[50px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoadingMappings ? (
                      Array.from({ length: 3 }).map((_, i) => (
                        <TableRow key={i}>
                          <TableCell><Skeleton className="h-5 w-10" /></TableCell>
                          <TableCell><Skeleton className="h-5 w-full" /></TableCell>
                          <TableCell><Skeleton className="h-5 w-full" /></TableCell>
                          <TableCell><Skeleton className="h-5 w-8" /></TableCell>
                        </TableRow>
                      ))
                    ) : validMappings.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                          Nenhum mapeamento configurado. Use a aba "Descobrir" para encontrar categorias.
                        </TableCell>
                      </TableRow>
                    ) : (
                      validMappings.map((mapping) => (
                        <TableRow key={mapping.id} className={!mapping.is_active ? "opacity-50" : ""}>
                          <TableCell>
                            <Switch
                              checked={mapping.is_active}
                              onCheckedChange={() => handleToggleActive(mapping)}
                              disabled={isUpdatingMapping}
                            />
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col">
                              <span className="font-medium">{mapping.marvee_category_structure} - {mapping.marvee_category_description}</span>
                              <span className="text-xs text-muted-foreground">Código: {mapping.marvee_category_structure}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Select
                              value={mapping.cash_flow_category_code}
                              onValueChange={(value) => handleUpdateCategory(mapping, value)}
                              disabled={isUpdatingMapping}
                            >
                              <SelectTrigger className="w-full">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {leafCategories.map((cat) => (
                                  <SelectItem key={cat.code} value={cat.code}>
                                    {cat.code} - {cat.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </TableCell>
                          <TableCell>
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => deleteMapping(mapping.id)}
                              className="text-destructive hover:text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
