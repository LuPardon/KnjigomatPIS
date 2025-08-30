const ExchangeHistory = require("../DAL/ExchangeHistory");

const create = async (data) => {
  return await ExchangeHistory.create(data);
};

const getByBookId = async (bookId) => {
  return await ExchangeHistory.getByBookId(bookId);
};

const getByUserId = async (userId) => {
  return await ExchangeHistory.getByUserId(userId);
};

const deleteH = async (historyId) => {
  return ExchangeHistory.delete(historyId);
};

module.exports = {
  create,
  getByBookId,
  getByUserId,
  deleteH,
};
