// controllers/gameserviceController.js
import User from "../../models/userModel.js";
import Session from "../../models/ABCD/Session.js";
import Bet from "../../models/ABCD/Bet.js";
import Win from "../../models/ABCD/Win.js";

const OK = "OK";
const SESSION_NOT_FOUND = "SESSION_NOT_FOUND";
const CURRENCY_NOT_SUPPORTED = "CURRENCY_NOT_SUPPORTED";
const INVALID_PAYLOAD = "INVALID_PAYLOAD";
const INSUFFICIENT_BALANCE = "INSUFFICIENT_BALANCE";
const BET_ARE_EXISTS = "BET_ARE_EXISTS";
const ACTION_NOT_FOUND = "ACTION_NOT_FOUND";
const ACTION_ROLLBACKED = "ACTION_ROLLBACKED";


function toMoneyString(n) {
  // Your user.balance is a Number; API wants a STRING with decimals
  return Number(n || 0).toFixed(2);
}

const m = (n) => Number(n || 0).toFixed(2)

export async function handleBalance(req, res) {
  try {
    const { action, session_id, currency } = req.body || {};

    // 1) action guard (optional, because route already routes by action)
    if (action !== "balance") {
      return res.json({ error: true, code: "UNHANDLED", message: "Unknown action" });
    }

    // 2) session must exist and be active
    const session = await Session.findById(session_id);
    if (!session || session.status !== "active") {
      return res.json({
        error: true,
        code: SESSION_NOT_FOUND,
        message: "The session has expired or does not exist",
      });
    }

    // 3) currency must match session currency
    if (session.currency !== currency) {
      return res.json({
        error: true,
        code: CURRENCY_NOT_SUPPORTED,
        message: "Requested currency is not supported",
      });
    }

    // 4) load user and return balance
    const user = await User.findById(session.userId);
    const balanceStr = toMoneyString(user?.balance || 0);

    return res.json({
      error: false,
      code: OK,
      message: "Balance retrieved successfully",
      data: {
        balance: balanceStr,
        currency: session.currency,
      },
    });
  } catch (e) {
    console.error(e);
    return res.json({ error: true, code: "UNHANDLED", message: "Server error" });
  }
}



export async function handleBet(req, res) {
  try {
    const b = req.body || {};
    // Required fields (minimal set we’ll use)
    const required = ["game_uuid","amount","currency","session_id","bet_id","transaction_id"];
    for (const k of required) {
      if (b[k] === undefined || b[k] === null || b[k] === "") {
        return res.json({ error: true, code: "REQ_FIELD", message: `Missing ${k}` });
      }
    }

    // 1) session + currency checks
    const session = await Session.findById(b.session_id);
    if (!session || session.status !== "active") {
      return res.json({ error: true, code: SESSION_NOT_FOUND, message: "Session invalid" });
    }
    if (session.currency !== b.currency) {
      return res.json({ error: true, code: CURRENCY_NOT_SUPPORTED, message: "Currency mismatch" });
    }

    // 2) amount validation (> 0)
    const amountNum = Number(b.amount);
    if (!(amountNum >= 5)) {
      return res.json({ error: true, code: INVALID_PAYLOAD, message: "Amount must be > 0" });
    }

    // 3) Idempotency: same transaction_id → return success with current balance
    const existing = await Bet.findById(b.transaction_id);
    if (existing) {
      const user = await User.findById(session.userId);
      return res.json({
        error: false,
        code: OK,
        message: "Bet already processed",
        data: { balance: toMoneyString(user?.balance || 0), transaction_id: existing._id }
      });
    }

    // 4) Duplicate pair safeguard: (game_uuid + bet_id)
    const pairExists = await Bet.findOne({ gameUuid: b.game_uuid, betId: b.bet_id });
    if (pairExists) {
      return res.json({ error: true, code: BET_ARE_EXISTS, message: "Bet already exists" });
    }

    // 5) Load user, check funds (unless freeround)
    const user = await User.findById(session.userId);
    if (!user) {
      return res.json({ error: true, code: "PLAYER_NOT_FOUND", message: "User not found" });
    }

    const isFreeround = !!b.freeround_id;
    if (!isFreeround && user.balance < amountNum) {
      return res.json({ error: true, code: INSUFFICIENT_BALANCE, message: "Insufficient balance" });
    }

    // 6) Mutate balance (skip for freeround)
    if (!isFreeround) {
      user.balance = Number(user.balance || 0) - amountNum;
      await user.save();
    }

    // 7) Persist bet
    await Bet.create({
      _id: b.transaction_id,
      gameUuid: b.game_uuid,
      betId: b.bet_id,
      roundId: b.round_id || "",
      userId: session.userId,
      sessionId: b.session_id,
      currency: b.currency,
      amount: amountNum,
      freeround: isFreeround
        ? { id: b.freeround_id || "", clientId: b.client_freeround_id || "", type: b.freeround_type || "" }
        : undefined,
      status: "accepted",
    });

    // 8) Respond with updated balance (string)
    return res.json({
      error: false,
      code: OK,
      message: "Bet placed successfully",
      data: { balance: toMoneyString(user.balance), transaction_id: b.transaction_id }
    });
  } catch (e) {
    console.error(e);
    return res.json({ error: true, code: "UNHANDLED", message: "Server error" });
  }
}


