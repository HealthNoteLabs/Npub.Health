import React from 'react';
import { 
  Card, 
  CardContent, 
  CardDescription,
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { 
  ArrowDownIcon, 
  ArrowRightIcon, 
  ArrowUpIcon, 
  MoreHorizontalIcon 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export interface MetricCardProps {
  title: string;
  value: number;
  unit?: string;
  displayValue?: string;
  previousValue?: number;
  changePercentage?: number; 
  trend?: 'up' | 'down' | 'neutral';
  changeText?: string;
  description?: string;
  onClick?: () => void;
  onDetailsClick?: () => void;
  className?: string;
}

const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  unit = '',
  displayValue,
  previousValue,
  changePercentage,
  trend = 'neutral',
  changeText,
  description,
  onClick,
  onDetailsClick,
  className
}: MetricCardProps) => {
  // Calculate trend if not provided but we have previous value
  if (previousValue !== undefined && trend === 'neutral' && !changePercentage) {
    const diff = value - previousValue;
    if (diff > 0) {
      trend = 'up';
    } else if (diff < 0) {
      trend = 'down';
    }
    
    // Calculate percentage change if not provided
    if (previousValue !== 0 && changePercentage === undefined) {
      changePercentage = Math.abs((diff / previousValue) * 100);
    }
  }

  // Format the value if displayValue not provided
  const formattedValue = displayValue || `${value}${unit ? ` ${unit}` : ''}`;

  return (
    <Card 
      className={cn(
        "transition-all hover:shadow-md", 
        onClick ? "cursor-pointer" : "", 
        className
      )} 
      onClick={onClick}
    >
      <CardHeader className="pb-2">
        <div className="flex justify-between">
          <CardTitle className="text-sm font-medium">{title}</CardTitle>
          {onDetailsClick && (
            <Button variant="ghost" size="icon" onClick={(e) => {
              e.stopPropagation();
              onDetailsClick();
            }}>
              <MoreHorizontalIcon className="h-4 w-4" />
            </Button>
          )}
        </div>
        {description && (
          <CardDescription>{description}</CardDescription>
        )}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{formattedValue}</div>
      </CardContent>
      {(trend !== 'neutral' || changeText) && (
        <CardFooter className="pt-0">
          <div className="flex items-center text-sm">
            {trend === 'up' && (
              <ArrowUpIcon className="mr-1 h-4 w-4 text-emerald-500" />
            )}
            {trend === 'down' && (
              <ArrowDownIcon className="mr-1 h-4 w-4 text-rose-500" />
            )}
            {trend === 'neutral' && (
              <ArrowRightIcon className="mr-1 h-4 w-4 text-gray-500" />
            )}
            <span className={cn(
              "font-medium",
              trend === 'up' && "text-emerald-500",
              trend === 'down' && "text-rose-500",
              trend === 'neutral' && "text-gray-500"
            )}>
              {changeText || (changePercentage !== undefined ? 
                `${changePercentage.toFixed(1)}%` : 
                'No change'
              )}
            </span>
          </div>
        </CardFooter>
      )}
    </Card>
  );
};

export default MetricCard;
