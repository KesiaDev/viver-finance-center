import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useMemo, useState } from "react";

export interface HublaEvent {
  id: string;
  event_type: string;
  smart_installment_id: string | null;
  subscription_id: string | null;
  source_invoice_id: string | null;
  seller_id: string | null;
  payer_id: string | null;
  payer_email: string | null;
  payer_name: string | null;
  payer_document: string | null;
  payer_phone: string | null;
  status: string | null;
  payment_method: string | null;
  product_id: string | null;
  product_name: string | null;
  amount_cents: number | null;
  installment: number | null;
  total_installments: number | null;
  created_at: string | null;
  processed: boolean | null;
  processed_at: string | null;
}

export interface ParcelamentoAgrupado {
  id: string;
  cliente: string;
  email: string;
  documento: string;
  telefone: string;
  produto: string;
  valorTotal: number;
  valorParcela: number;
  parcelaAtual: number;
  totalParcelas: number;
  status: string;
  statusLabel: string;
  dataCriacao: Date;
  valorPago: number;
  parcelasAtrasadas: number;
  parcelasPagas: number;
  percentualPago: number;
  metodoPagamento: string;
  eventos: HublaEvent[];
}

export interface ParcelamentoFilters {
  search: string;
  status: string[];
  produto: string;
  metodoPagamento: string;
  periodoInicio: Date | null;
  periodoFim: Date | null;
}

export interface ParcelamentoSummary {
  totalParcelado: number;
  totalPago: number;
  totalAtrasado: number;
  totalAgendado: number;
  quantidadeParcelamentos: number;
  quantidadeAtrasados: number;
}

const STATUS_MAP: Record<string, string> = {
  on_schedule: "Em dia",
  off_schedule: "Atrasado",
  canceled: "Cancelado",
  completed: "Finalizado",
  created: "Criado",
  aborted: "Abortado",
};

function getStatusLabel(status: string | null): string {
  if (!status) return "Desconhecido";
  return STATUS_MAP[status] || status;
}

