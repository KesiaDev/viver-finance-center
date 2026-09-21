import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";

interface SalesTargetDistributionProps {
  cashPercentage: number;
  recurringPercentage: number;
  title?: string;
}

export const SalesTargetDistribution = ({
  cashPercentage,
  recurringPercentage,
  title = "Distribuição de Vendas",
}: SalesTargetDistributionProps) => {
  const data = [
    { name: "À Vista", value: cashPercentage },
    { name: "Recorrente", value: recurringPercentage },
  ];

  const COLORS = ["hsl(142, 76%, 36%)", "hsl(221, 83%, 53%)"];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={250}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={80}
              paddingAngle={5}
              dataKey="value"
              label={({ value }) => `${value}%`}
            >
              {data.map((_, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index]} />
              ))}
            </Pie>
            <Tooltip
              formatter={(value: number) => `${value}%`}
              contentStyle={{
                backgroundColor: 'hsl(var(--background))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px',
              }}
            />
            <Legend />
          </PieChart>
        </ResponsiveContainer>

        <div className="grid grid-cols-2 gap-4 mt-4 text-center">
          <div className="p-3 rounded-lg bg-green-100 dark:bg-green-900/20">
            <p className="text-sm text-muted-foreground">À Vista</p>
            <p className="text-2xl font-bold text-green-600">{cashPercentage}%</p>
          </div>
          <div className="p-3 rounded-lg bg-blue-100 dark:bg-blue-900/20">
            <p className="text-sm text-muted-foreground">Recorrente</p>
            <p className="text-2xl font-bold text-blue-600">{recurringPercentage}%</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
