const axios = require('axios');

async function callMLService(endpoint, payload, token = null) {
  const headers = {};
  
  if (process.env.ML_SERVICE_API_KEY) {
    headers['x-api-key'] = process.env.ML_SERVICE_API_KEY;
  }

  if (token) {
    headers['Authorization'] = token.startsWith('Bearer ') ? token : `Bearer ${token}`;
  }

  const response = await axios.post(
    `${process.env.ML_SERVICE_URL}${endpoint}`,
    payload,
    { headers }
  );
  return response.data;
}

module.exports = callMLService;
