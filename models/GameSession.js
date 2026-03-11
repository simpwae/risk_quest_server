const mongoose = require("mongoose");

const leaderboardEntrySchema = new mongoose.Schema({
  playerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Player",
  },
  nickname: String,
  score: Number,
  correctAnswers: Number,
  totalQuestions: Number,
  averageResponseTime: Number,
  rank: Number,
});

const gameSessionSchema = new mongoose.Schema({
  code: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    length: 6,
  },
  status: {
    type: String,
    enum: ["waiting", "active", "completed"],
    default: "waiting",
  },
  questions: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Question",
    },
  ],
  currentQuestionIndex: {
    type: Number,
    default: -1,
  },
  players: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Player",
    },
  ],
  leaderboard: [leaderboardEntrySchema],
  winner: {
    playerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Player",
    },
    nickname: String,
    score: Number,
  },
  startedAt: Date,
  completedAt: Date,
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Generate unique game code
gameSessionSchema.statics.generateCode = async function () {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code;
  let isUnique = false;

  while (!isUnique) {
    code = "";
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    const existing = await this.findOne({ code });
    if (!existing) isUnique = true;
  }

  return code;
};

// Calculate and update leaderboard
gameSessionSchema.methods.calculateLeaderboard = async function () {
  await this.populate("players");

  const leaderboard = this.players.map((player) => ({
    playerId: player._id,
    nickname: player.nickname,
    score: player.totalScore,
    correctAnswers: player.correctAnswers,
    totalQuestions: this.questions.length,
    averageResponseTime: player.averageResponseTime,
  }));

  // Sort by score (desc), then by correct answers (desc), then by avg response time (asc)
  leaderboard.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    if (b.correctAnswers !== a.correctAnswers)
      return b.correctAnswers - a.correctAnswers;
    return a.averageResponseTime - b.averageResponseTime;
  });

  // Assign ranks
  leaderboard.forEach((entry, index) => {
    entry.rank = index + 1;
  });

  this.leaderboard = leaderboard;

  if (leaderboard.length > 0) {
    this.winner = {
      playerId: leaderboard[0].playerId,
      nickname: leaderboard[0].nickname,
      score: leaderboard[0].score,
    };
  }

  return leaderboard;
};

module.exports = mongoose.model("GameSession", gameSessionSchema);
