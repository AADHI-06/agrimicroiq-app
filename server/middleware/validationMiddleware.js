const Joi = require('joi');

const validate = (schema, property = 'body') => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req[property], { abortEarly: false, stripUnknown: true });
    if (error) {
      const details = error.details.map(d => d.message).join(', ');
      return res.status(400).json({ error: "Validation Failed", details });
    }
    // Replace req[property] with validated/sanitized values
    req[property] = value;
    next();
  };
};

const schemas = {
  // Common UUID Schema
  idOnly: Joi.object({
    zoneId: Joi.string().guid({ version: ['uuidv4'] }),
    farmId: Joi.string().guid({ version: ['uuidv4'] })
  }).or('zoneId', 'farmId'),

  // Farm Creation
  farmCreate: Joi.object({
    farmName: Joi.string().min(1).max(255).required().trim(),
    cropType: Joi.string().min(1).max(100).required().trim(),
    geoPolygon: Joi.object().required() // Can be more specific if structure is known
  }),

  // Predict Risk / Optimize / Action
  zoneAccess: Joi.object({
    zoneId: Joi.string().guid({ version: ['uuidv4'] }).required()
  }),

  // Yield Simulation
  yieldSim: Joi.object({
    farmId: Joi.string().guid({ version: ['uuidv4'] }).required()
  }),

  // Weather Logic
  weatherAccess: Joi.object({
    lat: Joi.number().min(-90).max(90).required(),
    lon: Joi.number().min(-180).max(180).required()
  })
};

module.exports = { validate, schemas };
