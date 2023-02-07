const express = require("express");
const { ObjectId } = require("mongodb");
const mongoCollection = require("../config/mongoCollections");
const router = express.Router();
const recipes = mongoCollection.recipes;
const recipeData = require("../data/recipes");

function stringArrayCheckForIngredients(arr) {
  if (arr.length === 0) return false;
  let count = 0;
  for (let i of arr) {
    i = i.trim();
    if (typeof i !== "string") continue;
    if (i.length === 0) {
      return false;
    }
    if (i.length < 3 || i.trim().length > 50) return false;

    count++;
  }
  if (count < 3) return false;
  else return true;
}

function stringArrayCheckForSteps(arr) {
  if (arr.length === 0) return false;
  let count = 0;
  for (let i of arr) {
    i = i.trim();
    if (typeof i !== "string") continue;
    if (i.length === 0) return false;
    if (i.length < 20) return false;
    count++;
  }
  if (count < 5) return false;
  else return true;
}

// get: recipes
router.get("/", async (req, res) => {
  //get all recipes by limit and skip operation
  let page = req.query.page;
  if (page == undefined) {
    page = 1;
  }
  let recipe = undefined;
  if (!Number.isInteger(Number(page)) && Number(page) > 0) {
    res.status(400).json({ error: "Page should be positive" });
    return;
  }
  try {
    recipes = await recipeData.getRecipeByPage(page);
  } catch (e) {
    res.status(400).json({ error: e });
    return;
  }

  if (recipe != undefined) {
    res.status(200).json(recipe);
  } else {
    res.status(500).json({ error: "Internal Server Error" });
  }
});

//get: recipes/:id
router.get("/:id", async (req, res) => {
  let id = req.params.id;
  if (!id) {
    res.status(400).json({ error: "You must provide a right id" });
    return;
  }
  if (typeof id !== "string" || !ObjectId.isValid(id)) {
    res.status(400).json({ error: "You must provide a right id " });
    return;
  }

  try {
    let recipeInfo = await recipeData.get(id);
    recipeInfo._id = recipeInfo._id.toString();
    console.log(req.body + " " + req.method + " " + req.originalUrl);
    res.status(200).json(recipeInfo);
  } catch (e) {
    console.log(req.body + " " + req.method + " " + req.originalUrl);
    res.status(404).json({ error: "Can not find the recipe" });
    return;
  }
});

//post: recipes
router.post("/", async (req, res) => {
  //middleware put here
  let recipeInfo = req.body;
  if (!recipeInfo) {
    res.status(400).json({ error: "You must provide data to create a recipe" });
    return;
  }
  if (
    !recipeInfo.title ||
    !recipeInfo.ingredients ||
    !recipeInfo.cookingSkillRequired ||
    !recipeInfo.steps
  ) {
    res.status(400).json({ error: "All fields needed" });
    return;
  }
  if (typeof recipeInfo.title !== "string") {
    res.status(400).json({ error: "title should be string" });
    return;
  }
  if (recipeInfo.title.match(/^[ ]*$/)) {
    res.status(400).json({ error: "title should not be empty" });
    return;
  }
  if (
    !Array.isArray(recipeInfo.ingredients) ||
    !Array.isArray(recipeInfo.steps)
  ) {
    res.status(400).json({ error: "ingredients and steps should be array" });
    return;
  }
  if (!stringArrayCheckForIngredients(recipeInfo.ingredients)) {
    res.status(400).json({ error: "invalid ingredients" });
    return;
  }
  if (!stringArrayCheckForSteps(recipeInfo.steps)) {
    res.status(400).json({ error: "invalid steps" });
    return;
  }
  const required = ["Novice", "Intermediate", "Advanced"];
  if (required.indexOf(recipeInfo.cookingSkillRequired) === -1) {
    res.status(400).json({ error: "invalid cookingSkillRequired" });
    return;
  }
  if (req.session.logged == true) {
    try {
      let newRecipe = await recipeData.createRecipe(
        recipeInfo.title,
        recipeInfo.ingredients,
        recipeInfo.cookingSkillRequired,
        recipeInfo.steps
      );

      newRecipe.userThatPosted = {
        _id: req.session.id,
        username: req.session.user,
      };
      const recipeCollection = await recipes();
      const updatedInfo = await recipeCollection.updateOne(
        { _id: ObjectId(newRecipe._id.toString()) },
        {
          $set: {
            userThatPosted: newRecipe.userThatPosted,
          },
        }
      );
      if (updatedInfo.modifiedCount === 0) {
        res.status(400).json({ error: "Could not update userThatPost" });
        return;
      }
      let recipeList = await recipeData.get(newRecipe._id);
      console.log(req.body + " " + req.method + " " + req.originalUrl);
      res.status(200).json(recipeList);
    } catch (e) {
      console.log(req.body + " " + req.method + " " + req.originalUrl);
      res.status(500).json({ error: "Could not create recipe" });
    }
  } else {
    console.log(req.body + " " + req.method + " " + req.originalUrl);
    res.status(400).json({ error: "no user found, you can't create recipe" });
    return;
  }
});

