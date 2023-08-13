const express = require("express");
const router = express.Router();

router.get("/", async (req, res) => {
  let totalContracts = 10;
  let totalEnergy = 500;

  res.render("home", { totalContracts, totalEnergy });
});

module.exports = router;
