'use strict'

// ─── Central game constants ───────────────────────────────────────────────────
// Change values here and they propagate everywhere in the server.

const BALL_TIMER_MS  = 3000   // Ball countdown in milliseconds (must match client BALL_TIMER_SECONDS)
const BALLS_PER_OVER = 6      // Balls in one innings

module.exports = { BALL_TIMER_MS, BALLS_PER_OVER }
