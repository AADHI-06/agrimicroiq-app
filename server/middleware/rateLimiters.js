const rateLimit = require('express-rate-limit');

// General API Rate Limiter: 100 requests per 15 minutes
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  message: {
    error: "Too many requests",
    message: "General API limit exceeded. Please try again after 15 minutes."
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

// Stricter Auth Rate Limiter: 10 requests per 15 minutes
// Applied to Login and Signup to prevent brute force
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: {
    error: "Too many authentication attempts",
    message: "Auth limit exceeded. Please try again after 15 minutes."
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Stricter ML Rate Limiter: 20 requests per 15 minutes
// Applied to expensive ML prediction endpoints
const mlLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 50,
  message: {
    error: "Too many ML prediction requests",
    message: "ML service quota exceeded. Please try again after 15 minutes."
  },
  standardHeaders: true,
  legacyHeaders: false,
});

module.exports = {
  apiLimiter,
  authLimiter,
  mlLimiter
};
