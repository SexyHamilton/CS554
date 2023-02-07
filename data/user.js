const mongoCollection = require("../config/mongoCollections");
const users = mongoCollection.users;
const bcrypt = require("bcrypt");
const ObjectId = require("mongodb").ObjectId;
const saltRounds = 10;

module.exports = {
  async createUser(username, name, password) {
    let u;
    let usernameLow;
    const userCollection = await users();
    try {
      if (arguments.length !== 3) throw "arguments is 3";
      if (!username || !password || !name)
        throw "username and password and name must be supplied";
      if (typeof username !== "string") throw "username must be string";
      if (username.match(/^[ ]*$/)) throw "username with spaces is not allowed";
      if (username.indexOf(" ") !== -1)
        throw "space in username is not allowed";
      if (!username.match("^[a-zA-Z0-9]*$"))
        throw "username must be alphanumeric";
      if (username.length < 3) throw "username at lease 3 characters long";
      usernameLow = username.toLowerCase();

      if (name.length < 3) throw "name at lease 3 characters long";
      if (typeof name !== "string") throw "name must be string";
      if (!name.match(/^[a-zA-Z]*$/)) throw "name must be alphabetic";

      if (password.indexOf(" ") !== -1)
        throw "space in password is not allowed";
      if (password.length < 6) throw "password at lease 6 characters long";
      if (password.match(/^[ ]*$/))
        throw "password with just spaces is not allowed";
      // var checkPassword =
      //   /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[!@#$%^&*])$/;
      if (
        !password.match(
          /^(?=.{6,}$)(?=.*?[a-z])(?=.*?[A-Z])(?=.*?[0-9])(?=.*?\W).*$/
        )
      )
        throw "password format is not right";

      u = await userCollection.findOne({ username: usernameLow });
    } catch (e) {
      throw e;
    }

    if (!u) {
      const hash = await bcrypt.hash(password, saltRounds);

      let updatedUser = {
        //_id: new ObjectId(),
        name: name,
        username: usernameLow,
        password: hash,
      };

      const insertInfo = await userCollection.insertOne(updatedUser);
      if (insertInfo.modifiedCount === 0) {
        throw "could not create users successfully";
      } else {
        // return { userInserted: true };
        return insertInfo;
      }
    } else {
      throw "username has established";
    }
  },

  async checkUser(username, password) {
    if (arguments.length !== 2) throw "arguments is not 2";
    if (!username || !password) throw "username and password must be supplied";
    if (typeof username !== "string") throw "username must be string";
    if (username.match(/^[ ]*$/)) throw "username with spaces is not allowed";
    if (username.indexOf(" ") !== -1) throw "space in username is not allowed";
    if (!username.match(/^[a-zA-Z0-9]*$/))
      throw "username must be alphanumeric";
    if (username.length < 3) throw "username at lease 3 characters long";
    username = username.toLowerCase();
    if (password.length < 6) throw "password at lease 6 characters long";
    if (password.match(/^[ ]*$/))
      throw "password with just spaces is not allowed";
    if (
      !password.match(
        /^(?=.{6,}$)(?=.*?[a-z])(?=.*?[A-Z])(?=.*?[0-9])(?=.*?\W).*$/
      )
    )
      throw "password format is not right";

    const userCollection = await users();
    const user = await userCollection.findOne({ username: username });
    const pass = user.password;
    let comparePassword = false;

    if (user === null) {
      throw "Either username or password is invalid";
    } else if (user.username === username) {
      try {
        comparePassword = await bcrypt.compare(password, pass);
      } catch (e) {
        throw "Can't compare the password ";
      }
      if (comparePassword) {
        return user;
      } else {
        throw "Either username or password is invalid";
      }
    }
  },

  async getUserById(userId) {
    const userCollection = await users();
    let user = await userCollection.findOne({ _id: ObjectId(userId) });
    if (user === null) throw "No user with that id";
    const userInfoWithOutPassword = {
      _id: user._id,
      name: user.name,
      username: user.username,
    };
    return userInfoWithOutPassword;
  },
};
