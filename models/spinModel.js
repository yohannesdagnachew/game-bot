import { Schema, model } from "mongoose";

const spinSchema = new Schema({
    count: { type: Number, default: 0 },
    freeSpins: { type: Number, default: 0 },
    paidSpins: { type: Number, default: 0 },
    dailyPrize: { type: Number, default: 0 },
    dailyCollection: { type: Number, default: 0 },
    totalProfit: { type: Number, default: 0 },
    
},
   { timestamps: true }
);

export default model("Spin", spinSchema);