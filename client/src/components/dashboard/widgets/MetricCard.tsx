import React from 'react';
import { ArrowUpIcon, ArrowDownIcon } from '@heroicons/react/24/solid';

export interface MetricCardProps {
  title: string;
  value: number;
  unit?: string;
  changePercentage?: number;
  trend?: 'up' | 'down' | 'neutral';
  description?: string;
  color?: string;
  formatValue?: (value: number) => string;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  unit = '',
  changePercentage,
  trend = 'neutral',
  description,
  color = 'blue',
  formatValue = (v) => v.toString(),
}) => {
  // Mapping color string to Tailwind classes
  const colorClasses = {
    blue: 'text-blue-600',
    green: 'text-green-600',
    red: 'text-red-600',
    purple: 'text-purple-600',
    orange: 'text-orange-600',
    teal: 'text-teal-600',
    indigo: 'text-indigo-600',
    yellow: 'text-yellow-600',
  };
  
  const trendColorClasses = {
    up: 'text-green-600 bg-green-100',
    down: 'text-red-600 bg-red-100',
    neutral: 'text-gray-600 bg-gray-100',
  };

  const textColor = colorClasses[color] || 'text-blue-600';
  const trendColor = trendColorClasses[trend];

  return (
    <div className="p-4">
      <div className="flex justify-between items-start">
        <h3 className="text-sm font-medium text-gray-500">{title}</h3>
        {changePercentage !== undefined && (
          <div className={`flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${trendColor}`}>
            {trend === 'up' && <ArrowUpIcon className="h-3 w-3 mr-1" />}
            {trend === 'down' && <ArrowDownIcon className="h-3 w-3 mr-1" />}
            {changePercentage > 0 ? '+' : ''}{changePercentage}%
          </div>
        )}
      </div>
      
      <div className="mt-2 flex items-baseline">
        <div className={`text-2xl font-semibold ${textColor}`}>
          {formatValue(value)}
        </div>
        {unit && <div className="ml-1 text-sm text-gray-500">{unit}</div>}
      </div>
      
      {description && (
        <div className="mt-1 text-xs text-gray-500">
          {description}
        </div>
      )}
    </div>
  );
}; 