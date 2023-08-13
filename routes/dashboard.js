const express = require("express");
const router = express.Router();
const ContractRequest = require("../models/ContractRequests");
router.get("/dashboard", async (req, res) => {
  console.log(req.session.user);
  const contractRequests = await ContractRequest.find({
    recipient: req.session.user._id,
    status: "pending",
  });
  const contractPending = await ContractRequest.find({
    recipient: req.session.user._id,
    status: "accepted",
  });
  res.render("dashboard", { contractRequests, contractPending });
});
module.exports = router;
