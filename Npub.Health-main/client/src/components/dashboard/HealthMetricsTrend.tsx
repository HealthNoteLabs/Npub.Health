import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

interface TimeSeriesData {
  date: string;
  [key: string]: number | string;
}

interface HealthMetricsTrendProps {
  data?: TimeSeriesData[];
  loading?: boolean;
}

// Define colors for each metric
const metricColors = {
  running: "hsl(var(--chart-1))",
  meditation: "hsl(var(--chart-2))",
  habits: "hsl(var(--chart-3))",
  sleep: "hsl(var(--chart-4))",
  nutrition: "hsl(var(--chart-5))",
  spiritual: "hsl(var(--primary))",
  lifting: "hsl(var(--secondary))"
};

const metricLabels = {
  running: "Running (km)",
  meditation: "Meditation (min)",
  habits: "Habits Completed",
  sleep: "Sleep Duration (hrs)",
  nutrition: "Calories (kcal/100)",
  spiritual: "Spiritual Score",
  lifting: "Weight Lifted (kg/10)"
};

export default function HealthMetricsTrend({ data, loading }: HealthMetricsTrendProps) {
  // Sample data structure for demonstration
  const sampleData = [
    {
      date: '2025-02-08',
      running: 5.2,
      meditation: 15,
      habits: 8,
      sleep: 7.5,
      nutrition: 22,
      spiritual: 85,
      lifting: 120
    },
    // Add more sample data points...
    {
      date: '2025-02-14',
      running: 7.0,
      meditation: 20,
      habits: 10,
      sleep: 8.0,
      nutrition: 25,
      spiritual: 90,
      lifting: 150
    }
  ];

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Health Metrics Trends</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[400px] w-full flex items-center justify-center bg-muted/5 rounded-md">
            <p className="text-muted-foreground">Loading data...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const chartData = data || sampleData;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Health Metrics Trends</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[400px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis
                dataKey="date"
                className="text-xs text-muted-foreground"
                tickFormatter={(value) => new Date(value).toLocaleDateString()}
              />
              <YAxis className="text-xs text-muted-foreground" />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--background))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "var(--radius)",
                }}
                labelStyle={{ color: "hsl(var(--foreground))" }}
              />
              <Legend />
              {Object.entries(metricLabels).map(([key, label]) => (
                <Line
                  key={key}
                  type="monotone"
                  dataKey={key}
                  name={label}
                  stroke={metricColors[key as keyof typeof metricColors]}
                  strokeWidth={2}
                  dot={false}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
