function notFoundHandler(req, res, next) {
  res.status(404).json({ success: false, error: "Resource not found." });
}

function errorHandler(err, req, res, next) {
  console.error("[error]", err.message);

  const status = err.status || 500;
  const message =
    status === 500 ? "Internal server error. Please try again later." : err.message;

  res.status(status).json({ success: false, error: message });
}

module.exports = { notFoundHandler, errorHandler };