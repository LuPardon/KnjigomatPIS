const express = require("express");
const router = express.Router();
const userController = require("../controllers/user.controller");
const { requiresAuth } = require("express-openid-connect");

router.get("/", userController.getUsers);
router.get("/:id", userController.getUserById);
router.post("/", userController.createUser);
router.put("/:id", userController.updateUser);
router.delete("/:id", userController.deleteUser);

module.exports = router;
