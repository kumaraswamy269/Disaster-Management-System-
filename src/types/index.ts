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

export interface WeatherData {
  temperature: number;
  apparentTemperature: number;
  humidity: number;
  windSpeed: number;
  windDirection: number;
  precipitation: number;
  surfacePressure: number;
  weatherCode: number;
  hourly?: {
    time: string[];
    temperature: number[];
    precipitation: number[];
    windSpeed: number[];
    soilMoisture?: number[];
  };
  daily?: {
    time: string[];
    weatherCode: number[];
    tempMax: number[];
    tempMin: number[];
    precipitationSum: number[];
    windMax: number[];
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
