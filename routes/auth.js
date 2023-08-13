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
      // Update the user's name and location if they already exist
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
  // This is a placeholder. You'll need to implement the actual logic for verifying
  // a signature with Hedera Hashgraph, which might involve interacting with the
  // Arkhia REST API or another Hedera-specific method.
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
    return response.data; // Typically, you'd want the data property from the axios response
  } catch (e) {
    console.error(e);
    throw e; // Propagate the error so it can be caught in the calling function
  }
}

module.exports = router;
