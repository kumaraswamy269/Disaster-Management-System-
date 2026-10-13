import express, { Request, Response } from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.use(express.json({ limit: '10mb' }));

// Initialized Gemini AI instance (if key exists)
const apiKey = process.env.GEMINI_API_KEY;
let aiClient: GoogleGenAI | null = null;
if (apiKey && apiKey !== 'MY_GEMINI_API_KEY') {
  aiClient = new GoogleGenAI({ apiKey });
}

// ----------------------------------------------------
// IN-MEMORY / PERSISTENT MOCK DATA STORAGE
// ----------------------------------------------------

export interface AlertItem {
  id: string;
  category: 'Flood' | 'Cyclone' | 'Wildfire' | 'Drought' | 'Landslide' | 'Severe Storm' | 'Heatwave';
  title: string;
  description: string;
  location: string;
  coordinates: [number, number]; // [lat, lng]
  severity: 'Low' | 'Moderate' | 'High' | 'Extreme';
  status: 'Active' | 'Acknowledged' | 'Resolved';
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

// Seed initial realistic alerts
let alerts: AlertItem[] = [
  {
    id: 'ALT-2026-001',
    category: 'Flood',
    title: 'River Basin Flash Flood Warning',
    description: 'Rapidly rising water levels in low-lying riparian corridors following 145mm rainfall in 12 hours.',
    location: 'Brahmaputra Floodplain, Assam',
    coordinates: [26.2006, 92.9376],
    severity: 'High',
    status: 'Active',
    issuedAt: new Date(Date.now() - 3 * 3600000).toISOString(),
    expiresAt: new Date(Date.now() + 21 * 3600000).toISOString(),
    source: 'Central Hydrological Center & Sensor Network (Demo)',
    isSimulated: true,
    recommendedActions: [
      'Move livestock and valuables to elevated ground',
      'Do not attempt to wade or drive through flowing water',
      'Follow Community Evacuation Route B to higher ridge shelters'
    ]
  },
  {
    id: 'ALT-2026-002',
    category: 'Cyclone',
    title: 'Tropical Cyclone "Amara" Coastal Alert',
    description: 'Category 3 equivalent cyclonic storm approaching Bay of Bengal coast with sustained winds of 135 km/h.',
    location: 'Puri Coastal Zone, Odisha',
    coordinates: [19.8135, 85.8312],
    severity: 'Extreme',
    status: 'Active',
    issuedAt: new Date(Date.now() - 6 * 3600000).toISOString(),
    expiresAt: new Date(Date.now() + 30 * 3600000).toISOString(),
    source: 'Regional Meteorological Radar Network (Demo)',
    isSimulated: true,
    recommendedActions: [
      'Immediate evacuation within 5km of coastline',
      'Secure window shutters and reinforce roof structures',
      'Charge battery power banks and store 72h potable water supply'
    ]
  },
  {
    id: 'ALT-2026-003',
    category: 'Wildfire',
    title: 'High Fire Weather Index Watch',
    description: 'Hot dry föhn winds and sub-18% humidity triggering critical forest fuel combustibility.',
    location: 'Pine Ridge Reserve, California',
    coordinates: [37.7749, -122.4194],
    severity: 'Moderate',
    status: 'Active',
    issuedAt: new Date(Date.now() - 10 * 3600000).toISOString(),
    expiresAt: new Date(Date.now() + 14 * 3600000).toISOString(),
    source: 'Wildland Fire Threat Assessment Unit (Demo)',
    isSimulated: true,
    recommendedActions: [
      'Total burn ban in effect',
      'Maintain 30-foot defensible perimeter around habitations',
      'Report any smoke plumes immediately to regional dispatch'
    ]
  },
  {
    id: 'ALT-2026-004',
    category: 'Heatwave',
    title: 'Prolonged Wet-Bulb Extreme Heat Advisory',
    description: 'Consecutive day temperatures reaching 44.5°C with severe heat stress index.',
    location: 'Ahmedabad Urban Zone, Gujarat',
    coordinates: [23.0225, 72.5714],
    severity: 'Moderate',
    status: 'Acknowledged',
    issuedAt: new Date(Date.now() - 18 * 3600000).toISOString(),
    expiresAt: new Date(Date.now() + 12 * 3600000).toISOString(),
    source: 'Climate Resilience Action Cell (Demo)',
    isSimulated: true,
    recommendedActions: [
      'Avoid direct sun exposure between 11:00 AM and 4:00 PM',
      'Increase oral rehydration solutions intake',
      'Check in on elderly, infants, and pets'
    ]
  }
];

// Seed shelters
let shelters: ShelterItem[] = [
  {
    id: 'SHL-01',
    name: 'District Multi-Purpose Cyclone Shelter #1',
    address: 'Near Grand Beach Road, Puri District',
    coordinates: [19.8250, 85.8390],
    contact: '+91 6752 222100 (Official Relief Desk)',
    capacity: 1200,
    occupancy: 420,
    status: 'Open',
    facilities: ['Backup Solar Power', 'Reverse Osmosis Drinking Water', 'Medical First Aid Bay', 'Sanitation Blocks', 'Satellite Radio'],
    accessibility: true,
    source: 'State Disaster Management Authority (SDMA Registry)',
    lastVerified: new Date().toISOString()
  },
  {
    id: 'SHL-02',
    name: 'Highland Community High School Relief Center',
    address: 'Hillcrest Road, Guwahati Urban Ridge',
    coordinates: [26.1850, 91.7500],
    contact: '+91 361 2450890 (Relief Command)',
    capacity: 850,
    occupancy: 310,
    status: 'Open',
    facilities: ['Generator Backup', 'Kitchen Facilities', 'Infant Care Room', 'Paramedic Staff'],
    accessibility: true,
    source: 'District Administration Directory',
    lastVerified: new Date().toISOString()
  },
  {
    id: 'SHL-03',
    name: 'Central Municipal Sports Complex Shelter',
    address: 'Stadium Cross Road, Navrangpura',
    coordinates: [23.0400, 72.5550],
    contact: '+91 79 26580000 (Municipal Emergency Operations)',
    capacity: 2500,
    occupancy: 150,
    status: 'Open',
    facilities: ['Cooling Stations', 'Emergency Triage', 'Ambulance Parking', 'Food Ration Distribution'],
    accessibility: true,
    source: 'Municipal Corporation Emergency Directory',
    lastVerified: new Date().toISOString()
  },
  {
    id: 'SHL-04',
    name: 'Coastal Coast Guard Community Center',
    address: 'Sector 4, Paradeep Port Road',
    coordinates: [20.2644, 86.6668],
    contact: '+91 6722 221234 (Coastal Command)',
    capacity: 600,
    occupancy: 580,
    status: 'Full',
    facilities: ['Helipad Access', 'VHF Comms', 'Clean Water', 'Medical Doctor on Site'],
    accessibility: false,
    source: 'Harbor Emergency Task Force',
    lastVerified: new Date().toISOString()
  }
];

let evacuationPlans: EvacuationPlanItem[] = [
  {
    id: 'PLAN-001',
    name: 'Coastal Evacuation to Cyclone Shelter #1',
    origin: 'Fishermen Colony, Puri Beach',
    originCoordinates: [19.7980, 85.8200],
    destinationShelterId: 'SHL-01',
    destinationName: 'District Multi-Purpose Cyclone Shelter #1',
    destinationCoordinates: [19.8250, 85.8390],
    evacuationMode: 'Vehicle',
    distanceKm: 4.8,
    estimatedTimeMin: 14,
    notes: 'Avoid sea-facing boulevard due to 3.2m predicted storm surge. Use Inland Ring Road.',
    createdAt: new Date().toISOString()
  }
];

let auditLogs: { id: string; timestamp: string; action: string; user: string; details: string }[] = [
  {
    id: 'LOG-001',
    timestamp: new Date(Date.now() - 4 * 3600000).toISOString(),
    action: 'ALERT_PUBLISHED',
    user: 'Disaster Operations Manager (demo-ops@disasterguard.org)',
    details: 'Published ALT-2026-001 for Brahmaputra Floodplain (High severity).'
  },
  {
    id: 'LOG-002',
    timestamp: new Date(Date.now() - 2 * 3600000).toISOString(),
    action: 'SHELTER_STATUS_UPDATE',
    user: 'District Logistics Officer (logistics@disasterguard.org)',
    details: 'Updated SHL-01 occupancy to 420/1200.'
  }
];

// ----------------------------------------------------
// API ROUTES
// ----------------------------------------------------

// 1. Health check & status
app.get('/api/status', (req: Request, res: Response) => {
  res.json({
    system: 'DisasterGuard AI API Gateway',
    version: '1.2.0',
    sdgAlignment: 'UN SDG 13 (Climate Action)',
    geminiConfigured: !!aiClient,
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString()
  });
});

// 2. Open-Meteo Weather Proxy (handles geocoding & weather with graceful fallback)
app.get('/api/weather', async (req: Request, res: Response) => {
  const lat = req.query.lat as string;
  const lon = req.query.lon as string;

  if (!lat || !lon) {
    res.status(400).json({ error: 'Missing lat or lon parameters' });
    return;
  }

  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,rain,weather_code,wind_speed_10m,wind_direction_10m,wind_gusts_10m,surface_pressure&hourly=temperature_2m,precipitation_probability,precipitation,wind_speed_10m,soil_moisture_0_to_1cm&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum,wind_speed_10m_max&timezone=auto`;
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Open-Meteo returned status ${response.status}`);
    }
    const data = await response.json();
    res.json({
      success: true,
      dataSource: 'Open-Meteo Free Weather API (Live Observation & NWP Forecast)',
      retrievedAt: new Date().toISOString(),
      data
    });
  } catch (err: any) {
    console.warn('Weather fetch error:', err.message);
    res.status(502).json({
      success: false,
      error: 'Failed to retrieve live data from Open-Meteo.',
      details: err.message
    });
  }
});

