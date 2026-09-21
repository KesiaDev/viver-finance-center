import { createContext, useContext, useState, ReactNode } from 'react';

export type DuplicateType = 'reembolso' | 'devolucao' | 'nota_fiscal' | 'material';

interface DuplicateData {
  type: DuplicateType;
  data: Record<string, any>;
}

interface DuplicateContextType {
  duplicateData: DuplicateData | null;
  setDuplicateData: (data: DuplicateData | null) => void;
  clearDuplicate: () => void;
}

const DuplicateContext = createContext<DuplicateContextType | undefined>(undefined);

export const DuplicateProvider = ({ children }: { children: ReactNode }) => {
  const [duplicateData, setDuplicateData] = useState<DuplicateData | null>(null);
  
  return (
    <DuplicateContext.Provider value={{
      duplicateData,
      setDuplicateData,
      clearDuplicate: () => setDuplicateData(null),
    }}>
      {children}
    </DuplicateContext.Provider>
  );
};

export const useDuplicate = () => {
  const context = useContext(DuplicateContext);
  if (!context) throw new Error("useDuplicate must be used within DuplicateProvider");
  return context;
};
