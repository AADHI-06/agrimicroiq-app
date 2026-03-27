const express = require('express');
const supabase = require('../supabaseClient');
const verifyToken = require('../middleware/authMiddleware');
const { validate, schemas } = require('../middleware/validationMiddleware');
const generateFarmReport = require('../utils/pdfGenerator');

const router = express.Router();

/**
 * POST /api/report/generate
 * Generates and returns a comprehensive agricultural intelligence PDF.
 */
router.post('/generate', verifyToken, validate(schemas.yieldSim), async (req, res) => {
  try {
    const { farmId } = req.body;

    // Resolve Supabase user ID from context and verify ownership
    const supabaseUid = req.user.supabase_uid;
    if (!supabaseUid) return res.status(403).json({ error: "User profile not initialized" });

    const { data: farm, error: farmError } = await supabase
      .from('farms')
      .select('*')
      .eq('id', farmId)
      .eq('user_id', supabaseUid)
      .single();

    if (farmError || !farm) {
      return res.status(403).json({ error: "Access Denied: You do not have permission to generate reports for this farm." });
    }

    // 3. Orchestrate Parallel High-Fidelity Data Extraction
    const [
      { data: zones },
      { data: yieldSims },
      { data: guidanceData }
    ] = await Promise.all([
      supabase.from('micro_zones').select('*').eq('farm_id', farmId).order('created_at', { ascending: false }),
      supabase.from('yield_simulations').select('*').eq('farm_id', farmId).order('created_at', { ascending: false }).limit(1),
      supabase.from('personalized_guidance').select('*').eq('farm_id', farmId).order('created_at', { ascending: false })
    ]);

    const zoneIds = (zones || []).map(z => z.id);
    let pestPredictions = [];
    let resourceRecommendations = [];
    let actionPlans = [];

    // Aggregate zone-level analytics if micro-zones exist
    if (zoneIds.length > 0) {
      const results = await Promise.all([
        supabase.from('pest_predictions').select('*').in('zone_id', zoneIds).order('created_at', { ascending: false }),
        supabase.from('resource_recommendations').select('*').in('zone_id', zoneIds).order('created_at', { ascending: false }),
        supabase.from('action_plans').select('*').in('zone_id', zoneIds).order('created_at', { ascending: false })
      ]);

      pestPredictions = results[0].data || [];
      resourceRecommendations = results[1].data || [];
      actionPlans = results[2].data || [];
    }

    // 4. Transform and Map Data into Abstract Intelligence Payload
    const reportPayload = {
      farm: farm,
      zones: zones || [],
      pestPredictions: pestPredictions,
      resourceRecommendations: resourceRecommendations,
      yield: (yieldSims && yieldSims.length > 0) ? yieldSims[0] : null,
      actionPlans: actionPlans,
      guidance: guidanceData || []
    };

    // 5. Generate and Stream PDF Content
    console.log(`Generating Farm Intelligence Report for ID: ${farmId}...`);
    generateFarmReport(reportPayload, res);

  } catch (error) {
    console.error("CRITICAL REPORT GENERATION ERROR:", error.message);
    if (!res.headersSent) {
      res.status(500).json({ error: "Internal processing failure during PDF generation." });
    }
  }
});

module.exports = router;
