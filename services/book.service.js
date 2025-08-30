const Book = require("../DAL/Book");

const getAllBooks = async () => {
  return await Book.getAll();
};

const getBookById = async (id) => {
  return await Book.getById(id);
};
const getBooksByUserId = async (userId) => {
  return await Book.getByUserId(userId);
};
const getOtherUsersBooksByUserId = async (userId) => {
  return await Book.getOtherUsersBooksByUserId(userId);
};

const createBook = async (bookData) => {
  return await Book.create(bookData);
};

const updateBook = async (bookId, bookData) => {
  return await Book.update(bookId, bookData);
};

const deleteBook = async (bookId) => {
  return await Book.delete(bookId);
};

module.exports = {
  getAllBooks,
  getBookById,
  getBooksByUserId,
  createBook,
  updateBook,
  deleteBook,
  getOtherUsersBooksByUserId,
};
