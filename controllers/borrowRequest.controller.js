const borrowRequestService = require("../services/borrowRequest.service");

exports.createRequest = async (req, res) => {
  try {
    const result = await borrowRequestService.create(req.body);
    res
      .status(201)
      .json({ message: "Zahtjev poslan.", requestId: result.insertId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getAllRequests = async (req, res) => {
  try {
    const results = await borrowRequestService.getAll();
    res.json(results);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getRequestById = async (req, res) => {
  try {
    const result = await borrowRequestService.getById(req.params.id);
    if (result.length === 0) {
      return res.status(404).json({ error: "Zahtjev nije pronađen." });
    }
    res.json(result[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.updateRequestStatus = async (req, res) => {
  try {
    await borrowRequestService.updateStatus(req.params.id, req.body.status);
    res.json({ message: "Status ažuriran." });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.deleteRequest = async (req, res) => {
  try {
    await borrowRequestService.deleteR(req.params.id);
    res.json({ message: "Zahtjev obrisan." });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.acceptRequest = async (req, res) => {
  try {
    // promjena statusa zahtjeva na potvrđen
    const requestId = req.params.id;
    await borrowRequestService.updateStatus(requestId, 2); // 2 je ID statusa "prihvaćen"

    // insertanje u ExchangeHistory
    console.log("Zahtjev prihvaćen:", requestId);
    res.json({ message: "Zahtjev potvrđen." });
  } catch (err) {
    console.error("Greška pri prihvaćanju zahtjeva:", err);
    res.status(500).json({ error: err.message });
  }
};

exports.rejectRequest = async (req, res) => {
  try {
    // trebam samo id zahtjeva, a status će biti odbijen
    const requestId = req.params.id;
    await borrowRequestService.updateStatus(requestId, 3); // 3 je ID statusa "odbijen"

    // promjena statusa zahtjeva na odbijen
    console.log("Zahtjev odbijen:", requestId);
    res.json({ message: "Zahtjev odbijen." });
  } catch (err) {
    console.error("Greška pri odbijanju zahtjeva:", err);
    res.status(500).json({ error: err.message });
  }
};
