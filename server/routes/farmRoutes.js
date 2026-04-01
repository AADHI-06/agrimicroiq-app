const express = require('express');
const supabase = require('../supabaseClient');
const verifyToken = require('../middleware/authMiddleware');
const { validate, schemas } = require('../middleware/validationMiddleware');
const { getPestRisk } = require('../services/mlService');
const securityLogger = require('../utils/securityLogger');
const router = express.Router();


/*
CREATE FARM
POST /api/farms
*/
router.post('/', verifyToken, validate(schemas.farmCreate), async (req, res) => {
  try {
    const { farmName, cropType, geoPolygon } = req.body;

    // Use pre-resolved Supabase UID from middleware
    let supabaseUid = req.user.supabase_uid;

    // If user record doesn't exist (e.g., first login, sync failed), create it
    if (!supabaseUid) {
      const { data: newUser, error: insertError } = await supabase
        .from('users')
        .insert([
          {
            firebase_uid: req.user.uid,
            email: req.user.email || 'unknown@example.com'
          }
        ])
        .select('id')
        .single();

      if (insertError) {
        console.error("Supabase user insert error:", insertError);
        return res.status(500).json({
          error: `User record missing and failed to auto-provision: ${insertError.message}`
        });
      }
      supabaseUid = newUser.id;
    }

    // Insert farm linked to our internal UUID
    const { data, error } = await supabase
      .from('farms')
      .insert([
        {
          user_id: supabaseUid,
          farm_name: farmName,
          crop_type: cropType,
          geo_polygon: geoPolygon
        }
      ])
      .select();

    if (error) {
      return res.status(500).json({
        error: error.message
      });
    }

    res.status(201).json({
      message: "Farm created successfully",
      farm: data
    });

  } catch (err) {
    res.status(500).json({
      error: err.message
    });
  }
});


/*
GET FARMS
GET /api/farms
*/
router.get('/', verifyToken, async (req, res) => {
  try {
    const supabaseUid = req.user.supabase_uid;

    if (!supabaseUid) {
      return res.status(200).json([]);
    }

    const { data, error } = await supabase
      .from('farms')
      .select('*')
      .eq('user_id', supabaseUid);

    if (error) {
      return res.status(500).json({
        error: error.message
      });
    }

    res.status(200).json(data);

  } catch (err) {
    res.status(500).json({
      error: err.message
    });
  }
});

router.post('/predict-risk', verifyToken, validate(schemas.zoneAccess), async (req, res) => {
  try {
    const { zoneId } = req.body;
    const supabaseUid = req.user.supabase_uid;

    if (!supabaseUid) return res.status(403).json({ error: "User profile not initialized" });
    
    // Resolve specific Zone and check OWNERSHIP via Farm join
    const { data: zone, error: zoneErr } = await supabase
      .from('micro_zones')
      .select('ndvi_value, farm_id, farms!inner(user_id)')
      .eq('id', zoneId)
      .eq('farms.user_id', supabaseUid)
      .single();

    if (zoneErr || !zone) {
      return res.status(403).json({ error: "Access Denied: You do not own this zone or it does not exist." });
    }
    
    const { data: farm } = await supabase.from('farms').select('crop_type').eq('id', zone.farm_id).single();

    // Map the resolved parameters specifically targeting the Python ML prediction constraints
    const mlPayload = {
      ndvi: zone.ndvi_value,
      temperature: 30.0, 
      humidity: 60.0,
      rainfall: 0.0,
      cropType: farm ? farm.crop_type : "unknown",
      zoneId: zoneId
    };

    const result = await getPestRisk(mlPayload, req.headers.authorization);

    // Save prediction cleanly
    const { data: insertData, error: dbErr } = await supabase.from('pest_predictions').insert({
      zone_id: zoneId,
      risk_level: result.riskLevel,
      probability: result.probability,
      predicted_pest: result.predictedPest
    });

    res.status(200).json(result);
    securityLogger.logActivity("INFO", "ML Pest Risk Predicted", { zoneId, risk: result.riskLevel });
  } catch (err) {
    securityLogger.logActivity("ERROR", "ML Pest Risk Prediction Failed", { zoneId: req.body?.zoneId, error: err.message });
    res.status(500).json({ error: err.message });
  }
});


/*
DELETE FARM
DELETE /api/farms/:id
*/
router.delete('/:id', verifyToken, async (req, res) => {
  try {
    const farmId = req.params.id;
    const supabaseUid = req.user.supabase_uid;

    if (!supabaseUid) {
      return res.status(403).json({ error: "User profile not initialized" });
    }

    // Verify ownership
    const { data: farm, error: fetchError } = await supabase
      .from('farms')
      .select('id')
      .eq('id', farmId)
      .eq('user_id', supabaseUid)
      .single();

    if (fetchError || !farm) {
      return res.status(404).json({ error: "Farm not found or access denied." });
    }

    // Delete associated micro_zones (and their pest_predictions) first
    const { data: zones } = await supabase
      .from('micro_zones')
      .select('id')
      .eq('farm_id', farmId);

    if (zones && zones.length > 0) {
      const zoneIds = zones.map(z => z.id);
      await supabase.from('pest_predictions').delete().in('zone_id', zoneIds);
      await supabase.from('micro_zones').delete().eq('farm_id', farmId);
    }

    // Delete the farm itself
    const { error: deleteError } = await supabase
      .from('farms')
      .delete()
      .eq('id', farmId)
      .eq('user_id', supabaseUid);

    if (deleteError) {
      return res.status(500).json({ error: deleteError.message });
    }

    securityLogger.logActivity("INFO", "Farm Deleted", { farmId, userId: supabaseUid });
    res.status(200).json({ message: "Farm deleted successfully", farmId });

  } catch (err) {
    console.error("Farm delete error:", err);
    res.status(500).json({ error: err.message });
  }
});


module.exports = router;