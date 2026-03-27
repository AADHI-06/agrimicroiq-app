const express = require('express');
const supabase = require('../supabaseClient');
const verifyToken = require('../middleware/authMiddleware');
const { validate, schemas } = require('../middleware/validationMiddleware');

const router = express.Router();

// GET /api/history/farm/:farmId
router.get('/farm/:farmId', verifyToken, validate(schemas.yieldSim, 'params'), async (req, res) => {
  try {
    const { farmId } = req.params;

    // Enforce ownership: Check if user owns the farm
    const supabaseUid = req.user.supabase_uid;
    if (!supabaseUid) return res.status(403).json({ error: "User profile not initialized" });

    const { data: farmCheck, error: fcError } = await supabase
      .from('farms')
      .select('id, user_id')
      .eq('id', farmId)
      .eq('user_id', supabaseUid)
      .single();

    if (fcError || !farmCheck) {
      return res.status(403).json({ error: "Access Denied: You do not own this farm or it does not exist." });
    }

    // 1. Fetch zones for NDVI trends
    const { data: zones } = await supabase
      .from('micro_zones')
      .select('id, ndvi_value, created_at')
      .eq('farm_id', farmId)
      .order('created_at', { ascending: true });

    let zoneIds = [];
    if (zones && zones.length > 0) {
      zoneIds = zones.map(z => z.id);
    }

    // 2. Fetch Pest trends
    let pestTrends = [];
    let resourceTrends = [];
    
    if (zoneIds.length > 0) {
      const { data: pests } = await supabase
        .from('pest_predictions')
        .select('*')
        .in('zone_id', zoneIds)
        .order('created_at', { ascending: true });
      if (pests) pestTrends = pests;

      // 3. Fetch Resource trends
      const { data: resources } = await supabase
        .from('resource_recommendations')
        .select('*')
        .in('zone_id', zoneIds)
        .order('created_at', { ascending: true });
      if (resources) resourceTrends = resources;
    }

    // 4. Fetch Yield Simulations
    const { data: yields } = await supabase
      .from('yield_simulations')
      .select('*')
      .eq('farm_id', farmId)
      .order('created_at', { ascending: true });

    const yieldTrends = yields || [];

    return res.status(200).json({
      farmId: farmId,
      history: {
        ndviTrends: zones || [],
        pestTrends: pestTrends,
        resourceTrends: resourceTrends,
        yieldSimulations: yieldTrends
      }
    });

  } catch (error) {
    console.error("Error fetching historical data:", error.message);
    res.status(500).json({ error: "Internal server error." });
  }
});

module.exports = router;
