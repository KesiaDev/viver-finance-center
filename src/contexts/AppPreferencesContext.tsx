import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from "react";
import { format } from "date-fns";

const STORAGE_KEY = "app-preferences";

interface ColaboradoresFilters {
  searchQuery: string;
  statusFilter: string;
  funcaoFilter: string;
  areaFilter: string;
  mesAniversarioFilter: string;
  contaFilter: string;
}

interface EquipamentosFilters {
  searchTerm: string;
  tipoFilter: string;
  estadoFilter: string;
  responsavelFilter: string;
}

interface ApprovalFilters {
  statusFilter: string;
  periodFilter: string;
  dateFrom: string | null;
  dateTo: string | null;
}

interface MarveeTestFilters {
  endpoint: "contas-a-pagar" | "contas-a-receber" | "extrato";
  dateStart: string | null;
  dateEnd: string | null;
  dateOption: string;
  status: string;
  page: string;
  pageSize: string;
  search: string;
  category: string;
  costCenter: string;
  code: string;
  peopleId: string;
}

interface AppPreferencesState {
  // Módulo Financeiro
  financialYear: string;
  financialMonth: string;
  analysisMonth: string;
  
  // Fluxo de Caixa
  cashFlowPresentation: "grouped" | "detailed";
  cashFlowStatusFilter: "realized" | "projected" | "both";
  cashFlowShowPercentage: boolean;
  
  // Análise Financeira
  analysisYear: number;
  analysisComparisonType: "mom" | "yoy";
  analysisPeriodType: "single" | "range" | "custom";
  analysisSelectedYears: number[];
  analysisRangePreset: "6m" | "12m" | "quarter" | null;
  analysisShowTarget: boolean;
  
  // Módulo Admin
  adminDashboardTab: string;
  colaboradoresFilters: ColaboradoresFilters;
  equipamentosFilters: EquipamentosFilters;
  approvalFilters: ApprovalFilters;
  
  // Páginas Gerais
  solicitacoesTab: string;
  marveeTestFilters: MarveeTestFilters;
}

interface AppPreferencesContextType extends AppPreferencesState {
  setFinancialYear: (year: string) => void;
  setFinancialMonth: (month: string) => void;
  setAnalysisMonth: (month: string) => void;
  setCashFlowPresentation: (presentation: "grouped" | "detailed") => void;
  setCashFlowStatusFilter: (filter: "realized" | "projected" | "both") => void;
  setCashFlowShowPercentage: (show: boolean) => void;
  setAnalysisYear: (year: number) => void;
  setAnalysisComparisonType: (type: "mom" | "yoy") => void;
  setAnalysisPeriodType: (type: "single" | "range" | "custom") => void;
  setAnalysisSelectedYears: (years: number[]) => void;
  setAnalysisRangePreset: (preset: "6m" | "12m" | "quarter" | null) => void;
  setAnalysisShowTarget: (show: boolean) => void;
  setAdminDashboardTab: (tab: string) => void;
  setColaboradoresFilter: <K extends keyof ColaboradoresFilters>(key: K, value: ColaboradoresFilters[K]) => void;
  setEquipamentosFilter: <K extends keyof EquipamentosFilters>(key: K, value: EquipamentosFilters[K]) => void;
  setApprovalFilter: <K extends keyof ApprovalFilters>(key: K, value: ApprovalFilters[K]) => void;
  clearApprovalFilters: () => void;
  setSolicitacoesTab: (tab: string) => void;
  setMarveeTestFilter: <K extends keyof MarveeTestFilters>(key: K, value: MarveeTestFilters[K]) => void;
  clearMarveeTestFilters: () => void;
}

const defaultColaboradoresFilters: ColaboradoresFilters = {
  searchQuery: "",
  statusFilter: "todos",
  funcaoFilter: "todos",
  areaFilter: "todos",
  mesAniversarioFilter: "todos",
  contaFilter: "todos",
};

