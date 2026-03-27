require('dotenv').config();
const supabase = require('./supabaseClient');

async function testHistoryRoute() {
  try {
    const { data: farms, error } = await supabase.from('farms').select('*').limit(1);
    if (error || farms.length === 0) {
      console.log('No farms found.');
      return;
    }
    const farmId = farms[0].id;
    console.log(`Testing History for Farm: ${farmId}`);

    const { data: zones } = await supabase.from('micro_zones').select('id, ndvi_value').eq('farm_id', farmId);
    let zoneIds = zones ? zones.map(z => z.id) : [];

    let pestTrends = [], resourceTrends = [];
    if (zoneIds.length > 0) {
      const { data: pests } = await supabase.from('pest_predictions').select('*').in('zone_id', zoneIds).limit(2);
      pestTrends = pests || [];
      const { data: resources } = await supabase.from('resource_recommendations').select('*').in('zone_id', zoneIds).limit(2);
      resourceTrends = resources || [];
    }
    
    const { data: yields } = await supabase.from('yield_simulations').select('*').eq('farm_id', farmId).limit(2);
    
    console.log("✅ History Compilation Success!");
    console.log(`Found ${zones.length} NDVI points, ${pestTrends.length} Pest Records, ${resourceTrends.length} Resource Recommendations, and ${(yields||[]).length} Yield Simulations.`);

  } catch (e) {
    console.error(e);
  }
}

testHistoryRoute();
