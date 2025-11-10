import { Router } from "express";
import { initGame } from "../../controllers/ABCD/gameInitController.js";

const r = Router();
r.post("/games/init", initGame);
export default r;
