const Message = require("../models/Message");

const create = async (data) => {
  return await Message.create(data);
};

const getByMessageId = async (messageId) => {
  return await Message.getByMessageId(messageId);
};
const getByMembers = async (sender_id, receiver_id) => {
  return await Message.getByMembers(sender_id, receiver_id);
};

const deleteM = async (messageId) => {
  return Message.delete(messageId);
};

module.exports = {
  create,
  getByMessageId,
  getByMembers,
  deleteM,
};
