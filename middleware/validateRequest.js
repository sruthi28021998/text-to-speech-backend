function requireJsonContentType(req, res, next) {
  if (req.method === "POST" && !req.is("application/json")) {
    return res.status(400).json({
      success: false,
      error: "Content-Type must be application/json.",
    });
  }
  next();
}

module.exports = { requireJsonContentType };