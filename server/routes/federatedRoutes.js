const express = require('express');
const supabase = require('../supabaseClient');
const verifyToken = require('../middleware/authMiddleware');

const router = express.Router();

// POST /api/federated/aggregate
router.post('/aggregate', verifyToken, async (req, res) => {
  try {
    // 1. Fetch all recent pest_predictions (last 50 for simulation)
    const { data: pestData, error: pestError } = await supabase
      .from('pest_predictions')
      .select('probability')
      .order('created_at', { ascending: false })
      .limit(50);

    if (pestError) {
      console.error("Pest predictions fetch error:", pestError.message);
      return res.status(404).json({ error: "Pest data unavailable or table missing." });
    }

    if (!pestData || pestData.length === 0) {
      return res.status(404).json({ error: "No pest predictions available to aggregate yet." });
    }

    // 2. Compute averaged weights (simulated ML aggregation locally on backend)
    // We mock the federated learning parameter update averaging by taking the mean of probabilities
    // as a proxy for the 'weight gradient'.
    let totalProb = 0;
    for (const record of pestData) {
      totalProb += record.probability;
    }
    const avgProb = totalProb / pestData.length;

    const newParameterSet = {
      base_probability_bias: avgProb,
      learning_rate: 0.01,
      samples_aggregated: pestData.length,
      timestamp: new Date().toISOString()
    };

    // 3. Try to increment version and store (graceful if table doesn't exist)
    let nextVersion = 1;
    try {
      const { data: latestVersionData, error: versionError } = await supabase
        .from('federated_params')
        .select('version')
        .order('version', { ascending: false })
        .limit(1);

      if (!versionError && latestVersionData && latestVersionData.length > 0) {
        nextVersion = latestVersionData[0].version + 1;
      }

      // 4. Insert new parameter_set JSON
      const { data: insertData, error: insertError } = await supabase
        .from('federated_params')
        .insert({
          parameter_set: newParameterSet,
          version: nextVersion
        })
        .select()
        .single();

      if (insertError) {
        console.error("Federated params insert error:", insertError.message);
        // Return results even if storage fails
        return res.status(200).json({
          message: "Parameters computed but storage unavailable.",
          version: nextVersion,
          parameters: newParameterSet
        });
      }

      return res.status(200).json({
        message: "Federated parameters successfully aggregated.",
        version: insertData.version,
        record_id: insertData.id
      });
    } catch (dbError) {
      console.error("Federated DB error:", dbError.message);
      // Still return the computed parameters
      return res.status(200).json({
        message: "Parameters computed (storage skipped).",
        version: nextVersion,
        parameters: newParameterSet
      });
    }

  } catch (error) {
    console.error("Error aggregating federated params:", error.message);
    res.status(500).json({ error: "Internal server error." });
  }
});

module.exports = router;
