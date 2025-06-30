const express = require("express");
const router = express.Router();
const notificationController = require("../controllers/notification.controller");

router.post("/", notificationController.sendNotification);
router.get("/:userId", notificationController.getNotifications);
router.put("/read/:notificationId", notificationController.markAsRead);
router.put("/read-all/:userId", notificationController.markAllAsRead);
router.get("/unread-count/:userId", notificationController.getUnreadCount);
router.delete("/:notificationId", notificationController.deleteNotification);

module.exports = router;
