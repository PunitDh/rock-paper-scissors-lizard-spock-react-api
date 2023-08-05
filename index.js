const express = require("express");
const app = express();
const cors = require("cors");
const http = require("http").Server(app);
require("dotenv").config();
const port = process.env.PORT || 3000;
const isProduction = process.env.NODE_ENV === "production";
const SocketMessage = require("./utils/socket-messages");
const mongoose = require("./db");
const playerService = require("./service/PlayerService");
const gameService = require("./service/GameService");
const { Message } = require("./domain/Message");
const { Status } = require("./domain/Response");
const { corsOptions } = require("./utils/constants");
let io;

app.use(cors(corsOptions));

if (isProduction) {
  io = require("socket.io")(http);
  console.log("Web socket server started in production");
} else {
  io = require("socket.io")(port, { cors: corsOptions });
  console.log("Web socket server started locally");
}

mongoose.connectToDB();

io.on(SocketMessage.CONNECTION.request, (socket) => {
  /**
   *
   * @param {String} message
   * @param  {...any} args
   */
  const emitToSocket = (message, ...args) => {
    console.log(message, ...args);
    return io.to(socket.id).emit(message, ...args);
  };

  /**
   *
   * @param {Message} message
   * @param {Function} callback
   */
  const respondTo = function (message, callback) {
    socket.on(message.request, async (arg) => {
      let response;
      response =
        typeof callback === "function" ? await callback(arg, socket) : arg;
      if (response.status === Status.UNAUTHORIZED) {
        return emitToSocket(Status.UNAUTHORIZED, response);
      }
      return emitToSocket(message.response, response);
    });
  };

  console.log("New connection started with socket ID: ", socket.id);

  respondTo(SocketMessage.REGISTER_USER, playerService.registerPlayer);
  respondTo(SocketMessage.LOGIN_USER, playerService.loginPlayer);
  respondTo(SocketMessage.UPDATE_PROFILE, playerService.updateProfile);
  respondTo(SocketMessage.CREATE_GAME, gameService.createGame);
  respondTo(SocketMessage.CURRENT_GAMES, playerService.getCurrentGames);
  respondTo(SocketMessage.CURRENT_USERS, playerService.getOnlineUsers);
  respondTo(SocketMessage.LOAD_GAME, gameService.loadGame);

  socket.on(SocketMessage.PLAY_MOVE.request, async (request) => {
    const response = await gameService.playMove(request);
    socket.join(request.gameId);
    return io
      .to(request.gameId)
      .emit(SocketMessage.PLAY_MOVE.response, response);
  });

  respondTo(SocketMessage.DISCONNECT);
});

isProduction &&
  http.listen(port, () => console.log("Server started on port", port));
