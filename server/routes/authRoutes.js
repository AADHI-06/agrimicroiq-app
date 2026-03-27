const express = require('express');
const supabase = require('../supabaseClient');
const verifyToken = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/sync', verifyToken, async (req, res) => {
  const { uid, email } = req.user;

  const { data: existing } = await supabase
    .from('users')
    .select('*')
    .eq('firebase_uid', uid);

  if (existing.length === 0) {
    await supabase.from('users').insert([
      { firebase_uid: uid, email: email }
    ]);
  }

  res.status(200).json({ message: "User synced" });
});

module.exports = router;
