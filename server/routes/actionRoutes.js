const express = require('express');
const supabase = require('../supabaseClient');
const verifyToken = require('../middleware/authMiddleware');
const { validate, schemas } = require('../middleware/validationMiddleware');

const router = express.Router();

// POST /api/actions/generate
router.post('/generate', verifyToken, validate(schemas.zoneAccess), async (req, res) => {
  try {
    const { zoneId } = req.body;

    // 1. Enforce ownership: Check if user owns the farm containing this zone
    const supabaseUid = req.user.supabase_uid;
    const { data: zoneCheck, error: zoneErr } = await supabase
      .from('micro_zones')
      .select('id, farms!inner(user_id)')
      .eq('id', zoneId)
      .eq('farms.user_id', supabaseUid)
      .single();

    if (zoneErr || !zoneCheck) {
      return res.status(403).json({ error: "Access Denied: You do not own this zone or it does not exist." });
    }

    // 2. Fetch latest pest prediction for zone
    const { data: pestData } = await supabase
      .from('pest_predictions')
      .select('risk_level, probability, predicted_pest')
      .eq('zone_id', zoneId)
      .order('created_at', { ascending: false })
      .limit(1);

    // 2. Fetch latest resource recommendation for zone
    const { data: resData } = await supabase
      .from('resource_recommendations')
      .select('fertilizer_amount, water_requirement')
      .eq('zone_id', zoneId)
      .order('created_at', { ascending: false })
      .limit(1);

    const pestRecord = (pestData && pestData.length > 0) ? pestData[0] : null;
    const resRecord = (resData && resData.length > 0) ? resData[0] : null;

    if (!pestRecord && !resRecord) {
      return res.status(404).json({ error: "No pest or resource data found to generate an action plan." });
    }

    // 3. Compute priority_score (weighted formula)
    let priorityScore = 0.0;
    let actionType = "No urgent action required";

    if (pestRecord) {
      if (pestRecord.risk_level.toLowerCase() === 'high') priorityScore += 5.0;
      else if (pestRecord.risk_level.toLowerCase() === 'medium') priorityScore += 3.0;
      else if (pestRecord.risk_level.toLowerCase() === 'low') priorityScore += 1.0;
      
      priorityScore += (pestRecord.probability * 2.0); // scale up probability weight
    }

    if (resRecord) {
      if (resRecord.water_requirement > 50) priorityScore += 2.0;
      if (resRecord.fertilizer_amount > 20) priorityScore += 1.5;
    }

    // Phase 72: Normalize Priority to 0.0 - 1.0 explicitly binding Phase 72 target conditions
    priorityScore = Math.min(priorityScore / 10.0, 1.0);

    // Determine Action Text
    if (priorityScore > 0.7) {
      actionType = `CRITICAL: Apply aggressive treatment for ${pestRecord ? pestRecord.predicted_pest : 'pests'} and immediately irrigate.`;
    } else if (priorityScore >= 0.4) {
      actionType = `MODERATE: Schedule pesticide application and monitor soil moisture.`;
    } else if (priorityScore > 0.1) {
      actionType = `ROUTINE: Standard fertilizer tracking mapping.`;
    } else {
      actionType = `STANDBY: Field conditions are optimal.`;
    }

    // 4. Insert action mapping into action_plans
    const { data: insertData, error: insertError } = await supabase
      .from('action_plans')
      .insert({
        zone_id: zoneId,
        action_type: actionType,
        priority_score: priorityScore
      })
      .select()
      .single();

    if (insertError) {
      console.error("Database insert failed:", insertError.message);
      return res.status(500).json({ error: "Failed to create action plan." });
    }

    // 5. Return JSON
    return res.status(200).json({
      zoneId: zoneId,
      actionType: actionType,
      priorityScore: priorityScore,
      actionPlanId: insertData.id
    });

  } catch (error) {
    console.error("Error generating action:", error.message);
    res.status(500).json({ error: "Internal server error." });
  }
});

module.exports = router;
