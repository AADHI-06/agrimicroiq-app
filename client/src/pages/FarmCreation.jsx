import React, { useState } from 'react';
import api from '../services/api';
import FarmMap from '../components/MapContainer';
import { useFarm } from '../context/FarmContext';

export default function FarmCreation() {
  const { refreshFarms } = useFarm();
  const [farmName, setFarmName] = useState('');
  const [cropType, setCropType] = useState('');
  const [polygon, setPolygon] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const handlePolygonCreated = (geoJSON) => {
    setPolygon(geoJSON);
    console.log("Farm polygon set in state:", geoJSON);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!farmName || !cropType || !polygon) {
      setMessage({ type: 'error', text: 'Please fill all fields and draw a farm boundary.' });
      return;
    }

    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      const response = await api.post('/farms', {
        farmName: farmName,
        cropType: cropType,
        geoPolygon: polygon,
      });

      console.log('Farm created successfully:', response.data);
      setMessage({ type: 'success', text: 'Farm created successfully!' });
      
      // Refresh global farm list
      refreshFarms();

      // Reset form
      setFarmName('');
      setCropType('');
      setPolygon(null);

    } catch (error) {
      console.error('Error creating farm:', error);
      setMessage({
        type: 'error',
        text: error.response?.data?.error || error.message || 'Failed to create farm.'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-140px)] flex flex-col lg:flex-row gap-0 bg-black -m-[20px] lg:-m-[40px] animate-reveal">
      {/* Left: Content & Form */}
      <div className="lg:w-[45%] p-12 lg:p-24 flex flex-col border-r border-white/5">
        <div className="mb-20">
          <h3 className="text-[10px] font-black text-orange-500 uppercase tracking-[0.5em] mb-4 text-reveal">Expansion Protocol</h3>
          <h2 className="text-6xl font-black text-white tracking-tighter italic uppercase leading-[0.9] text-reveal">
            Onboard New <br/> Estate
          </h2>
        </div>

        {message.text && (
          <div className={`editorial-card px-8 py-5 mb-12 animate-reveal ${
            message.type === 'error' ? 'border-red-500/20 bg-red-500/5 text-red-500' : 'border-blue-500/20 bg-blue-500/5 text-blue-500'
          }`}>
            <span className="text-[10px] font-black uppercase tracking-widest">{message.text}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-12">
          <div className="group">
            <label className="block text-[10px] font-black text-white/30 uppercase tracking-[0.4em] mb-4 px-1 group-focus-within:text-orange-500 transition-colors">
              Estate Designation
            </label>
            <input
              type="text"
              value={farmName}
              onChange={(e) => setFarmName(e.target.value)}
              className="w-full bg-transparent border-b border-white/10 px-1 py-4 text-3xl font-black text-white focus:outline-none focus:border-white transition-all placeholder:text-white/5 uppercase"
              placeholder="E.G. NORTHERN CLUSTER"
              required
            />
          </div>

          <div className="group">
            <label className="block text-[10px] font-black text-white/30 uppercase tracking-[0.4em] mb-4 px-1 group-focus-within:text-orange-500 transition-colors">
              Primary Crop Species
            </label>
            <input
              type="text"
              value={cropType}
              onChange={(e) => setCropType(e.target.value)}
              className="w-full bg-transparent border-b border-white/10 px-1 py-4 text-3xl font-black text-white focus:outline-none focus:border-white transition-all placeholder:text-white/5 uppercase"
              placeholder="E.G. ORGANIC COTTON"
              required
            />
          </div>

          <div className="pt-12">
            <button
              type="submit"
              disabled={loading || !polygon}
              className={`button-editorial w-full py-6 text-sm transition-all ${
                loading || !polygon
                ? 'opacity-20 cursor-not-allowed'
                : 'hover:bg-white hover:text-black'
              }`}
            >
              {loading ? 'Initializing Interface...' : 'Authorize Expansion'}
            </button>
            {!polygon && (
              <p className="text-[9px] font-black text-white/20 mt-8 uppercase tracking-[0.3em] italic text-center">
                * Satellite boundary definition required via right interface
              </p>
            )}
          </div>
        </form>

        <div className="mt-auto pt-24">
           <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.3em] leading-relaxed max-w-sm">
             Use the orbital polygon tool on the right to delineate the exact geographical boundaries of the new sector.
           </p>
        </div>
      </div>

      {/* Right: Immersive Map Container */}
      <div className="lg:flex-1 h-[500px] lg:h-auto relative group">
        <div className="absolute inset-0 z-0 grayscale-[0.2] transition-all duration-1000 group-hover:grayscale-0">
          <FarmMap onPolygonCreated={handlePolygonCreated} height="100%" />
        </div>
        
        {/* Editorial Map HUD */}
        <div className="absolute top-12 left-12 pointer-events-none transition-all duration-700 group-hover:left-14">
          <div className="editorial-card px-8 py-5 bg-black/80 backdrop-blur-xl border-white/10 shadow-2xl flex items-center gap-6">
            <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse-slow shadow-[0_0_15px_rgba(59,130,246,0.8)]"></div>
            <span className="text-[10px] font-black text-white uppercase tracking-[0.4em]">
              {polygon ? 'Boundary Defined' : 'Awaiting Satellite Input'}
            </span>
          </div>
        </div>

        {/* Global Mask */}
        <div className="absolute inset-0 bg-gradient-to-r from-black via-transparent to-transparent pointer-events-none lg:block hidden" />
      </div>
    </div>
  );
}
