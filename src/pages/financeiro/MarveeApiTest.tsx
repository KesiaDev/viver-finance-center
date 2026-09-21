import { useState } from "react";
import { format } from "date-fns";
import { CalendarIcon, Send, RotateCcw, Bug } from "lucide-react";
import { cn } from "@/lib/utils";
import { useMarveeApiTest } from "@/hooks/useMarveeApiTest";
import { useAppPreferences } from "@/contexts/AppPreferencesContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import MarveeTableView from "@/components/financeiro/MarveeTableView";
import MarveeGroupedView from "@/components/financeiro/MarveeGroupedView";
import MarveeExtratoGroupedView from "@/components/financeiro/MarveeExtratoGroupedView";
import MarveeMonthlyCashFlow from "@/components/financeiro/MarveeMonthlyCashFlow";
import type { MarveeRecord, MarveeExtratoRecord } from "@/components/financeiro/MarveeResultHelpers";

const MarveeApiTest = () => {
  const { marveeTestFilters, setMarveeTestFilter, clearMarveeTestFilters } = useAppPreferences();
  const { endpoint, dateStart, dateEnd, dateOption, status, page, pageSize, search, category, costCenter, code, peopleId } = marveeTestFilters;

  // Handle both legacy ISO strings and new yyyy-MM-dd format
  const parseDateSafe = (val: string | null): Date | undefined => {
    if (!val) return undefined;
    if (/^\d{4}-\d{2}-\d{2}$/.test(val)) return new Date(val + "T00:00:00");
    return new Date(val);
  };
  const dateStartDate = parseDateSafe(dateStart);
  const dateEndDate = parseDateSafe(dateEnd);

  const mutation = useMarveeApiTest();
  const [fetchAll, setFetchAll] = useState(false);

  const handleSubmit = () => {
    const params: Record<string, string> = {};
    if (dateStart) params.dateStart = dateStart;
    if (dateEnd) params.dateEnd = dateEnd;
    if (dateOption) params.date_option = dateOption;
    if (status) params.status = status;
    if (page) params.page = page;
    if (pageSize) params.pageSize = pageSize;
    if (search) params.search = search;
    if (category) params.category = category;
    if (costCenter) params.cost_center = costCenter;
    if (code) params.code = code;
    if (peopleId) params.peopleId = peopleId;

    mutation.mutate({ endpoint, params, fetchAll });
  };

  const result = mutation.data;
  const meta = (result?.response as any)?.meta;
  const dataArray = (result?.response as any)?.data;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Bug className="w-5 h-5 text-primary" />
        <h1 className="text-xl font-bold text-foreground">API Marvee - Teste</h1>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <Tabs value={endpoint} onValueChange={(v) => setMarveeTestFilter("endpoint", v as any)}>
            <TabsList>
              <TabsTrigger value="contas-a-pagar">Contas a Pagar</TabsTrigger>
              <TabsTrigger value="contas-a-receber">Contas a Receber</TabsTrigger>
              <TabsTrigger value="extrato">Extrato</TabsTrigger>
            </TabsList>
          </Tabs>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {/* Date Start */}
            <div className="space-y-1">
              <Label className="text-xs">Data Início</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className={cn("w-full justify-start text-left text-xs font-normal", !dateStart && "text-muted-foreground")}>
                    <CalendarIcon className="mr-1 h-3 w-3" />
                    {dateStartDate ? format(dateStartDate, "dd/MM/yyyy") : "Selecionar"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar mode="single" selected={dateStartDate} onSelect={(d) => setMarveeTestFilter("dateStart", d ? format(d, "yyyy-MM-dd") : null)} className="p-3 pointer-events-auto" />
                </PopoverContent>
              </Popover>
            </div>

            {/* Date End */}
            <div className="space-y-1">
              <Label className="text-xs">Data Fim</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className={cn("w-full justify-start text-left text-xs font-normal", !dateEnd && "text-muted-foreground")}>
                    <CalendarIcon className="mr-1 h-3 w-3" />
                    {dateEndDate ? format(dateEndDate, "dd/MM/yyyy") : "Selecionar"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar mode="single" selected={dateEndDate} onSelect={(d) => setMarveeTestFilter("dateEnd", d ? format(d, "yyyy-MM-dd") : null)} className="p-3 pointer-events-auto" />
                </PopoverContent>
              </Popover>
            </div>

            {/* Date Option */}
            <div className="space-y-1">
              <Label className="text-xs">Opção de Data</Label>
              <Select value={dateOption} onValueChange={(v) => setMarveeTestFilter("dateOption", v)}>
                <SelectTrigger className="text-xs">
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="vencimento">Vencimento (parcela)</SelectItem>
                  <SelectItem value="competencia">Competência (geração)</SelectItem>
                  <SelectItem value="competencia-fiscal">Competência Fiscal (emissão)</SelectItem>
                  <SelectItem value="liquidacao">Liquidação (recebimento)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Status */}
            <div className="space-y-1">
              <Label className="text-xs">Status</Label>
              <Select value={status} onValueChange={(v) => setMarveeTestFilter("status", v)}>
                <SelectTrigger className="text-xs">
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="paid">Paid</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Page */}
            <div className="space-y-1">
              <Label className="text-xs">Página</Label>
              <Input type="number" min={1} value={page} onChange={(e) => setMarveeTestFilter("page", e.target.value)} className="text-xs" />
            </div>

            {/* Page Size */}
            <div className="space-y-1">
              <Label className="text-xs">Tamanho Página</Label>
              <Input type="number" min={1} max={1000} value={pageSize} onChange={(e) => setMarveeTestFilter("pageSize", e.target.value)} className="text-xs" />
            </div>

            {/* Search */}
            <div className="space-y-1">
              <Label className="text-xs">Busca</Label>
              <Input value={search} onChange={(e) => setMarveeTestFilter("search", e.target.value)} placeholder="Termo..." className="text-xs" />
            </div>

            {/* Category */}
            <div className="space-y-1">
              <Label className="text-xs">Categoria (ID)</Label>
              <Input value={category} onChange={(e) => setMarveeTestFilter("category", e.target.value)} placeholder="ID" className="text-xs" />
            </div>

            {/* Cost Center */}
            <div className="space-y-1">
              <Label className="text-xs">Centro de Custo</Label>
              <Input value={costCenter} onChange={(e) => setMarveeTestFilter("costCenter", e.target.value)} className="text-xs" />
            </div>

            {/* Code */}
            <div className="space-y-1">
              <Label className="text-xs">Código</Label>
              <Input value={code} onChange={(e) => setMarveeTestFilter("code", e.target.value)} className="text-xs" />
            </div>

            {/* People ID */}
            <div className="space-y-1">
              <Label className="text-xs">People ID</Label>
              <Input value={peopleId} onChange={(e) => setMarveeTestFilter("peopleId", e.target.value)} className="text-xs" />
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex gap-2">
              <Button onClick={handleSubmit} disabled={mutation.isPending} size="sm">
                <Send className="w-3.5 h-3.5 mr-1" />
                {mutation.isPending ? "Buscando..." : "Enviar Requisição"}
              </Button>
              <Button variant="outline" onClick={clearMarveeTestFilters} size="sm">
                <RotateCcw className="w-3.5 h-3.5 mr-1" />
                Limpar Filtros
              </Button>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                id="fetchAll"
                checked={fetchAll}
                onCheckedChange={(checked) => setFetchAll(checked === true)}
              />
              <Label htmlFor="fetchAll" className="text-xs cursor-pointer">
                Buscar todas as páginas
              </Label>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Result */}
      {(result || mutation.isError) && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              Resultado
              {result && (
                <div className="flex gap-2">
                  <Badge variant={result.success ? "default" : "destructive"} className="text-xs">
                    HTTP {result.status}
                  </Badge>
                  <Badge variant="secondary" className="text-xs">
                    {result.elapsed_ms}ms
                  </Badge>
                  {meta && (
                    <>
                      <Badge variant="outline" className="text-xs">
                        Total: {meta.total}
                      </Badge>
                      {meta.pages_fetched ? (
                        <Badge variant="outline" className="text-xs">
                          Páginas: {meta.pages_fetched}/{meta.last_page}
                          {meta.truncated && " (truncado)"}
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-xs">
                          Página: {meta.current_page}/{meta.last_page}
                        </Badge>
                      )}
                    </>
                  )}
                  {dataArray && (
                    <Badge variant="outline" className="text-xs">
                      Retornados: {dataArray.length}
                    </Badge>
                  )}
                </div>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {mutation.isError && (
              <p className="text-sm text-destructive">{(mutation.error as Error).message}</p>
            )}
            {result && dataArray && dataArray.length === 0 && (
              <p className="text-sm text-muted-foreground py-8 text-center">
                Nenhum registro encontrado. Verifique os filtros e a página selecionada.
              </p>
            )}
            {result && dataArray && dataArray.length > 0 && endpoint === "extrato" && (
              <Tabs defaultValue="grouped">
                <TabsList className="mb-3">
                  <TabsTrigger value="grouped">Agrupado</TabsTrigger>
                  <TabsTrigger value="json">JSON</TabsTrigger>
                </TabsList>
                <TabsContent value="grouped">
                  <MarveeExtratoGroupedView records={dataArray as MarveeExtratoRecord[]} />
                </TabsContent>
                <TabsContent value="json">
                  <ScrollArea className="h-[500px] rounded border bg-muted/30 p-3">
                    <pre className="text-xs whitespace-pre-wrap font-mono">
                      {JSON.stringify(result.response, null, 2)}
                    </pre>
                  </ScrollArea>
                </TabsContent>
              </Tabs>
            )}
            {result && dataArray && dataArray.length > 0 && endpoint !== "extrato" && (
              <Tabs defaultValue="grouped">
                <TabsList className="mb-3">
                  <TabsTrigger value="grouped">Agrupado</TabsTrigger>
                  <TabsTrigger value="table">Tabela</TabsTrigger>
                  <TabsTrigger value="json">JSON</TabsTrigger>
                </TabsList>
                <TabsContent value="grouped">
                  <MarveeGroupedView records={dataArray as MarveeRecord[]} />
                </TabsContent>
                <TabsContent value="table">
                  <MarveeTableView records={dataArray as MarveeRecord[]} />
                </TabsContent>
                <TabsContent value="json">
                  <ScrollArea className="h-[500px] rounded border bg-muted/30 p-3">
                    <pre className="text-xs whitespace-pre-wrap font-mono">
                      {JSON.stringify(result.response, null, 2)}
                    </pre>
                  </ScrollArea>
                </TabsContent>
              </Tabs>
            )}
            {result && !dataArray && (
              <ScrollArea className="h-[500px] rounded border bg-muted/30 p-3">
                <pre className="text-xs whitespace-pre-wrap font-mono">
                  {JSON.stringify(result.response, null, 2)}
                </pre>
              </ScrollArea>
            )}
          </CardContent>
        </Card>
      )}

      <MarveeMonthlyCashFlow />
    </div>
  );
};

export default MarveeApiTest;
