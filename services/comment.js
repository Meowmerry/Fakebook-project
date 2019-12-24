const passport = require("passport");
const Sequelize = require("sequelize");
const Op = Sequelize.Op;

module.exports = (app, db) => {
  app.post(
    "/create-comment/:post_id",
    passport.authenticate("jwt", { session: false }),
    function(req, res) {
      db.comment
        .create({
          message: req.body.message,
          user_id: req.user.id,
          post_id: req.params.post_id
        })
        .then(result => {
          res.status(201).send("Comment success");
        })
        .catch(err => {
          console.error(err);
          res.status(400).send({ message: err.message });
        });
    }
  );

  app.put(
    "/update-comment/:comment_id",
    passport.authenticate("jwt", { session: false }),
    async function(req, res) {
      let targetComment = await db.comment.findOne({
        where: {
          id: req.params.comment_id,
          user_id: req.user.id
        }
      });
      if (!targetComment) {
        res.status(404).send({ message: 'Comment not found or Unauthorize' });
      } else {
        targetComment.update({
          message: req.body.message
        });
        res.status(200).send({
          message: `Comment id: ${req.params.comment_id} has been updated`
        });
      }
    }
  );

  app.delete(
    "/delete-comment/:id",
    passport.authenticate("jwt", { session: false }),
    async function(req, res) {
      let targetDelete = await db.comment.findOne({
        where: { id: req.params.id, user_id: req.user.id }
      });
      if (!targetDelete) {
        res
          .status(404).send({
            message: `Comment id ${req.params.id} not found or Unauthorize`
          })
      }else{
        targetDelete.destroy();
        res.status(200).send({ message: `Post id ${req.params.id} has been deleted`})
      }
    }
  );
};
