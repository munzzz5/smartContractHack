const express = require("express");
const mongoose = require("mongoose");
const ContractRequest = require("../models/ContractRequests");
const router = express.Router();

router.get("/new", (req, res) => {
  res.render("newContractRequest");
});

router.post("/new", async (req, res) => {
  const { recipientWalletId, role, minGuarantee } = req.body;
  const User = require("../models/User");

  const recipientUser = await User.findOne({ address: recipientWalletId });
  if (!recipientUser) {
    return res.status(404).send("Recipient not found");
  }
  const recipientObjectId = recipientUser._id;
  const newRequest = new ContractRequest({
    initiator: req.session.user._id, // Assuming you have user info in req.user
    recipient: recipientObjectId, // This needs to be fetched based on walletId
    role,
    minGuarantee,
  });
  await newRequest.save();
  res.redirect("/dashboard/dashboard"); // Or wherever you want to redirect after creating a request
});
router.post("/:id/accept", async (req, res) => {
  const contractRequest = await ContractRequest.findById(req.params.id);
  if (!contractRequest || contractRequest.recipient != req.session.user._id) {
    return res.status(400).send("Invalid request");
  }
  contractRequest.status = "accepted";
  await contractRequest.save();
  res.redirect("/contractDetails");
});

router.post("/:id/reject", async (req, res) => {
  const contractRequest = await ContractRequest.findById(req.params.id);
  if (!contractRequest || contractRequest.recipient != req.session.user._id) {
    return res.status(400).send("Invalid request");
  }
  contractRequest.status = "rejected";
  await contractRequest.save();
  res.redirect("/dashboard");
});
router.post("/contractDetails", async (req, res) => {
  const { startDate, endDate, penaltyPerUnit } = req.body;

  // Fetch the contract request using the user's ID (assuming you have user info in req.user)
  const contractRequest = await ContractRequest.findOne({
    status: "accepted",
    recipient: req.session.user._id,
  });

  if (!contractRequest) {
    return res.status(400).send("No accepted contract request found.");
  }

  // Update the contract request with the new data
  contractRequest.contractStartDate = new Date(startDate);
  contractRequest.contractEndDate = new Date(endDate);
  contractRequest.penaltyPerUnit = penaltyPerUnit;
  contractRequest.status = "deployed";
  await contractRequest.save();

  res.redirect("/dashboard/dashboard"); // Or wherever you want to redirect after updating the contract details
});

module.exports = router;
