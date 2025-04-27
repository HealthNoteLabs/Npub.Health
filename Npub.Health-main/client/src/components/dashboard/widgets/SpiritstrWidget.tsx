import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import MetricCard from "../MetricCard";
import { Heart } from "lucide-react";
import { MetricLineChart } from "../ChartComponents";

interface SpiritstrWidgetProps {
  data?: {
    meditationMinutes?: number;
    journalEntries?: number;
    gratitudeNotes?: number;
    // Add historical data for the chart
    spiritualHistory?: Array<{ date: string; value: number }>;
  };
  loading?: boolean;
}

export default function SpiritstrWidget({ data, loading }: SpiritstrWidgetProps) {
  // Sample data for demonstration
  const sampleData = [
    { date: '2025-02-08', value: 75 },
    { date: '2025-02-09', value: 82 },
    { date: '2025-02-10', value: 78 },
    { date: '2025-02-11', value: 85 },
    { date: '2025-02-12', value: 88 },
    { date: '2025-02-13', value: 84 },
    { date: '2025-02-14', value: 89 },
  ];

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-xl font-bold">Spiritual</CardTitle>
        <Heart className="h-5 w-5 text-primary" />
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <MetricCard
            title="Meditation"
            value={data?.meditationMinutes}
            unit="min"
            loading={loading}
          />
          <MetricCard
            title="Journal Entries"
            value={data?.journalEntries}
            loading={loading}
          />
          <MetricCard
            title="Gratitude Notes"
            value={data?.gratitudeNotes}
            loading={loading}
          />
        </div>

        <div className="pt-4">
          <h4 className="text-sm font-medium text-muted-foreground mb-3">Spiritual Score (Last 7 Days)</h4>
          <MetricLineChart 
            data={data?.spiritualHistory || sampleData}
            loading={loading}
            color="hsl(var(--primary))"
          />
        </div>
      </CardContent>
    </Card>
  );
}