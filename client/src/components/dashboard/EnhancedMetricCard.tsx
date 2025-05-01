import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { ArrowUpIcon, ArrowDownIcon, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface MetricHistoryPoint {
  timestamp: number;
  value: number | string;
  displayValue?: string;
  unit?: string;
  displayUnit?: string;
}

export interface EnhancedMetricCardProps {
  title: string;
  value: string | number;
  unit?: string;
  displayValue?: string;
  displayUnit?: string;
  change?: number;
  historyData?: MetricHistoryPoint[];
  storageLocation?: 'relay' | 'blossom' | 'drive';
  encrypted?: boolean;
  onClick?: () => void;
  className?: string;
}

export default function EnhancedMetricCard({
  title,
  value,
  unit,
  displayValue,
  displayUnit,
  change = 0,
  historyData = [],
  storageLocation,
  encrypted,
  onClick,
  className
}: EnhancedMetricCardProps) {
  // Prepare data for chart
  const chartData = historyData.map(point => ({
    timestamp: new Date(point.timestamp * 1000).toLocaleDateString(),
    value: typeof point.value === 'string' ? parseFloat(point.value) : point.value,
  })).sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

  // Determine the color for the trend
  const trendColor = change > 0 ? 'text-green-500' : change < 0 ? 'text-red-500' : 'text-gray-500';
  
  // Determine storage icon and color
  let storageIndicator = null;
  if (storageLocation) {
    let color = 'bg-gray-200 text-gray-700';
    let label = 'Unknown';
    
    if (storageLocation === 'relay') {
      color = 'bg-blue-100 text-blue-800';
      label = 'Relay';
    } else if (storageLocation === 'blossom') {
      color = 'bg-purple-100 text-purple-800';
      label = 'Blossom';
    } else if (storageLocation === 'drive') {
      color = 'bg-green-100 text-green-800';
      label = encrypted ? 'Encrypted Drive' : 'Drive';
    }
    
    storageIndicator = (
      <div className={`text-xs px-2 py-1 rounded-full ${color}`}>
        {label}
      </div>
    );
  }

  // Format the value for display
  const displayValueText = displayValue || value;
  const displayUnitText = displayUnit || unit || '';

  return (
    <Card className={cn("overflow-hidden hover:shadow-md transition-all cursor-pointer", className)} onClick={onClick}>
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <CardTitle className="text-sm font-medium">{title}</CardTitle>
          {storageIndicator}
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex justify-between items-baseline mb-4">
          <div className="text-2xl font-bold">
            {displayValueText}
            {displayUnitText && <span className="text-sm font-normal ml-1">{displayUnitText}</span>}
          </div>
          <div className={cn("flex items-center text-sm", trendColor)}>
            {change > 0 ? (
              <ArrowUpIcon className="h-4 w-4 mr-1" />
            ) : change < 0 ? (
              <ArrowDownIcon className="h-4 w-4 mr-1" />
            ) : (
              <Minus className="h-4 w-4 mr-1" />
            )}
            <span>{Math.abs(change)}%</span>
          </div>
        </div>
        
        {historyData.length > 0 && (
          <div className="h-24 mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id={`gradient-${title}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="timestamp" hide />
                <YAxis hide domain={['auto', 'auto']} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'rgba(255, 255, 255, 0.8)',
                    border: 'none',
                    borderRadius: '4px',
                    boxShadow: '0 2px 6px rgba(0, 0, 0, 0.1)',
                  }}
                  formatter={(value) => [`${value} ${unit || ''}`, title]}
                  labelFormatter={(timestamp) => `Date: ${timestamp}`}
                />
                <Area 
                  type="monotone" 
                  dataKey="value" 
                  stroke="#3b82f6" 
                  fillOpacity={1}
                  fill={`url(#gradient-${title})`} 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
} 