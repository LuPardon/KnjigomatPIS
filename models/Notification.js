const db = require("../config");

const Notification = {
  create: async (data) => {
    const connection = await db.getConnection();
    try {
      await connection.beginTransaction();

      // Postavljanje notifikacije
      const notificationQuery = `INSERT INTO notifications (user_id, title, message, is_read) VALUES (?, ?, ?, ?)`;
      const notificationValues = [
        data.bookOwnerId,
        data.title,
        data.message,
        false,
      ];
      const [notificationResult] = await connection.query(
        notificationQuery,
        notificationValues
      );

      // Postavljanje borrow request-a
      const [borrowRequestResult] = await connection.query(
        "INSERT INTO borrow_requests (book_id, requester_id, owner_id, status_id, notification_id) VALUES (?, ?, ?, ?, ?)",
        [
          data.bookId,
          data.requesterId,
          data.bookOwnerId,
          1,
          notificationResult.insertId,
        ]
      );

      // Provjera da li chat već postoji
      const [chatResult] = await connection.query(
        "SELECT chat_id FROM chats WHERE (person1_id = ? AND person2_id = ?) OR (person1_id = ? AND person2_id = ?)",
        [data.requesterId, data.bookOwnerId, data.bookOwnerId, data.requesterId]
      );

      let chatId;
      if (!chatResult.length) {
        // Kreiranje novog chat-a ako ne postoji
        const [newChatResult] = await connection.query(
          "INSERT INTO chats (person1_id, person2_id) VALUES (?, ?)",
          [data.requesterId, data.bookOwnerId]
        );
        chatId = newChatResult.insertId;
      } else {
        chatId = chatResult[0].chat_id;
      }

      // Postavljanje početne poruke
      const [messageResult] = await connection.query(
        "INSERT INTO messages (chat_id, sender_id, content, borrow_request_id) VALUES (?, ?, ?, ?)",
        [chatId, data.requesterId, data.message, borrowRequestResult.insertId]
      );

      await connection.commit();

      return {
        ...notificationResult,
        chatId: chatId,
        borrowRequestId: borrowRequestResult.insertId,
        messageId: messageResult.insertId,
      };
    } catch (error) {
      await connection.rollback();
      console.error("Error creating notification:", error);
      throw error;
    } finally {
      connection.release();
    }
  },

  getByUserId: async (userId) => {
    try {
      // Optimizira query s JOINs da dohvaća sve podatke in one go umjesto multiple queries
      const query = `
        SELECT 
          n.*,
          br.request_id,
          br.book_id,
          br.requester_id,
          b.title as book_title,
          m.chat_id
        FROM notifications n
        LEFT JOIN borrow_requests br ON n.notification_id = br.notification_id
        LEFT JOIN books b ON br.book_id = b.book_id
        LEFT JOIN messages m ON br.request_id = m.borrow_request_id
        WHERE n.user_id = ?
        ORDER BY n.created_at DESC
      `;

      const [results] = await db.query(query, [userId]);

      // Očisti rezultate - handle-a slučajeve gdje joins mogu vraćati null vrijednosti
      return results.map((notification) => ({
        notification_id: notification.notification_id,
        title: notification.title,
        user_id: notification.user_id,
        message: notification.message,
        is_read: notification.is_read,
        created_at: notification.created_at,
        chat_id: notification.chat_id || null,
        book_id: notification.book_id || null,
        book_title: notification.book_title || null,
        requester_id: notification.requester_id || null,
      }));
    } catch (err) {
      console.error("Error fetching notifications:", err);
      throw err;
    }
  },

  getByUserIdOriginal: async (userId) => {
    try {
      const [results] = await db.query(
        `SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC`,
        [userId]
      );

      for (let notification of results) {
        try {
          const [borrowResult] = await db.query(
            "SELECT * FROM borrow_requests WHERE notification_id = ? LIMIT 1",
            [notification.notification_id]
          );

          // Provjera da li borrow request postoji
          if (!borrowResult.length) {
            console.warn(
              `No borrow request found for notification ${notification.notification_id}`
            );
            // Postavlja default vrijednosti kad borrow request ne postoji
            notification.chat_id = null;
            notification.book_id = null;
            notification.book_title = null;
            notification.requester_id = null;
            continue;
          }

          const [messageResult] = await db.query(
            "SELECT * FROM messages WHERE borrow_request_id = ? LIMIT 1",
            [borrowResult[0].request_id]
          );

          const [bookResult] = await db.query(
            "SELECT * FROM books WHERE book_id = ? LIMIT 1",
            [borrowResult[0].book_id]
          );

          // Sigurno postavljene vrijednosti
          notification.chat_id = messageResult.length
            ? messageResult[0].chat_id
            : null;
          notification.book_id = borrowResult[0].book_id;
          notification.book_title = bookResult.length
            ? bookResult[0].title
            : null;
          notification.requester_id = borrowResult[0].requester_id;
        } catch (innerError) {
          console.error(
            `Error processing notification ${notification.notification_id}:`,
            innerError
          );
          // Postavi null vrijednosti za pogrešno procesiranje
          notification.chat_id = null;
          notification.book_id = null;
          notification.book_title = null;
          notification.requester_id = null;
        }
      }

      return results;
    } catch (err) {
      console.error("Error fetching notifications:", err);
      throw err;
    }
  },

  markAsRead: async (notificationId) => {
    try {
      const [results] = await db.query(
        `UPDATE notifications SET is_read = true WHERE notification_id = ?`,
        [notificationId]
      );
      return results;
    } catch (error) {
      console.error("Error marking notification as read:", error);
      throw error;
    }
  },

  markAllAsRead: async (userId) => {
    try {
      const [results] = await db.query(
        `UPDATE notifications SET is_read = true WHERE user_id = ? AND is_read = false`,
        [userId]
      );
      return results;
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
      throw error;
    }
  },

  getUnreadCount: async (userId) => {
    try {
      const [results] = await db.query(
        `SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND is_read = false`,
        [userId]
      );
      return results[0].count;
    } catch (error) {
      console.error("Error getting unread count:", error);
      throw error;
    }
  },

  deleteOldNotifications: async (daysOld = 30) => {
    try {
      const [result] = await db.query(
        `DELETE FROM notifications WHERE created_at < DATE_SUB(NOW(), INTERVAL ? DAY)`,
        [daysOld]
      );
      return result;
    } catch (error) {
      console.error("Error deleting old notifications:", error);
      throw error;
    }
  },

  delete: async (notificationId) => {
    try {
      const [result] = await db.query(
        `DELETE FROM notifications WHERE notification_id = ?`,
        [notificationId]
      );
      return result;
    } catch (error) {
      console.error("Error deleting notification:", error);
      throw error;
    }
  },
};

module.exports = Notification;
