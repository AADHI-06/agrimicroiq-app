const express = require('express');
const axios = require('axios');
const verifyToken = require('../middleware/authMiddleware');
const { validate, schemas } = require('../middleware/validationMiddleware');

const router = express.Router();

/**
 * Fetch Current Weather Data
 * POST /api/weather/current
 */
router.post('/current', verifyToken, validate(schemas.weatherAccess), async (req, res) => {
  try {
    const { lat, lon } = req.body;

    const apiKey = process.env.OPENWEATHER_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: "OpenWeather API key is missing." });
    }

    const response = await axios.get('https://api.openweathermap.org/data/2.5/weather', {
      params: {
        lat,
        lon,
        appid: apiKey,
        units: 'metric' // Fetch in Celsius
      }
    });

    // Extracting basic info requested by user: temperature, humidity, rainfall (if any)
    const data = response.data;
    const weatherInfo = {
      temperature: data.main.temp,
      humidity: data.main.humidity,
      rainfall: data.rain ? data.rain['1h'] || 0 : 0, // openweathermap rainfall in the last 1 hour
      description: data.weather[0].description,
      raw: data
    };

    res.status(200).json(weatherInfo);

  } catch (err) {
    console.error("OpenWeather API Error (Current):", err.response?.data || err.message);
    res.status(500).json({ error: "Failed to fetch current weather data." });
  }
});

/**
 * Fetch 5-Day Forecast Weather Data
 * POST /api/weather/forecast
 */
router.post('/forecast', verifyToken, validate(schemas.weatherAccess), async (req, res) => {
  try {
    const { lat, lon } = req.body;

    const apiKey = process.env.OPENWEATHER_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: "OpenWeather API key is missing." });
    }

    const response = await axios.get('https://api.openweathermap.org/data/2.5/forecast', {
      params: {
        lat,
        lon,
        appid: apiKey,
        units: 'metric'
      }
    });

    res.status(200).json(response.data);

  } catch (err) {
    console.error("OpenWeather API Error (Forecast):", err.response?.data || err.message);
    res.status(500).json({ error: "Failed to fetch forecast weather data." });
  }
});

module.exports = router;
