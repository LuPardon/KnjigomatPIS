const db = require("../config");

const User = {
  getAll: async () => {
    const [rows] = await db.query("SELECT * FROM users");
    return rows;
  },
  getById: async (id) => {
    const [rows] = await db.query("SELECT * FROM users WHERE user_id = ?", [
      id,
    ]);
    return rows[0];
  },
 

  create: async (data) => {
    const [result] = await db.query(
      "INSERT INTO users (first_name, last_name, email, password_, city) VALUES (?, ?, ?, ?, ?)",
      [data.first_name, data.last_name, data.email, data.password_, data.city]
    );
    return result.insertId;
  },
  update: async (user_id, data) => {
    await db.query(
      `UPDATE users SET first_name=?, last_name=?, email=?, password_=?, city=? WHERE user_id=?`,
      [
        data.first_name,
        data.last_name,
        data.email,
        data.password_,
        data.city,
        user_id,
      ]
    );
  },
  delete: async (user_id) => {
    await db.query("DELETE FROM users WHERE user_id = ?", [user_id]);
  },
};

module.exports = User;
