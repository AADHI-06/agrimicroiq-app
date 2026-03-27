const supabase = require('../supabaseClient');

/**
 * Security Logger Utility
 * Centralizes all security-critical entries into the Supabase 'logs' table.
 */
const securityLogger = {
  /**
   * Log an authentication-related event.
   */
  logAuth: async (level, message, context = {}) => {
    try {
      await supabase.from('logs').insert([{
        level,
        message: `[AUTH] ${message}`,
        context: { ...context, timestamp: new Date().toISOString() }
      }]);
    } catch (err) {
      console.error("Security Logging Failed:", err.message);
    }
  },

  /**
   * Log an ML service or processing event.
   */
  logActivity: async (level, message, context = {}) => {
    try {
      await supabase.from('logs').insert([{
        level,
        message: `[SYSTEM] ${message}`,
        context: { ...context, timestamp: new Date().toISOString() }
      }]);
    } catch (err) {
      console.error("Activity Logging Failed:", err.message);
    }
  },

  /**
   * Log a security violation or unauthorized attempt (403/401).
   */
  logViolation: async (message, context = {}) => {
    try {
      await supabase.from('logs').insert([{
        level: 'CRITICAL',
        message: `[VIOLATION] ${message}`,
        context: { ...context, timestamp: new Date().toISOString() }
      }]);
    } catch (err) {
      console.error("Violation Logging Failed:", err.message);
    }
  }
};

module.exports = securityLogger;