export async function handleWin(req, res) {
  try {
    const w = req.body || {};
    const required = ["game_uuid","amount","currency","session_id","bet_id","transaction_id","bet_trx_id"];
    for (const k of required) {
      if (w[k] === undefined || w[k] === null || w[k] === "") {
        return res.json({ error: true, code: "REQ_FIELD", message: `Missing ${k}` });
      }
    }

    // 1) session + currency
    const session = await Session.findById(w.session_id);
    if (!session || session.status !== "active") {
      return res.json({ error: true, code: SESSION_NOT_FOUND, message: "Session invalid" });
    }
    if (session.currency !== w.currency) {
      return res.json({ error: true, code: CURRENCY_NOT_SUPPORTED, message: "Currency mismatch" });
    }

    // 2) amount > 0
    const amountNum = Number(w.amount);
    if (!(amountNum > 0)) {
      return res.json({ error: true, code: INVALID_PAYLOAD, message: "Amount must be > 0" });
    }

    // 3) idempotency on win transaction_id
    const existing = await Win.findById(w.transaction_id);
    if (existing) {
      const user = await User.findById(session.userId);
      return res.json({
        error: false, code: OK, message: "Win already processed",
        data: { balance: toMoneyString(user?.balance || 0), transaction_id: existing._id }
      });
    }

    // 4) referenced bet must exist and not be rolled back
    const bet = await Bet.findById(w.bet_trx_id);
    if (!bet) return res.json({ error: true, code: ACTION_NOT_FOUND, message: "Original bet not found" });
    if (bet.status === "rolled_back") {
      return res.json({ error: true, code: ACTION_ROLLBACKED, message: "Bet was rolled back" });
    }

    // 5) credit user
    const user = await User.findById(session.userId);
    if (!user) return res.json({ error: true, code: "PLAYER_NOT_FOUND", message: "User not found" });

    user.balance = Number(user.balance || 0) + amountNum;
    await user.save();

    // 6) persist win
    await Win.create({
      _id: w.transaction_id,
      gameUuid: w.game_uuid,
      betId: w.bet_id,
      betTrxId: w.bet_trx_id,
      userId: session.userId,
      sessionId: w.session_id,
      currency: w.currency,
      amount: amountNum,
      freeround: w.freeround_id
        ? { id: w.freeround_id || "", clientId: w.client_freeround_id || "", type: w.freeround_type || "" }
        : undefined,
    });

    // 7) respond with new balance
    return res.json({
      error: false, code: OK, message: "Win credited successfully",
      data: { balance: toMoneyString(user.balance), transaction_id: w.transaction_id }
    });
  } catch (e) {
    console.error(e);
    return res.json({ error: true, code: "UNHANDLED", message: "Server error" });
  }
}

