// lib/verifyWebhook.js
export default function verifyWebhook(req, res, next) {
  // const token = req.get("x-gameservice-secret");
  // if (!token || token !== process.env.WEBHOOK_SHARED_SECRET) {
  //   return res.json({ error: true, code: "UNHANDLED", message: "Unauthorized" });
  // }
  next();
}
