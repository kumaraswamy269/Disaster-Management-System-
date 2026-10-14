export type DisasterCategory = 
  | 'Flood' 
  | 'Cyclone' 
  | 'Wildfire' 
  | 'Drought' 
  | 'Landslide' 
  | 'Severe Storm' 
  | 'Heatwave';

export type SeverityLevel = 'Low' | 'Moderate' | 'High' | 'Extreme';

export type AlertStatus = 'Active' | 'Acknowledged' | 'Resolved';

export interface AlertItem {
  id: string;
  category: DisasterCategory;
  title: string;
  description: string;
  location: string;
  coordinates: [number, number];
  severity: SeverityLevel;
  status: AlertStatus;
  issuedAt: string;
  expiresAt: string;
  source: string;
  isSimulated: boolean;
  recommendedActions: string[];
}

export interface ShelterItem {
  id: string;
  name: string;
  address: string;
  coordinates: [number, number];
  contact: string;
  capacity: number;
  occupancy: number;
  status: 'Open' | 'Full' | 'Standby';
  facilities: string[];
  accessibility: boolean;
  source: string;
  lastVerified: string;
}

export interface EvacuationPlanItem {
  id: string;
  name: string;
  origin: string;
  originCoordinates: [number, number];
  destinationShelterId: string;
  destinationName: string;
  destinationCoordinates: [number, number];
  evacuationMode: 'Vehicle' | 'Walking' | 'Emergency Transit';
  distanceKm: number;
  estimatedTimeMin: number;
  notes: string;
  createdAt: string;
}

export interface WeatherAirQuality {
  aqi: number;
  usAqi?: number;
  category: 'Good' | 'Fair' | 'Moderate' | 'Poor' | 'Very Poor' | 'Hazardous';
  pm25: number;
  pm10: number;
  co?: number;
  no2?: number;
  so2?: number;
  ozone?: number;
}

export interface LiveWeatherServerStatus {
  connected: boolean;
  latencyMs: number;
  serverTimestamp: string;
  protocol: string;
  streamActive: boolean;
  activeStreams?: number;
  serverUptime?: number;
}

export interface LiveWeatherStreamTick {
  type: string;
  packetId?: number;
  timestamp: string;
  lat: number;
  lon: number;
  serverStatus: string;
  pingMs?: number;
  microVariance?: {
    windJitter: number;
    tempJitter: number;
    pressJitter: number;
  };
  health?: string;
  message?: string;
}

export interface WeatherData {
  temperature: number;
  apparentTemperature: number;
  dewPoint?: number;
  humidity: number;
  windSpeed: number;
  windDirection: number;
  windGusts?: number;
  precipitation: number;
  surfacePressure: number;
  pressureTrend?: 'Rising' | 'Falling' | 'Steady';
  weatherCode: number;
  cloudCover?: number;
  visibilityKm?: number;
  uvIndex?: number;
  isDay?: boolean;
  airQuality?: WeatherAirQuality;
  serverStatus?: LiveWeatherServerStatus;
  hourly?: {
    time: string[];
    temperature: number[];
    precipitation: number[];
    windSpeed: number[];
    soilMoisture?: number[];
    precipitationProbability?: number[];
    humidity?: number[];
    cloudCover?: number[];
    uvIndex?: number[];
  };
  daily?: {
    time: string[];
    weatherCode: number[];
    tempMax: number[];
    tempMin: number[];
    precipitationSum: number[];
    windMax: number[];
    windGustsMax?: number[];
    precipitationProbabilityMax?: number[];
    sunrise?: string[];
    sunset?: string[];
    uvIndexMax?: number[];
  };
  dataSource: string;
  retrievedAt: string;
}

export interface RiskFactor {
  name: string;
  impact: string;
  weight: number;
  value: any;
}

export interface RiskAssessmentResult {
  disasterType: DisasterCategory;
  location: string;
  riskLevel: SeverityLevel;
  riskScore: number;
  contributingFactors: RiskFactor[];
  recommendedActions: string[];
  aiExplanation: string;
  assessmentMethod: string;
  assessedAt: string;
  scientificLimitations: string;
}

