const express = require('express');
const supabase = require('../supabaseClient');
const callMLService = require('../utils/mlClient');
const verifyToken = require('../middleware/authMiddleware');
const { validate, schemas } = require('../middleware/validationMiddleware');

const router = express.Router();

// POST /api/resource/optimize
router.post('/optimize', verifyToken, validate(schemas.zoneAccess), async (req, res) => {
  try {
    const { zoneId } = req.body;

    // 1. Fetch zone ndvi_value and enforce OWNERSHIP
    const supabaseUid = req.user.supabase_uid;
    const { data: microZones, error: fetchNdviError } = await supabase
      .from('micro_zones')
      .select('ndvi_value, farms!inner(user_id)')
      .eq('id', zoneId)
      .eq('farms.user_id', supabaseUid)
      .limit(1);

    if (fetchNdviError || !microZones || microZones.length === 0) {
      return res.status(403).json({ error: "Access Denied: You do not own this zone or it does not exist." });
    }
    const ndvi_value = microZones[0].ndvi_value;

    // 2. Fetch latest pest prediction
    const { data: pestData, error: fetchPestError } = await supabase
      .from('pest_predictions')
      .select('predicted_pest')
      .eq('zone_id', zoneId)
      .order('created_at', { ascending: false })
      .limit(1);

    const latestPest = (!fetchPestError && pestData && pestData.length > 0) 
      ? pestData[0].predicted_pest 
      : "None";

    // 3. Call ML endpoint /optimize-resource
    const mlPayload = { 
      ndvi: ndvi_value,
      pest_prediction: latestPest
    };
    
    let mlResponse;
    try {
      mlResponse = await callMLService('/optimize-resource', mlPayload, req.headers.authorization);
    } catch (mlErr) {
      console.error("ML Service /optimize-resource call failed:", mlErr.response ? mlErr.response.data : mlErr.message);
      // Return 502 gracefully since the user's ML deployment might not have this endpoint active yet
      return res.status(502).json({ error: "ML optimization service unavailable. Please ensure the ML container exposes /optimize-resource." });
    }

    // Expected ML Response format logic
    const fertilizerAmount = mlResponse.fertilizerAmount || mlResponse.fertilizer_amount || 0.0;
    const waterRequirement = mlResponse.waterRequirement || mlResponse.water_requirement || 0.0;

    // 4. Insert into resource_recommendations
    const { data: insertData, error: insertError } = await supabase
      .from('resource_recommendations')
      .insert({
        zone_id: zoneId,
        fertilizer_amount: fertilizerAmount,
        water_requirement: waterRequirement
      })
      .select()
      .single();

    if (insertError) {
      console.error("Database insert failed:", insertError.message);
      return res.status(500).json({ error: "Failed to store resource recommendations." });
    }

    // 5. Return structured JSON
    const responsePayload = {
      zoneId: zoneId,
      fertilizerAmount: fertilizerAmount,
      waterRequirement: waterRequirement,
      recommended_fertilizer_kg: fertilizerAmount,
      recommended_water_liters: waterRequirement,
      db_record_id: insertData.id
    };

    return res.status(200).json(responsePayload);

  } catch (error) {
    console.error("Error in resource optimization:", error.message);
    res.status(500).json({ error: "Internal server error." });
  }
});

module.exports = router;
