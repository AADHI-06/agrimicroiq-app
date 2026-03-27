const express = require('express');
const supabase = require('../supabaseClient');
const callMLService = require('../utils/mlClient');
const verifyToken = require('../middleware/authMiddleware');
const { validate, schemas } = require('../middleware/validationMiddleware');

const router = express.Router();

// POST /api/yield/simulate
// POST /api/yield/simulate
router.post('/simulate', verifyToken, validate(schemas.yieldSim), async (req, res) => {
  try {
    const { farmId } = req.body;

    // 1. Fetch Farm Info and enforce OWNERSHIP
    const supabaseUid = req.user.supabase_uid;
    const { data: farm, error: farmError } = await supabase
      .from('farms')
      .select('crop_type')
      .eq('id', farmId)
      .eq('user_id', supabaseUid)
      .single();

    if (farmError || !farm) {
       return res.status(403).json({ error: "Access Denied: You do not own this farm or it does not exist." });
    }

    // 2. Fetch all zones for farm
    const { data: zones, error: fetchZonesError } = await supabase
      .from('micro_zones')
      .select('id, ndvi_value')
      .eq('farm_id', farmId);

    if (fetchZonesError || !zones || zones.length === 0) {
      return res.status(404).json({ error: "No micro_zones found for this farmId." });
    }

    // 3. Fetch resource recommendations for those zones
    const zoneIds = zones.map(z => z.id);
    const { data: resources, error: fetchResError } = await supabase
      .from('resource_recommendations')
      .select('zone_id, fertilizer_amount, water_requirement, created_at')
      .in('zone_id', zoneIds)
      .order('created_at', { ascending: false });

    // Aggregate average values across the farm
    // Note: taking the latest recommendation for each zone
    let totalNdvi = 0;
    let totalFertilizer = 0;
    let totalWater = 0;
    
    const latestResources = {};
    if (!fetchResError && resources) {
      for (const rec of resources) {
        if (!latestResources[rec.zone_id]) {
          latestResources[rec.zone_id] = rec;
        }
      }
    }

    for (const zone of zones) {
      totalNdvi += zone.ndvi_value;
      if (latestResources[zone.id]) {
        totalFertilizer += latestResources[zone.id].fertilizer_amount || 0;
        totalWater += latestResources[zone.id].water_requirement || 0;
      }
    }

    const avgNdvi = totalNdvi / zones.length;
    const avgFertilizer = totalFertilizer / zones.length;
    const avgWater = totalWater / zones.length;

    // 4. Call ML endpoint /simulate-yield with Crop Intelligence
    const mlPayload = { 
      farmId: farmId,
      cropType: farm.crop_type,
      avg_ndvi: avgNdvi,
      avg_fertilizer: avgFertilizer,
      avg_water: avgWater,
      temperature: 24.5 // Fallback if no real-time weather integration is active
    };
    
    let mlResponse;
    try {
      mlResponse = await callMLService('/simulate-yield', mlPayload, req.headers.authorization);
    } catch (mlErr) {
      console.error("ML Service /simulate-yield call failed:", mlErr.response ? mlErr.response.data : mlErr.message);
      
      const status = mlErr.response ? mlErr.response.status : 502;
      const errorMsg = mlErr.response?.data?.detail || "ML simulation service unavailable.";
      
      return res.status(status).json({ 
        error: errorMsg,
        details: mlErr.message
      });
    }

    // 5. Extract Optimized Results (Strip " tons" and "₹" for DB storage)
    const optYieldValue = parseFloat(mlResponse.optimized.yield.split(' ')[0]);
    const optProfitValue = parseFloat(mlResponse.optimized.profit.replace(/[₹,]/g, ''));
    
    // 6. Insert into yield_simulations (Optimized Snapshot)
    const { data: insertData, error: insertError } = await supabase
      .from('yield_simulations')
      .insert({
        farm_id: farmId,
        expected_yield: optYieldValue,
        expected_profit: optProfitValue
      })
      .select()
      .single();

    if (insertError) {
      console.error("Database insert failed:", insertError.message);
      return res.status(500).json({ error: "Failed to store yield simulation." });
    }

    // 7. Return Full Scientific Payload to Frontend
    return res.status(200).json({
      ...mlResponse,
      db_record_id: insertData.id
    });

  } catch (error) {
    console.error("Error in yield simulation:", error.message);
    res.status(500).json({ error: "Internal server error." });
  }
});

module.exports = router;
