const mongoose = require("mongoose");

const questionSchema = new mongoose.Schema({
  questionText: {
    type: String,
    required: true,
    trim: true,
  },
  options: [
    {
      type: String,
      required: true,
      trim: true,
    },
  ],
  correctAnswerIndex: {
    type: Number,
    required: true,
    min: 0,
    max: 3,
  },
  timeLimit: {
    type: Number,
    default: 30, // seconds
    min: 5,
    max: 120,
  },
  category: {
    type: String,
    default: "General",
    trim: true,
  },
  difficulty: {
    type: String,
    enum: ["easy", "medium", "hard"],
    default: "medium",
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Validate that options array has exactly 4 elements
questionSchema.path("options").validate(function (value) {
  return value.length === 4;
}, "Question must have exactly 4 options");

module.exports = mongoose.model("Question", questionSchema);
