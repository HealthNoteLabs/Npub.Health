import React from 'react';
import MetricCard from '../MetricCard';
import { MetricChart } from './MetricChart';
import { HistoryDataPoint } from './MetricChart';

export interface MetricWidgetProps {
  title: string;
  value: number;
  unit?: string;
  changePercentage?: number;
  trend?: 'up' | 'down' | 'neutral';
  description?: string;
  historyData?: HistoryDataPoint[];
  formatValue?: (value: number) => string;
  formatDate?: (date: Date | string) => string;
  chartHeight?: number;
}

export const MetricWidget: React.FC<MetricWidgetProps> = ({
  title,
  value,
  unit,
  changePercentage,
  trend,
  description,
  historyData = [],
  formatValue,
  formatDate,
  chartHeight = 120,
}) => {
  return (
    <div className="flex flex-col bg-white rounded-lg shadow-sm overflow-hidden">
      <MetricCard
        title={title}
        value={value}
        unit={unit}
        changePercentage={changePercentage}
        trend={trend}
        description={description}
      />
      
      {historyData.length > 0 && (
        <div className="px-1 pt-2 pb-1">
          <MetricChart
            data={historyData}
            height={chartHeight}
            formatValue={formatValue}
            formatDate={formatDate}
          />
        </div>
      )}
    </div>
  );
}; 