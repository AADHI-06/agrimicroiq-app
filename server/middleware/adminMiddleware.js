const supabase = require('../supabaseClient');

async function verifyAdmin(req, res, next) {
  try {
    const { data: user, error } = await supabase
      .from('users')
      .select('role')
      .eq('firebase_uid', req.user.uid)
      .single();

    if (error || !user || user.role !== 'admin') {
      return res.status(403).json({ error: "Admin access required" });
    }

    next();
  } catch (err) {
    console.error("Admin verification error:", err.message);
    res.status(500).json({ error: "Internal server error" });
  }
}

module.exports = verifyAdmin;
