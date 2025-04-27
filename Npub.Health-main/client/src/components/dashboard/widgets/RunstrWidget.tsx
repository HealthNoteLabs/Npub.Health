import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import MetricCard from "../MetricCard";
import { ActivitySquare } from "lucide-react";
import { MetricLineChart } from "../ChartComponents";

interface RunstrWidgetProps {
  data?: {
    weeklyDistance?: number;
    lastRunDate?: string;
    avgPace?: number;
    totalRuns?: number;
    // Add historical data for the chart
    distanceHistory?: Array<{ date: string; value: number }>;
  };
  loading?: boolean;
}

export default function RunstrWidget({ data, loading }: RunstrWidgetProps) {
  // Sample data for demonstration
  const sampleData = [
    { date: '2025-02-08', value: 5.2 },
    { date: '2025-02-09', value: 3.1 },
    { date: '2025-02-10', value: 4.5 },
    { date: '2025-02-11', value: 6.2 },
    { date: '2025-02-12', value: 4.8 },
    { date: '2025-02-13', value: 5.5 },
    { date: '2025-02-14', value: 7.0 },
  ];

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-xl font-bold">Running</CardTitle>
        <ActivitySquare className="h-5 w-5 text-primary" />
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <MetricCard
            title="Weekly Distance"
            value={data?.weeklyDistance}
            unit="km"
            loading={loading}
          />
          <MetricCard
            title="Avg Pace"
            value={data?.avgPace}
            unit="min/km"
            loading={loading}
          />
          <MetricCard
            title="Total Runs"
            value={data?.totalRuns}
            loading={loading}
          />
          <MetricCard
            title="Last Run"
            value={data?.lastRunDate}
            loading={loading}
          />
        </div>

        <div className="pt-4">
          <h4 className="text-sm font-medium text-muted-foreground mb-3">Distance Trend (Last 7 Days)</h4>
          <MetricLineChart 
            data={data?.distanceHistory || sampleData}
            loading={loading}
          />
        </div>
      </CardContent>
    </Card>
  );
}