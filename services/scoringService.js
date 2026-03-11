/**
 * Scoring Service
 *
 * Score calculation based on response time:
 * Points = BasePoints × (1 - responseTimeMs / timeLimitMs)
 *
 * Faster answers = more points
 * Base points for correct answer: 1000
 */

const BASE_POINTS = 1000;

/**
 * Calculate points for an answer
 * @param {boolean} isCorrect - Whether the answer is correct
 * @param {number} responseTimeMs - Response time in milliseconds
 * @param {number} timeLimitMs - Time limit in milliseconds
 * @returns {number} Points earned
 */
function calculatePoints(isCorrect, responseTimeMs, timeLimitMs) {
  if (!isCorrect) return 0;

  // Ensure response time doesn't exceed time limit
  const clampedResponseTime = Math.min(responseTimeMs, timeLimitMs);

  // Calculate time bonus (faster = more points)
  const timeRatio = 1 - clampedResponseTime / timeLimitMs;

  // Calculate final points (minimum 100 for correct answer)
  const points = Math.round(BASE_POINTS * timeRatio);

  return Math.max(points, 100); // Minimum 100 points for correct answer
}

/**
 * Rank players based on scoring criteria
 * Priority: 1. Total Score, 2. Correct Answers, 3. Average Response Time
 * @param {Array} players - Array of player objects
 * @returns {Array} Sorted array of players with rank
 */
function rankPlayers(players) {
  const ranked = [...players].sort((a, b) => {
    // Primary: Total score (descending)
    if (b.totalScore !== a.totalScore) {
      return b.totalScore - a.totalScore;
    }

    // Secondary: Correct answers (descending)
    if (b.correctAnswers !== a.correctAnswers) {
      return b.correctAnswers - a.correctAnswers;
    }

    // Tertiary: Average response time (ascending - faster is better)
    return a.averageResponseTime - b.averageResponseTime;
  });

  // Assign ranks
  return ranked.map((player, index) => ({
    ...player,
    rank: index + 1,
  }));
}

/**
 * Create leaderboard entry from player data
 * @param {Object} player - Player document
 * @param {number} totalQuestions - Total questions in game
 * @returns {Object} Leaderboard entry
 */
function createLeaderboardEntry(player, totalQuestions) {
  return {
    playerId: player._id,
    nickname: player.nickname,
    score: player.totalScore,
    correctAnswers: player.correctAnswers,
    totalQuestions,
    averageResponseTime: player.averageResponseTime,
  };
}

module.exports = {
  calculatePoints,
  rankPlayers,
  createLeaderboardEntry,
  BASE_POINTS,
};
