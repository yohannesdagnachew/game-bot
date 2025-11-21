// routes/gameservice.js
import { Router } from "express";
import verifyWebhook from "../../lib/ABCD/verifyWebhook.js";
import verifyGameSecret from "../../middleware/verifyGameSecret.js";
import verifyProviderSignature from "../../middleware/verifyProviderSignature.js";
import { handleBalance, handleBet, handleWin,handleRollback,handleBulkWin } from "../../controllers/ABCD/gameserviceController.js";

const r = Router();
r.use(verifyWebhook);

r.post("/callback", async (req, res) => {
  const { action } = req.body || {};
  
  if (action === "balance")  return handleBalance(req, res);
  if (action === "bet")      return handleBet(req, res);
  if (action === "win")      return handleWin(req, res);
  if (action === "rollback") return handleRollback(req, res);
  if (action === "bulk-win") return handleBulkWin(req, res);
  return res.json({ error: true, code: "UNHANDLED", message: "Unknown action" });
});



export default r;
