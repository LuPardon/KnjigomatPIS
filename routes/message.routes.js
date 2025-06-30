const express = require("express");
const router = express.Router();
const messageController = require("../controllers/message.controller");

router.post("/", messageController.createMessage);
router.get("/:messageId", messageController.getMessagesByMessageId);
router.get("/:sender_id/:receiver_id", messageController.getMessagesByMembers);
router.delete("/:messageId", messageController.deleteMessage);

module.exports = router;
