const mongoose = require("mongoose");

const answerSchema = new mongoose.Schema({
  questionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Question",
    required: true,
  },
  answerIndex: {
    type: Number,
    required: true,
  },
  isCorrect: {
    type: Boolean,
    required: true,
  },
  responseTimeMs: {
    type: Number,
    required: true,
  },
  pointsEarned: {
    type: Number,
    default: 0,
  },
});

const playerSchema = new mongoose.Schema({
  socketId: {
    type: String,
    required: true,
  },
  nickname: {
    type: String,
    required: true,
    trim: true,
    minlength: 2,
    maxlength: 20,
  },
  gameSession: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "GameSession",
    required: true,
  },
  answers: [answerSchema],
  totalScore: {
    type: Number,
    default: 0,
  },
  correctAnswers: {
    type: Number,
    default: 0,
  },
  averageResponseTime: {
    type: Number,
    default: 0,
  },
  joinedAt: {
    type: Date,
    default: Date.now,
  },
});

// Update stats after each answer
playerSchema.methods.updateStats = function () {
  const validAnswers = this.answers.filter((a) => a.responseTimeMs > 0);

  this.totalScore = this.answers.reduce((sum, a) => sum + a.pointsEarned, 0);
  this.correctAnswers = this.answers.filter((a) => a.isCorrect).length;

  if (validAnswers.length > 0) {
    this.averageResponseTime =
      validAnswers.reduce((sum, a) => sum + a.responseTimeMs, 0) /
      validAnswers.length;
  }
};

module.exports = mongoose.model("Player", playerSchema);
