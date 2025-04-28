import { useState, useEffect } from 'react';
import { useNostr } from '../NostrProvider';
import { aggregateAllMetrics } from '@/lib/nostr';
import { type HealthMetrics } from '@shared/schema';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { RefreshCw } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import RunstrWidget from './widgets/RunstrWidget';
import CalmstrWidget from './widgets/CalmstrWidget';
import HabitstrWidget from './widgets/HabitstrWidget';
import SleepstrWidget from './widgets/SleepstrWidget';
import DietstrWidget from './widgets/DietstrWidget';
import SpiritstrWidget from './widgets/SpiritstrWidget';
import LiftstrWidget from './widgets/LiftstrWidget';
import WeightWidget from './widgets/WeightWidget';
import HeightWidget from './widgets/HeightWidget';
import AgeWidget from './widgets/AgeWidget';
import GenderWidget from './widgets/GenderWidget';
import FitnessLevelWidget from './widgets/FitnessLevelWidget';
import WorkoutWidget from './widgets/WorkoutWidget';
import HealthMetricsTrend from './HealthMetricsTrend';
import HealthMetricsTrendDetail from './HealthMetricsTrendDetail';
import MultiMetricCorrelation from './MultiMetricCorrelation';
import DataManagement from './DataManagement';

interface TimeSeriesData {
  date: string;
  [key: string]: number | string;
}

// Define available metrics for correlation analysis
const AVAILABLE_METRICS = [
  { id: 'running', name: 'Running', unit: 'km', color: 'hsl(var(--chart-1))' },
  { id: 'meditation', name: 'Meditation', unit: 'min', color: 'hsl(var(--chart-2))' },
  { id: 'habits', name: 'Habits', unit: '', color: 'hsl(var(--chart-3))' },
  { id: 'sleep', name: 'Sleep', unit: 'hrs', color: 'hsl(var(--chart-4))' },
  { id: 'nutrition', name: 'Nutrition', unit: 'kcal/100', color: 'hsl(var(--chart-5))' },
  { id: 'spiritual', name: 'Spiritual', unit: '', color: 'hsl(var(--primary))' },
  { id: 'lifting', name: 'Lifting', unit: 'kg/10', color: 'hsl(var(--secondary))' },
  { id: 'weight', name: 'Weight', unit: 'kg', color: 'hsl(var(--destructive))' }
];

