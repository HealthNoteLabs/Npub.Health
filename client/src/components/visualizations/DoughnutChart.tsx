import React from 'react';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  ChartOptions,
  ChartData
} from 'chart.js';
import { Doughnut } from 'react-chartjs-2';

// Register Chart.js components
ChartJS.register(
  ArcElement,
  Tooltip,
  Legend
);

export interface DoughnutChartProps {
  data: ChartData<'doughnut'>;
  options?: ChartOptions<'doughnut'>;
  height?: number | string;
  width?: number | string;
}

export const DoughnutChart: React.FC<DoughnutChartProps> = ({
  data,
  options = {},
  height = '300px',
  width = '100%'
}) => {
  const defaultOptions: ChartOptions<'doughnut'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: 'Health Metrics Distribution',
      },
    },
    cutout: '70%',
  };

  const mergedOptions = { ...defaultOptions, ...options };

  return (
    <div style={{ height, width }}>
      <Doughnut data={data} options={mergedOptions} />
    </div>
  );
};

export default DoughnutChart; 