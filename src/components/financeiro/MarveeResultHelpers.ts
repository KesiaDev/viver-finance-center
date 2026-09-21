import { parse, format, isValid } from "date-fns";

export const formatDate = (str: string | null | undefined): string => {
  if (!str) return "-";
  // Try ISO format first
  const d = new Date(str);
  if (isValid(d)) return format(d, "dd/MM/yyyy");
  // Try dd/MM/yyyy
  const parsed = parse(str, "dd/MM/yyyy", new Date());
  if (isValid(parsed)) return format(parsed, "dd/MM/yyyy");
  return str;
};

export const formatCurrency = (val: number | string | null | undefined): string => {
  if (val == null || val === "") return "R$ 0,00";
  const num = typeof val === "string" ? parseFloat(val) : val;
  if (isNaN(num)) return "R$ 0,00";
  return num.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
};

export interface MarveeRecord {
  expiration_date?: string | null;
  data_liquidacao?: string | null;
  payment_date?: string | null;
  original_value?: number | string | null;
  movement_value?: number | string | null;
  document?: {
    payment_method_type?: string | null;
    description?: string | null;
    category_level_1?: { description?: string | null } | null;
    category_level_2?: { description?: string | null } | null;
    category_level_3?: { description?: string | null } | null;
    people?: {
      name?: string | null;
      fantasy_name?: string | null;
    } | null;
  } | null;
  [key: string]: unknown;
}

export interface GroupedRow {
  cat1: string;
  cat2: string;
  cat3: string;
  count: number;
  total: number;
  movementTotal: number;
  records: MarveeRecord[];
}

export interface MarveeExtratoRecord {
  guid: string;
  source: string;
  typecolumn: string;
  type: number;
  value?: number;
  treasury?: {
    movement_date: string;
    value: number;
    comments?: string;
  } | null;
  account: {
    id: number;
    name: string;
    bank_code?: string;
  };
  installment?: {
    id: number;
    expiration_date?: string;
    original_value?: number;
    movement_value?: number;
    document?: {
      description?: string;
      code?: string;
      category_level_1?: { description?: string } | null;
      people?: { name?: string; fantasy_name?: string } | null;
    } | null;
  } | null;
  [key: string]: unknown;
}

export interface ExtratoGroupedRow {
  typecolumn: string;
  source: string;
  status: string;
  count: number;
  total: number;
  records: MarveeExtratoRecord[];
}

export const getExtratoValue = (r: MarveeExtratoRecord): number => {
  const isReceita = r.source === "bills_to_receive";
  const hasTreasury = r.treasury != null;

  if (hasTreasury) {
    // REALIZADO
    if (isReceita) {
      // Receita: movement_value captura juros/descontos
      const mv = Number(r.installment?.movement_value ?? 0);
      if (mv !== 0) return Math.abs(mv);
      return Math.abs(Number(r.treasury!.value ?? 0));
    } else {
      // Despesa: treasury.value = valor efetivamente pago
      return Math.abs(Number(r.treasury!.value ?? 0));
    }
  }

  // PREVISTO (sem treasury): original_value tem o valor real
  const ov = Number(r.installment?.original_value ?? 0);
  if (ov !== 0) return Math.abs(ov);
  if (r.value != null) return Math.abs(Number(r.value));
  return 0;
};

export const getExtratoStatus = (r: MarveeExtratoRecord): string => {
  return r.treasury ? "realizado" : "projetado";
};

export const groupExtratoByFields = (records: MarveeExtratoRecord[]): ExtratoGroupedRow[] => {
  const map = new Map<string, ExtratoGroupedRow>();

  for (const r of records) {
    const status = getExtratoStatus(r);
    const key = `${r.typecolumn}||${r.source}||${status}`;

    if (!map.has(key)) {
      map.set(key, { typecolumn: r.typecolumn, source: r.source, status, count: 0, total: 0, records: [] });
    }
    const group = map.get(key)!;
    group.count++;
    group.total += getExtratoValue(r);
    group.records.push(r);
  }

  return Array.from(map.values()).sort((a, b) =>
    `${a.typecolumn}${a.source}${a.status}`.localeCompare(`${b.typecolumn}${b.source}${b.status}`)
  );
};

export const groupByCategory = (records: MarveeRecord[], levels: number[] = [1, 2, 3]): GroupedRow[] => {
  const map = new Map<string, GroupedRow>();

  for (const r of records) {
    const cat1 = levels.includes(1) ? (r.document?.category_level_1?.description || "(Sem categoria)") : "-";
    const cat2 = levels.includes(2) ? (r.document?.category_level_2?.description || "-") : "-";
    const cat3 = levels.includes(3) ? (r.document?.category_level_3?.description || "-") : "-";
    const keyParts: string[] = [];
    if (levels.includes(1)) keyParts.push(cat1);
    if (levels.includes(2)) keyParts.push(cat2);
    if (levels.includes(3)) keyParts.push(cat3);
    const key = keyParts.join("||") || "-";

    if (!map.has(key)) {
      map.set(key, { cat1, cat2, cat3, count: 0, total: 0, movementTotal: 0, records: [] });
    }
    const group = map.get(key)!;
    group.count++;
    group.total += parseFloat(String(r.original_value ?? 0));
    group.movementTotal += parseFloat(String(r.movement_value ?? 0));
    group.records.push(r);
  }

  return Array.from(map.values()).sort((a, b) =>
    `${a.cat1}${a.cat2}${a.cat3}`.localeCompare(`${b.cat1}${b.cat2}${b.cat3}`)
  );
};