export default function Dashboard() {
  const { publicKey } = useNostr();
  const [metrics, setMetrics] = useState<HealthMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [trendsData, setTrendsData] = useState<TimeSeriesData[]>([]);
  const [weightTrendData, setWeightTrendData] = useState<Array<{date: string, value: number}>>([]);
  const [activeTab, setActiveTab] = useState('overview');

  const fetchMetrics = async () => {
    if (!publicKey) return;
    setLoading(true);
    try {
      const data = await aggregateAllMetrics(publicKey);
      setMetrics(data as HealthMetrics);

      // In a real application, you would fetch historical data here
      // For now, we'll use sample data
      const sampleTrendsData = generateSampleTrendsData();
      setTrendsData(sampleTrendsData);
      
      // Generate weight trend data
      const weightData = generateSampleWeightData();
      setWeightTrendData(weightData);
    } catch (error) {
      console.error('Error fetching metrics:', error);
    }
    setLoading(false);
  };

  // Helper function to generate sample trends data
  const generateSampleTrendsData = () => {
    const dates = Array.from({ length: 30 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (29 - i));
      return date.toISOString().split('T')[0];
    });

    return dates.map(date => {
      // Add some randomness to make the data look realistic
      const dayOfMonth = new Date(date).getDate();
      const trendFactor = dayOfMonth / 30; // Creates a slight upward trend over the month
      
      return {
        date,
        running: Math.random() * 6 + 4 + trendFactor * 2, // 4-10 km with upward trend
        meditation: Math.random() * 20 + 15 + trendFactor * 10, // 15-35 minutes with upward trend
        habits: Math.floor(Math.random() * 3 + 6 + trendFactor * 2), // 6-9 habits with upward trend
        sleep: Math.random() * 1.5 + 6.5 + (trendFactor * 0.5), // 6.5-8 hours with slight upward trend
        nutrition: Math.random() * 5 + 22 + (trendFactor * 3), // 2200-2700 calories with upward trend
        spiritual: Math.random() * 10 + 75 + (trendFactor * 10), // 75-90 score with upward trend
        lifting: Math.random() * 20 + 120 + (trendFactor * 30), // 120-150 kg with upward trend
        weight: 75 - Math.random() * 1 - (trendFactor * 2), // Weight slowly decreasing
      };
    });
  };

  // Helper function to generate sample weight data
  const generateSampleWeightData = () => {
    const dates = Array.from({ length: 30 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (29 - i));
      return date.toISOString().split('T')[0];
    });

    let currentWeight = 75; // Starting weight
    
    return dates.map(date => {
      // Small daily fluctuations with a slight downward trend
      const change = (Math.random() - 0.6) * 0.3; // Mostly negative changes
      currentWeight += change;
      
      return {
        date,
        value: currentWeight
      };
    });
  };

  useEffect(() => {
    fetchMetrics();
  }, [publicKey]);

  if (!publicKey) {
    return (
      <Card className="p-6 text-center">
        <h2 className="text-2xl font-bold mb-4">Welcome to Healthstr Dashboard</h2>
        <p>Please connect your Nostr account to view your health metrics.</p>
      </Card>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Health Dashboard</h1>
        <Button
          onClick={fetchMetrics}
          disabled={loading}
          variant="outline"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      <Tabs defaultValue="overview" className="space-y-6" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-4 w-[400px]">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="details">Detailed Trends</TabsTrigger>
          <TabsTrigger value="correlations">Correlations</TabsTrigger>
          <TabsTrigger value="management">Data Management</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="space-y-6">
          <HealthMetricsTrend data={trendsData} loading={loading} />

          <div>
            <h2 className="text-xl font-semibold mb-4">Basic Health Metrics</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <WeightWidget data={metrics?.weight} loading={loading} />
              <HeightWidget data={metrics?.height} loading={loading} />
              <AgeWidget data={metrics?.age} loading={loading} />
              <GenderWidget data={metrics?.gender} loading={loading} />
              <FitnessLevelWidget data={metrics?.fitnessLevel} loading={loading} />
            </div>
          </div>
          
          <div>
            <h2 className="text-xl font-semibold mb-4">Workout Records</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <WorkoutWidget data={metrics?.workouts} loading={loading} />
            </div>
          </div>
          
          <div>
            <h2 className="text-xl font-semibold mb-4">Activity Metrics</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <RunstrWidget data={metrics?.running} loading={loading} />
              <CalmstrWidget data={metrics?.meditation} loading={loading} />
              <HabitstrWidget data={metrics?.habits} loading={loading} />
              <SleepstrWidget data={metrics?.sleep} loading={loading} />
              <DietstrWidget data={metrics?.nutrition} loading={loading} />
              <SpiritstrWidget data={metrics?.spiritual} loading={loading} />
              <LiftstrWidget data={metrics?.lifting} loading={loading} />
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="details" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <HealthMetricsTrendDetail 
              title="Weight"
              data={weightTrendData}
              unit="kg"
              color="hsl(var(--destructive))"
              loading={loading}
              description="Track your weight changes over time"
            />
            
            <HealthMetricsTrendDetail 
              title="Running Distance"
              data={trendsData.map(item => ({ date: item.date, value: item.running as number }))}
              unit="km"
              color="hsl(var(--chart-1))"
              loading={loading}
              description="Track your running distance over time"
            />
            
            <HealthMetricsTrendDetail 
              title="Sleep Duration"
              data={trendsData.map(item => ({ date: item.date, value: item.sleep as number }))}
              unit="hrs"
              color="hsl(var(--chart-4))"
              loading={loading}
              description="Track your sleep duration over time"
            />
            
            <HealthMetricsTrendDetail 
              title="Meditation Time"
              data={trendsData.map(item => ({ date: item.date, value: item.meditation as number }))}
              unit="min"
              color="hsl(var(--chart-2))"
              loading={loading}
              description="Track your meditation time over time"
            />
            
            <HealthMetricsTrendDetail 
              title="Nutrition Intake"
              data={trendsData.map(item => ({ date: item.date, value: (item.nutrition as number) * 100 }))}
              unit=" kcal"
              color="hsl(var(--chart-5))"
              loading={loading}
              description="Track your caloric intake over time"
            />
            
            <HealthMetricsTrendDetail 
              title="Weight Lifted"
              data={trendsData.map(item => ({ date: item.date, value: (item.lifting as number) * 10 }))}
              unit="kg"
              color="hsl(var(--secondary))"
              loading={loading}
              description="Track your lifting progress over time"
            />
          </div>
        </TabsContent>
        
        <TabsContent value="correlations" className="space-y-6">
          <MultiMetricCorrelation 
            data={trendsData}
            loading={loading}
            metrics={AVAILABLE_METRICS}
          />
          
          <div className="p-4 bg-muted/20 rounded-lg border">
            <h3 className="text-lg font-medium mb-2">Understanding Correlations</h3>
            <p className="text-sm text-muted-foreground mb-2">
              The correlation analysis helps you understand relationships between different health metrics:
            </p>
            <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
              <li>A <span className="font-medium">positive correlation</span> means that as one metric increases, the other tends to increase as well.</li>
              <li>A <span className="font-medium">negative correlation</span> means that as one metric increases, the other tends to decrease.</li>
              <li>Correlation strength ranges from 0 (no relationship) to 1 (perfect relationship).</li>
              <li>Correlation does not necessarily imply causation; other factors may be involved.</li>
            </ul>
          </div>
        </TabsContent>
        
        <TabsContent value="management" className="space-y-6">
          <DataManagement 
            connected={!!publicKey}
            relays={['wss://relay.nostr.band', 'wss://relay.damus.io']} 
            blossomConnected={false}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}