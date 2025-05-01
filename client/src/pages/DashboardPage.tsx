import React from 'react';
import { MetricWidget } from '../components/dashboard/widgets/MetricWidget';

// Example data for demonstration
const heartRateData = [
  { date: '2023-01-01', value: 67 },
  { date: '2023-01-02', value: 68 },
  { date: '2023-01-03', value: 65 },
  { date: '2023-01-04', value: 72 },
  { date: '2023-01-05', value: 70 },
  { date: '2023-01-06', value: 69 },
  { date: '2023-01-07', value: 71 },
];

const stepsData = [
  { date: '2023-01-01', value: 7500 },
  { date: '2023-01-02', value: 8200 },
  { date: '2023-01-03', value: 7800 },
  { date: '2023-01-04', value: 9100 },
  { date: '2023-01-05', value: 8700 },
  { date: '2023-01-06', value: 6500 },
  { date: '2023-01-07', value: 10200 },
];

const sleepData = [
  { date: '2023-01-01', value: 7.2 },
  { date: '2023-01-02', value: 6.8 },
  { date: '2023-01-03', value: 8.1 },
  { date: '2023-01-04', value: 7.6 },
  { date: '2023-01-05', value: 6.5 },
  { date: '2023-01-06', value: 7.9 },
  { date: '2023-01-07', value: 7.3 },
];

export default function DashboardPage() {
  // Format functions
  const formatSteps = (value: number) => value.toLocaleString();
  const formatHours = (value: number) => `${value.toFixed(1)}`;
  
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Health Dashboard</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <MetricWidget
          title="Heart Rate"
          value={71}
          unit="bpm"
          previousValue={69}
          historyData={heartRateData}
          color="hsl(0, 85%, 60%)"
        />
        
        <MetricWidget
          title="Daily Steps"
          value={10200}
          previousValue={6500}
          formatValue={formatSteps}
          tooltipFormatter={formatSteps}
          historyData={stepsData}
          color="hsl(210, 85%, 60%)"
        />
        
        <MetricWidget
          title="Sleep Duration"
          value={7.3}
          unit="hours"
          previousValue={7.9}
          formatValue={formatHours}
          tooltipFormatter={formatHours}
          historyData={sleepData}
          color="hsl(270, 70%, 60%)"
        />
      </div>
    </div>
  );
}