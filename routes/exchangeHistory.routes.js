const express = require("express");
const router = express.Router();
const exchangeHistoryController = require("../controllers/exchangeHistory.controller");

router.post("/", exchangeHistoryController.createExchange);
router.get("/book/:bookId", exchangeHistoryController.getExchangeByBook);
router.get("/user/:userId", exchangeHistoryController.getExchangeByUser);
router.delete("/:historyId", exchangeHistoryController.deleteExchange);

module.exports = router;