export interface MLEvaluationResult {
  hazard: string;
  algorithm: string;
  totalRecords: number;
  trainCount: number;
  testCount: number;
  splitRatio: string;
  metrics: {
    accuracy: number;
    precision: number;
    recall: number;
    f1Score: number;
    rocAuc: number;
  };
  confusionMatrix: {
    truePositive: number;
    falsePositive: number;
    trueNegative: number;
    falseNegative: number;
  };
  baselineComparison: {
    baselineModel: string;
    baselineAccuracy: number;
    modelImprovementPercent: number;
  };
  featureImportance: { feature: string; importance: number }[];
  trainedAt: string;
}

export type UserRole = 'Administrator' | 'Disaster Manager' | 'General User';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  department: string;
  clearanceLevel: string;
  badgeId: string;
  dutyStation: string;
  avatarBg?: string;
  isActive: boolean;
  registeredAt?: string;
  lastLoginAt?: string;
}

export interface AuthSession {
  token: string;
  user: AuthUser;
  createdAt: string;
  expiresAt: string;
  ipAddress?: string;
  userAgent?: string;
  serverTimestamp?: string;
}

export interface UserProfile {
  name: string;
  email: string;
  role: UserRole;
  location: string;
  organization: string;
}

export interface AuditLogItem {
  id: string;
  timestamp: string;
  action: string;
  user: string;
  details: string;
}

export interface RealWorldDisasterItem {
  id: string;
  type: 'Earthquake' | 'Severe Weather' | 'Tsunami Warning' | 'Volcano' | 'Wildfire' | 'Cyclone';
  title: string;
  magnitude?: number;
  location: string;
  coordinates: [number, number]; // [lat, lng]
  depthKm?: number;
  time: string;
  severity: SeverityLevel;
  url: string;
  tsunami: boolean;
  alertLevel?: string; // green, yellow, orange, red
  source: string;
  radiusKm?: number;
  significance?: number;
}

export type DistressUrgency = 'Critical (Life at Risk)' | 'Urgent' | 'Moderate';
export type DistressStatus = 'Pending Rescue' | 'Team Dispatched' | 'Resolved / Rescued';

export interface DistressBeaconItem {
  id: string;
  senderName: string;
  contact: string;
  locationName: string;
  coordinates: [number, number];
  emergencyType: 'Trapped by Water' | 'Medical Urgent' | 'Structure Collapse' | 'Elderly/Infant Evac' | 'Food/Water Cutoff';
  peopleCount: number;
  urgency: DistressUrgency;
  status: DistressStatus;
  notes: string;
  timestamp: string;
}

export interface ScenarioSimulationResult {
  hazard: string;
  location: string;
  coordinates: [number, number];
  intensityMetric: string;
  impactRadiusKm: number;
  estimatedAffectedPop: number;
  vulnerableStructuresEst: number;
  shelterDeficitEst: number;
  recommendedEvacPerimeterKm: number;
  actionPlan: string[];
  simulatedAt: string;
}

export type MapBaseLayer = 'satellite' | 'dark' | 'streets' | 'topo';

export type SensorType = 
  | 'River Level Gauge'
  | 'Seismic Accelerometer'
  | 'Thermal Wildfire Optical'
  | 'Coastal Tide Buoy'
  | 'Rainfall Radar Gauge'
  | 'Slope Inclinometer'
  | 'Volcanic Infrasound'
  | 'Borehole Strainmeter';

export type SensorStatus = 'Normal' | 'Warning' | 'Critical' | 'Offline';

export interface SensorReadingHistory {
  timestamp: string;
  value: number;
}

export interface SensorItem {
  id: string;
  name: string;
  type: SensorType;
  hazard: DisasterCategory;
  location: string;
  coordinates: [number, number];
  currentValue: number;
  unit: string;
  warningThreshold: number;
  criticalThreshold: number;
  status: SensorStatus;
  batteryLevel: number; // 0-100%
  signalQuality: 'Excellent' | 'Good' | 'Weak' | 'Cellular 5G' | 'LoRaWAN' | 'Satellite Iridium';
  latencyMs: number;
  lastUpdated: string;
  rateOfChange?: number;
  rateOfChangeUnit?: string;
  anomalyScore?: number; // 0-100
  history: SensorReadingHistory[];
}


