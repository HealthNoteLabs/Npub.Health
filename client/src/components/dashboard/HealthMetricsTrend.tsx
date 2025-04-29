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
  weight: "hsl(var(--destructive))",
  calories: "hsl(var(--chart-5))",
  workout: "hsl(var(--secondary))",
  height: "hsl(var(--chart-1))"
};

const metricLabels = {
  weight: "Weight (kg)",
  calories: "Calories (kcal)",
  workout: "Workout Duration (min)",
  height: "Height (cm)"
};

export default function HealthMetricsTrend({ data, loading }: HealthMetricsTrendProps) {
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

  // Check if we have valid data
  const chartData = data && data.length > 0 ? data : [];
  
  // If no data, show message
  if (chartData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Health Metrics Trends</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[400px] w-full flex items-center justify-center bg-muted/5 rounded-md">
            <p className="text-muted-foreground">No trend data available yet. Start tracking your metrics to see trends over time.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

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
