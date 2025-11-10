import Transaction from "../../models/transactionModel.js";


export const findTransactionById = async (_id) => {
  const transaction = await Transaction.findById(_id);
  if (!transaction) {
    const err = new Error(`Transaction not found for id ${_id}`);
    err.status = 404;
    throw err;
  }
  return transaction;
};

export const createTransaction = async (userId, amount, paymentMethod, type) => {
  const transaction = await Transaction.create({
    user: userId,
    amount,
    paymentMethod,
    type,
  });
  return transaction;
}


export const updateTransactionStatus = async (_id, status) => {
  const transaction = await findTransactionById(_id);
  transaction.status = status;
  await transaction.save();
  return transaction;
};
