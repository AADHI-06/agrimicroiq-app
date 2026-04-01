/**
 * ML Service Keep-Alive Pinger
 * 
 * Render free-tier containers sleep after 15 minutes of inactivity.
 * This module pings the ML service every 13 minutes with a lightweight
 * HEAD request to `/` to prevent it from sleeping.
 * 
 * Only activates when running on Render (not locally or on Firebase Functions).
 */
const axios = require('axios');

const ML_BASE_URL = process.env.ML_SERVICE_URL || 'https://agrimicroiq-ml-service.onrender.com';
const PING_INTERVAL = 13 * 60 * 1000; // 13 minutes (under 15min sleep threshold)
let pingTimer = null;
let lastPingStatus = null;

async function pingMLService() {
  try {
    const start = Date.now();
    const res = await axios.head(ML_BASE_URL, { timeout: 30000 });
    const latency = Date.now() - start;
    lastPingStatus = { alive: true, latency, timestamp: new Date().toISOString() };
    console.log(`🏓 ML Keep-Alive: OK (${latency}ms)`);
  } catch (err) {
    lastPingStatus = { alive: false, error: err.message, timestamp: new Date().toISOString() };
    console.warn(`🏓 ML Keep-Alive: FAILED — ${err.message}`);
  }
}

function startKeepAlive() {
  // Only run on Render (where PORT is set by platform and IS_RENDER or RENDER is set)  
  // Also activate if ML_KEEP_ALIVE=true is explicitly set
  const isRender = !!process.env.RENDER || !!process.env.IS_RENDER;
  const forceKeepAlive = process.env.ML_KEEP_ALIVE === 'true';

  if (!isRender && !forceKeepAlive) {
    console.log('🏓 ML Keep-Alive: Skipped (not running on Render). Set ML_KEEP_ALIVE=true to force.');
    return;
  }

  console.log(`🏓 ML Keep-Alive: Started — pinging ${ML_BASE_URL} every ${PING_INTERVAL / 60000} minutes`);
  
  // Ping immediately on boot (wake it up)
  pingMLService();
  
  // Then keep pinging
  pingTimer = setInterval(pingMLService, PING_INTERVAL);
}

function stopKeepAlive() {
  if (pingTimer) {
    clearInterval(pingTimer);
    pingTimer = null;
    console.log('🏓 ML Keep-Alive: Stopped');
  }
}

function getStatus() {
  return lastPingStatus;
}

module.exports = { startKeepAlive, stopKeepAlive, getStatus, pingMLService };
