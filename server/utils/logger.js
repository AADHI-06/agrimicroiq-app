const supabase = require('../supabaseClient');

async function log(level, message, context = {}) {
  await supabase.from('logs').insert([
    { level, message, context }
  ]);
}

module.exports = log;
