const db = require("../config");

const Message = {
  create: async (messageData) => {
    const query = `
      INSERT INTO messages (sender_id, content)
      VALUES (?, ?)
    `;
    const values = [messageData.sender_id, messageData.content];

    const [result] = await db.query(query, values);
    return result;
  },

  getByMessageId: async (messageId) => {
    const [results] = await db.query(
      "SELECT * FROM messages WHERE messageId = ?",
      [messageId]
    );
    return results;
  },

  getByMembers: async (sender_id, receiver_id) => {
    const [results] = await db.query(
      "SELECT * FROM messages WHERE sender_id = :sender_id or sender_id = :receiver_id || receiver_id = :sender_id or receiver_id = :receiver_id",
      [sender_id, receiver_id]
    );
    return results;
  },

  delete: async (messageId) => {
    const [result] = await db.query(
      "DELETE FROM messages WHERE message_id = ?",
      [messageId]
    );
    return result;
  },
};

module.exports = Message;
