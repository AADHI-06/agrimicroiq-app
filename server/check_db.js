const supabase = require('./supabaseClient');
async function check() {
  const { count, error } = await supabase
    .from('pest_predictions')
    .select('*', { count: 'exact', head: true });
  console.log('Count:', count);
  console.log('Error:', error);
}
check();
