import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

interface MetricHistoryChartProps {
  title: string;
  metricKind: number;
  description?: string;
  data?: Array<{
    timestamp: number;
    value: number;
  }>;
  unit?: string;
}

const MetricHistoryChart: React.FC<MetricHistoryChartProps> = ({
  title,
  metricKind,
  description,
  data = [],
  unit = ''
}) => {
  // Helper function to format dates
  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleDateString();
  };

  const maxValue = data.length > 0 ? Math.max(...data.map(d => d.value)) * 1.1 : 100;
  const minValue = data.length > 0 ? Math.min(...data.map(d => d.value)) * 0.9 : 0;
  
  // Calculate chart dimensions
  const chartHeight = 200;
  const chartWidth = '100%';
  const paddingX = 40;
  const paddingY = 20;

  // If no data, return placeholder
  if (data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center h-48">
            <p className="text-gray-500">No historical data available</p>
            <p className="text-gray-400 text-sm mt-2">Data from Nostr kind {metricKind}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Sort data by timestamp
  const sortedData = [...data].sort((a, b) => a.timestamp - b.timestamp);

  // Generate SVG path for the line chart
  const generatePath = () => {
    if (sortedData.length === 0) return '';

    const xScale = (width: number) => (index: number) => {
      return paddingX + (index / (sortedData.length - 1)) * (width - 2 * paddingX);
    };

    const yScale = (value: number) => {
      return chartHeight - paddingY - ((value - minValue) / (maxValue - minValue)) * (chartHeight - 2 * paddingY);
    };

    const pathGenerator = (width: number) => {
      const x = xScale(width);
      
      return sortedData.map((d, i) => {
        return `${i === 0 ? 'M' : 'L'} ${x(i)} ${yScale(d.value)}`;
      }).join(' ');
    };

    return pathGenerator(500); // Default width for path generation
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description && <p className="text-sm text-gray-500">{description}</p>}
      </CardHeader>
      <CardContent>
        <div className="relative" style={{ height: chartHeight }}>
          <svg width={chartWidth} height={chartHeight} className="overflow-visible">
            {/* Y-axis */}
            <line
              x1={paddingX}
              y1={paddingY}
              x2={paddingX}
              y2={chartHeight - paddingY}
              stroke="#e5e7eb"
              strokeWidth={1}
            />
            
            {/* X-axis */}
            <line
              x1={paddingX}
              y1={chartHeight - paddingY}
              x2="95%"
              y2={chartHeight - paddingY}
              stroke="#e5e7eb"
              strokeWidth={1}
            />
            
            {/* Chart line */}
            <path
              d={generatePath()}
              fill="none"
              stroke="#3b82f6"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {/* Data points */}
            {sortedData.map((d, i) => {
              const xPos = paddingX + (i / (sortedData.length - 1)) * (500 - 2 * paddingX);
              const yPos = chartHeight - paddingY - ((d.value - minValue) / (maxValue - minValue)) * (chartHeight - 2 * paddingY);
              
              return (
                <circle
                  key={i}
                  cx={xPos}
                  cy={yPos}
                  r={4}
                  fill="#3b82f6"
                  stroke="white"
                  strokeWidth={1}
                />
              );
            })}
          </svg>
        </div>
        
        {/* Legend */}
        <div className="flex justify-between mt-4 text-xs text-gray-500">
          {sortedData.length > 0 && (
            <>
              <div>{formatDate(sortedData[0].timestamp)}</div>
              <div>Nostr kind {metricKind}</div>
              <div>{formatDate(sortedData[sortedData.length - 1].timestamp)}</div>
            </>
          )}
        </div>
        
        {/* Latest value */}
        {sortedData.length > 0 && (
          <div className="mt-2 text-right">
            <span className="text-sm text-gray-600">Latest: </span>
            <span className="text-lg font-bold">
              {sortedData[sortedData.length - 1].value} {unit}
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default MetricHistoryChart; 