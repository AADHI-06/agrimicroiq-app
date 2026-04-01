/**
 * Local Yield Simulation Fallback
 * 
 * Mirrors the exact same logic from ml-service/main.py's /simulate-yield endpoint.
 * Used when the ML service is unavailable (Render cold start, downtime, etc.)
 * so the user always gets a result.
 * 
 * IMPORTANT: Keep this in sync with main.py's CROP_METRICS and calculate() logic.
 */

const CROP_METRICS = {
  rice:    { base: 4.0, price: 20000 },
  wheat:   { base: 3.5, price: 18000 },
  maize:   { base: 5.0, price: 17000 },
  corn:    { base: 5.0, price: 17000 },
  cotton:  { base: 2.0, price: 60000 },
  soybean: { base: 2.5, price: 45000 },
  barley:  { base: 3.0, price: 22000 }
};

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function simulateYieldLocally({ cropType, avg_ndvi, avg_water, avg_fertilizer, temperature }) {
  const crop = (cropType || 'wheat').toLowerCase().trim();
  
  if (!CROP_METRICS[crop]) {
    throw new Error(`Unsupported crop: ${crop}`);
  }

  const ndvi = parseFloat(avg_ndvi) || 0.6;
  const water = parseFloat(avg_water) || 100.0;
  const fert = parseFloat(avg_fertilizer) || 25.0;
  const temp = parseFloat(temperature) || 24.5;

  function calculate(inNdvi, inWater, inFert, inTemp) {
    const nf = clamp(inNdvi / 0.8, 0.5, 1.2);
    const wf = clamp(inWater / 120.0, 0.7, 1.2);
    const ff = clamp(inFert / 30.0, 0.7, 1.2);
    const tf = clamp(1 - (Math.abs(inTemp - 25.0) / 20.0), 0.6, 1.1);

    const y = parseFloat((CROP_METRICS[crop].base * nf * wf * ff * tf).toFixed(2));
    const rev = y * CROP_METRICS[crop].price;
    const cost = (inWater * 2) + (inFert * 50);
    return {
      yield: y,
      profit: parseFloat((rev - cost).toFixed(2)),
      factors: {
        ndvi: parseFloat(nf.toFixed(2)),
        water: parseFloat(wf.toFixed(2)),
        fert: parseFloat(ff.toFixed(2)),
        temp: parseFloat(tf.toFixed(2))
      }
    };
  }

  const opt = calculate(ndvi, water, fert, temp);
  const cur = calculate(ndvi * 0.85, water * 0.7, fert * 0.7, temp);
  const gainPct = cur.yield > 0 ? parseFloat(((opt.yield - cur.yield) / cur.yield * 100).toFixed(1)) : 0;

  return {
    cropType: crop,
    optimized: {
      yield: `${opt.yield} tons`,
      profit: `₹${Math.round(opt.profit).toLocaleString('en-IN')}`,
      factors: opt.factors
    },
    current: {
      yield: `${cur.yield} tons`,
      profit: `₹${Math.round(cur.profit).toLocaleString('en-IN')}`
    },
    gain_pct: gainPct,
    _source: 'local_fallback'  // Flag so the caller knows this was a local computation
  };
}

module.exports = { simulateYieldLocally, CROP_METRICS };
