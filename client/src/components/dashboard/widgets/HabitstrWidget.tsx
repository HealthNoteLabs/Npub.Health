import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import MetricCard from "../MetricCard";
import { CheckSquare } from "lucide-react";
import { MetricBarChart } from "../ChartComponents";

interface HabitstrWidgetProps {
  data?: {
    completed?: number;
    total?: number;
    streak?: number;
    // Add historical data for the chart
    habitsHistory?: Array<{ date: string; value: number }>;
  };
  loading?: boolean;
}

export default function HabitstrWidget({ data, loading }: HabitstrWidgetProps) {
  // Sample data for demonstration
  const sampleData = [
    { date: '2025-02-08', value: 6 },
    { date: '2025-02-09', value: 8 },
    { date: '2025-02-10', value: 7 },
    { date: '2025-02-11', value: 9 },
    { date: '2025-02-12', value: 5 },
    { date: '2025-02-13', value: 8 },
    { date: '2025-02-14', value: 7 },
  ];

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-xl font-bold">Habits</CardTitle>
        <CheckSquare className="h-5 w-5 text-primary" />
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <MetricCard
            title="Completed Today"
            value={data?.completed}
            loading={loading}
          />
          <MetricCard
            title="Total Habits"
            value={data?.total}
            loading={loading}
          />
          <MetricCard
            title="Current Streak"
            value={data?.streak}
            unit="days"
            loading={loading}
          />
        </div>

        <div className="pt-4">
          <h4 className="text-sm font-medium text-muted-foreground mb-3">Daily Habits Completed (Last 7 Days)</h4>
          <MetricBarChart 
            data={data?.habitsHistory || sampleData}
            loading={loading}
            color="hsl(var(--chart-3))"
          />
        </div>
      </CardContent>
    </Card>
  );
}