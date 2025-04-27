import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import MetricCard from "../MetricCard";
import { Dumbbell, ScrollText } from "lucide-react";
import { MetricBarChart } from "../ChartComponents";

interface WorkoutExercise {
  name: string;
  sets?: number;
  reps?: number;
  weight?: number;
  weightUnit?: 'kg' | 'lb';
  duration?: number;
  distance?: number;
  notes?: string;
}

interface WorkoutRecord {
  id?: string;
  type?: string;
  startTime?: string;
  endTime?: string;
  duration?: number;
  exercises?: WorkoutExercise[];
  totalCalories?: number;
  notes?: string;
}

interface WorkoutWidgetProps {
  data?: WorkoutRecord[];
  loading?: boolean;
}

export default function WorkoutWidget({ data, loading }: WorkoutWidgetProps) {
  // Format workout statistics
  const totalWorkouts = data?.length || 0;
  
  // Get the most recent workout date
  const lastWorkoutDate = data && data.length > 0 && data[0].startTime
    ? new Date(data[0].startTime).toLocaleDateString()
    : 'No workouts recorded';

  // Calculate average calories per workout
  const avgCalories = data && data.length > 0
    ? Math.round(
        data.reduce((sum, workout) => sum + (workout.totalCalories || 0), 0) / data.length
      )
    : 0;

  // Prepare chart data by workout type
  const workoutTypesCounts = data?.reduce((counts: Record<string, number>, workout) => {
    const type = workout.type || 'Unknown';
    counts[type] = (counts[type] || 0) + 1;
    return counts;
  }, {}) || {};

  // Convert to chart data format
  const chartData = Object.entries(workoutTypesCounts).map(([type, count]) => ({
    name: type,
    value: count
  }));

  return (
    <Card className="col-span-2 row-span-2">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-xl font-bold">Workout Records</CardTitle>
        <Dumbbell className="h-5 w-5 text-primary" />
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-3 gap-4">
          <MetricCard
            title="Total Workouts"
            value={totalWorkouts}
            loading={loading}
          />
          <MetricCard
            title="Last Workout"
            value={lastWorkoutDate}
            loading={loading}
          />
          <MetricCard
            title="Avg. Calories"
            value={avgCalories}
            unit="kcal"
            loading={loading}
          />
        </div>

        <div className="pt-4">
          <h4 className="text-sm font-medium text-muted-foreground mb-3">Workout Types</h4>
          <div className="h-48">
            <MetricBarChart 
              data={chartData.map(item => ({ date: item.name, value: item.value }))}
              loading={loading}
              color="hsl(var(--primary))"
            />
          </div>
        </div>

        <div className="pt-4">
          <h4 className="text-sm font-medium text-muted-foreground mb-3">Recent Workouts</h4>
          {loading ? (
            <p>Loading workout history...</p>
          ) : data && data.length > 0 ? (
            <div className="space-y-3 max-h-60 overflow-y-auto">
              {data.slice(0, 5).map((workout, index) => (
                <div key={workout.id || index} className="p-3 bg-secondary/20 rounded-md">
                  <div className="flex justify-between items-start">
                    <h5 className="font-medium">{workout.type || 'Workout'}</h5>
                    <p className="text-xs text-muted-foreground">
                      {workout.startTime ? new Date(workout.startTime).toLocaleDateString() : 'No date'}
                    </p>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {workout.exercises?.length || 0} exercises · 
                    {workout.duration ? ` ${Math.round(workout.duration / 60)} min` : ' Unknown duration'} · 
                    {workout.totalCalories ? ` ${workout.totalCalories} kcal` : ''}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground">No workout records found</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
} 