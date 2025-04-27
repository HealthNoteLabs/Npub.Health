import React, { useEffect, useState } from 'react';
import { fetchWorkouts, WorkoutData } from '../../lib/nostr';
import { useNostr } from '../../components/NostrProvider';

// Weather condition icons mapping
const weatherIcons: Record<string, string> = {
  sunny: '☀️',
  clear: '☀️',
  partly_cloudy: '⛅',
  cloudy: '☁️',
  overcast: '☁️',
  rainy: '🌧️',
  rain: '🌧️',
  stormy: '⛈️',
  thunder: '⛈️',
  snowy: '❄️',
  snow: '❄️',
  foggy: '🌫️',
  fog: '🌫️',
  windy: '💨',
  hot: '🔥',
  cold: '❄️'
};

// Format functions
const formatDuration = (duration?: string): string => {
  if (!duration) return 'N/A';
  if (duration === 'N/A') return 'N/A';
  
  // Already formatted correctly (H:MM:SS or MM:SS)
  if (/^\d+:\d{2}(:\d{2})?$/.test(duration)) {
    return duration;
  }
  
  // Try to parse number as seconds
  if (/^\d+(\.\d+)?$/.test(duration)) {
    const seconds = parseInt(duration);
    if (seconds >= 3600) {
      const hours = Math.floor(seconds / 3600);
      const minutes = Math.floor((seconds % 3600) / 60);
      const secs = seconds % 60;
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    } else {
      const minutes = Math.floor(seconds / 60);
      const secs = seconds % 60;
      return `${minutes}:${secs.toString().padStart(2, '0')}`;
    }
  }
  
  return duration;
};

const formatDistance = (distance?: string): string => {
  if (!distance) return 'N/A';
  if (distance === 'N/A') return 'N/A';
  
  // If it's an estimated value, return as is
  if (distance.includes('est.')) {
    return distance;
  }
  
  // Make sure there's a space between number and unit
  return distance.replace(/^(\d+(\.\d+)?)([a-z]+)$/i, '$1 $3');
};

