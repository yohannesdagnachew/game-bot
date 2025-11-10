import UserModel from "../../models/userModel.js";
import jwt from "jsonwebtoken";

const userBalance = async (token) => {


  const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
  const id = decoded._id;

  if (!id) {
    return;
  }
  


  const findUser = await UserModel.findOne({_id: id });
  if (!findUser) {
    return;
  }

  const stocksList = findUser.stocks;

  let name = findUser.name;
  let lastUpdate = findUser.lastUpdate;
  let oldBalance = findUser.balance; // ??
  let pph = 0;
  const stocks = [];
  const followers = [];

  const currentTime = Date.now();
  const timeDifference = currentTime - lastUpdate;
  const timeInHours = timeDifference / 3600000;

  ////////
 

  if (stocksList.length) {
    stocksList.forEach((element, index) => {
      if (element.expire < Date.now()) {
        return;
      }

      const profit = element.pph * ((Date.now() - element.date) / 3600000);
      const time = Date.now() - element.date;
      const days = time / 86400000;

      pph += element.pph;
      stocks.push({
        num: index,
        stock: element.type,
        invest: element.amount,
        profit: Math.floor(profit),
        time: Math.floor(days),
      });
    });
  }
  ///////

  const userFollowers = findUser.followers;

  if (userFollowers.length > 0) {
    userFollowers.forEach(async (element) => {
      let myfollower = await UserModel.findOne({id: element}); 
      let status = "offline";
      let invest = "No";
      if (myfollower.lastUpdate > Date.now() - 24 * 3600000) {
        status = "online";
      }
      if (myfollower.stocks.length) {
        invest = "Yes";
      }

      const follow = {
        name: myfollower.name,
        status: status,
        invest: invest,
      };

      followers.push(follow);
    });
  }

  ////

  const totalBalance = timeInHours * pph;

  const newLastUpdate = Date.now();
  const newBalance = totalBalance + oldBalance;
 
  
  try {
    findUser.balance =  newBalance;
    findUser.lastUpdate = newLastUpdate;
    await findUser.save();
  } catch (error) {
    console.log(error);
    return false;
  }


  const userData = {
    name: name,
    pph: pph,
    balance: newBalance,
    stocks: stocks,
    ref: findUser.referralId,
    followers: followers,
  };
  return userData;
};

export default userBalance;
