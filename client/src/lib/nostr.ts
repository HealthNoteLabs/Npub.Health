import { SimplePool, getPublicKey, nip19, Event, Filter } from 'nostr-tools';

declare global {
  interface Window {
    nostr?: {
      getPublicKey(): Promise<string>;
      signEvent(event: Event): Promise<Event>;
    };
  }
}

export const RELAYS = [
  'wss://relay.damus.io',
  'wss://relay.snort.social',
  'wss://nos.lol',
];

export const CLIENT_KINDS = {
  // Health metrics from NIP-101h
  WEIGHT: 1351,
  HEIGHT: 1352,
  AGE: 1353,
  GENDER: 1354,
  FITNESS_LEVEL: 1355,
  // Workout records from NIP-101e
  WORKOUT: 1301,
  // Standard Nostr kinds
  METADATA: 0
};

interface MetricHistoryItem {
  timestamp: number;
  value: number;
  unit: string;
  displayValue?: string;
  displayUnit?: string;
}

export interface ProfileMetadata {
  name?: string;
  about?: string;
  picture?: string;
  banner?: string;
  nip05?: string;
  [key: string]: any;
}

export const pool = new SimplePool();

// Check if Nostr extension is available
export function checkNostrAvailability(): boolean {
  console.log('Checking Nostr availability');
  console.log('window.nostr exists:', !!window.nostr);
  
  if (window.nostr) {
    console.log('window.nostr methods:', Object.keys(window.nostr));
    console.log('getPublicKey exists:', typeof window.nostr.getPublicKey === 'function');
    console.log('signEvent exists:', typeof window.nostr.signEvent === 'function');
  }
  
  return !!window.nostr;
}

// Add this function after the checkNostrAvailability function
export async function debugNostr() {
  console.log('===== NOSTR DEBUG INFORMATION =====');
  console.log('Checking window.nostr availability...');
  const hasNostr = checkNostrAvailability();
  console.log('window.nostr available:', hasNostr);
  
  console.log('window.nostr type:', typeof window.nostr);
  if (window.nostr) {
    console.log('window.nostr keys:', Object.keys(window.nostr));
    console.log('getPublicKey type:', typeof window.nostr.getPublicKey);
    console.log('signEvent type:', typeof window.nostr.signEvent);
    
    if (typeof window.nostr.getPublicKey === 'function') {
      console.log('Testing getPublicKey with 5s timeout...');
      try {
        // Create a timeout promise to race against getPublicKey
        const timeout = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('getPublicKey timeout after 5s')), 5000);
        });
        
        const pubkeyPromise = window.nostr.getPublicKey();
        const pubkey = await Promise.race([pubkeyPromise, timeout]);
        console.log('Retrieved public key:', pubkey);
        
        // Test relay connections
        console.log('Testing relay connections...');
        for (const relay of RELAYS) {
          try {
            console.log(`Connecting to ${relay}...`);
            await pool.ensureRelay(relay);
            console.log(`Successfully connected to ${relay}`);
          } catch (err) {
            console.error(`Failed to connect to ${relay}:`, err);
          }
        }
      } catch (err) {
        console.error('Error getting public key:', err);
      }
    } else {
      console.error('getPublicKey is not a function');
    }
  } else {
    console.log('Details about window:', Object.keys(window));
    console.log('Checking if window.nostr is being injected after page load...');
  }
  
  console.log('===== END DEBUG INFORMATION =====');
}

// Unit conversion utilities
export const unitConversions = {
  weight: {
    lbsToKg: (lbs: number) => lbs * 0.45359237,
    kgToLbs: (kg: number) => kg / 0.45359237
  },
  height: {
    inchesToCm: (inches: number) => inches * 2.54,
    cmToInches: (cm: number) => cm / 2.54,
    ftInchesToCm: (ft: number, inches: number) => ((ft * 12) + inches) * 2.54
  }
};

// Helper to try parsing content or return structured fallback
export function parseContent(content: string, kind: number) {
  try {
    // First attempt to parse as JSON
    return JSON.parse(content);
  } catch (error) {
    // If it can't be parsed as JSON, try to create a structured object based on kind
    switch (kind) {
      case CLIENT_KINDS.WEIGHT:
        return parseWeightContent(content);
      case CLIENT_KINDS.HEIGHT:
        return parseHeightContent(content);
      case CLIENT_KINDS.AGE:
        return parseAgeContent(content);
      case CLIENT_KINDS.WORKOUT:
        return {
          type: "Unknown",
          notes: content
        };
      default:
        // For other kinds, just store the raw value
        return {
          value: content,
          unit: ''
        };
    }
  }
}

// Parse raw weight text (e.g., "175 lbs", "80kg", "80")
function parseWeightContent(content: string): { value: string, unit: string, displayValue?: string, displayUnit?: string } {
  content = content.trim();

  // First check if it's a JSON string that contains both metric and imperial
  try {
    const parsed = JSON.parse(content);
    if (parsed.value) {
      return {
        value: String(parsed.value),
        unit: parsed.unit || 'kg',
        displayValue: parsed.displayValue,
        displayUnit: parsed.displayUnit
      };
    }
  } catch (e) {
    // Not JSON, continue with text parsing
  }
  
  // Match pattern like 175 lbs, 175lb, 175 pounds, etc.
  const lbsMatch = content.match(/^([\d.]+)\s*(?:lbs?|pounds?)$/i);
  const kgMatch = content.match(/^([\d.]+)\s*(?:kg|kilograms?)$/i);
  const numMatch = content.match(/^([\d.]+)$/);
  
  if (lbsMatch) {
    const lbs = parseFloat(lbsMatch[1]);
    const kg = unitConversions.weight.lbsToKg(lbs);
    return { 
      value: kg.toString(), 
      unit: 'kg',
      displayValue: lbs.toString(),
      displayUnit: 'lbs'
    };
  } else if (kgMatch) {
    // Convert to imperial for display
    const kg = parseFloat(kgMatch[1]);
    const lbs = unitConversions.weight.kgToLbs(kg);
    return { 
      value: kgMatch[1], 
      unit: 'kg',
      displayValue: Math.round(lbs).toString(),
      displayUnit: 'lbs'
    };
  } else if (numMatch) {
    // Assume kg if just a number, but provide imperial display
    const kg = parseFloat(numMatch[1]);
    const lbs = unitConversions.weight.kgToLbs(kg);
    return { 
      value: numMatch[1], 
      unit: 'kg',
      displayValue: Math.round(lbs).toString(),
      displayUnit: 'lbs'
    };
  }
  
  // Fallback
  return { value: content, unit: '' };
}

