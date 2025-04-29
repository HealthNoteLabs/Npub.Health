import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import MetricCard from "../MetricCard";
import { Utensils, Loader2 } from "lucide-react";
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
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : data?.calories ? (
          <>
            <div className="grid grid-cols-1 gap-4">
              <MetricCard
                title="Calories"
                value={data.calories}
                unit="kcal"
                loading={false}
              />
            </div>
            <div className="pt-4">
              <p className="text-sm text-muted-foreground mb-3">
                More detailed nutrition tracking (protein, water, etc.) is not currently enabled.
              </p>
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center h-48 text-center">
            <p className="text-muted-foreground mb-2">Nutrition data is not currently being tracked.</p>
            <p className="text-sm text-muted-foreground">Enable nutrition tracking in your profile settings to see your data here.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}