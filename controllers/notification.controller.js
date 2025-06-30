const notificationService = require("../services/notification.service");

exports.sendNotification = async (req, res) => {
  try {
    const result = await notificationService.create(req.body);
    res.status(201).json({
      message: "Obavijest poslana.",
      messageId: result.messageId,
      borrowRequestId: result.borrowRequestId,
      chatId: result.chatId,
      id: result.insertId,
      otherUserId: result.otherUserId,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getNotifications = async (req, res) => {
  try {
    const notifications = await notificationService.getByUserId(
      req.params.userId
    );
    res.json(notifications);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.markAsRead = async (req, res) => {
  try {
    await notificationService.markAsRead(req.params.notificationId);
    res.json({ message: "Obavijest označena kao pročitana." });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Označavanje svih notifikacija kao pročitano
exports.markAllAsRead = async (req, res) => {
  try {
    const result = await notificationService.markAllAsRead(req.params.userId);
    res.json({
      message: "Sve obavijesti označene kao pročitane.",
      affectedRows: result.affectedRows,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Dohvaćanje broja nepročitanih notifikacija
exports.getUnreadCount = async (req, res) => {
  try {
    const count = await notificationService.getUnreadCount(req.params.userId);
    res.json({ unreadCount: count });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.deleteNotification = async (req, res) => {
  try {
    await notificationService.deleteN(req.params.notificationId);
    res.json({ message: "Obavijest obrisana." });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
