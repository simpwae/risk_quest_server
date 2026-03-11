const express = require("express");
const router = express.Router();
const GameSession = require("../models/GameSession");
const Question = require("../models/Question");
const requireAdmin = require("../middleware/requireAdmin");

// Create new game
router.post("/create", requireAdmin, async (req, res) => {
  try {
    const { questionIds } = req.body;

    if (
      !questionIds ||
      !Array.isArray(questionIds) ||
      questionIds.length === 0
    ) {
      return res.status(400).json({
        success: false,
        message: "At least one question is required",
      });
    }

    // Verify all questions exist
    const questions = await Question.find({ _id: { $in: questionIds } });
    if (questions.length !== questionIds.length) {
      return res.status(400).json({
        success: false,
        message: "Some questions were not found",
      });
    }

    const code = await GameSession.generateCode();

    const gameSession = new GameSession({
      code,
      questions: questionIds,
      status: "waiting",
    });

    await gameSession.save();
    await gameSession.populate("questions");

    res.status(201).json({
      success: true,
      gameSession: {
        _id: gameSession._id,
        code: gameSession.code,
        status: gameSession.status,
        questions: gameSession.questions,
        players: [],
      },
    });
  } catch (error) {
    console.error("Create game error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// Get game status
router.get("/:code/status", async (req, res) => {
  try {
    const gameSession = await GameSession.findOne({
      code: req.params.code.toUpperCase(),
    }).populate("players");

    if (!gameSession) {
      return res
        .status(404)
        .json({ success: false, message: "Game not found" });
    }

    res.json({
      success: true,
      gameSession: {
        _id: gameSession._id,
        code: gameSession.code,
        status: gameSession.status,
        playerCount: gameSession.players.length,
        questionCount: gameSession.questions.length,
      },
    });
  } catch (error) {
    console.error("Get game status error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// Join game (HTTP endpoint for validation)
router.post("/join", async (req, res) => {
  try {
    const { gameCode, nickname } = req.body;

    if (!gameCode || !nickname) {
      return res.status(400).json({
        success: false,
        message: "Game code and nickname are required",
      });
    }

    const gameSession = await GameSession.findOne({
      code: gameCode.toUpperCase(),
    }).populate("players");

    if (!gameSession) {
      return res
        .status(404)
        .json({ success: false, message: "Game not found" });
    }

    if (gameSession.status !== "waiting") {
      return res.status(400).json({
        success: false,
        message: "Game has already started",
      });
    }

    if (gameSession.players.length >= 10) {
      return res.status(400).json({
        success: false,
        message: "Game is full (max 10 players)",
      });
    }

    // Check for duplicate nickname
    const existingNickname = gameSession.players.find(
      (p) => p.nickname.toLowerCase() === nickname.toLowerCase(),
    );
    if (existingNickname) {
      return res.status(400).json({
        success: false,
        message: "Nickname already taken in this game",
      });
    }

    res.json({
      success: true,
      message: "Ready to join via socket",
      gameSession: {
        code: gameSession.code,
        status: gameSession.status,
      },
    });
  } catch (error) {
    console.error("Join game error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

module.exports = router;
