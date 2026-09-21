import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const GRUPO_CONSOLIDADO = "grupo" as const;

export interface Empresa {
  id: string;
  nome: string;
  slug: string;
  ativo: boolean;
}

/** slug da empresa selecionada ou "grupo" para o consolidado */
export type EmpresaSelection = string;

interface EmpresaContextValue {
  empresas: Empresa[];
  isLoading: boolean;
  /** slug selecionado ("grupo" = consolidado) */
  selectedEmpresa: EmpresaSelection;
  setSelectedEmpresa: (value: EmpresaSelection) => void;
  /** empresa selecionada (undefined quando é o consolidado) */
  selectedEmpresaData?: Empresa;
  isConsolidado: boolean;
}

const STORAGE_KEY = "llmidia-empresa-selecionada";

const EmpresaContext = createContext<EmpresaContextValue | null>(null);

export function EmpresaProvider({ children }: { children: ReactNode }) {
  const [selectedEmpresa, setSelectedEmpresaState] = useState<EmpresaSelection>(() => {
    if (typeof window === "undefined") return GRUPO_CONSOLIDADO;
    return localStorage.getItem(STORAGE_KEY) ?? GRUPO_CONSOLIDADO;
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, selectedEmpresa);
  }, [selectedEmpresa]);

  const { data: empresas = [], isLoading } = useQuery({
    queryKey: ["empresas"],
    queryFn: async (): Promise<Empresa[]> => {
      const { data, error } = await supabase
        .from("empresas")
        .select("id, nome, slug, ativo")
        .eq("ativo", true)
        .order("ordem", { ascending: true });

      if (error) {
        console.error("Error fetching empresas:", error);
        return [];
      }
      return (data ?? []) as Empresa[];
    },
    staleTime: 10 * 60 * 1000,
  });

  const value = useMemo<EmpresaContextValue>(() => ({
    empresas,
    isLoading,
    selectedEmpresa,
    setSelectedEmpresa: setSelectedEmpresaState,
    selectedEmpresaData: empresas.find((e) => e.slug === selectedEmpresa),
    isConsolidado: selectedEmpresa === GRUPO_CONSOLIDADO,
  }), [empresas, isLoading, selectedEmpresa]);

  return <EmpresaContext.Provider value={value}>{children}</EmpresaContext.Provider>;
}

export function useEmpresa() {
  const ctx = useContext(EmpresaContext);
  if (!ctx) throw new Error("useEmpresa deve ser usado dentro de um EmpresaProvider");
  return ctx;
}
