import app from './app.js';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { startDailySpinCron } from './cron/dailySpins.js';
import { dbTinder } from './db.js';



dotenv.config();

const PORT = process.env.PORT || 5003;
const MONGO_URI = process.env.MONGO_URI;
// const TOKEN = process.env.TG_BOT_TOKEN;
// const bot = new TelegramBot(TOKEN, { polling: true });

mongoose.connect(MONGO_URI).then(() => {
    console.log("Connected to database");
    startDailySpinCron();
  });




dbTinder.once('connected', () => {
  console.log('✅ Tinder DB connected.');
});





app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}.`);
});

