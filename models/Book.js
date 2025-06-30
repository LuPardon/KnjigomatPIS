const db = require("../config");

const Book = {
  getAll: async () => {
    const [books] = await db.query("SELECT * FROM books");

    for (const book of books) {
      const [image_links] = await db.query(
        "SELECT image_id FROM book_images WHERE book_id = ?",
        [book.book_id]
      );

      const images = [];
      for (const image_link of image_links) {
        const [image] = await db.query(
          "SELECT image_path FROM images WHERE image_id = ?",
          [image_link.image_id]
        );
        images.push(image[0].image_path || null);
      }

      // Dodajemo niz slika u objekt knjige
      book.image_paths = images;
    }
    return books;
  },
  getByUserId: async (userId) => {
    const [user_books] = await db.execute(
      "SELECT * FROM books WHERE user_id = ? order by created_at DESC",
      [userId]
    );

    for (const book of user_books) {
      const [image_links] = await db.query(
        "SELECT image_id FROM book_images WHERE book_id = ?",
        [book.book_id]
      );
      const images = [];

      for (const image_link of image_links) {
        const [image] = await db.query(
          "SELECT image_path FROM images WHERE image_id = ?",
          [image_link.image_id]
        );
        images.push(image[0]?.image_path || null);
      }
      book.image_paths = images;
    }
    return user_books;
  },
  getOtherUsersBooksByUserId: async (userId) => {
    const [user_books] = await db.execute(
      "SELECT * FROM books WHERE user_id <> ? and visibility_id <> '1' order by title ASC",
      [userId]
    );

    for (const book of user_books) {
      const [image_links] = await db.query(
        "SELECT image_id FROM book_images WHERE book_id = ?",
        [book.book_id]
      );
      const images = [];

      for (const image_link of image_links) {
        const [image] = await db.query(
          "SELECT image_path FROM images WHERE image_id = ?",
          [image_link.image_id]
        );
        images.push(image[0]?.image_path || null);
      }
      book.image_paths = images;
    }
    return user_books;
  },

  getById: async (id) => {
    const [books] = await db.query("SELECT * FROM books WHERE book_id = ?", [
      id,
    ]);
    const book = books[0];
    if (book) {
      const [image_links] = await db.query(
        "SELECT image_id FROM book_images WHERE book_id = ?",
        [book.book_id]
      );

      // ovo je niz slika
      const images = [];

      // Za svaku vezu slike koju smo dohvatili gore
      // dohvaćamo stvarnu putanju slike iz tablice images
      // i dodajemo je u niz slika
      for (const image_link of image_links) {
        const [image] = await db.query(
          "SELECT image_path FROM images WHERE image_id = ?",
          [image_link.image_id]
        );
        images.push(image[0].image_path);
      }

      // Dodajemo niz slika u objekt knjige
      book.image_paths = images;
    }
    return book;
  },

  create: async (bookData) => {
    // slike
    const [result] = await db.query(
      `INSERT INTO books (user_id, title, author, genre_id, publication_year, publisher, book_condition_id, book_language, page_count, book_description, notes, visibility_id, book_status_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        bookData.user_id,
        bookData.title,
        bookData.author,
        bookData.genre_id,
        bookData.publication_year,
        bookData.publisher,
        bookData.book_condition_id,
        bookData.book_language,
        bookData.page_count,
        bookData.book_description,
        bookData.notes,
        bookData.visibility_id,
        bookData.book_status_id,
      ]
    );
    return result.insertId;
  },
  update: async (bookId, bookData) => {
    try {
      console.log("Book.update pozvan za ID:", bookId);
      console.log("Podaci:", bookData);

      const [result] = await db.query(
        `UPDATE books SET 
        title = ?, 
        author = ?, 
        genre_id = ?, 
        publication_year = ?, 
        publisher = ?, 
        book_condition_id = ?, 
        book_language = ?, 
        page_count = ?, 
        book_description = ?, 
        notes = ?, 
        visibility_id = ?, 
        book_status_id = ? 
      WHERE book_id = ?`,
        [
          bookData.title,
          bookData.author,
          bookData.genre_id,
          bookData.publication_year,
          bookData.publisher,
          bookData.book_condition_id,
          bookData.book_language,
          bookData.page_count,
          bookData.book_description,
          bookData.notes,
          bookData.visibility_id,
          bookData.book_status_id,
          bookId,
        ]
      );

      if (bookData.book_status_id == 1) {
        const [updatedHistory] = await db.query(
          `update exchange_history 
          set status_ex_id = 1, end_date = CURRENT_TIMESTAMP 
          where book_id = ? and status_ex_id = 3;`,
          [bookId]
        );
      }
      console.log("Update result:", result);

      if (result.affectedRows === 0) {
        throw new Error(
          `Knjiga s ID ${bookId} nije pronađena ili nije ažurirana.`
        );
      }

      return true;
    } catch (error) {
      console.error("Greška u Book.update:", error);
      throw error;
    }
  },

  delete: async (bookId) => {
    // ako knjiga postoji izbriši je
    // izbrisati i iz mape
    const [books] = await db.query("SELECT * FROM books WHERE book_id = ?", [
      bookId,
    ]);
    const book = books[0];
    if (book) {
      await db.query("DELETE FROM books WHERE book_id = ?", [bookId]);
      return true;
    }
    return false;
  },
};

module.exports = Book;