// Parse raw height text (e.g., "5'11"", "180cm", "5 ft 11 in")
function parseHeightContent(content: string): { value: string, unit: string, displayValue?: string, displayUnit?: string } {
  content = content.trim();
  
  // First check if it's a JSON string that contains both metric and imperial
  try {
    const parsed = JSON.parse(content);
    if (parsed.value) {
      return {
        value: String(parsed.value),
        unit: parsed.unit || 'cm',
        displayValue: parsed.displayValue,
        displayUnit: parsed.displayUnit
      };
    }
  } catch (e) {
    // Not JSON, continue with text parsing
  }
  
  // Match pattern like 5'11", 5ft11in, 5 feet 11 inches, etc.
  const ftInMatch = content.match(/^(\d+)[\s'"]*(?:ft|feet|')[\s'"]*(\d+)[\s'"]*(?:in|inches|")?$/i);
  
  // Match alternative format like "5-11" (5 feet 11 inches)
  const dashMatch = content.match(/^(\d+)-(\d+)$/);
  
  // Match just feet like "5ft" or "5'"
  const feetOnlyMatch = content.match(/^(\d+)[\s'"]*(?:ft|feet|')$/i);
  
  const cmMatch = content.match(/^([\d.]+)\s*(?:cm|centimeters?)$/i);
  const numMatch = content.match(/^([\d.]+)$/);
  
  if (ftInMatch) {
    const feet = parseInt(ftInMatch[1]);
    const inches = parseInt(ftInMatch[2]);
    const cm = unitConversions.height.ftInchesToCm(feet, inches);
    return { 
      value: cm.toString(), 
      unit: 'cm',
      displayValue: `${feet}'${inches}"`,
      displayUnit: 'ft-in'
    };
  } else if (dashMatch) {
    // Handle "5-11" format
    const feet = parseInt(dashMatch[1]);
    const inches = parseInt(dashMatch[2]);
    const cm = unitConversions.height.ftInchesToCm(feet, inches);
    return { 
      value: cm.toString(), 
      unit: 'cm',
      displayValue: `${feet}'${inches}"`,
      displayUnit: 'ft-in'
    };
  } else if (feetOnlyMatch) {
    // Handle "5ft" or "5'" with no inches
    const feet = parseInt(feetOnlyMatch[1]);
    const cm = unitConversions.height.ftInchesToCm(feet, 0);
    return { 
      value: cm.toString(), 
      unit: 'cm',
      displayValue: `${feet}'0"`,
      displayUnit: 'ft-in'
    };
  } else if (cmMatch) {
    // Convert to imperial for display
    const cm = parseFloat(cmMatch[1]);
    const inches = unitConversions.height.cmToInches(cm);
    const feet = Math.floor(inches / 12);
    const remainingInches = Math.round(inches % 12);
    return { 
      value: cmMatch[1], 
      unit: 'cm',
      displayValue: `${feet}'${remainingInches}"`,
      displayUnit: 'ft-in'
    };
  } else if (numMatch) {
    // Assume cm if just a number
    const cm = parseFloat(numMatch[1]);
    const inches = unitConversions.height.cmToInches(cm);
    const feet = Math.floor(inches / 12);
    const remainingInches = Math.round(inches % 12);
    return { 
      value: numMatch[1], 
      unit: 'cm',
      displayValue: `${feet}'${remainingInches}"`,
      displayUnit: 'ft-in'
    };
  }
  
  // Fallback
  return { value: content, unit: '' };
}

// Parse raw age text (e.g., "35", "35 years")
function parseAgeContent(content: string): { value: string, unit: string } {
  content = content.trim();
  
  // Match pattern like "35 years", "35yr", "35 yr", etc.
  const yearMatch = content.match(/^(\d+)\s*(?:years?|yrs?|y)$/i);
  const numMatch = content.match(/^(\d+)$/);
  
  if (yearMatch) {
    return { value: yearMatch[1], unit: 'years' };
  } else if (numMatch) {
    // Assume years if just a number
    return { value: numMatch[1], unit: 'years' };
  }
  
  // Fallback
  return { value: content, unit: 'years' };
}

// Fetch a single type of health metric
export async function fetchMetrics(pubkey: string, kind: number) {
  try {
    return new Promise((resolve) => {
      // Track if we've received an event yet
      let receivedEvent = false;
      let timeoutId: NodeJS.Timeout;
      
      // Subscribe to get the event
      const sub = pool.subscribe(
        RELAYS,
        {
          kinds: [kind],
          authors: [pubkey],
          limit: 1
        },
        {
          onevent(event) {
            receivedEvent = true;
            console.log(`Received event for kind ${kind}:`, event);
            try {
              // Try to parse as JSON first, then fall back to structured parsing
              const parsedContent = parseContent(event.content, kind);
              console.log(`Parsed content for kind ${kind}:`, parsedContent);
              
              // Special handling for height - ensure imperial display units are set
              if (kind === CLIENT_KINDS.HEIGHT && parsedContent && parsedContent.value) {
                if (!parsedContent.displayValue || !parsedContent.displayUnit) {
                  const cm = parseFloat(parsedContent.value);
                  if (!isNaN(cm)) {
                    const inches = unitConversions.height.cmToInches(cm);
                    const feet = Math.floor(inches / 12);
                    const remainingInches = Math.round(inches % 12);
                    parsedContent.displayValue = `${feet}'${remainingInches}"`;
                    parsedContent.displayUnit = 'ft-in';
                  }
                }
              }
              
              // Special handling for weight - ensure imperial display units are set
              if (kind === CLIENT_KINDS.WEIGHT && parsedContent && parsedContent.value) {
                if (!parsedContent.displayValue || !parsedContent.displayUnit) {
                  const kg = parseFloat(parsedContent.value);
                  if (!isNaN(kg)) {
                    const lbs = unitConversions.weight.kgToLbs(kg);
                    parsedContent.displayValue = Math.round(lbs).toString();
                    parsedContent.displayUnit = 'lbs';
                  }
                }
              }
              
              resolve(parsedContent);
            } catch (error) {
              console.error(`Error handling event content:`, error);
              resolve(null);
            }
          },
          oneose() {
            // End of stored events
            if (!receivedEvent) {
              console.log(`No events found for kind ${kind}`);
              resolve(null);
            }
            // Cleanup subscription after getting EOSE
            clearTimeout(timeoutId);
            sub.close();
          }
        }
      );
      
      // Set timeout to prevent hanging
      timeoutId = setTimeout(() => {
        sub.close();
        if (!receivedEvent) {
          resolve(null);
        }
      }, 5000);
    });
  } catch (error) {
    console.error(`Error fetching metrics for kind ${kind}:`, error);
    return null;
  }
}

