// middleware/verifyGameSecret.js
export default function verifyGameSecret(req, res, next) {
  const secret = req.headers["x-gameservice-secret"];
  if (secret !== process.env.GAMESERVICE_SECRET) {
    return res.status(403).json({
      error: true,
      code: "FORBIDDEN",
      message: "Invalid game service secret"
    });
  }
  next();
}
