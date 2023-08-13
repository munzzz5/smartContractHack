const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  address: {
    type: String,
    required: true,
    unique: true,
  },
  username: {
    type: String,
    required: true,
  },
  location: {
    type: String,
    required: true,
  },
});

module.exports = mongoose.model("User", userSchema);
