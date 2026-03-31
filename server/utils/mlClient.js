const axios = require('axios');

async function callMLService(endpoint, payload, token = null) {
  const headers = {};
  
  if (process.env.ML_SERVICE_API_KEY) {
    headers['x-api-key'] = process.env.ML_SERVICE_API_KEY;
  }

  if (token) {
    headers['Authorization'] = token.startsWith('Bearer ') ? token : `Bearer ${token}`;
  }

  try {
    const response = await axios.post(
      `${process.env.ML_SERVICE_URL || 'https://agrimicroiq-ml-service.onrender.com'}${endpoint}`,
      payload,
      { 
        headers,
        timeout: 60000 // 60-second timeout to allow Render Free-Tier Container Spin-Up
      }
    );
    return response.data;
  } catch (error) {
    const errorMsg = error.response ? error.response.data : error.message;
    console.error(`ML Service Error [${endpoint}]:`, errorMsg);
    throw error;
  }
}

module.exports = callMLService;
