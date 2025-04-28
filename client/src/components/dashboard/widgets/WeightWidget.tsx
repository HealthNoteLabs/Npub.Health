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

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-xl font-bold">Weight</CardTitle>
        <Scale className="h-5 w-5 text-primary" />
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <MetricCard
            title="Current Weight"
            value={data?.value}
            unit={data?.unit || 'kg'}
            loading={loading}
          />
          <MetricCard
            title="Last Updated"
            value={lastUpdated}
            loading={loading}
          />
        </div>

        <div className="pt-4">
          <h4 className="text-sm font-medium text-muted-foreground mb-3">Weight Trend</h4>
          <MetricLineChart 
            data={chartData}
            loading={loading}
            color="hsl(var(--primary))"
          />
        </div>
      </CardContent>
    </Card>
  );
} 