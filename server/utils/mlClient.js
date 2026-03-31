const axios = require('axios');

const ML_BASE_URL = process.env.ML_SERVICE_URL || 'https://agrimicroiq-ml-service.onrender.com';
const ML_TIMEOUT = 90000; // 90s — Render free-tier cold starts can take 60-90s
const MAX_RETRIES = 2;    // Retry once on 502/503 (container waking up)
const RETRY_DELAY = 3000; // 3s between retries

async function callMLService(endpoint, payload, token = null) {
  const headers = {};
  
  if (process.env.ML_SERVICE_API_KEY) {
    headers['x-api-key'] = process.env.ML_SERVICE_API_KEY;
  }

  if (token) {
    headers['Authorization'] = token.startsWith('Bearer ') ? token : `Bearer ${token}`;
  }

  const url = `${ML_BASE_URL}${endpoint}`;
  
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      console.log(`ML Service [${endpoint}] attempt ${attempt}/${MAX_RETRIES} → ${url}`);
      const response = await axios.post(url, payload, { headers, timeout: ML_TIMEOUT });
      return response.data;
    } catch (error) {
      const status = error.response?.status;
      const errorMsg = error.response?.data || error.message;
      
      console.error(`ML Service Error [${endpoint}] attempt ${attempt}:`, { status, errorMsg });
      
      // Retry on 502/503 (Render container waking up) — but not on last attempt
      if ((status === 502 || status === 503) && attempt < MAX_RETRIES) {
        console.log(`ML Service [${endpoint}]: Render container likely waking up. Retrying in ${RETRY_DELAY}ms...`);
        await new Promise(r => setTimeout(r, RETRY_DELAY));
        continue;
      }
      
      throw error;
    }
  }
}

module.exports = callMLService;
