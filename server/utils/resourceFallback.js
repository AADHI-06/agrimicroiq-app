/**
 * Local Resource Optimization Fallback
 * 
 * Mirrors the EXACT logic from ml-service/main.py's /optimize-resource endpoint.
 * Used when the ML service is unavailable (Render cold start, downtime, etc.)
 * so the user always gets resource recommendations.
 * 
 * IMPORTANT: Keep this in sync with main.py's /optimize-resource logic.
 */

function optimizeResourceLocally({ ndvi, pest_prediction }) {
  const n = parseFloat(ndvi) || 0.5;
  const pest = (pest_prediction || 'None').toUpperCase();

  let fert = 25.0;
  let water = 100.0;

  if (n < 0.4) {
    fert += 15.0;
    water += 40.0;
  } else if (n > 0.7) {
    fert -= 5.0;
  }

  if (pest === 'LEAF BLIGHT' || pest === 'HIGH') {
    water += 20.0;
  }

  return {
    fertilizerAmount: parseFloat(fert.toFixed(1)),
    waterRequirement: parseFloat(water.toFixed(1)),
    _source: 'local_fallback'
  };
}

module.exports = { optimizeResourceLocally };
