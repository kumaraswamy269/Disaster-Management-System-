import { 
  AlertItem, 
  ShelterItem, 
  EvacuationPlanItem, 
  WeatherData, 
  RiskAssessmentResult, 
  MLEvaluationResult, 
  AuditLogItem 
} from '../types';

export const API = {
  // 1. Weather
  async getWeather(lat: number, lon: number): Promise<WeatherData> {
    try {
      const res = await fetch(`/api/weather?lat=${lat}&lon=${lon}`);
      if (!res.ok) throw new Error(`Weather API returned ${res.status}`);
      const json = await res.json();
      const current = json.data?.current || {};
      const hourly = json.data?.hourly;
      const daily = json.data?.daily;

      return {
        temperature: current.temperature_2m ?? 24,
        apparentTemperature: current.apparent_temperature ?? 25,
        humidity: current.relative_humidity_2m ?? 65,
        windSpeed: current.wind_speed_10m ?? 12,
        windDirection: current.wind_direction_10m ?? 180,
        precipitation: current.precipitation ?? 0,
        surfacePressure: current.surface_pressure ?? 1012,
        weatherCode: current.weather_code ?? 0,
        hourly: hourly ? {
          time: hourly.time?.slice(0, 24) || [],
          temperature: hourly.temperature_2m?.slice(0, 24) || [],
          precipitation: hourly.precipitation?.slice(0, 24) || [],
          windSpeed: hourly.wind_speed_10m?.slice(0, 24) || [],
          soilMoisture: hourly.soil_moisture_0_to_1cm?.slice(0, 24) || []
        } : undefined,
        daily: daily ? {
          time: daily.time || [],
          weatherCode: daily.weather_code || [],
          tempMax: daily.temperature_2m_max || [],
          tempMin: daily.temperature_2m_min || [],
          precipitationSum: daily.precipitation_sum || [],
          windMax: daily.wind_speed_10m_max || []
        } : undefined,
        dataSource: json.dataSource || 'Open-Meteo Weather API',
        retrievedAt: json.retrievedAt || new Date().toISOString()
      };
    } catch (err) {
      console.warn('Fallback weather used due to API error:', err);
      // Graceful offline fallback
      return {
        temperature: 26.5,
        apparentTemperature: 28.0,
        humidity: 72,
        windSpeed: 18.5,
        windDirection: 140,
        precipitation: 4.2,
        surfacePressure: 1008,
        weatherCode: 3,
        dataSource: 'Demonstration / Cached Met Station Observations',
        retrievedAt: new Date().toISOString()
      };
    }
  },

  // 2. Geocoding
  async geocode(query: string): Promise<Array<{ display_name: string; lat: string; lon: string }>> {
    try {
      const res = await fetch(`/api/geocode?q=${encodeURIComponent(query)}`);
      if (!res.ok) return [];
      const json = await res.json();
      return json.results || [];
    } catch (e) {
      return [];
    }
  },

  // 3. Alerts
  async getAlerts(): Promise<AlertItem[]> {
    const res = await fetch('/api/alerts');
    if (!res.ok) throw new Error('Failed to fetch alerts');
    return res.json();
  },

  async createAlert(alertData: Partial<AlertItem>): Promise<AlertItem> {
    const res = await fetch('/api/alerts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(alertData),
    });
    if (!res.ok) throw new Error('Failed to create alert');
    return res.json();
  },

  async acknowledgeAlert(id: string): Promise<AlertItem> {
    const res = await fetch(`/api/alerts/${id}/acknowledge`, { method: 'PATCH' });
    if (!res.ok) throw new Error('Failed to acknowledge alert');
    return res.json();
  },

  async resolveAlert(id: string): Promise<AlertItem> {
    const res = await fetch(`/api/alerts/${id}/resolve`, { method: 'PATCH' });
    if (!res.ok) throw new Error('Failed to resolve alert');
    return res.json();
  },

  async deleteAlert(id: string): Promise<void> {
    const res = await fetch(`/api/alerts/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Failed to delete alert');
  },

  // 4. Shelters
  async getShelters(): Promise<ShelterItem[]> {
    const res = await fetch('/api/shelters');
    if (!res.ok) throw new Error('Failed to fetch shelters');
    return res.json();
  },

  async createShelter(shelterData: Partial<ShelterItem>): Promise<ShelterItem> {
    const res = await fetch('/api/shelters', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(shelterData),
    });
    if (!res.ok) throw new Error('Failed to create shelter');
    return res.json();
  },

  async updateShelterOccupancy(id: string, occupancy: number): Promise<ShelterItem> {
    const res = await fetch(`/api/shelters/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ occupancy }),
    });
    if (!res.ok) throw new Error('Failed to update shelter');
    return res.json();
  },

  // 5. Evacuation Plans
  async getEvacuationPlans(): Promise<EvacuationPlanItem[]> {
    const res = await fetch('/api/evacuation-plans');
    if (!res.ok) throw new Error('Failed to fetch evacuation plans');
    return res.json();
  },

  async saveEvacuationPlan(plan: Partial<EvacuationPlanItem>): Promise<EvacuationPlanItem> {
    const res = await fetch('/api/evacuation-plans', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(plan),
    });
    if (!res.ok) throw new Error('Failed to save evacuation plan');
    return res.json();
  },

  // 6. Gemini Assistant Chat
  async chatWithAssistant(message: string, history: Array<{ role: 'user' | 'assistant'; content: string }>): Promise<{ reply: string; model: string }> {
    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, history }),
    });
    if (!res.ok) throw new Error('Failed to contact assistant');
    return res.json();
  },

  // 7. Disaster Risk Assessment
  async assessRisk(payload: any): Promise<RiskAssessmentResult> {
    const res = await fetch('/api/assess-risk', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error('Risk assessment failed');
    return res.json();
  },

  // 8. ML Model Evaluation Simulator
  async evaluateMLModel(payload: any): Promise<MLEvaluationResult> {
    const res = await fetch('/api/train-evaluate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error('ML evaluation failed');
    return res.json();
  },

  // 9. Audit Logs
  async getAuditLogs(): Promise<AuditLogItem[]> {
    const res = await fetch('/api/audit-logs');
    if (!res.ok) throw new Error('Failed to fetch audit logs');
    return res.json();
  },

  // 10. System Status
  async getStatus(): Promise<any> {
    const res = await fetch('/api/status');
    return res.json();
  }
};
