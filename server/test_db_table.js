require('dotenv').config();
const supabase = require('./supabaseClient');
async function check() {
  const { data: farms, error: farmError } = await supabase
    .from('farms')
    .select('id, farm_name')
    .limit(1);
  
  if (farmError || !farms || farms.length === 0) {
    console.log('No farms found.');
    return;
  }
  
  const farmId = farms[0].id;
  console.log('Valid Farm ID:', farmId);

  const { data: zones } = await supabase
    .from('micro_zones')
    .select('id')
    .eq('farm_id', farmId)
    .limit(1);
  
  if (zones && zones.length > 0) {
    console.log('Valid Zone ID:', zones[0].id);
  }
}
check();
