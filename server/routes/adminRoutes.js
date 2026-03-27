const express = require('express');
const supabase = require('../supabaseClient');
const verifyToken = require('../middleware/authMiddleware');
const verifyAdmin = require('../middleware/adminMiddleware');

const router = express.Router();

// GET /api/admin/users
router.get('/users', verifyToken, verifyAdmin, async (req, res) => {
  try {
    // Only return safe fields (Do not expose internal identifiers, password hashes, etc. if they existed)
    // Supabase standard auth doesn't store passwords here, but we explicitly restrict the select for safety.
    const { data: users, error } = await supabase
      .from('users')
      .select('id, firebase_uid, email, role, created_at')
      .order('created_at', { ascending: false });

    if (error) {
      console.error("Error fetching users list:", error.message);
      return res.status(500).json({ error: "Failed to fetch users list." });
    }

    return res.status(200).json({ users });

  } catch (err) {
    console.error("Error in admin users route:", err.message);
    res.status(500).json({ error: "Internal server error." });
  }
});

// GET /api/admin/logs
router.get('/logs', verifyToken, verifyAdmin, async (req, res) => {
  try {
    const { data: logs, error } = await supabase
      .from('logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100);

    if (error) {
      console.error("Error fetching admin logs:", error.message);
      return res.status(500).json({ error: "Failed to fetch application logs." });
    }

    return res.status(200).json({ logs });

  } catch (err) {
    console.error("Error in admin logs route:", err.message);
    res.status(500).json({ error: "Internal server error." });
  }
});

module.exports = router;
