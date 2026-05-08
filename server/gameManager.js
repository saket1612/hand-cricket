'use strict'

// ─── In-memory store ──────────────────────────────────────────────────────────
/** @type {Map<string, object>} */
const rooms = new Map()

// Unambiguous characters: no 0/O, 1/I/l confusion
const CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'

// ─── Helpers ──────────────────────────────────────────────────────────────────
function generateCode() {
  let code = ''
  for (let i = 0; i < 6; i++) {
    code += CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)]
  }
  // Retry on the rare collision
  return rooms.has(code) ? generateCode() : code
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Create a new room for the first player.
 * @returns {{ code: string, room: object }}
 */
function createRoom(socketId, playerName) {
  const code = generateCode()
  const room = {
    code,
    players: [
      { id: socketId, name: playerName, score: 0 },
    ],
    batsman: null,
    bowler: null,
    ball: 1,
    innings: 1,
    firstInningsScore: null,
    picks: {},
    status: 'waiting',
    winner: null,
  }
  rooms.set(code, room)
  return { code, room }
}

/**
 * Join an existing room as the second player.
 * @returns {{ ok: true, room: object } | { ok: false, error: string }}
 */
function joinRoom(code, socketId, playerName) {
  const room = rooms.get(code)
  if (!room) return { ok: false, error: 'Room not found' }
  if (room.status !== 'waiting') return { ok: false, error: 'Room is full or game already started' }

  room.players.push({ id: socketId, name: playerName, score: 0 })
  room.status = 'toss'
  return { ok: true, room }
}

/**
 * Randomly assign batsman / bowler and move room to 'playing'.
 * @returns {{ batsman: string, bowler: string, batsmanName: string, bowlerName: string }}
 */
function doToss(roomCode) {
  const room = rooms.get(roomCode)
  if (!room) return null

  const first = Math.random() < 0.5 ? room.players[0] : room.players[1]
  const second = room.players.find(p => p.id !== first.id)

  room.batsman = first.id
  room.bowler = second.id
  room.status = 'playing'

  return {
    batsman: first.id,
    bowler: second.id,
    batsmanName: first.name,
    bowlerName: second.name,
  }
}

/**
 * Record a player's pick for the current ball.
 * Number 1-6 is a valid pick; 0 is reserved for timeout (server-side only).
 * @returns {{ bothPicked: boolean } | null}
 */
function submitPick(roomCode, socketId, number) {
  const room = rooms.get(roomCode)
  if (!room || room.status !== 'playing') return null

  const n = Number(number)
  if (!Number.isInteger(n) || n < 1 || n > 6) return null

  // Ignore duplicate submissions
  if (room.picks[socketId] !== undefined) return { bothPicked: false }

  room.picks[socketId] = n

  const bothPicked = room.players.every(p => room.picks[p.id] !== undefined)
  return { bothPicked }
}

/**
 * Resolve the current ball using whatever picks are stored (missing pick = 0 / timeout).
 * Advances ball counter; does NOT swap innings or end the game — caller handles that.
 *
 * @returns {{
 *   batsmanPick: number,
 *   bowlerPick: number,
 *   runs: number,
 *   isOut: boolean,
 *   score: number,        // batsman's updated total
 *   inningsOver: boolean, // true when OUT or all 6 balls done or target beaten
 *   targetBeaten: boolean,
 * }}
 */
function resolveBall(roomCode) {
  const room = rooms.get(roomCode)
  if (!room) return null

  const batsmanPick = room.picks[room.batsman] ?? 0
  const bowlerPick  = room.picks[room.bowler]  ?? 0

  let runs  = 0
  let isOut = false

  if (batsmanPick === 0 && bowlerPick === 0) {
    // Both timed out → 0 runs, not out
    runs  = 0
    isOut = false
  } else if (batsmanPick === bowlerPick) {
    // Same number → OUT
    runs  = 0
    isOut = true
  } else {
    // Different → batsman scores their number
    runs  = batsmanPick
    isOut = false
  }

  // Apply runs to batsman
  const batsmanPlayer = room.players.find(p => p.id === room.batsman)
  batsmanPlayer.score += runs

  const wasLastBall = room.ball === 6

  // Check if 2nd-innings target is beaten
  let targetBeaten = false
  if (room.innings === 2 && room.firstInningsScore !== null) {
    if (batsmanPlayer.score > room.firstInningsScore) {
      targetBeaten = true
    }
  }

  const inningsOver = isOut || wasLastBall || targetBeaten

  // Advance ball only if innings continues
  if (!inningsOver) {
    room.ball += 1
  }

  // Clear picks for next ball
  room.picks = {}

  return {
    batsmanPick,
    bowlerPick,
    runs,
    isOut,
    score: batsmanPlayer.score,
    inningsOver,
    targetBeaten,
  }
}

/**
 * Swap batsman ↔ bowler for the second innings.
 * Saves firstInningsScore, resets ball counter.
 * @returns {object} updated room
 */
function swapInnings(roomCode) {
  const room = rooms.get(roomCode)
  if (!room) return null

  const firstBatsman = room.players.find(p => p.id === room.batsman)
  room.firstInningsScore = firstBatsman.score

  // Swap roles
  const prevBatsman = room.batsman
  room.batsman = room.bowler
  room.bowler  = prevBatsman

  room.ball    = 1
  room.innings = 2
  room.picks   = {}
  room.status  = 'innings_break'   // socket layer moves it to 'playing' after the break

  return room
}

/**
 * Determine the winner at the end of the second innings.
 * Marks room as 'finished'.
 * @returns {{ winner: string|null, winnerName: string, scores: object }}
 */
function checkGameOver(roomCode) {
  const room = rooms.get(roomCode)
  if (!room) return null

  const innings2Batsman = room.players.find(p => p.id === room.batsman)
  const innings2Bowler  = room.players.find(p => p.id === room.bowler)

  let winnerId   = null
  let winnerName = 'Tie'

  if (innings2Batsman.score > room.firstInningsScore) {
    // Chaser beat the target
    winnerId   = innings2Batsman.id
    winnerName = innings2Batsman.name
  } else if (innings2Batsman.score < room.firstInningsScore) {
    // Defender held on
    winnerId   = innings2Bowler.id
    winnerName = innings2Bowler.name
  }
  // else: tie — winnerId stays null

  room.winner = winnerId
  room.status = 'finished'

  return {
    winner: winnerId,
    winnerName,
    scores: {
      [room.players[0].name]: room.players[0].score,
      [room.players[1].name]: room.players[1].score,
    },
  }
}

/**
 * Reset a finished room for a rematch — keeps the same players and code.
 * @returns {object} reset room
 */
function resetRoom(roomCode) {
  const room = rooms.get(roomCode)
  if (!room) return null

  room.players.forEach(p => { p.score = 0 })
  room.batsman          = null
  room.bowler           = null
  room.ball             = 1
  room.innings          = 1
  room.firstInningsScore = null
  room.picks            = {}
  room.status           = 'toss'
  room.winner           = null

  return room
}

/**
 * Get the current room state (read-only reference).
 * @returns {object|undefined}
 */
function getRoom(roomCode) {
  return rooms.get(roomCode)
}

/**
 * Remove a room from memory (call on disconnect / game over cleanup).
 */
function deleteRoom(roomCode) {
  rooms.delete(roomCode)
}

module.exports = {
  createRoom,
  joinRoom,
  doToss,
  resetRoom,
  submitPick,
  resolveBall,
  swapInnings,
  checkGameOver,
  getRoom,
  deleteRoom,
}
