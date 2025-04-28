import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import MetricCard from "../MetricCard";
import { Brain } from "lucide-react";
import { MetricBarChart } from "../ChartComponents";

interface CalmstrWidgetProps {
  data?: {
    weeklyMinutes?: number;
    currentStreak?: number;
    lastSession?: string;
    // Add historical data for the chart
    sessionHistory?: Array<{ date: string; value: number }>;
  };
  loading?: boolean;
}

export default function CalmstrWidget({ data, loading }: CalmstrWidgetProps) {
  // Sample data for demonstration
  const sampleData = [
    { date: '2025-02-08', value: 15 },
    { date: '2025-02-09', value: 20 },
    { date: '2025-02-10', value: 10 },
    { date: '2025-02-11', value: 25 },
    { date: '2025-02-12', value: 30 },
    { date: '2025-02-13', value: 20 },
    { date: '2025-02-14', value: 15 },
  ];

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-xl font-bold">Meditation</CardTitle>
        <Brain className="h-5 w-5 text-primary" />
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <MetricCard
            title="Weekly Minutes"
            value={data?.weeklyMinutes}
            unit="min"
            loading={loading}
          />
          <MetricCard
            title="Current Streak"
            value={data?.currentStreak}
            unit="days"
            loading={loading}
          />
          <MetricCard
            title="Last Session"
            value={data?.lastSession}
            loading={loading}
          />
        </div>

        <div className="pt-4">
          <h4 className="text-sm font-medium text-muted-foreground mb-3">Daily Meditation Time (Last 7 Days)</h4>
          <MetricBarChart 
            data={data?.sessionHistory || sampleData}
            loading={loading}
            color="hsl(var(--chart-2))"
          />
        </div>
      </CardContent>
    </Card>
  );
}