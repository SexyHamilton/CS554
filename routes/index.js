const loggedRoutes = require("./logged");
const recipesRoutes = require("./recipes");
const commentRoutes = require("./comments");

const constructorMethod = (app) => {
  app.use("/recipes", recipesRoutes);
  app.use("/recipes", commentRoutes);
  app.use("/", loggedRoutes);

  app.use("*", (req, res) => {
    res.sendStatus(404);
  });
};

module.exports = constructorMethod;
