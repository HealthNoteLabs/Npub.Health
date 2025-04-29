import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import MetricCard from "../MetricCard";
import { Scale } from "lucide-react";
import { MetricLineChart } from "../ChartComponents";

interface WeightData {
  value?: number;
  unit?: 'kg' | 'lb';
  timestamp?: string;
  history?: Array<{ value: number; timestamp: string }>;
}

interface WeightWidgetProps {
  data?: WeightData;
  loading?: boolean;
}

export default function WeightWidget({ data, loading }: WeightWidgetProps) {
  // Prepare chart data
  const chartData = data?.history?.map(entry => ({
    date: new Date(entry.timestamp).toISOString().split('T')[0],
    value: entry.value
  })) || generateSampleData();

  // Helper function to generate sample weight data if none is available
  function generateSampleData() {
    const today = new Date();
    return Array.from({ length: 7 }, (_, i) => {
      const date = new Date(today);
      date.setDate(date.getDate() - (6 - i));
      return {
        date: date.toISOString().split('T')[0],
        value: 75 - Math.random() * 2 // Sample weight around 75kg with slight variation
      };
    });
  }

  // Format the date for display
  const lastUpdated = data?.timestamp 
    ? new Date(data.timestamp).toLocaleDateString() 
    : 'Not recorded';

  // Get the trend direction
  const getTrend = () => {
    if (chartData.length < 2) return "stable";
    const first = chartData[0].value;
    const last = chartData[chartData.length - 1].value;
    const diff = last - first;
    
    if (Math.abs(diff) < 0.5) return "stable"; // If change is small, consider it stable
    return diff < 0 ? "down" : "up";
  };

  const trend = getTrend();

  return (
    <Card variant="glass" className="overflow-hidden">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 border-b border-border/30 bg-primary/5">
        <CardTitle className="text-lg font-medium flex items-center gap-2">
          <Scale className="h-5 w-5 text-health-blue" />
          Weight
        </CardTitle>
        <div className="h-7 px-2 rounded-full bg-muted/50 text-xs flex items-center font-medium text-muted-foreground">
          Last 7 days
        </div>
      </CardHeader>
      <CardContent className="space-y-4 p-4">
        <div className="grid grid-cols-2 gap-4">
          <MetricCard
            title="Current Weight"
            value={data?.value}
            unit={data?.unit || 'kg'}
            loading={loading}
            trend={trend}
            color="hsl(var(--health-blue))"
          />
          <MetricCard
            title="Last Updated"
            value={lastUpdated}
            loading={loading}
            color="hsl(var(--health-purple))"
          />
        </div>

        <div className="pt-2">
          <h4 className="text-sm font-medium text-muted-foreground mb-3">Weight Trend</h4>
          <div className="bg-card/30 p-3 rounded-md border border-border/30">
            <MetricLineChart 
              data={chartData}
              loading={loading}
              color="hsl(var(--health-blue))"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
} 