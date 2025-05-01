import React, { useEffect, useState } from 'react';
import { useNostr } from '@/components/NostrProvider';
import { fetchHealthProfile, fetchHealthHistory, fetchWorkouts } from '@/lib/nostr';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { LineChart, PieChart, TrendingUp, BarChart3, Calendar, ActivitySquare, HeartPulse, Brain } from 'lucide-react';
import { MetricLineChart, MetricBarChart, BarChart } from './ChartComponents';
import MultiMetricCorrelation from './MultiMetricCorrelation';

// Define available metrics for correlation analysis
const AVAILABLE_METRICS = [
  { id: 'weight', name: 'Weight', unit: 'kg', color: 'hsl(var(--destructive))' },
  { id: 'calories', name: 'Calories', unit: 'kcal', color: 'hsl(var(--chart-5))' },
  { id: 'workout', name: 'Workout', unit: 'min', color: 'hsl(var(--secondary))' },
  { id: 'height', name: 'Height', unit: 'cm', color: 'hsl(var(--chart-1))' }
];

// Interface for time series data
interface TimeSeriesData {
  date: string;
  value: number;
  [key: string]: number | string;
}

// Interface for workout data
interface WorkoutSummary {
  type: string;
  count: number;
  totalDistance: number;
  avgDuration: number;
  totalCalories: number;
}

// Interface for journal insights
interface JournalInsight {
  type: string;
  count: number;
  trend: 'up' | 'down' | 'neutral';
}

// Interface for health metrics
interface HealthMetrics {
  weight?: { value: number; timestamp: number; unit: string };
  height?: { value: number; timestamp: number; unit: string };
  running?: { weeklyDistance: number; lastRunDate: string; avgPace: number; totalRuns: number };
  meditation?: { weeklyMinutes: number; currentStreak: number; lastSession: string };
  habits?: { completed: number; total: number; streak: number };
  sleep?: { avgDuration: number; quality: number; lastNight: number };
  nutrition?: { calories: number; protein: number; water: number };
  spiritual?: { meditationMinutes: number; journalEntries: number; gratitudeNotes: number };
  lifting?: { totalWeight: number; personalBests: number; workouts: number };
  [key: string]: any;
}

