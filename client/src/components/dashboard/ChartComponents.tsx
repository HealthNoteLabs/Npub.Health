import {
  LineChart,
  Line,
  BarChart as RechartsBarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';
import { Card } from '@/components/ui/card';

interface TimeSeriesData {
  date: string;
  value: number;
}

interface MetricChartProps {
  data: TimeSeriesData[];
  color?: string;
  loading?: boolean;
}

interface CategoryData {
  name: string;
  value: number;
}

interface CategoryChartProps {
  data: CategoryData[];
  color?: string;
  loading?: boolean;
}

export function MetricLineChart({ data, color = "hsl(var(--primary))", loading }: MetricChartProps) {
  if (loading || !data?.length) {
    return (
      <div className="h-[200px] w-full flex items-center justify-center bg-muted/5 rounded-md">
        <p className="text-muted-foreground">Loading data...</p>
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={200}>
      <LineChart data={data} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
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
        <Line
          type="monotone"
          dataKey="value"
          stroke={color}
          strokeWidth={2}
          dot={false}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}

export function MetricBarChart({ data, color = "hsl(var(--primary))", loading }: MetricChartProps) {
  if (loading || !data?.length) {
    return (
      <div className="h-[200px] w-full flex items-center justify-center bg-muted/5 rounded-md">
        <p className="text-muted-foreground">Loading data...</p>
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={200}>
      <RechartsBarChart data={data} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
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
        <Bar dataKey="value" fill={color} radius={[4, 4, 0, 0]} />
      </RechartsBarChart>
    </ResponsiveContainer>
  );
}

export function BarChart({ data, color = "hsl(var(--primary))", loading }: CategoryChartProps) {
  if (loading || !data?.length) {
    return (
      <div className="h-[200px] w-full flex items-center justify-center bg-muted/5 rounded-md">
        <p className="text-muted-foreground">Loading data...</p>
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={200}>
      <RechartsBarChart data={data} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
        <XAxis
          dataKey="name"
          className="text-xs text-muted-foreground"
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
        <Bar dataKey="value" fill={color} radius={[4, 4, 0, 0]} />
      </RechartsBarChart>
    </ResponsiveContainer>
  );
}
