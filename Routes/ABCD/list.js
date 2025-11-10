// routes/games.routes.js
import { Router } from "express";
import { getGamesList } from "../../controllers/ABCD/gamesListController.js";

const router = Router();

// POST to match provider’s style (you can make it GET if you prefer)
router.post("/list", getGamesList);

export default router;
