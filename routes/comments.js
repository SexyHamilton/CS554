const express = require("express");
const router = express.Router();
const ObjectId = require("mongodb").ObjectId;
const recipeData = require("../data/recipes");
const commentData = require("../data/comments");
const mongoCollection = require("../config/mongoCollections");
const recipes = mongoCollection.recipes;

// post: :id/comments
router.post("/:id/comments", async (req, res) => {
  let recipeId = req.params.id; //it's a string
  let commentInfo = req.body; // (id, userThatPostComment), comment

  if (!recipeId) {
    res.status(400).json({ error: "You must provide a recipeId" });
    return;
  }
  if (typeof recipeId !== "string" || !ObjectId.isValid(recipeId)) {
    res.status(400).json({ error: "You must provide a valid recipeId" });
    return;
  }

  if (!commentInfo.comment) {
    res
      .status(400)
      .json({ error: "You must provide all fields in request body" });
    return;
  }

  if (typeof commentInfo.comment !== "string") {
    res.status(400).json({ error: "comment in request body should be string" });
    return;
  }
  if (recipeId.match(/^[ ]*$/)) {
    res.status(400).json({ error: "recipeId with just spaces is not valid" });
    return;
  }

  try {
    const recipeInfo = await recipeData.get(recipeId);
  } catch (e) {
    res.status(400).json({ error: "recipeId not found" });
    return;
  }

  if (req.session.logged == true) {
    try {
      let newComment = await commentData.createComment(
        recipeId,
        commentInfo.comment
      );
      newComment.userThatPostedComment = {
        _id: req.session.id,
        username: req.session.user,
      };
      const recipeCollection = await recipes();
      const updatedInfo = await recipeCollection.updateOne(
        { _id: ObjectId(newComment._id.toString()) },
        {
          $set: {
            userThatPostedComment: newComment.userThatPostedComment,
          },
        }
      );
      if (updatedInfo.modifiedCount === 0) {
        res
          .status(400)
          .json({ error: "Could not update userThatPostedComment" });
        return;
      }
      let commentList = await commentData.get(newComment._id);
      console.log(req.body + " " + req.method + " " + req.originalUrl);
      res.status(200).json(commentList);
    } catch (e) {
      console.log(req.body + " " + req.method + " " + req.originalUrl);
      res.status(500).json({ error: "Could not create comment successfully" });
    }
  } else {
    console.log(req.body + " " + req.method + " " + req.originalUrl);
    res.status(400).json({ error: "No user logged in" });
    return;
  }
});

//delete: :recipeId/:commentId
router.delete("/:recipeId/:commentId", async (req, res) => {
  const commentId = req.params.commentId;
  const recipeId = req.params.recipeId;
  if (!commentId || !recipeId) {
    res
      .status(400)
      .json({ error: "You must provide a commentId and a recipeId" });
    return;
  }

  if (typeof recipeId !== "string" || !ObjectId.isValid(recipeId)) {
    res.status(400).json({ error: "You must provide a valid recipeId" });
    return;
  }
  if (typeof commentId !== "string" || !ObjectId.isValid(commentId)) {
    res.status(400).json({ error: "You must provide a valid commentId" });
    return;
  }

  try {
    await recipeData.get(recipeId);
  } catch (e) {
    res.status(404).json({ error: "error recipeId" });
    return;
  }
  try {
    await commentData.get(commentId);
  } catch (e) {
    res.status(404).json({ error: "error commentId" });
    return;
  }
  const comment = await commentData.get(commentId);
  if (
    req.session.logged == true &&
    req.session.user === comment.userThatPostedComment.username
  ) {
    try {
      const removeInfo = await commentData.removeComment(commentId);
      const result = await recipeData.get(recipeId); // recipe after deleting comment
      console.log(req.body + " " + req.method + " " + req.originalUrl);
      res.status(200).json(result);
    } catch (e) {
      console.log(req.body + " " + req.method + " " + req.originalUrl);
      res.status(500).json({ error: e });
    }
  } else {
    console.log(req.body + " " + req.method + " " + req.originalUrl);
    res.status(400).json({
      error: "Not logged in or you are not the original poster of the comment",
    });
    return;
  }
});

module.exports = router;
