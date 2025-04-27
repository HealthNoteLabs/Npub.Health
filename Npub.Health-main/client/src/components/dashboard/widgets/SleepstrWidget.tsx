import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import MetricCard from "../MetricCard";
import { Moon } from "lucide-react";
import { MetricBarChart } from "../ChartComponents";

interface SleepstrWidgetProps {
  data?: {
    avgDuration?: number;
    quality?: number;
    lastNight?: number;
    // Add historical data for the chart
    sleepHistory?: Array<{ date: string; value: number }>;
  };
  loading?: boolean;
}

export default function SleepstrWidget({ data, loading }: SleepstrWidgetProps) {
  // Sample data for demonstration
  const sampleData = [
    { date: '2025-02-08', value: 7.5 },
    { date: '2025-02-09', value: 6.8 },
    { date: '2025-02-10', value: 8.2 },
    { date: '2025-02-11', value: 7.0 },
    { date: '2025-02-12', value: 7.8 },
    { date: '2025-02-13', value: 6.5 },
    { date: '2025-02-14', value: 7.2 },
  ];

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-xl font-bold">Sleep</CardTitle>
        <Moon className="h-5 w-5 text-primary" />
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <MetricCard
            title="Avg Duration"
            value={data?.avgDuration}
            unit="hrs"
            loading={loading}
          />
          <MetricCard
            title="Sleep Quality"
            value={data?.quality}
            unit="%"
            loading={loading}
          />
          <MetricCard
            title="Last Night"
            value={data?.lastNight}
            unit="hrs"
            loading={loading}
          />
        </div>

        <div className="pt-4">
          <h4 className="text-sm font-medium text-muted-foreground mb-3">Sleep Duration (Last 7 Days)</h4>
          <MetricBarChart 
            data={data?.sleepHistory || sampleData}
            loading={loading}
            color="hsl(var(--chart-4))"
          />
        </div>
      </CardContent>
    </Card>
  );
}