export async function handleRollback(req, res) {
  try {
    const r = req.body || {};
    console.log("[rollback] start", r);

    for (const k of ["game_uuid","amount","currency","session_id","bet_id","transaction_id","rollback_transaction_id"]) {
      if (!r[k] && r[k] !== 0) {
        console.log("[rollback] missing", k);
        return res.status(200).json({ error:true, code:"REQ_FIELD", message:`Missing ${k}` });
      }
    }

    const session = await Session.findById(r.session_id);
    console.log("[rollback] session", session?._id, session?.status, session?.currency);
    if (!session || session.status !== "active") {
      return res.status(200).json({ error:true, code:SESSION_NOT_FOUND, message:"Session invalid" });
    }
    if (session.currency !== r.currency) {
      console.log("[rollback] currency mismatch", session.currency, r.currency);
      return res.status(200).json({ error:true, code:CURRENCY_NOT_SUPPORTED, message:"Currency mismatch" });
    }

    const amountNum = Number(r.amount);
    if (!(amountNum > 0)) {
      console.log("[rollback] invalid amount", r.amount);
      return res.status(200).json({ error:true, code:INVALID_PAYLOAD, message:"Amount must be > 0" });
    }

    const bet = await Bet.findById(r.rollback_transaction_id);
    console.log("[rollback] bet?", !!bet, r.rollback_transaction_id);
    if (!bet) {
      return res.status(200).json({ error:true, code:ACTION_NOT_FOUND, message:"Original bet not found" });
    }

    const user = await User.findById(session.userId);
    console.log("[rollback] user", session.userId, "exists:", !!user);
    if (!user) {
      return res.status(200).json({ error:true, code:"PLAYER_NOT_FOUND", message:"User not found" });
    }

    if (bet.status === "rolled_back") {
      console.log("[rollback] already rolled back");
      return res.status(200).json({
        error:false, code:OK, message:"Rollback already processed",
        data:{ balance:m(user.balance), transaction_id:r.transaction_id }
      });
    }

    const isFree = !!(bet.freeround && (bet.freeround.id || bet.freeround.clientId));
    if (!isFree) {
      user.balance = Number(user.balance || 0) + amountNum;
      await user.save();
      console.log("[rollback] refunded", amountNum, "new balance", user.balance);
    } else {
      console.log("[rollback] freeround — no refund");
    }

    bet.status = "rolled_back";
    await bet.save();

    return res.status(200).json({
      error:false, code:OK, message:"Rollback processed",
      data:{ balance:m(user.balance), transaction_id:r.transaction_id }
    });
  } catch (e) {
    console.error("ROLLBACK ERROR (detailed):", e);
    return res.status(200).json({ error:true, code:"UNHANDLED", message:e.message || "Server error" });
  }
}


// controllers/gameserviceController.js
export async function handleBulkWin(req, res) {
  try {
    const { transactions = [] } = req.body || {};
    if (!Array.isArray(transactions) || transactions.length === 0) {
      return res.status(200).json({ error: true, code: "INVALID_PAYLOAD", message: "transactions[] required" });
    }

    const successes = [];
    const pushed = new Set();  // <— track what we already returned

    for (const t of transactions) {
      try {
        for (const k of ["game_uuid","amount","currency","session_id","bet_id","transaction_id","bet_trx_id"]) {
          if (!t[k] && t[k] !== 0) throw new Error(`Missing ${k}`);
        }

        // Idempotency at request level: if this tx id already appeared earlier in THIS payload,
        // treat as success but don't push it again to the response list.
        if (pushed.has(t.transaction_id)) {
          continue;
        }

        const session = await Session.findById(t.session_id);
        if (!session || session.status !== "active") throw new Error("SESSION_NOT_FOUND");
        if (session.currency !== t.currency) throw new Error("CURRENCY_NOT_SUPPORTED");

        const amountNum = Number(t.amount);
        if (!(amountNum > 0)) throw new Error("INVALID_PAYLOAD");

        // DB idempotency: if already recorded, count as success (but only push once)
        if (await Win.findById(t.transaction_id)) {
          successes.push({ transaction_id: t.transaction_id, client_trx_id: t.transaction_id });
          pushed.add(t.transaction_id);
          continue;
        }

        const bet = await Bet.findById(t.bet_trx_id);
        if (!bet) throw new Error("ACTION_NOT_FOUND");
        if (bet.status === "rolled_back") throw new Error("ACTION_ROLLBACKED");

        const user = await User.findById(session.userId);
        if (!user) throw new Error("PLAYER_NOT_FOUND");

        user.balance = Number(user.balance || 0) + amountNum;
        await user.save();

        await Win.create({
          _id: t.transaction_id,
          gameUuid: t.game_uuid,
          betId: t.bet_id,
          betTrxId: t.bet_trx_id,
          userId: session.userId,
          sessionId: t.session_id,
          currency: t.currency,
          amount: amountNum,
          freeround: t.freeround_id
            ? { id: t.freeround_id || "", clientId: t.client_freeround_id || "", type: t.freeround_type || "" }
            : undefined,
        });

        successes.push({ transaction_id: t.transaction_id, client_trx_id: t.transaction_id });
        pushed.add(t.transaction_id);
      } catch {
        // skip failed item per spec
      }
    }

    return res.status(200).json({
      error: false,
      code: "OK",
      message: "Bulk win processed",
      data: { transactions: successes }
    });
  } catch (e) {
    console.error("BULK-WIN ERROR:", e);
    return res.status(200).json({ error: true, code: "UNHANDLED", message: "Server error" });
  }
}
