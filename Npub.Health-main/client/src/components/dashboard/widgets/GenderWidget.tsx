import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import MetricCard from "../MetricCard";
import { User } from "lucide-react";

interface GenderData {
  value?: string;
  timestamp?: string;
}

interface GenderWidgetProps {
  data?: GenderData;
  loading?: boolean;
}

export default function GenderWidget({ data, loading }: GenderWidgetProps) {
  // Format the date for display
  const lastUpdated = data?.timestamp 
    ? new Date(data.timestamp).toLocaleDateString() 
    : 'Not recorded';

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-xl font-bold">Gender</CardTitle>
        <User className="h-5 w-5 text-primary" />
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <MetricCard
            title="Gender"
            value={data?.value || 'Not specified'}
            loading={loading}
          />
          <MetricCard
            title="Last Updated"
            value={lastUpdated}
            loading={loading}
          />
        </div>
      </CardContent>
    </Card>
  );
} 