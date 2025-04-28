import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import MetricCard from "../MetricCard";
import { Utensils } from "lucide-react";
import { MetricLineChart } from "../ChartComponents";

interface DietstrWidgetProps {
  data?: {
    calories?: number;
    protein?: number;
    water?: number;
    // Add historical data for the chart
    calorieHistory?: Array<{ date: string; value: number }>;
  };
  loading?: boolean;
}

export default function DietstrWidget({ data, loading }: DietstrWidgetProps) {
  // Sample data for demonstration
  const sampleData = [
    { date: '2025-02-08', value: 2200 },
    { date: '2025-02-09', value: 2100 },
    { date: '2025-02-10', value: 2400 },
    { date: '2025-02-11', value: 1900 },
    { date: '2025-02-12', value: 2300 },
    { date: '2025-02-13', value: 2150 },
    { date: '2025-02-14', value: 2250 },
  ];

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-xl font-bold">Nutrition</CardTitle>
        <Utensils className="h-5 w-5 text-primary" />
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <MetricCard
            title="Calories"
            value={data?.calories}
            unit="kcal"
            loading={loading}
          />
          <MetricCard
            title="Protein"
            value={data?.protein}
            unit="g"
            loading={loading}
          />
          <MetricCard
            title="Water"
            value={data?.water}
            unit="L"
            loading={loading}
          />
        </div>

        <div className="pt-4">
          <h4 className="text-sm font-medium text-muted-foreground mb-3">Calorie Intake (Last 7 Days)</h4>
          <MetricLineChart 
            data={data?.calorieHistory || sampleData}
            loading={loading}
            color="hsl(var(--chart-5))"
          />
        </div>
      </CardContent>
    </Card>
  );
}