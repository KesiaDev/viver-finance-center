import { Download } from "lucide-react";
import * as XLSX from "xlsx";
import { Button } from "@/components/ui/button";
import { CashFlowRow, StatusFilter } from "@/hooks/useCashFlowData";
import { formatCurrency } from "@/lib/taxCalculations";

interface CashFlowExportButtonProps {
  rows: CashFlowRow[];
  months: string[];
  year: number;
  statusFilter: StatusFilter;
}

const MONTH_LABELS = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
];

export const CashFlowExportButton = ({
  rows,
  months,
  year,
  statusFilter,
}: CashFlowExportButtonProps) => {
  const handleExport = () => {
    const exportData: Record<string, string | number>[] = [];

    const flattenRows = (rowList: CashFlowRow[], level = 0) => {
      rowList.forEach((row) => {
        const indent = "  ".repeat(level);
        const rowData: Record<string, string | number> = {
          Categoria: `${indent}${row.code !== "GCO" && row.code !== "GCP" && row.code !== "SF" && row.code !== "00" ? `${row.code} - ` : ""}${row.name}`,
        };

        months.forEach((month, index) => {
          const monthValue = row.values[month] || { realized: 0, projected: 0 };
          
          if (statusFilter === "both") {
            rowData[`${MONTH_LABELS[index]} (R)`] = monthValue.realized;
            rowData[`${MONTH_LABELS[index]} (P)`] = monthValue.projected;
          } else if (statusFilter === "realized") {
            rowData[MONTH_LABELS[index]] = monthValue.realized;
          } else {
            rowData[MONTH_LABELS[index]] = monthValue.projected;
          }
        });

        if (statusFilter === "both") {
          rowData["Total (R)"] = row.total.realized;
          rowData["Total (P)"] = row.total.projected;
        } else {
          rowData["Total"] = statusFilter === "realized" ? row.total.realized : row.total.projected;
        }

        exportData.push(rowData);

        if (row.children && row.children.length > 0) {
          flattenRows(row.children, level + 1);
        }
      });
    };

    flattenRows(rows);

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Fluxo de Caixa");

    // Ajustar largura das colunas
    const colWidths = [{ wch: 40 }];
    months.forEach(() => {
      if (statusFilter === "both") {
        colWidths.push({ wch: 15 }, { wch: 15 });
      } else {
        colWidths.push({ wch: 15 });
      }
    });
    if (statusFilter === "both") {
      colWidths.push({ wch: 15 }, { wch: 15 });
    } else {
      colWidths.push({ wch: 15 });
    }
    worksheet["!cols"] = colWidths;

    XLSX.writeFile(workbook, `fluxo_caixa_${year}.xlsx`);
  };

  return (
    <Button variant="outline" onClick={handleExport} className="gap-2">
      <Download className="w-4 h-4" />
      Exportar Excel
    </Button>
  );
};
