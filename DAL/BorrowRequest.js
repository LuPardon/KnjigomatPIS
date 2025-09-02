const db = require("../config");

const BorrowRequest = {
  create: async (data) => {
    const query = `
      INSERT INTO borrow_requests (book_id, requester_id, owner_id, status_id, notification_id)
      VALUES (?, ?, ?, ?, ?)
    `;
    const [result] = await db.query(query, [
      data.book_id,
      data.requester_id,
      data.owner_id,
      data.status_id,
      data.notification_id,
    ]);
    return result;
  },

  getAll: async () => {
    const query = `
    SELECT br.*, b.title,
       CONCAT(u1.first_name, ' ', u1.last_name) AS requester_full_name,
       CONCAT(u2.first_name, ' ', u2.last_name) AS owner_full_name
      FROM borrow_requests br
      JOIN books b ON br.book_id = b.book_id
      JOIN users u1 ON br.requester_id = u1.user_id
      JOIN users u2 ON br.owner_id = u2.user_id
    `;
    const [results] = await db.query(query);
    return results;
  },

  getById: async (request_id) => {
    const query = `SELECT * FROM borrow_requests WHERE request_id = ?`;
    const [results] = await db.query(query, [request_id]);
    return results;
  },

  updateStatus: async (request_id, status_id) => {
    const query = `UPDATE borrow_requests SET status_id = ? WHERE request_id = ?`;

    const [borrow_requestResult] = await db.query(
      `SELECT * FROM borrow_requests WHERE request_id = ? limit 1`,
      [request_id]
    );

    const [bookResult] = await db.query(
      "select * from books where book_id = ? limit 1",
      [borrow_requestResult[0].book_id]
    );

    if (bookResult[0].status_id == 2) {
      return {};
    }

    // ako end_date je null i knjiga id
    const [isAvailable] = await db.query(
      "select * from exchange_history where book_id = ? and end_date is null",
      [bookResult[0].book_id]
    );
    if (isAvailable.length > 0 && status_id == 2) {
      return {};
    }

    console.log("Borrow Request Result:", borrow_requestResult[0]);
    if (status_id != 3) {
      // ako nije u tijeku
      const [exchangeHistoryResult] = await db.query(
        `INSERT INTO exchange_history (book_id, borrower_id, lender_id, status_ex_id)
         VALUES (?, ?, ?, ?)`,
        [
          borrow_requestResult[0].book_id,
          borrow_requestResult[0].requester_id,
          borrow_requestResult[0].owner_id,
          3, // u tijeku
        ]
      );
    }
    if (status_id == 2) {
      // ako je prihvacen
      await db.query("update books set book_status_id = 2 where book_id = ?", [
        borrow_requestResult[0].book_id,
      ]);
    }
    const [notificationResult] = await db.query(
      "insert into notifications (title, user_id, message) values (?, ?, ?)",
      [
        status_id === 2 ? "Borrow request accepted" : "Borrow request rejected",
        borrow_requestResult[0].requester_id,
        `Your borrow request ${bookResult[0].title} was ${
          status_id === 2 ? "accepted" : "rejected"
        } from the owner.`,
      ]
    );

    const [result] = await db.query(query, [status_id, request_id]);

    return result;
  },

  delete: async (request_id) => {
    const query = `DELETE FROM borrow_requests WHERE request_id = ?`;
    const [result] = await db.query(query, [request_id]);
    return result;
  },
};

module.exports = BorrowRequest;