const formatPace = (pace?: string, workout?: WorkoutData): string => {
  if (!pace) return 'N/A';
  if (pace === 'N/A') return 'N/A';
  
  // If it's an estimated value, return as is
  if (pace.includes('est.')) {
    return pace;
  }
  
  // If pace already has a unit suffix, return as is
  if (pace.includes('/')) {
    // Make sure it's using the right format for the unit
    // e.g., "5:30/km" or "8:45/mi"
    const parts = pace.split('/');
    if (parts.length === 2) {
      const timeFormat = parts[0];
      const unit = parts[1].toLowerCase();
      
      // Ensure proper time format and unit
      if (/^\d+:\d{2}$/.test(timeFormat)) {
        if (unit === 'km' || unit === 'mi') {
          return pace; // Already well formatted
        } else if (unit.includes('km')) {
          return `${timeFormat}/km`;
        } else if (unit.includes('mi')) {
          return `${timeFormat}/mi`;
        }
      }
    }
    return pace; // If we couldn't parse it, return as is
  }
  
  // If it's just a time format like 5:30, determine unit from workout
  if (/^\d+:\d{2}$/.test(pace)) {
    // Determine unit from the distance field if available
    let unit = 'km'; // Default unit
    if (workout && workout.distance) {
      unit = workout.distance.toLowerCase().includes('mi') ? 'mi' : 'km';
    }
    return `${pace}/${unit}`;
  }
  
  // Handle pace in seconds format (e.g., "260" meaning 4:20 per km)
  if (/^\d+(\.\d+)?$/.test(pace)) {
    const seconds = parseFloat(pace);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.round(seconds % 60);
    
    // Determine unit from the distance field if available
    let unit = 'km'; // Default unit
    if (workout && workout.distance) {
      unit = workout.distance.toLowerCase().includes('mi') ? 'mi' : 'km';
    }
    
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}/${unit}`;
  }
  
  return pace;
};

const formatDate = (timestamp: number): string => {
  return new Date(timestamp * 1000).toLocaleDateString();
};

const getWeatherDescription = (weather?: WorkoutData['weather']): string => {
  if (!weather) return 'N/A';
  
  let description = '';
  
  if (weather.condition) {
    const icon = weatherIcons[weather.condition] || '🌡️';
    description += `${icon} ${weather.condition.replace('_', ' ')}`;
  }
  
  if (weather.temp !== undefined) {
    description += description ? ', ' : '';
    description += `${weather.temp}°${weather.unit || 'C'}`;
  }
  
  if (weather.humidity !== undefined) {
    description += description ? ', ' : '';
    description += `${weather.humidity}% humidity`;
  }
  
  return description || 'N/A';
};

// Determine if a workout is from Runstr
const isRunstrWorkout = (workout: WorkoutData): boolean => {
  if (!workout) return false;
  
  return !!(
    (typeof workout.notes === 'string' && workout.notes.includes('RUNSTR')) ||
    (workout.title && workout.title.includes('RUNSTR')) ||
    (workout.tags && workout.tags.some(tag => tag.toLowerCase() === 'runstr')) ||
    (workout.source && workout.source.includes('RUNSTR'))
  );
};

const WorkoutDashboard: React.FC = () => {
  const { publicKey } = useNostr();
  const [loading, setLoading] = useState(true);
  const [workouts, setWorkouts] = useState<WorkoutData[]>([]);
  const [expandedWorkout, setExpandedWorkout] = useState<string | null>(null);

  // Function to ensure each workout has an ID
  const ensureWorkoutIds = (workoutsData: WorkoutData[]): WorkoutData[] => {
    return workoutsData.map((workout, index) => {
      if (!workout.id) {
        // Create a synthetic ID using timestamp and index
        const syntheticId = `workout-${workout.timestamp}-${index}`;
        console.log(`Assigning synthetic ID: ${syntheticId} to workout at index ${index}`);
        return { ...workout, id: syntheticId };
      }
      return workout;
    });
  };

  useEffect(() => {
    if (!publicKey) return;

    const loadWorkouts = async () => {
      setLoading(true);
      try {
        const data = await fetchWorkouts(publicKey, 50); // Fetch up to 50 workout records
        console.log('Loaded workout data:', data);
        
        // Assign synthetic IDs to ensure all workouts are clickable
        const workoutsWithIds = ensureWorkoutIds(data);
        setWorkouts(workoutsWithIds);
      } catch (error) {
        console.error('Error loading workout data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadWorkouts();
  }, [publicKey]);

  const toggleExpandWorkout = (id?: string) => {
    console.log('Toggling workout:', id, 'Current expanded:', expandedWorkout);
    if (!id) {
      console.log('No ID provided for workout, cannot toggle');
      return;
    }
    
    if (expandedWorkout === id) {
      console.log('Collapsing workout:', id);
      setExpandedWorkout(null);
    } else {
      console.log('Expanding workout:', id);
      setExpandedWorkout(id);
    }
  };

  if (!publicKey) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-500">Please connect your Nostr account to view your workout data.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-500">Loading your workout data...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Workout History</h1>
      
      {workouts.length > 0 ? (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Duration</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Distance</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Pace</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Calories</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Details</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {workouts.map((workout, index) => {
                const runstrWorkout = isRunstrWorkout(workout);
                console.log(`Workout ${index} has ID: ${workout.id}, expanded: ${expandedWorkout === workout.id}`);
                return (
                  <React.Fragment key={workout.id || index}>
                    <tr 
                      className={`
                        transition-colors duration-200
                        hover:bg-gray-100 cursor-pointer active:bg-gray-200 
                        ${expandedWorkout === workout.id ? 'bg-blue-50 hover:bg-blue-100' : ''} 
                        ${runstrWorkout ? 'bg-green-50 hover:bg-green-100' : ''}
                      `}
                      onClick={() => {
                        console.log('Row clicked, workout ID:', workout.id);
                        toggleExpandWorkout(workout.id);
                      }}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        {formatDate(workout.timestamp)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap flex items-center">
                        {runstrWorkout && <span className="mr-2 text-green-600 font-medium">🏃</span>}
                        {workout.title || workout.type || 'Unknown'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {formatDuration(workout.duration)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {formatDistance(workout.distance)}
                        {(!workout.distance || workout.distance === 'N/A') && (
                          <span className="text-xs text-gray-500 block">Distance not recorded</span>
                        )}
                        {workout.distance && workout.distance.includes('est.') && (
                          <span className="text-xs text-gray-500 block">Estimated</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {formatPace(workout.pace, workout)}
                        {(!workout.pace || workout.pace === 'N/A') && (
                          <span className="text-xs text-gray-500 block">Pace not available</span>
                        )}
                        {workout.pace && workout.pace.includes('est.') && (
                          <span className="text-xs text-gray-500 block">Estimated</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {workout.calories ? `${workout.calories} kcal` : 'N/A'}
                        {!workout.calories && (
                          <span className="text-xs text-gray-500 block">Calories not recorded</span>
                        )}
                      </td>
                      <td className="px-6 py-4 flex items-center justify-between">
                        <div className="text-sm">
                          {workout.notes && workout.notes.length > 30 
                            ? `${workout.notes.substring(0, 30)}...` 
                            : (workout.notes || 'No details')}
                        </div>
                        <button 
                          className="ml-2 p-1 rounded-full hover:bg-gray-200 focus:outline-none"
                          onClick={(e) => {
                            e.stopPropagation(); // Prevent the row click from also triggering
                            toggleExpandWorkout(workout.id);
                          }}
                        >
                          {expandedWorkout === workout.id ? 
                            <span className="text-blue-600 font-bold">▲</span> : 
                            <span className="text-blue-600 font-bold">▼</span>
                          }
                        </button>
                      </td>
                    </tr>
                    
                    {/* Expanded workout details */}
                    {expandedWorkout === workout.id && (
                      <tr>
                        <td colSpan={7} className={`px-6 py-4 ${runstrWorkout ? 'bg-green-50' : 'bg-blue-50'}`}>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Left column - Workout stats */}
                            <div>
                              <h3 className="font-semibold text-lg mb-2 flex items-center">
                                {runstrWorkout && <span className="mr-2 text-green-600">🏃</span>}
                                {workout.title || 'Workout Details'}
                              </h3>
                              
                              <div className="space-y-2 text-sm">
                                {runstrWorkout && (
                                  <p className="font-medium text-green-700 bg-green-100 p-2 rounded-md">
                                    This workout was recorded with RUNSTR
                                  </p>
                                )}
                                
                                {workout.source && (
                                  <p>
                                    <span className="font-medium">Source: </span>
                                    <span className="inline-block bg-blue-200 rounded-full px-2 py-1 text-xs font-semibold text-blue-700">
                                      {workout.source}
                                    </span>
                                  </p>
                                )}
                                
                                {workout.tags && workout.tags.length > 0 && (
                                  <p>
                                    <span className="font-medium">Tags: </span>
                                    {workout.tags.map(tag => (
                                      <span key={tag} className="inline-block bg-gray-200 rounded-full px-2 py-1 text-xs font-semibold text-gray-700 mr-1">
                                        {tag}
                                      </span>
                                    ))}
                                  </p>
                                )}
                                
                                {workout.startTime && (
                                  <p>
                                    <span className="font-medium">Started: </span>
                                    {new Date(workout.startTime * 1000).toLocaleString()}
                                  </p>
                                )}
                                
                                {workout.endTime && (
                                  <p>
                                    <span className="font-medium">Ended: </span>
                                    {new Date(workout.endTime * 1000).toLocaleString()}
                                  </p>
                                )}
                                
                                {workout.duration && workout.duration !== 'N/A' && (
                                  <p>
                                    <span className="font-medium">Duration: </span>
                                    {workout.duration}
                                  </p>
                                )}
                                
                                {workout.distance && workout.distance !== 'N/A' && (
                                  <p>
                                    <span className="font-medium">Distance: </span>
                                    {workout.distance}
                                  </p>
                                )}
                                
                                {workout.pace && workout.pace !== 'N/A' && (
                                  <p>
                                    <span className="font-medium">Pace: </span>
                                    {formatPace(workout.pace, workout)}
                                  </p>
                                )}
                                
                                {workout.heartRate && (
                                  <p>
                                    <span className="font-medium">Heart Rate: </span>
                                    {workout.heartRate.value} {workout.heartRate.unit}
                                  </p>
                                )}
                                
                                {workout.maxHeartRate && (
                                  <p>
                                    <span className="font-medium">Max Heart Rate: </span>
                                    {workout.maxHeartRate.value} {workout.maxHeartRate.unit}
                                  </p>
                                )}
                                
                                {workout.cadence && (
                                  <p>
                                    <span className="font-medium">Cadence: </span>
                                    {workout.cadence.value} {workout.cadence.unit}
                                  </p>
                                )}
                                
                                {workout.elevationGain !== undefined && (
                                  <p>
                                    <span className="font-medium">Elevation Gain: </span>
                                    {workout.elevationGain} m
                                  </p>
                                )}
                                
                                {workout.avgSpeed !== undefined && (
                                  <p>
                                    <span className="font-medium">Avg Speed: </span>
                                    {workout.avgSpeed} km/h
                                  </p>
                                )}
                                
                                {workout.maxSpeed !== undefined && (
                                  <p>
                                    <span className="font-medium">Max Speed: </span>
                                    {workout.maxSpeed} km/h
                                  </p>
                                )}
                                
                                {workout.weather && (
                                  <p>
                                    <span className="font-medium">Weather: </span>
                                    {getWeatherDescription(workout.weather)}
                                  </p>
                                )}
                                
                                {workout.completed !== undefined && (
                                  <p>
                                    <span className="font-medium">Status: </span>
                                    {workout.completed ? '✅ Completed' : '❌ Not completed'}
                                  </p>
                                )}
                              </div>
                            </div>
                            
                            {/* Right column - Splits if available, otherwise raw data for debugging */}
                            <div>
                              {workout.splits && workout.splits.length > 0 ? (
                                <>
                                  <h3 className="font-semibold text-lg mb-2">Splits</h3>
                                  <table className="min-w-full divide-y divide-gray-200 text-sm">
                                    <thead>
                                      <tr>
                                        <th className="px-2 py-1 text-left font-medium">#</th>
                                        <th className="px-2 py-1 text-left font-medium">Distance</th>
                                        <th className="px-2 py-1 text-left font-medium">Time</th>
                                        <th className="px-2 py-1 text-left font-medium">Pace</th>
                                        <th className="px-2 py-1 text-left font-medium">Heart Rate</th>
                                        <th className="px-2 py-1 text-left font-medium">Elevation</th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {workout.splits.map(split => (
                                        <tr key={split.number} className="border-t border-gray-200">
                                          <td className="px-2 py-1">{split.number}</td>
                                          <td className="px-2 py-1">{`${split.distance} ${split.unit}`}</td>
                                          <td className="px-2 py-1">{split.time}</td>
                                          <td className="px-2 py-1">{split.pace ? formatPace(split.pace, workout) : '-'}</td>
                                          <td className="px-2 py-1">{split.heartRate ? `${split.heartRate} bpm` : '-'}</td>
                                          <td className="px-2 py-1">{split.elevation !== undefined ? `${split.elevation} m` : '-'}</td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </>
                              ) : runstrWorkout ? (
                                <>
                                  <h3 className="font-semibold text-lg mb-2">Run Summary</h3>
                                  <div className="p-4 bg-green-100 rounded-md">
                                    <p>This is a running workout recorded with RUNSTR.</p>
                                    <p className="mt-2">
                                      Detailed metrics like splits and pace may not be available for this workout.
                                    </p>
                                  </div>
                                </>
                              ) : null}
                            </div>
                            
                            {/* Notes section at the bottom if available */}
                            {workout.notes && (
                              <div className="col-span-1 md:col-span-2 mt-2">
                                <h3 className="font-semibold text-md">Notes</h3>
                                <p className="text-sm mt-1 whitespace-pre-wrap">{workout.notes}</p>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="bg-white p-8 rounded-lg shadow text-center">
          <p className="text-gray-500 mb-4">No workout records found</p>
          <p className="text-sm text-gray-400">
            Workout data is retrieved from Nostr kind 1301 events. You'll see data here once workouts are published to Nostr from compatible apps.
          </p>
        </div>
      )}
    </div>
  );
};

export default WorkoutDashboard; 