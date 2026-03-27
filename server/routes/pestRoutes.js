const express = require('express');
const supabase = require('../supabaseClient');
const callMLService = require('../utils/mlClient');
const verifyToken = require('../middleware/authMiddleware');
const { validate, schemas } = require('../middleware/validationMiddleware');

const router = express.Router();

// POST /api/pest/predict
router.post('/predict', verifyToken, validate(schemas.zoneAccess), async (req, res) => {
  try {
    const { zoneId } = req.body;

    // Fetch zone ndvi_value and enforce OWNERSHIP
    const supabaseUid = req.user.supabase_uid;
    const { data: microZones, error: fetchError } = await supabase
      .from('micro_zones')
      .select('ndvi_value, farms!inner(user_id)')
      .eq('id', zoneId)
      .eq('farms.user_id', supabaseUid)
      .limit(1);

    if (fetchError || !microZones || microZones.length === 0) {
      return res.status(403).json({ error: "Access Denied: You do not own this zone or it does not exist." });
    }

    const ndvi_value = microZones[0].ndvi_value;

    // Derive realistic environmental features from NDVI
    // Low NDVI = stressed crop → hotter, more humid, more rain (pest-friendly)
    // High NDVI = healthy crop → moderate conditions
    const rand = () => (Math.random() - 0.5) * 2; // -1 to 1
    const temperature = Math.min(35, Math.max(24, 
      24 + (1 - ndvi_value) * 11 + rand() * 2
    ));
    const humidity = Math.min(90, Math.max(40, 
      40 + (1 - ndvi_value) * 50 + rand() * 5
    ));
    const rainfall = Math.min(25, Math.max(0, 
      (1 - ndvi_value) * 25 + rand() * 3
    ));

    // Call ML endpoint with all 4 features
    const mlPayload = { 
      ndvi: ndvi_value, 
      temperature: parseFloat(temperature.toFixed(1)),
      humidity: parseFloat(humidity.toFixed(1)),
      rainfall: parseFloat(rainfall.toFixed(1))
    };
    let mlResponse;
    try {
      mlResponse = await callMLService('/predict', mlPayload, req.headers.authorization);
    } catch (mlErr) {
      console.error("ML Service call failed:", mlErr.message);
      return res.status(502).json({ error: "Failed to communicate with ML Service." });
    }

    // Phase 66: Parse Expected ML Response natively mapping structurally
    const riskLevel = mlResponse.riskLevel || mlResponse.risk || "Unknown";
    const probability = mlResponse.probability !== undefined ? mlResponse.probability : 0.0;
    const predictedPest = mlResponse.predictedPest || "General Pest";

    // Insert result into pest_predictions
    const { data: insertData, error: insertError } = await supabase
      .from('pest_predictions')
      .insert({
        zone_id: zoneId,
        risk_level: riskLevel,
        probability: probability,
        predicted_pest: predictedPest
      })
      .select()
      .single();

    if (insertError) {
      console.error("Database insert failed:", insertError.message);
      return res.status(500).json({ error: "Failed to store prediction." });
    }

    // Return structured JSON
    const responsePayload = {
      zoneId: zoneId,
      riskLevel: riskLevel,
      probability: probability,
      predictedPest: predictedPest
    };

    return res.status(200).json(responsePayload);

  } catch (error) {
    console.error("Error in pest prediction:", error.message);
    res.status(500).json({ error: "Internal server error." });
  }
});

module.exports = router;
