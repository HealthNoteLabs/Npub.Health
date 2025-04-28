import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import MetricCard from "../MetricCard";
import { Dumbbell } from "lucide-react";
import { MetricLineChart } from "../ChartComponents";

interface LiftstrWidgetProps {
  data?: {
    totalWeight?: number;
    personalBests?: number;
    workouts?: number;
    // Add historical data for the chart
    weightHistory?: Array<{ date: string; value: number }>;
  };
  loading?: boolean;
}

export default function LiftstrWidget({ data, loading }: LiftstrWidgetProps) {
  // Sample data for demonstration
  const sampleData = [
    { date: '2025-02-08', value: 1200 },
    { date: '2025-02-09', value: 1150 },
    { date: '2025-02-10', value: 1300 },
    { date: '2025-02-11', value: 1250 },
    { date: '2025-02-12', value: 1400 },
    { date: '2025-02-13', value: 1350 },
    { date: '2025-02-14', value: 1450 },
  ];

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-xl font-bold">Lifting</CardTitle>
        <Dumbbell className="h-5 w-5 text-primary" />
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <MetricCard
            title="Total Weight"
            value={data?.totalWeight}
            unit="kg"
            loading={loading}
          />
          <MetricCard
            title="Personal Bests"
            value={data?.personalBests}
            loading={loading}
          />
          <MetricCard
            title="Workouts"
            value={data?.workouts}
            loading={loading}
          />
        </div>

        <div className="pt-4">
          <h4 className="text-sm font-medium text-muted-foreground mb-3">Daily Volume (Last 7 Days)</h4>
          <MetricLineChart 
            data={data?.weightHistory || sampleData}
            loading={loading}
            color="hsl(var(--secondary))"
          />
        </div>
      </CardContent>
    </Card>
  );
}