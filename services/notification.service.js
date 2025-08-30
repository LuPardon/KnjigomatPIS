const Notification = require("../DAL/Notification");

const create = async (data) => {
  return await Notification.create(data);
};

const getByUserId = async (userId) => {
  return await Notification.getByUserId(userId);
};

const markAsRead = async (id) => {
  return await Notification.markAsRead(id);
};

const markAllAsRead = async (userId) => {
  return await Notification.markAllAsRead(userId);
};

const getUnreadCount = async (userId) => {
  return await Notification.getUnreadCount(userId);
};

const deleteOldNotifications = async (daysOld) => {
  return await Notification.deleteOldNotifications(daysOld);
};

const deleteN = async (id) => {
  return Notification.delete(id);
};

module.exports = {
  create,
  getByUserId,
  markAsRead,
  markAllAsRead,
  getUnreadCount,
  deleteOldNotifications,
  deleteN,
};
