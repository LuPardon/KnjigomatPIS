const BorrowRequest = require("../models/BorrowRequest");

const create = async (data) => {
  return await BorrowRequest.create(data);
};

const getAll = async () => {
  return await BorrowRequest.getAll();
};

const getById = async (id) => {
  return await BorrowRequest.getById(id);
};

const updateStatus = async (id, status) => {
  return await BorrowRequest.updateStatus(id, status);
};

const deleteR = async (id) => {
  return await BorrowRequest.delete(id);
};

module.exports = {
  create,
  getAll,
  getById,
  updateStatus,
  deleteR,
  updateStatus,
};
