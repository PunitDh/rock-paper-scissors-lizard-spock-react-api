const express = require("express");
const PlayerService = require("../service/PlayerService");
const secured = require("../middleware/secured");
const ConversationService = require("../service/ConversationService");
const router = express.Router();

router.post("/register", async (req, res) => {
  const player = await PlayerService.registerPlayer(req.body);
  return res.status(player.status).send(player);
});

router.post("/login", async (req, res) => {
  const response = await PlayerService.loginPlayer(req.body);
  return res.status(response.status).send(response);
});

router.get("/games", secured(), async (req, res) => {
  const games = await PlayerService.getCurrentGames({
    _jwt: req.headers.authorization,
  });
  return res.status(games.status).send(games);
});

router.get("/chats", secured(), async (req, res) => {
  const chats = await ConversationService.getConversations(
    req.headers.authorization
  );
  return res.status(chats.status).send(chats);
});

router.get("/players", secured(), async (req, res) => {
  const games = await PlayerService.getOnlineUsers({
    _jwt: req.headers.authorization,
  });
  const io = req.app.get("io");
  io.emit("users-changed");
  return res.status(games.status).send(games);
});

router.put("/", secured(), async (req, res) => {
  const player = await PlayerService.updateProfile({
    _jwt: req.headers.authorization,
    ...req.body,
  });
  return res.status(player.status).send(player);
});

router.delete("/", secured(), async (req, res) => {
  const player = await PlayerService.deleteProfile({
    password: req.body.password,
    _jwt: req.headers.authorization,
  });
  return res.status(player.status).send(player);
});

module.exports = router;
