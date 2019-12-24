const passport = require("passport");
const Sequelize = require("sequelize");
const Op = Sequelize.Op;
module.exports = (app, db) => {
  app.get(
    "/friend-request-to/:id",
    passport.authenticate("jwt", { session: false }),
    function(req, res) {
      // Lab 1
      db.friend
        .create({
          request_to_id: req.params.id,
          request_from_id: req.user.id,
          status: "request"
        })
        .then(result => {
          res
            .status(201)
            .send({ message: `Sends request friend id: ${req.params.id}` });
        })
        .catch(err => {
          res.status(401).send({ message: err.message });
        });
    }
  );

  app.get(
    "/request-list",
    passport.authenticate("jwt", { session: false }),
    async function(req, res) {
      // Lab 2
      const requestList = await db.friend.findAll({
        where: { request_to_id: req.user.id, status: "request" },
        attributes: [["request_from_id", "id"]]
      });
      // console.log(requestList.dataValues)
      const requestListIds = requestList.map(request => request.id);
      const requestUser = await db.user.findAll({
        where: { id: { [Op.in]: requestListIds } },
        attributes: ["id", "name", "profile_img_url"]
      });
      res.send(requestUser);
    }
  );

  app.patch(
    "/accept-friend-request/:id",
    passport.authenticate("jwt", { session: false }),
    async function(req, res) {
      // Lab 3
      try {
        const targetFriend = await db.friend.findOne({
          where: {
            request_from_id: req.params.id,
            request_to_id: req.user.id,
            status: "request"
          }
        });
        if (targetFriend !== null) {
          await targetFriend.update({ status: "friend" });
          res.status(200).json({ message: "You accept friend" });
        } else {
          res.status(404).json({ errorMessage: "Friend request not found" });
        }
      } catch (ex) {
        console.error(ex) / res.status(404).json({ errorMessage: "ex" });
      }
    }
  );

  app.get(
    "/deny-friend-request/:id",
    passport.authenticate("jwt", { session: false }),
    function(req, res) {
      // Lab 4
      db.friend
        .destroy({
          where: {
            status: "request",
            request_from_id: req.params.id,
            request_to_id: req.user.id
          }
        })
        .then(() => {
          res.status(200).send(`Don't want to be friend with ${req.params.id}`);
        })
        .catch(err => {
          res.status(400).send({ message: err.message });
        });
    }
  );

  app.get(
    "/delete-friend/:id",
    passport.authenticate("jwt", { session: false }),
    async function(req, res) {
      // Lab 5
      let targetFriend = await db.friend.findOne({
        where: {
          [Op.or]: [
            {
              request_from_id: req.user.id,
              request_to_id: req.params.id,
              status: "friend"
            },
            {
              request_from_id: req.params.id,
              request_to_id: req.params.id,
              status: "friend"
            }
          ]
        }
      });
      if (!targetFriend) {
        res
          .status(400)
          .send({ message: `friend id : ${req.params.id} not found` });
      } else {
        targetFriend.destroy();
        res
          .status(200)
          .send({ message: `friend id : ${req.params.id} has been deleted` });
      }
    }
  );

  app.get(
    "/friends-list",
    passport.authenticate("jwt", { session: false }),
    async function(req, res) {
      // Lab 6
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
      const friendUser = await db.user.findAll({
        where: { id: { [Op.in]: requestFromIdsArr.concat(requestToIdsArr) } },
        attributes: ["id", "name", "profile_img_url"]
      });
      res.status(200).send(friendUser);
    }
  );
};