// Fetch historical data for a specific metric kind
export async function fetchMetricHistory(pubkey: string, kind: number): Promise<MetricHistoryItem[]> {
  const events: MetricHistoryItem[] = [];
  
  try {
    return new Promise((resolve) => {
      let timeoutId: NodeJS.Timeout;
      
      // Subscribe to get events
      const sub = pool.subscribe(
        RELAYS,
        {
          kinds: [kind],
          authors: [pubkey],
          // No limit to get all historical data
        },
        {
          onevent(event) {
            console.log(`History event received for kind ${kind}:`, event);
            try {
              let metricData: MetricHistoryItem | undefined;
              
              // First try to parse as JSON
              try {
                const content = JSON.parse(event.content);
                console.log(`Parsed JSON content:`, content);
                const value = parseFloat(content.value);
                
                if (!isNaN(value)) {
                  metricData = {
                    timestamp: event.created_at,
                    value,
                    unit: content.unit,
                    displayValue: content.displayValue,
                    displayUnit: content.displayUnit
                  };
                }
              } catch (e) {
                console.log(`JSON parsing failed, trying alternative parsing for kind ${kind}`);
                // If JSON parsing fails, try to parse the content directly based on the kind
                if (kind === CLIENT_KINDS.WEIGHT) {
                  const parsed = parseWeightContent(event.content);
                  const value = parseFloat(parsed.value);
                  
                  if (!isNaN(value)) {
                    metricData = {
                      timestamp: event.created_at,
                      value,
                      unit: parsed.unit,
                      displayValue: parsed.displayValue,
                      displayUnit: parsed.displayUnit
                    };
                  }
                } else if (kind === CLIENT_KINDS.HEIGHT) {
                  const parsed = parseHeightContent(event.content);
                  const value = parseFloat(parsed.value);
                  
                  if (!isNaN(value)) {
                    metricData = {
                      timestamp: event.created_at,
                      value,
                      unit: parsed.unit,
                      displayValue: parsed.displayValue,
                      displayUnit: parsed.displayUnit
                    };
                  }
                } else if (kind === CLIENT_KINDS.AGE) {
                  const parsed = parseAgeContent(event.content);
                  const value = parseFloat(parsed.value);
                  
                  if (!isNaN(value)) {
                    metricData = {
                      timestamp: event.created_at,
                      value,
                      unit: parsed.unit
                    };
                  }
                } else {
                  // For other kinds, just try to parse the content as a number
                  const value = parseFloat(event.content);
                  if (!isNaN(value)) {
                    metricData = {
                      timestamp: event.created_at,
                      value,
                      unit: ''
                    };
                  }
                }
              }
              
              if (metricData) {
                console.log(`Adding metric data:`, metricData);
                events.push(metricData);
              } else {
                console.log(`Failed to extract metric data from event`);
              }
            } catch (error) {
              console.error(`Error processing event:`, error);
            }
          },
          oneose() {
            // End of stored events
            clearTimeout(timeoutId);
            sub.close();
            
            // Sort by timestamp in descending order
            events.sort((a, b) => b.timestamp - a.timestamp);
            resolve(events);
          }
        }
      );
      
      // Set timeout to prevent hanging
      timeoutId = setTimeout(() => {
        sub.close();
        // Sort by timestamp in descending order
        events.sort((a, b) => b.timestamp - a.timestamp);
        resolve(events);
      }, 10000); // Longer timeout for historical data
    });
  } catch (error) {
    console.error('Error fetching metric history:', error);
    return [];
  }
}

// Enhanced workout interface with more detailed fields
export interface WorkoutData {
  id?: string;               // From "d" tag
  title?: string;            // From "title" tag
  type?: string;             // From "type" tag
  timestamp: number;         // From event.created_at
  startTime?: number;        // From "start" tag
  endTime?: number;          // From "end" tag
  duration?: string;         // Calculated or from "exercise" tag
  distance?: string;         // From "exercise" tag
  pace?: string;             // From "exercise" tag
  calories?: number;         // From "exercise" tag
  elevationGain?: number;    // Total elevation gain in meters
  avgSpeed?: number;         // Average speed in km/h or mi/h
  maxSpeed?: number;         // Maximum speed reached
  cadence?: { value: number, unit: string };  // From "cadence_avg" tag
  heartRate?: { value: number, unit: string }; // From "heart_rate_avg" tag
  maxHeartRate?: { value: number, unit: string }; // Maximum heart rate
  weather?: {
    temp?: number,
    unit?: string,
    humidity?: number,
    condition?: string
  };
  splits?: Array<{
    number: number,
    distance: number,
    unit: string,
    time: string,
    heartRate?: number,
    elevation?: number;     // Elevation for this split
    pace?: string           // Pace for this specific split
  }>;
  completed?: boolean;      // From "completed" tag
  tags?: string[];          // Additional tags
  notes?: string;           // From content field
  routeData?: string;       // From "exercise" tag (encoded_polyline_string)
  source?: string;          // Source app or device
  rawEvent?: Event;         // Store the original event for debugging
}

// Helper function to find a tag value by name
function findTagValue(tags: string[][], name: string): string | undefined {
  const tag = tags.find(t => t[0] === name);
  return tag ? tag[1] : undefined;
}

// Helper function to find all tags with a given name
function findAllTags(tags: string[][], name: string): string[][] {
  return tags.filter(t => t[0] === name);
}

