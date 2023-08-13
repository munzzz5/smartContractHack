const mongoose = require("mongoose");

const contractRequestSchema = new mongoose.Schema({
  initiator: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  role: {
    type: String,
    enum: ["generator", "consumer"],
    required: true,
  },
  minGuarantee: {
    type: Number,
    required: true,
  },
  status: {
    type: String,
    enum: ["pending", "accepted", "rejected", "deployed"],
    default: "pending",
  },
  contractStartDate: { type: Date, required: false },
  contractEndDate: { type: Date, required: false },
  penaltyPerUnit: { type: Number, default: 5 },
  billingFreq: {
    type: String,
    default: "MONTH",
  },
  approvalDate: { type: Date, required: false },
  approvalStatus: { type: String },
});

module.exports = mongoose.model("ContractRequest", contractRequestSchema);