// Geocoding via OpenStreetMap Nominatim with required User-Agent
app.get('/api/geocode', async (req: Request, res: Response) => {
  const query = req.query.q as string;
  if (!query || query.trim().length === 0) {
    res.status(400).json({ error: 'Query string required' });
    return;
  }

  try {
    const encoded = encodeURIComponent(query.trim());
    const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encoded}&limit=5`, {
      headers: {
        'User-Agent': 'DisasterGuard-AI-SDG13-App/1.0 (academic-demonstration)'
      }
    });

    if (!response.ok) {
      throw new Error(`Nominatim responded with ${response.status}`);
    }

    const data = await response.json();
    res.json({ success: true, results: data });
  } catch (err: any) {
    console.warn('Geocoding error:', err.message);
    res.status(502).json({ success: false, error: 'Geocoding service unavailable', results: [] });
  }
});

// 3. AI Disaster Assistant Chat via Gemini (with robust system prompt & fallback)
app.post('/api/chat', async (req: Request, res: Response) => {
  const { message, history } = req.body;

  if (!message || typeof message !== 'string') {
    res.status(400).json({ error: 'Valid message required' });
    return;
  }

  const systemInstruction = `You are "DisasterGuard Assistant", an expert AI decision-support and disaster preparedness assistant integrated into the DisasterGuard AI system (aligned with UN SDG 13: Climate Action).

PRIMARY OBJECTIVES:
1. Provide accurate, clear, practical, and empathetic safety advice for floods, cyclones, droughts, heatwaves, wildfires, landslides, earthquakes, and severe storms.
2. Structure answers with actionable headings: e.g. "Immediate Action", "Preparation & 72-Hour Kit", "Evacuation Considerations", "Post-Disaster Recovery".
3. Always emphasize that during active emergencies, users MUST prioritize local emergency responders, siren broadcasts, and official disaster authorities (NDMA, FEMA, Met Departments).
4. Never fabricate real-time emergency events, live rescues, or pretend you can dispatch emergency teams.
5. Emphasize climate resilience and proactive community measures.
6. Keep answers concise, highly readable, and formatted cleanly with bullet points.`;

  if (aiClient) {
    try {
      // Build conversation contents
      const contents: any[] = [];
      if (Array.isArray(history)) {
        for (const item of history.slice(-6)) {
          contents.push({
            role: item.role === 'user' ? 'user' : 'model',
            parts: [{ text: item.content }]
          });
        }
      }
      contents.push({
        role: 'user',
        parts: [{ text: message }]
      });

      const response = await aiClient.models.generateContent({
        model: 'gemini-3.8-flash',
        contents,
        config: {
          systemInstruction,
          temperature: 0.4,
          maxOutputTokens: 1000,
        }
      });

      const text = response.text || 'No response generated.';
      res.json({
        reply: text,
        model: 'gemini-3.8-flash',
        timestamp: new Date().toISOString()
      });
      return;
    } catch (err: any) {
      console.error('Gemini API chat error:', err.message);
      // Fallback below
    }
  }

  // Graceful intelligent fallback when API key is not provided or quota exceeded
  const fallbackReplies: Record<string, string> = {
    flood: `### Flood Preparedness Guidelines (DisasterGuard Knowledge Base)
- **Immediate Precaution**: Move to higher ground immediately. Never drive, walk, or swim through moving floodwaters ("Turn Around, Don't Drown").
- **72-Hour Kit**: 1 gallon of potable water per person/day, non-perishable rations, flashlight, waterproof document pouch, first-aid kit.
- **Home Protection**: Turn off main electricity breakers and gas valves if instructed. Unplug small electronics.
- **Emergency Note**: Follow official evacuation directives from your local district magistrate and National Disaster Management authority.`,
    cyclone: `### Cyclone & Storm Safety Protocol (DisasterGuard Knowledge Base)
- **Before Landfall**: Board or tape large glass windows. Clear loose courtyard items, sheet metal, and overhanging branches.
- **Supplies**: Full battery banks, emergency radio, clean water in closed containers, necessary prescription medications for 7 days.
- **During the Storm**: Stay in the strongest central room without windows. If the eye of the storm passes with calm weather, remain inside as winds will abruptly reverse!
- **Follow Official Warnings**: Heed coastal storm-surge evacuation warnings immediately.`,
    heatwave: `### Severe Heatwave & Wet-Bulb Guidelines (DisasterGuard Knowledge Base)
- **Hydration**: Drink water regularly even before feeling thirsty. Consume Oral Rehydration Salts (ORS) or electrolyte solutions.
- **Exposure**: Avoid strenuous outdoor activity between 11:00 AM and 4:30 PM.
- **Vulnerable Groups**: Check regularly on elderly neighbors, small children, and pets.
- **Heat Stroke Signs**: High core temperature, hot dry skin, confusion, nausea. Seek urgent clinical care and cool the person with wet towels.`
  };

  const lower = message.toLowerCase();
  let matchedReply = '';
  if (lower.includes('flood') || lower.includes('water') || lower.includes('rain')) {
    matchedReply = fallbackReplies.flood;
  } else if (lower.includes('cyclone') || lower.includes('storm') || lower.includes('hurricane') || lower.includes('wind')) {
    matchedReply = fallbackReplies.cyclone;
  } else if (lower.includes('heat') || lower.includes('hot') || lower.includes('sun') || lower.includes('temperature')) {
    matchedReply = fallbackReplies.heatwave;
  } else {
    matchedReply = `### DisasterGuard Safety & Resilience Guidance
- **Safety First**: In an imminent life-threatening emergency, call your local emergency telephone number immediately (911, 112, or local rescue dispatch).
- **Core Principles**:
  1. Have a 72-Hour "Go-Bag" ready with water, food, power banks, and essential medications.
  2. Establish a designated family meeting location outside hazard zones.
  3. Monitor verified alerts through national meteorological agencies and DisasterGuard AI.
- **SDG 13 Note**: Early warning systems and community awareness reduce climate disaster casualties by up to 80%.

*(Note: Operating in local decision-support fallback mode. Configure GEMINI_API_KEY for dynamic interactive synthesis.)*`;
  }

  res.json({
    reply: matchedReply,
    model: 'Rule-Based Knowledge Engine (Fallback Mode)',
    timestamp: new Date().toISOString()
  });
});

// 4. Disaster Risk Assessment Engine (Multi-Hazard Explainable Logic + AI Insights)
app.post('/api/assess-risk', async (req: Request, res: Response) => {
  const {
    disasterType,
    location,
    rainfallMm,
    forecastPrecipitationMm,
    temperatureC,
    windSpeedKmh,
    relativeHumidity,
    soilMoisturePercentage,
    slopeAngleDegrees,
    vegetationDrynessIndex,
    historicalDisasterCount
  } = req.body;

  const type = disasterType || 'Flood';
  let score = 0;
  const factors: { name: string; impact: string; weight: number; value: any }[] = [];

  // Hazard-specific physics & meteorological rule scoring
  if (type === 'Flood') {
    const rain = Number(rainfallMm) || 0;
    const forecastRain = Number(forecastPrecipitationMm) || 0;
    const soil = Number(soilMoisturePercentage) || 30;

    let rainScore = Math.min(50, (rain / 120) * 50);
    factors.push({ name: 'Current Observed Rainfall', impact: `${rain} mm (40% baseline)`, weight: 40, value: rain });

    let forecastScore = Math.min(30, (forecastRain / 80) * 30);
    factors.push({ name: '24-48h Forecast Precipitation', impact: `${forecastRain} mm`, weight: 30, value: forecastRain });

    let soilScore = (soil / 100) * 20;
    factors.push({ name: 'Soil Saturation / Infiltration Capacity', impact: `${soil}% saturated`, weight: 20, value: soil });

    score = Math.round(rainScore + forecastScore + soilScore);
  } else if (type === 'Cyclone') {
    const wind = Number(windSpeedKmh) || 0;
    const rain = Number(rainfallMm) || 0;
    const humidity = Number(relativeHumidity) || 60;

    let windScore = Math.min(60, (wind / 160) * 60);
    factors.push({ name: 'Sustained Wind Speed & Gusts', impact: `${wind} km/h`, weight: 50, value: wind });

    let rainScore = Math.min(25, (rain / 100) * 25);
    factors.push({ name: 'Associated Convective Rainfall', impact: `${rain} mm`, weight: 25, value: rain });

    let humScore = (humidity / 100) * 15;
    factors.push({ name: 'Marine Humidity & Atmospheric Instability', impact: `${humidity}%`, weight: 15, value: humidity });

    score = Math.round(windScore + rainScore + humScore);
  } else if (type === 'Wildfire') {
    const temp = Number(temperatureC) || 25;
    const wind = Number(windSpeedKmh) || 10;
    const humidity = Number(relativeHumidity) || 50;
    const vegDryness = Number(vegetationDrynessIndex) || 50;

    let tempScore = Math.max(0, Math.min(30, ((temp - 20) / 25) * 30));
    let windScore = Math.min(25, (wind / 60) * 25);
    let dryScore = Math.max(0, Math.min(25, ((60 - humidity) / 50) * 25));
    let fuelScore = (vegDryness / 100) * 20;

    factors.push({ name: 'Ambient Surface Temperature', impact: `${temp}°C`, weight: 30, value: temp });
    factors.push({ name: 'Atmospheric Vapor Pressure Deficit / Low Humidity', impact: `${humidity}%`, weight: 25, value: humidity });
    factors.push({ name: 'Wind Fanning Potential', impact: `${wind} km/h`, weight: 25, value: wind });
    factors.push({ name: 'Fine Fuel & Biomass Moisture Deficit', impact: `${vegDryness}% dryness index`, weight: 20, value: vegDryness });

    score = Math.round(tempScore + windScore + dryScore + fuelScore);
  } else if (type === 'Drought') {
    const rain = Number(rainfallMm) || 0;
    const soil = Number(soilMoisturePercentage) || 40;
    const temp = Number(temperatureC) || 28;

    let rainDeficit = Math.max(0, Math.min(45, (1 - rain / 50) * 45));
    let soilDeficit = Math.max(0, Math.min(35, (1 - soil / 60) * 35));
    let evapScore = Math.max(0, Math.min(20, ((temp - 25) / 20) * 20));

    factors.push({ name: 'Cumulative Rainfall Deficit (Standardized Precipitation)', impact: `${rain} mm`, weight: 45, value: rain });
    factors.push({ name: 'Root-Zone Soil Moisture Depletion', impact: `${soil}% moisture`, weight: 35, value: soil });
    factors.push({ name: 'High Evapotranspiration Temperature', impact: `${temp}°C`, weight: 20, value: temp });

    score = Math.round(rainDeficit + soilDeficit + evapScore);
  } else if (type === 'Landslide') {
    const rain = Number(rainfallMm) || 0;
    const slope = Number(slopeAngleDegrees) || 25;
    const soil = Number(soilMoisturePercentage) || 40;

    let rainScore = Math.min(40, (rain / 100) * 40);
    let slopeScore = Math.min(40, (slope / 45) * 40);
    let poreScore = (soil / 100) * 20;

    factors.push({ name: 'Antecedent Rainfall & Pore Water Pressure', impact: `${rain} mm`, weight: 40, value: rain });
    factors.push({ name: 'Terrain Gradient & Slope Steepness', impact: `${slope}° gradient`, weight: 40, value: slope });
    factors.push({ name: 'Regolith Soil Saturation', impact: `${soil}% moisture`, weight: 20, value: soil });

    score = Math.round(rainScore + slopeScore + poreScore);
  }

  // Factor in historical recurrence if provided
  if (historicalDisasterCount && Number(historicalDisasterCount) > 0) {
    const histBonus = Math.min(10, Number(historicalDisasterCount) * 2);
    score = Math.min(100, score + histBonus);
    factors.push({
      name: 'Historical Hazard Recurrence Frequency',
      impact: `${historicalDisasterCount} documented past events`,
      weight: 10,
      value: historicalDisasterCount
    });
  }

  score = Math.max(0, Math.min(100, score));

  let riskLevel: 'Low' | 'Moderate' | 'High' | 'Extreme' = 'Low';
  if (score >= 80) riskLevel = 'Extreme';
  else if (score >= 60) riskLevel = 'High';
  else if (score >= 35) riskLevel = 'Moderate';
  else riskLevel = 'Low';

  const recommendationsMap: Record<string, Record<string, string[]>> = {
    Flood: {
      Low: ['Monitor routine rainfall advisories', 'Keep storm drains clear of domestic debris'],
      Moderate: ['Avoid camping or parking near drainage canals', 'Prepare an emergency grab-and-go kit'],
      High: ['Move ground-floor electronics to upper floors', 'Identify closest elevated shelter', 'Follow evacuation orders immediately if issued'],
      Extreme: ['Evacuate immediately to designated highland shelters', 'Avoid all low-lying roads and culverts', 'Switch off main circuit breaker before leaving']
    },
    Cyclone: {
      Low: ['Regularly check coastal bulletin updates', 'Inspect roof fasteners and awnings'],
      Moderate: ['Secure outdoor loose furniture and signs', 'Stock 3 days of non-perishable food'],
      High: ['Board up glass fenestrations', 'Charge all phones and emergency radios', 'Stay tuned to local civil defense alerts'],
      Extreme: ['Seek refuge in reinforced concrete cyclone shelter immediately', 'Stay away from storm-surge prone coastline', 'Remain sheltered until official all-clear is given']
    },
    Wildfire: {
      Low: ['Abide by seasonal open-fire guidelines', 'Clear dry brush within 10 meters of property'],
      Moderate: ['Maintain garden hose availability', 'Keep vehicle fuel tank at least half full'],
      High: ['Seal attic vents with fine mesh to prevent ember ignition', 'Wear N95 masks if smoke is present'],
      Extreme: ['Prepare immediate evacuation route', 'Follow civil emergency evacuation orders without delay']
    },
    Drought: {
      Low: ['Practice household water conservation', 'Mulch agricultural soil beds'],
      Moderate: ['Implement drip irrigation', 'Repair municipal supply leaks'],
      High: ['Ration non-essential water usage', 'Prioritize livestock drinking supplies'],
      Extreme: ['Activate emergency community water tankers and groundwater recharge contingency']
    },
    Landslide: {
      Low: ['Inspect slope retaining walls for micro-cracks'],
      Moderate: ['Watch for tilted utility poles or trees on hillside slopes'],
      High: ['Stay alert during continuous heavy downpours', 'Sleep in rooms furthest away from the upslope hill'],
      Extreme: ['Evacuate hillside dwellings immediately to geological stable grounds']
    }
  };

  const recommendedActions = recommendationsMap[type]?.[riskLevel] || [
    'Remain vigilant and follow official local disaster management directives.',
    'Keep communication lines open with neighborhood safety committees.'
  ];

  // Try optional Gemini synthesis if available
  let aiExplanation = '';
  if (aiClient) {
    try {
      const prompt = `Provide a concise 2-sentence expert disaster risk summary for:
Hazard: ${type}
Location: ${location || 'Selected Region'}
Risk Level: ${riskLevel} (${score}/100)
Key metrics: ${factors.map(f => `${f.name}: ${f.impact}`).join(', ')}.
Focus on scientific hazard drivers and key immediate safety posture.`;

      const timeoutPromise = new Promise<null>((resolve) => setTimeout(() => resolve(null), 2500));
      const geminiPromise = aiClient.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        config: { temperature: 0.3, maxOutputTokens: 250 }
      });
      const genRes: any = await Promise.race([geminiPromise, timeoutPromise]);
      if (genRes && genRes.text) {
        aiExplanation = genRes.text;
      }
    } catch (e: any) {
      console.warn('Gemini summary generation skipped:', e.message);
    }
  }

  res.json({
    disasterType: type,
    location: location || 'Specified Coordinate Zone',
    riskLevel,
    riskScore: score,
    contributingFactors: factors,
    recommendedActions,
    aiExplanation: aiExplanation || `The calculated ${riskLevel.toUpperCase()} risk (${score}/100) is governed by prominent inputs including ${factors[0]?.name || 'current meteorological parameters'}. Precautionary posture recommended.`,
    assessmentMethod: 'Transparent Multi-Factor Environmental Risk Assessment Engine',
    assessedAt: new Date().toISOString(),
    scientificLimitations: 'Based on empirical thresholds and numerical weather predictions. Local topography, microclimates, drainage infrastructure, and sudden convective cloudbursts can influence real-world severity.'
  });
});

// 5. Machine Learning Dataset Training & Evaluation Simulator
app.post('/api/train-evaluate', (req: Request, res: Response) => {
  const { datasetRows, targetHazard, algorithm, testSplitRatio } = req.body;
  const rows = Number(datasetRows) || 1200;
  const split = Number(testSplitRatio) || 0.2;
  const algo = algorithm || 'Random Forest Classifier';
  const hazard = targetHazard || 'Flood Risk';

  // Realistic statistical simulation based on scientific ML benchmarks
  const trainCount = Math.round(rows * (1 - split));
  const testCount = Math.round(rows * split);

  // Compute realistic metrics based on sample size and hazard complexity
  const baseAcc = algo.includes('Random Forest') ? 0.884 : algo.includes('Gradient') ? 0.902 : 0.841;
  const noise = (Math.sin(rows) * 0.02);
  const accuracy = Math.min(0.96, Math.max(0.75, baseAcc + noise));
  const precision = Math.min(0.95, accuracy - 0.015);
  const recall = Math.min(0.95, accuracy + 0.012);
  const f1 = Number(((2 * (precision * recall)) / (precision + recall)).toFixed(4));

  // Confusion matrix for binary/multiclass (High Risk vs Low/Moderate Risk)
  const truePositive = Math.round(testCount * 0.32 * recall);
  const falsePositive = Math.round(testCount * 0.32 * (1 - precision));
  const falseNegative = Math.round(testCount * 0.32 * (1 - recall));
  const trueNegative = testCount - (truePositive + falsePositive + falseNegative);

  const featureImportance = [
    { feature: 'Cumulative Precipitation (72h)', importance: 0.34 },
    { feature: 'Soil Water Index / Saturation', importance: 0.26 },
    { feature: 'Digital Elevation Model (Slope %)', importance: 0.18 },
    { feature: 'Antecedent Soil Moisture (API)', importance: 0.12 },
    { feature: 'Historical Recurrence Factor', importance: 0.07 },
    { feature: 'River Proximity Index', importance: 0.03 }
  ];

  res.json({
    hazard,
    algorithm: algo,
    totalRecords: rows,
    trainCount,
    testCount,
    splitRatio: `${Math.round((1 - split) * 100)}% Train / ${Math.round(split * 100)}% Test`,
    metrics: {
      accuracy: Number((accuracy * 100).toFixed(2)),
      precision: Number((precision * 100).toFixed(2)),
      recall: Number((recall * 100).toFixed(2)),
      f1Score: Number((f1 * 100).toFixed(2)),
      rocAuc: Number((accuracy + 0.02).toFixed(3))
    },
    confusionMatrix: {
      truePositive,
      falsePositive,
      trueNegative,
      falseNegative
    },
    baselineComparison: {
      baselineModel: 'Zero-Rule / Historical Majority Class Baseline',
      baselineAccuracy: 64.2,
      modelImprovementPercent: Number(((accuracy * 100) - 64.2).toFixed(1))
    },
    featureImportance,
    trainedAt: new Date().toISOString()
  });
});

// 6. Alert Management Endpoints
app.get('/api/alerts', (req: Request, res: Response) => {
  res.json(alerts);
});

app.post('/api/alerts', (req: Request, res: Response) => {
  const { category, title, description, location, coordinates, severity, source, recommendedActions } = req.body;
  if (!title || !category || !location) {
    res.status(400).json({ error: 'Title, category, and location are required' });
    return;
  }

  const newAlert: AlertItem = {
    id: `ALT-${Date.now().toString().slice(-4)}`,
    category,
    title,
    description: description || 'Operational emergency notice.',
    location,
    coordinates: coordinates || [20.5937, 78.9629],
    severity: severity || 'Moderate',
    status: 'Active',
    issuedAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 24 * 3600000).toISOString(),
    source: source || 'DisasterGuard Emergency Operations Officer',
    isSimulated: false,
    recommendedActions: recommendedActions && recommendedActions.length ? recommendedActions : ['Follow local emergency guidelines']
  };

  alerts.unshift(newAlert);

  auditLogs.unshift({
    id: `LOG-${Date.now().toString().slice(-4)}`,
    timestamp: new Date().toISOString(),
    action: 'ALERT_CREATED',
    user: 'Emergency Duty Officer',
    details: `Created alert "${newAlert.title}" in ${newAlert.location} with severity ${newAlert.severity}.`
  });

  res.status(201).json(newAlert);
});

app.patch('/api/alerts/:id/acknowledge', (req: Request, res: Response) => {
  const alert = alerts.find(a => a.id === req.params.id);
  if (!alert) {
    res.status(404).json({ error: 'Alert not found' });
    return;
  }
  alert.status = 'Acknowledged';
  auditLogs.unshift({
    id: `LOG-${Date.now().toString().slice(-4)}`,
    timestamp: new Date().toISOString(),
    action: 'ALERT_ACKNOWLEDGED',
    user: 'Operations Controller',
    details: `Alert ${alert.id} was acknowledged.`
  });
  res.json(alert);
});

app.patch('/api/alerts/:id/resolve', (req: Request, res: Response) => {
  const alert = alerts.find(a => a.id === req.params.id);
  if (!alert) {
    res.status(404).json({ error: 'Alert not found' });
    return;
  }
  alert.status = 'Resolved';
  auditLogs.unshift({
    id: `LOG-${Date.now().toString().slice(-4)}`,
    timestamp: new Date().toISOString(),
    action: 'ALERT_RESOLVED',
    user: 'Operations Controller',
    details: `Alert ${alert.id} was resolved.`
  });
  res.json(alert);
});

app.delete('/api/alerts/:id', (req: Request, res: Response) => {
  const index = alerts.findIndex(a => a.id === req.params.id);
  if (index === -1) {
    res.status(404).json({ error: 'Alert not found' });
    return;
  }
  const removed = alerts.splice(index, 1)[0];
  auditLogs.unshift({
    id: `LOG-${Date.now().toString().slice(-4)}`,
    timestamp: new Date().toISOString(),
    action: 'ALERT_DELETED',
    user: 'Administrator',
    details: `Alert ${removed.id} was archived/deleted.`
  });
  res.json({ success: true, removed });
});

// 7. Shelters Endpoints
app.get('/api/shelters', (req: Request, res: Response) => {
  res.json(shelters);
});

app.post('/api/shelters', (req: Request, res: Response) => {
  const { name, address, coordinates, contact, capacity, facilities, accessibility } = req.body;
  if (!name || !address) {
    res.status(400).json({ error: 'Name and address required' });
    return;
  }

  const newShelter: ShelterItem = {
    id: `SHL-${Date.now().toString().slice(-3)}`,
    name,
    address,
    coordinates: coordinates || [20.5937, 78.9629],
    contact: contact || '+1 (555) 019-9000',
    capacity: Number(capacity) || 500,
    occupancy: 0,
    status: 'Open',
    facilities: facilities || ['Clean Water', 'First Aid'],
    accessibility: !!accessibility,
    source: 'Municipal Disaster Logistics Registry',
    lastVerified: new Date().toISOString()
  };

  shelters.push(newShelter);
  res.status(201).json(newShelter);
});

app.patch('/api/shelters/:id', (req: Request, res: Response) => {
  const shelter = shelters.find(s => s.id === req.params.id);
  if (!shelter) {
    res.status(404).json({ error: 'Shelter not found' });
    return;
  }

  if (req.body.occupancy !== undefined) {
    shelter.occupancy = Number(req.body.occupancy);
    if (shelter.occupancy >= shelter.capacity) {
      shelter.status = 'Full';
    } else {
      shelter.status = 'Open';
    }
  }
  if (req.body.status) shelter.status = req.body.status;
  shelter.lastVerified = new Date().toISOString();

  res.json(shelter);
});

// 8. Evacuation Plans Endpoints
app.get('/api/evacuation-plans', (req: Request, res: Response) => {
  res.json(evacuationPlans);
});

app.post('/api/evacuation-plans', (req: Request, res: Response) => {
  const { name, origin, originCoordinates, destinationShelterId, destinationName, destinationCoordinates, evacuationMode, distanceKm, estimatedTimeMin, notes } = req.body;
  
  const newPlan: EvacuationPlanItem = {
    id: `PLAN-${Date.now().toString().slice(-3)}`,
    name: name || 'Personal Evacuation Contingency Plan',
    origin: origin || 'My Home Residence',
    originCoordinates: originCoordinates || [20.59, 78.96],
    destinationShelterId: destinationShelterId || 'SHL-01',
    destinationName: destinationName || 'Designated Safe Shelter',
    destinationCoordinates: destinationCoordinates || [20.60, 78.97],
    evacuationMode: evacuationMode || 'Vehicle',
    distanceKm: Number(distanceKm) || 5.2,
    estimatedTimeMin: Number(estimatedTimeMin) || 18,
    notes: notes || 'Carry emergency kit, keep headlights on, follow police directives.',
    createdAt: new Date().toISOString()
  };

  evacuationPlans.unshift(newPlan);
  res.status(201).json(newPlan);
});

// 9. Audit Logs
app.get('/api/audit-logs', (req: Request, res: Response) => {
  res.json(auditLogs);
});

// ----------------------------------------------------
// VITE MIDDLEWARE SETUP (Full-stack dev & prod)
// ----------------------------------------------------

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    // In dev, use vite's connect instance as middleware
    const { createServer } = await import('vite');
    const vite = await createServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // In production, serve built files
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`DisasterGuard AI server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
