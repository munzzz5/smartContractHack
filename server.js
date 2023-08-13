const contractRequestsRoutes = require("./routes/contractRequests");
const express = require("express");
const mongoose = require("mongoose");
const session = require("express-session");
require("dotenv").config();
const MongoStore = require("connect-mongo");
const app = express();
const cors = require("cors");
const homeRoute = require("./routes/home");
const dashboardRoute = require("./routes/dashboard");
const contractRequestsRoute = require("./routes/contractRequests");
const authRoute = require("./routes/auth");
const passport = require("passport");

app.use(cors());

// Connect to MongoDB
mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log("Connected to MongoDB");
  })
  .catch((err) => {
    console.error("Error connecting to MongoDB:", err);
  });

app.set("view engine", "ejs");
app.use(express.static("public"));

// Body parsing middleware
app.use(express.json()); // for parsing application/json
app.use(express.urlencoded({ extended: true })); // for parsing application/x-www-form-urlencoded

// Session middleware
// app.use(
//   session({
//     secret: process.env.SESSION_SECRET,
//     resave: false,
//     saveUninitialized: false,
//   })
// );
app.use(
  session({
    secret: process.env.SESSION_SECRET, // Change this to a long random string!
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
      mongoUrl: "mongodb://127.0.0.1:27017/test_contract",
    }),
  })
);
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send("Something broke!");
});
passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser((id, done) => {
  User.findById(id, (err, user) => {
    done(err, user);
  });
});

app.use(passport.initialize());
app.use(passport.session());

// Routes
app.use("/contractRequests", contractRequestsRoutes);
app.use("/auth", require("./routes/auth"));
app.use("/home", require("./routes/home"));
app.use("/dashboard", require("./routes/dashboard"));
app.use("/contractRequests", require("./routes/contractRequests"));
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server started on http://localhost:${PORT}`);
});
