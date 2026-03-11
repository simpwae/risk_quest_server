const GameSession = require("../models/GameSession");
const Player = require("../models/Player");
const Question = require("../models/Question");
const { calculatePoints } = require("./scoringService");

// Store active game rooms
const gameRooms = new Map();

function initializeSocketHandlers(io) {
  io.on("connection", (socket) => {
    console.log("Client connected:", socket.id);

    // Player joins a game
    socket.on("player:join-game", async ({ gameCode, nickname }) => {
      try {
        const game = await GameSession.findOne({
          code: gameCode.toUpperCase(),
        }).populate("players");

        if (!game) {
          socket.emit("error", "Game not found");
          return;
        }

        if (game.status !== "waiting") {
          socket.emit("error", "Game has already started");
          return;
        }

        if (game.players.length >= 10) {
          socket.emit("error", "Game is full");
          return;
        }

        // Check duplicate nickname
        const existingNickname = game.players.find(
          (p) => p.nickname.toLowerCase() === nickname.toLowerCase(),
        );
        if (existingNickname) {
          socket.emit("error", "Nickname already taken");
          return;
        }

        // Create player
        const player = new Player({
          socketId: socket.id,
          nickname,
          gameSession: game._id,
        });
        await player.save();

        // Add player to game
        game.players.push(player._id);
        await game.save();

        // Join socket room
        socket.join(gameCode.toUpperCase());
        socket.gameCode = gameCode.toUpperCase();
        socket.playerId = player._id;

        // Get updated player list
        const updatedGame = await GameSession.findById(game._id).populate(
          "players",
        );
        const playerList = updatedGame.players.map((p) => ({
          _id: p._id,
          nickname: p.nickname,
        }));

        // Emit to player
        socket.emit("player:joined", {
          player: { _id: player._id, nickname: player.nickname },
          gameSession: { code: game.code, status: game.status },
          players: playerList,
        });

        // Emit updated player list to room
        io.to(gameCode.toUpperCase()).emit("players:updated", playerList);
      } catch (error) {
        console.error("Join game error:", error);
        socket.emit("error", "Failed to join game");
      }
    });

    // Admin joins game room
    socket.on("admin:join-game", ({ gameCode }) => {
      socket.join(gameCode.toUpperCase());
      socket.gameCode = gameCode.toUpperCase();
      socket.isAdmin = true;
    });

    // Admin starts game
    socket.on("admin:start-game", async ({ gameCode }) => {
      try {
        const game = await GameSession.findOne({
          code: gameCode.toUpperCase(),
        }).populate("questions");

        if (!game) {
          socket.emit("error", "Game not found");
          return;
        }

        game.status = "active";
        game.startedAt = new Date();
        game.currentQuestionIndex = 0;
        await game.save();

        // Emit game started
        io.to(gameCode.toUpperCase()).emit("game:started", {
          totalQuestions: game.questions.length,
        });

        // Send first question
        const question = game.questions[0];
        io.to(gameCode.toUpperCase()).emit("question:new", {
          question: {
            _id: question._id,
            questionText: question.questionText,
            options: question.options,
            timeLimit: question.timeLimit,
            category: question.category,
          },
          questionNumber: 1,
          totalQuestions: game.questions.length,
        });
      } catch (error) {
        console.error("Start game error:", error);
        socket.emit("error", "Failed to start game");
      }
    });

    // Player submits answer
    socket.on(
      "player:submit-answer",
      async ({ questionId, answerIndex, responseTimeMs }) => {
        try {
          const player = await Player.findById(socket.playerId);
          if (!player) return;

          const game = await GameSession.findById(player.gameSession).populate(
            "questions",
          );
          if (!game) return;

          const question = game.questions.find(
            (q) => q._id.toString() === questionId,
          );
          if (!question) return;

          const isCorrect = answerIndex === question.correctAnswerIndex;
          const timeLimitMs = question.timeLimit * 1000;
          const pointsEarned = calculatePoints(
            isCorrect,
            responseTimeMs,
            timeLimitMs,
          );

          // Save answer
          player.answers.push({
            questionId,
            answerIndex,
            isCorrect,
            responseTimeMs,
            pointsEarned,
          });
          player.updateStats();
          await player.save();

          // Emit result to player
          socket.emit("answer:result", {
            isCorrect,
            correctAnswerIndex: question.correctAnswerIndex,
            pointsEarned,
            responseTime: responseTimeMs,
          });
        } catch (error) {
          console.error("Submit answer error:", error);
        }
      },
    );

    // Admin sends next question
    socket.on("admin:next-question", async ({ gameCode }) => {
      try {
        const game = await GameSession.findOne({
          code: gameCode.toUpperCase(),
        }).populate("questions");

        if (!game) return;

        game.currentQuestionIndex++;
        await game.save();

        if (game.currentQuestionIndex >= game.questions.length) {
          // Game over
          await endGame(io, game);
          return;
        }

        const question = game.questions[game.currentQuestionIndex];
        io.to(gameCode.toUpperCase()).emit("question:new", {
          question: {
            _id: question._id,
            questionText: question.questionText,
            options: question.options,
            timeLimit: question.timeLimit,
            category: question.category,
          },
          questionNumber: game.currentQuestionIndex + 1,
          totalQuestions: game.questions.length,
        });
      } catch (error) {
        console.error("Next question error:", error);
      }
    });

    // Admin ends game
    socket.on("admin:end-game", async ({ gameCode }) => {
      try {
        const game = await GameSession.findOne({
          code: gameCode.toUpperCase(),
        });
        if (game) {
          await endGame(io, game);
        }
      } catch (error) {
        console.error("End game error:", error);
      }
    });

    // Player leaves game
    socket.on("player:leave-game", async () => {
      await handlePlayerDisconnect(socket, io);
    });

    // Socket disconnect
    socket.on("disconnect", async () => {
      console.log("Client disconnected:", socket.id);
      await handlePlayerDisconnect(socket, io);
    });
  });
}

async function handlePlayerDisconnect(socket, io) {
  if (socket.playerId && socket.gameCode) {
    try {
      const player = await Player.findById(socket.playerId);
      if (player) {
        const game = await GameSession.findById(player.gameSession);
        if (game && game.status === "waiting") {
          // Remove player from game if still waiting
          game.players = game.players.filter(
            (p) => p.toString() !== socket.playerId.toString(),
          );
          await game.save();
          await Player.findByIdAndDelete(socket.playerId);

          // Update player list
          const updatedGame = await GameSession.findById(game._id).populate(
            "players",
          );
          const playerList = updatedGame.players.map((p) => ({
            _id: p._id,
            nickname: p.nickname,
          }));
          io.to(socket.gameCode).emit("players:updated", playerList);
        }
      }
    } catch (error) {
      console.error("Handle disconnect error:", error);
    }
  }
}

async function endGame(io, game) {
  game.status = "completed";
  game.completedAt = new Date();

  await game.calculateLeaderboard();
  await game.save();

  io.to(game.code).emit("game:ended", {
    leaderboard: game.leaderboard,
    winner: game.winner,
  });
}

module.exports = { initializeSocketHandlers };
