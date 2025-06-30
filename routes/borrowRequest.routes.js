const express = require("express");
const router = express.Router();
const borrowRequestController = require("../controllers/borrowRequest.controller");

router.post("/", borrowRequestController.createRequest);
router.get("/", borrowRequestController.getAllRequests);
router.get("/:id", borrowRequestController.getRequestById);
router.put("/:id/status", borrowRequestController.updateRequestStatus);
router.delete("/:id", borrowRequestController.deleteRequest);
router.post("/:id/accept", borrowRequestController.acceptRequest);
router.post("/:id/reject", borrowRequestController.rejectRequest);

module.exports = router;