const defaultEquipamentosFilters: EquipamentosFilters = {
  searchTerm: "",
  tipoFilter: "all",
  estadoFilter: "all",
  responsavelFilter: "all",
};

const defaultApprovalFilters: ApprovalFilters = {
  statusFilter: "todos",
  periodFilter: "todos",
  dateFrom: null,
  dateTo: null,
};

const defaultMarveeTestFilters: MarveeTestFilters = {
  endpoint: "contas-a-pagar",
  dateStart: null,
  dateEnd: null,
  dateOption: "vencimento",
  status: "",
  page: "1",
  pageSize: "100",
  search: "",
  category: "",
  costCenter: "",
  code: "",
  peopleId: "",
};

const getDefaultState = (): AppPreferencesState => {
  const currentDate = new Date();
  return {
    financialYear: currentDate.getFullYear().toString(),
    financialMonth: "all",
    analysisMonth: format(currentDate, 'yyyy-MM-01'),
    cashFlowPresentation: "grouped",
    cashFlowStatusFilter: "realized",
    cashFlowShowPercentage: false,
    analysisYear: currentDate.getFullYear(),
    analysisComparisonType: "mom",
    analysisPeriodType: "single",
    analysisSelectedYears: [currentDate.getFullYear()],
    analysisRangePreset: null,
    analysisShowTarget: true,
    adminDashboardTab: "notas",
    colaboradoresFilters: { ...defaultColaboradoresFilters },
    equipamentosFilters: { ...defaultEquipamentosFilters },
    approvalFilters: { ...defaultApprovalFilters },
    solicitacoesTab: "reembolso",
    marveeTestFilters: { ...defaultMarveeTestFilters },
  };
};

const loadFromStorage = (): AppPreferencesState => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      const defaults = getDefaultState();
      return {
        ...defaults,
        ...parsed,
        colaboradoresFilters: {
          ...defaults.colaboradoresFilters,
          ...(parsed.colaboradoresFilters || {}),
        },
        equipamentosFilters: {
          ...defaults.equipamentosFilters,
          ...(parsed.equipamentosFilters || {}),
        },
        approvalFilters: {
          ...defaults.approvalFilters,
          ...(parsed.approvalFilters || {}),
        },
        marveeTestFilters: {
          ...defaults.marveeTestFilters,
          ...(parsed.marveeTestFilters || {}),
        },
      };
    }
  } catch (e) {
    console.warn("Failed to load app preferences from localStorage:", e);
  }
  return getDefaultState();
};

const saveToStorage = (state: AppPreferencesState) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
    console.warn("Failed to save app preferences to localStorage:", e);
  }
};

const AppPreferencesContext = createContext<AppPreferencesContextType | undefined>(undefined);

