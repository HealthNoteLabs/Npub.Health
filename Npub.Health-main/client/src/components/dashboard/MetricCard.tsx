import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useEffect } from "react";
import { unitConversions } from "../../lib/nostr";

export interface MetricCardProps {
  title: string;
  value: number | string | undefined;
  unit?: string;
  loading?: boolean;
  kind?: number;
  onClick?: () => void;
  isSelected?: boolean;
}

export default function MetricCard({ 
  title, 
  value, 
  unit, 
  loading, 
  kind, 
  onClick, 
  isSelected 
}: MetricCardProps) {
  // Debug effect to log when props change
  useEffect(() => {
    console.log(`MetricCard "${title}" rendered with:`, { value, unit, kind });
  }, [title, value, unit, kind]);

  // Format display value specially for imperial units
  const formatDisplay = () => {
    if (value === undefined) return 'N/A';
    
    // Height in feet and inches
    if (unit === 'ft-in') {
      return value; // Already formatted as 5'11"
    }
    
    // Weight in pounds - convert from kg if needed
    if (unit === 'lbs') {
      // If the value appears to be in kg (typically less than 200), convert it
      const numValue = typeof value === 'string' ? parseFloat(value) : value;
      if (!isNaN(numValue) && numValue < 200) {
        const lbs = Math.round(unitConversions.weight.kgToLbs(numValue));
        return `${lbs} ${unit}`;
      }
      return `${value} ${unit}`;
    }
    
    // Default formatting
    return `${value}${unit ? ` ${unit}` : ''}`;
  };

  return (
    <Card 
      className={`cursor-pointer transition-all hover:shadow-md ${isSelected ? 'ring-2 ring-primary' : ''}`}
      onClick={onClick}
    >
      <CardContent className="p-4">
        <h3 className="text-sm font-medium text-muted-foreground mb-2">{title}</h3>
        {loading ? (
          <Skeleton className="h-6 w-24" />
        ) : (
          <p className="text-2xl font-bold">
            {formatDisplay()}
          </p>
        )}
        {kind && (
          <p className="text-xs text-gray-400 mt-2">
            Nostr kind: {kind}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
