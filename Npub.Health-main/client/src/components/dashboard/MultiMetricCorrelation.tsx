import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState } from "react";

interface HealthMetricData {
  date: string;
  [key: string]: number | string;
}

interface MultiMetricCorrelationProps {
  data: HealthMetricData[];
  loading?: boolean;
  metrics: Array<{
    id: string;
    name: string;
    unit: string;
    color: string;
  }>;
}

export default function MultiMetricCorrelation({ 
  data, 
  loading = false,
  metrics
}: MultiMetricCorrelationProps) {
  const [xAxis, setXAxis] = useState(metrics[0]?.id || '');
  const [yAxis, setYAxis] = useState(metrics[1]?.id || '');
  
  if (loading || !data?.length) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Metric Correlation Analysis</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[400px] w-full flex items-center justify-center bg-muted/5 rounded-md">
            <p className="text-muted-foreground">Loading data...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Find the selected metrics
  const xMetric = metrics.find(m => m.id === xAxis);
  const yMetric = metrics.find(m => m.id === yAxis);

  // Format the data for the scatter plot
  const scatterData = data.map(item => ({
    x: item[xAxis] as number,
    y: item[yAxis] as number,
    date: item.date
  })).filter(item => 
    typeof item.x === 'number' && 
    typeof item.y === 'number' && 
    !isNaN(item.x) && 
    !isNaN(item.y)
  );

  // Calculate correlation coefficient if we have enough data points
  let correlationCoefficient = 0;
  if (scatterData.length > 1) {
    const n = scatterData.length;
    const sumX = scatterData.reduce((sum, item) => sum + item.x, 0);
    const sumY = scatterData.reduce((sum, item) => sum + item.y, 0);
    const sumXY = scatterData.reduce((sum, item) => sum + (item.x * item.y), 0);
    const sumX2 = scatterData.reduce((sum, item) => sum + (item.x * item.x), 0);
    const sumY2 = scatterData.reduce((sum, item) => sum + (item.y * item.y), 0);
    
    correlationCoefficient = (n * sumXY - sumX * sumY) / 
      (Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY)));
  }

  const getCorrelationStrength = (r: number) => {
    const abs = Math.abs(r);
    if (abs >= 0.8) return 'Very strong';
    if (abs >= 0.6) return 'Strong';
    if (abs >= 0.4) return 'Moderate';
    if (abs >= 0.2) return 'Weak';
    return 'Very weak or none';
  };

  const getCorrelationDirection = (r: number) => {
    if (r > 0.05) return 'positive';
    if (r < -0.05) return 'negative';
    return 'no';
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Metric Correlation Analysis</CardTitle>
        <p className="text-sm text-muted-foreground">
          Analyze how different health metrics relate to each other
        </p>
      </CardHeader>
      <CardContent>
        <div className="flex justify-between mb-6 gap-4">
          <div className="flex flex-col w-1/2">
            <label className="text-sm text-muted-foreground mb-1">X-Axis Metric</label>
            <Select 
              value={xAxis} 
              onValueChange={setXAxis}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select metric" />
              </SelectTrigger>
              <SelectContent>
                {metrics.map(metric => (
                  <SelectItem key={metric.id} value={metric.id}>
                    {metric.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col w-1/2">
            <label className="text-sm text-muted-foreground mb-1">Y-Axis Metric</label>
            <Select 
              value={yAxis} 
              onValueChange={setYAxis}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select metric" />
              </SelectTrigger>
              <SelectContent>
                {metrics.map(metric => (
                  <SelectItem key={metric.id} value={metric.id}>
                    {metric.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {scatterData.length > 0 && xMetric && yMetric ? (
          <>
            <div className="mb-4 p-4 border rounded-md bg-muted/5">
              <p className="font-medium">Correlation Analysis:</p>
              <p className="text-sm">
                Correlation coefficient: <span className="font-bold">{correlationCoefficient.toFixed(2)}</span>
              </p>
              <p className="text-sm">
                This shows a {getCorrelationStrength(correlationCoefficient)} {getCorrelationDirection(correlationCoefficient)} correlation.
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                {Math.abs(correlationCoefficient) > 0.5 
                  ? `As your ${xMetric.name} ${correlationCoefficient > 0 ? 'increases' : 'decreases'}, your ${yMetric.name} tends to ${correlationCoefficient > 0 ? 'increase' : 'decrease'} as well.` 
                  : `There doesn't appear to be a strong relationship between your ${xMetric.name} and ${yMetric.name}.`
                }
              </p>
            </div>

            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis 
                    dataKey="x" 
                    name={xMetric.name} 
                    unit={xMetric.unit}
                    domain={['auto', 'auto']}
                    type="number"
                    label={{ 
                      value: `${xMetric.name} (${xMetric.unit})`, 
                      position: 'bottom', 
                      className: 'text-xs fill-muted-foreground'
                    }}
                    className="text-xs text-muted-foreground"
                  />
                  <YAxis 
                    dataKey="y" 
                    name={yMetric.name} 
                    unit={yMetric.unit}
                    domain={['auto', 'auto']}
                    type="number"
                    label={{ 
                      value: `${yMetric.name} (${yMetric.unit})`, 
                      angle: -90, 
                      position: 'left',
                      className: 'text-xs fill-muted-foreground'
                    }}
                    className="text-xs text-muted-foreground"
                  />
                  <Tooltip 
                    cursor={{ strokeDasharray: '3 3' }}
                    contentStyle={{
                      backgroundColor: "hsl(var(--background))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "var(--radius)",
                    }}
                    formatter={(value: number, name: string) => {
                      const metric = name === 'x' ? xMetric : yMetric;
                      return [`${value.toFixed(1)}${metric.unit}`, metric.name];
                    }}
                    labelFormatter={(label) => 'Data Point'}
                  />
                  <Scatter 
                    name="Correlation" 
                    data={scatterData} 
                    fill={yMetric.color}
                  />
                </ScatterChart>
              </ResponsiveContainer>
            </div>
          </>
        ) : (
          <div className="h-[300px] w-full flex items-center justify-center bg-muted/5 rounded-md">
            <p className="text-muted-foreground">
              {scatterData.length === 0 
                ? "Not enough data points for these metrics" 
                : "Select metrics to compare"}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
} 