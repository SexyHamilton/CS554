const express = require("express");
const app = express();
const session = require("express-session");
const configRoutes = require("./routes");

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(
  session({
    name: "AuthCookie",
    secret: "some secret string",
    resave: false,
    saveUninitialized: true,
  })
);

app.use("/recipe", (req, res, next) => {
  if (!req.session.logged || !req.session.user) {
    return res.status(400).render({ error: "No user logged in" });
  } else {
    next();
  }
});

//more middleware functions to be added.

configRoutes(app);

app.listen(3000, () => {
  console.log("We've now got a server!");
  console.log("Your routes will be running on http://localhost:3000");
});