// Parse workout tags to extract structured data
function parseWorkoutTags(event: Event): WorkoutData {
  const tags = event.tags || [];
  console.log(`Parsing workout event:`, JSON.stringify(event, null, 2));
  console.log(`Event has ${tags.length} tags:`, tags);

  // Basic workout data
  let workout: WorkoutData = {
    timestamp: event.created_at,
    notes: event.content, // Store content as notes
    rawEvent: event       // Store the original event for debugging
  };

  // FIRST PASS: Log all tags for debugging
  console.log("=== FULL TAG INSPECTION ===");
  tags.forEach((tag, index) => {
    console.log(`Tag ${index} [${tag[0]}]: ${JSON.stringify(tag.slice(1))}`);
  });
  console.log("=========================");

  // If content contains "RUNSTR" or similar, it's likely a Runstr workout
  if (typeof event.content === 'string' && 
      (event.content.includes('RUNSTR') || 
       event.content.includes('run') || 
       event.content.includes('running'))) {
    workout.type = 'Running';
    // Set a default title based on content
    workout.title = 'Run with RUNSTR';
    
    // Try to parse any additional data from the content itself
    if (typeof event.content === 'string') {
      console.log('Attempting to parse workout data from content');
      
      // Look for distance in the content
      const distanceMatch = event.content.match(/(\d+(\.\d+)?)\s*(km|mi|kilometers|miles)/i);
      if (distanceMatch) {
        const distance = distanceMatch[1];
        const unit = distanceMatch[3].toLowerCase().includes('mi') ? 'mi' : 'km';
        workout.distance = `${distance} ${unit}`;
        console.log(`Extracted distance from content: ${workout.distance}`);
      }
      
      // Look for pace in the content
      const paceMatch = event.content.match(/pace:?\s*(\d+:?\d+)\s*(?:min\/|per\s*)(km|mi|kilometer|mile)/i);
      if (paceMatch) {
        const paceTime = paceMatch[1];
        const paceUnit = paceMatch[2].toLowerCase().includes('mi') ? 'mi' : 'km';
        workout.pace = `${paceTime}/${paceUnit}`;
        console.log(`Extracted pace from content: ${workout.pace}`);
      }
      
      // Look for duration in the content
      const durationMatch = event.content.match(/(?:time|duration):?\s*(\d+:?\d+(:\d+)?)/i);
      if (durationMatch && !workout.duration) {
        workout.duration = durationMatch[1];
        console.log(`Extracted duration from content: ${workout.duration}`);
      }
      
      // Look for calories in the content
      const caloriesMatch = event.content.match(/(\d+)\s*(?:kcal|calories|cals)/i);
      if (caloriesMatch && !workout.calories) {
        workout.calories = parseInt(caloriesMatch[1]);
        console.log(`Extracted calories from content: ${workout.calories}`);
      }
      
      // Try to parse JSON from the content (sometimes apps embed JSON in the content)
      try {
        // Look for JSON object in the content - sometimes it's enclosed in backticks, brackets, etc.
        // Using a different approach to avoid 's' flag which might not be supported
        const contentStr = event.content;
        const startBraceIdx = contentStr.indexOf('{');
        const endBraceIdx = contentStr.lastIndexOf('}');
        
        if (startBraceIdx !== -1 && endBraceIdx !== -1 && startBraceIdx < endBraceIdx) {
          const potentialJson = contentStr.substring(startBraceIdx, endBraceIdx + 1);
          try {
            const parsedData = JSON.parse(potentialJson);
            console.log('Found embedded JSON in content:', parsedData);
            
            // Extract relevant fields
            if (parsedData.distance && !workout.distance) {
              const dist = parsedData.distance;
              const unit = parsedData.distanceUnit || 'km';
              workout.distance = `${dist} ${unit}`;
              console.log(`Extracted distance from JSON: ${workout.distance}`);
            }
            
            if (parsedData.pace && !workout.pace) {
              workout.pace = parsedData.pace;
              console.log(`Extracted pace from JSON: ${workout.pace}`);
            }
            
            if (parsedData.calories && !workout.calories) {
              workout.calories = parsedData.calories;
              console.log(`Extracted calories from JSON: ${workout.calories}`);
            }
          } catch (e) {
            // Not valid JSON, ignore
          }
        }
      } catch (e) {
        // JSON parsing failed, continue with other methods
      }
    }
  }

  // Extract ID
  const id = findTagValue(tags, 'd');
  if (id) workout.id = id;

  // Extract basic info
  const title = findTagValue(tags, 'title');
  if (title) workout.title = title;

  const type = findTagValue(tags, 'type');
  if (type) workout.type = type;

  // Extract additional metrics with alternative tag names
  // Look for distance in multiple possible tags
  const distanceTag = tags.find(t => 
    t[0] === 'distance' || 
    t[0] === 'total_distance' || 
    t[0] === 'dist' || 
    t[0] === 'length'
  );
  
  if (distanceTag && distanceTag.length >= 2 && !workout.distance) {
    // Check if there's a unit included
    const distValue = distanceTag[1];
    let unit = distanceTag.length >= 3 ? distanceTag[2] : 'km';
    
    // Handle cases where the unit might be part of the value or a separate field
    if (/^[\d\.]+$/.test(distValue)) {
      // It's just a number without a unit
      workout.distance = `${distValue} ${unit}`;
    } else {
      // There might be a unit in the value string
      workout.distance = distValue;
    }
    console.log(`Found dedicated distance tag: ${workout.distance}`);
  }

  // Look for calories in multiple possible tags
  const caloriesTag = tags.find(t => 
    t[0] === 'calories' || 
    t[0] === 'kcal' || 
    t[0] === 'energy' || 
    t[0] === 'calorie'
  );
  
  if (caloriesTag && caloriesTag.length >= 2) {
    const calValue = caloriesTag[1];
    if (/^[\d\.]+$/.test(calValue)) {
      workout.calories = parseInt(calValue);
      console.log(`Found dedicated calories tag: ${workout.calories}`);
    }
  }

  // Extract time info
  const startTime = findTagValue(tags, 'start');
  if (startTime) workout.startTime = parseInt(startTime);

  const endTime = findTagValue(tags, 'end');
  if (endTime) workout.endTime = parseInt(endTime);

  // Calculate duration if start and end times exist
  if (workout.startTime && workout.endTime) {
    const durationSeconds = workout.endTime - workout.startTime;
    const minutes = Math.floor(durationSeconds / 60);
    const seconds = durationSeconds % 60;
    workout.duration = `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }

  // Extract exercise data from Runstr 
  // Format could be: ["exercise", "33401:<pubkey>:<UUID-running>", "<relay-url>", "5", "1800", "4:52", "encoded_polyline_string", "125"]
  const exerciseTag = tags.find(t => t[0] === 'exercise');
  if (exerciseTag) {
    console.log('Found exercise tag:', exerciseTag);
    
    // More robust parsing for Runstr exercise data
    if (exerciseTag.length >= 4) {
      // Check if the exercise tag contains a nested array (sometimes Runstr formats it this way)
      for (let i = 1; i < exerciseTag.length; i++) {
        // Check if this item might be a stringified array
        if (typeof exerciseTag[i] === 'string' && 
            exerciseTag[i].startsWith('[') && 
            exerciseTag[i].endsWith(']')) {
          try {
            // Try to parse it as JSON
            const nestedData = JSON.parse(exerciseTag[i]);
            if (Array.isArray(nestedData) && nestedData.length > 0) {
              console.log('Found nested exercise data array:', nestedData);
              
              // If it's an array, process it recursively for relevant elements
              for (let j = 0; j < nestedData.length; j++) {
                // Process each item in the nested array as we would a regular tag value
                const value = nestedData[j];
                
                // Check if stringified, otherwise use as is
                const strValue = typeof value === 'string' ? value : String(value);
                
                // Then apply our usual detection logic
                // Distance
                if (/^\d+(\.\d+)?\s*(km|mi|m)?$/i.test(strValue)) {
                  const match = strValue.match(/^(\d+(\.\d+)?)\s*(km|mi|m)?$/i);
                  if (match) {
                    const numValue = match[1];
                    const unit = (match[3] || 'km').toLowerCase();
                    workout.distance = `${numValue} ${unit}`;
                    console.log(`Found distance in nested data: ${workout.distance}`);
                  }
                  continue;
                }
                
                // Duration
                if (/^\d+:\d+$/.test(strValue) || /^\d+:\d+:\d+$/.test(strValue)) {
                  workout.duration = strValue;
                  console.log(`Found duration in nested data: ${workout.duration}`);
                  continue;
                } else if (/^\d+$/.test(strValue) && parseInt(strValue) > 30 && parseInt(strValue) < 86400) {
                  const durationSeconds = parseInt(strValue);
                  if (durationSeconds >= 3600) {
                    const hours = Math.floor(durationSeconds / 3600);
                    const minutes = Math.floor((durationSeconds % 3600) / 60);
                    const seconds = durationSeconds % 60;
                    workout.duration = `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
                  } else {
                    const minutes = Math.floor(durationSeconds / 60);
                    const seconds = durationSeconds % 60;
                    workout.duration = `${minutes}:${seconds.toString().padStart(2, '0')}`;
                  }
                  console.log(`Found duration in nested data: ${workout.duration}`);
                  continue;
                }
                
                // Pace
                if (/^\d+:\d+$/.test(strValue) && workout.duration && workout.duration !== strValue) {
                  workout.pace = strValue;
                  console.log(`Found pace in nested data: ${workout.pace}`);
                  continue;
                }
                
                // Calories
                if (/^\d+$/.test(strValue) && parseInt(strValue) >= 50 && parseInt(strValue) <= 5000) {
                  if (workout.duration || parseInt(strValue) <= 2000) {
                    workout.calories = parseInt(strValue);
                    console.log(`Found calories in nested data: ${workout.calories}`);
                    continue;
                  }
                }
                
                // Route data
                if (strValue && strValue.length > 20 && /^[A-Za-z0-9\-_=+\/]+$/.test(strValue)) {
                  workout.routeData = strValue;
                  console.log(`Found route data in nested data (length: ${strValue.length})`);
                  continue;
                }
              }
            }
          } catch (error) {
            // Not a valid JSON array, continue with normal processing
            console.log(`Failed to parse as nested array: ${exerciseTag[i]}`);
          }
        }
        
        // Standard processing for non-nested values
        const value = exerciseTag[i];
        
        // Check if this looks like a distance - can include units like km, mi, m
        if (/^\d+(\.\d+)?\s*(km|mi|m)?$/i.test(value)) {
          // Extract numeric part and unit part
          const match = value.match(/^(\d+(\.\d+)?)\s*(km|mi|m)?$/i);
          if (match) {
            const numValue = match[1];
            const unit = (match[3] || 'km').toLowerCase();
            workout.distance = `${numValue} ${unit}`;
            console.log(`Found distance: ${workout.distance} at index ${i}`);
          }
          continue;
        }
        
        // Check for duration in any of these formats:
        // - MM:SS format (e.g., "4:52")
        // - H:MM:SS format (e.g., "1:23:45")
        // - Seconds as integer (e.g., "1800")
        if (/^\d+:\d+$/.test(value) || /^\d+:\d+:\d+$/.test(value)) {
          // Already in MM:SS or H:MM:SS format
          workout.duration = value;
          console.log(`Found duration (time format): ${workout.duration} at index ${i}`);
          continue;
        } else if (/^\d+$/.test(value) && parseInt(value) > 30 && parseInt(value) < 86400) {
          // Probably seconds (between 30 seconds and 24 hours)
          const durationSeconds = parseInt(value);
          if (durationSeconds >= 3600) {
            // Format as H:MM:SS
            const hours = Math.floor(durationSeconds / 3600);
            const minutes = Math.floor((durationSeconds % 3600) / 60);
            const seconds = durationSeconds % 60;
            workout.duration = `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
          } else {
            // Format as MM:SS
            const minutes = Math.floor(durationSeconds / 60);
            const seconds = durationSeconds % 60;
            workout.duration = `${minutes}:${seconds.toString().padStart(2, '0')}`;
          }
          console.log(`Found duration (seconds): ${durationSeconds} -> ${workout.duration} at index ${i}`);
          continue;
        }
        
        // Check for pace (MM:SS/unit format) - comes after duration if both are in MM:SS format
        if (/^\d+:\d+$/.test(value) && workout.duration && workout.duration !== value) {
          workout.pace = value;
          console.log(`Found pace: ${workout.pace} at index ${i}`);
          continue;
        }
        
        // Check for calories (typically 50-2000 for most workouts)
        if (/^\d+$/.test(value) && parseInt(value) >= 50 && parseInt(value) <= 5000) {
          // Make sure we don't confuse this with duration in seconds
          // If we already found duration as seconds, or this value is too large to be calories,
          // then this is more likely to be calories
          if (workout.duration || parseInt(value) <= 2000) {
            workout.calories = parseInt(value);
            console.log(`Found calories: ${workout.calories} at index ${i}`);
            continue;
          }
        }
        
        // Check for route data (encoded polyline string) - usually a long string with special chars
        if (value && value.length > 20 && /^[A-Za-z0-9\-_=+\/]+$/.test(value)) {
          workout.routeData = value;
          console.log(`Found route data at index ${i} (length: ${value.length})`);
          continue;
        }
      }
    }
  }

  // Look for dedicated duration and pace tags (Runstr might use these)
  const durationTag = tags.find(t => t[0] === 'duration');
  const timeTag = tags.find(t => t[0] === 'time' || t[0] === 'moving_time' || t[0] === 'total_time');

  if (durationTag && durationTag.length >= 2 && !workout.duration) {
    let durationValue = durationTag[1];
    
    // Check if duration is in seconds (number only)
    if (/^\d+$/.test(durationValue)) {
      const seconds = parseInt(durationValue);
      if (seconds >= 3600) {
        // Format as H:MM:SS
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const remainingSeconds = seconds % 60;
        workout.duration = `${hours}:${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
      } else {
        // Format as MM:SS
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        workout.duration = `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
      }
    } else {
      // Otherwise use as is (assuming it's already in a time format)
      workout.duration = durationValue;
    }
    console.log(`Found dedicated duration tag: ${workout.duration}`);
  } else if (timeTag && timeTag.length >= 2 && !workout.duration) {
    // Also check for time, moving_time, or total_time tags
    let timeValue = timeTag[1];
    
    // Check if time is in seconds (number only)
    if (/^\d+$/.test(timeValue)) {
      const seconds = parseInt(timeValue);
      if (seconds >= 3600) {
        // Format as H:MM:SS
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const remainingSeconds = seconds % 60;
        workout.duration = `${hours}:${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
      } else {
        // Format as MM:SS
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        workout.duration = `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
      }
    } else {
      // Otherwise use as is (assuming it's already in a time format)
      workout.duration = timeValue;
    }
    console.log(`Found time tag for duration: ${workout.duration}`);
  }

  // Look for dedicated pace tag
  const paceTag = tags.find(t => t[0] === 'pace' || t[0] === 'pace_avg' || t[0] === 'average_pace');
  const speedTag = tags.find(t => t[0] === 'speed_avg' || t[0] === 'average_speed');
  const distanceTypeTag = tags.find(t => t[0] === 'distance_type' || t[0] === 'distance_unit');

  // Determine if this is a mile-based workout
  let isMilesBased = false;
  if (distanceTypeTag && distanceTypeTag.length >= 2) {
    isMilesBased = distanceTypeTag[1].toLowerCase().includes('mi');
  } else if (workout.distance) {
    // Try to infer from distance string
    isMilesBased = workout.distance.toLowerCase().includes('mi');
  }

  // Default unit based on determination
  const defaultUnit = isMilesBased ? 'mi' : 'km';
  console.log(`Determined distance unit: ${defaultUnit} (miles-based: ${isMilesBased})`);

  if (paceTag && paceTag.length >= 2 && !workout.pace) {
    // Check if there's an associated unit
    const unit = paceTag.length >= 3 ? paceTag[2] : defaultUnit;
    
    // If pace is in seconds per unit (number only), convert to MM:SS format
    if (/^\d+(\.\d+)?$/.test(paceTag[1])) {
      const paceSeconds = parseFloat(paceTag[1]);
      const minutes = Math.floor(paceSeconds / 60);
      const seconds = Math.round(paceSeconds % 60);
      workout.pace = `${minutes}:${seconds.toString().padStart(2, '0')}/${unit}`;
    } else {
      // Format is already OK, just ensure proper unit
      if (paceTag[1].includes('/')) {
        workout.pace = paceTag[1];
      } else {
        workout.pace = `${paceTag[1]}/${unit}`;
      }
    }
    console.log(`Found dedicated pace tag: ${workout.pace}`);
  } 
  // If we have speed but no pace, calculate pace from speed
  else if (speedTag && speedTag.length >= 2 && !workout.pace) {
    try {
      // Convert speed to pace
      const speed = parseFloat(speedTag[1]);
      const speedUnit = speedTag.length >= 3 ? speedTag[2] : (isMilesBased ? 'mph' : 'km/h');
      
      if (speed > 0) {
        // Calculate seconds per kilometer (or mile)
        const secondsPerUnit = 3600 / speed;
        const paceMinutes = Math.floor(secondsPerUnit / 60);
        const paceSeconds = Math.round(secondsPerUnit % 60);
        
        // Create pace string with appropriate unit
        const paceUnit = speedUnit.includes('mi') || speedUnit.includes('mph') ? 'mi' : 'km';
        
        workout.pace = `${paceMinutes}:${paceSeconds.toString().padStart(2, '0')}/${paceUnit}`;
        console.log(`Calculated pace from speed: ${workout.pace}`);
      }
    } catch (error) {
      console.error('Error calculating pace from speed:', error);
    }
  }

  // If we have distance and duration but no pace, try to calculate it
  if (workout.distance && workout.duration && !workout.pace) {
    try {
      // Try to extract numeric distance value and unit
      const distanceMatch = workout.distance.match(/^(\d+(\.\d+)?)\s*([a-zA-Z]+)?/);
      if (distanceMatch) {
        const distance = parseFloat(distanceMatch[1]);
        // Check explicit unit in the distance
        let unit = 'km'; // Default
        if (distanceMatch[3]) {
          unit = distanceMatch[3].toLowerCase().includes('mi') ? 'mi' : 'km';
        } else {
          // No explicit unit, use our determination from earlier
          unit = defaultUnit;
        }
        
        // Parse duration into seconds
        let durationSeconds = 0;
        if (workout.duration.includes(':')) {
          const parts = workout.duration.split(':').map(Number);
          if (parts.length === 2) {
            // MM:SS format
            durationSeconds = parts[0] * 60 + parts[1];
          } else if (parts.length === 3) {
            // H:MM:SS format
            durationSeconds = parts[0] * 3600 + parts[1] * 60 + parts[2];
          }
        } else if (/^\d+$/.test(workout.duration)) {
          // Raw seconds
          durationSeconds = parseInt(workout.duration);
        }
        
        if (durationSeconds > 0 && distance > 0) {
          // Calculate pace in seconds per km or mi
          const paceSeconds = durationSeconds / distance;
          const paceMinutes = Math.floor(paceSeconds / 60);
          const paceRemainingSeconds = Math.round(paceSeconds % 60);
          
          workout.pace = `${paceMinutes}:${paceRemainingSeconds.toString().padStart(2, '0')}/${unit}`;
          console.log(`Calculated pace from distance (${distance} ${unit}) and duration (${durationSeconds}s): ${workout.pace}`);
        }
      }
    } catch (error) {
      console.error('Error calculating pace:', error);
    }
  }

  // Final pass: attempt to estimate distance from duration if it's missing
  if (!workout.distance && workout.duration && workout.duration !== 'N/A') {
    console.log('Attempting to estimate distance from duration');
    
    // Extract duration in seconds
    let durationSeconds = 0;
    if (workout.duration.includes(':')) {
      const parts = workout.duration.split(':').map(Number);
      if (parts.length === 2) {
        // MM:SS format
        durationSeconds = parts[0] * 60 + parts[1];
      } else if (parts.length === 3) {
        // H:MM:SS format
        durationSeconds = parts[0] * 3600 + parts[1] * 60 + parts[2];
      }
    }
    
    if (durationSeconds > 0) {
      // Rough estimation based on average running pace (12:00 min/mile or 7:30 min/km)
      // This is just a fallback estimation for display purposes
      // Convert duration to minutes
      const durationMinutes = durationSeconds / 60;
      
      // Using a default pace of 7:30 min/km (450 seconds per km)
      const estimatedDistance = durationMinutes / 7.5;
      if (estimatedDistance > 0.1) { // Only show if it's at least 100m
        workout.distance = `~${estimatedDistance.toFixed(1)} km (est.)`;
        console.log(`Estimated distance: ${workout.distance}`);
        
        // Set an estimated pace too
        workout.pace = `7:30/km (est.)`;
      }
    }
  }
  
  // Estimate calories if missing
  if (!workout.calories && workout.duration && workout.duration !== 'N/A') {
    // Extract duration in minutes
    let durationMinutes = 0;
    if (workout.duration.includes(':')) {
      const parts = workout.duration.split(':').map(Number);
      if (parts.length === 2) {
        // MM:SS format
        durationMinutes = parts[0] + (parts[1] / 60);
      } else if (parts.length === 3) {
        // H:MM:SS format
        durationMinutes = (parts[0] * 60) + parts[1] + (parts[2] / 60);
      }
    }
    
    if (durationMinutes > 0) {
      // Rough estimation based on average calorie burn for running (10 calories per minute)
      const estimatedCalories = Math.round(durationMinutes * 10);
      workout.calories = estimatedCalories;
      console.log(`Estimated calories: ${workout.calories} (est.)`);
    }
  }

  // Extract heart rate
  const heartRateTag = tags.find(t => t[0] === 'heart_rate_avg');
  if (heartRateTag && heartRateTag.length >= 3) {
    workout.heartRate = {
      value: parseInt(heartRateTag[1]),
      unit: heartRateTag[2] || 'bpm'
    };
  }

  // Extract max heart rate
  const maxHeartRateTag = tags.find(t => t[0] === 'heart_rate_max');
  if (maxHeartRateTag && maxHeartRateTag.length >= 3) {
    workout.maxHeartRate = {
      value: parseInt(maxHeartRateTag[1]),
      unit: maxHeartRateTag[2] || 'bpm'
    };
  }

  // Extract cadence
  const cadenceTag = tags.find(t => t[0] === 'cadence_avg');
  if (cadenceTag && cadenceTag.length >= 3) {
    workout.cadence = {
      value: parseInt(cadenceTag[1]),
      unit: cadenceTag[2] || 'spm'
    };
  }

  // Extract elevation gain
  const elevationTag = tags.find(t => t[0] === 'elevation_gain');
  if (elevationTag && elevationTag.length >= 2) {
    workout.elevationGain = parseInt(elevationTag[1]);
  }

  // Extract speed metrics
  const avgSpeedTag = tags.find(t => t[0] === 'speed_avg');
  if (avgSpeedTag && avgSpeedTag.length >= 2) {
    workout.avgSpeed = parseFloat(avgSpeedTag[1]);
  }

  const maxSpeedTag = tags.find(t => t[0] === 'speed_max');
  if (maxSpeedTag && maxSpeedTag.length >= 2) {
    workout.maxSpeed = parseFloat(maxSpeedTag[1]);
  }

  // Extract source/app information
  const sourceTag = tags.find(t => t[0] === 'source' || t[0] === 'app');
  if (sourceTag && sourceTag.length >= 2) {
    workout.source = sourceTag[1];
  } else if (typeof event.content === 'string' && event.content.includes('RUNSTR')) {
    workout.source = 'RUNSTR';
  }

  // Extract weather info
  const weatherTempTag = tags.find(t => t[0] === 'weather_temp');
  const weatherHumidityTag = tags.find(t => t[0] === 'weather_humidity');
  const weatherConditionTag = tags.find(t => t[0] === 'weather_condition');
  
  if (weatherTempTag || weatherHumidityTag || weatherConditionTag) {
    workout.weather = {};
    
    if (weatherTempTag && weatherTempTag.length >= 3) {
      workout.weather.temp = parseInt(weatherTempTag[1]);
      workout.weather.unit = weatherTempTag[2] || 'c';
    }
    
    if (weatherHumidityTag && weatherHumidityTag.length >= 2) {
      workout.weather.humidity = parseInt(weatherHumidityTag[1]);
    }
    
    if (weatherConditionTag && weatherConditionTag.length >= 2) {
      workout.weather.condition = weatherConditionTag[1];
    }
  }

  // Extract splits
  const splitTags = findAllTags(tags, 'split');
  if (splitTags.length > 0) {
    // Define interface for split types to match WorkoutData
    type SplitData = {
      number: number;
      distance: number;
      unit: string;
      time: string;
      heartRate?: number;
      elevation?: number;
      pace?: string;
    };

    workout.splits = splitTags.map(splitTag => {
      // Format: ["split", "1", "1000", "m", "3:45", "155", "bpm"]
      // or expanded: ["split", "<number>", "<distance>", "<unit>", "<time>", "<heart_rate>", "<hr_unit>", "<pace>", "<pace_unit>"]
      const splitObj: SplitData = {
        number: parseInt(splitTag[1]),
        distance: parseFloat(splitTag[2]),
        unit: splitTag[3],
        time: splitTag[4],
        heartRate: splitTag[5] ? parseInt(splitTag[5]) : undefined
      };
      
      // Check if there's an elevation value (could be at different positions)
      // Look for a value with "m" unit that's not the main distance
      for (let i = 6; i < splitTag.length; i++) {
        if (splitTag[i] === 'm' && i > 0 && /^\d+(\.\d+)?$/.test(splitTag[i-1])) {
          splitObj.elevation = parseFloat(splitTag[i-1]);
          break;
        }
      }
      
      // Check for pace value which is usually after the time
      // It's often in MM:SS format like the time but comes later in the array
      for (let i = 5; i < splitTag.length; i++) {
        if (/^\d+:\d{2}$/.test(splitTag[i]) && splitTag[i] !== splitObj.time) {
          splitObj.pace = splitTag[i];
          
          // Get the pace unit if available
          if (i + 1 < splitTag.length && 
              (splitTag[i+1] === 'km' || splitTag[i+1] === 'mi' || 
               splitTag[i+1].includes('/km') || splitTag[i+1].includes('/mi'))) {
            // Combine pace with unit
            splitObj.pace = splitTag[i+1].includes('/') ? 
              `${splitObj.pace}${splitTag[i+1]}` : 
              `${splitObj.pace}/${splitTag[i+1]}`;
          }
          break;
        }
      }
      
      return splitObj;
    });
    
    // If we have split paces but no overall pace, use the average
    if (!workout.pace && workout.splits.some(s => s.pace)) {
      const paceSplits = workout.splits.filter(s => s.pace);
      if (paceSplits.length > 0) {
        // Use the most common unit from splits
        const paceWithUnit = paceSplits.find(s => s.pace && s.pace.includes('/'));
        let unit = defaultUnit;
        if (paceWithUnit && paceWithUnit.pace) {
          const unitMatch = paceWithUnit.pace.match(/\/([a-zA-Z]+)/);
          if (unitMatch) unit = unitMatch[1];
        }
        
        // Calculate the average pace (first convert all to seconds)
        let totalSeconds = 0;
        let count = 0;
        
        for (const split of paceSplits) {
          if (split.pace) {
            const paceTime = split.pace.split('/')[0];
            if (/^\d+:\d{2}$/.test(paceTime)) {
              const [minutes, seconds] = paceTime.split(':').map(Number);
              totalSeconds += minutes * 60 + seconds;
              count++;
            }
          }
        }
        
        if (count > 0) {
          const avgSeconds = totalSeconds / count;
          const minutes = Math.floor(avgSeconds / 60);
          const seconds = Math.round(avgSeconds % 60);
          workout.pace = `${minutes}:${seconds.toString().padStart(2, '0')}/${unit}`;
          console.log(`Calculated average pace from splits: ${workout.pace}`);
        }
      }
    }
  }

  // Extract completed status
  const completedTag = findTagValue(tags, 'completed');
  if (completedTag) workout.completed = completedTag.toLowerCase() === 'true';

  // Extract tags (like "running")
  const tTags = findAllTags(tags, 't');
  if (tTags.length > 0) {
    workout.tags = tTags.map(tag => tag[1]);
  }

  // If no specific exercise data was found but we have a "Completed a run" note
  // Set some default values
  if (typeof event.content === 'string' && 
      event.content.includes('Completed a run') && 
      !workout.duration) {
    workout.type = 'Running';
    workout.title = 'Run with RUNSTR';
    workout.duration = 'N/A';  // We don't know the duration
    workout.distance = 'N/A';  // We don't know the distance
  }

  console.log('Final parsed workout data:', workout);
  return workout;
}

// Fetch multiple workout records
export async function fetchWorkouts(pubkey: string, limit = 10): Promise<WorkoutData[]> {
  try {
    return new Promise((resolve) => {
      const workouts: WorkoutData[] = [];
      let timeoutId: NodeJS.Timeout;
      
      // Subscribe to get events
      const sub = pool.subscribe(
        RELAYS,
        {
          kinds: [CLIENT_KINDS.WORKOUT],
          authors: [pubkey],
          limit: limit
        },
        {
          onevent(event) {
            console.log('Received workout event:', event);
            try {
              // Parse the event including tags to extract all workout data
              const workout = parseWorkoutTags(event);
              workouts.push(workout);
            } catch (error) {
              console.error(`Error handling workout content:`, error);
            }
          },
          oneose() {
            // Cleanup subscription after getting EOSE
            clearTimeout(timeoutId);
            sub.close();
            
            // Sort by timestamp in descending order (newest first)
            workouts.sort((a, b) => b.timestamp - a.timestamp);
            resolve(workouts);
          }
        }
      );
      
      // Set timeout to prevent hanging
      timeoutId = setTimeout(() => {
        sub.close();
        // Sort by timestamp in descending order
        workouts.sort((a, b) => b.timestamp - a.timestamp);
        resolve(workouts);
      }, 5000);
    });
  } catch (error) {
    console.error(`Error fetching workout records:`, error);
    return [];
  }
}

// Aggregate all health metrics for a user
export async function fetchHealthProfile(pubkey: string) {
  const metrics = {
    weight: await fetchMetrics(pubkey, CLIENT_KINDS.WEIGHT),
    height: await fetchMetrics(pubkey, CLIENT_KINDS.HEIGHT),
    age: await fetchMetrics(pubkey, CLIENT_KINDS.AGE),
    gender: await fetchMetrics(pubkey, CLIENT_KINDS.GENDER),
    fitnessLevel: await fetchMetrics(pubkey, CLIENT_KINDS.FITNESS_LEVEL)
  };

  return metrics;
}

// Fetch all historical health data
export async function fetchHealthHistory(pubkey: string) {
  const history = {
    weight: await fetchMetricHistory(pubkey, CLIENT_KINDS.WEIGHT),
    height: await fetchMetricHistory(pubkey, CLIENT_KINDS.HEIGHT),
    age: await fetchMetricHistory(pubkey, CLIENT_KINDS.AGE)
  };

  return history;
}

// Publish a health metric to relays
export async function publishMetric(kind: number, content: any) {
  if (!window.nostr) {
    throw new Error('Nostr extension not found');
  }
  
  console.log(`Publishing metric for kind ${kind}:`, content);
  
  // Format check - if content is not already an object, convert it
  if (typeof content !== 'object' || content === null) {
    console.log('Converting content to object format');
    content = {
      value: content,
      unit: kind === CLIENT_KINDS.AGE ? 'years' : (kind === CLIENT_KINDS.WEIGHT ? 'kg' : (kind === CLIENT_KINDS.HEIGHT ? 'cm' : '')),
      timestamp: Math.floor(Date.now() / 1000)
    };
  }
  
  // Ensure value is a string (NIP-101h compatibility)
  if (content.value !== undefined && typeof content.value !== 'string') {
    content.value = String(content.value);
  }
  
  // Add imperial units for better display in other clients
  if (kind === CLIENT_KINDS.WEIGHT && content.unit === 'kg' && !content.displayValue) {
    const kg = parseFloat(content.value);
    if (!isNaN(kg)) {
      const lbs = unitConversions.weight.kgToLbs(kg);
      content.displayValue = Math.round(lbs).toString();
      content.displayUnit = 'lbs';
    }
  }
  
  if (kind === CLIENT_KINDS.HEIGHT && content.unit === 'cm' && !content.displayValue) {
    const cm = parseFloat(content.value);
    if (!isNaN(cm)) {
      const inches = unitConversions.height.cmToInches(cm);
      const feet = Math.floor(inches / 12);
      const remainingInches = Math.round(inches % 12);
      content.displayValue = `${feet}'${remainingInches}"`;
      content.displayUnit = 'ft-in';
    }
  }
  
  const pubkey = await window.nostr.getPublicKey();
  
  const event: Event = {
    kind,
    pubkey,
    created_at: Math.floor(Date.now() / 1000),
    tags: [],
    content: JSON.stringify(content),
    id: '', // This will be set by signEvent
    sig: '' // This will be set by signEvent
  };
  
  console.log(`Sending formatted event to relays:`, event);
  
  const signedEvent = await window.nostr.signEvent(event);
  
  // Publish to relays
  const pubs = pool.publish(RELAYS, signedEvent);
  
  return Promise.all(pubs);
}

// Fetch user profile metadata (kind 0)
export async function fetchProfileMetadata(pubkey: string): Promise<ProfileMetadata | null> {
  try {
    return new Promise((resolve) => {
      let receivedEvent = false;
      let timeoutId: NodeJS.Timeout;
      
      // Subscribe to get the event
      const sub = pool.subscribe(
        RELAYS,
        {
          kinds: [CLIENT_KINDS.METADATA],
          authors: [pubkey],
          limit: 1
        },
        {
          onevent(event) {
            receivedEvent = true;
            try {
              // Metadata events (kind 0) contain JSON
              const metadata = JSON.parse(event.content);
              resolve(metadata);
            } catch (error) {
              console.error('Error parsing profile metadata:', error);
              resolve(null);
            }
          },
          oneose() {
            // End of stored events
            if (!receivedEvent) {
              resolve(null);
            }
            // Cleanup subscription after getting EOSE
            clearTimeout(timeoutId);
            sub.close();
          }
        }
      );
      
      // Set timeout to prevent hanging
      timeoutId = setTimeout(() => {
        sub.close();
        if (!receivedEvent) {
          resolve(null);
        }
      }, 5000);
    });
  } catch (error) {
    console.error('Error fetching profile metadata:', error);
    return null;
  }
}