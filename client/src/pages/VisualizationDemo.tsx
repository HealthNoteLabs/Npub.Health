import React from 'react';
import LineChart from '../components/visualizations/LineChart';
import BarChart from '../components/visualizations/BarChart';
import DoughnutChart from '../components/visualizations/DoughnutChart';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

// Demo data for visualizations
const lineChartData = {
  labels: ['January', 'February', 'March', 'April', 'May', 'June', 'July'],
  datasets: [
    {
      label: 'Weight (kg)',
      data: [76, 75.2, 74.5, 74.8, 73.9, 73.2, 72.5],
      borderColor: 'rgb(53, 162, 235)',
      backgroundColor: 'rgba(53, 162, 235, 0.5)',
    },
    {
      label: 'Body Fat (%)',
      data: [24, 23.5, 23.2, 22.8, 22.3, 21.9, 21.5],
      borderColor: 'rgb(255, 99, 132)',
      backgroundColor: 'rgba(255, 99, 132, 0.5)',
    },
  ],
};

const barChartData = {
  labels: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
  datasets: [
    {
      label: 'Steps',
      data: [5432, 7891, 6543, 8765, 7654, 12345, 9876],
      backgroundColor: 'rgba(75, 192, 192, 0.5)',
    },
    {
      label: 'Calories Burned',
      data: [350, 420, 380, 450, 400, 650, 520],
      backgroundColor: 'rgba(255, 159, 64, 0.5)',
    },
  ],
};

const doughnutChartData = {
  labels: ['Sleep', 'Work', 'Exercise', 'Meals', 'Other'],
  datasets: [
    {
      label: 'Hours',
      data: [8, 9, 1.5, 2, 3.5],
      backgroundColor: [
        'rgba(54, 162, 235, 0.8)',
        'rgba(255, 99, 132, 0.8)',
        'rgba(75, 192, 192, 0.8)',
        'rgba(255, 206, 86, 0.8)',
        'rgba(153, 102, 255, 0.8)',
      ],
      borderColor: [
        'rgba(54, 162, 235, 1)',
        'rgba(255, 99, 132, 1)',
        'rgba(75, 192, 192, 1)',
        'rgba(255, 206, 86, 1)',
        'rgba(153, 102, 255, 1)',
      ],
      borderWidth: 1,
    },
  ],
};

const VisualizationDemo: React.FC = () => {
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6">Health Data Visualizations</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <Card>
          <CardHeader>
            <CardTitle>Weight & Body Fat Trends</CardTitle>
          </CardHeader>
          <CardContent>
            <LineChart 
              data={lineChartData} 
              options={{
                plugins: {
                  title: { display: false },
                },
                scales: {
                  y: {
                    title: {
                      display: true,
                      text: 'Value'
                    }
                  }
                }
              }}
            />
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Activity by Day of Week</CardTitle>
          </CardHeader>
          <CardContent>
            <BarChart 
              data={barChartData}
              options={{
                plugins: {
                  title: { display: false },
                },
                scales: {
                  y: {
                    beginAtZero: true,
                    title: {
                      display: true,
                      text: 'Count'
                    }
                  }
                }
              }}
            />
          </CardContent>
        </Card>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Daily Time Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <DoughnutChart 
              data={doughnutChartData}
              options={{
                plugins: {
                  title: { display: false },
                }
              }}
            />
          </CardContent>
        </Card>
        
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Health Metrics Dashboard</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatCard title="Weight" value="72.5" unit="kg" change="-4.6%" trend="down" />
              <StatCard title="BMI" value="22.3" unit="" change="-2.1%" trend="down" />
              <StatCard title="Resting HR" value="65" unit="bpm" change="-5.8%" trend="down" />
              <StatCard title="Daily Steps" value="9,876" unit="" change="+12.4%" trend="up" />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

// Simple stat card component
interface StatCardProps {
  title: string;
  value: string;
  unit?: string;
  change?: string;
  trend?: 'up' | 'down' | 'neutral';
}

const StatCard: React.FC<StatCardProps> = ({ title, value, unit, change, trend }) => {
  const trendColor = 
    trend === 'up' 
      ? 'text-green-500' 
      : trend === 'down' 
        ? 'text-red-500' 
        : 'text-gray-500';
  
  return (
    <div className="bg-white p-4 rounded-lg shadow">
      <h3 className="text-sm text-gray-500">{title}</h3>
      <div className="flex items-baseline mt-1">
        <span className="text-xl font-medium">{value}</span>
        {unit && <span className="ml-1 text-sm text-gray-500">{unit}</span>}
      </div>
      {change && (
        <div className={`text-sm mt-2 ${trendColor}`}>
          {change}
        </div>
      )}
    </div>
  );
};

export default VisualizationDemo; 