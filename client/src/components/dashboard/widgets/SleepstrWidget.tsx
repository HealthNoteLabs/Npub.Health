import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import MetricCard from "../MetricCard";
import { Moon, Loader2 } from "lucide-react";
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
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-xl font-bold">Sleep</CardTitle>
        <Moon className="h-5 w-5 text-primary" />
      </CardHeader>
      <CardContent className="space-y-4">
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-48 text-center">
            <p className="text-muted-foreground mb-2">Sleep data is not currently being tracked.</p>
            <p className="text-sm text-muted-foreground">Enable sleep tracking in your profile settings to see your data here.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}