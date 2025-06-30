const BookImage = require("../models/BookImage");

const getImagesByBook = async (bookId) => {
  return await BookImage.getByBookId(bookId);
};

const addImage = async (bookId, imagePath) => {
  return await BookImage.add(bookId, imagePath);
};

const editImage = async (originaImagePath, relativePath) => {
  return await BookImage.edit(originaImagePath, relativePath);
};

const deleteImage = async (imageId) => {
  return await BookImage.delete(imageId);
};

module.exports = {
  getImagesByBook,
  addImage,
  deleteImage,
  editImage,
};
