const express = require('express');
const supabase = require('../supabaseClient');
const verifyToken = require('../middleware/authMiddleware');
const { validate, schemas } = require('../middleware/validationMiddleware');

const router = express.Router();

// POST /api/demo/stress
router.post('/stress', verifyToken, validate(schemas.yieldSim), async (req, res) => {
  try {
    const { farmId } = req.body;

    // 1. Explicitly Insert a completely fake synthetic Micro-Zone non-destructively
    const { data: newZone, error: zoneError } = await supabase
      .from('micro_zones')
      .insert({
        farm_id: farmId,
        ndvi_value: 0.15, // Severe critical stress baseline tracking
        // Stand-in polygon geometry ensuring Map bounds don't crash
        zone_polygon: { type: "Polygon", coordinates: [[[-0.1, -0.1], [0.1, -0.1], [0.1, 0.1], [-0.1, 0.1], [-0.1, -0.1]]] }
      })
      .select()
      .single();

    if (zoneError || !newZone) {
      console.error("Stress Zone Error:", zoneError);
      return res.status(500).json({ error: "Failed to synthetically spawn stress zone." });
    }

    // 2. Insert catastrophic pest tracking mapped rigidly to the exact fake zone natively!
    const { data: newPest, error: pestError } = await supabase
      .from('pest_predictions')
      .insert({
        zone_id: newZone.id,
        risk_level: 'High',
        probability: 0.98,
        predicted_pest: 'Locust Swarm' // Hyper-alert synthetic demonstrative string
      })
      .select()
      .single();

    if (pestError) {
      console.error("Stress Pest Error:", pestError);
      return res.status(500).json({ error: "Failed to map catastrophic pest vectors." });
    }

    // Implicit validation bypass ensuring Express parses structural formats natively
    return res.status(200).json({
      message: "Stress scenario injected completely successfully",
      zone: newZone,
      pest: newPest
    });

  } catch (err) {
    console.error("Demo Execution Error:", err);
    res.status(500).json({ error: "Failed to deploy mock simulation vectors natively." });
  }
});

module.exports = router;
