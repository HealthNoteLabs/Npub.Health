import React, { useMemo } from 'react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export type DataPoint = {
  date: string | number; // ISO string or timestamp
  value: number;
  [key: string]: any; // Allow additional properties
};

export interface MetricChartProps {
  title: string;
  description?: string;
  data: DataPoint[];
  dataKey?: string;
  height?: number;
  showGrid?: boolean;
  showTooltip?: boolean;
  tooltipFormatter?: (value: number) => string;
  chartType?: 'line' | 'area';
  color?: string;
  gradientFrom?: string;
  gradientTo?: string;
  yAxisFormatter?: (value: number) => string;
  xAxisFormatter?: (value: string | number) => string;
  xAxisDataKey?: string;
  className?: string;
}

export function MetricChart({
  title,
  description,
  data,
  dataKey = 'value',
  height = 200,
  showGrid = false,
  showTooltip = true,
  tooltipFormatter,
  chartType = 'area',
  color = 'hsl(var(--primary))',
  gradientFrom = color,
  gradientTo = 'rgba(0, 0, 0, 0)',
  yAxisFormatter,
  xAxisFormatter,
  xAxisDataKey = 'date',
  className,
}: MetricChartProps) {
  const chartId = useMemo(() => `chart-${Math.random().toString(36).substring(2, 9)}`, []);
  
  // Format data if needed
  const processedData = useMemo(() => {
    return data.map(item => {
      // Convert date to display format if it's an ISO string
      const processed = { ...item };
      if (typeof processed.date === 'string' && processed.date.includes('T')) {
        const date = new Date(processed.date);
        processed.displayDate = `${date.getMonth() + 1}/${date.getDate()}`;
      }
      return processed;
    });
  }, [data]);

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent>
        <div style={{ height: height }}>
          {processedData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              {chartType === 'area' ? (
                <AreaChart data={processedData} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
                  <defs>
                    <linearGradient id={chartId} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={gradientFrom} stopOpacity={0.3} />
                      <stop offset="95%" stopColor={gradientTo} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  
                  {showGrid && <CartesianGrid strokeDasharray="3 3" vertical={false} />}
                  
                  <XAxis 
                    dataKey={xAxisDataKey} 
                    tickFormatter={xAxisFormatter}
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 12 }}
                    dy={5}
                  />
                  
                  <YAxis 
                    tickFormatter={yAxisFormatter}
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 12 }}
                    dx={-5}
                  />
                  
                  {showTooltip && (
                    <Tooltip 
                      formatter={tooltipFormatter}
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--background))', 
                        border: '1px solid hsl(var(--border))', 
                        borderRadius: '6px',
                        fontSize: '12px'
                      }}
                    />
                  )}
                  
                  <Area 
                    type="monotone" 
                    dataKey={dataKey} 
                    stroke={color} 
                    fill={`url(#${chartId})`}
                    strokeWidth={2}
                  />
                </AreaChart>
              ) : (
                <LineChart data={processedData} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
                  {showGrid && <CartesianGrid strokeDasharray="3 3" vertical={false} />}
                  
                  <XAxis 
                    dataKey={xAxisDataKey} 
                    tickFormatter={xAxisFormatter}
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 12 }}
                    dy={5}
                  />
                  
                  <YAxis 
                    tickFormatter={yAxisFormatter}
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 12 }}
                    dx={-5}
                  />
                  
                  {showTooltip && (
                    <Tooltip 
                      formatter={tooltipFormatter}
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--background))', 
                        border: '1px solid hsl(var(--border))', 
                        borderRadius: '6px',
                        fontSize: '12px'
                      }}
                    />
                  )}
                  
                  <Line 
                    type="monotone" 
                    dataKey={dataKey} 
                    stroke={color} 
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              )}
            </ResponsiveContainer>
          ) : (
            <div className="flex h-full w-full items-center justify-center text-sm text-muted-foreground">
              No data available
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
} 