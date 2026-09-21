import { createContext, useContext, type ReactNode } from "react";
import { useParcelamentoDashboardData } from "@/hooks/useParcelamentoDashboardData";

type ParcelamentoContextType = ReturnType<typeof useParcelamentoDashboardData>;

const ParcelamentoContext = createContext<ParcelamentoContextType | null>(null);

export function ParcelamentoProvider({ children }: { children: ReactNode }) {
  const data = useParcelamentoDashboardData();
  return (
    <ParcelamentoContext.Provider value={data}>
      {children}
    </ParcelamentoContext.Provider>
  );
}

export function useParcelamentoContext() {
  const ctx = useContext(ParcelamentoContext);
  if (!ctx) throw new Error("useParcelamentoContext must be used within ParcelamentoProvider");
  return ctx;
}
