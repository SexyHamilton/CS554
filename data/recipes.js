const mongoCollection = require("../config/mongoCollections");
const recipes = mongoCollection.recipes;
const ObjectId = require("mongodb").ObjectId;

function stringArrayCheckForIngredients(arr) {
  if (arr.length === 0) throw "The array is empty";
  let count = 0;
  for (let i of arr) {
    i = i.trim();
    if (typeof i !== "string") continue;
    if (i.length === 0) {
      throw "String with empty spaces is not allowed";
    }
    if (i.length < 3 || i.trim().length > 50)
      throw "each ingredient should be 3~50 characters.";

    count++;
  }
  if (count < 3) throw "At lease 3 valid strings in the array";
}

function stringArrayCheckForSteps(arr) {
  if (arr.length === 0) throw "The array is empty";
  let count = 0;
  for (let i of arr) {
    i = i.trim();
    if (typeof i !== "string") continue;
    if (i.length === 0) throw "String with empty spaces is not allowed";
    if (i.length < 20) throw "each ingredient should be >= 20 characters";
    count++;
  }
  if (count < 5) throw "At lease 5 valid strings in the array";
}

module.exports = {
  async createRecipe(title, ingredients, cookingSkillRequired, steps) {
    if (arguments.length !== 4) throw "All fields needed";
    if (!title || !ingredients || !cookingSkillRequired || !steps)
      throw "You must provide the 4 inputs";
    if (typeof title !== "string") throw "title must be string";
    if (title.match(/^[ ]*$/)) throw "title with spaces is not allowed";
    if (!Array.isArray(ingredients) || !Array.isArray(steps))
      throw "ingredients and steps must be array";
    stringArrayCheckForIngredients(ingredients);
    stringArrayCheckForSteps(steps);
    const required = ["Novice", "Intermediate", "Advanced"];
    if (required.indexOf(cookingSkillRequired) === -1)
      throw "cookingSkillRequired one in three";

    title = title.trim();
    const recipeCollection = await recipes();
    let updatedRecipe = {
      title: title,
      ingredients: ingredients,
      cookingSkillRequired: cookingSkillRequired,
      steps: steps,
      userThatPosted: {},
      comments: [],
      likes: [],
    };

    const insertInfo = await recipeCollection.insertOne(updatedRecipe);
    if (insertInfo.modifiedCount === 0) {
      throw "Couldn't create recipe successfully";
    }
    const newId = insertInfo.insertedId.toString();
    return await this.get(newId);
  },

  async get(id) {
    // get recipe by userId
    if (arguments.length !== 1) throw "error argument";
    if (!id) throw "lack id";
    if (typeof id === "object") id = id.toString();
    if (!ObjectId.isValid(id)) throw "Invalid object id";

    const recipeCollection = await recipes();
    const recipe = await recipeCollection.findOne({ _id: ObjectId(id) });
    if (recipe === null) throw "error id";
    recipe._id = recipe._id.toString();

    return recipe;
  },

  async getAll() {
    // for user to browse recipes
    if (arguments.length !== 0) throw "error arguments";
    const recipeCollection = await recipes();
    const recipeList = await recipeCollection.find({}).toArray();
    if (!recipeList) throw "Could not get all recipes";
    for (let i = 0; i < recipeList.length; i++) {
      recipeList[i]._id = recipeList[i]._id.toString();
    }

    return recipeList;
  },

  async getRecipeByPage(pageNum = 1, perPage = 50) {
    const recipeCollection = await recipes();
    let getAllRecipes = [];
    await recipeCollection
      .find()
      .skip(pageNum > 0 ? (pageNum - 1) * perPage : 0)
      .limit(perPage)
      .forEach((recipe) => {
        getAllRecipes.push(recipe);
      });
    if (getAllRecipes.length === 0) {
      throw "there are no recipes";
    }
    return getAllRecipes;
  },

  async update(id, title, ingredients, cookingSkillRequired, steps) {
    if (arguments.length !== 5) throw "All fields needed";
    if (!id || !title || !ingredients || !cookingSkillRequired || !steps)
      throw "You must provide all needed inputs";
    if (
      typeof id !== "string" ||
      typeof title !== "string" ||
      typeof cookingSkillRequired !== "string"
    )
      throw "id and title and cookingSkillRequired should be string";
    if (id.match(/^[ ]*$/) || title.match(/^[ ]*$/))
      throw "id or title with spaces is not valid";
    id = id.trim();
    if (!ObjectId.isValid(id)) throw "not valid id";
    if (!Array.isArray(ingredients) || !Array.isArray(steps))
      throw "ingredients and steps must be array";
    stringArrayCheckForIngredients(ingredients);
    stringArrayCheckForSteps(steps);
    const required = ["Novice", "Intermediate", "Advanced"];
    if (required.indexOf(cookingSkillRequired) === -1)
      throw "cookingSkillRequired one in three";
    if (typeof id === "object") id = id.toString();

    const recipeCollection = await recipes();

    const updatedRecipe = {
      title: title,
      ingredients: ingredients,
      cookingSkillRequired: cookingSkillRequired,
      steps: steps,
    };
    const updatedInfo = await recipeCollection.updateOne(
      { _id: ObjectId(id) },
      { $set: updatedRecipe }
    );
    if (updatedInfo.modifiedCount === 0) {
      throw "Couldn't update recipe successfully";
    }

    return await this.get(id);
  },
};
