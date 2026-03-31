require('dotenv').config({ path: require('path').join(__dirname, '.env') });
const express = require('express');
const cors = require('cors');
const verifyToken = require('./middleware/authMiddleware');
const log = require('./utils/logger');
const authRoutes = require('./routes/authRoutes');
const farmRoutes = require('./routes/farmRoutes');
const satelliteRoutes = require('./routes/satelliteRoutes');
const weatherRoutes = require('./routes/weatherRoutes');
const pestRoutes = require('./routes/pestRoutes');
const resourceRoutes = require('./routes/resourceRoutes');
const yieldRoutes = require('./routes/yieldRoutes');
const actionRoutes = require('./routes/actionRoutes');
const historyRoutes = require('./routes/historyRoutes');
const federatedRoutes = require('./routes/federatedRoutes');
const reportRoutes = require('./routes/reportRoutes');
const adminRoutes = require('./routes/adminRoutes');
const demoRoutes = require('./routes/demoRoutes'); // Phase 73: Demo Simulations
const pestSummaryRoutes = require('./routes/pestSummaryRoutes');

const { apiLimiter, authLimiter, mlLimiter } = require('./middleware/rateLimiters');

const app = express();
app.use(cors({
  origin: [
    "https://agrimicroiq-app.onrender.com", // Backend (self-reference)
    "https://agri-micro-iq.web.app",        // Frontend (Firebase)
    "http://localhost:3000"                // Local development
  ],
  credentials: true
}));
app.use(express.json());

// Apply general API rate limiting to all requests under /api
app.use('/api', apiLimiter);

// Apply strict limiting for Auth - Syncing user (Part of flow)
app.use('/api/auth', authLimiter);

// Apply strict limiting for ML endpoints
app.use('/api/pest', mlLimiter);
app.use('/api/resource', mlLimiter);
app.use('/api/yield', mlLimiter);
app.use('/api/demo', mlLimiter);

// Global API Telemetry & Audit Logger
app.use(async (req, res, next) => {
  try {
    const timestamp = new Date().toISOString();
    
    // Log absolute route initialization
    await log('info', `[START] ${req.method} ${req.originalUrl}`, {
      endpoint: req.originalUrl,
      uid: 'pending_auth_validation',
      timestamp: timestamp
    });

    // Listen mathematically mapping to precisely when the internal route finishes dumping buffers
    res.on('finish', async () => {
      // Intentionally uncaught. "Do not suppress logging failures."
      const endTimestamp = new Date().toISOString();
      const finalUid = req.user ? (req.user.firebase_uid || req.user.uid) : 'unauthenticated';
      
      await log('info', `[END] ${req.method} ${req.originalUrl} - Status: ${res.statusCode}`, {
        endpoint: req.originalUrl,
        uid: finalUid,
        timestamp: endTimestamp
      });
    });

    next();
  } catch (error) {
    // Failing during the initial await log blocks the entire request explicitly bypassing suppression
    console.error("Critical System Logger Crash:", error);
    next(error);
  }
});

// Global API Standardized Response Formatter
app.use((req, res, next) => {
  const originalJson = res.json;
  
  res.json = function (body) {
    // Prevent double wrapping
    if (body && typeof body === 'object' && body.hasOwnProperty('success')) {
      return originalJson.call(this, body);
    }
    
    // Evaluate explicit error bindings
    if (res.statusCode >= 400 || (body && body.error)) {
      return originalJson.call(this, {
        success: false,
        error: body ? (body.error || body.message || "An error occurred") : "An error occurred"
      });
    }

    // Wrap successful streams cleanly without exposing internal raw structures directly
    return originalJson.call(this, {
      success: true,
      data: body
    });
  };
  
  next();
});

// Deployment Health Check
app.get("/api/health", (req, res) => {
  res.status(200).json({
    status: "OK",
    service: "AgriMicro IQ Backend",
    timestamp: new Date().toISOString()
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/farms', farmRoutes);
app.use('/api/satellite', satelliteRoutes);
app.use('/api/weather', weatherRoutes);
app.use('/api/pest', pestRoutes);
app.use('/api/resource', resourceRoutes);
app.use('/api/yield', yieldRoutes);
app.use('/api/actions', actionRoutes);
app.use('/api/history', historyRoutes);
app.use('/api/federated', federatedRoutes);
app.use('/api/report', reportRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/demo', demoRoutes); // Phase 73: Demo Engine
app.use('/api/pest', pestSummaryRoutes); // Dashboard summary

app.get('/health', async (req, res) => {
  await log('info', 'Health check endpoint hit', { route: '/health' });
  res.status(200).json({ status: 'OK' });
});

if (require.main === module) {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
  });
}

const functions = require('firebase-functions');

module.exports = app;
exports.api = functions.https.onRequest(app);
