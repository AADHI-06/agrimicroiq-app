import React, { useState, useEffect } from 'react';
import FarmList from '../components/FarmList';
import FarmMap from '../components/MapContainer';
import api from '../services/api';
import { useFarm } from '../context/FarmContext';

const Dashboard = ({ user, onLogout, onNavigate }) => {
  const [activeTab, setActiveTab] = useState('overview');
  const { farms, selectedFarm, setSelectedFarm, loading: farmsLoading } = useFarm();

  // Dashboard summary data
  const [summary, setSummary] = useState(null);
  const [summaryLoading, setSummaryLoading] = useState(true);

  // Phase 74: Federated Aggregation States
  const [isAggregating, setIsAggregating] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [modelVersion, setModelVersion] = useState(null);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  
  // Phase 7: Report Generation States
  const [downloadingId, setDownloadingId] = useState(null);

  // Fetch dashboard summary
  useEffect(() => {
    const fetchSummary = async () => {
      try {
        setSummaryLoading(true);
        const response = await api.get('/pest/summary');
        setSummary(response.data);
      } catch (err) {
        console.error("Dashboard summary error:", err);
      } finally {
        setSummaryLoading(false);
      }
    };
    fetchSummary();
  }, []);

  const handleFederatedAggregation = async () => {
    try {
      setIsAggregating(true);
      const response = await api.post('/federated/aggregate');
      const data = response.data.data || response.data;
      const newVersion = data.version;
      if (newVersion) setModelVersion(newVersion);
      
      if (data.message && data.message.includes("storage unavailable")) {
        alert("Success: Parameters computed locally, but database storage is currently unavailable.");
      } else {
        alert(`Success: Global ML model aggregated to version v${newVersion}`);
      }
    } catch (error) {
      console.error("Aggregation Error:", error);
      const msg = error.response?.data?.error || "Ensure you have run at least one 'Predict Pest Risk' on a zone to provide data for aggregation.";
      alert(`ML Aggregation: ${msg}`);
    } finally {
      setIsAggregating(false);
    }
  };

  const refreshSummary = async () => {
    try {
      setIsRefreshing(true);
      const response = await api.get('/pest/summary');
      setSummary(response.data);
      // Brief delay to show work
      setTimeout(() => setIsRefreshing(false), 500);
    } catch (err) {
      console.error("Refresh error:", err);
      setIsRefreshing(false);
    }
  };

  const handleDownloadReport = async (farmId, farmName) => {
    try {
      setDownloadingId(farmId);
      console.log(`Requesting PDF Generation for: ${farmName}...`);
      
      const response = await api.post('/report/generate', { farmId }, {
        responseType: 'blob'
      });

      // Create blob URL and trigger download
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `AgriMicro_Report_${farmName.replace(/\s+/g, '_')}.pdf`);
      document.body.appendChild(link);
      link.click();
      
      // Cleanup
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Report Download Error:", err);
      alert("Failed to generate PDF report. Ensure you have run NDVI analysis and ML simulations first.");
    } finally {
      setDownloadingId(null);
    }
  };

  // Derived data based on selected farm from context
  const filteredZones = selectedFarm
    ? (summary?.zones || []).filter(z => z.farm_id === selectedFarm.id)
    : (summary?.zones || []);

  const filteredPests = selectedFarm
    ? (summary?.recentPests || []).filter(p => {
        const zoneIds = filteredZones.map(z => z.id);
        return zoneIds.includes(p.zone_id);
      })
    : (summary?.recentPests || []);

  const filteredRiskCounts = (() => {
    const counts = { High: 0, Medium: 0, Low: 0 };
    filteredPests.forEach(p => {
      if (p.risk_level in counts) counts[p.risk_level]++;
    });
    return counts;
  })();

  const sidebarItems = [
    { key: 'overview', label: 'Overview', icon: '📊' },
    { key: 'farm-map', label: 'Farm Map', icon: '🗺️' },
    { key: 'analytics', label: 'Analytics', icon: '📈' },
    { key: 'pest-risks', label: 'Pest Risks', icon: '🐛' },
    { key: 'reports', label: 'Reports', icon: '📄' }
  ];

  const getRiskColor = (level) => {
    const l = (level || '').toUpperCase();
    if (l === 'HIGH') return { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200', dot: 'bg-red-500' };
    if (l === 'MEDIUM') return { bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200', dot: 'bg-orange-500' };
    return { bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-200', dot: 'bg-green-500' };
  };

  // Farm Switcher component
  const FarmSwitcher = () => (
    <div className="relative group">
      <select
        value={selectedFarm?.id || 'all'}
        onChange={(e) => {
          const val = e.target.value;
          if (val === 'all') {
            setSelectedFarm(null);
          } else {
            const farm = farms.find(f => f.id === val);
            if (farm) setSelectedFarm(farm);
          }
        }}
        className="appearance-none bg-transparent border-b border-white/20 text-white text-[10px] font-black uppercase tracking-[0.2em] px-4 py-2 pr-12 focus:outline-none focus:border-orange-500 cursor-pointer transition-all"
      >
        <option value="all" className="bg-black text-white">All Estates</option>
        {farms.map(farm => (
          <option key={farm.id} value={farm.id} className="bg-black text-white">
            {farm.farm_name} — {farm.crop_type}
          </option>
        ))}
      </select>
      <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-white/40 group-hover:text-orange-500 transition-colors">
        ↓
      </div>
    </div>
  );

  // Render main content based on active tab
  const renderContent = () => {
    switch (activeTab) {
      case 'farm-map':
        return (
          <div className="animate-reveal">
            <div className="flex items-center justify-between mb-12">
              <div>
                <h3 className="text-[10px] font-black text-blue-500 uppercase tracking-[0.5em] mb-3">Cartographic Intel</h3>
                <h2 className="text-5xl font-black text-white tracking-tighter italic uppercase">
                  {selectedFarm ? `${selectedFarm.farm_name} — Clusters` : 'Global Sector Map'}
                </h2>
              </div>
              <FarmSwitcher />
            </div>

            {selectedFarm && !selectedFarm.geo_polygon && (
              <div className="mb-12 p-6 bg-yellow-500/10 border border-yellow-500/20 text-yellow-500 text-[10px] font-black uppercase tracking-widest">
                ⚠️ Satellite boundary definition missing for this sector.
              </div>
            )}

            <div className="editorial-card h-[600px] relative group/bigmap overflow-hidden mb-12">
              <div className="absolute inset-0 z-0 grayscale-[0.3] group-hover/bigmap:grayscale-0 transition-all duration-1000">
                <FarmMap 
                  zones={filteredZones} 
                  farmBoundary={selectedFarm?.geo_polygon || null}
                  farmLabel={selectedFarm ? { name: selectedFarm.farm_name, cropType: selectedFarm.crop_type } : null}
                  height="100%" 
                />
              </div>
              <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/20 pointer-events-none" />
            </div>

            {filteredZones.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
                {filteredZones.map(z => (
                  <div key={z.id} className="p-6 bg-white/[0.02] border border-white/5 flex flex-col items-center justify-center text-center group hover:bg-white/5 transition-colors">
                    <p className="text-[8px] font-black text-white/20 uppercase tracking-widest mb-3 whitespace-nowrap truncate w-full">{z.farm_name}</p>
                    <p className="text-3xl font-black text-blue-500 tracking-tighter italic">{z.ndvi_value?.toFixed(3)}</p>
                    <p className="text-[9px] font-black text-white/40 uppercase tracking-[0.2em] mt-1">NDVI</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        );

      case 'pest-risks':
        return (
          <div className="animate-reveal">
            <div className="flex items-center justify-between mb-12">
              <div>
                <h3 className="text-[10px] font-black text-orange-500 uppercase tracking-[0.5em] mb-3">Pathology Analysis</h3>
                <h2 className="text-5xl font-black text-white tracking-tighter italic uppercase">Pest Risk Matrix</h2>
              </div>
              <div className="flex items-center gap-6">
                <button 
                  onClick={handleFederatedAggregation}
                  disabled={isAggregating}
                  className="button-editorial px-8 py-3 bg-blue-500 text-black border-none hover:bg-white transition-all text-[9px] font-black uppercase tracking-widest flex items-center gap-3"
                >
                  {isAggregating ? (
                    <>
                      <div className="w-3 h-3 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                      Aggregating Intelligence...
                    </>
                  ) : (
                    <>
                      <span className="text-sm">🌐</span>
                      Aggregate Global Intelligence
                    </>
                  )}
                </button>
                <FarmSwitcher />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mb-12 pb-12 border-b border-white/5">
              {['High', 'Medium', 'Low'].map(level => {
                const count = filteredRiskCounts[level] || 0;
                return (
                  <div key={level} className="editorial-card p-12 text-center group">
                    <p className={`text-7xl font-black mb-4 transition-all ${
                      level === 'High' ? 'text-red-500' : level === 'Medium' ? 'text-orange-500' : 'text-blue-500'
                    }`}>
                      {count}
                    </p>
                    <p className="text-[10px] font-black text-white/40 uppercase tracking-[0.3em]">{level} Criticality</p>
                  </div>
                );
              })}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
              <div className="editorial-card p-10">
                <h4 className="text-[10px] font-black text-white/40 uppercase tracking-[0.3em] mb-8">Incident Log</h4>
                {renderPestList()}
              </div>
              <div className="editorial-card p-10 border-blue-500/20">
                <h4 className="text-[10px] font-black text-blue-500 uppercase tracking-[0.3em] mb-8">Risk Intelligence</h4>
                {renderMLInsights()}
              </div>
            </div>
          </div>
        );

      case 'analytics':
        return (
          <div className="animate-reveal">
            <div className="flex items-center justify-between mb-12">
              <div>
                <h3 className="text-[10px] font-black text-blue-500 uppercase tracking-[0.5em] mb-3">System Metrics</h3>
                <h2 className="text-5xl font-black text-white tracking-tighter italic uppercase">Analytics Grid</h2>
              </div>
              <FarmSwitcher />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
              <StatCard label="Registered Estates" value={selectedFarm ? 1 : (farms.length || 0)} />
              <StatCard label="Monitored Clusters" value={filteredZones.length} />
              <StatCard label="Critical Alerts" value={filteredRiskCounts.High || 0} />
              <StatCard label="ML Inferences" value={filteredPests.length} />
            </div>
            <div className="editorial-card p-12 bg-white/5 text-center">
              <p className="text-[10px] font-black text-white/40 uppercase tracking-[0.3em] italic">
                Cross-reference historical data within individual estate views for specialized yield modeling.
              </p>
            </div>
          </div>
        );

      case 'reports':
        return (
          <div className="animate-reveal">
            <div className="flex items-center justify-between mb-12">
              <div>
                <h3 className="text-[10px] font-black text-purple-500 uppercase tracking-[0.5em] mb-3">Documentation</h3>
                <h2 className="text-5xl font-black text-white tracking-tighter italic uppercase">Intelligence Logs</h2>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
              {farms.length === 0 ? (
                <div className="col-span-2 editorial-card p-24 text-center border-dashed border-white/10">
                  <p className="text-white/20 font-black uppercase tracking-[0.4em] text-[10px] mb-2">No Records Available</p>
                  <p className="text-white/40 text-xs italic">Synchronize infrastructure to generate documentation.</p>
                </div>
              ) : (
                farms.map(farm => (
                  <div key={farm.id} className="editorial-card p-10 flex flex-col group hover:border-white/20">
                    <div className="flex items-start justify-between mb-8">
                       <span className="text-[10px] font-black uppercase tracking-widest text-white/30">
                        {farm.crop_type} Strategy
                      </span>
                      <span className="text-[8px] font-black uppercase tracking-widest text-white/20">v1.0 Standard</span>
                    </div>
                    
                    <h4 className="text-3xl font-black text-white tracking-tighter uppercase mb-8 group-hover:italic transition-all">
                      {farm.farm_name}
                    </h4>
                    
                    <button 
                      onClick={() => handleDownloadReport(farm.id, farm.farm_name)}
                      disabled={downloadingId === farm.id}
                      className="button-editorial w-full py-5 flex items-center justify-center gap-4 hover:bg-white hover:text-black transition-all"
                    >
                      {downloadingId === farm.id ? (
                        <>
                          <div className="w-3 h-3 border-2 border-black/30 border-t-black rounded-full animate-spin"></div>
                          Processing Documentation...
                        </>
                      ) : (
                        <>Generate Full Analysis PDF</>
                      )}
                    </button>
                  </div>
                ))
              )}
            </div>

            <div className="mt-20 p-10 editorial-card bg-orange-500/5 border-orange-500/10">
               <p className="text-[10px] font-black text-orange-500 uppercase tracking-[0.3em] mb-4">Operational Advisory</p>
               <p className="text-sm font-medium text-white/60 leading-relaxed italic">
                 Reports represent a fixed point in time. Recalibrate satellite NDVI and ML pathology models before final export for maximum precision.
               </p>
            </div>
          </div>
        );

      default: // overview
        return (
          <div className="animate-reveal">
            <div className="flex items-end justify-between mb-16 pb-8 border-b border-white/5">
              <div>
                <h3 className="text-[10px] font-black text-orange-500 uppercase tracking-[0.5em] mb-3">Enterprise Dashboard</h3>
                <h2 className="text-6xl font-black text-white tracking-tighter italic uppercase">Registered Estates</h2>
              </div>
              <p className="text-white/30 text-[10px] font-black uppercase tracking-[0.2em] max-w-[200px] text-right">
                Real-time telemetry from {farms.length} agricultural clusters.
              </p>
            </div>

            <FarmList />

            {/* Immersive Map Interface */}
            <div className="mt-24">
              <div className="flex items-center justify-between mb-12">
                <h3 className="text-4xl font-black text-white tracking-tighter italic uppercase">Satellite Intelligence</h3>
                <FarmSwitcher />
              </div>
              
              <div className="editorial-card h-[600px] relative group/bigmap overflow-hidden">
                <div className="absolute inset-0 z-0 grayscale-[0.3] group-hover/bigmap:grayscale-0 transition-all duration-1000">
                  {summaryLoading ? (
                    <div className="flex items-center justify-center h-full bg-black">
                      <div className="w-12 h-12 border-2 border-white/10 border-t-orange-500 rounded-full animate-spin"></div>
                    </div>
                  ) : (
                    <FarmMap 
                      zones={filteredZones} 
                      farmBoundary={selectedFarm?.geo_polygon || null}
                      farmLabel={selectedFarm ? { name: selectedFarm.farm_name, cropType: selectedFarm.crop_type } : null}
                      height="100%" 
                    />
                  )}
                </div>
                {/* Visual Overlay for Maps */}
                <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/40 pointer-events-none" />
              </div>
            </div>

            {/* Bottom Insight Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mt-24">
               <div className="editorial-card p-12">
                  <h4 className="text-[10px] font-black text-white/40 uppercase tracking-[0.3em] mb-12">System Action Plan</h4>
                  <div className="space-y-8">
                    {!summaryLoading && summary && (
                      <div className="grid grid-cols-3 gap-6">
                        {['High', 'Medium', 'Low'].map(level => (
                          <div key={level}>
                            <p className="text-4xl font-black text-white mb-1">{filteredRiskCounts[level] || 0}</p>
                            <p className="text-[9px] font-black text-white/20 uppercase tracking-widest">{level} Risks</p>
                          </div>
                        ))}
                      </div>
                    )}
                    <div>
                      <p className="text-[10px] font-black text-orange-500 uppercase tracking-widest mb-6">Pest Warnings</p>
                      {renderPestList()}
                    </div>
                  </div>
               </div>
               <div className="editorial-card p-12 border-blue-500/20">
                  <h4 className="text-[10px] font-black text-blue-500 uppercase tracking-[0.3em] mb-12">ML Synthesis</h4>
                  {renderMLInsights()}
               </div>
            </div>
          </div>
        );
    }
  };

  const renderPestList = () => {
    if (summaryLoading) {
      return <div className="text-[10px] font-black uppercase tracking-[0.2em] text-white/20 py-10">Initializing...</div>;
    }

    if (!filteredPests.length) {
      return (
        <div className="py-10 text-white/20 italic text-[10px] uppercase font-black tracking-widest">
          Telemetry silence. Run pathology scans.
        </div>
      );
    }

    return (
      <div className="space-y-4 max-h-[400px] overflow-y-auto pr-4 editorial-scrollbar">
        {filteredPests.map((pest, i) => {
          return (
            <div key={pest.id || i} className="flex items-center justify-between border-b border-white/5 pb-4">
              <div className="flex flex-col">
                <span className="text-xl font-black text-white tracking-tighter uppercase">{pest.predicted_pest}</span>
                <span className="text-[9px] font-black text-white/30 uppercase tracking-widest mt-1">Found in Micro-Zone Node</span>
              </div>
              <div className="text-right">
                <span className={`text-[10px] font-black uppercase tracking-widest px-3 py-1 border ${
                  pest.risk_level === 'High' ? 'text-red-500 border-red-500/20 bg-red-500/5' : 
                  pest.risk_level === 'Medium' ? 'text-orange-500 border-orange-500/20 bg-orange-500/5' : 
                  'text-blue-500 border-blue-500/20 bg-blue-500/5'
                }`}>
                  {pest.risk_level} — {(pest.probability * 100).toFixed(0)}%
                </span>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const renderMLInsights = () => {
    if (summaryLoading || !summary) {
      return <div className="text-xs text-white/20 font-black uppercase py-4">Loading...</div>;
    }

    const total = filteredPests.length || 0;
    const highPct = total > 0 ? ((filteredRiskCounts.High || 0) / total * 100).toFixed(0) : 0;
    const avgNdvi = filteredZones.length > 0
      ? (filteredZones.reduce((sum, z) => sum + (z.ndvi_value || 0), 0) / filteredZones.length).toFixed(2)
      : 'N/A';

    return (
      <div className="grid grid-cols-1 gap-6">
        <div className="flex justify-between items-end border-b border-white/5 pb-4">
          <span className="text-[10px] font-black text-white/30 uppercase tracking-[0.3em]">Aggregate NDVI</span>
          <span className="text-4xl font-black text-white tracking-tighter italic">{avgNdvi}</span>
        </div>
        <div className="flex justify-between items-end border-b border-white/5 pb-4">
          <span className="text-[10px] font-black text-white/30 uppercase tracking-[0.3em]">Critical Path Rate</span>
          <span className="text-4xl font-black text-red-500 tracking-tighter italic">{highPct}%</span>
        </div>
        <div className="flex justify-between items-end border-b border-white/5 pb-4">
          <span className="text-[10px] font-black text-white/30 uppercase tracking-[0.3em]">Networked Nodes</span>
          <span className="text-4xl font-black text-blue-500 tracking-tighter italic">{filteredZones.length}</span>
        </div>
      </div>
    );
  };

  return (
    <div className="bg-primary min-h-screen text-white relative overflow-hidden font-body">
      {/* Background Special Effects */}
      <div className="light-leak-orange top-[-300px] left-[-200px]" />
      <div className="light-leak-blue bottom-[-200px] right-[-100px]" />

      {/* Fixed Top Navigation (90px) */}
      <nav className="fixed top-0 left-0 right-0 h-[90px] border-b border-white/5 backdrop-blur-3xl z-50 flex items-center justify-between editorial-container mix-blend-screen">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-white flex items-center justify-center text-black font-black text-xl">
            A
          </div>
          <h2 className="text-2xl font-black tracking-tighter text-white uppercase italic">
            AgriMicro <span className="text-orange-500">IQ</span>
          </h2>
        </div>

        <div className="hidden md:flex items-center gap-12">
          {sidebarItems.map((item) => (
            <button 
              key={item.key}
              onClick={() => setActiveTab(item.key)}
              className={`text-[10px] uppercase font-black tracking-[0.3em] transition-all hover:text-orange-500 ${
                activeTab === item.key ? 'text-white' : 'text-white/40'
              }`}
            >
              {item.label}
              {activeTab === item.key && (
                <div className="h-0.5 w-full bg-orange-500 mt-1 animate-reveal" />
              )}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-6">
          <button 
            onClick={() => onNavigate('create')}
            className="text-[10px] font-black uppercase tracking-widest px-6 py-3 border border-white hover:bg-white hover:text-black transition-all"
          >
            Create Farm
          </button>
          <div className="relative group">
            <button className="w-10 h-10 border border-white/20 flex items-center justify-center font-black text-sm">
              {user?.email?.charAt(0).toUpperCase()}
            </button>
            <div className="absolute right-0 top-full pt-4 w-48 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none group-hover:pointer-events-auto z-50">
              <div className="bg-black border border-white/10 p-2 shadow-2xl">
                <p className="px-4 py-2 text-[10px] text-white/40 font-bold uppercase truncate">{user?.email}</p>
                <button 
                  onClick={onLogout}
                  className="w-full text-left px-4 py-2 text-[10px] font-black uppercase text-red-500 hover:bg-red-500/10 transition-colors"
                >
                  Logout
                </button>
              </div>
            </div>
          </div>
        </div>
      </nav>

      <main className="pt-[140px] pb-20 relative z-10 editorial-container">
        {renderContent()}
      </main>
    </div>
  );
};

// Small stat card component
const StatCard = ({ label, value, color }) => {
  return (
    <div className="editorial-card p-10 flex flex-col items-center justify-center text-center group">
      <p className="text-6xl font-black text-white tracking-tighter mb-2 group-hover:scale-110 transition-transform duration-500">
        {value}
      </p>
      <p className="text-[10px] font-black text-white/30 uppercase tracking-[0.4em]">{label}</p>
    </div>
  );
};

export default Dashboard;
