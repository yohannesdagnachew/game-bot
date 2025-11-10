import router from "express";
import UserModel from "../models/userModel.js";
import validateUser from "../utils/verification/validateUser.js";
import Transaction from "../models/transactionModel.js";
import axios from "axios";
import FormData from "form-data";
import { PAYMENT_STATUS } from "../config/constants.js";
import  {createTransaction, findTransactionById, updateTransactionStatus} from  "../utils/helper/helper.js"



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

    if (type == !"deposit") {
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
    // formData.append("mobile", user.phone);
    formData.append("mobile", "0947056756");

    if (allowedMethods.includes(paymentMethod)) {
      const response = await axios.post(
        CHAPA_API_WEB,
        {
          amount: amountWithVat,
          currency: "ETB",
          email: `user${user.telegramId}@gmail.com`,
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
    console.log(err)
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








transactionRouter.post("/withdraw", async (req, res) => {
  const userData = req.body;
  const { amount, paymentMethod, token } = userData;

  if (!amount || !paymentMethod || token) {
    return res.status(400).json({ message: "Forbidden request" });
  }

  const verifyUser = await validateUser(token);
  if (!verifyUser) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const user = await UserModel.findOne({ _id: verifyUser._id });

  if (!user) {
    return res.status(400).json({ message: "User not found" });
  }

  return;
});



transactionRouter.post("/webhook" , async (req, res) => {
  try {
    const payload = JSON.stringify(req.body);
    const chapaSig = req.headers["chapa-signature"];
    const xChapaSig = req.headers["x-chapa-signature"];

    const expectedHash = crypto
      .createHmac("sha256", CHAPA_WEBHOOK_SECRET)
      .update(payload)
      .digest("hex");

    if (![chapaSig, xChapaSig].includes(expectedHash)) {
      console.warn("❌ Invalid Webhook signature:", { chapaSig, xChapaSig });
      return res.status(400).json({ error: "Invalid signature" });
    }

    const transaction = await findTransactionById(req.body.tx_ref);
    if (!transaction) throw new Error("Transaction not found");

    const user = await User.findById(transaction.payer);
    if (!user) throw new Error("User not found");

    const coinsAdded = COIN_OPTIONS[transaction.amount] || 0;
    if (coinsAdded <= 0)
      throw new Error("Invalid coin mapping for this amount");

    const event = req.body.event;

    if (event === "charge.success") {
      if (transaction.status !== PAYMENT_STATUS.SUCCESS) {
        await updateTransactionStatus(transaction._id, PAYMENT_STATUS.SUCCESS);
        await User.findByIdAndUpdate(transaction.payer, {
          $inc: { balance: coinsAdded },
        });

        appEvents.emit(PAYMENT_STATUS.SUCCESS, {
          telegramId: user.telegram.id,
          coins: coinsAdded,
          txRef: req.body.tx_ref,
        });
      } else {
        console.log(
          "⚠️ Duplicate success webhook ignored:",
          transaction.tx_ref
        );
      }
    } else if (event === "charge.failed" || event === "charge.cancelled") {
      if (transaction.status !== PAYMENT_STATUS.SUCCESS) {
        await updateTransactionStatus(transaction._id, PAYMENT_STATUS.FAILED);
        appEvents.emit(PAYMENT_STATUS.FAILED, {
          telegramId: user.telegram.id,
          coins: coinsAdded,
          txRef: req.body.tx_ref,
        });
      }
    }

    res.sendStatus(200);
  } catch (error) {
    console.error("Webhook Error:", error);
    next(error);
  }
}) 


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
