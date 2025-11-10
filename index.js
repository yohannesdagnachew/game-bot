import app from './app.js';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import TelegramBot from 'node-telegram-bot-api';
import UserModel from './models/userModel.js';

dotenv.config();

const PORT = process.env.PORT || 5003;
const MONGO_URI = process.env.MONGO_URI;
// const TOKEN = process.env.TG_BOT_TOKEN;
// const bot = new TelegramBot(TOKEN, { polling: true });

mongoose.connect(MONGO_URI).then(() => {
    console.log("Connected to database");
  });



// bot.onText(/\/start (.+)?/, async (msg, match) => {
//     const chatId = msg.chat.id;
//     const userId = msg.from.id;
//     const findUser = await UserModel.findOne({ id: userId });
//     const ref = match[1] ? match[1] : null;
//     if (!findUser) {
//         let findFriend = await UserModel.findOne({ referralId: ref });
//         if (findFriend) {
//             findFriend.followers.push(userId);
//             await findFriend.save();
//         }
//         const newUser = await new UserModel({
//             id: userId,
//             name: msg.from.first_name,
//             balance: 0,
//             lastUpdate: Date.now(),
//             stocks: [],
//             index: Math.floor(Math.random() * 100000),
//             followers: [],
//             referralId: userId.toString().slice(0, 3) + Math.floor(Math.random() * 1000),
//         });
//         await newUser.save();
//         return bot.sendMessage(chatId, "Welcome to the stock market");
//     }
// });





app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}.`);
});

