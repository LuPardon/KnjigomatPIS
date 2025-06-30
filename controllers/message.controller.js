const messageService = require("../services/message.service");

exports.createMessage = async (req, res) => {
  try {
    const result = await messageService.create(req.body);
    res
      .status(201)
      .json({ message: "Poruka poslana.", messageId: result.insertId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getMessagesByMessageId = async (req, res) => {
  try {
    const result = await messageService.getByMessageId(req.params.messageId);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getMessagesByMembers = async (req, res) => {
  try {
    const result = await messageService.getByMembers(
      req.params.senderId,
      req.params.receiverId
    );
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.deleteMessage = async (req, res) => {
  try {
    await messageService.deleteM(req.params.messageId);
    res.json({ message: "Poruka obrisana." });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
