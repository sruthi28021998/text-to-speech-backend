const rateLimit = require("express-rate-limit");

const ttsRateLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || "60000", 10),
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || "10", 10),
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: "Too many requests. Please slow down and try again shortly.",
  },
});

module.exports = { ttsRateLimiter };