export const AppPreferencesProvider = ({ children }: { children: ReactNode }) => {
  const [state, setState] = useState<AppPreferencesState>(loadFromStorage);

  // Salvar no localStorage sempre que o state mudar
  useEffect(() => {
    saveToStorage(state);
  }, [state]);

  const setFinancialYear = useCallback((year: string) => {
    setState(prev => ({ ...prev, financialYear: year }));
  }, []);

  const setFinancialMonth = useCallback((month: string) => {
    setState(prev => ({ ...prev, financialMonth: month }));
  }, []);

  const setAnalysisMonth = useCallback((month: string) => {
    setState(prev => ({ ...prev, analysisMonth: month }));
  }, []);

  const setCashFlowPresentation = useCallback((presentation: "grouped" | "detailed") => {
    setState(prev => ({ ...prev, cashFlowPresentation: presentation }));
  }, []);

  const setCashFlowStatusFilter = useCallback((filter: "realized" | "projected" | "both") => {
    setState(prev => ({ ...prev, cashFlowStatusFilter: filter }));
  }, []);

  const setCashFlowShowPercentage = useCallback((show: boolean) => {
    setState(prev => ({ ...prev, cashFlowShowPercentage: show }));
  }, []);

  const setAnalysisYear = useCallback((year: number) => {
    setState(prev => ({ ...prev, analysisYear: year }));
  }, []);

  const setAnalysisComparisonType = useCallback((type: "mom" | "yoy") => {
    setState(prev => ({ ...prev, analysisComparisonType: type }));
  }, []);

  const setAnalysisPeriodType = useCallback((type: "single" | "range" | "custom") => {
    setState(prev => ({ ...prev, analysisPeriodType: type }));
  }, []);

  const setAnalysisSelectedYears = useCallback((years: number[]) => {
    setState(prev => ({ ...prev, analysisSelectedYears: years }));
  }, []);

  const setAnalysisRangePreset = useCallback((preset: "6m" | "12m" | "quarter" | null) => {
    setState(prev => ({ ...prev, analysisRangePreset: preset }));
  }, []);

  const setAnalysisShowTarget = useCallback((show: boolean) => {
    setState(prev => ({ ...prev, analysisShowTarget: show }));
  }, []);

  const setAdminDashboardTab = useCallback((tab: string) => {
    setState(prev => ({ ...prev, adminDashboardTab: tab }));
  }, []);

  const setColaboradoresFilter = useCallback(<K extends keyof ColaboradoresFilters>(
    key: K,
    value: ColaboradoresFilters[K]
  ) => {
    setState(prev => ({
      ...prev,
      colaboradoresFilters: {
        ...prev.colaboradoresFilters,
        [key]: value,
      },
    }));
  }, []);

  const setEquipamentosFilter = useCallback(<K extends keyof EquipamentosFilters>(
    key: K,
    value: EquipamentosFilters[K]
  ) => {
    setState(prev => ({
      ...prev,
      equipamentosFilters: {
        ...prev.equipamentosFilters,
        [key]: value,
      },
    }));
  }, []);

  const setSolicitacoesTab = useCallback((tab: string) => {
    setState(prev => ({ ...prev, solicitacoesTab: tab }));
  }, []);

  const setApprovalFilter = useCallback(<K extends keyof ApprovalFilters>(
    key: K,
    value: ApprovalFilters[K]
  ) => {
    setState(prev => ({
      ...prev,
      approvalFilters: {
        ...prev.approvalFilters,
        [key]: value,
      },
    }));
  }, []);

  const clearApprovalFilters = useCallback(() => {
    setState(prev => ({
      ...prev,
      approvalFilters: { ...defaultApprovalFilters },
    }));
  }, []);

  const setMarveeTestFilter = useCallback(<K extends keyof MarveeTestFilters>(
    key: K,
    value: MarveeTestFilters[K]
  ) => {
    setState(prev => ({
      ...prev,
      marveeTestFilters: {
        ...prev.marveeTestFilters,
        [key]: value,
      },
    }));
  }, []);

  const clearMarveeTestFilters = useCallback(() => {
    setState(prev => ({
      ...prev,
      marveeTestFilters: { ...defaultMarveeTestFilters },
    }));
  }, []);

  return (
    <AppPreferencesContext.Provider
      value={{
        ...state,
        setFinancialYear,
        setFinancialMonth,
        setAnalysisMonth,
        setCashFlowPresentation,
        setCashFlowStatusFilter,
        setCashFlowShowPercentage,
        setAnalysisYear,
        setAnalysisComparisonType,
        setAnalysisPeriodType,
        setAnalysisSelectedYears,
        setAnalysisRangePreset,
        setAnalysisShowTarget,
        setAdminDashboardTab,
        setColaboradoresFilter,
        setEquipamentosFilter,
        setApprovalFilter,
        clearApprovalFilters,
        setSolicitacoesTab,
        setMarveeTestFilter,
        clearMarveeTestFilters,
      }}
    >
      {children}
    </AppPreferencesContext.Provider>
  );
};

export const useAppPreferences = () => {
  const context = useContext(AppPreferencesContext);
  if (!context) {
    throw new Error("useAppPreferences must be used within an AppPreferencesProvider");
  }
  return context;
};
