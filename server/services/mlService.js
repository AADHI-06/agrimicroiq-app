const callMLService = require('../utils/mlClient');

const getPestRisk = async (payload, token = null) => {
    // If payload is just a number (NDVI), wrap it. 
    // Otherwise assume it's the full ML payload object.
    const finalPayload = typeof payload === 'number' 
        ? { ndvi: payload, temperature: 28.5, humidity: 65, rainfall: 5 }
        : payload;

    return await callMLService('/predict', finalPayload, token);
};

module.exports = { getPestRisk };