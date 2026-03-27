import React, { useState, useEffect } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import api from '../services/api';

const HistoryChart = ({ farmId }) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        setLoading(true);
        const response = await api.get(`/history/farm/${farmId}`);
        
        const rawHistory = response.data.history;
        
        // Server returns history as an object: { ndviTrends, pestTrends, resourceTrends, yieldSimulations }
        // The chart needs the yieldSimulations array for plotting
        let history = [];
        if (Array.isArray(rawHistory)) {
          history = rawHistory;
        } else if (rawHistory && typeof rawHistory === 'object') {
          history = rawHistory.yieldSimulations || rawHistory.pestTrends || [];
        }
        
        // Format dates cleanly for Recharts X-Axis mapping
        const formattedData = history.map(item => ({
          ...item,
          displayDate: new Date(item.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
        })).reverse(); // Oldest to newest left-to-right

        setData(formattedData);
        setError(null);
      } catch (err) {
        console.error("Historical Analytics Error:", err);
        setError("Failed to fetch historical AI tracking telemetry.");
      } finally {
        setLoading(false);
      }
    };

    if (farmId) {
      fetchHistory();
    }
  }, [farmId]);

  if (loading) {
    return (
      <div className="flex justify-center flex-col items-center h-48 glossy-card border-dashed border-2 border-slate-200">
        <div className="w-8 h-8 border-3 border-emerald-400 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.2em] mt-4">Calibrating Analytics...</p>
      </div>
    );
  }

  if (error) {
    return <div className="p-6 text-[10px] font-black uppercase tracking-widest text-red-500 glass-pill text-center border-red-100">{error}</div>;
  }

  if (data.length === 0) {
    return (
      <div className="p-8 text-center glossy-card border-dashed border-2 border-slate-200 bg-slate-50/50">
        <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Insufficient Telemetry Data</p>
        <p className="text-[10px] text-slate-400 font-bold mt-2 leading-relaxed">Establish at least three yield simulation records to generate architectural trend curves.</p>
      </div>
    );
  }

  return (
    <div className="p-6 bg-white/40 backdrop-blur-md rounded-3xl border border-white/60 shadow-xl animate-gloss-in">
      <div className="flex justify-between items-center mb-6">
        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] flex items-center">
          <div className="w-1 h-3 rounded-full gloss-gradient-blue mr-3 shadow-sm"></div> 
          Temporal Regression Series
        </h4>
        <div className="flex gap-4">
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.5)]"></div>
            <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Yield</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></div>
            <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Profit</span>
          </div>
        </div>
      </div>

      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 5, right: 30, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="6 6" vertical={false} stroke="#e2e8f0" />
            <XAxis 
              dataKey="displayDate" 
              axisLine={false} 
              tickLine={false} 
              tick={{ fontSize: 9, fontWeight: 900, fill: '#94a3b8', letterSpacing: '0.05em' }} 
              dy={15} 
            />
            <YAxis 
              yAxisId="left" 
              axisLine={false} 
              tickLine={false} 
              tick={{ fontSize: 9, fontWeight: 900, fill: '#94a3b8' }} 
            />
            <YAxis 
              yAxisId="right" 
              orientation="right" 
              axisLine={false} 
              tickLine={false} 
              tick={{ fontSize: 9, fontWeights: 900, fill: '#94a3b8' }} 
            />
            
            <Tooltip 
              contentStyle={{ 
                background: 'rgba(255,255,255,0.9)', 
                backdropFilter: 'blur(10px)',
                borderRadius: '1.25rem', 
                border: '1px solid rgba(255,255,255,0.5)', 
                boxShadow: '0 10px 30px rgba(0,0,0,0.08)', 
                fontSize: '11px',
                fontWeight: 900,
                padding: '12px'
              }}
              cursor={{ stroke: '#cbd5e1', strokeWidth: 1, strokeDasharray: '4 4' }}
              itemStyle={{ textTransform: 'uppercase', letterSpacing: '0.05em' }}
            />
            
            <Line 
              yAxisId="left"
              type="monotone" 
              name="Yield (Tons)"
              dataKey="expected_yield" 
              stroke="#6366f1" 
              strokeWidth={4}
              strokeLinecap="round"
              activeDot={{ r: 6, fill: "#6366f1", stroke: "#fff", strokeWidth: 3, className: 'inner-glow' }} 
              dot={{ r: 0 }}
            />
            <Line 
              yAxisId="right"
              type="monotone" 
              name="Profit (₹)"
              dataKey="expected_profit" 
              stroke="#10b981" 
              strokeWidth={4}
              strokeLinecap="round"
              activeDot={{ r: 6, fill: "#10b981", stroke: "#fff", strokeWidth: 3, className: 'inner-glow' }}
              dot={{ r: 0 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default HistoryChart;
