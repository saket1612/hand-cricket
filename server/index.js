'use strict'

const path = require('path')
const express = require('express')
const { createServer } = require('http')
const { Server } = require('socket.io')
const gm = require('./gameManager')
const { BALL_TIMER_MS } = require('./config')

const app = express()
const httpServer = createServer(app)
const io = new Server(httpServer, {
  cors: { origin: '*' },
})

const PORT = process.env.PORT || 3001
const IS_PROD = process.env.NODE_ENV === 'production'

// ─── Serve React build in production ─────────────────────────────────────────
if (IS_PROD) {
  const distPath = path.join(__dirname, '..', 'client', 'dist')
  app.use(express.static(distPath))
}

// ─── Health check ─────────────────────────────────────────────────────────────
app.get('/health', (req, res) => {
  res.json({ status: 'ok' })
})

// ─── Per-room ball timers ─────────────────────────────────────────────────────
// Map<roomCode, TimeoutId>
const ballTimers = new Map()

// ─── Per-room play-again votes ────────────────────────────────────────────────
// Map<roomCode, Set<socketId>>
const playAgainVotes = new Map()

function clearBallTimer(roomCode) {
  if (ballTimers.has(roomCode)) {
    clearTimeout(ballTimers.get(roomCode))
    ballTimers.delete(roomCode)
  }
}

// ─── Emit ball_start to both players in a room ────────────────────────────────
function emitBallStart(roomCode) {
  const room = gm.getRoom(roomCode)
  if (!room) return

  const batsmanPlayer = room.players.find(p => p.id === room.batsman)
  const target = room.innings === 2 ? room.firstInningsScore : undefined

  io.to(roomCode).emit('ball_start', {
    ball:   room.ball,
    score:  batsmanPlayer.score,
    ...(target !== undefined && { target }),
  })

  // Start timer — duration from config
  clearBallTimer(roomCode)
  const timerId = setTimeout(() => {
    ballTimers.delete(roomCode)
    resolveBallAndAdvance(roomCode)
  }, BALL_TIMER_MS)
  ballTimers.set(roomCode, timerId)
}

// ─── Resolve ball, then decide what comes next ────────────────────────────────
function resolveBallAndAdvance(roomCode) {
  const result = gm.resolveBall(roomCode)
  if (!result) return

  io.to(roomCode).emit('ball_result', {
    batsmanPick: result.batsmanPick,
    bowlerPick:  result.bowlerPick,
    runs:        result.runs,
    isOut:       result.isOut,
    score:       result.score,
  })

  if (!result.inningsOver) {
    // Small delay so players can read the result, then next ball
    setTimeout(() => emitBallStart(roomCode), 2000)
    return
  }

  // Innings is over — wait 2s so clients can display the OUT screen first
  setTimeout(() => {
    const room = gm.getRoom(roomCode)
    if (!room) return

    if (room.innings === 1) {
      // End of first innings → swap and show innings break
      const swapped = gm.swapInnings(roomCode)
      const newBatsman = swapped.players.find(p => p.id === swapped.batsman)

      io.to(roomCode).emit('innings_switch', {
        firstScore:      result.score,
        newBatsman:      swapped.batsman,
        newBatsmanName:  newBatsman.name,
      })

      // Give players 3 seconds to read the innings-break screen, then start innings 2
      setTimeout(() => {
        const r = gm.getRoom(roomCode)
        if (r) r.status = 'playing'
        emitBallStart(roomCode)
      }, 3000)
    } else {
      // End of second innings → game over
      const gameResult = gm.checkGameOver(roomCode)

      io.to(roomCode).emit('game_over', {
        winner:     gameResult.winner,
        winnerName: gameResult.winnerName,
        scores:     gameResult.scores,
      })
    }
  }, 2000)
}

