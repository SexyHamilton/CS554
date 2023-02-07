const express = require("express");
const user = require("../data/user");
const router = express.Router();
const mongoCollection = require("../config/mongoCollections");
const { getUserById } = require("../data/user");
const users = mongoCollection.users;

//post: signup

router.post("/signup", async (req, res) => {
  const username = req.body.username;
  const password = req.body.password;
  const name = req.body.name;
  let create;
  try {
    if (!username || !password || !name)
      throw "username and password and name must be supplied";
    if (typeof username !== "string") throw "username must be string";
    if (username.match(/^[ ]*$/)) throw "username with spaces is not allowed";
    if (username.indexOf(" ") !== -1) throw "space in username is not allowed";
    if (!username.match("^[a-zA-Z0-9]*$"))
      throw "username must be alphanumeric";
    if (username.length < 3) throw "username at lease 3 characters long";

    if (name.length < 3) throw "name at lease 3 characters long";
    if (typeof name !== "string") throw "name must be string";
    if (!name.match("^[a-zA-Z]*$")) throw "name must be alphabetic";

    if (password.indexOf(" ") !== -1) throw "space in password is not allowed";
    if (password.length < 6) throw "password at lease 6 characters long";
    if (password.match(/^[ ]*$/))
      throw "password with just spaces is not allowed";
    create = await user.createUser(username, name, password);
  } catch (e) {
    return res.status(400).render({ e });
  }

  if (!create) {
    console.log(req.body.username + " " + req.method + " " + req.originalUrl);
    error = "Internal Server Error";
    res.status(500).render({ error });
    return;
  } else {
    // const userCollection = await users();
    // let u = await userCollection.findOne({ username: username });
    let id = create.insertedId.toString();
    const user = await getUserById(id);

    res.status(200).json({ user });
  }
});

//post: login

router.post("/login", async (req, res) => {
  const username = req.body.username;
  const password = req.body.password;
  let found;
  try {
    if (!username || !password) throw "username and password must be supplied";
    if (typeof username !== "string") throw "username must be string";
    if (username.match(/^[ ]*$/)) throw "username with spaces is not allowed";
    if (username.indexOf(" ") !== -1) throw "space in username is not allowed";
    if (!username.match("^[a-zA-Z0-9]*$"))
      throw "username must be alphanumeric";
    if (username.length < 3) throw "username at lease 3 characters long";

    if (password.indexOf(" ") !== -1) throw "space in password is not allowed";
    if (password.length < 6) throw "password at lease 6 characters long";
    if (password.match(/^[ ]*$/))
      throw "password with just spaces is not allowed";

    found = await user.checkUser(username, password);
  } catch (e) {
    return res.status(400).json({ e });
  }

  try {
    if (found) {
      // const userCollection = await users();
      // let u = await userCollection.findOne({ username: username });
      let id = found._id.toString();
      const user = await getUserById(id);
      req.session.user = user.username;
      req.session.id = user._id;
      req.session.logged = true;
      // update key: userThatPosted
      return res.status(200).json(user);
    } else {
      console.log(req.body.username + " " + req.method + " " + req.originalUrl);

      error = "Please log in with valid credentials.";
      res.status(400).json({ error });
      return;
    }
  } catch (e) {
    //check but failed
    console.log(req.body.username + " " + req.method + " " + req.originalUrl);
    error = "Please log in with valid credentials.";
    res.status(400).json({ error });
    return;
  }
});

//get: logout

router.get("/logout", (req, res) => {
  if (req.session.user) {
    req.session.destroy();
    res.json({ message: "You have logged out" });
  }
});

module.exports = router;
