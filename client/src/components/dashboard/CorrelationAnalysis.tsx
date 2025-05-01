import React from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Label } from 'recharts';

// Define available metrics for correlation analysis
const AVAILABLE_METRICS = [
  { id: 'weight', name: 'Weight', unit: 'kg', color: 'hsl(var(--destructive))' },
  { id: 'calories', name: 'Calories', unit: 'kcal', color: 'hsl(var(--chart-5))' },
  { id: 'workout', name: 'Workout', unit: 'min', color: 'hsl(var(--secondary))' },
  { id: 'height', name: 'Height', unit: 'cm', color: 'hsl(var(--chart-1))' }
];

interface CorrelationAnalysisProps {
  metrics?: {
    id: { id: string; name: string; unit: string; color: string };
    comparedWith: { id: string; name: string; unit: string; color: string };
  };
  data: Array<{
    date: string;
    [key: string]: number | string;
  }>;
  loading: boolean;
  onMetricChange?: (primaryMetric: any, secondaryMetric: any) => void;
}

export default function CorrelationAnalysis({ 
  metrics = {
    id: AVAILABLE_METRICS[0],
    comparedWith: AVAILABLE_METRICS[1]
  }, 
  data = [], 
  loading = false,
  onMetricChange
}: CorrelationAnalysisProps) {
  
  // Format data for scatterplot
  const scatterData = data.map(item => ({
    x: Number(item[metrics.id.id]) || 0,
    y: Number(item[metrics.comparedWith.id]) || 0,
  }));

  const handlePrimaryMetricChange = (value: string) => {
    const selectedMetric = AVAILABLE_METRICS.find(metric => metric.id === value);
    if (selectedMetric && onMetricChange) {
      onMetricChange(selectedMetric, metrics.comparedWith);
    }
  };

  const handleSecondaryMetricChange = (value: string) => {
    const selectedMetric = AVAILABLE_METRICS.find(metric => metric.id === value);
    if (selectedMetric && onMetricChange) {
      onMetricChange(metrics.id, selectedMetric);
    }
  };

  // Calculate correlation coefficient
  const calculateCorrelation = () => {
    if (scatterData.length < 2) return 0;
    
    const xValues = scatterData.map(d => d.x);
    const yValues = scatterData.map(d => d.y);
    
    const xMean = xValues.reduce((sum, val) => sum + val, 0) / xValues.length;
    const yMean = yValues.reduce((sum, val) => sum + val, 0) / yValues.length;
    
    let numerator = 0;
    let denomX = 0;
    let denomY = 0;
    
    for (let i = 0; i < scatterData.length; i++) {
      const xDiff = xValues[i] - xMean;
      const yDiff = yValues[i] - yMean;
      numerator += xDiff * yDiff;
      denomX += xDiff * xDiff;
      denomY += yDiff * yDiff;
    }
    
    const denominator = Math.sqrt(denomX * denomY);
    return denominator === 0 ? 0 : numerator / denominator;
  };
  
  const correlation = calculateCorrelation();
  const correlationText = Math.abs(correlation) < 0.3 
    ? 'weak' 
    : Math.abs(correlation) < 0.7 
      ? 'moderate' 
      : 'strong';
  
  const correlationDirection = correlation > 0 
    ? 'positive' 
    : correlation < 0 
      ? 'negative' 
      : 'no';

  return (
    <Card className="col-span-1 md:col-span-2">
      <CardHeader>
        <CardTitle className="flex justify-between items-center">
          <span>Metric Correlation Analysis</span>
          {!loading && (
            <div className="flex items-center space-x-2 text-sm font-normal">
              <span>Compare:</span>
              <Select value={metrics.id.id} onValueChange={handlePrimaryMetricChange}>
                <SelectTrigger className="w-[120px]">
                  <SelectValue placeholder={metrics.id.name} />
                </SelectTrigger>
                <SelectContent>
                  {AVAILABLE_METRICS.map((metric) => (
                    <SelectItem key={metric.id} value={metric.id}>{metric.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <span>with</span>
              
              <Select value={metrics.comparedWith.id} onValueChange={handleSecondaryMetricChange}>
                <SelectTrigger className="w-[120px]">
                  <SelectValue placeholder={metrics.comparedWith.name} />
                </SelectTrigger>
                <SelectContent>
                  {AVAILABLE_METRICS.map((metric) => (
                    <SelectItem key={metric.id} value={metric.id}>{metric.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </CardTitle>
        <CardDescription>
          Analyze how your health metrics relate to each other over time
        </CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="h-[300px] w-full flex items-center justify-center bg-muted/5 rounded-md">
            <p className="text-muted-foreground">Loading correlation data...</p>
          </div>
        ) : data.length < 5 ? (
          <div className="h-[300px] w-full flex items-center justify-center bg-muted/5 rounded-md">
            <p className="text-muted-foreground">Need more data points to analyze correlations.<br />Continue tracking to see relationships.</p>
          </div>
        ) : (
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart
                margin={{ top: 20, right: 30, bottom: 40, left: 40 }}
              >
                <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                <XAxis 
                  type="number" 
                  dataKey="x" 
                  name={metrics.id.name} 
                  unit={` ${metrics.id.unit}`}
                  tick={{ fill: 'var(--foreground)' }}
                >
                  <Label 
                    value={metrics.id.name} 
                    offset={-10} 
                    position="insideBottom" 
                    fill="var(--muted-foreground)"
                  />
                </XAxis>
                <YAxis 
                  type="number" 
                  dataKey="y" 
                  name={metrics.comparedWith.name} 
                  unit={` ${metrics.comparedWith.unit}`}
                  tick={{ fill: 'var(--foreground)' }}
                >
                  <Label 
                    value={metrics.comparedWith.name} 
                    angle={-90} 
                    position="insideLeft" 
                    fill="var(--muted-foreground)"
                  />
                </YAxis>
                <Tooltip 
                  cursor={{ strokeDasharray: '3 3' }}
                  contentStyle={{ 
                    backgroundColor: 'var(--background)', 
                    borderColor: 'var(--border)',
                    color: 'var(--foreground)'
                  }}
                  formatter={(value: any, name: string) => {
                    if (name === 'x') {
                      return [`${value} ${metrics.id.unit}`, metrics.id.name];
                    }
                    return [`${value} ${metrics.comparedWith.unit}`, metrics.comparedWith.name];
                  }}
                />
                <Scatter 
                  name="Correlation" 
                  data={scatterData} 
                  fill={metrics.id.color} 
                />
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
      <CardFooter className="border-t pt-4">
        {!loading && data.length >= 5 && (
          <div className="w-full text-sm text-muted-foreground">
            <p>
              There appears to be a <strong>{correlationText} {correlationDirection}</strong> correlation 
              between your {metrics.id.name.toLowerCase()} and {metrics.comparedWith.name.toLowerCase()}. 
              {correlation > 0.7 && ` This suggests that as your ${metrics.id.name.toLowerCase()} increases, your ${metrics.comparedWith.name.toLowerCase()} tends to increase as well.`}
              {correlation < -0.7 && ` This suggests that as your ${metrics.id.name.toLowerCase()} increases, your ${metrics.comparedWith.name.toLowerCase()} tends to decrease.`}
              {Math.abs(correlation) < 0.3 && ` This suggests that changes in your ${metrics.id.name.toLowerCase()} have little relationship with changes in your ${metrics.comparedWith.name.toLowerCase()}.`}
            </p>
          </div>
        )}
        {!loading && data.length < 5 && (
          <div className="w-full text-sm text-muted-foreground">
            <p>
              Continue tracking your metrics to see correlations between them. At least 5 data points are needed for meaningful analysis.
            </p>
          </div>
        )}
      </CardFooter>
    </Card>
  );
} 