import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import MetricCard from "../MetricCard";
import { CalendarDays } from "lucide-react";

interface AgeData {
  value?: number;
  timestamp?: string;
  birthdate?: string;
}

interface AgeWidgetProps {
  data?: AgeData;
  loading?: boolean;
}

export default function AgeWidget({ data, loading }: AgeWidgetProps) {
  // Calculate age from birthdate if available and value is not provided
  let displayAge = data?.value;
  if (!displayAge && data?.birthdate) {
    const birthDate = new Date(data.birthdate);
    const today = new Date();
    displayAge = Math.floor((today.getTime() - birthDate.getTime()) / (365.25 * 24 * 60 * 60 * 1000));
  }

  // Format the birthday for display
  const formattedBirthdate = data?.birthdate 
    ? new Date(data.birthdate).toLocaleDateString() 
    : 'Not recorded';

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-xl font-bold">Age</CardTitle>
        <CalendarDays className="h-5 w-5 text-primary" />
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <MetricCard
            title="Age"
            value={displayAge}
            unit="years"
            loading={loading}
          />
          <MetricCard
            title="Birthdate"
            value={formattedBirthdate}
            loading={loading}
          />
        </div>
      </CardContent>
    </Card>
  );
} 