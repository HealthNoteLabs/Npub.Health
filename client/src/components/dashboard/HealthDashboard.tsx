import React, { useEffect, useState } from 'react';
import { fetchHealthProfile, fetchHealthHistory, CLIENT_KINDS } from '../../lib/nostr';
import { useNostr } from '../../components/NostrProvider';
import { useNavigate } from 'react-router-dom';
import MetricCard, { MetricCardProps } from './MetricCard';

interface HealthMetric {
  value?: string | number;
  unit?: string;
  timestamp?: number;
  [key: string]: any;  // Allow additional properties
}

interface HealthMetrics {
  weight: HealthMetric | null;
  height: HealthMetric | null;
  age: HealthMetric | null;
  gender: HealthMetric | null;
  fitnessLevel: HealthMetric | null;
}

interface MetricHistory {
  weight: Array<{ timestamp: number; value: number; unit?: string }>;
  height: Array<{ timestamp: number; value: number; unit?: string }>;
  age: Array<{ timestamp: number; value: number; unit?: string }>;
}

// Helper function to extract metric value regardless of format
function getMetricValue(metric: HealthMetric | null | unknown): string | number | undefined {
  if (!metric) return undefined;
  
  // If the metric is an object with a displayValue property (for imperial units)
  if (typeof metric === 'object' && metric !== null && 'displayValue' in metric) {
    return (metric as any).displayValue;
  }
  
  // If the metric is an object with a value property
  if (typeof metric === 'object' && metric !== null && 'value' in metric) {
    return (metric as HealthMetric).value;
  }
  
  // If the metric itself is the value (shouldn't happen with our interfaces, but just in case)
  if (typeof metric === 'string' || typeof metric === 'number') {
    return metric;
  }
  
  return undefined;
}

// Helper function to extract unit regardless of format
function getMetricUnit(metric: HealthMetric | null | unknown, defaultUnit: string): string {
  if (!metric) return defaultUnit;
  
  // For weight, always prefer to show in pounds (lbs)
  if (defaultUnit === 'kg' && typeof metric === 'object' && metric !== null) {
    // If the metric has a specific displayUnit set for pounds, use it
    if ('displayUnit' in metric && (metric as any).displayUnit === 'lbs') {
      return 'lbs';
    }
    
    // If input was provided without a unit (like "145"), assume it's pounds
    if ('value' in metric && typeof (metric as any).value === 'string' &&
        !isNaN(parseFloat((metric as any).value)) && !(metric as any).unit) {
      return 'lbs';
    }
    
    // If we have a kg value but no display unit, convert it to lbs
    if ('value' in metric) {
      return 'lbs';
    }
  }
  
  // If the metric is an object with a displayUnit property (for imperial units)
  if (typeof metric === 'object' && metric !== null && 'displayUnit' in metric && (metric as any).displayUnit) {
    return (metric as any).displayUnit;
  }
  
  // If the metric is an object with a unit property
  if (typeof metric === 'object' && metric !== null && 'unit' in metric) {
    return (metric as HealthMetric).unit || defaultUnit;
  }
  
  return defaultUnit;
}

// Helper function to safely format height for display
function formatHeightValue(metric: any) {
  // For debugging
  console.log('Formatting height value:', metric);
  
  if (!metric) return 0;
  
  // Add specific safeguards for height
  // First check if we have a valid displayValue
  if (typeof metric === 'object' && metric !== null && 'displayValue' in metric) {
    // Check if displayValue is usable
    if (typeof metric.displayValue === 'string' && metric.displayValue.includes("'")) {
      console.log('Using height displayValue:', metric.displayValue);
      // Return 0 as a placeholder for a valid display value so we don't show NaN
      return 0;
    }
  }
  
  // If no displayValue, try to use value
  if (typeof metric === 'object' && metric !== null && 'value' in metric) {
    const value = metric.value;
    if (typeof value === 'number' || (typeof value === 'string' && !isNaN(parseFloat(value)))) {
      console.log('Using height value:', value);
      return Number(value);
    }
  }
  
  // If neither works, return a default
  return 0;
}

type MetricType = 'weight' | 'height' | 'age' | null;

