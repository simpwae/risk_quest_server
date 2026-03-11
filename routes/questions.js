const express = require("express");
const router = express.Router();
const Question = require("../models/Question");
const requireAdmin = require("../middleware/requireAdmin");

// Get all questions
router.get("/", requireAdmin, async (req, res) => {
  try {
    const questions = await Question.find().sort({ createdAt: -1 });
    res.json({ success: true, questions });
  } catch (error) {
    console.error("Get questions error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// Get single question
router.get("/:id", requireAdmin, async (req, res) => {
  try {
    const question = await Question.findById(req.params.id);
    if (!question) {
      return res
        .status(404)
        .json({ success: false, message: "Question not found" });
    }
    res.json({ success: true, question });
  } catch (error) {
    console.error("Get question error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// Get random questions
router.get("/random/:count", requireAdmin, async (req, res) => {
  try {
    const count = parseInt(req.params.count) || 10;
    const questions = await Question.aggregate([{ $sample: { size: count } }]);
    res.json({ success: true, questions });
  } catch (error) {
    console.error("Get random questions error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// Create question
router.post("/", requireAdmin, async (req, res) => {
  try {
    const {
      questionText,
      options,
      correctAnswerIndex,
      timeLimit,
      category,
      difficulty,
    } = req.body;

    if (!questionText || !options || correctAnswerIndex === undefined) {
      return res.status(400).json({
        success: false,
        message: "Question text, options, and correct answer are required",
      });
    }

    if (!Array.isArray(options) || options.length !== 4) {
      return res.status(400).json({
        success: false,
        message: "Exactly 4 options are required",
      });
    }

    if (correctAnswerIndex < 0 || correctAnswerIndex > 3) {
      return res.status(400).json({
        success: false,
        message: "Correct answer index must be 0-3",
      });
    }

    const question = new Question({
      questionText,
      options,
      correctAnswerIndex,
      timeLimit: timeLimit || 30,
      category: category || "General",
      difficulty: difficulty || "medium",
    });

    await question.save();
    res.status(201).json({ success: true, question });
  } catch (error) {
    console.error("Create question error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// Bulk create questions (for file import)
router.post("/bulk", requireAdmin, async (req, res) => {
  try {
    const { questions } = req.body;

    if (!questions || !Array.isArray(questions) || questions.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Questions array is required",
      });
    }

    // Validate and prepare questions
    const validQuestions = [];
    const errors = [];

    questions.forEach((q, index) => {
      const questionErrors = [];

      if (!q.questionText || typeof q.questionText !== "string") {
        questionErrors.push("Missing or invalid questionText");
      }
      if (
        !q.options ||
        !Array.isArray(q.options) ||
        q.options.length < 2 ||
        q.options.length > 6
      ) {
        questionErrors.push("Options must be an array with 2-6 items");
      }
      if (
        typeof q.correctAnswerIndex !== "number" ||
        q.correctAnswerIndex < 0
      ) {
        questionErrors.push("correctAnswerIndex must be a non-negative number");
      }
      if (q.options && q.correctAnswerIndex >= q.options.length) {
        questionErrors.push("correctAnswerIndex is out of range");
      }

      if (questionErrors.length > 0) {
        errors.push({ index, errors: questionErrors });
      } else {
        // Pad options to 4 if less, or take first 4 if more
        let options = q.options;
        while (options.length < 4) {
          options.push("");
        }
        if (options.length > 4) {
          options = options.slice(0, 4);
        }

        validQuestions.push({
          questionText: q.questionText.trim(),
          options: options.map((o) => String(o).trim()),
          correctAnswerIndex: Math.min(q.correctAnswerIndex, 3),
          timeLimit: Math.min(Math.max(q.timeLimit || 30, 5), 120),
          category: q.category || "General",
          difficulty: ["easy", "medium", "hard"].includes(q.difficulty)
            ? q.difficulty
            : "medium",
        });
      }
    });

    if (validQuestions.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No valid questions to import",
        errors,
      });
    }

    // Insert all valid questions
    const inserted = await Question.insertMany(validQuestions);

    res.status(201).json({
      success: true,
      imported: inserted.length,
      total: questions.length,
      skipped: errors.length,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error) {
    console.error("Bulk create questions error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// Update question
router.put("/:id", requireAdmin, async (req, res) => {
  try {
    const {
      questionText,
      options,
      correctAnswerIndex,
      timeLimit,
      category,
      difficulty,
    } = req.body;

    const question = await Question.findById(req.params.id);
    if (!question) {
      return res
        .status(404)
        .json({ success: false, message: "Question not found" });
    }

    if (questionText) question.questionText = questionText;
    if (options && Array.isArray(options) && options.length === 4) {
      question.options = options;
    }
    if (correctAnswerIndex !== undefined)
      question.correctAnswerIndex = correctAnswerIndex;
    if (timeLimit) question.timeLimit = timeLimit;
    if (category) question.category = category;
    if (difficulty) question.difficulty = difficulty;

    await question.save();
    res.json({ success: true, question });
  } catch (error) {
    console.error("Update question error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// Delete question
router.delete("/:id", requireAdmin, async (req, res) => {
  try {
    const question = await Question.findByIdAndDelete(req.params.id);
    if (!question) {
      return res
        .status(404)
        .json({ success: false, message: "Question not found" });
    }
    res.json({ success: true, message: "Question deleted" });
  } catch (error) {
    console.error("Delete question error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

module.exports = router;