export function useHublaEvents() {
  const [filters, setFilters] = useState<ParcelamentoFilters>({
    search: "",
    status: [],
    produto: "",
    metodoPagamento: "",
    periodoInicio: null,
    periodoFim: null,
  });

  const { data: events, isLoading, error, refetch } = useQuery({
    queryKey: ["hubla-events"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("hubla_webhook_events")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as HublaEvent[];
    },
  });

  // Agrupar eventos por smart_installment_id
  const parcelamentos = useMemo(() => {
    if (!events) return [];

    const grouped = new Map<string, HublaEvent[]>();

    events.forEach((event) => {
      const key = event.smart_installment_id || event.id;
      if (!grouped.has(key)) {
        grouped.set(key, []);
      }
      grouped.get(key)!.push(event);
    });

    const result: ParcelamentoAgrupado[] = [];

    grouped.forEach((eventList, id) => {
      // Ordenar eventos por data
      eventList.sort(
        (a, b) =>
          new Date(a.created_at || 0).getTime() -
          new Date(b.created_at || 0).getTime()
      );

      const primeiroEvento = eventList[0];
      const ultimoEvento = eventList[eventList.length - 1];

      // Calcular estatísticas
      const totalParcelas = primeiroEvento.total_installments || 1;
      const valorParcela = (primeiroEvento.amount_cents || 0) / 100;
      const valorTotal = valorParcela * totalParcelas;

      // Contar parcelas pagas e atrasadas
      let parcelasPagas = 0;
      let parcelasAtrasadas = 0;
      let parcelaAtual = 0;

      eventList.forEach((e) => {
        if (e.status === "on_schedule" || e.event_type?.includes("paid")) {
          parcelasPagas++;
        }
        if (e.status === "off_schedule") {
          parcelasAtrasadas++;
        }
        if (e.installment && e.installment > parcelaAtual) {
          parcelaAtual = e.installment;
        }
      });

      const valorPago = parcelasPagas * valorParcela;
      const percentualPago = totalParcelas > 0 ? (parcelasPagas / totalParcelas) * 100 : 0;

      result.push({
        id,
        cliente: primeiroEvento.payer_name || "Cliente não identificado",
        email: primeiroEvento.payer_email || "",
        documento: primeiroEvento.payer_document || "",
        telefone: primeiroEvento.payer_phone || "",
        produto: primeiroEvento.product_name || "Produto não identificado",
        valorTotal,
        valorParcela,
        parcelaAtual: parcelaAtual || 1,
        totalParcelas,
        status: ultimoEvento.status || "created",
        statusLabel: getStatusLabel(ultimoEvento.status),
        dataCriacao: new Date(primeiroEvento.created_at || new Date()),
        valorPago,
        parcelasAtrasadas,
        parcelasPagas,
        percentualPago,
        metodoPagamento: primeiroEvento.payment_method || "Não informado",
        eventos: eventList,
      });
    });

    // Ordenar por data de criação (mais recentes primeiro)
    result.sort((a, b) => b.dataCriacao.getTime() - a.dataCriacao.getTime());

    return result;
  }, [events]);

  // Aplicar filtros
  const filteredParcelamentos = useMemo(() => {
    return parcelamentos.filter((p) => {
      // Filtro de busca
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        const matchesSearch =
          p.cliente.toLowerCase().includes(searchLower) ||
          p.email.toLowerCase().includes(searchLower) ||
          p.documento.includes(filters.search) ||
          p.produto.toLowerCase().includes(searchLower);
        if (!matchesSearch) return false;
      }

      // Filtro de status
      if (filters.status.length > 0) {
        if (!filters.status.includes(p.status)) return false;
      }

      // Filtro de produto
      if (filters.produto) {
        if (p.produto !== filters.produto) return false;
      }

      // Filtro de método de pagamento
      if (filters.metodoPagamento) {
        if (p.metodoPagamento !== filters.metodoPagamento) return false;
      }

      // Filtro de período
      if (filters.periodoInicio) {
        if (p.dataCriacao < filters.periodoInicio) return false;
      }
      if (filters.periodoFim) {
        if (p.dataCriacao > filters.periodoFim) return false;
      }

      return true;
    });
  }, [parcelamentos, filters]);

  // Calcular resumo
  const summary = useMemo((): ParcelamentoSummary => {
    let totalParcelado = 0;
    let totalPago = 0;
    let totalAtrasado = 0;
    let quantidadeAtrasados = 0;

    filteredParcelamentos.forEach((p) => {
      totalParcelado += p.valorTotal;
      totalPago += p.valorPago;

      if (p.parcelasAtrasadas > 0) {
        totalAtrasado += p.parcelasAtrasadas * p.valorParcela;
        quantidadeAtrasados++;
      }
    });

    const totalAgendado = totalParcelado - totalPago - totalAtrasado;

    return {
      totalParcelado,
      totalPago,
      totalAtrasado,
      totalAgendado: Math.max(0, totalAgendado),
      quantidadeParcelamentos: filteredParcelamentos.length,
      quantidadeAtrasados,
    };
  }, [filteredParcelamentos]);

  // Extrair listas únicas para filtros
  const produtos = useMemo(() => {
    const set = new Set<string>();
    parcelamentos.forEach((p) => set.add(p.produto));
    return Array.from(set).sort();
  }, [parcelamentos]);

  const metodosPagamento = useMemo(() => {
    const set = new Set<string>();
    parcelamentos.forEach((p) => set.add(p.metodoPagamento));
    return Array.from(set).sort();
  }, [parcelamentos]);

  return {
    parcelamentos: filteredParcelamentos,
    allParcelamentos: parcelamentos,
    summary,
    produtos,
    metodosPagamento,
    filters,
    setFilters,
    isLoading,
    error,
    refetch,
  };
}
