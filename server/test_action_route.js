require('dotenv').config();
const supabase = require('./supabaseClient');

async function testActionRoute() {
  try {
    const { data: zones, error } = await supabase.from('micro_zones').select('*').limit(1);
    if (error || zones.length === 0) {
      console.log('No zones found.');
      return;
    }
    const zoneId = zones[0].id;

    console.log(`Testing Actions for Zone: ${zoneId}`);

    // Fetch latest pest + resource
    const { data: pestData } = await supabase.from('pest_predictions').select('*').eq('zone_id', zoneId).order('created_at', { ascending: false }).limit(1);
    const { data: resData } = await supabase.from('resource_recommendations').select('*').eq('zone_id', zoneId).order('created_at', { ascending: false }).limit(1);

    const pestRecord = pestData ? pestData[0] : null;
    const resRecord = resData ? resData[0] : null;

    let priorityScore = 0.0;
    
    if (pestRecord) {
      if ((pestRecord.risk_level || '').toLowerCase() === 'high') priorityScore += 5.0;
      else if ((pestRecord.risk_level || '').toLowerCase() === 'medium') priorityScore += 3.0;
      else if ((pestRecord.risk_level || '').toLowerCase() === 'low') priorityScore += 1.0;
      priorityScore += (pestRecord.probability * 2.0);
    }
    if (resRecord) {
      if (resRecord.water_requirement > 50) priorityScore += 2.0;
      if (resRecord.fertilizer_amount > 20) priorityScore += 1.5;
    }

    let actionType = priorityScore >= 7 ? "CRITICAL" : priorityScore >= 4 ? "MODERATE" : priorityScore > 1 ? "ROUTINE" : "STANDBY";
    
    console.log(`Computed Score: ${priorityScore}, Action: ${actionType}`);

    const { data: insertData, error: insErr } = await supabase.from('action_plans').insert({ zone_id: zoneId, action_type: actionType, priority_score: priorityScore }).select().single();
    if (insErr) console.error("❌ Action Plans DB Insert Failed:", insErr.message);
    else console.log("✅ Action inserted:", insertData.id);

  } catch (e) {
    console.error(e);
  }
}

testActionRoute();
