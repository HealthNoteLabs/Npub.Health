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
    if ('displayUnit' in metric && (metric as any).displayUnit === 'lbs') {
      return 'lbs';
    }
    
    // If we have a kg value but no display unit, convert it to lbs
    if ('value' in metric && !('displayUnit' in metric)) {
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

        <MetricCard 
          title="Weight" 
          value={getMetricValue(metrics?.weight)}
          unit={getMetricUnit(metrics?.weight, 'kg')} 
          kind={CLIENT_KINDS.WEIGHT}
        />

        <MetricCard 
          title="Height" 
          value={getMetricValue(metrics?.height) || 'Enter height'} 
          unit={getMetricUnit(metrics?.height, 'cm')} 
          kind={CLIENT_KINDS.HEIGHT}
        /> 