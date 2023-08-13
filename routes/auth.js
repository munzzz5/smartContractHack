const express = require("express");
const router = express.Router();
const User = require("../models/User");
const axios = require("axios");
const session = require("express-session");
const apiKey = `04feQ0Q28E8rDrg92ced5Q2d6e8r9e04`;
const restApiUrl = `https://pool.arkhia.io/hedera/testnet/api/v1`;
const body = { headers: { "x-api-key": apiKey } };

router.get("/login", (req, res) => {
  res.render("login");
});

router.post("/login", async (req, res) => {
  const { address, signature, username, location } = req.body;

  // Placeholder for Hedera-specific signature verification
  const isSigned = await verifySignatureWithHedera(address, signature);

  if (isSigned) {
    let user = await User.findOne({ address });
    if (!user) {
      user = new User({ address, username, location });
      await user.save();
    } else {
      // Update the user
      user.username = username;
      user.location = location;
      await user.save();
    }
    req.session.user = user;
    res.redirect(200, "/home");
  } else {
    res.status(401).send("Authentication failed");
  }
});

async function verifySignatureWithHedera(address, signature) {
  try {
    const accountInfo = await getAccountById(address);
    // Use accountInfo and signature to verify the authenticity
    // Return true if verified, false otherwise
    // session.walletId = accountInfo;
    return true; // Placeholder
  } catch (e) {
    console.error(e);
    return false;
  }
}

async function getAccountById(accountId) {
  try {
    const accountUrl = `${restApiUrl}/accounts/${accountId}`;
    const response = await axios.get(accountUrl, body);
    return response.data;
  } catch (e) {
    console.error(e);
    throw e;
  }
}

module.exports = router;
