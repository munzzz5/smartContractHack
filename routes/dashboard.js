const express = require("express");
const router = express.Router();
const ContractRequest = require("../models/ContractRequests");
const { route } = require("./contractRequests");
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
router.get("/existingContracts", async (req, res) => {
  const contractsDeployed = await ContractRequest.find({
    status: "deployed",
    recipient: req.session.user._id,
  });
  res.render("existingcontract", { contractsDeployed });
});
module.exports = router;
