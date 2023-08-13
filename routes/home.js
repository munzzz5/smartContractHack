const express = require("express");
const router = express.Router();

router.get("/", async (req, res) => {
  // Fetch the required data from your database or contract
  let totalContracts = 10; // Example value, replace with actual logic
  let totalEnergy = 500; // Example value, replace with actual logic

  res.render("home", { totalContracts, totalEnergy });
});

module.exports = router;
