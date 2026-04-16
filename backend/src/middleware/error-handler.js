export function notFoundHandler(req, res) {
  return res.status(404).json({ error: "Endpoint no encontrado" });
}

export function errorHandler(err, req, res, next) {
  console.error("[backend-error]", err);

  if (res.headersSent) {
    return next(err);
  }

  return res.status(500).json({
    error: "Error interno del servidor",
  });
}