const HealthDashboard: React.FC = () => {
  const { publicKey } = useNostr();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState<HealthMetrics | null>(null);

  // Log data with more details for debugging
  const logMetricData = () => {
    if (metrics) {
      console.log('Current metrics data:', JSON.stringify(metrics, null, 2));
      
      // Log specific fields for debugging
      if (metrics.weight) {
        const isWeightObject = typeof metrics.weight === 'object' && metrics.weight !== null;
        console.log('Weight details:', {
          rawValue: isWeightObject ? metrics.weight.value : metrics.weight,
          displayValue: isWeightObject && 'displayValue' in metrics.weight ? metrics.weight.displayValue : 'N/A',
          rawUnit: isWeightObject ? metrics.weight.unit : 'N/A',
          displayUnit: isWeightObject && 'displayUnit' in metrics.weight ? metrics.weight.displayUnit : 'N/A'
        });
      }
      
      if (metrics.height) {
        const isHeightObject = typeof metrics.height === 'object' && metrics.height !== null;
        console.log('Height details:', {
          rawValue: isHeightObject ? metrics.height.value : metrics.height,
          displayValue: isHeightObject && 'displayValue' in metrics.height ? metrics.height.displayValue : 'N/A',
          rawUnit: isHeightObject ? metrics.height.unit : 'N/A',
          displayUnit: isHeightObject && 'displayUnit' in metrics.height ? metrics.height.displayUnit : 'N/A'
        });
      }
    }
  };

  useEffect(() => {
    if (!publicKey) return;

    const loadData = async () => {
      setLoading(true);
      try {
        // Fetch current metrics
        const data = await fetchHealthProfile(publicKey);
        setMetrics({
          weight: data.weight as HealthMetric | null,
          height: data.height as HealthMetric | null,
          age: data.age as HealthMetric | null,
          gender: data.gender as HealthMetric | null,
          fitnessLevel: data.fitnessLevel as HealthMetric | null
        });
      } catch (error) {
        console.error('Error loading health data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [publicKey]);

  // Add enhanced console logging to troubleshoot
  useEffect(() => {
    if (metrics) {
      logMetricData();
    }
  }, [metrics]);

  const handleMetricCardClick = (metricType: MetricType) => {
    if (!metricType) return;
    navigate(`/metric/${metricType}`);
  };

  if (!publicKey) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-500">Please connect your Nostr account to view your health data.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-500">Loading your health data...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Health Metrics Dashboard</h1>
        <span className="text-sm text-gray-500">Data from Nostr</span>
      </div>
      
      <p className="text-sm text-gray-600 mb-4">
        This dashboard displays your health metrics published to Nostr (kinds 1351-1355).
        No data is stored locally; all information is retrieved from Nostr relays.
        Click on a metric card to view detailed history.
      </p>
      
      {/* Current Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <MetricCard 
          title="Weight" 
          value={Number(metrics?.weight?.displayValue || getMetricValue(metrics?.weight) || 0)} 
          unit={metrics?.weight ? getMetricUnit(metrics?.weight, 'lbs') : ''} 
          description={`Weight (${CLIENT_KINDS.WEIGHT})`}
          onClick={() => handleMetricCardClick('weight')}
        />

        <MetricCard 
          title="Height" 
          value={formatHeightValue(metrics?.height)} 
          displayValue={metrics?.height?.displayValue || getMetricValue(metrics?.height)?.toString()}
          unit={metrics?.height ? getMetricUnit(metrics?.height, 'ft-in') : ''} 
          description={`Height (${CLIENT_KINDS.HEIGHT})`}
          onClick={() => handleMetricCardClick('height')}
        />

        <MetricCard 
          title="Age" 
          value={Number(getMetricValue(metrics?.age) || 0)} 
          unit={getMetricUnit(metrics?.age, 'years')} 
          description={`Age (${CLIENT_KINDS.AGE})`}
          onClick={() => handleMetricCardClick('age')}
        />

        <MetricCard 
          title="Gender" 
          value={Number(0)} 
          displayValue={getMetricValue(metrics?.gender)?.toString()}
          unit={getMetricUnit(metrics?.gender, '')} 
          description={`Gender (${CLIENT_KINDS.GENDER})`}
        />

        <MetricCard 
          title="Fitness Level" 
          value={Number(0)}
          displayValue={getMetricValue(metrics?.fitnessLevel)?.toString()}
          unit={getMetricUnit(metrics?.fitnessLevel, '')} 
          description={`Fitness Level (${CLIENT_KINDS.FITNESS_LEVEL})`}
        />
      </div>

      <div className="bg-blue-50 p-4 rounded-lg border border-blue-200 mt-8">
        <h3 className="text-lg font-medium text-blue-800">About Nostr Health Data</h3>
        <p className="mt-2 text-sm text-blue-700">
          Health metrics are stored using the NIP-101h specification (kinds 1351-1355). To see your data here,
          you need to have published these metrics through compatible Nostr health apps. The dashboard automatically
          fetches the most recent data for each metric type associated with your Nostr pubkey.
        </p>
      </div>
    </div>
  );
};

export default HealthDashboard; 