const AnalyticsPage: React.FC = () => {
  const { publicKey } = useNostr();
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState<HealthMetrics | null>(null);
  const [trendsData, setTrendsData] = useState<TimeSeriesData[]>([]);
  const [workoutStats, setWorkoutStats] = useState<WorkoutSummary[]>([]);
  const [workoutFrequency, setWorkoutFrequency] = useState<Array<{ name: string; value: number }>>([]);
  const [journalInsights, setJournalInsights] = useState<JournalInsight[]>([]);
  const [primaryMetric, setPrimaryMetric] = useState(AVAILABLE_METRICS[0]);
  const [secondaryMetric, setSecondaryMetric] = useState(AVAILABLE_METRICS[1]);
  const [metricCorrelation, setMetricCorrelation] = useState<{ id: typeof AVAILABLE_METRICS[0]; comparedWith: typeof AVAILABLE_METRICS[0] } | null>(null);

  useEffect(() => {
    if (!publicKey) return;
    
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch health profile and history
        const healthProfile = await fetchHealthProfile(publicKey);
        const healthHistory = await fetchHealthHistory(publicKey);
        const workoutsData = await fetchWorkouts(publicKey, 30);
        
        // Process the data for trends
        const trends = generateTrendsDataFromHistory(healthHistory);
        setTrendsData(trends);
        
        // Set metrics state with the health profile
        setMetrics({
          ...healthProfile,
          // Add any type conversions as needed to match HealthMetrics type
          weight: healthProfile.weight as any,
          height: healthProfile.height as any,
          workouts: workoutsData
        });
        
        // Generate workout statistics
        const workoutStatistics = generateWorkoutStats(workoutsData);
        setWorkoutStats(workoutStatistics);
        
        // Generate workout frequency data
        const frequencyData = generateWorkoutFrequency(workoutsData);
        setWorkoutFrequency(frequencyData);
        
        // Load journal entries from localStorage for insights
        const savedEntries = localStorage.getItem('journalEntries');
        if (savedEntries) {
          const entries = JSON.parse(savedEntries);
          const insights = analyzeJournalEntries(entries);
          setJournalInsights(insights);
        }
      } catch (error) {
        console.error('Error fetching data for analytics:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [publicKey]);
  
  // Generate actual data from the health history
  const processHealthHistory = (history: any[]): TimeSeriesData[] => {
    if (!history || !Array.isArray(history) || history.length === 0) {
      return [];
    }
    
    // Map the actual data points from history
    return history.map(entry => {
      const date = new Date(entry.timestamp).toISOString().split('T')[0];
      
      return {
        date,
        weight: entry.weight?.value || 0,
        height: entry.height?.value || 0,
        calories: entry.nutrition?.calories || 0,
        workout: entry.workout?.duration || 0,
        value: 0 // Placeholder, will be set based on selected metric
      };
    });
  };
  
  // Replace the generateSampleTrendsData function
  const generateTrendsDataFromHistory = (healthHistory: any): TimeSeriesData[] => {
    if (!healthHistory || !Array.isArray(healthHistory) || healthHistory.length === 0) {
      return [];
    }
    
    return processHealthHistory(healthHistory);
  };
  
  // Generate workout statistics from workout data
  const generateWorkoutStats = (workouts: any[]): WorkoutSummary[] => {
    if (!workouts || !workouts.length) return [];
    
    const workoutTypes: { [key: string]: WorkoutSummary } = {};
    
    workouts.forEach(workout => {
      const type = workout.type || 'Other';
      
      if (!workoutTypes[type]) {
        workoutTypes[type] = {
          type,
          count: 0,
          totalDistance: 0,
          avgDuration: 0,
          totalCalories: 0
        };
      }
      
      workoutTypes[type].count += 1;
      workoutTypes[type].totalDistance += parseFloat(workout.distance || '0');
      workoutTypes[type].totalCalories += workout.calories || 0;
      
      // Calculate duration in minutes
      const duration = workout.duration 
        ? parseFloat(workout.duration.split(' ')[0]) 
        : 0;
      
      workoutTypes[type].avgDuration = 
        (workoutTypes[type].avgDuration * (workoutTypes[type].count - 1) + duration) / 
        workoutTypes[type].count;
    });
    
    return Object.values(workoutTypes);
  };
  
  // Generate workout frequency data
  const generateWorkoutFrequency = (workouts: any[]): Array<{ name: string; value: number }> => {
    if (!workouts || !workouts.length) return [];
    
    const frequency: { [key: string]: number } = {
      'Running': 0,
      'Cycling': 0,
      'Swimming': 0,
      'Walking': 0,
      'Weightlifting': 0,
      'HIIT': 0,
      'Yoga': 0,
      'Other': 0
    };
    
    workouts.forEach(workout => {
      const type = workout.type || 'Other';
      if (frequency[type] !== undefined) {
        frequency[type] += 1;
      } else {
        frequency['Other'] += 1;
      }
    });
    
    return Object.entries(frequency)
      .filter(([_, count]) => count > 0)
      .map(([name, value]) => ({ name, value }));
  };
  
  // Analyze journal entries for insights
  const analyzeJournalEntries = (entries: any[]): JournalInsight[] => {
    if (!entries || !entries.length) return [];
    
    // This is a placeholder. In a real implementation, you might:
    // 1. Analyze sentiment over time
    // 2. Extract topics/themes
    // 3. Correlate with workouts and health metrics
    
    return [
      { type: 'Total Entries', count: entries.length, trend: 'up' },
      { type: 'Last 7 Days', count: entries.filter(e => {
        const date = new Date(e.date);
        const now = new Date();
        const diffTime = Math.abs(now.getTime() - date.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays <= 7;
      }).length, trend: 'up' },
      { type: 'Average Length', count: Math.floor(
        entries.reduce((sum, entry) => sum + entry.content.length, 0) / entries.length
      ), trend: 'neutral' }
    ];
  };
  
  // Get data for a specific metric
  const getMetricData = (metricId: string): TimeSeriesData[] => {
    return trendsData.map(d => ({
      date: d.date,
      value: d[metricId] as number
    }));
  };
  
  // Find the color for a specific metric
  const getMetricColor = (metricId: string): string => {
    const metric = AVAILABLE_METRICS.find(m => m.id === metricId);
    return metric ? metric.color : 'hsl(var(--primary))';
  };

  // Update metrics for correlation analysis
  useEffect(() => {
    const metric = AVAILABLE_METRICS.find(m => m.id === primaryMetric.id);
    const compared = AVAILABLE_METRICS.find(m => m.id === secondaryMetric.id);
    
    if (metric && compared) {
      setMetricCorrelation({
        id: metric,
        comparedWith: compared
      });
    }
  }, [primaryMetric, secondaryMetric]);

  if (!publicKey) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Please connect your Nostr account to view your analytics.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Loading your analytics data...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col space-y-2">
        <h1 className="text-3xl font-bold">Health Analytics</h1>
        <p className="text-muted-foreground">
          Track your progress and gain insights from your health data
        </p>
      </div>
      
      <Tabs defaultValue={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="trends">Trends</TabsTrigger>
          <TabsTrigger value="workouts">Workouts</TabsTrigger>
          <TabsTrigger value="correlations">Correlations</TabsTrigger>
          <TabsTrigger value="insights">Insights</TabsTrigger>
        </TabsList>
        
        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6 animate-scale-in">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Key Metrics */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center text-xl">
                  <TrendingUp className="mr-2 h-5 w-5 text-primary" />
                  Key Metrics
                </CardTitle>
                <CardDescription>
                  Summary of your most important health indicators
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {metrics?.weight && (
                    <div className="flex justify-between items-center py-2 border-b">
                      <span>Weight</span>
                      <span className="font-medium">
                        {metrics.weight.value} {metrics.weight.unit}
                      </span>
                    </div>
                  )}
                  
                  {metrics?.height && (
                    <div className="flex justify-between items-center py-2 border-b">
                      <span>Height</span>
                      <span className="font-medium">
                        {metrics.height.value} {metrics.height.unit}
                      </span>
                    </div>
                  )}
                  
                  {metrics?.nutrition?.calories && (
                    <div className="flex justify-between items-center py-2 border-b">
                      <span>Calories</span>
                      <span className="font-medium">
                        {metrics.nutrition.calories} kcal
                      </span>
                    </div>
                  )}
                  
                  {metrics?.workouts && (
                    <div className="flex justify-between items-center py-2">
                      <span>Workouts</span>
                      <span className="font-medium">
                        {metrics.workouts.length} completed
                      </span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
            
            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center text-xl">
                  <Calendar className="mr-2 h-5 w-5 text-primary" />
                  Recent Activity
                </CardTitle>
                <CardDescription>
                  Your latest workouts and journal entries
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[200px]">
                  {workoutStats.length > 0 ? (
                    <div className="space-y-4">
                      {workoutStats.slice(0, 3).map((stat, index) => (
                        <div key={index} className="flex justify-between items-center py-2 border-b">
                          <span className="font-medium">{stat.type}</span>
                          <span>{stat.count} workouts</span>
                        </div>
                      ))}
                      
                      {journalInsights.length > 0 && (
                        <div className="flex justify-between items-center py-2">
                          <span className="font-medium">Journal Entries</span>
                          <span>{journalInsights[0].count} entries</span>
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="text-muted-foreground text-center py-8">
                      No recent activity data available
                    </p>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
          
          {/* Trend Visualizations */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center text-xl">
                <LineChart className="mr-2 h-5 w-5 text-primary" />
                Health Trends
              </CardTitle>
              <CardDescription>
                Key health metrics over the past 30 days
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                {trendsData.length > 0 ? (
                  <MetricLineChart 
                    data={getMetricData('weight')} 
                    color={getMetricColor('weight')} 
                  />
                ) : (
                  <div className="h-full flex items-center justify-center">
                    <p className="text-muted-foreground">No trend data available</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
          
          {/* Multi-Metric Correlation */}
          <MultiMetricCorrelation 
            data={trendsData} 
            metrics={AVAILABLE_METRICS} 
          />
        </TabsContent>

        {/* Health Tab */}
        <TabsContent value="health" className="space-y-6 animate-scale-in">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Weight Trend */}
            <Card>
              <CardHeader>
                <CardTitle>Weight Trend</CardTitle>
                <CardDescription>Your weight over the past 30 days</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[200px]">
                  {trendsData.length > 0 ? (
                    <MetricLineChart 
                      data={getMetricData('weight')} 
                      color={getMetricColor('weight')} 
                    />
                  ) : (
                    <div className="h-full flex items-center justify-center">
                      <p className="text-muted-foreground">No weight data available</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
            
            {/* Sleep Quality */}
            <Card>
              <CardHeader>
                <CardTitle>Sleep Quality</CardTitle>
                <CardDescription>Your sleep duration over time</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[200px]">
                  {trendsData.length > 0 ? (
                    <MetricBarChart 
                      data={getMetricData('sleep')} 
                      color={getMetricColor('sleep')} 
                    />
                  ) : (
                    <div className="h-full flex items-center justify-center">
                      <p className="text-muted-foreground">No sleep data available</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Nutrition */}
            <Card>
              <CardHeader>
                <CardTitle>Nutrition</CardTitle>
                <CardDescription>Your nutrition score over time</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[200px]">
                  {trendsData.length > 0 ? (
                    <MetricLineChart 
                      data={getMetricData('calories')} 
                      color={getMetricColor('calories')} 
                    />
                  ) : (
                    <div className="h-full flex items-center justify-center">
                      <p className="text-muted-foreground">No nutrition data available</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
            
            {/* Habits */}
            <Card>
              <CardHeader>
                <CardTitle>Habits</CardTitle>
                <CardDescription>Your daily habit completion</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[200px]">
                  {trendsData.length > 0 ? (
                    <MetricBarChart 
                      data={getMetricData('workout')} 
                      color={getMetricColor('workout')} 
                    />
                  ) : (
                    <div className="h-full flex items-center justify-center">
                      <p className="text-muted-foreground">No habit data available</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Workouts Tab */}
        <TabsContent value="workouts" className="space-y-6 animate-scale-in">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Workout Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>Workout Distribution</CardTitle>
                <CardDescription>Breakdown of your workout types</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[200px]">
                  {workoutFrequency.length > 0 ? (
                    <BarChart 
                      data={workoutFrequency} 
                      color="hsl(var(--chart-1))" 
                    />
                  ) : (
                    <div className="h-full flex items-center justify-center">
                      <p className="text-muted-foreground">No workout data available</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
            
            {/* Running Trend */}
            <Card>
              <CardHeader>
                <CardTitle>Running Activity</CardTitle>
                <CardDescription>Your running distance over time</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[200px]">
                  {trendsData.length > 0 ? (
                    <MetricLineChart 
                      data={getMetricData('height')} 
                      color={getMetricColor('height')} 
                    />
                  ) : (
                    <div className="h-full flex items-center justify-center">
                      <p className="text-muted-foreground">No running data available</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
          
          {/* Workout Statistics */}
          <Card>
            <CardHeader>
              <CardTitle>Workout Statistics</CardTitle>
              <CardDescription>
                Summary statistics for your workouts
              </CardDescription>
            </CardHeader>
            <CardContent>
              {workoutStats.length > 0 ? (
                <div className="rounded-md border">
                  <div className="grid grid-cols-5 py-3 px-4 text-sm font-medium bg-muted/50">
                    <div>Type</div>
                    <div>Count</div>
                    <div>Avg Duration</div>
                    <div>Total Distance</div>
                    <div>Total Calories</div>
                  </div>
                  <Separator />
                  {workoutStats.map((stat, i) => (
                    <React.Fragment key={i}>
                      <div className="grid grid-cols-5 py-3 px-4 text-sm">
                        <div className="font-medium">{stat.type}</div>
                        <div>{stat.count}</div>
                        <div>{stat.avgDuration.toFixed(0)} min</div>
                        <div>{stat.totalDistance.toFixed(1)} km</div>
                        <div>{stat.totalCalories.toFixed(0)} kcal</div>
                      </div>
                      {i < workoutStats.length - 1 && <Separator />}
                    </React.Fragment>
                  ))}
                </div>
              ) : (
                <div className="h-[200px] flex items-center justify-center">
                  <p className="text-muted-foreground">No workout statistics available</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Insights Tab */}
        <TabsContent value="insights" className="space-y-6 animate-scale-in">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Journal Metrics */}
            <Card>
              <CardHeader>
                <CardTitle>Journal Metrics</CardTitle>
                <CardDescription>Statistics about your journal entries</CardDescription>
              </CardHeader>
              <CardContent>
                {journalInsights.length > 0 ? (
                  <div className="space-y-4">
                    {journalInsights.map((insight, index) => (
                      <div key={index} className="flex justify-between items-center py-2 border-b last:border-0">
                        <span>{insight.type}</span>
                        <span className="font-medium flex items-center gap-2">
                          {insight.count}
                          {insight.trend === 'up' && <TrendingUp className="h-4 w-4 text-green-500" />}
                          {insight.trend === 'down' && <TrendingUp className="h-4 w-4 rotate-180 text-red-500" />}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="h-[200px] flex items-center justify-center">
                    <p className="text-muted-foreground">No journal data available</p>
                  </div>
                )}
              </CardContent>
            </Card>
            
            {/* Lifting Progress */}
            <Card>
              <CardHeader>
                <CardTitle>Lifting Progress</CardTitle>
                <CardDescription>Your lifting volume over time</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[200px]">
                  {trendsData.length > 0 ? (
                    <MetricLineChart 
                      data={getMetricData('lifting')} 
                      color={getMetricColor('lifting')} 
                    />
                  ) : (
                    <div className="h-full flex items-center justify-center">
                      <p className="text-muted-foreground">No lifting data available</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
          
          {/* Health vs. Mental Well-being */}
          <MultiMetricCorrelation 
            data={trendsData} 
            metrics={[
              AVAILABLE_METRICS.find(m => m.id === 'meditation')!,
              AVAILABLE_METRICS.find(m => m.id === 'sleep')!,
              AVAILABLE_METRICS.find(m => m.id === 'height')!,
              AVAILABLE_METRICS.find(m => m.id === 'spiritual')!
            ]} 
          />
        </TabsContent>
      </Tabs>
      
      <div className="bg-amber-50 dark:bg-amber-950/30 p-4 rounded-lg border border-amber-200 dark:border-amber-800 mt-8">
        <h3 className="text-lg font-medium text-amber-800 dark:text-amber-400">About Analytics</h3>
        <p className="mt-2 text-sm text-amber-700 dark:text-amber-500">
          This page shows visualizations based on your actual health data tracked in the app.
          Only metrics that you are actively tracking (weight, height, workouts, and calories) are displayed.
          Your data is retrieved from Nostr relays and your Blossom server, while maintaining your privacy preferences.
        </p>
      </div>
    </div>
  );
};

export default AnalyticsPage; 