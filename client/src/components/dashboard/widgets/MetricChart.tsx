import React from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

export interface HistoryDataPoint {
  date: Date | string;
  value: number;
}

export interface MetricChartProps {
  data: HistoryDataPoint[];
  color?: string;
  height?: number;
  formatValue?: (value: number) => string;
  formatDate?: (date: Date | string) => string;
}

export const MetricChart: React.FC<MetricChartProps> = ({
  data,
  color = 'blue',
  height = 100,
  formatValue = (v) => v.toString(),
  formatDate = (d) => new Date(d).toLocaleDateString(),
}) => {
  // Color mapping
  const colorMap = {
    blue: { border: 'rgb(59, 130, 246)', background: 'rgba(59, 130, 246, 0.1)' },
    green: { border: 'rgb(16, 185, 129)', background: 'rgba(16, 185, 129, 0.1)' },
    red: { border: 'rgb(239, 68, 68)', background: 'rgba(239, 68, 68, 0.1)' },
    purple: { border: 'rgb(139, 92, 246)', background: 'rgba(139, 92, 246, 0.1)' },
    orange: { border: 'rgb(249, 115, 22)', background: 'rgba(249, 115, 22, 0.1)' },
    teal: { border: 'rgb(20, 184, 166)', background: 'rgba(20, 184, 166, 0.1)' },
    indigo: { border: 'rgb(99, 102, 241)', background: 'rgba(99, 102, 241, 0.1)' },
    yellow: { border: 'rgb(245, 158, 11)', background: 'rgba(245, 158, 11, 0.1)' },
  };

  const selectedColor = colorMap[color] || colorMap.blue;

  // Prepare data for Chart.js
  const chartData = {
    labels: data.map(item => formatDate(item.date)),
    datasets: [
      {
        label: '',
        data: data.map(item => item.value),
        borderColor: selectedColor.border,
        backgroundColor: selectedColor.background,
        borderWidth: 2,
        pointRadius: 3,
        pointBackgroundColor: selectedColor.border,
        tension: 0.3,
        fill: true,
      },
    ],
  };

  // Chart options
  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            return formatValue(context.parsed.y);
          }
        }
      }
    },
    scales: {
      x: {
        grid: {
          display: false,
        },
        ticks: {
          maxRotation: 0,
          autoSkip: true,
          maxTicksLimit: 5,
        }
      },
      y: {
        beginAtZero: false,
        grid: {
          color: 'rgba(0, 0, 0, 0.05)',
        },
        ticks: {
          callback: function(value) {
            return formatValue(value);
          }
        }
      }
    },
  };

  return (
    <div style={{ height: `${height}px` }}>
      <Line data={chartData} options={options} />
    </div>
  );
}; 