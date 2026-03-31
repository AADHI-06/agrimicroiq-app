const admin = require('../firebaseAdmin');
const securityLogger = require('../utils/securityLogger');

async function verifyToken(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    securityLogger.logViolation("Missing Authorization Header", { path: req.path, ip: req.ip });
    return res.status(401).json({ error: "Missing Authorization Header" });
  }

  const token = authHeader.split("Bearer ")[1];

  try {
    const decodedToken = await admin.auth().verifyIdToken(token);
    
    // Enforce Email Verification Requirement
    if (!decodedToken.email_verified) {
      securityLogger.logViolation("Unverified email access attempt", { email: decodedToken.email, path: req.path });
      return res.status(403).json({ 
        error: "Email Not Verified", 
        message: "Your email must be verified to access protected resources." 
      });
    }

    req.user = decodedToken;

    // Resolve Supabase UID for downstream ownership checks
    const supabase = require('../supabaseClient');
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('firebase_uid', decodedToken.uid)
      .single();

    if (!userError && user) {
      req.user.supabase_uid = user.id;
    }
    
    next();
  } catch (error) {
    securityLogger.logViolation("Invalid token error", { error: error.message, path: req.path });
    return res.status(401).json({ 
      error: "Unauthorized", 
      message: "Invalid or expired token" 
    });
  }

}

module.exports = verifyToken;
