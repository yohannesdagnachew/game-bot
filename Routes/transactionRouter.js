import router from "express";
import UserModel from "../models/userModel.js";
import validateUser from "../utils/verification/validateUser.js";
import Transaction from "../models/transactionModel.js";
import axios from "axios";
import FormData from "form-data";
import { PAYMENT_STATUS } from "../config/constants.js";
import {COIN_OPTIONS} from "../config/tinderconstant.js";
import {
  createTransaction,
  findTransactionById,
  updateTransactionStatus,
  findTransactionByIdTinder,
  updateTransactionStatusTinder,
} from "../utils/helper/helper.js";
import userModel from "../models/userModel.js";
import crypto from "crypto";
import TinderTransaction from "../models/Tinder/tinderTransactionModel.js";
import TinderUser from "../models/Tinder/tinderUserModel.js";

const transactionRouter = router.Router();


const { CHAPA_KEY, CHAPA_WEBHOOK_SECRET, CHAPA_API, CHAPA_API_WEB } =
  process.env;

transactionRouter.post("/deposit", async (req, res) => {
  try {
    const userData = req.body;
    const { amount, paymentMethod, token, type } = userData;

    if (!amount || !paymentMethod || !token) {
      return res.status(400).json({ message: "Forbidden request" });
    }

    if (type !== "deposit") {
      return res.status(400).json({ message: "Forbidden request 2" });
    }

    const verifyUser = await validateUser(token);
    if (!verifyUser) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const user = await UserModel.findOne({ _id: verifyUser._id });

    if (!user) {
      return res.status(400).json({ message: "User not found" });
    }

    const transaction = await createTransaction(
      user._id,
      amount,
      paymentMethod,
      type
    );

    const txRef = transaction._id.toString();

    const expectedMessage = "Charge initiated".toLowerCase();
    const expectedStatus = "success".toLowerCase();

    const allowedMethods = ["chapa"];
    const amountWithVat = (amount / (1 - 2.5 / 100)).toFixed(2);

    const formData = new FormData();
    formData.append("amount", amountWithVat);
    formData.append("currency", "ETB");
    formData.append("tx_ref", txRef);
    formData.append("email", `gamebot${user.telegramId}@gmail.com`);
    formData.append("mobile", user.phone);
    // formData.append("mobile", "0947056756");

    if (allowedMethods.includes(paymentMethod)) {
      const response = await axios.post(
        CHAPA_API_WEB,
        {
          amount: amountWithVat,
          currency: "ETB",
          email: `gamebot${user.telegramId}@gmail.com`,
          first_name: user.name,
          last_name: "User",
          tx_ref: txRef,
          callback_url: "https://tinder-addis.netlify.app/",
          return_url: "https://tinder-addis.netlify.app/",
          "customization[title]": "Web Payment",
          "customization[description]": "Access premium features",
        },
        {
          headers: {
            Authorization: `Bearer ${CHAPA_KEY}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (
        response.data &&
        response.data.status === "success" &&
        response.data.data.checkout_url
      ) {
        return res.status(200).json({
          requestStatus: PAYMENT_STATUS.PENDING,
          message: "Please complete the payment using the link.",
          checkoutUrl: response.data.data.checkout_url,
        });
      } else {
        return res.status(500).json({
          requestStatus: PAYMENT_STATUS.FAILED,
          message: "Failed to initialize bank payment. Please try again.",
        });
      }
    }

    const { data } = await axios.post(
      `${CHAPA_API}?type=${paymentMethod}`,
      formData,
      {
        headers: {
          Authorization: `Bearer ${CHAPA_KEY}`,
          ...formData.getHeaders(),
        },
      }
    );

    if (
      data &&
      data.message?.toLowerCase() === expectedMessage &&
      data?.status?.toLowerCase() === expectedStatus
    ) {
      return res.status(200).json({
        requestStatus: PAYMENT_STATUS.SUCCESS,
        message: data.message,
      });
    } else {
      return res.status(500).json({
        requestStatus: PAYMENT_STATUS.FAILED,
        message: data.message,
      });
    }
  } catch (err) {
    console.log(err);
    const statusCode = err.response?.status || err.statusCode || 500;
    const message =
      err.response?.data?.message ||
      "Failed to initialize payment. Please try again.";

    return res.status(statusCode).json({
      requestStatus: PAYMENT_STATUS.FAILED,
      message: message,
    });
  }
});

function makeChapaReference(userId) {
  const ts = Date.now().toString(36).toUpperCase(); // ~6–8 chars
  const rnd = Math.random().toString(36).slice(2, 6).toUpperCase(); // 4 chars
  const tail = String(userId || "")
    .slice(-4)
    .toUpperCase(); // 4 chars max
  // WD- + ts + rnd + tail  => ~3 + 8 + 4 + 4 = <= 19 chars
  return `WD-${ts}${rnd}${tail}`;
}

transactionRouter.post("/approve", async (req, res) => {
  console.log("Received approval callback:", req.body);

  const CHAPA_APPROVAL_SECRET = process.env.CHAPA_APPROVAL_SECRET;
  try {
    const { secret, reference, amount } = req.body;
    console.log("✅ Transfer approved callback from Chapa:", req.body);

    const transaction = await Transaction.findOne({ reference: reference });
    if (!transaction) {
      console.log("Transaction not found for reference:", reference);
      return res.status(404).json({ message: "Transaction not found" });
    }

    if (transaction.status === "success") {
      console.log("2");
      return res.status(404).json({ message: "Transaction already approved" });
    }

    if (transaction.status === "failed") {
      console.log("3");
      return res.status(404).json({ message: "Transaction already failed" });
    }

    if (transaction.status !== "pending") {
      console.log("4");
      return res
        .status(400)
        .json({ message: "Transaction not in pending state" });
    }

    if (Number(amount) > transaction.amount) {
      console.log("5");
      return res.status(400).json({ message: "Amount mismatch" });
    }

    if (Number(amount) >= 10000) {
      console.log("6");
      return res.status(400).json({ message: "Amount exceeds limit" });
    }

    const user = await userModel.findById(transaction.user);
    if (!user) {
      console.log("User not found for transaction:", transaction._id);
      return res.status(404).json({ message: "User not found" });
    }

    transaction.status = "success";
    await transaction.save();

    user.balance -= transaction.amount;
    await user.save();

    return res.json({ message: "Transfer approved successfully" });
  } catch (err) {
    console.error("Approval error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

transactionRouter.post("/withdraw", async (req, res) => {
  try {
    const { token, amount, paymentMethod } = req.body;

    let bank_code = "";

    const paymentMethodTrim = paymentMethod.slice(3);
    const paymentMethodOptions = ["telebirr", "cbebirr", "mpesa"];

    if (!paymentMethodOptions.includes(paymentMethodTrim)) {
      return res.status(400).json({ message: "Invalid payment method" });
    }

    if (paymentMethodTrim === "telebirr") {
      bank_code = 855;
    }
    if (paymentMethodTrim === "cbebirr") {
      bank_code = 128;
    }
    if (paymentMethodTrim === "mpesa") {
      bank_code = 266;
    }

    if (bank_code === "")
      return res.status(400).json({ message: "Invalid bank code" });

    // 1) Validate inputs
    if (!token || amount == null || bank_code == null) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const amountNum = Number(amount);
    const bankCodeNum = Number(bank_code);
    if (!Number.isFinite(amountNum) || amountNum <= 0) {
      return res
        .status(400)
        .json({ message: "amount must be a positive number" });
    }
    if (!Number.isFinite(bankCodeNum)) {
      return res.status(400).json({ message: "bank_code must be a number" });
    }

    // 2) Validate user
    const verifyUser = await validateUser(token);
    if (!verifyUser) return res.status(401).json({ message: "Unauthorized" });

    const user = await UserModel.findById(verifyUser._id);
    if (!user) return res.status(404).json({ message: "User not found" });

    // 3) Balance check
    if (user.balance < amountNum) {
      return res.status(400).json({ message: "Insufficient balance" });
    }

    const account_number = user.phone;

    // const account_number = "0947056756";

    if (!account_number) {
      return res
        .status(400)
        .json({ message: "User does not have a valid phone number" });
    }

    // 4) Build payload for Chapa
    const reference = makeChapaReference(user._id);
    const recipientAccount = account_number.replace(/\D/g, "");

    const amountAfterFee = amountNum * 0.975; // deduct 2.5% fee

    const payload = {
      account_name: user.name || "Recipient", // REQUIRED by Chapa
      account_number: recipientAccount,
      amount: amountAfterFee, // send as number
      currency: "ETB", // REQUIRED by Chapa
      reference, // must be unique
      bank_code: bankCodeNum, // send as number
      paymentMethodTrim,
    };

    const transaction = await createTransaction(
      user._id,
      amount,
      paymentMethodTrim,
      "withdraw",
      reference
    );

    // 5) Call Chapa
    const chapaRes = await axios.post(
      "https://api.chapa.co/v1/transfers",
      payload,
      {
        headers: {
          Authorization: `Bearer ${process.env.CHAPA_KEY}`,
          "Content-Type": "application/json",
        },
        timeout: 15000,
      }
    );

    const result = chapaRes.data;
    if (!result || result.status !== "success") {
      return res
        .status(400)
        .json({ message: "Chapa transfer failed", chapa: result });
    }

    // 6) Create transaction and deduct balance

    // verifyChapaTransfer(reference);

    return res.json({
      message: "Withdrawal request sent successfully",
      chapa: result,
      transferId: transaction._id,
      newBalance: user.balance,
    });
  } catch (err) {
    // Expose the real reason from Chapa
    const status = err.response?.status || 500;
    const body = err.response?.data;
    console.error(
      "Withdraw error:",
      status,
      JSON.stringify(body || err.message, null, 2)
    );

    return res.status(status).json({
      message: body?.message || "Chapa transfer failed",
      errors: body?.errors || body || err.message,
    });
  }
});

transactionRouter.post("/webhook", async (req, res, next) => {
  try {
    const payload = JSON.stringify(req.body);
    const {email} = req.body;
    console.log(req.body)

    if (!email.includes("gamebot")) {

      console.log("#######################Tinder#######################")
      try {
        const payload = JSON.stringify(req.body);
        const chapaSig = req.headers["chapa-signature"];
        const xChapaSig = req.headers["x-chapa-signature"];

        const expectedHash = crypto
          .createHmac("sha256", CHAPA_WEBHOOK_SECRET)
          .update(payload)
          .digest("hex");

        if (![chapaSig, xChapaSig].includes(expectedHash)) {
          console.warn("❌ Invalid Webhook signature:", {
            chapaSig,
            xChapaSig,
          });
          return res.status(400).json({ error: "Invalid signature" });
        }

        const txRef = req.body.tx_ref;
        const transaction = await findTransactionByIdTinder(txRef);
        if (!transaction) throw new Error("Transaction not found");
        console.log(transaction)

        if (transaction.status === "success") {
          console.log("⚠️ Duplicate success webhook ignored:");
          return res.sendStatus(200);
        }

        const user = await TinderUser.findById(transaction.payer);
        if (!user) throw new Error("User not found");

        const coinsAdded = COIN_OPTIONS[transaction.amount] || 0;
        if (coinsAdded <= 0)
          throw new Error("Invalid coin mapping for this amount");

        const event = req.body.event;

        if (event === "charge.success") {
          if (transaction.status !== PAYMENT_STATUS.SUCCESS) {
            await updateTransactionStatusTinder(
              transaction._id,
              PAYMENT_STATUS.SUCCESS
            );
            await TinderUser.findByIdAndUpdate(transaction.payer, {
              $inc: { balance: coinsAdded },
            });

          } else {
            console.log(
              "⚠️ Duplicate success webhook ignored:",
              transaction.tx_ref
            );
          }
        } else if (event === "charge.failed" || event === "charge.cancelled") {
          if (transaction.status !== PAYMENT_STATUS.SUCCESS) {
            await updateTransactionStatusTinder(
              transaction._id,
              PAYMENT_STATUS.FAILED
            );
          }
        }

       return res.sendStatus(200);
      } catch (error) {
        console.error("Webhook Error:", error);
        next(error);
        return
      }
    }

     console.log("#######################Game#######################")

    const chapaSig = req.headers["chapa-signature"];
    const xChapaSig = req.headers["x-chapa-signature"];

    const expectedHash = crypto
      .createHmac(
        "sha256",
        process.env.CHAPA_WEBHOOK_SECRET || CHAPA_WEBHOOK_SECRET
      ) // whichever you use
      .update(payload)
      .digest("hex");

    if (![chapaSig, xChapaSig].includes(expectedHash)) {
      console.warn("❌ Invalid Webhook signature:", { chapaSig, xChapaSig });
      return res.status(400).json({ error: "Invalid signature" });
    }

    const txRef = req.body.tx_ref;
    if (!txRef) {
      throw new Error("tx_ref missing in webhook payload");
    }

    // ✅ Your Transaction model uses `reference`, not `tx_ref`
    const transaction = await Transaction.findOne({ _id: txRef });
    if (!transaction) throw new Error("Transaction not found");

    if (transaction.type !== "deposit") {
      throw new Error("Not a deposit transaction");
    }

    if (transaction.status === PAYMENT_STATUS.SUCCESS) {
      console.log("⚠️ Duplicate success webhook ignored:", txRef);
      return res.sendStatus(200);
    }

    // ✅ Your Transaction model uses `user` (ObjectId) not `payer`
    const user = await UserModel.findById(transaction.user);
    if (!user) throw new Error("User not found");

    // Map deposit amount -> coins
    const amount = transaction.amount || 0;
    if (amount <= 0) {
      throw new Error("Invalid coin mapping for this amount");
    }

    const event = req.body.event;

    if (event === "charge.success") {
      if (transaction.status !== PAYMENT_STATUS.SUCCESS) {
        // ✅ Update transaction status
        transaction.status = PAYMENT_STATUS.SUCCESS;
        transaction.metadata = req.body;
        await transaction.save();

        // ✅ Update user balance
        await UserModel.findByIdAndUpdate(transaction.user, {
          $inc: { balance: amount, deposits: transaction.amount },
        });
      } else {
        console.log("⚠️ Duplicate success webhook ignored:", txRef);
      }
    } else if (event === "charge.failed" || event === "charge.cancelled") {
      if (transaction.status !== PAYMENT_STATUS.SUCCESS) {
        transaction.status = PAYMENT_STATUS.FAILED;
        transaction.metadata = req.body;
        await transaction.save();

        appEvents.emit(PAYMENT_STATUS.FAILED, {
          telegramId: user.telegramId,
          coins: coinsAdded,
          txRef,
        });
      }
    }

    return res.sendStatus(200);
  } catch (error) {
    console.error("Webhook Error:", error);
    // ✅ you were calling next(error) but the handler didn't accept `next`
    return next(error);
  }
});

transactionRouter.post("/history", async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({
        message: "Token is required",
        requestStatus: "failed",
      });
    }

    // ✅ Validate user
    const verifyUser = await validateUser(token);
    if (!verifyUser) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    // ✅ Fetch user
    const user = await UserModel.findById(verifyUser._id);
    if (!user) {
      return res.status(400).json({ message: "User not found" });
    }

    // ✅ Fetch user transactions
    const txs = await Transaction.find({ user: user._id })
      .sort({ createdAt: -1 })
      .lean();

    // ✅ Format response to match frontend
    const formatted = txs.map((tx) => ({
      id: tx._id,
      type: tx.type === "deposit" ? "Deposit" : "Withdraw",
      method: tx.paymentMethod,
      amount: tx.amount,
      status: tx.status.charAt(0).toUpperCase() + tx.status.slice(1), // capitalize
      time: tx.createdAt.toISOString().slice(0, 16).replace("T", " "), // "2025-10-29 18:26"
    }));

    return res.status(200).json({
      requestStatus: "success",
      history: formatted,
    });
  } catch (err) {
    console.log("History error:", err);
    return res.status(500).json({
      requestStatus: "failed",
      message: "Server error while fetching history",
    });
  }
});

export default transactionRouter;
