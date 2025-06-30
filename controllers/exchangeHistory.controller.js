const exchangeHistoryService = require("../services/exchangeHistory.service");
const bookService = require("../services/book.service");
exports.createExchange = async (req, res) => {
  try {
    const result = await exchangeHistoryService.create(req.body);
    res.status(201).json({
      message: "Razmjena započeta.",
      exchangeHistoryId: result.insertId,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getExchangeByBook = async (req, res) => {
  try {
    const result = await exchangeHistoryService.getByBookId(req.params.bookId);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getExchangeByUser = async (req, res) => {
  try {
    let exchanges = await exchangeHistoryService.getByUserId(req.params.userId);
    let promises = [];
    for (exchange of exchanges) {
      promises.push(await bookService.getBookById(exchange.book_id));
    }
    let done = await Promise.all(promises);

    for (let i = 0; i < exchanges.length; i++) {
      exchanges[i].book = done[i];
    }

    console.log("result: ", exchanges);
    console.log("done: ", done);
    res.json(exchanges);
  } catch (err) {
    console.error("Error fetching exchange by user:", err);
    res.status(500).json({ error: err.message });
  }
};

exports.deleteExchange = async (req, res) => {
  try {
    await exchangeHistoryService.deleteH(req.params.historyId);
    res.json({ message: "Razmjena obrisana." });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
