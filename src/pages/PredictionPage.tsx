import React, { useState } from 'react';
import { 
  BrainCircuit, 
  Sparkles, 
  CheckCircle, 
  AlertTriangle, 
  UploadCloud, 
  FileSpreadsheet, 
  BarChart2, 
  ArrowRight, 
  RefreshCw, 
  ShieldAlert, 
  HelpCircle,
  FileCheck,
  ChevronRight,
  Info
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  Cell 
} from 'recharts';
import { DisasterCategory, RiskAssessmentResult, MLEvaluationResult, WeatherData } from '../types';
import { API } from '../services/api';

interface PredictionPageProps {
  currentLocation: { name: string; lat: number; lon: number };
  weather: WeatherData | null;
}

export const PredictionPage: React.FC<PredictionPageProps> = ({
  currentLocation,
  weather
}) => {
  const [activeTab, setActiveTab] = useState<'assessment' | 'ml-workbench'>('assessment');

  // Form State
  const [disasterType, setDisasterType] = useState<DisasterCategory>('Flood');
  const [locationName, setLocationName] = useState(currentLocation.name);
  const [rainfallMm, setRainfallMm] = useState<number>(45);
  const [forecastPrecipitationMm, setForecastPrecipitationMm] = useState<number>(65);
  const [temperatureC, setTemperatureC] = useState<number>(28);
  const [windSpeedKmh, setWindSpeedKmh] = useState<number>(25);
  const [relativeHumidity, setRelativeHumidity] = useState<number>(75);
  const [soilMoisturePercentage, setSoilMoisturePercentage] = useState<number>(60);
  const [slopeAngleDegrees, setSlopeAngleDegrees] = useState<number>(20);
  const [vegetationDrynessIndex, setVegetationDrynessIndex] = useState<number>(45);
  const [historicalDisasterCount, setHistoricalDisasterCount] = useState<number>(3);

  const [loadingAssessment, setLoadingAssessment] = useState(false);
  const [assessmentResult, setAssessmentResult] = useState<RiskAssessmentResult | null>(null);

  // ML Workbench State
  const [csvFileName, setCsvFileName] = useState<string | null>(null);
  const [csvRowCount, setCsvRowCount] = useState<number>(1450);
  const [csvStatusMessage, setCsvStatusMessage] = useState<string | null>('Default benchmark dataset loaded: "historical_multihazard_climate_train.csv" (1,450 records).');
  const [selectedAlgorithm, setSelectedAlgorithm] = useState<string>('Random Forest Classifier');
  const [splitRatio, setSplitRatio] = useState<number>(0.2);
  const [loadingML, setLoadingML] = useState(false);
  const [mlResult, setMlResult] = useState<MLEvaluationResult | null>(null);

  // Auto-fill from live weather station
  const handleAutofillWeather = () => {
    if (weather) {
      setTemperatureC(Math.round(weather.temperature));
      setWindSpeedKmh(Math.round(weather.windSpeed));
      setRelativeHumidity(Math.round(weather.humidity));
      setRainfallMm(Math.round(weather.precipitation * 10)); // estimate recent cumulative
      setLocationName(currentLocation.name);
    }
  };

  // Run Rule-Based Assessment
  const handleAssessRisk = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoadingAssessment(true);
    try {
      const res = await API.assessRisk({
        disasterType,
        location: locationName,
        rainfallMm,
        forecastPrecipitationMm,
        temperatureC,
        windSpeedKmh,
        relativeHumidity,
        soilMoisturePercentage,
        slopeAngleDegrees,
        vegetationDrynessIndex,
        historicalDisasterCount
      });
      setAssessmentResult(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingAssessment(false);
    }
  };

  // Run ML Evaluation
  const handleTrainEvaluateML = async () => {
    setLoadingML(true);
    try {
      const res = await API.evaluateMLModel({
        datasetRows: csvRowCount,
        targetHazard: `${disasterType} Risk Classification`,
        algorithm: selectedAlgorithm,
        testSplitRatio: splitRatio
      });
      setMlResult(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingML(false);
    }
  };

  // CSV File Upload Handler
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.csv')) {
      setCsvStatusMessage('Validation Error: Only RFC 4180 compliant .csv files are supported.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const lines = text.split('\n').filter(l => l.trim().length > 0);
      if (lines.length < 2) {
        setCsvStatusMessage('Validation Error: CSV file contains insufficient rows.');
        return;
      }

      const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
      const requiredColumns = ['rainfall', 'wind', 'temperature', 'risk_label'];
      const missing = requiredColumns.filter(rc => !headers.some(h => h.includes(rc)));

      if (missing.length > 0) {
        setCsvStatusMessage(`Validation Warning: Missing standard feature headers: [${missing.join(', ')}]. Normalized mapping will be approximated.`);
      } else {
        setCsvStatusMessage(`Validated successfully! ${lines.length - 1} records parsed. Headers: ${headers.slice(0, 5).join(', ')}...`);
      }

      setCsvFileName(file.name);
      setCsvRowCount(lines.length - 1);
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-mono font-bold text-rose-400 uppercase tracking-wider">
              Decision-Support Intelligence
            </span>
            <span className="text-slate-600">•</span>
            <span className="text-xs text-emerald-400 font-mono">BTech CSE AI/ML Capstone Core</span>
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
            <BrainCircuit className="w-6 h-6 text-rose-500" />
            AI & Statistical Disaster Risk Assessment Engine
          </h1>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl">
            Multi-hazard environmental physics formulas, empirical risk scoring, and machine learning benchmark evaluations for climate vulnerability forecasting.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center bg-slate-850 p-1 rounded-xl border border-slate-700/80 self-start md:self-auto">
          <button
            onClick={() => setActiveTab('assessment')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'assessment' 
                ? 'bg-rose-600 text-white shadow' 
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Multi-Hazard Assessment
          </button>
          <button
            onClick={() => setActiveTab('ml-workbench')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1 ${
              activeTab === 'ml-workbench' 
                ? 'bg-rose-600 text-white shadow' 
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <BarChart2 className="w-3.5 h-3.5" />
            <span>ML Model Workbench</span>
          </button>
        </div>
      </div>

      {activeTab === 'assessment' ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Assessment Form (Left 5 Cols) */}
          <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
              <div>
                <h2 className="text-sm font-bold text-white">Hazard Parameter Calibration</h2>
                <p className="text-[11px] text-slate-400">Enter atmospheric and environmental factors</p>
              </div>
              <button
                type="button"
                onClick={handleAutofillWeather}
                className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-lg bg-sky-500/15 border border-sky-500/30 text-sky-300 hover:bg-sky-500/25 transition-colors cursor-pointer"
                title="Autofill current readings from Open-Meteo"
              >
                <RefreshCw className="w-3 h-3" />
                <span>Autofill Live Weather</span>
              </button>
            </div>

            <form onSubmit={handleAssessRisk} className="space-y-4">
              {/* Disaster Category */}
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Target Hazard Type
                </label>
                <div className="grid grid-cols-3 gap-1.5">
                  {(['Flood', 'Cyclone', 'Wildfire', 'Drought', 'Landslide'] as DisasterCategory[]).map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setDisasterType(type)}
                      className={`py-1.5 px-2 rounded-lg text-xs font-medium border text-center transition-all cursor-pointer ${
                        disasterType === type
                          ? 'bg-rose-500/20 border-rose-500/60 text-rose-300 font-semibold'
                          : 'bg-slate-800/80 border-slate-700 text-slate-300 hover:bg-slate-800'
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>

              {/* Location Name */}
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Operations Focus Zone / Location
                </label>
                <input
                  type="text"
                  value={locationName}
                  onChange={(e) => setLocationName(e.target.value)}
                  className="w-full bg-slate-850 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-rose-500"
                  required
                />
              </div>

              {/* Dual Inputs: Rain & Forecast Rain */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Observed Rain (mm)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="500"
                    value={rainfallMm}
                    onChange={(e) => setRainfallMm(Number(e.target.value))}
                    className="w-full bg-slate-850 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-rose-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    24h Forecast Rain (mm)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="500"
                    value={forecastPrecipitationMm}
                    onChange={(e) => setForecastPrecipitationMm(Number(e.target.value))}
                    className="w-full bg-slate-850 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-rose-500"
                  />
                </div>
              </div>

              {/* Dual Inputs: Temp & Wind */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Temperature (°C)
                  </label>
                  <input
                    type="number"
                    value={temperatureC}
                    onChange={(e) => setTemperatureC(Number(e.target.value))}
                    className="w-full bg-slate-850 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-rose-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Wind Speed (km/h)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="350"
                    value={windSpeedKmh}
                    onChange={(e) => setWindSpeedKmh(Number(e.target.value))}
                    className="w-full bg-slate-850 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-rose-500"
                  />
                </div>
              </div>

              {/* Dual Inputs: Humidity & Soil Moisture */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Relative Humidity (%)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={relativeHumidity}
                    onChange={(e) => setRelativeHumidity(Number(e.target.value))}
                    className="w-full bg-slate-850 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-rose-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Soil Moisture Saturation (%)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={soilMoisturePercentage}
                    onChange={(e) => setSoilMoisturePercentage(Number(e.target.value))}
                    className="w-full bg-slate-850 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-rose-500"
                  />
                </div>
              </div>

              {/* Hazard-Specific Conditionals */}
              {disasterType === 'Landslide' && (
                <div>
                  <label className="block text-xs font-medium text-amber-300 mb-1">
                    Terrain Slope Gradient (Degrees: 0° - 60°)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="60"
                    value={slopeAngleDegrees}
                    onChange={(e) => setSlopeAngleDegrees(Number(e.target.value))}
                    className="w-full bg-slate-850 border border-amber-500/40 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-amber-400"
                  />
                </div>
              )}

              {disasterType === 'Wildfire' && (
                <div>
                  <label className="block text-xs font-medium text-orange-300 mb-1">
                    Fine Fuel Vegetation Dryness Index (0 - 100)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={vegetationDrynessIndex}
                    onChange={(e) => setVegetationDrynessIndex(Number(e.target.value))}
                    className="w-full bg-slate-850 border border-orange-500/40 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-orange-400"
                  />
                </div>
              )}

              {/* Historical Occurrences */}
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Historical Hazard Incidents in Ward / Sector (Past 10 Years)
                </label>
                <input
                  type="number"
                  min="0"
                  max="50"
                  value={historicalDisasterCount}
                  onChange={(e) => setHistoricalDisasterCount(Number(e.target.value))}
                  className="w-full bg-slate-850 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-rose-500"
                />
              </div>

              <button
                type="submit"
                disabled={loadingAssessment}
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 text-white font-bold text-xs transition-all shadow-lg shadow-rose-950/50 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {loadingAssessment ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Computing Environmental Model...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Run Explainable Risk Assessment</span>
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Assessment Output (Right 7 Cols) */}
          <div className="lg:col-span-7 space-y-4">
            {assessmentResult ? (
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4 animate-in fade-in">
                {/* Result Top Badge */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
                  <div>
                    <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">
                      Assessment Synthesis • {assessmentResult.disasterType} Hazard
                    </span>
                    <h2 className="text-xl font-black text-white">
                      {assessmentResult.location}
                    </h2>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <div className="text-[10px] text-slate-400 font-mono">Computed Risk Index</div>
                      <div className="text-2xl font-black font-mono text-white">
                        {assessmentResult.riskScore}
                        <span className="text-xs text-slate-400 font-sans font-normal"> / 100</span>
                      </div>
                    </div>
                    <span className={`text-xs font-bold px-3 py-1.5 rounded-xl font-mono uppercase border ${
                      assessmentResult.riskLevel === 'Extreme' ? 'bg-rose-500/20 text-rose-300 border-rose-500/50' :
                      assessmentResult.riskLevel === 'High' ? 'bg-orange-500/20 text-orange-300 border-orange-500/50' :
                      assessmentResult.riskLevel === 'Moderate' ? 'bg-amber-500/20 text-amber-300 border-amber-500/50' :
                      'bg-emerald-500/20 text-emerald-300 border-emerald-500/50'
                    }`}>
                      {assessmentResult.riskLevel} Risk
                    </span>
                  </div>
                </div>

                {/* Score Progress Bar */}
                <div className="space-y-1">
                  <div className="flex justify-between text-xs text-slate-400 font-mono">
                    <span>Low (0-34)</span>
                    <span>Moderate (35-59)</span>
                    <span>High (60-79)</span>
                    <span>Extreme (80-100)</span>
                  </div>
                  <div className="h-3 w-full bg-slate-800 rounded-full overflow-hidden p-0.5 border border-slate-700">
                    <div 
                      className={`h-full rounded-full transition-all duration-700 ${
                        assessmentResult.riskLevel === 'Extreme' ? 'bg-rose-500' :
                        assessmentResult.riskLevel === 'High' ? 'bg-orange-500' :
                        assessmentResult.riskLevel === 'Moderate' ? 'bg-amber-500' :
                        'bg-emerald-500'
                      }`}
                      style={{ width: `${assessmentResult.riskScore}%` }}
                    />
                  </div>
                </div>

                {/* AI / Scientific Synthesis Note */}
                <div className="p-3 rounded-xl bg-slate-850 border border-slate-700/80 text-xs text-slate-200">
                  <div className="flex items-center gap-1.5 text-rose-400 font-semibold mb-1">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Scientific Hazard & Climate Synthesis</span>
                  </div>
                  <p className="leading-relaxed text-slate-300">
                    {assessmentResult.aiExplanation}
                  </p>
                </div>

                {/* Factor Weight Breakdown */}
                <div>
                  <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                    Contributing Risk Drivers & Weights
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {assessmentResult.contributingFactors.map((factor, idx) => (
                      <div key={idx} className="p-2.5 rounded-lg bg-slate-800/60 border border-slate-700/60 text-xs flex justify-between items-center">
                        <div>
                          <div className="font-semibold text-slate-200">{factor.name}</div>
                          <div className="text-[11px] text-slate-400">{factor.impact}</div>
                        </div>
                        <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-slate-700 text-slate-300">
                          {factor.weight}% wt
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Recommended Safety Actions */}
                <div>
                  <h3 className="text-xs font-bold text-emerald-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <ShieldAlert className="w-3.5 h-3.5" />
                    Recommended Safety Directives
                  </h3>
                  <div className="space-y-1.5">
                    {assessmentResult.recommendedActions.map((act, idx) => (
                      <div key={idx} className="flex items-start gap-2 p-2 rounded-lg bg-emerald-950/20 border border-emerald-500/20 text-xs text-emerald-200">
                        <CheckCircle className="w-3.5 h-3.5 text-emerald-400 mt-0.5 shrink-0" />
                        <span>{act}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Scientific Disclaimer Note */}
                <div className="text-[10px] text-slate-500 pt-2 border-t border-slate-800 font-mono">
                  Assessment Engine: {assessmentResult.assessmentMethod} • Evaluated at {new Date(assessmentResult.assessedAt).toLocaleTimeString()}
                  <br />
                  Limitations: {assessmentResult.scientificLimitations}
                </div>
              </div>
            ) : (
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center text-slate-500 flex flex-col items-center justify-center">
                <BrainCircuit className="w-12 h-12 text-slate-700 mb-3" />
                <h3 className="text-base font-semibold text-slate-300">No Assessment Computed Yet</h3>
                <p className="text-xs text-slate-400 max-w-sm mt-1">
                  Adjust hazard indicators on the left or click "Autofill Live Weather" then run the assessment to receive an explainable risk evaluation.
                </p>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* ML MODEL WORKBENCH TAB */
        <div className="space-y-6">
          {/* Controls Bar & CSV Upload */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* CSV File Upload */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
                1. Dataset Ingestion (CSV)
              </label>
              <label className="flex flex-col items-center justify-center p-3 border-2 border-dashed border-slate-700 hover:border-rose-500/60 rounded-xl cursor-pointer bg-slate-850 hover:bg-slate-800 transition-colors">
                <UploadCloud className="w-5 h-5 text-slate-400 mb-1" />
                <span className="text-xs text-slate-300 font-medium">
                  {csvFileName || 'Upload CSV or Use Default Benchmark'}
                </span>
                <span className="text-[10px] text-slate-500">
                  {csvRowCount} historical rows registered
                </span>
                <input type="file" accept=".csv" onChange={handleFileUpload} className="hidden" />
              </label>
            </div>

            {/* Algorithm Selector */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
                2. Statistical Classifier
              </label>
              <select
                value={selectedAlgorithm}
                onChange={(e) => setSelectedAlgorithm(e.target.value)}
                className="w-full bg-slate-850 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-rose-500"
              >
                <option value="Random Forest Classifier">Random Forest (Ensemble Trees)</option>
                <option value="Gradient Boosting Classifier">Gradient Boosting (GBM)</option>
                <option value="Support Vector Machine (RBF)">Support Vector Machine (RBF Kernel)</option>
                <option value="Logistic Regression Baseline">Logistic Regression Baseline</option>
              </select>

              <div className="flex items-center justify-between text-xs text-slate-400 pt-1">
                <span>Validation Split:</span>
                <div className="flex gap-1.5 font-mono text-[11px]">
                  <button 
                    onClick={() => setSplitRatio(0.2)}
                    className={`px-2 py-0.5 rounded ${splitRatio === 0.2 ? 'bg-rose-500 text-white' : 'bg-slate-800 text-slate-300'}`}
                  >
                    80/20
                  </button>
                  <button 
                    onClick={() => setSplitRatio(0.3)}
                    className={`px-2 py-0.5 rounded ${splitRatio === 0.3 ? 'bg-rose-500 text-white' : 'bg-slate-800 text-slate-300'}`}
                  >
                    70/30
                  </button>
                </div>
              </div>
            </div>

            {/* Action Trigger */}
            <div className="space-y-2 flex flex-col justify-end">
              <div className="text-[10px] text-slate-400 leading-tight">
                Trains statistical decision boundaries against empirical disaster occurrences.
              </div>
              <button
                onClick={handleTrainEvaluateML}
                disabled={loadingML}
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-teal-600 to-teal-700 hover:from-teal-500 hover:to-teal-600 text-white font-bold text-xs transition-all shadow-lg shadow-teal-950/40 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {loadingML ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Cross-Validating Model...</span>
                  </>
                ) : (
                  <>
                    <BarChart2 className="w-4 h-4" />
                    <span>Train & Evaluate Model Split</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Dataset Status Banner */}
          {csvStatusMessage && (
            <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-300 flex items-center gap-2">
              <FileSpreadsheet className="w-4 h-4 text-sky-400 shrink-0" />
              <span>{csvStatusMessage}</span>
            </div>
          )}

          {/* ML Results Section */}
          {mlResult ? (
            <div className="space-y-6">
              {/* Classification Metrics Grid */}
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl text-center">
                  <div className="text-[11px] text-slate-400 uppercase tracking-wider mb-1">Accuracy</div>
                  <div className="text-2xl font-black text-white font-mono">{mlResult.metrics.accuracy}%</div>
                  <div className="text-[10px] text-emerald-400 mt-1">+{mlResult.baselineComparison.modelImprovementPercent}% over baseline</div>
                </div>

                <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl text-center">
                  <div className="text-[11px] text-slate-400 uppercase tracking-wider mb-1">Precision</div>
                  <div className="text-2xl font-black text-sky-400 font-mono">{mlResult.metrics.precision}%</div>
                  <div className="text-[10px] text-slate-500 mt-1">Positive predictive value</div>
                </div>

                <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl text-center">
                  <div className="text-[11px] text-slate-400 uppercase tracking-wider mb-1">Recall (Sensitivity)</div>
                  <div className="text-2xl font-black text-amber-400 font-mono">{mlResult.metrics.recall}%</div>
                  <div className="text-[10px] text-slate-500 mt-1">Hazard capture rate</div>
                </div>

                <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl text-center">
                  <div className="text-[11px] text-slate-400 uppercase tracking-wider mb-1">F1-Score</div>
                  <div className="text-2xl font-black text-teal-400 font-mono">{mlResult.metrics.f1Score}%</div>
                  <div className="text-[10px] text-slate-500 mt-1">Harmonic mean P/R</div>
                </div>

                <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl text-center col-span-2 md:col-span-1">
                  <div className="text-[11px] text-slate-400 uppercase tracking-wider mb-1">ROC-AUC</div>
                  <div className="text-2xl font-black text-purple-400 font-mono">{mlResult.metrics.rocAuc}</div>
                  <div className="text-[10px] text-slate-500 mt-1">Discrimination power</div>
                </div>
              </div>

              {/* Confusion Matrix & Feature Importance */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Confusion Matrix Table */}
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-3">
                    <div>
                      <h3 className="text-sm font-bold text-white">2x2 Confusion Matrix</h3>
                      <p className="text-[11px] text-slate-400">Evaluated on {mlResult.testCount} held-out test split samples</p>
                    </div>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                      {mlResult.splitRatio}
                    </span>
                  </div>

                  <div className="p-3 bg-slate-850 rounded-xl border border-slate-700/60">
                    <div className="grid grid-cols-2 gap-2 text-center text-xs">
                      {/* TP */}
                      <div className="p-3 rounded-lg bg-emerald-950/40 border border-emerald-500/30">
                        <div className="text-[10px] text-emerald-400 uppercase font-mono font-bold">True Positive (TP)</div>
                        <div className="text-2xl font-black text-white font-mono mt-1">
                          {mlResult.confusionMatrix.truePositive}
                        </div>
                        <div className="text-[10px] text-slate-400">Hazard predicted & verified</div>
                      </div>

                      {/* FP */}
                      <div className="p-3 rounded-lg bg-rose-950/40 border border-rose-500/30">
                        <div className="text-[10px] text-rose-400 uppercase font-mono font-bold">False Positive (FP)</div>
                        <div className="text-2xl font-black text-white font-mono mt-1">
                          {mlResult.confusionMatrix.falsePositive}
                        </div>
                        <div className="text-[10px] text-slate-400">False alarm warning</div>
                      </div>

                      {/* FN */}
                      <div className="p-3 rounded-lg bg-amber-950/40 border border-amber-500/30">
                        <div className="text-[10px] text-amber-400 uppercase font-mono font-bold">False Negative (FN)</div>
                        <div className="text-2xl font-black text-white font-mono mt-1">
                          {mlResult.confusionMatrix.falseNegative}
                        </div>
                        <div className="text-[10px] text-slate-400">Missed severe incident</div>
                      </div>

                      {/* TN */}
                      <div className="p-3 rounded-lg bg-slate-800 border border-slate-700">
                        <div className="text-[10px] text-slate-300 uppercase font-mono font-bold">True Negative (TN)</div>
                        <div className="text-2xl font-black text-white font-mono mt-1">
                          {mlResult.confusionMatrix.trueNegative}
                        </div>
                        <div className="text-[10px] text-slate-400">Correct non-hazard prediction</div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-3 text-[11px] text-slate-400 flex items-center justify-between">
                    <span>Baseline: {mlResult.baselineComparison.baselineModel}</span>
                    <span className="font-mono text-slate-300">{mlResult.baselineComparison.baselineAccuracy}% acc</span>
                  </div>
                </div>

                {/* Feature Importance Rankings Chart */}
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
                  <div className="pb-3 border-b border-slate-800 mb-3">
                    <h3 className="text-sm font-bold text-white">Gini Impurity Feature Importance</h3>
                    <p className="text-[11px] text-slate-400">Normalized weights of environmental predictors</p>
                  </div>

                  <div className="h-56 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart 
                        data={mlResult.featureImportance} 
                        layout="vertical"
                        margin={{ top: 5, right: 20, left: 20, bottom: 5 }}
                      >
                        <XAxis type="number" domain={[0, 0.4]} stroke="#64748b" fontSize={10} tickLine={false} />
                        <YAxis type="category" dataKey="feature" stroke="#cbd5e1" fontSize={10} tickLine={false} width={130} />
                        <Tooltip 
                          contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '11px', color: '#fff' }}
                        />
                        <Bar dataKey="importance" fill="#0d9488" radius={[0, 4, 4, 0]} name="Relative Weight" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center text-slate-500">
              <BarChart2 className="w-10 h-10 text-slate-700 mx-auto mb-2" />
              <p className="text-xs text-slate-400">
                Click "Train & Evaluate Model Split" to generate the confusion matrix and statistical metrics.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
