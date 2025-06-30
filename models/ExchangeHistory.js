const db = require("../config");

const ExchangeHistory = {
  create: async (exchangeData) => {
    const query = `
      INSERT INTO exchange_history (book_id, borrower_id, lender_id, status_ex_id)
      VALUES (?, ?, ?, ?)
    `;
    const values = [
      exchangeData.book_id,
      exchangeData.borrower_id,
      exchangeData.lender_id,
      exchangeData.status_ex_id,
    ];
    const [result] = await db.query(query, values);
    return result;
  },

  getByBookId: async (bookId) => {
    const [results] = await db.query(
      "SELECT * FROM exchange_history WHERE book_id = ?",
      [bookId]
    );
    return results;
  },

  getByUserId: async (userId) => {
    const [results] = await db.query(
      "SELECT * FROM exchange_history WHERE borrower_id = ? OR lender_id = ?",
      [userId, userId]
    );

    
    return results;
  },

  delete: async (historyId) => {
    const [result] = await db.query(
      "DELETE FROM exchange_history WHERE history_id = ?",
      [historyId]
    );
    return result;
  },
};

module.exports = ExchangeHistory;