// ─── Socket.io events ────────────────────────────────────────────────────────
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id)

  // ── create_room ──────────────────────────────────────────────────────────
  socket.on('create_room', ({ name }) => {
    if (!name || typeof name !== 'string') return

    const trimmedName = name.trim().slice(0, 20)
    const { code } = gm.createRoom(socket.id, trimmedName)
    socket.join(code)
    socket.data.roomCode   = code
    socket.data.playerName = trimmedName

    socket.emit('room_created', { code })
    console.log(`Room ${code} created by ${trimmedName}`)
  })

  // ── join_room ────────────────────────────────────────────────────────────
  socket.on('join_room', ({ code, name }) => {
    if (!code || !name || typeof code !== 'string' || typeof name !== 'string') return

    const trimmedName = name.trim().slice(0, 20)
    const result = gm.joinRoom(code.toUpperCase(), socket.id, trimmedName)
    if (!result.ok) {
      socket.emit('game_error', { message: result.error })
      return
    }

    socket.join(code.toUpperCase())
    socket.data.roomCode   = code.toUpperCase()
    socket.data.playerName = trimmedName

    // Notify player 2 that they joined; tell player 1 their opponent arrived
    const room = result.room
    const p1   = room.players[0]
    const p2   = room.players[1]

    // Tell player 1 (already waiting) the opponent's name
    io.to(p1.id).emit('player_joined', { opponentName: p2.name })
    // Tell player 2 the opponent's name
    socket.emit('player_joined', { opponentName: p1.name })

    console.log(`${name} joined room ${code}`)

    // Kick off toss immediately
    const toss = gm.doToss(code.toUpperCase())
    io.to(code.toUpperCase()).emit('game_start', toss)

    // Short delay so clients can show the toss screen, then first ball
    setTimeout(() => emitBallStart(code.toUpperCase()), 2000)
  })

  // ── submit_pick ──────────────────────────────────────────────────────────
  socket.on('submit_pick', ({ number }) => {
    const roomCode = socket.data.roomCode
    if (!roomCode) return

    const result = gm.submitPick(roomCode, socket.id, number)
    if (!result) return

    // Both picked — let the 5-second timer fire naturally so the countdown
    // always runs to zero before showing the result.
  })

  // ── play_again ───────────────────────────────────────────────────────────
  socket.on('play_again', () => {
    const roomCode = socket.data.roomCode
    if (!roomCode) return

    const room = gm.getRoom(roomCode)
    if (!room || room.status !== 'finished') return

    if (!playAgainVotes.has(roomCode)) {
      playAgainVotes.set(roomCode, new Set())
    }
    const votes = playAgainVotes.get(roomCode)
    votes.add(socket.id)

    // Notify the other player that this player wants to play again
    socket.to(roomCode).emit('opponent_play_again')

    if (votes.size === 2) {
      // Both players ready — reset and restart
      playAgainVotes.delete(roomCode)
      gm.resetRoom(roomCode)
      const toss = gm.doToss(roomCode)
      io.to(roomCode).emit('game_start', toss)
      setTimeout(() => emitBallStart(roomCode), 2000)
    }
  })

  // ── disconnect ───────────────────────────────────────────────────────────
  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id)

    const roomCode = socket.data.roomCode
    if (!roomCode) return

    playAgainVotes.delete(roomCode)
    clearBallTimer(roomCode)

    const room = gm.getRoom(roomCode)
    if (!room) return

    // Find the other player
    const otherPlayer = room.players.find(p => p.id !== socket.id)

    // If game is finished (both on game_over / play_again screen),
    // only delete the room once BOTH have disconnected.
    if (room.status === 'finished') {
      if (!otherPlayer || !io.sockets.sockets.has(otherPlayer.id)) {
        gm.deleteRoom(roomCode)  // last one out — clean up
      }
      // Otherwise leave the room alive so the other player can still
      // click Play Again or close the tab themselves.
      return
    }

    // Game was in progress — only notify the other player if they are
    // genuinely still connected (guards against transport-upgrade ghosts).
    gm.deleteRoom(roomCode)
    if (otherPlayer && io.sockets.sockets.has(otherPlayer.id)) {
      io.to(otherPlayer.id).emit('game_error', { message: 'Opponent disconnected. Game ended.' })
    }
  })
})

// ─── Catch-all: serve React app for any non-API route (production only) ───────
if (IS_PROD) {
  const distIndex = path.join(__dirname, '..', 'client', 'dist', 'index.html')
  app.get('*', (_req, res) => res.sendFile(distIndex))
}

// ─── Start ────────────────────────────────────────────────────────────────────
httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})
