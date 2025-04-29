import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar, ChevronLeft, ChevronRight, CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { MetricHistoryPoint } from './EnhancedMetricCard';

export interface MetricHistoryChartProps {
  title: string;
  historyData: MetricHistoryPoint[];
  unit?: string;
  displayUnit?: string;
  timeRanges?: string[];
  defaultRange?: string;
  className?: string;
}

export default function MetricHistoryChart({
  title,
  historyData,
  unit = '',
  displayUnit = '',
  timeRanges = ['1W', '1M', '3M', '6M', '1Y', 'All'],
  defaultRange = '1M',
  className
}: MetricHistoryChartProps) {
  const [selectedRange, setSelectedRange] = useState(defaultRange);
  const [chartType, setChartType] = useState<'line' | 'area' | 'bar'>('line');
  const [date, setDate] = useState<Date | undefined>(new Date());

  // Process data based on selected time range
  const processedData = React.useMemo(() => {
    // Sort by timestamp, earliest first
    const sortedData = [...historyData].sort((a, b) => a.timestamp - b.timestamp);
    
    // Filter based on time range
    const now = Date.now() / 1000; // Current time in seconds
    let filteredData = sortedData;
    
    if (selectedRange === '1W') {
      // Last 7 days
      filteredData = sortedData.filter(d => d.timestamp > now - 7 * 24 * 60 * 60);
    } else if (selectedRange === '1M') {
      // Last 30 days
      filteredData = sortedData.filter(d => d.timestamp > now - 30 * 24 * 60 * 60);
    } else if (selectedRange === '3M') {
      // Last 90 days
      filteredData = sortedData.filter(d => d.timestamp > now - 90 * 24 * 60 * 60);
    } else if (selectedRange === '6M') {
      // Last 180 days
      filteredData = sortedData.filter(d => d.timestamp > now - 180 * 24 * 60 * 60);
    } else if (selectedRange === '1Y') {
      // Last 365 days
      filteredData = sortedData.filter(d => d.timestamp > now - 365 * 24 * 60 * 60);
    }
    
    // Format the data for the chart
    return filteredData.map(point => ({
      date: new Date(point.timestamp * 1000).toLocaleDateString(),
      value: typeof point.value === 'string' ? parseFloat(point.value) : point.value,
      displayValue: point.displayValue || point.value,
      rawTimestamp: point.timestamp
    }));
  }, [historyData, selectedRange]);

  // Calculate stats
  const stats = React.useMemo(() => {
    if (processedData.length === 0) return { min: 0, max: 0, avg: 0, latest: 0, change: 0 };
    
    const values = processedData.map(d => d.value as number);
    const min = Math.min(...values);
    const max = Math.max(...values);
    const sum = values.reduce((acc, val) => acc + val, 0);
    const avg = sum / values.length;
    const latest = values[values.length - 1];
    const earliest = values[0];
    const change = earliest !== 0 ? ((latest - earliest) / earliest) * 100 : 0;
    
    return { min, max, avg, latest, change };
  }, [processedData]);

  // Format displayed date
  const formattedDate = date ? format(date, 'PPP') : '';

  return (
    <Card className={cn("w-full", className)}>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-xl">{title}</CardTitle>
        <div className="flex items-center space-x-2">
          <div className="flex border rounded-md overflow-hidden">
            {['line', 'area', 'bar'].map(type => (
              <Button
                key={type}
                variant={chartType === type ? "default" : "ghost"}
                size="sm"
                className="h-8 px-2 rounded-none"
                onClick={() => setChartType(type as 'line' | 'area' | 'bar')}
              >
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </Button>
            ))}
          </div>
          <Select value={selectedRange} onValueChange={setSelectedRange}>
            <SelectTrigger className="w-24 h-8">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {timeRanges.map(range => (
                <SelectItem key={range} value={range}>{range}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="h-8 px-2">
                <CalendarIcon className="h-4 w-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <CalendarComponent
                mode="single"
                selected={date}
                onSelect={setDate}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-4 gap-4 mb-4">
          <div className="p-4 bg-muted/20 rounded-md">
            <p className="text-sm text-muted-foreground">Latest</p>
            <p className="text-2xl font-semibold">{stats.latest.toFixed(1)}<span className="text-sm font-normal ml-1">{displayUnit || unit}</span></p>
          </div>
          <div className="p-4 bg-muted/20 rounded-md">
            <p className="text-sm text-muted-foreground">Average</p>
            <p className="text-2xl font-semibold">{stats.avg.toFixed(1)}<span className="text-sm font-normal ml-1">{displayUnit || unit}</span></p>
          </div>
          <div className="p-4 bg-muted/20 rounded-md">
            <p className="text-sm text-muted-foreground">Min</p>
            <p className="text-2xl font-semibold">{stats.min.toFixed(1)}<span className="text-sm font-normal ml-1">{displayUnit || unit}</span></p>
          </div>
          <div className="p-4 bg-muted/20 rounded-md">
            <p className="text-sm text-muted-foreground">Max</p>
            <p className="text-2xl font-semibold">{stats.max.toFixed(1)}<span className="text-sm font-normal ml-1">{displayUnit || unit}</span></p>
          </div>
        </div>
        
        <div className="w-full h-96">
          <ResponsiveContainer width="100%" height="100%">
            {chartType === 'line' ? (
              <LineChart data={processedData} margin={{ top: 10, right: 30, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                <XAxis 
                  dataKey="date" 
                  tick={{ fill: '#888', fontSize: 12 }}
                  tickLine={{ stroke: '#888' }}
                />
                <YAxis 
                  tick={{ fill: '#888', fontSize: 12 }}
                  tickLine={{ stroke: '#888' }}
                  tickFormatter={(value) => `${value}${unit ? ` ${unit}` : ''}`}
                />
                <Tooltip 
                  formatter={(value) => [`${value} ${displayUnit || unit}`, title]}
                  labelFormatter={(date) => `Date: ${date}`}
                />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="value" 
                  name={title}
                  stroke="#3b82f6" 
                  strokeWidth={2} 
                  dot={{ r: 4 }} 
                  activeDot={{ r: 6 }} 
                />
              </LineChart>
            ) : chartType === 'area' ? (
              <AreaChart data={processedData} margin={{ top: 10, right: 30, left: 0, bottom: 5 }}>
                <defs>
                  <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                <XAxis 
                  dataKey="date" 
                  tick={{ fill: '#888', fontSize: 12 }}
                  tickLine={{ stroke: '#888' }}
                />
                <YAxis 
                  tick={{ fill: '#888', fontSize: 12 }}
                  tickLine={{ stroke: '#888' }}
                  tickFormatter={(value) => `${value}${unit ? ` ${unit}` : ''}`}
                />
                <Tooltip 
                  formatter={(value) => [`${value} ${displayUnit || unit}`, title]}
                  labelFormatter={(date) => `Date: ${date}`}
                />
                <Legend />
                <Area 
                  type="monotone" 
                  dataKey="value" 
                  name={title}
                  stroke="#3b82f6" 
                  fillOpacity={1}
                  fill="url(#colorValue)" 
                />
              </AreaChart>
            ) : (
              <BarChart data={processedData} margin={{ top: 10, right: 30, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                <XAxis 
                  dataKey="date" 
                  tick={{ fill: '#888', fontSize: 12 }}
                  tickLine={{ stroke: '#888' }}
                />
                <YAxis 
                  tick={{ fill: '#888', fontSize: 12 }}
                  tickLine={{ stroke: '#888' }}
                  tickFormatter={(value) => `${value}${unit ? ` ${unit}` : ''}`}
                />
                <Tooltip 
                  formatter={(value) => [`${value} ${displayUnit || unit}`, title]}
                  labelFormatter={(date) => `Date: ${date}`}
                />
                <Legend />
                <Bar 
                  dataKey="value" 
                  name={title}
                  fill="#3b82f6" 
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            )}
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
} 