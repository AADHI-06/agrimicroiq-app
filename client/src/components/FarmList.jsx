import React, { useState, useEffect } from 'react';
import api from '../services/api';
import HistoryChart from './HistoryChart';
import FarmMap from './MapContainer';

const FarmList = () => {
  const [farms, setFarms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [generatingId, setGeneratingId] = useState(null);

  // Nested Zone & Pest Memory Storage Models
  const [farmZones, setFarmZones] = useState({});
  const [pestRisks, setPestRisks] = useState({});
  const [predictingZoneId, setPredictingZoneId] = useState(null);
  
  const [resourceOpts, setResourceOpts] = useState({});
  const [optimizingZoneId, setOptimizingZoneId] = useState(null);

  const [yieldSimulations, setYieldSimulations] = useState({});
  const [simulatingYieldId, setSimulatingYieldId] = useState(null);
  
  // Phase 72 Action Planner Integrations natively mapping priority structures
  const [actionPlans, setActionPlans] = useState({});
  const [generatingActionId, setGeneratingActionId] = useState(null);

  // Phase 73 Integration Trackers generating demo load dependencies
  const [stressingId, setStressingId] = useState(null);

  const [showHistory, setShowHistory] = useState({});
  const [cardView, setCardView] = useState({}); // { [farmId]: 'telemetry' | 'trends' }
  const [revealedStates, setRevealedStates] = useState({}); // { [zoneId]: { predicted: bool, optimized: bool, actioned: bool } }

  useEffect(() => {
    const fetchFarms = async () => {
      try {
        setLoading(true);
        const response = await api.get('/farms');
        const farmData = Array.isArray(response.data) ? response.data : (response.data.farms || []);
        setFarms(farmData);
        setError(null);
      } catch (err) {
        console.error("Error fetching farms:", err);
        setError("Failed to load farms. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchFarms();
  }, []);

  const handleGenerateNDVI = async (farmId) => {
    try {
      setGeneratingId(farmId);
      console.log(`Triggering Sentinel Hub NDVI Engine for Farm: ${farmId}...`);
      
      const response = await api.post('/satellite/ndvi', { farmId });
      
      console.log('✅ NDVI Satellite Output Successfully Generated:', response.data);
      
      // Save returning zones mapped strictly securely onto Farm
      if (response.data.micro_zones) {
        setFarmZones(prev => ({ ...prev, [farmId]: response.data.micro_zones }));
      }

      alert('NDVI Extracted Successfully! Map rendering complete.');
    } catch (err) {
      console.error('❌ NDVI Fetch Error:', err.response?.data || err.message);
      alert('Failed to generate NDVI map. See console API logs.');
    } finally {
      setGeneratingId(null);
    }
  };

  const handlePredictPest = async (zoneId) => {
    try {
      setPredictingZoneId(zoneId);
      const response = await api.post('/pest/predict', { zoneId });
      
      const riskLevel = response.data.riskLevel || response.data.risk_level || 'UNKNOWN';
      const probability = response.data.probability || 0;
      const predictedPest = response.data.predictedPest || 'Unknown';
      
      setPestRisks(prev => ({
        ...prev,
        [zoneId]: { riskLevel, probability, predictedPest }
      }));
      
      setRevealedStates(prev => ({
        ...prev,
        [zoneId]: { ...(prev[zoneId] || {}), predicted: true }
      }));
      
      
    } catch (err) {
      console.error('❌ Pest Prediction Error:', err);
      alert('Failed to execute ML Pest Prediction. Review API boundaries.');
    } finally {
      setPredictingZoneId(null);
    }
  };

  const handleOptimizeResources = async (zoneId) => {
    try {
      setOptimizingZoneId(zoneId);
      const response = await api.post('/resource/optimize', { zoneId });
      
      const fert = response.data.recommendation?.recommended_fertilizer_kg || response.data.recommended_fertilizer_kg || 0;
      const water = response.data.recommendation?.recommended_water_liters || response.data.recommended_water_liters || 0;
      
      setResourceOpts(prev => ({
        ...prev,
        [zoneId]: { fert, water }
      }));
      
      setRevealedStates(prev => ({
        ...prev,
        [zoneId]: { ...(prev[zoneId] || {}), optimized: true }
      }));
      
      
    } catch (err) {
      console.error('❌ Resource Optimization Error:', err);
      alert('Failed to optimize resources. See console logs.');
    } finally {
      setOptimizingZoneId(null);
    }
  };

  const handleSimulateYield = async (farmId) => {
    try {
      setSimulatingYieldId(farmId);
      const response = await api.post('/yield/simulate', { farmId });
      
      setYieldSimulations(prev => ({
        ...prev,
        [farmId]: response.data
      }));
      
    } catch (err) {
      console.error('❌ Yield Simulation Error:', err);
      const status = err.response?.status;
      const detail = err.response?.data?.error || err.response?.data?.detail || err.message;
      if (status === 502 || status === 503) {
        alert('ML Service is waking up (Render cold start). Please wait 30 seconds and try again.');
      } else {
        alert(`Yield simulation failed (${status || 'network'}): ${detail}`);
      }
    } finally {
      setSimulatingYieldId(null);
    }
  };

  const handleGenerateAction = async (zoneId) => {
    try {
      setGeneratingActionId(zoneId);
      const response = await api.post('/actions/generate', { zoneId });
      
      setActionPlans(prev => ({
        ...prev,
        [zoneId]: response.data
      }));

      setRevealedStates(prev => ({
        ...prev,
        [zoneId]: { ...(prev[zoneId] || {}), actioned: true }
      }));
      
    } catch (err) {
      console.error('❌ Action Generate Error:', err);
      alert('Failed to generate action plan. Make sure to run Pest & Resource models first.');
    } finally {
      setGeneratingActionId(null);
    }
  };

  const handleSimulateStress = async (farmId) => {
    try {
      setStressingId(farmId);
      const response = await api.post('/demo/stress', { farmId });
      
      // Parse normalized arrays mapping explicitly through the global API structural wrapper natively
      const payloadData = response.data.data ? response.data.data : response.data;
      const actualZone = payloadData.zone;
      const actualPest = payloadData.pest;

      if (actualZone) {
        setFarmZones(prev => ({
          ...prev,
          [farmId]: [...(prev[farmId] || []), actualZone]
        }));
      }

      if (actualPest && actualZone?.id) {
        setPestRisks(prev => ({
          ...prev,
          [actualZone.id]: {
            riskLevel: actualPest.risk_level,
            probability: actualPest.probability,
            predictedPest: actualPest.predicted_pest
          }
        }));
        // Note: We deliberately DO NOT set revealedStates here.
        // This ensures the user still has to click "Predict Pest Risk" to see the injected data.
      }

    } catch (err) {
      console.error('❌ Demo Stress Error:', err);
      alert('Failed to execute simulation stress routines natively.');
    } finally {
      setStressingId(null);
    }
  };
  
  const renderTelemetryGrid = (farmId) => {
    const zones = farmZones[farmId] || [];
    if (zones.length === 0) return (
      <div className="py-12 text-center border border-dashed border-white/10">
        <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.3em]">No Active Nodes</p>
      </div>
    );

    return (
      <div className="grid grid-cols-1 gap-6 max-h-[500px] overflow-y-auto pr-2 editorial-scrollbar text-left">
        {zones.map(zone => {
          const revealed = revealedStates[zone.id] || {};
          const pest = pestRisks[zone.id];
          const resource = resourceOpts[zone.id];
          const plan = actionPlans[zone.id];

          return (
            <div key={zone.id} className="editorial-card p-6 flex flex-col gap-6 group/node hover:border-white/10 transition-all">
              {/* Node Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className={`w-2 h-2 rounded-full ${zone.ndvi_value > 0.6 ? 'bg-blue-500' : zone.ndvi_value > 0.4 ? 'bg-orange-500' : 'bg-red-500'} shadow-[0_0_10px_rgba(59,130,246,0.5)]`} />
                  <div>
                    <p className="text-[10px] font-black text-white/30 uppercase tracking-[0.3em] mb-1">Sector Node {zone.id.split('-')[0]}</p>
                    <div className="flex items-center gap-4">
                       <p className="text-2xl font-black text-white italic">{(zone.ndvi_value || 0).toFixed(3)}</p>
                       <span className="text-[9px] font-black text-white/20 uppercase tracking-widest border-l border-white/10 pl-4">NDVI Analysis</span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                   <p className="text-[9px] font-black text-white/20 uppercase tracking-widest mb-1">Status Criticality</p>
                   <p className={`text-xs font-black uppercase tracking-[0.2em] ${zone.risk_level === 'High' ? 'text-red-500' : 'text-blue-500'}`}>
                     {zone.risk_level || 'Safe'}
                   </p>
                </div>
              </div>

              {/* Action Buttons Row */}
              <div className="grid grid-cols-3 gap-3">
                <button 
                  onClick={() => handlePredictPest(zone.id)}
                  disabled={predictingZoneId === zone.id || revealed.predicted}
                  className={`py-3 text-[9px] font-black uppercase tracking-widest border transition-all ${
                    revealed.predicted 
                    ? 'border-white/5 text-white/20 cursor-default' 
                    : 'border-white/10 text-white/60 hover:bg-white hover:text-black'
                  }`}
                >
                  {predictingZoneId === zone.id ? 'Analyzing...' : revealed.predicted ? 'Pathology Saved' : 'Predict Pest'}
                </button>
                <button 
                  onClick={() => handleOptimizeResources(zone.id)}
                  disabled={optimizingZoneId === zone.id || revealed.optimized}
                  className={`py-3 text-[9px] font-black uppercase tracking-widest border transition-all ${
                    revealed.optimized 
                    ? 'border-white/5 text-white/20 cursor-default' 
                    : 'border-white/10 text-white/60 hover:bg-white hover:text-black'
                  }`}
                >
                  {optimizingZoneId === zone.id ? 'Calibrating...' : revealed.optimized ? 'Resources Fixed' : 'Optimize'}
                </button>
                <button 
                  onClick={() => handleGenerateAction(zone.id)}
                  disabled={generatingActionId === zone.id || revealed.actioned}
                  className={`py-3 text-[9px] font-black uppercase tracking-widest border transition-all ${
                    revealed.actioned 
                    ? 'border-white/5 text-white/20 cursor-default' 
                    : 'border-white/10 text-white/60 hover:bg-white hover:text-black'
                  }`}
                >
                  {generatingActionId === zone.id ? 'Synthesizing...' : revealed.actioned ? 'Plan Finalized' : 'Gen Action'}
                </button>
              </div>

              {/* Results Reveal Section */}
              {(revealed.predicted || revealed.optimized || revealed.actioned) && (
                <div className="grid grid-cols-1 gap-4 pt-4 border-t border-white/5">
                  {revealed.predicted && pest && (
                    <div className="flex items-center justify-between p-4 bg-white/[0.02] border border-white/5">
                       <div className="flex flex-col">
                        <span className="text-[8px] font-black text-white/20 uppercase tracking-widest">ML Prediction</span>
                        <p className="text-xs font-black text-white uppercase mt-1">{pest.predictedPest}</p>
                       </div>
                       <div className="text-right">
                        <span className="text-[8px] font-black text-white/20 uppercase tracking-widest">Confidence</span>
                        <p className="text-xs font-black text-orange-500 mt-1">{(pest.probability * 100).toFixed(1)}%</p>
                       </div>
                    </div>
                  )}

                  {revealed.optimized && resource && (
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-4 bg-white/[0.02] border border-white/5">
                        <span className="text-[8px] font-black text-white/20 uppercase tracking-widest">Hydration Req.</span>
                        <p className="text-lg font-black text-blue-500 mt-1">{resource.water}L</p>
                      </div>
                      <div className="p-4 bg-white/[0.02] border border-white/5">
                        <span className="text-[8px] font-black text-white/20 uppercase tracking-widest">Nitrogen Fix</span>
                        <p className="text-lg font-black text-orange-500 mt-1">{resource.fert}kg</p>
                      </div>
                    </div>
                  )}

                  {revealed.actioned && plan && (
                    <div className="p-5 bg-blue-500/5 border border-blue-500/20">
                       <div className="flex items-center justify-between mb-3">
                         <span className="text-[9px] font-black text-blue-500 uppercase tracking-widest">Operation Plan</span>
                         <span className="px-2 py-0.5 bg-blue-500 text-black text-[8px] font-bold uppercase tracking-tight">
                           {plan.priorityScore >= 0.7 ? 'Critical' : plan.priorityScore >= 0.4 ? 'Elevated' : 'Routine'} Priority
                         </span>
                       </div>
                       <p className="text-[11px] font-medium text-white/80 leading-relaxed italic">
                         {plan.actionType || 'Standard operational procedures active.'}
                       </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center p-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
        <span className="ml-3 text-gray-500 font-medium">Loading your farms...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-red-50 border border-red-200 rounded-lg text-red-600 text-center">
        {error}
      </div>
    );
  }

  if (farms.length === 0) {
    return (
      <div className="p-8 text-center bg-white/5 border border-white/5">
        <h3 className="text-lg font-black text-white uppercase mb-2">No Farms Found</h3>
        <p className="text-white/40 text-[10px] uppercase font-bold tracking-widest">You have not registered any farms yet.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12 animate-reveal">
      {farms.map((farm) => (
        <div key={farm.id} className="editorial-card group flex flex-col min-h-[500px] relative">
          {/* Masked Mini-Map Top Section */}
          <div className="h-56 relative overflow-hidden border-b border-white/5 bg-black">
            <div className="absolute inset-0 z-0 grayscale opacity-40 group-hover:grayscale-0 group-hover:opacity-100 transition-all duration-700">
               <FarmMap 
                 zones={farmZones[farm.id] || []} 
                 farmBoundary={farm.geo_polygon} 
                 farmLabel={null}
                 height="100%" 
               />
            </div>
            {/* Editorial Mask Layer */}
            <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent z-10" />
            
            <div className="absolute top-6 left-6 z-20">
              <span className="text-[10px] font-black uppercase tracking-[0.4em] text-white/40 group-hover:text-orange-500 transition-colors">
                Node ID: {farm.id.split('-')[0]}
              </span>
            </div>
          </div>

          <div className="p-8 flex-1 flex flex-col">
            <div className="mb-6">
              <div className="flex items-center gap-3 mb-2">
                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-orange-500 bg-orange-500/10 px-3 py-1 border border-orange-500/20">
                  {farm.crop_type}
                </span>
              </div>
              <h3 className="text-3xl font-black text-white tracking-tighter leading-none group-hover:italic transition-all">
                {farm.farm_name}
              </h3>
            </div>

            <div className="grid grid-cols-2 gap-8 mb-10 pb-6 border-b border-white/5">
              <div className="flex flex-col gap-2">
                <p className="text-[9px] font-black uppercase tracking-[0.2em] text-white/30 truncate">Target Yield Projection</p>
                {yieldSimulations[farm.id] ? (
                  <div className="flex flex-col">
                    <div className="flex items-baseline gap-2">
                      <span className="text-3xl font-black text-white italic">{yieldSimulations[farm.id].optimized.yield}</span>
                      <span className="text-[10px] font-black text-blue-500">+{yieldSimulations[farm.id].gain_pct}% Gain</span>
                    </div>
                    <p className="text-[9px] font-medium text-white/20 italic">Baseline: {yieldSimulations[farm.id].current.yield}</p>
                  </div>
                ) : (
                  <p className="text-2xl font-black text-white/10">—</p>
                )}
              </div>
              <div className="flex flex-col gap-2">
                <p className="text-[9px] font-black uppercase tracking-[0.2em] text-white/30 truncate">Projected Net Profit</p>
                {yieldSimulations[farm.id] ? (
                  <div className="flex flex-col">
                    <div className="flex items-baseline gap-2">
                       <span className="text-3xl font-black text-white">{yieldSimulations[farm.id].optimized.profit}</span>
                    </div>
                    <p className="text-[9px] font-medium text-white/20 italic">Baseline: {yieldSimulations[farm.id].current.profit}</p>
                  </div>
                ) : (
                  <p className="text-2xl font-black text-white/10">—</p>
                )}
              </div>
            </div>

            <div className="flex flex-col gap-3 mt-auto">
              <div className="flex gap-3">
                <button 
                  onClick={() => handleSimulateYield(farm.id)}
                  disabled={simulatingYieldId === farm.id}
                  className="flex-1 button-editorial text-[9px] py-4"
                >
                  {simulatingYieldId === farm.id ? 'Computing...' : 'Simulate Growth'}
                </button>
                <button 
                  onClick={() => handleGenerateNDVI(farm.id)}
                  disabled={generatingId === farm.id}
                  className="flex-1 button-editorial bg-white text-black py-4"
                >
                  {generatingId === farm.id ? 'Satellite Link...' : 'Scan NDVI'}
                </button>
              </div>
              
              <button 
                onClick={() => handleSimulateStress(farm.id)}
                disabled={stressingId === farm.id}
                className="w-full text-[9px] font-black uppercase tracking-[0.3em] text-red-500/60 hover:text-red-500 transition-all border border-red-500/10 hover:border-red-500/40 py-3 mt-2"
              >
                {stressingId === farm.id ? 'Inhibiting...' : 'Inject Stress Simulation'}
              </button>
            </div>

            {/* Micro-node Overlay info if active */}
            {farmZones[farm.id]?.length > 0 && (
              <div className="mt-8 pt-6 border-t border-white/5 flex items-center justify-between">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40">
                  {farmZones[farm.id].length} Active Telemetry Nodes
                </p>
                <button 
                  onClick={() => setShowHistory(prev => ({ ...prev, [farm.id]: !prev[farm.id] }))}
                  className="text-white text-lg hover:scale-125 transition-transform"
                >
                  {showHistory[farm.id] ? '↑' : '↓'}
                </button>
              </div>
            )}
            
            {showHistory[farm.id] && (
               <div className="mt-8 animate-reveal">
                 <div className="flex items-center gap-4 mb-8">
                    <button 
                      onClick={() => setCardView(prev => ({ ...prev, [farm.id]: 'telemetry' }))}
                      className={`text-[9px] font-black uppercase tracking-[0.3em] pb-2 border-b-2 transition-all ${
                        (cardView[farm.id] || 'telemetry') === 'telemetry' 
                        ? 'text-orange-500 border-orange-500' 
                        : 'text-white/20 border-transparent hover:text-white'
                      }`}
                    >
                      Telemetry Analysis
                    </button>
                    <button 
                      onClick={() => setCardView(prev => ({ ...prev, [farm.id]: 'trends' }))}
                      className={`text-[9px] font-black uppercase tracking-[0.3em] pb-2 border-b-2 transition-all ${
                        cardView[farm.id] === 'trends' 
                        ? 'text-orange-500 border-orange-500' 
                        : 'text-white/20 border-transparent hover:text-white'
                      }`}
                    >
                      Historical Trends
                    </button>
                 </div>

                 { (cardView[farm.id] || 'telemetry') === 'telemetry' ? (
                   renderTelemetryGrid(farm.id)
                 ) : (
                   <HistoryChart farmId={farm.id} />
                 )}
               </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

export default FarmList;
