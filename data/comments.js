const mongoCollection = require("../config/mongoCollections");
const recipeCollection = mongoCollection.recipes;
const recipes = require("./recipes");
const ObjectId = require("mongodb").ObjectId;

module.exports = {
  async createComment(recipeId, comment) {
    if (arguments.length !== 2) throw "All fields needed";
    if (!recipeId || !comment) throw "You must provide all inputs";
    if (typeof recipeId !== "string" || typeof comment !== "string")
      throw "recipeId and comment should be string";
    if (recipeId.match(/^[ ]*$/) || comment.match(/^[ ]*$/))
      throw "id or comment with just spaces is not valid";
    recipeId = recipeId.trim();
    if (!ObjectId.isValid(recipeId)) throw "Invalid recipeId";

    const recipeComment = await recipes.get(recipeId);
    if (recipeComment.length === 0) throw "error recipeId";

    const commentId = new ObjectId();

    const newComment = {
      _id: commentId,
      userThatPostedComment: {},
      comment: comment,
    };
    let recipeInfo = await recipes.get(recipeId);
    recipeInfo.comments.push(newComment);

    const recipe = await recipeCollection();

    const updatedInfo = await recipe.updateOne(
      { _id: ObjectId(recipeId) },
      {
        $set: {
          comments: recipeInfo.comments,
        },
      }
    );
    if (updatedInfo.modifiedCount === 0)
      throw "Couldn't update comments successfully";

    let recipeList = await recipes.get(recipeId);
    for (let comment of recipeList.comments) {
      comment._id = comment._id.toString();
    }
    return recipeList;
  },

  async get(commentId) {
    if (arguments.length !== 1) throw "error";
    if (!commentId) throw "lack commentId";
    if (typeof commentId !== "string") throw "commentId is not string";
    if (commentId.trim().length === 0) throw "invalid commentId";
    if (!ObjectId.isValid(commentId)) throw "invalid commentId";
    if (typeof commentId === "object") commentId = commentId.toString();

    const recipe = await recipeCollection();
    const comment = await recipe
      .find({ _id: { $eq: ObjectId(commentId) } })
      .toArray();

    if (comment === null) throw "comment not found";
    return comment;
  },

  async removeComment(commentId) {
    if (arguments.length !== 1) throw "error";
    if (!commentId) throw "lack commentId";
    if (typeof commentId !== "string") throw "commentId is not string";
    if (commentId.trim().length === 0) throw "invalid commentId";
    if (!ObjectId.isValid(commentId)) throw "invalid commentId";
    if (typeof commentId === "object") commentId = commentId.toString();

    const recipe = await recipeCollection();
    const com = await recipe.findOne({
      _id: { $eq: ObjectId(commentId) },
    });
    if (com == null) throw "error commentId";
    const recipeid = com._id;
    const result = await recipe.updateOne(
      { _id: recipeid },
      { $pull: { comments: { _id: ObjectId(commentId) } } }
    );

    if (result.modifiedCount === 0)
      throw "Could not remove comment successfully";

    return await recipes.get(recipeid);
  },
};
