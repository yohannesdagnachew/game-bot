import router from "express";
import { validate, parse } from "@telegram-apps/init-data-node";
import UserModel from "../models/userModel.js";
import Transaction from "../models/transactionModel.js"
import validateUser from "../utils/verification/validateUser.js";
import bcrypt from "bcrypt";
import { PAYMENT_STATUS } from "../config/constants.js";

import { verifyTelegramInitData }  from "../utils/verification/verifyTelegramInitData.js"






const userRouter = router.Router();

// userRouter.post("/signup",  async (req, res) => {
//   const { phone, name, password } = req.body;

//   const ref = req.query.ref || '';

//   if (!phone || !name || !password) {
//     return res.status(400).json({ message: "All fields are required" });
//   }

//   const findUser = await UserModel.findOne({ phone: phone });
//   if (findUser) {
//     return res.status(400).json({ message: "User already exists" });
//   }


//    if (password.length < 6) {
//     return res.status(400).json({ message: "Password must be at least 6 characters" });
//    }

//    if (name.length < 3) {
//     return res.status(400).json({ message: "Name must be at least 3 characters" });
//    }


//    if (phone[0] !== '0' || (phone[1] !== '9' && phone[1] !== '7')) {
//     return res.status(400).json({ message: "Please use this phone format 0911094536" });
//    }
   
//   const phoneFormat = /^\d{10}$/;
//   if (!phone.match(phoneFormat) || phone.length > 10 || phone.length < 10) {
//     return res.status(400).json({ message: "Please use this phone format 0911094536" });
//   }
 

//   const salt = await bcrypt.genSalt(10);
//   const hashPassword = await bcrypt.hash(password, salt);

//   const newUser = new UserModel({
//     phone,
//     id: Math.floor(100000 + Math.random() * 900000),
//     name,
//     password: hashPassword,
//     referralId: Math.floor(100000 + Math.random() * 900000),
//     refferedBy: ref
//   });
//   await newUser.save();


//   if(ref !== ''){
//     const following = await UserModel.findOne({
//       referralId: ref
//     });


//     if(following){
//       following.followers.push(newUser.id);
//       await following.save();
//     }
//   }
 

//   const token = newUser.generateAuthToken();

//   const user =  await userBalance(token);
 

//  return res.status(200).json({message: "User created successfully", data: user, token: token});

// });




userRouter.post("/login", async (req, res) => {
  console.log("login called")
 try {
    const initData =
      req.headers["x-telegram-init-data"] ||
      req.body?.initData ||
      req.query?.initData;

    const { ok, reason, user } = verifyTelegramInitData(
      initData,
      process.env.TG_BOT_TOKEN,
      86400 // 24h freshness window; tweak as you like
    );

    console.log(ok, reason, user )
    
    if (!ok) {
      return res.status(401).json({ ok: false, error: reason || "Invalid initData" });
    }

    const telegramId = user?.id?.toString();
    if (!telegramId) {
      return res.status(400).json({ ok: false, error: "No telegramId in initData" });
    }

    // We DO NOT create a user here because your schema requires phone/name/chatId.
    // The bot's 'contact' handler should have created/upserted the user already.
    const dbUser = await UserModel.findOne({ telegramId });

    if (!dbUser || !dbUser.phone) {
      // Not registered yet (no phone). Tell the Mini App to ask for contact.
      return res.json({ ok: true, state: "pending_phone" });
    }

    // Issue JWT using your model helper
    const token = dbUser.generateAuthToken();



    return res.json({
      ok: true,
      token, // or omit if you're using cookies
      user: {
        id: dbUser._id,
        name: dbUser.name,
        phone: dbUser.phone,
        telegramId: dbUser.telegramId,
        balance: dbUser.balance,
        possibleWithdrawal: dbUser.possibleWithdrawal,
        referralId: dbUser.referralId,
        status: dbUser.status,
      },
    });
  } catch (err) {
    console.error("miniapp/login error:", err);
    return res.status(500).json({ ok: false, error: "Server error" });
  }

});


userRouter.post("/logout", async (req, res) => {
  const userData = req.body;
  const { id } = userData;

  if (!id) {
    return res.status(400).json({ message: "User ID is required" });
  }

  const findUser = await UserModel.findOne({ id: id });
  if (!findUser) {
    return res.status(400).json({ message: "User not found" });
  }

  findUser.lastUpdate = Date.now() - 24 * 3600000;
  await findUser.save();

  return res.status(200).json({ message: "Logout successful" });
});


userRouter.post("/profile", async (req, res) => {
  try {
    const token = req.body.token;

    if (!token) {
      return res.status(400).json({ message: "Token missing" });
    }

    const verified = await validateUser(token);
    if (!verified?._id) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const user = await UserModel.findById(verified._id)
      .select("_id name email phone telegramId balance createdAt referralId")
      .lean();

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const agg = await Transaction.aggregate([
      {
        $match: {
          user: user._id,
          status: PAYMENT_STATUS.SUCCESS,
        },
      },
      {
        $group: {
          _id: "$type", // deposit / withdraw
          total: { $sum: "$amount" },
          count: { $sum: 1 },
        },
      },
    ]);

    const summary = Object.fromEntries(
      agg.map((i) => [i._id, { total: i.total, count: i.count }])
    );

    return res.json({
      // Basic user
      _id: user._id,
      name: user.name || "",
      email: user.email || "",
      phone: user.phone || "",
      telegramId: user.telegramId || "",
      createdAt: user.createdAt,
      lastLoginAt: user.lastUpdate || null,
      ref: user.referralId || "",

      // Wallet summary
      balance: user.balance ?? 0,
      totalDeposits: summary.deposit?.total || 0,
      depositCount: summary.deposit?.count || 0,
      totalWithdrawals: summary.withdraw?.total || 0,
      withdrawCount: summary.withdraw?.count || 0,
    });
  } catch (err) {
    console.error("PROFILE ERROR:", err);
    return res.status(500).json({
      message: err.message || "Failed to load profile",
    });
  }
})







userRouter.post('/forgotpassword', async (req, res) => {
  const { phone } = req.body;

  if (!phone) {
    return res.status(400).json({ message: "Phone number is required" });
  }

  const findUser = await UserModel.findOne({
    phone: phone
  });

  if (!findUser) {
    return res.status(400).json({ message: "User not found" });
  }

  const newpassword = Math.floor(100000 + Math.random() * 900000);
  const salt = await bcrypt.genSalt(10);
  const hashPassword = await bcrypt.hash(newpassword.toString(), salt);
  findUser.password = hashPassword;
  console.log(newpassword);
  await findUser.save();

  return res.status(200).json({ message: "New password sent to Telegram" });
});




export default userRouter;
