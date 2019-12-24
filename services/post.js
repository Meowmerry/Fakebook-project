const passport = require("passport");
const Sequelize = require("sequelize");
const Op = Sequelize.Op;

module.exports = (app, db) => {
  app.post(
    "/create-post",
    passport.authenticate("jwt", { session: false }),
    async function(req, res) {
      try {
        let targetPost = await db.post.create({
          message: req.body.message,
          image_url: req.body.image_url,
          user_id: req.user.id // รับมาจาก Token
        });
        res.status(201).send(targetPost);
      } catch (err) {
        res.status(400).send({ message: "Something went wrong" });
      }
    }
  );

  app.put(
    "/update-post/:id",
    passport.authenticate("jwt", { session: false }),
    async function async(req, res) {
      // Lab 2
      let targetPost = await db.post.findOne({
        where: {
          id: req.params.id,
          user_id: req.user.id
        }
      });
      if (!targetPost) {
        res.status(404).send({ message: "Post not found or Unauthorize" });
      } else {
        targetPost.update({
          message: req.body.message,
          image_url: req.body.image_url
        });
        res.status(200).send({
          message: `Post id: ${req.params.id} has been updated`
        });
      }
    }
  );

  app.delete(
    "/delete-post/:id",
    passport.authenticate("jwt", { session: false }),
    async function(req, res) {
      // Lab 3
      let targetDelete = await db.post.findOne({
        where: { id: req.params.id, user_id: req.user.id }
      });
      if (!targetDelete) {
        res.status(404).send({
          message: `Post id ${req.params.id} not found or Unauthorize`
        });
      } else {
        targetDelete.destroy();
        res
          .status(200)
          .send({ message: `Post id ${req.params.id} has been deleted` });
      }
    }
  );

  app.get(
    "/my-posts",
    passport.authenticate("jwt", { session: false }),
    async function(req, res) {
      // Lab 4
      try {
        let targetPost = await db.post.findAll(
          {
            where: { user_id: req.user.id },
            include: [
              { model: db.user, attributes: ["id", "name", "profile_img_url"] }
            ]
          },
          {
            model: db.comment,
            include: [
              {
                model: db.user,
                attributes: ["id", "name", "profile_img_url"]
              }
            ]
          }
        );
        res.status(201).send(targetPost);
      } catch (e) {
        res.status(400).send({ message: "something error" });
      }
    }
  );

  app.get(
    "/feed",
    passport.authenticate("jwt", { session: false }),
    async function(req, res) {
      // Lab 5
      const requestFromIds = await db.friend.findAll({
        where: { status: "friend", request_to_id: req.user.id },
        attributes: [["request_from_id", "id"]]
      });
      const requestToIds = await db.friend.findAll({
        where: { status: "friend", request_from_id: req.user.id },
        attributes: [["request_to_id", "id"]]
      });
      const requestFromIdsArr = requestFromIds.map(request => request.id);
      const requestToIdsArr = requestToIds.map(request => request.id);
      const allIds = requestFromIdsArr
        .concat(requestToIdsArr)
        .concat([req.user.id]);
      const allFeedPost = await db.post.findAll({
        where: {
          user_id: { [Op.in]: allIds }
        },
        include: [
          {
            model: db.user,
            attributes: ["id", "name", "profile_img_url"]
          },
          {
            model: db.comment,
            include: [
              { model: db.user, attributes: ["id", "name", "profile_img_url"] }
            ]
          }
        ]
      });
      res.status(200).send(allFeedPost);
    }
  );
};
