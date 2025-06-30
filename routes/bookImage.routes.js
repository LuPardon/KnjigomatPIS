const express = require("express");
const router = express.Router();
const controller = require("../controllers/bookImage.controller");

router.get("/:bookId", controller.getImagesByBook);
router.post("/", controller.addImage);
router.put("/", controller.editImage);
router.delete("/", controller.deleteImage);

module.exports = router;
