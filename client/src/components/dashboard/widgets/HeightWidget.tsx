import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import MetricCard from "../MetricCard";
import { RulerIcon } from "lucide-react";

interface HeightData {
  value?: number;
  unit?: 'cm' | 'in';
  displayValue?: string;
  displayUnit?: string;
  timestamp?: string;
}

interface HeightWidgetProps {
  data?: HeightData;
  loading?: boolean;
}

export default function HeightWidget({ data, loading }: HeightWidgetProps) {
  // Format the date for display
  const lastUpdated = data?.timestamp 
    ? new Date(data.timestamp).toLocaleDateString() 
    : 'Not recorded';

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-xl font-bold">Height</CardTitle>
        <RulerIcon className="h-5 w-5 text-primary" />
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <MetricCard
            title="Height"
            value={data?.displayValue || data?.value}
            unit={data?.displayUnit || data?.unit || 'ft-in'}
            loading={loading}
          />
          <MetricCard
            title="Last Updated"
            value={lastUpdated}
            loading={loading}
          />
        </div>
        {/* Height doesn't typically change frequently in adults, so no trend chart needed */}
      </CardContent>
    </Card>
  );
} 