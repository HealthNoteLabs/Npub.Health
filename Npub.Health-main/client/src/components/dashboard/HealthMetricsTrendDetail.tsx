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
import { Button } from "@/components/ui/button";
import { useState } from "react";

interface TimeSeriesData {
  date: string;
  value: number;
}

interface HealthMetricsTrendDetailProps {
  title: string;
  data: TimeSeriesData[];
  color?: string;
  unit?: string;
  loading?: boolean;
  description?: string;
}

// Time range options
const TIME_RANGES = [
  { label: '1W', days: 7 },
  { label: '1M', days: 30 },
  { label: '3M', days: 90 },
  { label: '1Y', days: 365 },
  { label: 'All', days: 0 }
];

export default function HealthMetricsTrendDetail({ 
  title, 
  data, 
  color = "hsl(var(--primary))",
  unit = "", 
  loading = false,
  description
}: HealthMetricsTrendDetailProps) {
  const [timeRange, setTimeRange] = useState(TIME_RANGES[0]);
  
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{title} Trend</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[400px] w-full flex items-center justify-center bg-muted/5 rounded-md">
            <p className="text-muted-foreground">Loading data...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Filter data based on selected time range
  const filteredData = timeRange.days === 0 
    ? data 
    : data.filter(item => {
        const itemDate = new Date(item.date);
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - timeRange.days);
        return itemDate >= cutoffDate;
      });

  // Calculate statistics
  const stats = {
    current: filteredData.length ? filteredData[filteredData.length - 1].value : 0,
    min: Math.min(...filteredData.map(d => d.value)),
    max: Math.max(...filteredData.map(d => d.value)),
    avg: filteredData.reduce((sum, item) => sum + item.value, 0) / (filteredData.length || 1),
    change: filteredData.length > 1 
      ? filteredData[filteredData.length - 1].value - filteredData[0].value 
      : 0
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <CardTitle>{title} Trend</CardTitle>
          <div className="flex space-x-1">
            {TIME_RANGES.map(range => (
              <Button 
                key={range.label}
                variant={timeRange.label === range.label ? "default" : "outline"}
                size="sm"
                onClick={() => setTimeRange(range)}
                className="h-7 px-2 text-xs"
              >
                {range.label}
              </Button>
            ))}
          </div>
        </div>
        {description && (
          <p className="text-sm text-muted-foreground mt-1">{description}</p>
        )}
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="flex flex-col">
            <span className="text-sm text-muted-foreground">Current</span>
            <span className="text-xl font-bold">{stats.current.toFixed(1)}{unit}</span>
          </div>
          <div className="flex flex-col">
            <span className="text-sm text-muted-foreground">Avg</span>
            <span className="text-xl font-bold">{stats.avg.toFixed(1)}{unit}</span>
          </div>
          <div className="flex flex-col">
            <span className="text-sm text-muted-foreground">Min-Max</span>
            <span className="text-xl font-bold">{stats.min.toFixed(1)}-{stats.max.toFixed(1)}{unit}</span>
          </div>
          <div className="flex flex-col">
            <span className="text-sm text-muted-foreground">Change</span>
            <span className={`text-xl font-bold ${stats.change > 0 ? 'text-green-500' : stats.change < 0 ? 'text-red-500' : ''}`}>
              {stats.change > 0 ? '+' : ''}{stats.change.toFixed(1)}{unit}
            </span>
          </div>
        </div>

        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={filteredData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis
                dataKey="date"
                className="text-xs text-muted-foreground"
                tickFormatter={(value) => new Date(value).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
              />
              <YAxis 
                className="text-xs text-muted-foreground" 
                domain={['auto', 'auto']}
                tickFormatter={(value) => `${value}${unit}`}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--background))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "var(--radius)",
                }}
                labelStyle={{ color: "hsl(var(--foreground))" }}
                formatter={(value: number) => [`${value.toFixed(1)}${unit}`, title]}
                labelFormatter={(label) => new Date(label).toLocaleDateString()}
              />
              <Line
                type="monotone"
                dataKey="value"
                name={title}
                stroke={color}
                strokeWidth={2}
                dot={{ r: 3 }}
                activeDot={{ r: 5 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
} 