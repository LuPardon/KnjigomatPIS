const express = require("express");
const router = express.Router();
const bookController = require("../controllers/book.controller");

router.get("/", bookController.getBooks);
router.get("/user/:userId", bookController.getBooksByUserId);
router.get("/user/other/:userId", bookController.getOtherUsersBooksByUserId);
router.get("/:id", bookController.getBookById);
router.post("/", bookController.createBook);
router.put("/:id", bookController.updateBook);
router.delete("/:id", bookController.deleteBook);

module.exports = router;
