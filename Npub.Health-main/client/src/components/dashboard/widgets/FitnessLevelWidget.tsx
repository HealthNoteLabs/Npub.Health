import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import MetricCard from "../MetricCard";
import { Activity } from "lucide-react";

interface FitnessLevelData {
  value?: number;
  timestamp?: string;
}

interface FitnessLevelWidgetProps {
  data?: FitnessLevelData;
  loading?: boolean;
}

export default function FitnessLevelWidget({ data, loading }: FitnessLevelWidgetProps) {
  // Format the date for display
  const lastUpdated = data?.timestamp 
    ? new Date(data.timestamp).toLocaleDateString() 
    : 'Not recorded';

  // Get descriptive text for fitness level
  const fitnessDescription = getFitnessLevelDescription(data?.value || 0);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-xl font-bold">Fitness Level</CardTitle>
        <Activity className="h-5 w-5 text-primary" />
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <MetricCard
            title="Level"
            value={data?.value !== undefined ? `${data.value}/10` : 'N/A'}
            loading={loading}
          />
          <MetricCard
            title="Last Updated"
            value={lastUpdated}
            loading={loading}
          />
        </div>
        <p className="text-sm text-muted-foreground">{fitnessDescription}</p>
      </CardContent>
    </Card>
  );
}

// Helper function to get a descriptive text for the fitness level
function getFitnessLevelDescription(level: number): string {
  if (level === 0) return 'No fitness level recorded';
  if (level <= 2) return 'Beginning fitness journey';
  if (level <= 4) return 'Moderate activity level';
  if (level <= 6) return 'Regular fitness participant';
  if (level <= 8) return 'Advanced fitness level';
  return 'Elite fitness level';
} 