//patch: recipes/:id
router.patch("/:id", async (req, res) => {
  let id = req.params.id;
  let recipeInfo = req.body;
  if (!id) {
    res.status(400).json({ error: "You must provide an id" });
    return;
  }
  if (typeof id !== "string" || !ObjectId.isValid(id)) {
    res.status(400).json({ error: "You must provide a valid id" });
    return;
  }
  if (
    !recipeInfo.title ||
    !recipeInfo.ingredients ||
    !recipeInfo.cookingSkillRequired ||
    !recipeInfo.steps
  ) {
    res.status(400).json({ error: "You must provide all needed inputs" });
    return;
  }
  if (
    typeof recipeInfo.title !== "string" ||
    typeof recipeInfo.cookingSkillRequired !== "string"
  ) {
    res
      .status(400)
      .json({ error: "title and cookingSkillRequired should be string" });
    return;
  }
  if (id.match(/^[ ]*$/)) {
    res.status(400).json({ error: "id with spaces is not valid" });
    return;
  }
  if (
    !Array.isArray(recipeInfo.ingredients) ||
    !Array.isArray(recipeInfo.steps)
  ) {
    res.status(400).json({ error: "ingredients and steps should be array" });
    return;
  }
  if (!stringArrayCheckForIngredients(recipeInfo.ingredients)) {
    res.status(400).json({ error: "invalid ingredients" });
    return;
  }
  if (!stringArrayCheckForSteps(recipeInfo.steps)) {
    res.status(400).json({ error: "invalid steps" });
    return;
  }
  const required = ["Novice", "Intermediate", "Advanced"];
  if (required.indexOf(recipeInfo.cookingSkillRequired) === -1) {
    res.status(400).json({ error: "invalid cookingSkillRequired" });
    return;
  }

  try {
    // have a try
    const temp = await recipeData.get(id);
  } catch (e) {
    res.status(400).json({ error: "Id not found" });
    return;
  }

  const recipe = await recipeData.get(id);

  if (
    req.session.logged == true &&
    req.session.user == recipe.userThatPosted.username
  ) {
    try {
      const updatedRecipe = await recipeData.update(
        id,
        recipeInfo.title,
        recipeInfo.ingredients,
        recipeInfo.cookingSkillRequired,
        recipeInfo.steps
      );
      console.log(req.body + " " + req.method + " " + req.originalUrl);
      res.status(200).json(updatedRecipe);
    } catch (e) {
      console.log(req.body + " " + req.method + " " + req.originalUrl);
      res.status(500).json({ error: e });
    }
  } else {
    console.log(req.body + " " + req.method + " " + req.originalUrl);
    res
      .status(400)
      .json({ error: "Not logged in or you are not the original poster" });
    return;
  }
});

//post : recipes/:id/likes
router.post("/:id/likes", async (req, res) => {
  let id = req.params.id; // the recipe id which was created by a user
  let like = req.params.likes; // the user id who likes this recipe
  //let recipeInfo = req.body;

  if (!id || !like) {
    res
      .status(400)
      .json({ error: "You must provide an id and userId who likes it" });
    return;
  }
  if (typeof id !== "string" || !ObjectId.isValid(id)) {
    res.status(400).json({ error: "You must provide a valid id" });
    return;
  }
  if (typeof like !== "string" || !ObjectId.isValid(like)) {
    res
      .status(400)
      .json({ error: "You must provide a valid userId who likes it" });
    return;
  }
  if (id.match(/^[ ]*$/) || like.match(/^[ ]*$/)) {
    res.status(400).json({ error: "id or like with spaces is not valid" });
    return;
  }
  id = id.toString();
  like = like.toString();
  try {
    // have a try
    const temp = await recipeData.get(id);
  } catch (e) {
    res.status(400).json({ error: "Id not found" });
    return;
  }

  let recipe = await recipeData.get(id);

  if (req.session.logged == true) {
    try {
      if (recipe.likes.indexOf(like) === -1) {
        // the user hasn't liked this recipe
        recipe.likes.push(like);
        const recipeCollection = await recipes();
        const updateInfo = await recipeCollection.updateOne(
          { _id: ObjectId(id) },
          {
            $set: {
              likes: recipe.likes,
            },
          }
        );
        if (updateInfo.modifiedCount === 0) {
          res
            .status(400)
            .json({ error: "Could not like the recipe successfully" });
          return;
        }

        const newRecipe = await recipeData.get(id);
        console.log(req.body + " " + req.method + " " + req.originalUrl);
        res.status(200).json(newRecipe);
      } else {
        //the user liked this recipe before
        let index = recipe.likes.indexOf(like); // get the index of like
        recipe.likes.splice(index, 1); //delete the element
        const recipeCollection = await recipes();
        const updateInfo = await recipeCollection.updateOne(
          { _id: ObjectId(id) },
          {
            $set: {
              likes: recipe.likes,
            },
          }
        );
        if (updateInfo.modifiedCount === 0) {
          res
            .status(400)
            .json({ error: "Could not cancel the like successfully" });
          return;
        }

        const newRecipe = await recipeData.get(id);
        console.log(req.body + " " + req.method + " " + req.originalUrl);
        res.status(200).json(newRecipe);
      }
    } catch (e) {
      res.status(500).json({ error: e });
    }
  } else {
    console.log(req.body + " " + req.method + " " + req.originalUrl);
    res
      .status(400)
      .json({ error: "Not logged in or likeId does not match userId" });
    return;
  }
});

module.exports = router;
