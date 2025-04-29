import { useState, useEffect } from 'react';
import { useNostr } from '../NostrProvider';
import { fetchHealthProfile, fetchWorkouts } from '../../lib/nostr';
import { type HealthMetrics } from '@shared/schema';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { RefreshCw, BarChart3, Activity, HeartPulse, Dumbbell, Brain, Utensils, Settings } from 'lucide-react';
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

// Define workout data type if not exported from schema
interface WorkoutData {
  id: string;
  type: string;
  duration: number;
  calories: number;
  distance?: number;
  date: string;
  notes?: string;
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
  const [healthData, setHealthData] = useState<HealthMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [workouts, setWorkouts] = useState<WorkoutData[]>([]);
  const [trendsData, setTrendsData] = useState<TimeSeriesData[]>([]);
  const [weightTrendData, setWeightTrendData] = useState<Array<{date: string, value: number}>>([]);
  const [activeTab, setActiveTab] = useState('overview');

  // Fetch actual data from API
  useEffect(() => {
    if (!publicKey) return;
    
    const fetchData = async () => {
      try {
        setLoading(true);
        // Fetch health profile
        const profile = await fetchHealthProfile(publicKey);
        
        // Extract profile data safely
        const profileData = profile as any; // Use any temporarily to extract the data
        
        // Initialize a complete HealthMetrics object with the data we have
        const healthMetrics: HealthMetrics = {
          running: { weeklyDistance: 0, lastRunDate: "", avgPace: 0, totalRuns: 0 },
          meditation: { weeklyMinutes: 0, currentStreak: 0, lastSession: "" },
          habits: { completed: 0, total: 0, streak: 0 },
          sleep: { avgDuration: 0, quality: 0, lastNight: 0 },
          nutrition: { calories: profileData?.nutrition?.calories || 0, protein: 0, water: 0 },
          spiritual: { meditationMinutes: 0, journalEntries: 0, gratitudeNotes: 0 },
          lifting: { totalWeight: 0, personalBests: 0, workouts: 0 },
          weight: profileData?.weight || undefined,
          height: profileData?.height || undefined,
          age: profileData?.age || undefined,
          gender: profileData?.gender || undefined,
          fitnessLevel: profileData?.fitnessLevel || undefined,
          workouts: []
        };
        
        setHealthData(healthMetrics);
        
        // Fetch recent workouts and format them to match our interface
        const rawWorkoutData = await fetchWorkouts(publicKey, 5); // Last 5 workouts
        const formattedWorkouts = rawWorkoutData.map((workout: any) => {
          return {
            id: workout.id || String(Math.random()),
            type: workout.type || 'Unknown',
            duration: workout.duration || 0,
            calories: workout.totalCalories || 0,
            distance: workout.distance,
            date: workout.startTime || new Date().toISOString(),
            notes: workout.notes
          } as WorkoutData;
        });
        
        setWorkouts(formattedWorkouts);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [publicKey]);
  
  // Fallback sample data for weight widget if no real data is available
  const generateSampleWeightData = () => {
    const dates = Array.from({ length: 7 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (6 - i));
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

  if (!publicKey) {
    return (
      <Card variant="gradient" className="p-6 text-center mx-auto max-w-lg mt-12 animate-scale-in">
        <div className="flex flex-col items-center gap-4 py-8">
          <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
            <HeartPulse className="h-8 w-8 text-primary animate-pulse" />
          </div>
          <h2 className="text-2xl font-bold mb-2">Welcome to Npub.Health</h2>
          <p className="text-muted-foreground mb-6">Connect your Nostr account to view your health metrics and start tracking your wellness journey.</p>
          <Button variant="gradient" className="px-6">Connect Nostr</Button>
        </div>
      </Card>
    );
  }

  return (
    <div className="container px-4 py-8 max-w-6xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-4xl font-bold mb-2 gradient-text">Health Dashboard</h1>
          <p className="text-muted-foreground">Track, analyze, and optimize your health metrics</p>
        </div>
        <Button
          onClick={() => {}}
          disabled={loading}
          variant="glass"
          className="gap-2"
          isLoading={loading}
        >
          <RefreshCw className="h-4 w-4" />
          Refresh Data
        </Button>
      </div>

      <Tabs defaultValue="overview" className="space-y-8" value={activeTab} onValueChange={setActiveTab}>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-2 border-b border-border/40">
          <TabsList className="h-10 bg-background/50 p-1 backdrop-blur-sm">
            <TabsTrigger 
              value="overview" 
              className="gap-1.5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              <Activity className="h-4 w-4" />
              <span>Overview</span>
            </TabsTrigger>
            <TabsTrigger 
              value="details" 
              className="gap-1.5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              <BarChart3 className="h-4 w-4" />
              <span>Detailed Trends</span>
            </TabsTrigger>
            <TabsTrigger 
              value="correlations" 
              className="gap-1.5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              <Brain className="h-4 w-4" />
              <span>Correlations</span>
            </TabsTrigger>
            <TabsTrigger 
              value="management" 
              className="gap-1.5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              <Settings className="h-4 w-4" />
              <span>Data Management</span>
            </TabsTrigger>
          </TabsList>
        </div>
        
        <TabsContent value="overview" className="space-y-6 animate-scale-in">
          <Card variant="glass" className="overflow-hidden">
            <CardHeader className="border-b border-border/30 bg-primary/5">
              <CardTitle className="flex items-center text-xl">
                <Activity className="mr-2 h-5 w-5 text-primary" />
                Health Metrics Overview
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <HealthMetricsTrend data={trendsData} loading={loading} />
            </CardContent>
          </Card>

          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="h-6 w-1 bg-gradient-to-b from-health-blue to-health-purple rounded-full"></div>
              <h2 className="text-xl font-bold">Basic Health Metrics</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <WeightWidget data={healthData?.weight} loading={loading} />
              <HeightWidget data={healthData?.height} loading={loading} />
              <AgeWidget data={healthData?.age} loading={loading} />
              <GenderWidget data={healthData?.gender} loading={loading} />
              <FitnessLevelWidget data={healthData?.fitnessLevel} loading={loading} />
            </div>
          </div>
          
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="h-6 w-1 bg-gradient-to-b from-health-blue to-health-purple rounded-full"></div>
              <h2 className="text-xl font-bold">Workout Records</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <WorkoutWidget data={workouts} loading={loading} />
            </div>
          </div>
          
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="h-6 w-1 bg-gradient-to-b from-health-blue to-health-purple rounded-full"></div>
              <h2 className="text-xl font-bold">Activity Metrics</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <RunstrWidget data={healthData?.running} loading={loading} />
              <CalmstrWidget data={healthData?.meditation} loading={loading} />
              <HabitstrWidget data={healthData?.habits} loading={loading} />
              <SleepstrWidget data={healthData?.sleep} loading={loading} />
              <DietstrWidget data={healthData?.nutrition} loading={loading} />
              <SpiritstrWidget data={healthData?.spiritual} loading={loading} />
              <LiftstrWidget data={healthData?.lifting} loading={loading} />
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="details" className="space-y-6 animate-scale-in">
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
        
        <TabsContent value="correlations" className="space-y-6 animate-scale-in">
          <Card variant="glass">
            <CardHeader className="border-b border-border/30 bg-primary/5">
              <CardTitle className="flex items-center text-xl">
                <Brain className="mr-2 h-5 w-5 text-primary" />
                Health Metrics Correlations
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <MultiMetricCorrelation 
                data={trendsData}
                loading={loading}
                metrics={AVAILABLE_METRICS}
              />
            </CardContent>
          </Card>
          
          <Card variant="glass" className="p-6">
            <div className="space-y-4">
              <h3 className="text-lg font-medium flex items-center">
                <Brain className="mr-2 h-5 w-5 text-primary" />
                Understanding Correlations
              </h3>
              <p className="text-sm text-muted-foreground">
                The correlation analysis helps you understand relationships between different health metrics:
              </p>
              <ul className="grid gap-3 py-4">
                <li className="flex gap-2">
                  <div className="h-6 w-6 rounded-full bg-health-green/20 flex items-center justify-center flex-shrink-0">
                    <div className="h-2 w-2 rounded-full bg-health-green"></div>
                  </div>
                  <div>
                    <p className="font-medium">Positive correlation</p>
                    <p className="text-sm text-muted-foreground">As one metric increases, the other tends to increase as well.</p>
                  </div>
                </li>
                <li className="flex gap-2">
                  <div className="h-6 w-6 rounded-full bg-health-red/20 flex items-center justify-center flex-shrink-0">
                    <div className="h-2 w-2 rounded-full bg-health-red"></div>
                  </div>
                  <div>
                    <p className="font-medium">Negative correlation</p>
                    <p className="text-sm text-muted-foreground">As one metric increases, the other tends to decrease.</p>
                  </div>
                </li>
                <li className="flex gap-2">
                  <div className="h-6 w-6 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                    <div className="h-2 w-2 rounded-full bg-muted-foreground"></div>
                  </div>
                  <div>
                    <p className="font-medium">Correlation strength</p>
                    <p className="text-sm text-muted-foreground">Ranges from 0 (no relationship) to 1 (perfect relationship).</p>
                  </div>
                </li>
                <li className="flex gap-2">
                  <div className="h-6 w-6 rounded-full bg-health-blue/20 flex items-center justify-center flex-shrink-0">
                    <div className="h-2 w-2 rounded-full bg-health-blue"></div>
                  </div>
                  <div>
                    <p className="font-medium">Not causation</p>
                    <p className="text-sm text-muted-foreground">Correlation does not necessarily imply causation; other factors may be involved.</p>
                  </div>
                </li>
              </ul>
            </div>
          </Card>
        </TabsContent>
        
        <TabsContent value="management" className="space-y-6 animate-scale-in">
          <Card variant="glass">
            <CardHeader className="border-b border-border/30 bg-primary/5">
              <CardTitle className="flex items-center text-xl">
                <Settings className="mr-2 h-5 w-5 text-primary" />
                Data Management
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <DataManagement 
                connected={!!publicKey}
                relays={['wss://relay.nostr.band', 'wss://relay.damus.io']} 
                blossomConnected={false}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}