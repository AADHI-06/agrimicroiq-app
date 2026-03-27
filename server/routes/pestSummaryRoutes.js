const express = require('express');
const supabase = require('../supabaseClient');
const verifyToken = require('../middleware/authMiddleware');

const router = express.Router();

// GET /api/pest/summary - Dashboard summary data
router.get('/summary', verifyToken, async (req, res) => {
  try {
    // Resolve Supabase user
    const supabaseUid = req.user.supabase_uid;
    if (!supabaseUid) return res.status(403).json({ error: "User profile not initialized." });

    // 2. Get all user farms
    const { data: farms } = await supabase
      .from('farms')
      .select('id, farm_name, crop_type, geo_polygon')
      .eq('user_id', supabaseUid);

    if (!farms || farms.length === 0) {
      return res.status(200).json({
        zones: [],
        recentPests: [],
        riskCounts: { High: 0, Medium: 0, Low: 0 }
      });
    }

    const farmIds = farms.map(f => f.id);

    // 3. Get all zones for user farms
    const { data: zones } = await supabase
      .from('micro_zones')
      .select('id, farm_id, ndvi_value, zone_polygon, created_at')
      .in('farm_id', farmIds)
      .order('created_at', { ascending: false });

    const zoneIds = (zones || []).map(z => z.id);

    // 4. Get recent pest predictions
    let recentPests = [];
    let riskCounts = { High: 0, Medium: 0, Low: 0 };

    if (zoneIds.length > 0) {
      const { data: pests } = await supabase
        .from('pest_predictions')
        .select('id, zone_id, risk_level, probability, predicted_pest, created_at')
        .in('zone_id', zoneIds)
        .order('created_at', { ascending: false })
        .limit(10);

      recentPests = pests || [];

      // Count risk distribution
      recentPests.forEach(p => {
        const level = p.risk_level;
        if (level in riskCounts) riskCounts[level]++;
      });
    }

    // 5. Enrich zones with farm name
    const farmMap = {};
    farms.forEach(f => { farmMap[f.id] = f; });

    const enrichedZones = (zones || []).map(z => ({
      ...z,
      farm_name: farmMap[z.farm_id]?.farm_name || 'Unknown',
      crop_type: farmMap[z.farm_id]?.crop_type || 'Unknown'
    }));

    return res.status(200).json({
      zones: enrichedZones,
      recentPests,
      riskCounts,
      totalFarms: farms.length
    });

  } catch (error) {
    console.error("Error fetching pest summary:", error.message);
    res.status(500).json({ error: "Internal server error." });
  }
});

module.exports = router;
