const db = require("../config");

const BookImage = {
  getByBookId: async (bookId) => {
    if (bookId) {
      const [image_links] = await db.query(
        "SELECT image_id FROM book_images WHERE book_id = ?",
        [bookId]
      );
      const images = [];

      for (const image_link of image_links) {
        const [image] = await db.query(
          "SELECT image_path FROM images WHERE image_id = ?",
          [image_link]
        );
        images.push(image[0]);
      }
      return images;
    }
    return [];
  },

  add: async (bookId, imagePath) => {
    const [result1] = await db.query(
      "INSERT INTO images (image_path) VALUES (?)",
      [imagePath]
    );
    const [result2] = await db.query(
      "INSERT INTO book_images (book_id, image_id) VALUES (?, ?)",
      [bookId, result1.insertId]
    );
    return result2.insertId;
  },
  edit: async (originaImagePath, imagePath) => {
    const [result1] = await db.query(
      "UPDATE images SET image_path = ? WHERE image_path = ?",
      [imagePath, originaImagePath]
    );
  },

  delete: async (imagePath) => {
    const [image_id] = await db.query(
      "SELECT image_id FROM images WHERE image_path = ?",
      [imagePath]
    );
    await db.query("DELETE FROM book_images WHERE image_id = ?", [image_id]);
    await db.query("DELETE FROM images WHERE image_path = ?", [imagePath]);
  },
};

module.exports = BookImage;
