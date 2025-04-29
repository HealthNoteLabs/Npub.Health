import React from 'react';
import {
  LineChart as RechartsLineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

export interface LineChartProps {
  data: Array<Record<string, any>>;
  dataKey: string;
  xAxisKey?: string;
  name?: string;
  stroke?: string;
  height?: number | string;
  width?: number | string;
  margin?: { top?: number; right?: number; left?: number; bottom?: number };
  grid?: boolean;
  tooltipFormatter?: (value: any, name: string) => [string, string];
  labelFormatter?: (label: any) => string;
  className?: string;
}

export const LineChart: React.FC<LineChartProps> = ({
  data,
  dataKey,
  xAxisKey = 'name',
  name,
  stroke = '#3b82f6',
  height = 300,
  width = '100%',
  margin = { top: 10, right: 30, left: 0, bottom: 5 },
  grid = true,
  tooltipFormatter,
  labelFormatter,
  className = ''
}) => {
  return (
    <div className={`relative ${className}`} style={{ height, width }}>
      <ResponsiveContainer width="100%" height="100%">
        <RechartsLineChart
          data={data}
          margin={margin}
        >
          {grid && <CartesianGrid strokeDasharray="3 3" opacity={0.1} />}
          <XAxis 
            dataKey={xAxisKey} 
            tick={{ fill: '#888', fontSize: 12 }}
            tickLine={{ stroke: '#888' }}
          />
          <YAxis 
            tick={{ fill: '#888', fontSize: 12 }}
            tickLine={{ stroke: '#888' }}
          />
          <Tooltip 
            formatter={tooltipFormatter}
            labelFormatter={labelFormatter}
            contentStyle={{
              backgroundColor: "hsl(var(--background))",
              border: "1px solid hsl(var(--border))",
              borderRadius: "var(--radius)",
            }}
          />
          <Legend />
          <Line 
            type="monotone" 
            dataKey={dataKey} 
            name={name || dataKey} 
            stroke={stroke} 
            strokeWidth={2} 
            dot={{ r: 4 }} 
            activeDot={{ r: 6 }} 
          />
        </RechartsLineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default LineChart; 