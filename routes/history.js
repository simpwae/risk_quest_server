const express = require("express");
const router = express.Router();
const GameSession = require("../models/GameSession");
const requireAdmin = require("../middleware/requireAdmin");

// Get all completed games
router.get("/", requireAdmin, async (req, res) => {
  try {
    const games = await GameSession.find({ status: "completed" })
      .sort({ completedAt: -1 })
      .limit(50)
      .populate("players", "nickname totalScore correctAnswers");

    res.json({ success: true, games });
  } catch (error) {
    console.error("Get history error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// Get game by ID
router.get("/:id", requireAdmin, async (req, res) => {
  try {
    const game = await GameSession.findById(req.params.id)
      .populate("questions")
      .populate("players");

    if (!game) {
      return res
        .status(404)
        .json({ success: false, message: "Game not found" });
    }

    res.json({ success: true, game });
  } catch (error) {
    console.error("Get game error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// Get stats
router.get("/stats", requireAdmin, async (req, res) => {
  try {
    const totalGames = await GameSession.countDocuments({
      status: "completed",
    });

    const stats = await GameSession.aggregate([
      { $match: { status: "completed" } },
      {
        $group: {
          _id: null,
          totalPlayers: { $sum: { $size: "$players" } },
          totalQuestions: { $sum: { $size: "$questions" } },
          averagePlayersPerGame: { $avg: { $size: "$players" } },
        },
      },
    ]);

    // Get average score across all players
    const playerStats = await GameSession.aggregate([
      { $match: { status: "completed" } },
      { $unwind: "$leaderboard" },
      {
        $group: {
          _id: null,
          averageScore: { $avg: "$leaderboard.score" },
        },
      },
    ]);

    res.json({
      success: true,
      stats: {
        totalGames,
        totalPlayers: stats[0]?.totalPlayers || 0,
        totalQuestions: stats[0]?.totalQuestions || 0,
        averagePlayersPerGame: stats[0]?.averagePlayersPerGame || 0,
        averageScore: playerStats[0]?.averageScore || 0,
      },
    });
  } catch (error) {
    console.error("Get stats error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// Export game data
router.get("/:id/export", requireAdmin, async (req, res) => {
  try {
    const game = await GameSession.findById(req.params.id)
      .populate("questions")
      .populate("players");

    if (!game) {
      return res
        .status(404)
        .json({ success: false, message: "Game not found" });
    }

    const exportData = {
      code: game.code,
      status: game.status,
      createdAt: game.createdAt,
      startedAt: game.startedAt,
      completedAt: game.completedAt,
      questions: game.questions.map((q) => ({
        text: q.questionText,
        category: q.category,
        difficulty: q.difficulty,
      })),
      leaderboard: game.leaderboard,
      winner: game.winner,
    };

    res.json(exportData);
  } catch (error) {
    console.error("Export game error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

module.exports = router;
